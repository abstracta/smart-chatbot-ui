import { useContext } from 'react';

import { Plugin } from '@/types/agent';
import { ChatBody, Conversation, Message } from '@/types/chat';
import { ChatMode } from '@/types/chatmode';

import HomeContext from '@/pages/api/home/home.context';

import { useChatModeRunner } from './chatmode/useChatModeRunner';

export const useMesseageSender = () => {
  const {
    state: { selectedConversation },
  } = useContext(HomeContext);

  const chatModeSelector = useChatModeRunner();

  return async (
    message: Message,
    deleteCount = 0,
    chatMode: ChatMode | null = null,
    plugins: Plugin[] = [],
  ) => {
    if (!selectedConversation) {
      return;
    }
    const conversation = selectedConversation;
    let updatedConversation: Conversation;
    if (deleteCount) {
      const updatedMessages = [...conversation.messages];
      for (let i = 0; i < deleteCount; i++) {
        updatedMessages.pop();
      }
      updatedConversation = {
        ...conversation,
        messages: [...updatedMessages, message],
      };
    } else {
      updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, message],
      };
    }
    const chatBody: ChatBody = {
      modelId: updatedConversation.model.id,
      messages: updatedConversation.messages,
      prompt: conversation.prompt,
      temperature: conversation.temperature,
    };
    const chatModeRunner = chatModeSelector(chatMode);
    chatModeRunner.run({
      body: chatBody,
      conversation: updatedConversation,
      message,
      selectedConversation,
      plugins,
    });
  };
};

export default useMesseageSender;
