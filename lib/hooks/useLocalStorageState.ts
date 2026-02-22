'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useState এর মতোই কাজ করে, কিন্তু value localStorage এ save থাকে।
 * পরের বার page/component load হলে আগের value restore হয়।
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private mode etc)
    }
  }, [key, state]);

  return [state, setState];
}
