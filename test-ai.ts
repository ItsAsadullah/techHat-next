import { analyzeProductAction } from './lib/actions/ai-assistant-actions';

async function main() {
  console.log('Testing AI generation...');
  const res = await analyzeProductAction({
    productName: 'Samsung Galaxy S24 Ultra',
    officialUrl: 'https://www.samsung.com/us/smartphones/galaxy-s24-ultra/',
    competitorUrls: [],
    imageUrls: ['https://res.cloudinary.com/techhat/image/upload/v1713023023/samsung-s24-ultra.jpg']
  });

  console.log('Result:', JSON.stringify(res, null, 2));
}

main().catch(console.error);
