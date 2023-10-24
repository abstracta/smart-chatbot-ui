import { Llm, LlmID, LlmTemperature } from "@/types/llm";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatBedrock } from "langchain/chat_models/bedrock";
import { ChatOllama } from "langchain/chat_models/ollama";
import { OllamaEmbeddings } from "langchain/embeddings/ollama";
import { BaseMessage } from "langchain/schema";
import {
  AZURE_OPENAI_DEPLOYMENTS, OPENAI_API_VERSION, OPENAI_API_HOST,
  OPENAI_API_TYPE, AWS_BEDROCK_MODELS, OPENAI_INSTANCE_NAME,
  AWS_BEDROCK_REGION, OLLAMA_URL
} from "../app/const";
import { AzureOpenAIModel } from "@/types/openai";
import { LlmList } from '@/types/llm';
import { getTiktokenEncoding } from "./tiktoken";
import { mapMessageToLangchainMessage, serializeMessages } from "./message";
import { Message } from "@/types/chat";
import { Configuration, Model, OpenAIApi } from "openai";
import { Bedrock } from "@aws-sdk/client-bedrock";
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { OpenAiError } from ".";
import { ApiError, ErrorResponseCode } from "@/types/error";

export interface ChatCompletionResponse {
  usage?: {
    prompt: number,
    completion: number,
    total: number
  },
  message: BaseMessage,
}

interface CallbackHandlers {
  handleNewToken?: (token: string) => void;
}

export interface ChatCompletionOptions {
  temperature?: LlmTemperature;
  maxTokens?: number;
  callbacks?: CallbackHandlers
}

export interface CreateEmbeddingsResponse {
  usage?: {
    prompt: number,
    total: number
  },
  content: number[],
}

abstract class LlmApi {
  private canStream: boolean;
  private temperatureMap: Record<LlmTemperature, number>;

  constructor(temperatureMap: Record<LlmTemperature, number>, canStream = true) {
    this.temperatureMap = temperatureMap;
    this.canStream = canStream;
  }

  abstract init(): Promise<void>;

  abstract listModels(): Llm[]

  abstract chatCompletion(modelId: LlmID, messages: Message[], options?: ChatCompletionOptions)
    : Promise<ChatCompletionResponse>

  abstract createEmbeddings(modelId: LlmID, text: string): Promise<CreateEmbeddingsResponse>

  getTemperature(temp: LlmTemperature): number {
    return this.temperatureMap[temp];
  }

  getCanStream() {
    return this.canStream;
  }
}

export class LlmApiAggregator {
  private apis: LlmApi[];

  constructor(apis: LlmApi[] = []) {
    this.apis = apis;
  }

  async init(): Promise<void> {
    await Promise.all(this.apis.map(a => a.init()));
  }

  getModel(modelId: LlmID) {
    const model = this.listModels().find(m => m.id === modelId);
    if (!model) throw Error("Model not found");
    return model;
  }

  listModels(): Llm[] {
    return this.apis.map(a => a.listModels()).flat();
  }

  getApiForModel(modelId: LlmID): LlmApi {
    const model = this.apis.find(a => a.listModels().find(m => m.id === modelId));
    if (model) return model;
    else throw Error("Model not found");
  }

}

class OpenAiApi extends LlmApi {
  private models: Record<LlmID, Llm>;
  private baseOptions: any;

  constructor() {
    super({
      [LlmTemperature.PRECISE]: 0,
      [LlmTemperature.NEUTRAL]: .8,
      [LlmTemperature.CREATIVE]: 1.5,
    });
    this.models = {} as Record<LlmID, Llm>;
    this.baseOptions = {
      openAIApiKey: process.env.OPENAI_API_KEY
    }
  }

  async init(): Promise<void> {
    const openai = new OpenAIApi(new Configuration({
      apiKey: this.baseOptions.openAIApiKey
    }));
    const json = (await openai.listModels()).data;

    const models: Llm[] = json.data?.map((model: Model) => {
      for (const [key, value] of Object.entries(LlmID)) {
        const modelId = model.id;
        if (value === modelId) {
          const r: Llm = {
            id: modelId,
            name: LlmList[value].name,
            maxLength: LlmList[value].maxLength,
            tokenLimit: LlmList[value].tokenLimit,
            type: LlmList[value].type,
          };
          return r;
        }
      }
    }).filter(Boolean) as Llm[] || [];

    this.models = models.reduce((prev, curr) => {
      if (prev[curr.id] == undefined) prev[curr.id] = curr;
      return prev;
    }, {} as Record<LlmID, Llm>);;
  }

