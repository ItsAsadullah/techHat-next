'use server';

import fs from 'fs';
import path from 'path';
import readline from 'readline';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'access' | 'database' | 'system' | 'auth';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
}

const logDir = path.join(process.cwd(), 'logs');

export async function fetchSystemLogs(
  options: {
    category?: LogCategory | 'all';
    level?: LogLevel | 'all';
    search?: string;
    limit?: number;
  } = {}
): Promise<{ success: boolean; data?: LogEntry[]; error?: string }> {
  try {
    const { category = 'all', level = 'all', search = '', limit = 100 } = options;
    const q = search.trim().toLowerCase();
    
    if (!fs.existsSync(logDir)) {
      return { success: true, data: [] };
    }

    // Get all log files, sorted by newest first
    const files = fs.readdirSync(logDir)
      .filter(f => f.startsWith('app-') && f.endsWith('.log'))
      .sort((a, b) => b.localeCompare(a)); // Reverse alphabetical effectively sorts by date YYYY-MM-DD

    const logs: LogEntry[] = [];

    // Read files until we reach the limit
    for (const file of files) {
      if (logs.length >= limit) break;
      
      const filePath = path.join(logDir, file);
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      const fileLogs: LogEntry[] = [];

      for await (const line of rl) {
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          
          // Map Winston format to our UI LogEntry format
          const logEntry: LogEntry = {
            id: parsed.id || `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: parsed.timestamp,
            level: parsed.level as LogLevel,
            category: (parsed.category as LogCategory) || 'system',
            message: parsed.message,
            metadata: (() => {
              const { level, message, timestamp, category, id, ...rest } = parsed;
              return Object.keys(rest).length > 0 ? rest : undefined;
            })()
          };

          fileLogs.push(logEntry);
        } catch (e) {
          // Ignore unparseable lines
        }
      }
      
      // The file was read top-to-bottom (oldest to newest for that day)
      // So we reverse it to get newest first before appending
      fileLogs.reverse();

      // Filter the file logs
      for (const l of fileLogs) {
        if (logs.length >= limit) break;
        if (category !== 'all' && l.category !== category) continue;
        if (level !== 'all' && l.level !== level) continue;
        
        if (q) {
          const matchMessage = l.message.toLowerCase().includes(q);
          const matchMetadata = l.metadata ? JSON.stringify(l.metadata).toLowerCase().includes(q) : false;
          if (!matchMessage && !matchMetadata) continue;
        }

        logs.push(l);
      }
    }

    return { success: true, data: logs };
  } catch (error: any) {
    console.error('Failed to fetch system logs:', error);
    return { success: false, error: 'Failed to retrieve system logs' };
  }
}

export async function clearSystemLogs(): Promise<{ success: boolean; error?: string }> {
  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        if (file.endsWith('.log') || file.endsWith('.gz')) {
          fs.unlinkSync(path.join(logDir, file));
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to clear logs:', error);
    return { success: false, error: 'Failed to clear system logs' };
  }
}
