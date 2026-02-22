
import { PrismaClient, ProductType, StockAction } from '@prisma/client';

const prisma = new PrismaClient();

const ADJECTIVES = ['Premium', 'Pro', 'Ultra', 'Max', 'Lite', 'Smart', 'Wireless', 'Gaming', 'Office', 'Home'];
const NOUNS = ['Headphones', 'Mouse', 'Keyboard', 'Monitor', 'Laptop', 'Speaker', 'Camera', 'Tablet', 'Watch', 'Phone'];
const BRANDS = ['TechHat', 'LogiTech', 'Razer', 'Dell', 'HP', 'Apple', 'Samsung', 'Sony'];
const CATEGORIES = ['Electronics', 'Computers', 'Accessories', 'Audio', 'Wearables'];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding products...');

  // 1. Ensure Categories exist
  const categories: any[] = [];
  for (const catName of CATEGORIES) {
    const slug = catName.toLowerCase();
    let cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: catName,
          slug,
          isActive: true,
        },
      });
      console.log(`Created category: ${cat.name}`);
    }
    categories.push(cat);
  }

  // 2. Ensure Brands exist
  const brands: any[] = [];
  for (const brandName of BRANDS) {
    const slug = brandName.toLowerCase();
    let brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: brandName,
          slug,
        },
      });
      console.log(`Created brand: ${brand.name}`);
    }
    brands.push(brand);
  }

  // 3. Create Products
  const productsToCreate = 20;
  
  for (let i = 0; i < productsToCreate; i++) {
    const brand = getRandomElement(brands);
    const category = getRandomElement(categories);
    const adj = getRandomElement(ADJECTIVES);
    const noun = getRandomElement(NOUNS);
    const randomSuffix = getRandomInt(100, 999);
    const name = `${brand.name} ${adj} ${noun} ${randomSuffix}`;
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + getRandomInt(1000, 9999);
    
    const price = getRandomInt(500, 50000);
    const costPrice = Math.floor(price * 0.7);
    const stock = getRandomInt(0, 100);
    
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        categoryId: category.id,
        brandId: brand.id,
        price,
        costPrice,
        stock,
        minStock: 5,
        sku: `SKU-${getRandomInt(10000, 99999)}`,
        description: `This is a high-quality ${name}. Perfect for your daily needs.`,
        shortDesc: `${adj} ${noun} by ${brand.name}`,
        isActive: true,
        type: ProductType.PHYSICAL,
        images: [`/placeholder-product-${getRandomInt(1, 5)}.jpg`], // Dummy images
      },
    });
    
    // Create Stock History for initial stock
    if (stock > 0) {
        await prisma.stockHistory.create({
            data: {
                productId: product.id,
                action: StockAction.ADD,
                quantity: stock,
                previousStock: 0,
                newStock: stock,
                reason: 'Initial Seed',
                source: 'System'
            }
        });
    }

    console.log(`Created product: ${product.name} (Stock: ${stock})`);
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
