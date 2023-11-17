import { Conversation } from '@/types/chat';
import { LlmID, LlmList, LlmTemperature } from '@/types/llm';
export interface CleaningFallback {
  temperature: LlmTemperature;
  defaultSystemPrompt: string;
}

export const cleanConversationHistory = (
  history: any[],
  fallback: CleaningFallback,
): Conversation[] => {
  if (!Array.isArray(history)) {
    console.warn('history is not an array. Returning an empty array.');
    return [];
  }

  return history.reduce((acc: any[], conversation) => {
    try {
      if (!conversation.model) {
        conversation.model = LlmList[LlmID.GPT_3_5];
      }

      if (!conversation.prompt) {
        conversation.prompt = fallback.defaultSystemPrompt;
      }

      if (!conversation.temperature) {
        conversation.temperature = fallback.temperature;
      }

      if (!conversation.folderId) {
        conversation.folderId = null;
      }

      acc.push(conversation);
      return acc;
    } catch (error) {
      console.warn(
        `error while cleaning conversations' history. Removing culprit`,
        error,
      );
    }
    return acc;
  }, []);
};
