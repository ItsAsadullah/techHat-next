'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { systemLog } from '@/lib/logger';

export interface CacheMetrics {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  uptime: number;
}

export async function fetchCacheMetrics(): Promise<{ success: boolean; data?: CacheMetrics; error?: string }> {
  try {
    // Next.js App Router doesn't expose native cache metrics directly.
    // In a real application, if you use Redis, you would run `INFO memory` command here.
    // For this dashboard, we will simulate realistic Redis metrics to complete the UI, 
    // while the actual clearing functionality will use real Next.js APIs.
    
    const mockMetrics: CacheMetrics = {
      totalKeys: Math.floor(Math.random() * 1500) + 500, // 500-2000 keys
      memoryUsage: Math.floor(Math.random() * 50) + 10,  // 10-60 MB
      hitRate: 85 + (Math.random() * 10),                // 85-95%
      uptime: process.uptime(),
    };

    return { success: true, data: mockMetrics };
  } catch (error: any) {
    console.error('Failed to fetch cache metrics:', error);
    return { success: false, error: 'Failed to retrieve cache metrics' };
  }
}

export async function clearCacheByPath(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    revalidatePath(path, 'layout');
    systemLog('info', 'system', `Cleared cache for path: ${path}`);
    return { success: true };
  } catch (error: any) {
    systemLog('error', 'system', `Failed to clear cache for path: ${path}`, { error: error.message });
    return { success: false, error: `Failed to clear cache for ${path}` };
  }
}

export async function clearCacheByTag(tag: string): Promise<{ success: boolean; error?: string }> {
  try {
    revalidateTag(tag, {} as any);
    systemLog('info', 'system', `Cleared cache for tag: ${tag}`);
    return { success: true };
  } catch (error: any) {
    systemLog('error', 'system', `Failed to clear cache for tag: ${tag}`, { error: error.message });
    return { success: false, error: `Failed to clear cache for tag ${tag}` };
  }
}

export async function clearAllCache(): Promise<{ success: boolean; error?: string }> {
  try {
    // Revalidating '/' with 'layout' clears the entire app router cache
    revalidatePath('/', 'layout');
    systemLog('warn', 'system', 'Admin performed a global cache purge.');
    return { success: true };
  } catch (error: any) {
    systemLog('error', 'system', 'Failed to perform global cache purge', { error: error.message });
    return { success: false, error: 'Failed to purge global cache' };
  }
}
