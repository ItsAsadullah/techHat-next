import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

interface CategorySeed {
  name: string;
  children?: CategorySeed[];
}

const electronicsCategories: CategorySeed[] = [
  {
    name: 'Computers & Laptops',
    children: [
      {
        name: 'Laptops',
        children: [
          { name: 'Business Laptops' },
          { name: 'Gaming Laptops' },
          { name: 'Ultrabooks' },
          { name: 'MacBooks' }
        ]
      },
      {
        name: 'Desktops',
        children: [
          { name: 'All-in-One PCs' },
          { name: 'Gaming Desktops' },
          { name: 'Mini PCs' },
          { name: 'Workstations' }
        ]
      },
      {
        name: 'PC Components',
        children: [
          { name: 'Processors (CPU)' },
          { name: 'Motherboards' },
          { name: 'RAM (Memory)' },
          { name: 'Storage (SSD/HDD)' },
          { name: 'Graphics Cards (GPU)' },
          { name: 'Power Supplies (PSU)' },
          { name: 'Casings' },
          { name: 'Cooling Systems' }
        ]
      },
      {
        name: 'Peripherals',
        children: [
          { name: 'Monitors' },
          { name: 'Keyboards' },
          { name: 'Mice' },
          { name: 'Printers & Scanners' },
          { name: 'Webcams' }
        ]
      }
    ]
  },
  {
    name: 'Smartphones & Tablets',
    children: [
      {
        name: 'Smartphones',
        children: [
          { name: 'iPhones' },
          { name: 'Android Phones' },
          { name: 'Feature Phones' }, // Button phones like Symphony, Walton, itel
          { name: 'Refurbished Phones' }
        ]
      },
      {
        name: 'Feature Phones', // Also adding as a main sub-category for visibility
        children: [
            { name: 'Nokia' },
            { name: 'Samsung' },
            { name: 'Symphony' },
            { name: 'Walton' },
            { name: 'Itel' },
            { name: 'Maximus' }
        ]
      },
      {
        name: 'Tablets',
        children: [
          { name: 'iPads' },
          { name: 'Android Tablets' },
          { name: 'Graphics Tablets' }
        ]
      },
      {
        name: 'Mobile Accessories',
        children: [
          { name: 'Cases & Covers' },
          { name: 'Screen Protectors' },
          { name: 'Power Banks' },
          { name: 'Chargers & Cables' },
          { name: 'Selfie Sticks & Tripods' }
        ]
      }
    ]
  },
  {
    name: 'Cameras & Drones',
    children: [
      { name: 'DSLR Cameras' },
      { name: 'Mirrorless Cameras' },
      { name: 'Action Cameras' },
      { name: 'Drones' },
      { name: 'Camera Lenses' },
      { name: 'Gimbals & Stabilizers' }
    ]
  },
  {
    name: 'Audio & Sound',
    children: [
      {
        name: 'Headphones',
        children: [
          { name: 'Over-Ear Headphones' },
          { name: 'In-Ear Earbuds' },
          { name: 'True Wireless (TWS)' },
          { name: 'Gaming Headsets' }
        ]
      },
      {
        name: 'Speakers',
        children: [
          { name: 'Bluetooth Speakers' },
          { name: 'Soundbars' },
          { name: 'Home Theater Systems' },
          { name: 'Smart Speakers' }
        ]
      },
      { name: 'Microphones' }
    ]
  },
  {
    name: 'Smart Home & IoT',
    children: [
      { name: 'Security Cameras' },
      { name: 'Smart Lighting' },
      { name: 'Smart Plugs & Switches' },
      { name: 'Smart Door Locks' },
      { name: 'Baby Monitors' }
    ]
  },
  {
    name: 'Gaming',
    children: [
      { name: 'PlayStation' },
      { name: 'Xbox' },
      { name: 'Nintendo Switch' },
      { name: 'Gaming Consoles' },
      { name: 'VR Headsets' },
      { name: 'Game Controllers' }
    ]
  },
  {
    name: 'Office Electronics',
    children: [
      { name: 'Projectors' },
      { name: 'Photocopiers' },
      { name: 'Label Printers' },
      { name: 'Paper Shredders' }
    ]
  },
  {
    name: 'Networking',
    children: [
      { name: 'Wi-Fi Routers' },
      { name: 'Mesh Wi-Fi Systems' },
      { name: 'Range Extenders' },
      { name: 'Network Switches' },
      { name: 'Access Points' }
    ]
  }
];

async function createCategoryRecursive(category: CategorySeed, parentId: string | null = null) {
  const slug = slugify(category.name, { lower: true, strict: true });
  
  // Check if exists to avoid duplicates
  let uniqueSlug = slug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  // Create category
  const created = await prisma.category.create({
    data: {
      name: category.name,
      slug: uniqueSlug,
      parentId: parentId,
      description: `Shop the best ${category.name} at TechHat.`
    }
  });

  console.log(`Created: ${category.name} (ID: ${created.id})`);

  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      await createCategoryRecursive(child, created.id);
    }
  }
}

async function main() {
  console.log('🌱 Seeding Electronics Categories...');
  
  // Clear existing categories to start fresh
  console.log('🗑️ Clearing old categories...');
  // We need to delete in order to respect foreign key constraints if any (children first)
  // But Prisma cascade delete usually handles this if configured, or we delete all.
  // Since we have self-relation, let's try deleteMany directly. 
  // If there are foreign key constraints with Products, this might fail if products exist.
  // Assuming this is a setup phase.
  try {
      await prisma.category.deleteMany({});
  } catch (e) {
      console.log('Warning: Could not delete all categories. Some might be linked to products.');
  }
  
  for (const rootCat of electronicsCategories) {
    await createCategoryRecursive(rootCat);
  }
  
  console.log('✨ Categories seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
