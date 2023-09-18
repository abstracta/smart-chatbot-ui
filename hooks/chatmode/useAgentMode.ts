import { MutableRefObject, useContext } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useMutation } from 'react-query';

import useApiService from '@/services/useApiService';

import { watchRefToAbort } from '@/utils/app/api';
import { createConversationNameFromMessage } from '@/utils/app/conversation';
import { HomeUpdater } from '@/utils/app/homeUpdater';

import { Answer, PlanningResponse, PluginResult } from '@/types/agent';
import {
  ChatModeRunner,
  ChatModeRunnerParams,
  Conversation,
} from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import useConversations from '../useConversations';
import useApiError from '@/services/useApiError';

export function useAgentMode(
  conversations: Conversation[],
  stopConversationRef: MutableRefObject<boolean>,
  conversational: boolean,
): ChatModeRunner {
  const { t } = useTranslation('chat');

  const { dispatch: homeDispatch } = useContext(HomeContext);
  const apiService = useApiService();
  const apiError = useApiError();
  const [_, conversationsAction] = useConversations();

  const updater = new HomeUpdater(homeDispatch);
  const mutation = useMutation({
    mutationFn: async (params: ChatModeRunnerParams): Promise<Answer> => {
      let planningCount = 0;
      let toolActionResults: PluginResult[] = [];
      let taskId: string | undefined = undefined;
      while (true) {
        if (planningCount > 5) {
          // todo: handle this
          return { type: 'answer', answer: t('No Result') };
        }
        let planningResponse: PlanningResponse | null = null;
        if (conversational) {
          planningResponse = await watchRefToAbort(
            stopConversationRef,
            (controller) =>
              apiService.planningConv(
                {
                  taskId,
                  model: params.body.model,
                  messages: params.body.messages,
                  pluginResults: toolActionResults,
                  enabledToolNames: params.plugins.map((p) => p.nameForModel),
                },
                controller.signal,
              ),
          );
        } else {
          planningResponse = await watchRefToAbort(
            stopConversationRef,
            (controller) =>
              apiService.planning(
                {
                  taskId,
                  model: params.body.model,
                  messages: params.body.messages,
                  pluginResults: toolActionResults,
                  enabledToolNames: params.plugins.map((p) => p.nameForModel),
                },
                controller.signal,
              ),
          );
        }
        taskId = planningResponse.taskId;
        const { result } = planningResponse;
        if (result.type === 'action') {
          planningCount++;
          const tool = result.plugin;
          if (tool.displayForUser) {
            const simpleQuery =
              result.pluginInput.length < 100 &&
              result.pluginInput.match(/^[\[\{}]]/) === null;
            let content = `${tool.nameForHuman} ${t('executing...')}`;
            if (simpleQuery) {
              content = `${tool.nameForHuman} ${t('executing...')} - ${
                result.pluginInput
              }`;
            }
            params.conversation = updater.addMessage(params.conversation, {
              role: 'assistant',
              content,
            });
          }
          const actinoResult = await apiService.runPlugin({
            taskId,
            model: params.body.model,
            input: result.pluginInput,
            action: result,
          });
          toolActionResults.push(actinoResult);
        } else {
          return { type: 'answer', answer: result.answer };
        }
        if (stopConversationRef.current === true) {
          stopConversationRef.current = false;
          return { type: 'answer', answer: t('Conversation stopped') };
        }
      }
    },
    onMutate: async (variables) => {
      let conversation = variables.conversation;
      if (conversation.messages.length === 1) {
        conversation.name = createConversationNameFromMessage(
          variables.message.content,
        );
      }
      homeDispatch({
        field: 'selectedConversation',
        value: conversation,
      });
      homeDispatch({ field: 'loading', value: true });
      homeDispatch({ field: 'messageIsStreaming', value: true });
    },
    async onSuccess(answer: Answer, variables, context) {
      let { conversation: updatedConversation, selectedConversation } =
        variables;

      updatedConversation = updater.addMessage(updatedConversation, {
        role: 'assistant',
        content: answer.answer,
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.error(t('Conversation stopped'));
      } else {
        const errorMessage = await apiError.resolveResponseMessage(error);
        toast.error(errorMessage, { duration: 10000 });
      }
    },
  });

  return {
    run: (params: ChatModeRunnerParams) => {
      mutation.mutate(params);
    },
  };
}
