import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding spec templates...');

  const templates: Record<string, string[]> = {
    'Mobile': [
      'Processor', 'RAM', 'Storage', 'Display', 'Battery', 'Camera', 'Front Camera', 'OS', 'SIM Type', 'Sensors'
    ],
    'Laptop': [
      'Processor', 'RAM', 'Storage', 'Graphics', 'Display', 'Battery', 'Weight', 'OS', 'Ports', 'Keyboard'
    ],
    'Smartwatch': [
      'Display', 'Battery Life', 'Water Resistance', 'Sensors', 'Strap Material', 'Connectivity', 'Compatibility', 'Health Features'
    ],
    'Headphone': [
      'Type', 'Connectivity', 'Battery Life', 'Noise Cancellation', 'Driver Size', 'Microphone', 'Frequency Response', 'Charging Interface'
    ],
    'Earbuds': [
      'Type', 'Connectivity', 'Battery Life (Buds)', 'Battery Life (Case)', 'Noise Cancellation', 'Water Resistance', 'Touch Controls', 'Microphone'
    ],
    'Tablet': [
      'Processor', 'RAM', 'Storage', 'Display', 'Battery', 'Camera', 'OS', 'Stylus Support', 'Connectivity'
    ],
    'Monitor': [
      'Screen Size', 'Resolution', 'Refresh Rate', 'Panel Type', 'Response Time', 'Brightness', 'Ports', 'Aspect Ratio', 'Stand'
    ],
    'Camera': [
      'Sensor Type', 'Megapixels', 'Video Resolution', 'ISO Range', 'Lens Mount', 'Screen', 'Battery', 'Connectivity', 'Storage Media'
    ],
    'Speaker': [
      'Output Power', 'Connectivity', 'Battery Life', 'Water Resistance', 'Dimensions', 'Weight', 'Frequency Response', 'Bluetooth Version'
    ],
    'Power Bank': [
      'Capacity', 'Output Ports', 'Input Ports', 'Fast Charging', 'Dimensions', 'Weight', 'Battery Type'
    ],
    'Keyboard': [
      'Type', 'Switch Type', 'Connectivity', 'Backlight', 'Layout', 'Battery Life', 'Dimensions', 'Weight'
    ],
    'Mouse': [
      'Type', 'DPI', 'Buttons', 'Connectivity', 'Battery Life', 'Sensor Type', 'Weight', 'Dimensions'
    ],
    'Television': [
      'Screen Size', 'Resolution', 'Display Technology', 'Smart TV OS', 'Refresh Rate', 'Audio Output', 'HDMI Ports', 'USB Ports', 'Connectivity'
    ]
  };

  for (const [categoryName, specs] of Object.entries(templates)) {
    // 1. Find or create category
    let category = await prisma.category.findFirst({
        where: { name: { equals: categoryName, mode: 'insensitive' } }
    });

    if (!category) {
        console.log(`Creating category '${categoryName}'...`);
        const slug = categoryName.toLowerCase().replace(/ /g, '-');
        try {
            category = await prisma.category.create({
                data: {
                    name: categoryName,
                    slug: slug,
                }
            });
        } catch (e) {
             console.log(`Could not create category ${categoryName}, maybe slug exists. Trying to fetch by slug.`);
             category = await prisma.category.findFirst({
                 where: { slug: slug }
             });
        }
    } else {
        console.log(`Category '${categoryName}' found.`);
    }

    if (category) {
        // 2. Add templates
        console.log(`Adding templates for ${categoryName}...`);
        for (const [index, specName] of specs.entries()) {
            const existing = await prisma.specTemplate.findFirst({
                where: {
                    categoryId: category.id,
                    name: specName
                }
            });

            if (!existing) {
                await prisma.specTemplate.create({
                    data: {
                        categoryId: category.id,
                        name: specName,
                        sortOrder: index
                    }
                });
            } else {
                // Update sort order if needed
                await prisma.specTemplate.update({
                    where: { id: existing.id },
                    data: { sortOrder: index }
                });
            }
        }
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
