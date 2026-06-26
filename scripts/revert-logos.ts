import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Reverting logos from clearbit to gstatic...');
  
  const brands = await prisma.brand.findMany({
    where: {
      logo: {
        contains: 'logo.clearbit.com'
      }
    }
  });

  let updated = 0;
  for (const b of brands) {
    if (b.logo && b.logo.includes('logo.clearbit.com')) {
      const domain = b.logo.replace('https://logo.clearbit.com/', '');
      const newLogo = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;
      
      await prisma.brand.update({
        where: { id: b.id },
        data: { logo: newLogo }
      });
      updated++;
      console.log(`  ✅ Reverted: ${b.name}`);
    }
  }

  console.log(`\n🎉 Reverted ${updated} brands successfully.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
