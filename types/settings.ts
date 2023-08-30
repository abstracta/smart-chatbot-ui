import * as z from 'zod';
import { OpenAIModelID } from './openai';

export const SettingsSchema = z.object({
  userId: z.string(),
  theme: z.enum(['light', 'dark']),
  defaultTemperature: z.number(),
  defaultModelId: z.nativeEnum(OpenAIModelID).optional()
});

export type Settings = z.infer<typeof SettingsSchema>;