  listModels(): Llm[] {
    return this.models ? Object.values(this.models) : [];
  }

  async chatCompletion(modelId: LlmID, messages: Message[], options?: ChatCompletionOptions)
    : Promise<ChatCompletionResponse> {
    const model = new ChatOpenAI({
      ...this.baseOptions,
      temperature: options?.temperature ? this.getTemperature(options.temperature) : undefined,
      streaming: true,
      modelName: modelId,
      maxTokens: options?.maxTokens,
    });
    const encoding = getTiktokenEncoding(modelId);
    const serialized = serializeMessages(modelId, messages);
    let promptTokens = encoding.encode(serialized, 'all').length;
    let completionTokens = 0;
    try {
      const modelRes = await model.call(mapMessageToLangchainMessage(messages), {
        callbacks: [
          {
            handleLLMEnd: (output, runId, parentRunId?, tags?) => {
              completionTokens = output.generations.flat()
                .map(g => encoding.encode(g.text).length)
                .reduce((prev, curr) => prev + curr, 0);
            },
            handleLLMNewToken(token, idx, runId, parentRunId, tags, fields) {
              options?.callbacks?.handleNewToken && options.callbacks.handleNewToken(token);
            },
          },
        ]
      });

      return {
        message: modelRes,
        usage: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        }
      }
    } catch (e: any) {
      if (e?.constructor.name === "RateLimitError") {
        throw new OpenAiError(e);
      }
      throw e;
    }
  }

  async createEmbeddings(modelId: LlmID, text: string): Promise<CreateEmbeddingsResponse> {
    const model = new OpenAIEmbeddings({
      ...this.baseOptions,
      modelName: modelId,
    });
    const encoding = getTiktokenEncoding(modelId);
    let promptTokens = encoding.encode(text, 'all').length;
    try {
      const res = await model.embedQuery(text);
      return {
        content: res,
        usage: {
          prompt: promptTokens,
          total: promptTokens
        }
      };
    } catch (e: any) {
      if (e?.constructor.name === "RateLimitError") {
        throw new OpenAiError(e);
      }
      throw e;
    }
  }

}

class AzureOpenAiApi extends LlmApi {
  private models: Record<LlmID, AzureOpenAIModel>;
  private baseOptions: any;

  constructor() {
    super({
      [LlmTemperature.PRECISE]: 0,
      [LlmTemperature.NEUTRAL]: .8,
      [LlmTemperature.CREATIVE]: 1.5,
    });
    this.models = AZURE_OPENAI_DEPLOYMENTS || {} as Record<LlmID, AzureOpenAIModel>;
    this.baseOptions = {
      azureOpenAIApiKey: process.env.OPENAI_API_KEY,
      azureOpenAIApiVersion: OPENAI_API_VERSION,
      ...(OPENAI_INSTANCE_NAME ? { azureOpenAIApiInstanceName: OPENAI_INSTANCE_NAME } : {}),
      ...(OPENAI_API_HOST ? { azureOpenAIBasePath: OPENAI_API_HOST } : {})
    }
  }

  async init(): Promise<void> { }

  listModels(): Llm[] {
    return this.models ? Object.values(this.models) as Llm[] : [];
  }

  private getDeploymentName(modelId: LlmID): string {
    return this.models[modelId].azureDeploymentId || "";
  }

