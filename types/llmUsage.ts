import * as z from 'zod';
import { User } from './user';
import { LlmID } from './llm';

export const LlmInfo = z.object({
  _id: z.nativeEnum(LlmID),
  promptPriceUSDPer1000: z.number(),
  completionPriceUSDPer1000: z.number(),
  monthlyUsageLimitUSD: z.number(),
});

export type LlmInfo = z.infer<typeof LlmInfo>;

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

export type AggregationLlmUsageStatsPerUser = {
  userId: User['_id'],
  userName: User['name'],
  totalTokens: UserLlmUsage['tokens']['total'] | undefined,
  totalUSD: UserLlmUsage['totalPriceUSD'],
  usage: {
    modelId: UserLlmUsage['modelId'],
    totalTokens: UserLlmUsage['tokens']['total'] | undefined
    totalUSD: UserLlmUsage['totalPriceUSD']
  }[]
}

export type AggregationLlmUsageStatsPerModel = {
  modelId: LlmID,
  totalTokens: UserLlmUsage['tokens']['total'] | undefined,
  totalUSD: UserLlmUsage['totalPriceUSD'],
}