const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app/admin/pos/pos-client.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/\s*Play a subtle sound effect \(optional\)\s*try\s*\{\s*const audio = new Audio\('\/sounds\/beep\.mp3'\);\s*audio\.volume = 0\.3;\s*audio\.play\(\)\.catch\(\(\) => \{\}\);\s*\}\s*catch\s*\{\}/s;

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

if (regex.test(content)) {
    content = content.replace(regex, newBeep);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed beep.mp3 successfully!');
} else {
    console.log('Regex still failed');
}
