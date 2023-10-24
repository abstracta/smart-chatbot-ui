import { MutableRefObject, useContext } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';
import useApiError from '@/services/useApiError';

import { updateConversationFromStream } from '@/utils/app/clientstream';
import { createConversationNameFromMessage } from '@/utils/app/conversation';

import { ChatBody, ChatModeRunner, Conversation, Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';

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

  const mutation = useMutation({
    mutationFn: async (params: ChatPluginParams) => {
      return apiService.chat(params);
    },
    onMutate: async (variables) => {
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });
    },
    async onSuccess(response: any, variables, context) {
      const { body: data } = response;
      let {
        conversation: updatedConversation,
        message,
      } = variables;
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
      updatedConversation = await updateConversationFromStream(
        data,
        // controller,
        new AbortController(),
        homeDispatch,
        updatedConversation,
        stopConversationRef,
      );
      stopConversationRef.current = false;
      await conversationsAction.update(updatedConversation);
      homeDispatch({ field: 'messageIsStreaming', value: false });
    },
    onError: async (error) => {
      console.log(error);
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      const errorMessage = await apiError.resolveResponseMessage(error);
      toast.error(errorMessage, { duration: 10000 });
    },
  });
  return {
    run: (params: ChatPluginParams) => mutation.mutate(params),
  };
}
