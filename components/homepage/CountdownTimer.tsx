'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  onExpired?: () => void;
}

export default function CountdownTimer({ targetDate, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        onExpired?.();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  if (expired) return <span className="text-sm text-red-500 font-medium">Sale Ended</span>;

  const blocks = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center">
            <span className="block w-11 sm:w-14 h-10 sm:h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold tabular-nums">
              {String(b.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 mt-1 font-medium">{b.label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-gray-400 font-bold text-lg mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
