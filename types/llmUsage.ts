import * as z from 'zod';
import { OpenAIModelID } from './openai';

export const OpenAIModelIdEnumSchema = z.nativeEnum(OpenAIModelID);

export const LlmPriceRate = z.object({
  modelId: OpenAIModelIdEnumSchema,
  promptPriceUSDPer1000: z.number(),
  completionPriceUSDPer1000: z.number()
});

export type LlmPriceRate = z.infer<typeof LlmPriceRate>;

export const TokenUsageCountSchema = z.object({
  prompt: z.number(),
  completion: z.number(),
  total: z.number()
});
export type TokenUsageCount = z.infer<typeof TokenUsageCountSchema>;

export const LlmUsageModeEnum = z.enum(["chat", "agent", "agentConv", "google", "agentPlugin", "embedding"]);
export type LlmUsageMode = z.infer<typeof LlmUsageModeEnum>;

export const UserLlmUsageSchema = z.object({
  _id: z.string().optional(),
  date: z.coerce.date(),
  tokens: TokenUsageCountSchema,
  totalPriceUSD: z.number().optional(),
  modelId: z.string(),
  mode: LlmUsageModeEnum,
  userId: z.string()
});

export const NewUserLlmUsageSchema = UserLlmUsageSchema.omit({ userId: true, _id: true })
export type NewUserLlmUsage = z.infer<typeof NewUserLlmUsageSchema>;
export type UserLlmUsage = z.infer<typeof UserLlmUsageSchema>;