import * as z from 'zod';

export enum LlmTemperature {
  PRECISE = "precise",
  NEUTRAL = "neutral",
  CREATIVE = "creative"
}

export enum LlmID {
  GPT_3_5 = 'gpt-3.5-turbo',
  GPT_3_5_16K = 'gpt-3.5-turbo-16k',
  GPT_3_5_AZ = 'gpt-35-turbo',
  GPT_3_5_16K_AZ = 'gpt-35-turbo-16k',
  GPT_4 = 'gpt-4',
  GPT_4_32K = 'gpt-4-32k',
  GPT_4_TURBO_128K = 'gpt-4-1106-preview',
  TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
  CLAUDE_INSTANT_AWS = 'anthropic.claude-instant-v1',
  CLAUDE_2_AWS = 'anthropic.claude-v2',
  LLAMA2_7B = 'llama2:7b',
  CODELLAMA_7B = 'codellama:7b',
  MISTRAL_7B = 'mistral:7b',
  VICUNA_7B = 'vicuna:7b',
  VICUNA_7B_16K = 'vicuna:7b-16k',
}

export enum LlmType {
  CHAT = 'chat',
  COMPLETION = 'completion',
  EMDEDDING = 'embedding'
}

export const LlmSchema = z.object({
  id: z.nativeEnum(LlmID),
  name: z.string(),
  maxLength: z.number(), // max length of a message.
  tokenLimit: z.number(),
  outputTokenLimit: z.number().optional(),
  type: z.nativeEnum(LlmType)
});

export type Llm = z.infer<typeof LlmSchema>;

export const LlmList: Record<LlmID, Llm> = {
  [LlmID.GPT_3_5]: {
    id: LlmID.GPT_3_5,
    name: 'GPT-3.5_4K',
    maxLength: 12000,
    tokenLimit: 4000,
    type: LlmType.CHAT
  },
  [LlmID.GPT_3_5_16K]: {
    id: LlmID.GPT_3_5_16K,
    name: 'GPT-3.5_16K',
    maxLength: 48000,
    tokenLimit: 16000,
    type: LlmType.CHAT
  },
  [LlmID.GPT_3_5_AZ]: {
    id: LlmID.GPT_3_5_AZ,
    name: 'GPT-3.5_4K',
    maxLength: 12000,
    tokenLimit: 4000,
    type: LlmType.CHAT
  },
  [LlmID.GPT_3_5_16K_AZ]: {
    id: LlmID.GPT_3_5_16K_AZ,
    name: 'GPT-3.5_16K',
    maxLength: 48000,
    tokenLimit: 16000,
    type: LlmType.CHAT
  },
  [LlmID.GPT_4]: {
    id: LlmID.GPT_4,
    name: 'GPT-4_8K',
    maxLength: 24000,
    tokenLimit: 8000,
    type: LlmType.CHAT
  },
  [LlmID.GPT_4_32K]: {
    id: LlmID.GPT_4_32K,
    name: 'GPT-4_32K',
    maxLength: 96000,
    tokenLimit: 32000,
    type: LlmType.CHAT
  },
  [LlmID.GPT_4_TURBO_128K]: {
    id: LlmID.GPT_4_TURBO_128K,
    name: 'GPT-4-TURBO_128K',
    maxLength: 384000,
    tokenLimit: 128000,
    outputTokenLimit: 4096,
    type: LlmType.CHAT
  },
  [LlmID.TEXT_EMBEDDING_ADA_002]: {
    id: LlmID.TEXT_EMBEDDING_ADA_002,
    name: 'TEXT-EMBEDDING-ADA-002',
    maxLength: 24000,
    tokenLimit: 8000,
    type: LlmType.EMDEDDING
  },
  [LlmID.CLAUDE_INSTANT_AWS]: {
    id: LlmID.CLAUDE_INSTANT_AWS,
    name: 'CLAUDE-INSTANT_100K',
    maxLength: 300000,
    tokenLimit: 100000,
    type: LlmType.CHAT
  },
  [LlmID.CLAUDE_2_AWS]: {
    id: LlmID.CLAUDE_2_AWS,
    name: 'CLAUDE-2_100K',
    maxLength: 300000,
    tokenLimit: 100000,
    type: LlmType.CHAT
  },
  [LlmID.LLAMA2_7B]: {
    id: LlmID.LLAMA2_7B,
    name: 'LLAMA2-7B_4K',
    maxLength: 12000,
    tokenLimit: 4000,
    type: LlmType.CHAT
  },
  [LlmID.CODELLAMA_7B]: {
    id: LlmID.CODELLAMA_7B,
    name: 'CODELLAMA-7B_4K',
    maxLength: 12000,
    tokenLimit: 4000,
    type: LlmType.CHAT
  },
  [LlmID.MISTRAL_7B]: {
    id: LlmID.MISTRAL_7B,
    name: 'MISTRAL-7B_8K',
    maxLength: 24000,
    tokenLimit: 8000,
    type: LlmType.CHAT
  },
  [LlmID.VICUNA_7B]: {
    id: LlmID.VICUNA_7B,
    name: 'VICUNA-7B_2K',
    maxLength: 6000,
    tokenLimit: 2000,
    type: LlmType.CHAT
  },
  [LlmID.VICUNA_7B_16K]: {
    id: LlmID.VICUNA_7B_16K,
    name: 'VICUNA-7B_16K',
    maxLength: 48000,
    tokenLimit: 16000,
    type: LlmType.CHAT
  },
};

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = LlmID.GPT_3_5;
// in case the `DEFAULT_MODEL_EMBEDDINGS` environment variable is not set or set to an unsupported model
export const fallbackEmbeddingsModelID = LlmID.TEXT_EMBEDDING_ADA_002;

