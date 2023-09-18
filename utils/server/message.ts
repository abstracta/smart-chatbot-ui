import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { Tiktoken } from 'tiktoken';

export const createMessagesToSend = (
  encoding: Tiktoken,
  model: OpenAIModel,
  systemPrompt: string,
  reservedForCompletion: number,
  messages: Message[],
): { messages: Message[]; maxToken: number; tokenCount: number } => {
  let messagesToSend: Message[] = [];
  const systemPromptMessage: Message = {
    role: 'system',
    content: systemPrompt,
  };

  let contentLength: number = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const serializingMessages = [
      systemPromptMessage,
      ...messagesToSend,
      message,
    ];
    const serialized = serializeMessages(model.name, serializingMessages);
    let encodedLength = encoding.encode(serialized, 'all').length;
    if (encodedLength + reservedForCompletion > model.tokenLimit) {
      break;
    }
    contentLength = encodedLength;
    messagesToSend = [message, ...messagesToSend];
  }
  const maxToken = model.tokenLimit - contentLength;
  return { messages: messagesToSend, maxToken, tokenCount: contentLength };
};

// Borrow from:
// https://github.com/dqbd/tiktoken/issues/23#issuecomment-1483317174
export function serializeMessages(model: string, messages: Message[]): string {
  const isChat =
    model.indexOf('gpt-3.5-turbo') !== -1 || model.indexOf('gpt-4') !== -1;
  const msgSep = isChat ? '\n' : '';
  const roleSep = isChat ? '\n' : '<|im_sep|>';
  return [
    messages
      .map(({ role, content }) => {
        return `<|im_start|>${role}${roleSep}${content}<|im_end|>`;
      })
      .join(msgSep),
    `<|im_start|>assistant${roleSep}`,
  ].join(msgSep);
}
