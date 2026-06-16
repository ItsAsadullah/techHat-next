const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/admin/pos/pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Image import
if (!content.includes("import Image from 'next/image';")) {
  content = content.replace(
    /import { useEffect, useRef, useState, useCallback } from 'react';/,
    "import { useEffect, useRef, useState, useCallback } from 'react';\nimport Image from 'next/image';"
  );
}

// 2. Fix variants to items
content = content.replace(/product\.variants\.length/g, 'product.items.length');

// 3. Fix beep.mp3 to Web Audio API
const oldBeep = `      // Play a subtle sound effect (optional)
      try {
        const audio = new Audio('/sounds/beep.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {}`;

const newBeep = `      // Play a subtle beep sound effect using Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      } catch (e) {}`;

content = content.replace(oldBeep, newBeep);

// 4. Fix Image tag
const oldImg = `<img src="/images/techhat.png" alt="TechHat Logo" className="h-5 sm:h-6 w-auto object-contain drop-shadow-sm" />`;
const newImg = `<div className="relative h-5 sm:h-6 w-[100px] sm:w-[120px]">
          <Image src="/images/techhat.png" alt="TechHat Logo" fill sizes="120px" className="object-contain drop-shadow-sm" />
        </div>`;

content = content.replace(oldImg, newImg);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed pos-client.tsx correctly without corrupting');
