import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';

import { HomeUpdater } from '@/utils/app/homeUpdater';

import {
  ChatModeRunner,
  ChatModeRunnerParams,
  Conversation,
} from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';
import useApiError from '@/services/useApiError';

export function useGoogleMode(conversations: Conversation[]): ChatModeRunner {
  const {
    state: { chatModeKeys },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const apiService = useApiService();
  const apiError = useApiError();
  const [_, conversationsAction] = useConversations();
  const updater = new HomeUpdater(homeDispatch);
  const mutation = useMutation({
    mutationFn: async (params: ChatModeRunnerParams) => {
      return apiService.googleSearch(params);
    },
    onMutate: async (variables) => {
      variables.body.googleAPIKey = chatModeKeys
        .find((key) => key.chatModeId === 'google-search')
        ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value;
      variables.body.googleCSEId = chatModeKeys
        .find((key) => key.chatModeId === 'google-search')
        ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value;
      homeDispatch({
        field: 'selectedConversation',
        value: variables.conversation,
      });
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });
    },
    async onSuccess(response: any, variables, context) {
      let { conversation: updatedConversation, selectedConversation } =
        variables;

      const { answer } = await response.json();
      updatedConversation = updater.addMessage(updatedConversation, {
        role: 'assistant',
        content: answer,
      });
      const updatedConversations: Conversation[] = conversations.map(
        (conversation) => {
          if (conversation.id === selectedConversation.id) {
            return updatedConversation;
          }
          return conversation;
        },
      );
      if (updatedConversations.length === 0) {
        updatedConversations.push(updatedConversation);
      }
      await conversationsAction.updateAll(updatedConversations);
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
    },
    onError: async (error) => {
      homeDispatch({ field: 'loading', value: false });
      homeDispatch({ field: 'messageIsStreaming', value: false });
      const errorMessage = await apiError.resolveResponseMessage(error);
      toast.error(errorMessage, { duration: 10000 });
    },
  });

  return {
    run: (params: ChatModeRunnerParams) => {
      mutation.mutate(params);
    },
  };
}
