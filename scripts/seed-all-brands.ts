import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const brandsToSeed = [
  // ── Mobile ──────────────────────────────────────────────────────────
  { name: 'Apple', domain: 'apple.com', isFeatured: true },
  { name: 'Samsung', domain: 'samsung.com', isFeatured: true },
  { name: 'Xiaomi', domain: 'mi.com', isFeatured: true },
  { name: 'OnePlus', domain: 'oneplus.com', isFeatured: true },
  { name: 'Google', domain: 'google.com', isFeatured: true },
  { name: 'Huawei', domain: 'huawei.com' },
  { name: 'Oppo', domain: 'oppo.com' },
  { name: 'Vivo', domain: 'vivo.com' },
  { name: 'Realme', domain: 'realme.com' },
  { name: 'Motorola', domain: 'motorola.com' },
  { name: 'Nokia', domain: 'nokia.com' },
  { name: 'Sony', domain: 'sony.com', isFeatured: true },
  { name: 'Infinix', domain: 'infinixmobility.com' },
  { name: 'Tecno', domain: 'tecno-mobile.com' },
  { name: 'Symphony', domain: 'symphony-mobile.com' },
  { name: 'Walton', domain: 'waltonbd.com' },
  { name: 'Itel', domain: 'itel-life.com' },
  
  // ── Computers & Laptops ──────────────────────────────────────────────
  { name: 'Dell', domain: 'dell.com', isFeatured: true },
  { name: 'HP', domain: 'hp.com', isFeatured: true },
  { name: 'Lenovo', domain: 'lenovo.com', isFeatured: true },
  { name: 'ASUS', domain: 'asus.com', isFeatured: true },
  { name: 'Acer', domain: 'acer.com' },
  { name: 'Microsoft', domain: 'microsoft.com', isFeatured: true },
  { name: 'MSI', domain: 'msi.com' },
  { name: 'Gigabyte', domain: 'gigabyte.com' },

  // ── Electronics & Home Appliances ────────────────────────────────────
  { name: 'LG', domain: 'lg.com', isFeatured: true },
  { name: 'Panasonic', domain: 'panasonic.com' },
  { name: 'Philips', domain: 'philips.com' },
  { name: 'Toshiba', domain: 'toshiba.com' },
  { name: 'Sharp', domain: 'sharp.com' },
  { name: 'Hitachi', domain: 'hitachi.com' },
  { name: 'Bosch', domain: 'bosch.com' },
  { name: 'Whirlpool', domain: 'whirlpool.com' },
  { name: 'Haier', domain: 'haier.com' },
  { name: 'Vision', domain: 'vision.com.bd' },
  { name: 'Marcel', domain: 'marcelbd.com' },
  { name: 'Midea', domain: 'midea.com' },
  { name: 'Gree', domain: 'gree.com' },
  { name: 'Hisense', domain: 'hisense.com' },

  // ── Peripherals & Accessories ────────────────────────────────────────
  { name: 'Logitech', domain: 'logitech.com', isFeatured: true },
  { name: 'Razer', domain: 'razer.com', isFeatured: true },
  { name: 'Corsair', domain: 'corsair.com' },
  { name: 'SteelSeries', domain: 'steelseries.com' },
  { name: 'HyperX', domain: 'hyperx.com' },
  { name: 'Anker', domain: 'anker.com' },
  { name: 'Baseus', domain: 'baseus.com' },
  { name: 'Ugreen', domain: 'ugreen.com' },
  { name: 'A4Tech', domain: 'a4tech.com' },
  { name: 'Fantech', domain: 'fantechworld.com' },
  { name: 'Havit', domain: 'havit.hk' },
  { name: 'Rapoo', domain: 'rapoo.com' },
  { name: 'Redragon', domain: 'redragonzone.com' },
  { name: 'Thermaltake', domain: 'thermaltake.com' },
  
  // ── Networking ───────────────────────────────────────────────────────
  { name: 'TP-Link', domain: 'tp-link.com' },
  { name: 'D-Link', domain: 'dlink.com' },
  { name: 'Netgear', domain: 'netgear.com' },
  { name: 'Tenda', domain: 'tendacn.com' },
  { name: 'MikroTik', domain: 'mikrotik.com' },
  { name: 'Cisco', domain: 'cisco.com' },
  { name: 'Ubiquiti', domain: 'ui.com' },
  
  // ── Audio ────────────────────────────────────────────────────────────
  { name: 'JBL', domain: 'jbl.com', isFeatured: true },
  { name: 'Bose', domain: 'bose.com' },
  { name: 'Sennheiser', domain: 'sennheiser.com' },
  { name: 'Audio-Technica', domain: 'audio-technica.com' },
  { name: 'Edifier', domain: 'edifier.com' },
  { name: 'Skullcandy', domain: 'skullcandy.com' },
  { name: 'Beats', domain: 'beatsbydre.com' },
  { name: 'Marshall', domain: 'marshallheadphones.com' },

  // ── Storage ──────────────────────────────────────────────────────────
  { name: 'SanDisk', domain: 'sandisk.com' },
  { name: 'Kingston', domain: 'kingston.com' },
  { name: 'Western Digital', domain: 'westerndigital.com' },
  { name: 'Seagate', domain: 'seagate.com' },
  { name: 'Transcend', domain: 'transcend-info.com' },
  { name: 'ADATA', domain: 'adata.com' },
  { name: 'PNY', domain: 'pny.com' },
  { name: 'Crucial', domain: 'crucial.com' },
  
  // ── Photography & Drones ─────────────────────────────────────────────
  { name: 'Canon', domain: 'canon.com' },
  { name: 'Nikon', domain: 'nikon.com' },
  { name: 'Fujifilm', domain: 'fujifilm.com' },
  { name: 'Olympus', domain: 'getolympus.com' },
  { name: 'DJI', domain: 'dji.com' },
  { name: 'GoPro', domain: 'gopro.com' },
  { name: 'Insta360', domain: 'insta360.com' },

  // ── Other Local/User Brands ──────────────────────────────────────────
  { name: 'JoyKaly', domain: 'joykaly.com' },
  { name: 'Bontel', domain: 'bontel.com' },
  { name: 'Vega', domain: 'vega.com' },
  { name: 'Sanee', domain: 'sanee.com' },
  { name: 'JYSuper', domain: 'jysuper.com' },
];

async function main() {
  console.log(`🌱 Seeding ${brandsToSeed.length} electronics and tech brands with logos...`);

  let created = 0;
  let updated = 0;

  for (const b of brandsToSeed) {
    const slug = b.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const logoUrl = `https://logo.clearbit.com/${b.domain}`;
    
    // Check if brand exists
    const existing = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: slug },
          { name: { equals: b.name, mode: 'insensitive' } }
        ]
      }
    });

    if (existing) {
      await prisma.brand.update({
        where: { id: existing.id },
        data: {
          logo: existing.logo ? existing.logo : logoUrl, // Keep existing logo if present, else use clearbit
          isFeatured: b.isFeatured ?? existing.isFeatured,
        }
      });
      console.log(`  🔄 Updated Brand: ${b.name} (Logo appended)`);
      updated++;
    } else {
      await prisma.brand.create({
        data: {
          name: b.name,
          slug,
          logo: logoUrl,
          isFeatured: b.isFeatured ?? false,
        }
      });
      console.log(`  ✅ Created Brand: ${b.name}`);
      created++;
    }
  }

  console.log(`\n🎉 Brand Seeding Complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total Brands Processed: ${brandsToSeed.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
