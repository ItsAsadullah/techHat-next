
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking categories and templates...');
  
  const categories = await prisma.category.findMany({
    include: {
      specTemplates: true
    }
  });

  console.log(`Found ${categories.length} categories.`);
  
  for (const cat of categories) {
    console.log(`Category: ${cat.name} (ID: ${cat.id})`);
    console.log(`  - Templates: ${cat.specTemplates.length}`);
    cat.specTemplates.forEach(t => {
      console.log(`    - ${t.name}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
