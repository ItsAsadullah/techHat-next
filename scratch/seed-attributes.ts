import { PrismaClient, AttributeDataType, AttributeUIType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Global Attributes...');

  // 1. COLOR
  const colorAttr = await prisma.attribute.upsert({
    where: { slug: 'color' },
    update: {},
    create: {
      name: 'Color',
      slug: 'color',
      description: 'Product color options',
      dataType: 'COLOR',
      uiType: 'COLOR_SWATCH',
      isVariant: true,
      isFilterable: true,
      isSearchable: true,
      values: {
        create: [
          { label: 'Black', value: 'black', shortCode: 'BLK', colorCode: '#000000', displayOrder: 1 },
          { label: 'White', value: 'white', shortCode: 'WHT', colorCode: '#ffffff', displayOrder: 2 },
          { label: 'Blue', value: 'blue', shortCode: 'BLU', colorCode: '#0000ff', displayOrder: 3 },
          { label: 'Red', value: 'red', shortCode: 'RED', colorCode: '#ff0000', displayOrder: 4 },
          { label: 'Green', value: 'green', shortCode: 'GRN', colorCode: '#008000', displayOrder: 5 },
        ]
      }
    }
  });

  // 2. RAM
  const ramAttr = await prisma.attribute.upsert({
    where: { slug: 'ram' },
    update: {},
    create: {
      name: 'RAM',
      slug: 'ram',
      description: 'Random Access Memory',
      dataType: 'TEXT',
      uiType: 'BUTTON_SELECTOR',
      isVariant: true,
      isFilterable: true,
      isSearchable: true,
      values: {
        create: [
          { label: '4GB', value: '4gb', shortCode: '4', displayOrder: 1 },
          { label: '8GB', value: '8gb', shortCode: '8', displayOrder: 2 },
          { label: '16GB', value: '16gb', shortCode: '16', displayOrder: 3 },
          { label: '32GB', value: '32gb', shortCode: '32', displayOrder: 4 },
        ]
      }
    }
  });

  // 3. Storage
  const storageAttr = await prisma.attribute.upsert({
    where: { slug: 'storage' },
    update: {},
    create: {
      name: 'Storage',
      slug: 'storage',
      description: 'Internal Storage Capacity',
      dataType: 'TEXT',
      uiType: 'BUTTON_SELECTOR',
      isVariant: true,
      isFilterable: true,
      isSearchable: true,
      values: {
        create: [
          { label: '64GB', value: '64gb', shortCode: '64', displayOrder: 1 },
          { label: '128GB', value: '128gb', shortCode: '128', displayOrder: 2 },
          { label: '256GB', value: '256gb', shortCode: '256', displayOrder: 3 },
          { label: '512GB', value: '512gb', shortCode: '512', displayOrder: 4 },
          { label: '1TB', value: '1tb', shortCode: '1T', displayOrder: 5 },
        ]
      }
    }
  });

  // 4. Processor
  const processorAttr = await prisma.attribute.upsert({
    where: { slug: 'processor' },
    update: {},
    create: {
      name: 'Processor',
      slug: 'processor',
      dataType: 'TEXT',
      uiType: 'DROPDOWN',
      isVariant: false,
      isFilterable: true,
      isSearchable: true,
      values: {
        create: [
          { label: 'Apple M1', value: 'apple-m1', displayOrder: 1 },
          { label: 'Apple M2', value: 'apple-m2', displayOrder: 2 },
          { label: 'Apple M3', value: 'apple-m3', displayOrder: 3 },
          { label: 'Intel Core i5', value: 'intel-core-i5', displayOrder: 4 },
          { label: 'Intel Core i7', value: 'intel-core-i7', displayOrder: 5 },
          { label: 'Intel Core i9', value: 'intel-core-i9', displayOrder: 6 },
          { label: 'AMD Ryzen 5', value: 'amd-ryzen-5', displayOrder: 7 },
          { label: 'AMD Ryzen 7', value: 'amd-ryzen-7', displayOrder: 8 },
        ]
      }
    }
  });

  // 5. Size
  const sizeAttr = await prisma.attribute.upsert({
    where: { slug: 'size' },
    update: {},
    create: {
      name: 'Size',
      slug: 'size',
      description: 'Physical Dimensions / Screen Size',
      dataType: 'TEXT',
      uiType: 'BUTTON_SELECTOR',
      isVariant: true,
      isFilterable: true,
      isSearchable: true,
      values: {
        create: [
          { label: 'Small', value: 'small', shortCode: 'S', displayOrder: 1 },
          { label: 'Medium', value: 'medium', shortCode: 'M', displayOrder: 2 },
          { label: 'Large', value: 'large', shortCode: 'L', displayOrder: 3 },
          { label: '13-inch', value: '13-inch', shortCode: '13', displayOrder: 4 },
          { label: '15-inch', value: '15-inch', shortCode: '15', displayOrder: 5 },
        ]
      }
    }
  });

  console.log('Successfully seeded core attributes!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
