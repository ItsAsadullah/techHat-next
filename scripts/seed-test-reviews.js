const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestReviews() {
  try {
    const product = await prisma.product.findFirst({
      select: { id: true }
    });

    if (!product) {
      console.log('No product found');
      return;
    }

    await prisma.review.createMany({
      data: [
        {
          productId: product.id,
          name: 'আরিফুল ইসলাম',
          rating: 5,
          reviewText: 'খুবই ভালো প্রোডাক্ট। দাম অনুযায়ী পারফেক্ট। সবাইকে রেকমেন্ড করি।',
          status: 'APPROVED',
          isVerified: true
        },
        {
          productId: product.id,
          name: 'সাকিব আহমেদ',
          rating: 5,
          reviewText: 'দারুন প্রোডাক্ট। কোয়ালিটি অসাধারণ।',
          status: 'APPROVED',
          isVerified: true
        },
        {
          productId: product.id,
          name: 'রহিমুল হক',
          rating: 4,
          reviewText: 'ভালো প্রোডাক্ট তবে আরো improvement চাই।',
          status: 'APPROVED',
          isVerified: false
        },
        {
          productId: product.id,
          name: 'করিম মিয়া',
          rating: 3,
          reviewText: 'মোটামুটি ভালো। দাম একটু বেশি মনে হয়েছে।',
          status: 'APPROVED',
          isVerified: false
        }
      ]
    });

    console.log('✅ Test reviews created successfully!');
    console.log('- 2 reviews with 5 stars (verified)');
    console.log('- 1 review with 4 stars');
    console.log('- 1 review with 3 stars');
  } catch (error) {
    console.error('Error creating test reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestReviews();
