import * as z from 'zod';
import { LlmSchema } from './llm';


export const AzureOpenAIModelSchema = LlmSchema.extend({
  azureDeploymentId: z.string().optional(),
});

export type AzureOpenAIModel = z.infer<typeof AzureOpenAIModelSchema>;
