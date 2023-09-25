import { OpenAIApi } from 'openai';
import { saveLlmUsage } from './llmUsage';
import { OpenAIModels } from '@/types/openai';
import { DEFAULT_MODEL_EMBEDDINGS } from '../app/const';
export const createEmbedding = async (
  text: string,
  openai: OpenAIApi,
  userId: string,
): Promise<number[]> => {
  const modelId = OpenAIModels[DEFAULT_MODEL_EMBEDDINGS].id;
  const result = await openai.createEmbedding({
    model: modelId,
    input: text,
  });
  await saveLlmUsage(userId, modelId, "embedding", {
    prompt: result.data.usage?.prompt_tokens,
    completion: 0,
    total: result.data.usage?.total_tokens
  })
  return result.data.data[0].embedding;
};

export function calcCosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((acc, v, i) => acc + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
  const normB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
  return dot / (normA * normB);
}
