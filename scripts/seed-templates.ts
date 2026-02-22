import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Smartphone Specs',
    keys: ['Brand', 'Model', 'Processor', 'RAM', 'Storage', 'Display', 'Battery', 'Camera', 'Operating System', 'SIM Type', 'Network', 'Weight']
  },
  {
    name: 'Laptop Specs',
    keys: ['Brand', 'Model', 'Processor', 'RAM', 'Storage Type', 'Storage Capacity', 'Display Size', 'Display Resolution', 'Graphics Card', 'Operating System', 'Battery Life', 'Weight', 'Ports']
  },
  {
    name: 'Headphone Specs',
    keys: ['Brand', 'Model', 'Type', 'Driver Size', 'Frequency Response', 'Impedance', 'Connectivity', 'Battery Life', 'Noise Cancellation', 'Microphone', 'Weight']
  },
  {
    name: 'Smartwatch Specs',
    keys: ['Brand', 'Model', 'Display Type', 'Display Size', 'Processor', 'RAM', 'Storage', 'Battery Life', 'Water Resistance', 'Sensors', 'Connectivity', 'Compatibility']
  },
  {
    name: 'Tablet Specs',
    keys: ['Brand', 'Model', 'Display Size', 'Display Resolution', 'Processor', 'RAM', 'Storage', 'Battery', 'Camera', 'Operating System', 'Connectivity', 'Weight']
  },
  {
    name: 'Camera Specs',
    keys: ['Brand', 'Model', 'Sensor Type', 'Sensor Size', 'Resolution', 'ISO Range', 'Shutter Speed', 'Video Resolution', 'Lens Mount', 'Screen Size', 'Connectivity', 'Weight']
  },
  {
    name: 'TV Specs',
    keys: ['Brand', 'Model', 'Screen Size', 'Resolution', 'Display Technology', 'Smart Features', 'Audio Output', 'HDMI Ports', 'USB Ports', 'Power Consumption']
  },
  {
    name: 'Monitor Specs',
    keys: ['Brand', 'Model', 'Screen Size', 'Resolution', 'Refresh Rate', 'Panel Type', 'Response Time', 'Aspect Ratio', 'Connectivity', 'VESA Mount']
  },
  {
    name: 'Power Bank Specs',
    keys: ['Brand', 'Model', 'Capacity', 'Battery Type', 'Input Interface', 'Output Interface', 'Fast Charging', 'Dimensions', 'Weight']
  },
  {
    name: 'Speaker Specs',
    keys: ['Brand', 'Model', 'Output Power', 'Connectivity', 'Bluetooth Version', 'Battery Life', 'Water Resistance', 'Dimensions', 'Weight']
  }
];

async function main() {
  console.log('🌱 Seeding SavedSpecTemplate...');

  for (const t of templates) {
    const existing = await prisma.savedSpecTemplate.findUnique({
      where: { name: t.name }
    });

    if (!existing) {
      await prisma.savedSpecTemplate.create({
        data: {
          name: t.name,
          keys: t.keys
        }
      });
      console.log(`✅ Created template: ${t.name}`);
    } else {
      console.log(`ℹ️ Template already exists: ${t.name}`);
    }
  }
  
  console.log('✨ Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
