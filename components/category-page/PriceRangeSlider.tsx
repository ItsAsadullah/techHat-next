'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  step?: number;
  formatValue?: (v: number) => string;
}

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 500,
  formatValue = (v) => `৳${v.toLocaleString()}`,
}: Props) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const handleMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), localMax - step);
    setLocalMin(v);
  };

  const handleMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), localMin + step);
    setLocalMax(v);
  };

  const commit = () => {
    if (localMin !== value[0] || localMax !== value[1]) {
      onChange([localMin, localMax]);
    }
  };

  return (
    <div className="space-y-4 px-1">
      {/* Track */}
      <div ref={rangeRef} className="relative h-1.5 rounded-full bg-muted mt-6">
        {/* Active range */}
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{
            left: `${pct(localMin)}%`,
            right: `${100 - pct(localMax)}%`,
          }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMin}
          onMouseUp={commit}
          onTouchEnd={commit}
          className={cn(
            'absolute w-full h-full appearance-none bg-transparent cursor-pointer',
            'range-thumb-style'
          )}
          style={{ zIndex: localMin > max - (max - min) / 10 ? 5 : 3 }}
          aria-label="Minimum price"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMax}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="absolute w-full h-full appearance-none bg-transparent cursor-pointer range-thumb-style"
          style={{ zIndex: 4 }}
          aria-label="Maximum price"
        />
      </div>

      {/* Value labels */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">Min</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
            <input
              type="number"
              value={localMin}
              min={min}
              max={localMax - step}
              step={step}
              onChange={(e) => setLocalMin(Math.max(min, Math.min(Number(e.target.value), localMax - step)))}
              onBlur={commit}
              className="w-full text-xs border rounded-md pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">Max</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">৳</span>
            <input
              type="number"
              value={localMax}
              min={localMin + step}
              max={max}
              step={step}
              onChange={(e) => setLocalMax(Math.min(max, Math.max(Number(e.target.value), localMin + step)))}
              onBlur={commit}
              className="w-full text-xs border rounded-md pl-6 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
