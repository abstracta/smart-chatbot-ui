import { useContext } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';

import { HomeUpdater } from '@/utils/app/homeUpdater';

import {
  ChatModeRunner,
  ChatModeRunnerParams,
} from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';
import useApiError from '@/services/useApiError';

export function useGoogleMode(): ChatModeRunner {
  const {
    state: {  },
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

      await conversationsAction.update(updatedConversation);
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
