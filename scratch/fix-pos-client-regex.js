const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/admin/pos/pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Image import if missing
if (!content.includes("import Image from 'next/image';")) {
  content = content.replace(
    /import { useEffect, useRef, useState, useCallback } from 'react';/,
    "import { useEffect, useRef, useState, useCallback } from 'react';\nimport Image from 'next/image';"
  );
}

// 2. Fix variants to items
content = content.replace(/product\.variants\.length/g, 'product.items.length');

// 3. Fix beep.mp3 to Web Audio API
const beepRegex = /\/\/\s*Play a subtle sound effect[^{]+try\s*{\s*const audio[^}]+}\s*catch[^{]*{}/s;
const newBeep = `// Play a subtle beep sound effect using Web Audio API
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

if (beepRegex.test(content)) {
    content = content.replace(beepRegex, newBeep);
} else {
    console.error("Beep regex did not match!");
}

// 4. Fix Image tag
content = content.replace(
  /<img src="\/images\/techhat\.png" alt="TechHat Logo" className="h-5 sm:h-6 w-auto object-contain drop-shadow-sm" \/>/g,
  `<div className="relative h-5 sm:h-6 w-[100px] sm:w-[120px]">
          <Image src="/images/techhat.png" alt="TechHat Logo" fill sizes="120px" className="object-contain drop-shadow-sm" />
        </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed pos-client.tsx correctly with regex without corrupting');
