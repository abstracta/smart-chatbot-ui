import { MutableRefObject, useContext } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';
import useApiError from '@/services/useApiError';

import { readEventStream } from '@/utils/app/clientstream';
import { createConversationNameFromMessage } from '@/utils/app/conversation';

import { ChatBody, ChatModeRunner, Conversation, Message, MessageUsage } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';
import { watchRefToAbort } from '@/utils/app/api';
import { getTiktokenEncoding } from '@/utils/server/tiktoken';
import { calculateMessagesTokens, getMessageContent } from '@/utils/server/message';
import { EventSourceParserStream } from 'eventsource-parser/stream'
import { TokenUsageCount } from '@/types/llmUsage';

export type ChatPluginParams = {
  body: ChatBody;
  message: Message;
  conversation: Conversation;
  selectedConversation: Conversation;
};

export function useDirectMode(
  stopConversationRef: MutableRefObject<boolean>,
): ChatModeRunner {
  const { dispatch: homeDispatch } = useContext(HomeContext);
  const apiService = useApiService();
  const [_, conversationsAction] = useConversations();
  const apiError = useApiError();
  let updatedConversation: Conversation;
  const controller = new AbortController();

  const mutation = useMutation({
    mutationFn: async (params: ChatPluginParams) => {
      return watchRefToAbort(
        stopConversationRef,
        (controller) => apiService.chat(params, controller.signal),
        controller);
    },
    onMutate: async () => {
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });
    },
    async onSuccess(response: any, variables) {
      const { body: data } = response;
      let {
        conversation,
        message,
      } = variables;
      updatedConversation = conversation;
      if (!data) {
        homeDispatch({ field: 'loading', value: false });
        homeDispatch({ field: 'messageIsStreaming', value: false });
        return;
      }
      if (updatedConversation.messages.length === 1) {
        const { content } = message;
        const customName = createConversationNameFromMessage(content);
        updatedConversation = {
          ...updatedConversation,
          name: customName,
        };
      }
      homeDispatch({ field: 'loading', value: false });

      const updateConversationResponse = (response: { message: string, usage?: MessageUsage }, newMessage = true) => {
        let updatedMessages: Message[];
        if (newMessage) {
          updatedMessages = [
            ...updatedConversation.messages,
            { role: 'assistant', content: response.message, ...(response.usage ? { usage: response.usage } : {}) },
          ];
        } else {
          updatedMessages = updatedConversation.messages.map(
            (message, index) => {
              if (index === updatedConversation.messages.length - 1) {
                return {
                  ...message,
                  content: response.message,
                  ...(response.usage ? { usage: response.usage } : {})
                };
              }
              return message;
            },
          );
        }
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
        };
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
      }

      if (response.headers.get("Content-Type") == "text/event-stream") {
        let isFirst = true;
        let streamContent = "";
        await readEventStream(
          data,
          controller,
          stopConversationRef,
          ({ event, data }) => {
            switch (event) {
              case "newToken": {
                streamContent += JSON.parse(data)
                updateConversationResponse({ message: streamContent }, isFirst);
                isFirst = false;
                break;
              }
              case "stats": {
                const { usage } = JSON.parse(data);
                updateConversationResponse({ message: streamContent, usage: usage }, isFirst);
                break;
              }
            }
          }
        );
      } else {
        const { message, usage } = await response.json();
        updateConversationResponse({ message: message, usage: usage });
      }

      await conversationsAction.update(updatedConversation);
      homeDispatch({ field: 'messageIsStreaming', value: false });
    },
    onError: async (error) => {
      console.log(error);
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      if (error instanceof DOMException && (error as DOMException).name === "AbortError") {
        updatedConversation && await conversationsAction.update(updatedConversation);
      } else {
        const errorMessage = await apiError.resolveResponseMessage(error);
        toast.error(errorMessage, { duration: 10000 });
      }
    },
  });
  return {
    run: (params: ChatPluginParams) => mutation.mutate(params),
  };
}
