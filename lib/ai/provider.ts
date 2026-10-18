import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { prisma } from '@/lib/prisma';
import { getDynamicAiModels } from '@/lib/actions/setting-actions';

export async function getAiModel(modelId: string) {
  // 1. Try to find dynamic model matching the ID
  const dynamicModels = await getDynamicAiModels();
  const matchedModel = dynamicModels.find(m => m.id === modelId);

  if (matchedModel) {
    if (matchedModel.provider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey: matchedModel.apiKey });
      return google(matchedModel.modelName);
    } else if (matchedModel.provider === 'groq') {
      const groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: matchedModel.apiKey,
      });
      return groq.chat(matchedModel.modelName);
    } else if (matchedModel.provider === 'openai') {
      const openai = createOpenAI({ apiKey: matchedModel.apiKey });
      return openai.chat(matchedModel.modelName);
    }
  }

  // 2. Legacy fallback configuration
  const settings = await prisma.setting.findMany({
    where: { category: 'ai_assistant' },
  });
  
  const keys = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  const geminiKey = keys['GEMINI_API_KEY'] || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const groqKey = keys['GROQ_API_KEY'] || process.env.GROQ_API_KEY;
  const openaiKey = keys['OPENAI_API_KEY'] || process.env.OPENAI_API_KEY;

  if (modelId.startsWith('google:')) {
    if (!geminiKey) throw new Error('Google Gemini API Key is missing. Please configure it in settings.');
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(modelId.replace('google:', ''));
  }

  if (modelId.startsWith('groq:')) {
    if (!groqKey) throw new Error('Groq API Key is missing. Please configure it in settings.');
    const groq = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: groqKey,
    });
    return groq.chat(modelId.replace('groq:', ''));
  }

  if (modelId.startsWith('openai:')) {
    if (!openaiKey) throw new Error('OpenAI API Key is missing. Please configure it in settings.');
    const openai = createOpenAI({ apiKey: openaiKey });
    return openai.chat(modelId.replace('openai:', ''));
  }

  // Fallback default
  if (!geminiKey) throw new Error('No API Keys configured.');
  const google = createGoogleGenerativeAI({ apiKey: geminiKey });
  return google('gemini-3.5-flash');
}

export async function getModelInfo(modelId: string): Promise<{ name: string; provider: string; modelName: string }> {
  try {
    const dynamicModels = await getDynamicAiModels();
    const matched = dynamicModels.find(m => m.id === modelId);
    if (matched) {
      return { name: matched.displayName, provider: matched.provider, modelName: matched.modelName };
    }
  } catch (e) {
    // ignore
  }
  return { name: modelId, provider: modelId.split(':')[0] || 'unknown', modelName: modelId.split(':')[1] || modelId };
}

export async function getFallbackModels(excludeModelId?: string) {
  try {
    const dynamicModels = await getDynamicAiModels();
    const candidates = dynamicModels.filter(m => m.id !== excludeModelId);
    // Prioritize Groq (unlimited, fast), then Google
    candidates.sort((a, b) => {
      if (a.provider === 'groq' && b.provider !== 'groq') return -1;
      if (a.provider !== 'groq' && b.provider === 'groq') return 1;
      return 0;
    });
    return candidates;
  } catch (e) {
    return [];
  }
}