  async chatCompletion(modelId: LlmID, messages: Message[], options?: ChatCompletionOptions)
    : Promise<ChatCompletionResponse> {
    const model = new ChatOpenAI({
      ...this.baseOptions,
      temperature: options?.temperature ? this.getTemperature(options.temperature) : undefined,
      streaming: true,
      azureOpenAIApiDeploymentName: this.getDeploymentName(modelId),
      maxTokens: options?.maxTokens,
    });
    const encoding = getTiktokenEncoding(modelId);
    const serialized = serializeMessages(modelId, messages);
    let promptTokens = encoding.encode(serialized, 'all').length;
    let completionTokens = 0;
    try {
      const modelRes = await model.call(mapMessageToLangchainMessage(messages), {
        callbacks: [
          {
            handleLLMEnd: (output, runId, parentRunId?, tags?) => {
              completionTokens = output.generations.flat()
                .map(g => encoding.encode(g.text).length)
                .reduce((prev, curr) => prev + curr, 0);
            },
            handleLLMNewToken(token, idx, runId, parentRunId, tags, fields) {
              options?.callbacks?.handleNewToken && options.callbacks.handleNewToken(token);
            },
          },
        ]
      });
      return {
        message: modelRes,
        usage: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        }
      };
    } catch (e: any) {
      if (e?.constructor.name === "RateLimitError") {
        throw new OpenAiError(e);
      }
      throw e;
    }

  }

  async createEmbeddings(modelId: LlmID, text: string): Promise<CreateEmbeddingsResponse> {
    const model = new OpenAIEmbeddings({
      ...this.baseOptions,
      azureOpenAIApiDeploymentName: this.getDeploymentName(modelId),
    });
    const encoding = getTiktokenEncoding(modelId);
    let promptTokens = encoding.encode(text, 'all').length;
    try {
      const res = await model.embedQuery(text);
      return {
        content: res,
        usage: {
          prompt: promptTokens,
          total: promptTokens
        }
      };
    } catch (e: any) {
      if (e?.constructor.name === "RateLimitError") {
        throw new OpenAiError(e);
      }
      throw e;
    }
  }

}

class AwsBedrockApi extends LlmApi {
  private models: Record<LlmID, Llm>;
  private bedrockClient: Bedrock;

  constructor() {
    super({
      [LlmTemperature.PRECISE]: 0,
      [LlmTemperature.NEUTRAL]: .5,
      [LlmTemperature.CREATIVE]: 1,
    }, false);
    this.models = {} as Record<LlmID, Llm>;
    this.bedrockClient = new Bedrock({
      ...(AWS_BEDROCK_REGION ? { region: AWS_BEDROCK_REGION } : {})
    });
  }

  async init(): Promise<void> {
    this.models = (await this._getModels()).reduce((prev, curr) => {
      if (prev[curr.id] == undefined) prev[curr.id] = curr;
      return prev;
    }, {} as Record<LlmID, Llm>);
  }

  private async _getModels(): Promise<Llm[]> {
    const res = await this.bedrockClient.listFoundationModels({
      byOutputModality: "TEXT",
      byInferenceType: "ON_DEMAND"
    });
    let models = [] as Llm[];
    if (res.modelSummaries) {
      models = (await Promise.all([
        ...(res.modelSummaries.map(async (model): Promise<Llm | undefined> => {
          return Object.values(LlmList).find(m => m.id === model.modelId &&
            !(AWS_BEDROCK_MODELS && !AWS_BEDROCK_MODELS.includes(m.id)));
        }))
      ])).filter(Boolean) as Llm[];
    }
    return models;
  }

  listModels(): Llm[] {
    return this.models ? Object.values(this.models) : [];
  }

  async chatCompletion(modelId: LlmID, messages: Message[], options?: ChatCompletionOptions)
    : Promise<ChatCompletionResponse> {
    const model = new ChatBedrock({
      region: AWS_BEDROCK_REGION,
      temperature: options?.temperature ? this.getTemperature(options.temperature) : undefined,
      model: modelId,
      maxTokens: options?.maxTokens,
    });
    const encoding = getTiktokenEncoding(modelId);
    const serialized = serializeMessages(modelId, messages);
    let promptTokens = encoding.encode(serialized.normalize('NFKC'), 'all').length;
    let completionTokens = 0;
    try {
      const modelRes = await model.call(mapMessageToLangchainMessage(messages), {
        callbacks: [
          {
            handleLLMEnd: (output, runId, parentRunId?, tags?) => {
              completionTokens = output.generations.flat()
                .map(g => encoding.encode(g.text).length)
                .reduce((prev, curr) => prev + curr, 0);
            },
            handleLLMNewToken(token, idx, runId, parentRunId, tags, fields) {
              options?.callbacks?.handleNewToken && options.callbacks.handleNewToken(token);
            },
          },
        ],
      });
      return {
        message: modelRes,
        usage: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        }
      };
    } catch (e: any) {
      if (typeof e.message == "string" && (e.message as string).includes("Error 429")) {
        throw new ApiError({ code: ErrorResponseCode.LLM_RATE_LIMIT_REACHED });
      }
      throw e;
    }
  }

  async createEmbeddings(modelId: LlmID, text: string): Promise<CreateEmbeddingsResponse> {
    throw new Error("Not implemented")
  }
}


