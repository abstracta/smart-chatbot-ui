import cl100k from 'tiktoken/encoders/cl100k_base.json';
import p50k from 'tiktoken/encoders/p50k_base.json';
import { Tiktoken } from 'tiktoken/lite';
import { TiktokenModel, encoding_for_model } from 'tiktoken';
import claudeJson from '@anthropic-ai/tokenizer/claude.json';
import { LlmID } from '@/types/llm';

export const getTiktokenEncoding = (model: LlmID): Tiktoken => {
  if (
    [
      LlmID.CLAUDE_3_HAIKU_V1_AWS, LlmID.CLAUDE_3_SONNET_V1_AWS,
      LlmID.CLAUDE_2_AWS, LlmID.CLAUDE_INSTANT_AWS
    ].includes(model)) {
    return new Tiktoken(claudeJson.bpe_ranks, claudeJson.special_tokens, claudeJson.pat_str)
  }
  // Azure fix
  const modelId = model.replace('gpt-35', 'gpt-3.5')
  if (modelId.indexOf('text-davinci-') !== -1) {
    return new Tiktoken(p50k.bpe_ranks, p50k.special_tokens, p50k.pat_str);
  }
  if (modelId.indexOf('gpt-3.5') !== -1 || modelId.indexOf('gpt-4') !== -1) {
    return encoding_for_model(modelId as TiktokenModel, {
      '<|im_start|>': 100264,
      '<|im_end|>': 100265,
      '<|im_sep|>': 100266,
    });
  }
  return new Tiktoken(cl100k.bpe_ranks, cl100k.special_tokens, cl100k.pat_str);
};
