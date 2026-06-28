const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
prisma.setting.findUnique({ where: { key: 'AI_MODELS_CONFIG' } }).then(setting => { console.log(setting.value); process.exit(0); });
