
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AttributeValue = {
  value: string;
  colorCode?: string;
};

async function main() {
  console.log('Seeding electronics attributes...');

  const attributes: Array<{
    name: string;
    slug: string;
    type: string;
    values: AttributeValue[];
  }> = [
    {
      name: 'Color',
      slug: 'color',
      type: 'color',
      values: [
        { value: 'Black', colorCode: '#000000' },
        { value: 'White', colorCode: '#FFFFFF' },
        { value: 'Silver', colorCode: '#C0C0C0' },
        { value: 'Gold', colorCode: '#FFD700' },
        { value: 'Space Gray', colorCode: '#4B4B4B' },
        { value: 'Midnight', colorCode: '#191970' },
        { value: 'Starlight', colorCode: '#F8F9EC' },
        { value: 'Blue', colorCode: '#0000FF' },
        { value: 'Red', colorCode: '#FF0000' },
        { value: 'Green', colorCode: '#008000' },
        { value: 'Purple', colorCode: '#800080' },
        { value: 'Rose Gold', colorCode: '#B76E79' },
        { value: 'Graphite', colorCode: '#41424C' },
        { value: 'Sierra Blue', colorCode: '#698FBF' },
        { value: 'Deep Purple', colorCode: '#49374F' },
        { value: 'Natural Titanium', colorCode: '#B8B3A9' },
        { value: 'Blue Titanium', colorCode: '#2F3642' },
      ]
    },
    {
      name: 'Storage',
      slug: 'storage',
      type: 'select',
      values: [
        { value: '32GB' },
        { value: '64GB' },
        { value: '128GB' },
        { value: '256GB' },
        { value: '512GB' },
        { value: '1TB' },
        { value: '2TB' },
        { value: '4TB' },
      ]
    },
    {
      name: 'RAM',
      slug: 'ram',
      type: 'select',
      values: [
        { value: '4GB' },
        { value: '6GB' },
        { value: '8GB' },
        { value: '12GB' },
        { value: '16GB' },
        { value: '24GB' },
        { value: '32GB' },
        { value: '64GB' },
        { value: '128GB' },
      ]
    },
    {
      name: 'Processor',
      slug: 'processor',
      type: 'select',
      values: [
        { value: 'Intel Core i3' },
        { value: 'Intel Core i5' },
        { value: 'Intel Core i7' },
        { value: 'Intel Core i9' },
        { value: 'Apple M1' },
        { value: 'Apple M2' },
        { value: 'Apple M3' },
        { value: 'Apple M4' },
        { value: 'Apple M1 Pro' },
        { value: 'Apple M1 Max' },
        { value: 'Apple M2 Pro' },
        { value: 'Apple M2 Max' },
        { value: 'Apple M3 Pro' },
        { value: 'Apple M3 Max' },
        { value: 'AMD Ryzen 5' },
        { value: 'AMD Ryzen 7' },
        { value: 'AMD Ryzen 9' },
        { value: 'Snapdragon 8 Gen 2' },
        { value: 'Snapdragon 8 Gen 3' },
      ]
    },
    {
      name: 'Screen Size',
      slug: 'screen-size',
      type: 'select',
      values: [
        { value: '6.1 inch' },
        { value: '6.7 inch' },
        { value: '11 inch' },
        { value: '12.9 inch' },
        { value: '13.3 inch' },
        { value: '13.6 inch' },
        { value: '14.2 inch' },
        { value: '15.3 inch' },
        { value: '15.6 inch' },
        { value: '16.2 inch' },
        { value: '24 inch' },
        { value: '27 inch' },
        { value: '32 inch' },
      ]
    },
    {
      name: 'Connectivity',
      slug: 'connectivity',
      type: 'select',
      values: [
        { value: 'WiFi Only' },
        { value: 'WiFi + Cellular' },
        { value: 'GPS' },
        { value: 'GPS + Cellular' },
        { value: 'Bluetooth' },
        { value: 'Wired' },
        { value: 'Wireless' },
      ]
    },
    {
      name: 'Operating System',
      slug: 'os',
      type: 'select',
      values: [
        { value: 'macOS' },
        { value: 'Windows 11' },
        { value: 'Windows 10' },
        { value: 'iOS' },
        { value: 'Android' },
        { value: 'iPadOS' },
        { value: 'Linux' },
      ]
    },
    {
      name: 'Condition',
      slug: 'condition',
      type: 'select',
      values: [
        { value: 'Brand New' },
        { value: 'Open Box' },
        { value: 'Refurbished' },
        { value: 'Used - Like New' },
        { value: 'Used - Good' },
      ]
    }
  ];

  for (const attr of attributes) {
    // Check if attribute exists
    const existingAttr = await prisma.attribute.findFirst({
      where: { name: attr.name }
    });

    let attributeId;

    if (existingAttr) {
      console.log(`Attribute '${attr.name}' already exists. Updating/Adding values...`);
      attributeId = existingAttr.id;
    } else {
      console.log(`Creating attribute '${attr.name}'...`);
      const newAttr = await prisma.attribute.create({
        data: {
          name: attr.name,
          slug: attr.slug,
          type: attr.type,
          isActive: true
        }
      });
      attributeId = newAttr.id;
    }

    // Add values
    for (const [index, val] of attr.values.entries()) {
      const existingVal = await prisma.attributeValue.findFirst({
        where: { 
          attributeId: attributeId,
          value: val.value
        }
      });

      if (!existingVal) {
        await prisma.attributeValue.create({
          data: {
            attributeId: attributeId,
            value: val.value,
            colorCode: val.colorCode || null,
            displayOrder: index,
            isActive: true
          }
        });
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
