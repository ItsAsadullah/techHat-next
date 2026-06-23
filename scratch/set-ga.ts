import { prisma } from '../lib/prisma';

async function main() {
  const res = await prisma.setting.upsert({
    where: { key: 'googleAnalyticsId' },
    update: { value: 'G-NND2LMEVWF', category: 'analytics' },
    create: { key: 'googleAnalyticsId', value: 'G-NND2LMEVWF', category: 'analytics' }
  });
  console.log('Setup result:', res);
}
main().catch(console.error);
