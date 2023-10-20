import { OpenAIModel, OpenAIModelID, OpenAIModels, fallbackEmbeddingsModelID, fallbackModelID } from "@/types/openai";

export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.";

export const DEFAULT_MODEL = (process.env.DEFAULT_MODEL &&
  Object.values(OpenAIModelID).includes(
    process.env.DEFAULT_MODEL as OpenAIModelID,
  ) && process.env.DEFAULT_MODEL as OpenAIModelID) || fallbackModelID;

export const DEFAULT_MODEL_EMBEDDINGS: OpenAIModelID = (process.env.DEFAULT_MODEL_EMBEDDINGS &&
  Object.values(OpenAIModelID).includes(
    process.env.DEFAULT_MODEL_EMBEDDINGS as OpenAIModelID,
  ) && process.env.DEFAULT_MODEL_EMBEDDINGS as OpenAIModelID) || fallbackEmbeddingsModelID;

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2023-05-15';

export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || '';

export const AZURE_OPENAI_DEPLOYMENTS: Record<OpenAIModelID, OpenAIModel> | undefined = process.env.AZURE_OPENAI_DEPLOYMENTS
  ? parseAzureDeployments(process.env.AZURE_OPENAI_DEPLOYMENTS) : undefined;

export const MONGODB_DB = process.env.MONGODB_DB || '';

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || '';

export const PROMPT_SHARING_ENABLED: boolean = process.env.PROMPT_SHARING_ENABLED === "true" || false;

export const DEFAULT_USER_LIMIT_USD_MONTHLY: number = process.env.DEFAULT_USER_LIMIT_USD_MONTHLY != undefined ? Number.parseFloat(process.env.DEFAULT_USER_LIMIT_USD_MONTHLY) : -1;

export const CAN_UPDATE_USER_QUOTAS: boolean = process.env.CAN_UPDATE_USER_QUOTAS === "true" || false;

function parseAzureDeployments(envVar: string): Record<OpenAIModelID, OpenAIModel> {
  return envVar.trim().split(",").reduce((prev, curr) => {
    const [modelId, azureDeploymentId] = curr.split(":");
    if ((Object.values(OpenAIModelID) as string[]).includes(modelId)) {
      const model = OpenAIModels[modelId as OpenAIModelID];
      model.azureDeploymentId = azureDeploymentId;
      prev[modelId as OpenAIModelID] = model;
    }
    return prev;
  }, {} as Record<OpenAIModelID, OpenAIModel>);
}