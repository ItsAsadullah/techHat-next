/**
 * Generate self-signed SSL certificates for local HTTPS development.
 * This allows mobile devices to use getUserMedia (camera) over LAN.
 *
 * Usage: node scripts/generate-certs.js
 */
const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect LAN IP
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '192.168.0.131';
}

async function main() {
  const lanIp = getLanIp();
  console.log(`🌐 LAN IP detected: ${lanIp}`);

  const attrs = [{ name: 'commonName', value: 'TechHat Dev' }];
  const opts = {
    algorithm: 'sha256',
    days: 365,
    keySize: 2048,
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: lanIp },
        ],
      },
    ],
  };

  console.log('🔐 Generating self-signed certificate...');
  const pems = await selfsigned.generate(attrs, opts);

  const certDir = path.join(__dirname, '..', 'certificates');
  fs.mkdirSync(certDir, { recursive: true });
  fs.writeFileSync(path.join(certDir, 'key.pem'), pems.private);
  fs.writeFileSync(path.join(certDir, 'cert.pem'), pems.cert);

  console.log('✅ Certificates generated in /certificates/');
  console.log(`   Valid for: localhost, 127.0.0.1, ${lanIp}`);
  console.log('   Expires: 1 year from now');
  console.log('');
  console.log('💡 মোবাইলে "Not Secure" warning আসলে "Advanced" → "Proceed" চাপুন।');
}

main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
