'use client';

import { useEffect } from 'react';

export function BengaliNumberConverter() {
  useEffect(() => {
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Skip for password fields
        if (target.type === 'password') return;

        const bnToEnMap: Record<string, string> = {
          '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
          '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
        };

        const val = target.value;
        const hasBangla = /[০-৯]/.test(val);

        if (hasBangla) {
          const newVal = val.replace(/[০-৯]/g, (match) => bnToEnMap[match]);
          
          // Use native setter to trigger React's internal tracking
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(target),
            'value'
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(target, newVal);
            target.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }
    };

    // Use capture phase to intercept the event as early as possible
    document.addEventListener('input', handleInput, true);
    
    return () => {
      document.removeEventListener('input', handleInput, true);
    };
  }, []);

  return null;
}
