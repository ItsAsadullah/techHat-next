import { prisma } from './lib/prisma'; prisma.attribute.findMany().then(console.log).finally(() => prisma.$disconnect());
