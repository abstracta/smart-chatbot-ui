import { NextApiRequest, NextApiResponse } from 'next';

import { extractHeaders } from '@/utils/server/http';
import { getTiktokenEncoding } from '@/utils/server/tiktoken';

import { Action } from '@/types/agent';

import { listAllTools } from './list';
import { Headers } from './requests';

import { Tiktoken } from 'tiktoken';
import { getUserHash } from '@/utils/server/auth';
import { Llm, LlmID } from '@/types/llm';
import { LlmApiAggregator, getLlmApiAggregator } from '@/utils/server/llm';

export interface TaskExecutionContext {
  taskId: string;
  locale: string;
  headers: Headers;
  model: Llm;
  getEncoding: () => Promise<Tiktoken>;
  withEncoding: (fn: (encoding: Tiktoken) => Promise<any>) => Promise<any>;
  verbose: boolean;
  userId: string;
  llmApiAggregator: LlmApiAggregator;
}

export const createContext = async (
  taskId: string,
  request: NextApiRequest,
  response: NextApiResponse,
  modelId: LlmID,
  verbose: boolean,
): Promise<TaskExecutionContext> => {
  const headers = extractHeaders(request);
  const locale = headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  const userId = await getUserHash(request, response);
  const llmApiAggregator = await getLlmApiAggregator();
  const model = await llmApiAggregator.getModel(modelId);
  if (!model) throw new Error("Model not found")
  return {
    taskId,
    headers,
    locale,
    model,
    verbose,
    getEncoding: async (): Promise<Tiktoken> =>
      getTiktokenEncoding(modelId),
    withEncoding: async (
      fn: (encoding: Tiktoken) => Promise<any>,
    ): Promise<any> => {
      let enc: Tiktoken | null = null;
      try {
        enc = getTiktokenEncoding(modelId);
        return fn(enc);
      } finally {
        if (enc) {
          enc.free();
        }
      }
    },
    userId,
    llmApiAggregator,
  };
};

export const executeTool = async (
  context: TaskExecutionContext,
  action: Action,
): Promise<string> => {
  const tools = await listAllTools(context);
  const tool = tools.find(
    (tool) => tool.nameForModel === action.plugin.nameForModel,
  );
  if (!tool) {
    throw new Error(`Tool not found: ${action.plugin}`);
  }
  if (tool.execute) {
    return tool.execute(context, action);
  }
  throw new Error(`invalid tool: ${action.plugin}`);
};
