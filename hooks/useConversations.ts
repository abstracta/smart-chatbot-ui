import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { trpc } from '@/utils/trpc';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';

import HomeContext from '@/pages/api/home/home.context';

import { v4 as uuidv4 } from 'uuid';
import { updateOrInsertItem } from '@/utils/app/arrays';

type ConversationsAction = {
  update: (newState: Conversation) => Promise<Conversation>;
  updateValue: (
    conversation: Conversation,
    kv: KeyValuePair,
  ) => Promise<Conversation>;
  updateAll: (newState: Conversation[]) => Promise<Conversation[]>;
  add: () => Promise<Conversation>;
  clear: () => Promise<Conversation[]>;
  remove: (conversation: Conversation) => Promise<Conversation[]>;
};

export default function useConversations(): [
  Conversation[],
  ConversationsAction,
] {
  const { t } = useTranslation('chat');
  const trpcContext = trpc.useContext();

  const conversationUpdateAll = trpc.conversations.updateAll.useMutation({
    onMutate: async (updatedConversations: Conversation[]) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, updatedConversations);
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
    },
  });

  const conversationAdd = trpc.conversations.update.useMutation({
    onMutate: async (conversation: Conversation) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: Conversation[] | undefined) =>
          [conversation, ...(oldQueryData || [])]
      );
      const previousConversation = selectedConversation;
      dispatch({ field: 'selectedConversation', value: conversation });
      return { previousData, previousConversation };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
      dispatch({ field: 'selectedConversation', value: context?.previousConversation });
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
    },
  });

  const conversationUpdate = trpc.conversations.update.useMutation({
    onMutate: async (conversation: Conversation) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: Conversation[] | undefined) =>
          updateOrInsertItem(oldQueryData, conversation, (a, b) => a.id == b.id, false)
      );
      let previousConversation;
      if (selectedConversation?.id === conversation.id) {
        previousConversation = selectedConversation;
        dispatch({ field: 'selectedConversation', value: conversation });
      }
      return { previousData, previousConversation };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
      context?.previousConversation &&
        dispatch({ field: 'selectedConversation', value: context?.previousConversation });
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
    },
  });

  const conversationRemove = trpc.conversations.remove.useMutation({
    onMutate: async ({ id }) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: Conversation[] | undefined) =>
          oldQueryData && oldQueryData.filter(
            (c) => c.id !== id,
          )
      );
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
    },
  });

  const conversationRemoveAll = trpc.conversations.removeAll.useMutation({
    onMutate: async () => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, []);
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
    },
  });

  const {
    state: { defaultModelId, conversations, selectedConversation, settings, models },
    dispatch,
  } = useContext(HomeContext);

  const updateAll = useCallback(
    async (updated: Conversation[]): Promise<Conversation[]> => {
      await conversationUpdateAll.mutateAsync(updated);
      return updated;
    },
    [conversationUpdateAll, dispatch],
  );

  const add = useCallback(async () => {
    if (!defaultModelId) {
      throw new Error('No default model');
    }

    const lastConversation = conversations[conversations.length - 1];
    const newConversation: Conversation = {
      id: uuidv4(),
      name: `${t('New Conversation')}`,
      messages: [],
      model: lastConversation?.model || models.find(m => m.id == defaultModelId),
      prompt: t(DEFAULT_SYSTEM_PROMPT),
      temperature: settings.defaultTemperature,
      folderId: null,
    };

    await conversationAdd.mutateAsync(newConversation);
    return newConversation;
  }, [
    conversationAdd,
    conversations,
    defaultModelId,
    dispatch,
    settings.defaultTemperature,
    t,
  ]);

  const update = useCallback(
    async (conversation: Conversation) => {
      await conversationUpdate.mutateAsync(conversation);
      return conversation;
    },
    [conversationUpdate, dispatch, selectedConversation?.id],
  );

  const updateValue = useCallback(
    async (conversation: Conversation, kv: KeyValuePair) => {
      const updatedConversation = {
        ...conversation,
        [kv.key]: kv.value,
      };
      return await update(updatedConversation);
    },
    [dispatch, update],
  );

  const remove = useCallback(
    async (conversation: Conversation) => {
      await conversationRemove.mutateAsync({ id: conversation.id });
      return conversations.filter(
        (c) => c.id !== conversation.id,
      );;
    },
    [conversationRemove, conversations, dispatch],
  );

  const clear = useCallback(async () => {
    await conversationRemoveAll.mutateAsync();
    return [];
  }, [conversationRemoveAll, dispatch]);

  return [
    conversations,
    {
      add,
      update,
      updateValue,
      updateAll,
      remove,
      clear,
    },
  ];
}
