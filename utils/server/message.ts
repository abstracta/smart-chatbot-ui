import { Message } from '@/types/chat';
import { Llm, LlmID, LlmList, LlmType } from '@/types/llm';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { Tiktoken } from 'tiktoken';
import { getTiktokenEncoding } from './tiktoken';

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
    let encodedLength = calculateMessagesTokens(model.id, serializingMessages, encoding);
    if (encodedLength + reservedForCompletion > model.tokenLimit) {
      break;
    }
    contentLength = encodedLength;
    messagesToSend = [message, ...messagesToSend];
  }
  const maxToken = model.tokenLimit - contentLength;
  return {
    messages: [systemPromptMessage, ...messagesToSend],
    maxToken, tokenCount: contentLength
  };
};

export function calculateMessagesTokens(modelId: LlmID, messages: Message[], encoding?: Tiktoken) {
  if (!encoding) encoding = getTiktokenEncoding(modelId);
  const serialized = serializeMessages(modelId, messages);
  return encoding.encode(serialized, 'all').length;
}

// Borrow from:
// https://github.com/dqbd/tiktoken/issues/23#issuecomment-1483317174
export function serializeMessages(modelId: LlmID, messages: Message[]): string {
  const isOAIChat = modelId in LlmList && modelId.toLocaleLowerCase().includes("gpt") ?
    LlmList[modelId].type == LlmType.CHAT : false;
  const msgSep = isOAIChat ? '\n' : '';
  const roleSep = isOAIChat ? '\n' : '<|im_sep|>';
  return [
    messages
      .map((message) => {
        return `<|im_start|>${message.role}${roleSep}${getMessageContent(message)}<|im_end|>`;
      })
      .join(msgSep),
    `<|im_start|>assistant${roleSep}`,
  ].join(msgSep);
}

export function getMessageContent(message: Message) {
  return [
    message.content,
    ...[...message.attachments?.map(a =>
      `The following text between <<< and >>> are the contents of the file attachment named ${a.name}:
      <<< ${atob(a.content)} >>>`
    ) || []]
  ].join("\n\n")
}

export function mapMessageToLangchainMessage(messages: Message[]): BaseMessage[] {
  return messages.map((m) => {
    const content = getMessageContent(m);
    if (m.role == "user") return new HumanMessage(content);
    else if (m.role == "assistant") return new AIMessage(content);
    else if (m.role == "system") return new SystemMessage(content);
    else return new HumanMessage(content);
  })
}
