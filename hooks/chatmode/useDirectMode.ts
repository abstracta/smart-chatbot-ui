import { MutableRefObject, useContext } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';
import useApiError from '@/services/useApiError';

import { readStream } from '@/utils/app/clientstream';
import { createConversationNameFromMessage } from '@/utils/app/conversation';

import { ChatBody, ChatModeRunner, Conversation, Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';
import { watchRefToAbort } from '@/utils/app/api';

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
      let isFirst = true;
      let streamContent = "";
      await readStream(
        data,
        controller,
        stopConversationRef,
        (chunk) => {
          streamContent += chunk
          let updatedMessages: Message[];
          if (isFirst) {
            isFirst = false;
            updatedMessages = [
              ...updatedConversation.messages,
              { role: 'assistant', content: chunk },
            ];
          } else {
            updatedMessages = updatedConversation.messages.map(
              (message, index) => {
                if (index === updatedConversation.messages.length - 1) {
                  return {
                    ...message,
                    content: streamContent,
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
      );

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
