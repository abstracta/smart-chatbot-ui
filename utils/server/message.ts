import { Message } from '@/types/chat';
import { Llm, LlmID, LlmList, LlmType } from '@/types/llm';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { Tiktoken } from 'tiktoken';

export const createMessagesToSend = (
  encoding: Tiktoken,
  model: Llm,
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
    const serialized = serializeMessages(model.id, serializingMessages);
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
export function serializeMessages(modelId: LlmID, messages: Message[]): string {
  const isChat = LlmList[modelId].type == LlmType.CHAT;
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

export function mapMessageToLangchainMessage(messages: Message[]): BaseMessage[] {
  return messages.map(({ role, content }) => {
    if (role == "user") return new HumanMessage(content);
    else if (role == "assistant") return new AIMessage(content);
    else if (role == "system") return new SystemMessage(content);
    else return new HumanMessage(content);
  })
}
