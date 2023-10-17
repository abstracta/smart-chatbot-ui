import { describe, expect, it } from 'vitest'
import { Message } from '@/types/chat';

import { createMessagesToSend } from './message';
import { getTiktokenEncoding } from './tiktoken';
import { Llm, LlmID, LlmType } from '@/types/llm';

describe('createMessagesToSend', () => {
  it('should create messages to send and return max token', async () => {
    const encoding = getTiktokenEncoding(LlmID.GPT_3_5);
    const systemPrompt = 'Hello';
    const model: Llm = {
      id: LlmID.GPT_3_5,
      name: 'gpt-3.5-turbo',
      tokenLimit: 1100,
      maxLength: 4000,
      type: LlmType.CHAT
    }
    const messages: Message[] = [
      { role: 'user', content: 'World' },
      { role: 'assistant', content: 'How are you?' },
      { role: 'user', content: 'Fine, thank you.' },
    ];

    const result = createMessagesToSend(
      encoding,
      model,
      systemPrompt,
      100,
      messages,
    );

    expect(result.messages[0]).toEqual({ role: 'user', content: 'World' });
    expect(result.maxToken).toEqual(1066);
  });
})