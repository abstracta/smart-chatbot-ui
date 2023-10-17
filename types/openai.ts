import * as z from 'zod';
import { LlmSchema } from './llm';


export const OpenAIModelSchema = LlmSchema.extend({
  azureDeploymentId: z.string().optional(),
});

export type OpenAIModel = z.infer<typeof OpenAIModelSchema>;
