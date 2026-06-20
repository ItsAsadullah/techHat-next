import { generateText } from 'ai';
import { getAiModel } from './provider';

export async function analyzeProductImages(imageUrls: string[], modelId: string = 'google:gemini-flash-latest'): Promise<string> {
  if (!imageUrls || imageUrls.length === 0) {
    return 'No images provided for analysis.';
  }

  try {
    const aiModel = await getAiModel(modelId);

    const { text } = await generateText({
      model: aiModel,
      system: `You are an expert product image analyst. Your job is to extract:
      1. Dominant colors (with suggested Hex codes)
      2. Any readable text on the packaging or product (model numbers, features)
      3. Brand logos or distinguishing marks
      4. Included accessories visible in the image.`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze these product images and extract the requested information.' },
            ...imageUrls.map(url => ({
              type: 'image',
              image: url,
            })),
          ] as any, // Type assertion since ai sdk types might differ
        },
      ],
    });

    return text;
  } catch (error) {
    console.error('Error analyzing images:', error);
    return 'Image analysis failed due to an error.';
  }
}
