'use server';

import { prisma } from '@/lib/prisma';

export interface DynamicAiModel {
  id: string;
  displayName: string;
  modelName: string;
  provider: 'google' | 'groq' | 'openai';
  apiKey: string;
}

export async function getAiSettings() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'ai_assistant',
      },
    });

    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    return settingsMap;
  } catch (error) {
    console.error('Failed to get AI settings:', error);
    return {};
  }
}

export async function updateAiSettings(data: { [key: string]: string }) {
  try {
    const operations = Object.entries(data).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          category: 'ai_assistant',
          description: `AI Assistant Setting for ${key}`,
        },
      });
    });

    await prisma.$transaction(operations);

    return { success: true };
  } catch (error) {
    console.error('Failed to update AI settings:', error);
    return { success: false, error: 'Failed to update settings.' };
  }
}

export async function getDynamicAiModels(): Promise<DynamicAiModel[]> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'AI_MODELS_CONFIG' },
    });
    if (setting && setting.value) {
      return JSON.parse(setting.value) as DynamicAiModel[];
    }
  } catch (error) {
    console.error('Failed to get dynamic AI models:', error);
  }
  return [];
}

export async function saveDynamicAiModels(models: DynamicAiModel[]) {
  try {
    const value = JSON.stringify(models);
    await prisma.setting.upsert({
      where: { key: 'AI_MODELS_CONFIG' },
      update: { value },
      create: {
        key: 'AI_MODELS_CONFIG',
        value,
        category: 'ai_assistant',
        description: 'Dynamic AI Models Configuration',
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to save dynamic AI models:', error);
    return { success: false, error: 'Failed to save dynamic models.' };
  }
}

export async function getAvailableAiModels() {
  const dynamicModels = await getDynamicAiModels();
  
  if (dynamicModels.length > 0) {
    return dynamicModels.map(model => ({
      value: model.id,
      label: model.displayName
    }));
  }

  // Fallback to legacy configurations if no dynamic models exist
  const settings = await getAiSettings();

  const hasGemini = !!settings['GEMINI_API_KEY'] || !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const hasGroq = !!settings['GROQ_API_KEY'] || !!process.env.GROQ_API_KEY;
  const hasOpenAI = !!settings['OPENAI_API_KEY'] || !!process.env.OPENAI_API_KEY;

  const models = [];

  if (hasGroq) {
    models.push({ value: 'groq:openai/gpt-oss-120b', label: 'Groq GPT-OSS 120B (High Intelligence & Unlimited)' });
    models.push({ value: 'groq:qwen/qwen3.8-27b', label: 'Groq Qwen 3.8 (Ultra Fast)' });
  }

  if (hasGemini) {
    models.push({ value: 'google:gemini-3.5-flash', label: 'Google Gemini 3.5 Flash' });
    models.push({ value: 'google:gemini-3.8-flash', label: 'Google Gemini 3.8 Flash (Latest)' });
    models.push({ value: 'google:gemini-3.5-flash-lite', label: 'Google Gemini 3.5 Flash Lite' });
  }

  if (hasOpenAI) {
    models.push({ value: 'openai:gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' });
  }

  // Fallback if none is configured
  if (models.length === 0) {
    models.push({ value: 'google:gemini-3.5-flash', label: 'Gemini 3.5 Flash (Please configure API Key in settings)' });
  }

  return models;
}
