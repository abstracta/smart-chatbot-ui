import { Conversation } from '@/types/chat';
import { Settings } from '@/types/settings';

import { DEFAULT_SYSTEM_PROMPT } from './const';
import { LlmID, LlmList, LlmTemperature } from '@/types/llm';
export interface CleaningFallback {
  temperature: LlmTemperature;
}

export const cleanSelectedConversation = (
  settings: Settings,
  conversation: Conversation,
) => {
  let updatedConversation = conversation;

  // check for model on each conversation
  if (!updatedConversation.model) {
    updatedConversation = {
      ...updatedConversation,
      model: updatedConversation.model || LlmList[LlmID.GPT_3_5],
    };
  }

  // check for system prompt on each conversation
  if (!updatedConversation.prompt) {
    updatedConversation = {
      ...updatedConversation,
      prompt: updatedConversation.prompt || DEFAULT_SYSTEM_PROMPT,
    };
  }

  if (!updatedConversation.temperature) {
    updatedConversation = {
      ...updatedConversation,
      temperature:
        updatedConversation.temperature || settings.defaultTemperature,
    };
  }

  if (!updatedConversation.folderId) {
    updatedConversation = {
      ...updatedConversation,
      folderId: updatedConversation.folderId || null,
    };
  }

  return updatedConversation;
};

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
        conversation.prompt = DEFAULT_SYSTEM_PROMPT;
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
