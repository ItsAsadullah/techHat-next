import { prisma } from '../lib/prisma';

async function test() {
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true } });
  const q = 'keyboard';
  
  const results = allCategories.filter((c) => c.name.toLowerCase().includes(q));
  console.log("Filtered length:", results.length);
  console.log("Results:", results.map(r => r.name));
}

test();
