import * as z from 'zod';
import { LlmID, LlmTemperature } from './llm';

export const SettingsSchema = z.object({
  userId: z.string(),
  theme: z.enum(['light', 'dark']),
  defaultTemperature: z.nativeEnum(LlmTemperature),
  defaultModelId: z.nativeEnum(LlmID).optional(),
  defaultSystemPrompt: z.string().optional()
});

export type Settings = z.infer<typeof SettingsSchema>;
