# Performance Debugging Guide

This document explains how to enable and use the performance monitoring tools to investigate admin panel slowness.

## Quick Start

### 1. Enable Client-Side Performance Monitoring

Add this to `.env.local`:
```
NEXT_PUBLIC_ENABLE_PERF_MONITORING=true
```

Then restart the dev server and navigate between admin pages. Performance metrics will be logged to the browser console (grouped by route).

**What it shows:**
- Total navigation duration (ms)
- Number of resources loaded
- Resource breakdown by type (script, stylesheet, image, etc.)
- Total size of resources per type
- Top 5 slowest resources

### 2. Enable Server-Side Query Logging

Add this to `.env.local`:
```
ENABLE_QUERY_LOGGING=true
```

Restart the server. Prisma will now log any database queries that take longer than **100ms** to the server terminal.

**What it shows:**
- Model and operation name (e.g., `Product.findMany`)
- Query duration (ms)
- Where clause parameters (first 100 chars)

## Instructions for Debugging

### Scenario: Admin dashboard is slow to load

**Step 1: Enable client monitoring**
```
NEXT_PUBLIC_ENABLE_PERF_MONITORING=true
```

**Step 2: Open DevTools**
- Press `F12` in your browser
- Go to Console tab
- Look for messages starting with `[PERF]`

**Step 3: Check the breakdown**
- Note the total duration
- Look at "Slowest Resources" section
- Check which resource type takes the most time(fetch, script, etc.)

**Step 4: If API calls are slow, enable query logging**
```
ENABLE_QUERY_LOGGING=true
```

**Step 5: Restart server and check terminal**
- Look for `[SLOW_QUERY]` messages
- Note which queries are taking >100ms
- Identify the slowest one(s)

###Step 6: Optimize the slow query(s)
Based on the slow query, consider:
- Adding a database index (if filtering on a non-indexed column)
- Reducing the number of rows selected (add pagination/limits)
- Using `select` to fetch only needed fields instead of `*`
- Caching frequently-requested data

## Code Examples

### Option 1: Detailed Resource Timing (in Browser Console)

```javascript
// Paste this in console to see detailed timing for each resource
const resources = performance.getEntriesByType('resource');
resources.forEach(r => {
  const time = (r.startTime + r.duration).toFixed(2);
  console.log(`${r.name.split('/').pop()}: ${r.duration.toFixed(2)}ms (total: ${time}ms)`);
});
```

### Option 2: Check Network Waterfall

- In DevTools → Network tab
- Reload the admin page
- Look for:
  - Long bars (slow requests)
  - Gaps between requests (sequential loading)
  - Large file sizes (unoptimized assets)

### Option 3: Check Lighthouse

- In DevTools → Lighthouse tab
- Select "Performance" and "Mobile" (or Desktop)
- Generate report
- Focus on:
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - First Input Delay (FID)

## Common Slowness Patterns & Fixes

### Pattern 1: Many sequential API calls
**Symptom**: Network waterfall shows requests one-by-one
**Fix**: Batch API calls using `Promise.all()` or combine endpoints

### Pattern 2: Large unoptimized images
**Symptom**: Image files are >500KB
**Fix**: Use `next/image` with proper sizing, or compress images

### Pattern 3: Slow database queries
**Symptom**: `[SLOW_QUERY]` logs show queries >1000ms
**Fix**: Add indexes, use pagination, select only needed fields

### Pattern 4: Blocking JavaScript
**Symptom**: Console shows heavy script execution
**Fix**: Use `'use client'` sparingly, code-split large components

### Pattern 5: Repeated requests for same data
**Symptom**: Same API endpoint called multiple times on one page
**Fix**: Add client-side caching (React Query, SWR, or localStorage)

## Performance Targets

- **Admin page load**: <2s (FCP), <3s (LCP)
- **Admin tab switch**: <1s
- **API response**: <500ms
- **Database query**: <100ms

## Disabling Monitoring

To turn off monitoring, delete or comment out the environment variables:
```
# NEXT_PUBLIC_ENABLE_PERF_MONITORING=true
# ENABLE_QUERY_LOGGING=true
```

Restart the server for changes to take effect.

## Next Steps

After identifying the slowness:
1. Share the console output or screenshot of slow queries
2. Share the Lighthouse report JSON
3. Share any `[SLOW_QUERY]` logs from the server
4. I'll provide specific fix recommendations

---

**Monitoring enabled**: ✅
- Prisma query logging (>100ms queries)
- Client-side page navigation timing
- Resource waterfall breakdown
