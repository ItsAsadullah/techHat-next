import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const { combine, timestamp, printf, json } = winston.format;

// Format for console (readable)
const consoleFormat = printf(({ level, message, timestamp, category, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  if (category) msg += ` [${category}]`;
  msg += `: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Configure daily rotating transport
const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(
    timestamp(),
    json()
  )
});

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    dailyRotateTransport
  ],
});

// Add console output in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      winston.format.colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    )
  }));
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogCategory = 'access' | 'database' | 'system' | 'auth';

/**
 * Helper to log with specific category and structure that matches our UI
 */
export const systemLog = (
  level: LogLevel, 
  category: LogCategory, 
  message: string, 
  metadata?: Record<string, any>
) => {
  const logData: Record<string, any> = {
    category,
    ...metadata,
  };
  
  // Also append a unique ID to each log for the UI to key on
  logData.id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  logger.log(level, message, logData);
};