class OLlamaApi extends LlmApi {
  private models: Record<LlmID, Llm>;
  private baseOptions: any;

  constructor() {
    super({
      [LlmTemperature.PRECISE]: 0,
      [LlmTemperature.NEUTRAL]: .8,
      [LlmTemperature.CREATIVE]: 1.5,
    });
    this.models = {} as Record<LlmID, Llm>;
    this.baseOptions = {
      baseUrl: OLLAMA_URL
    }
  }

  async init(): Promise<void> {
    this.models = (await this._getModels()).reduce((prev, curr) => {
      if (prev[curr.id] == undefined) prev[curr.id] = curr;
      return prev;
    }, {} as Record<LlmID, Llm>);
  }

  private async _getModels(): Promise<Llm[]> {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    const json = await res.json();
    const models: Llm[] = json.models?.map((model: any) => {
      return Object.values(LlmList).find(m => m.id == model.name);
    }).filter(Boolean) || []
    return models;
  }

  listModels(): Llm[] {
    return this.models ? Object.values(this.models) : [];
  }

  async chatCompletion(modelId: LlmID, messages: Message[], options?: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const model = new ChatOllama({
      ...this.baseOptions,
      temperature: options?.temperature ? this.getTemperature(options.temperature) : undefined,
      model: modelId,
    });
    // TODO: use different tokenizer
    const encoding = getTiktokenEncoding(modelId);
    const serialized = serializeMessages(modelId, messages);
    let promptTokens = encoding.encode(serialized, 'all').length;
    let completionTokens = 0;
    const modelRes = await model.call(mapMessageToLangchainMessage(messages), {
      callbacks: [
        {
          handleLLMEnd: (output, runId, parentRunId?, tags?) => {
            completionTokens = output.generations.flat()
              .map(g => encoding.encode(g.text).length)
              .reduce((prev, curr) => prev + curr, 0);
          },
          handleLLMNewToken(token, idx, runId, parentRunId, tags, fields) {
            options?.callbacks?.handleNewToken && options.callbacks.handleNewToken(token);
          },
        },
      ]
    });
    return {
      message: modelRes,
      usage: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      }
    };
  }

  async createEmbeddings(modelId: LlmID, text: string): Promise<CreateEmbeddingsResponse> {
    const model = new OllamaEmbeddings({
      ...this.baseOptions,
      model: modelId
    });
    const encoding = getTiktokenEncoding(modelId);
    let promptTokens = encoding.encode(text, 'all').length;
    const res = await model.embedQuery(text);
    return {
      content: res,
      usage: {
        prompt: promptTokens,
        total: promptTokens
      }
    };
  }

}

export async function getLlmApiAggregator(): Promise<LlmApiAggregator> {
  const apiList: LlmApi[] = [];
  if (OPENAI_API_TYPE === "openai")
    apiList.push(new OpenAiApi());
  else
    apiList.push(new AzureOpenAiApi());
  try {
    const provider = defaultProvider();
    await provider();
    apiList.push(new AwsBedrockApi())
  } catch (e) {
    console.error("Aws credentials error:", e);
  }
  if (OLLAMA_URL) {
    apiList.push(new OLlamaApi());
  }
  const apiCatalog = await new LlmApiAggregator(apiList);
  try {
    await apiCatalog.init();
  } catch (e) {
    console.error("Error initializing llm apis", e);
    throw e;
  }
  return apiCatalog;
}
