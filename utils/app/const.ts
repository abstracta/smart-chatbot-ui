import { LlmID } from "@/types/llm";
import { AzureOpenAIModel } from "@/types/openai";
import { fallbackEmbeddingsModelID } from '@/types/llm';
import { fallbackModelID } from '@/types/llm';
import { LlmList } from '@/types/llm';

export const DEFAULT_SYSTEM_PROMPT =
  process.env.DEFAULT_SYSTEM_PROMPT ||
  "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.";

export const DEFAULT_MODEL = (process.env.DEFAULT_MODEL &&
  Object.values(LlmID).includes(
    process.env.DEFAULT_MODEL as LlmID,
  ) && process.env.DEFAULT_MODEL as LlmID) || fallbackModelID;

export const DEFAULT_MODEL_EMBEDDINGS: LlmID = (process.env.DEFAULT_MODEL_EMBEDDINGS &&
  Object.values(LlmID).includes(
    process.env.DEFAULT_MODEL_EMBEDDINGS as LlmID,
  ) && process.env.DEFAULT_MODEL_EMBEDDINGS as LlmID) || fallbackEmbeddingsModelID;

export const APP_NAME = process.env.APP_NAME || 'Chatbot UI';

export const OPENAI_API_HOST = process.env.OPENAI_API_HOST || "";

export const OPENAI_INSTANCE_NAME = process.env.OPENAI_INSTANCE_NAME || undefined;

export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-05-15';

export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || '';

export const AZURE_OPENAI_DEPLOYMENTS: Record<LlmID, AzureOpenAIModel> | undefined = process.env.AZURE_OPENAI_DEPLOYMENTS
  ? parseAzureDeployments(process.env.AZURE_OPENAI_DEPLOYMENTS) : undefined;

export const MONGODB_DB = process.env.MONGODB_DB || '';

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || '';

export const PROMPT_SHARING_ENABLED: boolean = process.env.PROMPT_SHARING_ENABLED === "true" || false;

export const DEFAULT_USER_LIMIT_USD_MONTHLY: number = process.env.DEFAULT_USER_LIMIT_USD_MONTHLY != undefined ? Number.parseFloat(process.env.DEFAULT_USER_LIMIT_USD_MONTHLY) : -1;

export const CAN_UPDATE_USER_QUOTAS: boolean = process.env.CAN_UPDATE_USER_QUOTAS === "true" || false;

export const AWS_BEDROCK_ACCESS_KEY: string | undefined = process.env.AWS_BEDROCK_ACCESS_KEY || undefined;

export const AWS_BEDROCK_SECRET_KEY: string | undefined = process.env.AWS_BEDROCK_SECRET_KEY || undefined;

export const AWS_BEDROCK_MODELS: LlmID[] | undefined = process.env.AWS_BEDROCK_MODELS ? parseModelIdList(process.env.AWS_BEDROCK_MODELS) : undefined;

export const AWS_BEDROCK_REGION: string | undefined = process.env.AWS_BEDROCK_REGION || undefined;

export const OLLAMA_URL: string | undefined = process.env.OLLAMA_URL || undefined;

export const AGENT_ENABLED: boolean = process.env.AGENT_ENABLED === "true" || false;

function parseModelIdList(value: string): LlmID[] {
  return value.trim()
    .split(",")
    .map(v => Object.values(LlmID).find(id => id == v.trim()))
    .filter(Boolean) as LlmID[];
}

function parseAzureDeployments(envVar: string): Record<LlmID, AzureOpenAIModel> {
  return envVar.trim().split(",").reduce((prev, curr) => {
    const [modelId, azureDeploymentId] = curr.split(":");
    if ((Object.values(LlmID) as string[]).includes(modelId)) {
      const model = LlmList[modelId as LlmID] as AzureOpenAIModel;
      model.azureDeploymentId = azureDeploymentId;
      prev[modelId as LlmID] = model;
    }
    return prev;
  }, {} as Record<LlmID, AzureOpenAIModel>);
}