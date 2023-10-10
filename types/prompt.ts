import { OpenAIModelSchema } from './openai';

import * as z from 'zod';

export const PromptSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  content: z.string(),
  model: OpenAIModelSchema,
  folderId: z.string().nullable(),
  userId: z.string().optional(),
});

export const PromptSchemaArray = z.array(PromptSchema);

export type Prompt = z.infer<typeof PromptSchema>;

export const PublicPromptSchema = PromptSchema.extend({
  usageCount: z.number().default(0)
})

export const PublicPromptSchemaArray = z.array(PublicPromptSchema);

export type PublicPrompt = z.infer<typeof PublicPromptSchema>;
