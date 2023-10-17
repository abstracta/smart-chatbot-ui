import { serializeMessages } from '@/utils/server/message';

import { Message } from '@/types/chat';

import { Tiktoken } from 'tiktoken';
import chalk from 'chalk';
import { BaseCallbackHandler } from 'langchain/callbacks';
import { LLMResult } from 'langchain/schema';
import { Serialized } from 'langchain/dist/load/serializable';
import { Llm } from '@/types/llm';

const strip = (str: string, c: string) => {
  const m = str.match(new RegExp(`^${c}(.*)${c}$`));
  if (m) {
    return m[1];
  }
  return str;
};

export const stripQuotes = (str: string) => {
  return strip(strip(str, '"'), "'");
};

export class DebugCallbackHandler extends BaseCallbackHandler {
  name: string;
  alwaysVerbose: boolean = true;
  llmStartTime: number = 0;
  constructor() {
    super()
    this.name = "Debug"
  }
  async handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
  ): Promise<void> {
    this.llmStartTime = Date.now();
    console.log(chalk.greenBright('handleLLMStart ============'));
    console.log(prompts[0]);
    console.log('');
  }
  async handleLLMEnd(output: LLMResult, runId: string) {
    const duration = Date.now() - this.llmStartTime;
    console.log(chalk.greenBright('handleLLMEnd =============='));
    console.log(`ellapsed: ${duration / 1000} sec.`);
    console.log(output.generations[0][0].text);
    console.log('');
  }
  async handleText(text: string): Promise<void> {
    console.log(chalk.greenBright('handleText =========='));
    console.log(text);
    console.log('');
  }
}

export const createAgentHistory = (
  encoding: Tiktoken,
  model: Llm,
  maxSize: number,
  messages: Message[],
): Message[] => {
  let result: Message[] = [];
  for (const msg of messages.reverse()) {
    const serialized = serializeMessages(model.id, [...result, msg]);
    const length = encoding.encode(serialized, 'all').length;
    if (length > maxSize) {
      break;
    }
    result.push(msg);
  }
  return result.reverse();
};

export const messagesToOpenAIMessages = (
  messages: Message[],
): Message[] => {
  return messages.map((msg) => {
    return {
      role: msg.role,
      content: msg.content,
    };
  });
};
