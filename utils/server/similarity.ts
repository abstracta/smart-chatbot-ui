import { saveLlmUsage } from './llmUsage';
import { LlmList } from '@/types/llm';
import { DEFAULT_MODEL_EMBEDDINGS } from '../app/const';
import { LlmApiAggregator } from './llm';
export const createEmbedding = async (
  text: string,
  llmApiAggregator: LlmApiAggregator,
  userId: string,
): Promise<number[]> => {
  const modelId = LlmList[DEFAULT_MODEL_EMBEDDINGS].id;
  const { content, usage } = await llmApiAggregator.getApiForModel(modelId).createEmbeddings(modelId, text);
  await saveLlmUsage(userId, modelId, "chat", {
    prompt: usage?.prompt ?? 0,
    completion: 0,
    total: usage?.total ?? 0
  })
  return content;
};

export function calcCosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((acc, v, i) => acc + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
  const normB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
  return dot / (normA * normB);
}
