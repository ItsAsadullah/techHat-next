import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

async function testModel(modelName: string) {
  console.log(`Testing model: ${modelName}`);
  try {
    const { text } = await generateText({
      model: google(modelName),
      prompt: 'Hello, what is your name?',
    });
    console.log(`Success with ${modelName}: ${text}`);
  } catch (error: any) {
    console.error(`Error with ${modelName}: ${error.message}`);
  }
}

async function run() {
  await testModel('gemini-1.5-flash');
  await testModel('gemini-flash-latest');
  await testModel('gemini-1.5-pro');
  await testModel('gemini-3.5-flash');
  await testModel('gemini-3.1-pro');
}

run();
