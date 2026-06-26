'use server';

import fs from 'fs';
import path from 'path';
import { systemLog } from '@/lib/logger';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'beta' | 'experiment' | 'system';
  rolloutPercentage?: number;
}

// Initial default flags if the config file doesn't exist
const DEFAULT_FLAGS: FeatureFlag[] = [
  {
    id: 'new-dashboard-ui',
    name: 'New Dashboard UI',
    description: 'Enables the redesigned analytics dashboard for the admin homepage.',
    enabled: false,
    type: 'beta',
    rolloutPercentage: 100,
  },
  {
    id: 'ai-auto-tagging',
    name: 'AI Auto-Tagging',
    description: 'Automatically tags products using AI during creation.',
    enabled: true,
    type: 'experiment',
  },
  {
    id: 'advanced-caching',
    name: 'Advanced Redis Caching',
    description: 'Uses Redis for advanced query caching (Requires Redis to be configured).',
    enabled: false,
    type: 'system',
  },
  {
    id: 'multi-currency',
    name: 'Multi-Currency Support',
    description: 'Allow customers to view prices and checkout in multiple currencies.',
    enabled: false,
    type: 'beta',
    rolloutPercentage: 50,
  }
];

const configDir = path.join(process.cwd(), 'config');
const configFilePath = path.join(configDir, 'feature-flags.json');

// Ensure config directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Ensure the JSON file exists
if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, JSON.stringify(DEFAULT_FLAGS, null, 2), 'utf8');
}

export async function fetchFeatureFlags(): Promise<{ success: boolean; data?: FeatureFlag[]; error?: string }> {
  try {
    const fileContent = fs.readFileSync(configFilePath, 'utf8');
    const flags: FeatureFlag[] = JSON.parse(fileContent);
    return { success: true, data: flags };
  } catch (error: any) {
    console.error('Failed to read feature flags:', error);
    systemLog('error', 'system', 'Failed to read feature flags config', { error: error.message });
    return { success: false, error: 'Failed to load feature flags' };
  }
}

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const fileContent = fs.readFileSync(configFilePath, 'utf8');
    const flags: FeatureFlag[] = JSON.parse(fileContent);
    
    const flagIndex = flags.findIndex(f => f.id === id);
    if (flagIndex === -1) {
      return { success: false, error: 'Flag not found' };
    }

    flags[flagIndex].enabled = enabled;

    fs.writeFileSync(configFilePath, JSON.stringify(flags, null, 2), 'utf8');
    
    systemLog('info', 'system', `Feature flag '${id}' was ${enabled ? 'enabled' : 'disabled'}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle feature flag:', error);
    return { success: false, error: 'Failed to update feature flag' };
  }
}

export async function updateFeatureFlagRollout(id: string, percentage: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (percentage < 0 || percentage > 100) {
      return { success: false, error: 'Percentage must be between 0 and 100' };
    }

    const fileContent = fs.readFileSync(configFilePath, 'utf8');
    const flags: FeatureFlag[] = JSON.parse(fileContent);
    
    const flagIndex = flags.findIndex(f => f.id === id);
    if (flagIndex === -1) {
      return { success: false, error: 'Flag not found' };
    }

    flags[flagIndex].rolloutPercentage = percentage;

    fs.writeFileSync(configFilePath, JSON.stringify(flags, null, 2), 'utf8');
    
    systemLog('info', 'system', `Feature flag '${id}' rollout updated to ${percentage}%`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update feature flag rollout' };
  }
}
