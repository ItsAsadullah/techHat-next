/**
 * Performance Monitor Hook
 * Track admin page load times and generate timing reports
 * 
 * Usage: Call this hook in your admin layout or page to enable monitoring
 * Set ENABLE_PERF_MONITORING=true in .env.local to activate
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PerformanceMetrics {
  pathname: string;
  navigationStart: number;
  navigationEnd: number;
  duration: number;
  resourceTiming: PerformanceResourceTiming[];
}

export function usePerformanceMonitor() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>('');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PERF_MONITORING !== 'true') return;

    // If pathname changed, it's a navigation
    if (pathname !== prevPathnameRef.current) {
      const navigationStart = performance.now();
      prevPathnameRef.current = pathname;

      // Log when navigation completes (wait for next tick)
      const handleLoad = () => {
        const navigationEnd = performance.now();
        const duration = navigationEnd - navigationStart;

        // Get resource timing data for this page
        const resources = performance.getEntriesByType('resource');
        const pageResources = resources.filter(r => 
          typeof r.name === 'string' && !r.name.includes('chrome-extension')
        );

        const metrics: PerformanceMetrics = {
          pathname,
          navigationStart,
          navigationEnd,
          duration,
          resourceTiming: pageResources as PerformanceResourceTiming[],
        };

        // Log to console in a structured format
        console.group(`[PERF] Admin Navigation -> ${pathname}`);
        console.log(`⏱️  Total Duration: ${duration.toFixed(2)}ms`);
        console.log(`📊 Resources Loaded: ${pageResources.length}`);
        
        // Group resources by type and size
        const resourcesByType = pageResources.reduce((acc, r) => {
          const type = r.initiatorType || 'unknown';
          if (!acc[type]) acc[type] = [];
          acc[type].push(r);
          return acc;
        }, {} as Record<string, PerformanceResourceTiming[]>);

        Object.entries(resourcesByType).forEach(([type, items]) => {
          const totalSize = items.reduce((sum, r) => sum + (r.transferSize || 0), 0);
          const totalDuration = items.reduce((sum, r) => sum + (r.duration || 0), 0);
          console.log(`  ${type}: ${items.length} items, ${(totalSize / 1024).toFixed(2)}KB, ${totalDuration.toFixed(2)}ms`);
        });

        // Find slowest resources
        const slowest = pageResources
          .sort((a, b) => (b.duration || 0) - (a.duration || 0))
          .slice(0, 5);
        
        if (slowest.length > 0) {
          console.group('🐌 Slowest Resources:');
          slowest.forEach(r => {
            const name = r.name.split('/').pop();
            console.log(`  ${name || r.name}: ${(r.duration || 0).toFixed(2)}ms`);
          });
          console.groupEnd();
        }

        console.groupEnd();

        // Store metrics if you want to send them to an analytics service
        if (typeof window !== 'undefined' && window.__PERF_METRICS) {
          window.__PERF_METRICS.push(metrics);
        }
      };

      // Use requestIdleCallback if available, otherwise use setTimeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(handleLoad, { timeout: 5000 });
      } else {
        setTimeout(handleLoad, 100);
      }
    }
  }, [pathname]);
}

// Extend window object to store metrics
declare global {
  interface Window {
    __PERF_METRICS?: PerformanceMetrics[];
  }
}

export default usePerformanceMonitor;
