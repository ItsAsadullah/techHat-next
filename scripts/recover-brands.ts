import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Recreating Brands based on existing Products...');

  const products = await prisma.product.findMany({ select: { id: true, name: true, slug: true } });
  
  const brandNames = new Set<string>();
  
  // Custom brand names that might be multiple words
  const KNOWN_BRANDS = ['Apple', 'Samsung', 'Sony', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Logitech', 'Razer', 'Xiaomi', 'OnePlus', 'JBL', 'TP-Link', 'Nikon', 'Canon', 'Anker', 'Symphony', 'JoyKaly', 'Bontel', 'Tenda', 'A4Tech', 'Vega', 'Sanee', 'JYSuper', 'Marcel'];

  for (const p of products) {
    let extractedBrand = '';
    
    for (const kb of KNOWN_BRANDS) {
      if (p.name.toLowerCase().startsWith(kb.toLowerCase())) {
        extractedBrand = kb;
        break;
      }
    }
    
    if (!extractedBrand) {
      // Just take the first word
      extractedBrand = p.name.split(' ')[0];
    }
    
    brandNames.add(extractedBrand);
  }

  console.log('Brands to recreate:', Array.from(brandNames));

  const brandMap: Record<string, string> = {};

  for (const brandName of brandNames) {
    const slug = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: brandName, slug, isFeatured: false },
      });
      console.log(`  ✅ Recreated Brand: ${brandName}`);
    }
    brandMap[slug] = brand.id;
  }

  let updated = 0;
  for (const p of products) {
    let extractedBrand = '';
    for (const kb of KNOWN_BRANDS) {
      if (p.name.toLowerCase().startsWith(kb.toLowerCase())) {
        extractedBrand = kb;
        break;
      }
    }
    if (!extractedBrand) {
      extractedBrand = p.name.split(' ')[0];
    }
    
    const slug = extractedBrand.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const brandId = brandMap[slug];
    
    if (brandId) {
      await prisma.product.update({
        where: { id: p.id },
        data: { brandId }
      });
      updated++;
    }
  }
  
  console.log(`\n🎉 Reassigned ${updated} products to their respective brands.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
