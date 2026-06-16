import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'homepage_banners' }
    });
    
    if (setting) {
      let banners = JSON.parse(setting.value);
      let updated = false;
      
      banners = banners.map((banner: any) => {
        if (banner.image && banner.image.includes('1558618666-fcd25c85f82e')) {
          console.log('Found broken image in banner ID:', banner.id);
          updated = true;
          return {
            ...banner,
            image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1600&h=600&fit=crop&q=80'
          };
        }
        return banner;
      });
      
      if (updated) {
        await prisma.setting.update({
          where: { key: 'homepage_banners' },
          data: { value: JSON.stringify(banners) }
        });
        console.log('Successfully updated homepage banners in database.');
      } else {
        console.log('No broken images found in database.');
      }
    } else {
      console.log('homepage_banners setting not found in DB.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
