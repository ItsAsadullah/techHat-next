import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string) {
  return text.toLowerCase()
             .replace(/[^\w\s-]/g, '')
             .replace(/[\s_-]+/g, '-')
             .replace(/^-+|-+$/g, '');
}

const brandsData = [
  { name: 'Apple', domain: 'apple.com' },
  { name: 'A4Tech', domain: 'a4tech.com' },
  { name: 'Logitech', domain: 'logitech.com' },
  { name: 'HP', domain: 'hp.com' },
  { name: 'Oraimo', domain: 'oraimo.com' },
  { name: 'Hoco', domain: 'hocotech.com' },
  { name: 'Baseus', domain: 'baseus.com' },
  { name: 'Neepho', domain: 'neepho.com' },
  { name: 'Symphony', domain: 'symphony-mobile.com' },
  { name: 'Itel', domain: 'itel-life.com' },
  { name: 'Bontel', domain: 'bontel.com' },
  { name: 'Xiaomi', domain: 'mi.com' },
  { name: 'Realme', domain: 'realme.com' },
  { name: 'Oppo', domain: 'oppo.com' },
  { name: 'OnePlus', domain: 'oneplus.com' },
  { name: 'Vivo', domain: 'vivo.com' },
  { name: 'Nothing', domain: 'nothing.tech' },
  { name: 'Infinix', domain: 'infinixmobility.com' },
  { name: 'Tecno', domain: 'tecno-mobile.com' },
  { name: 'Aptech', domain: 'aptech-worldwide.com' },
  { name: 'ADATA', domain: 'adata.com' },
  { name: 'TP-Link', domain: 'tp-link.com' },
  { name: 'Tenda', domain: 'tendacn.com' },
  { name: 'EZVIZ', domain: 'ezviz.com' },
  { name: 'Netis', domain: 'netis-systems.com' },
  { name: 'D-Link', domain: 'dlink.com' },
  { name: 'iMICE', domain: 'imice.com' },
];

async function main() {
  console.log('Deleting all existing brands to start fresh...');
  
  // First, detach any products from brands
  await prisma.product.updateMany({
    data: { brandId: null }
  });

  // Now delete all brands
  await prisma.brand.deleteMany({});
  console.log('All previous brands deleted.');

  console.log('Seeding popular electronics brands...');

  let created = 0;

  for (const b of brandsData) {
    const slug = slugify(b.name);
    // Use Google Favicon API
    const logoUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${b.domain}&size=128`;

    await prisma.brand.create({
      data: {
        name: b.name,
        slug,
        logo: logoUrl,
        isFeatured: true
      }
    });
    console.log(`Created Brand: ${b.name}`);
    created++;
  }

  console.log(`\nDone! Created ${created} brands freshly.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
