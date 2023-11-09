import { useCallback, useContext } from 'react';
import { useTranslation } from 'next-i18next';

import { trpc } from '@/utils/trpc';

import { Conversation, ConversationListing } from '@/types/chat';
import { KeyValuePair } from '@/types/data';

import HomeContext from '@/pages/api/home/home.context';

import { v4 as uuidv4 } from 'uuid';
import { updateOrInsertItem } from '@/utils/app/arrays';

type ConversationsAction = {
  update: (newState: Conversation | ConversationListing) => Promise<ConversationListing>;
  updateValue: (
    conversation: Conversation | ConversationListing,
    kv: KeyValuePair,
  ) => Promise<Conversation | ConversationListing>;
  updateAll: (newState: (Conversation | ConversationListing)[]) => Promise<(Conversation | ConversationListing)[]>;
  add: () => Promise<Conversation>;
  clear: () => Promise<ConversationListing[]>;
  remove: (conversationId: Conversation["id"]) => Promise<ConversationListing[]>;
};

export default function useConversations(): [
  ConversationListing[],
  ConversationsAction,
] {
  const { t } = useTranslation('chat');
  const trpcContext = trpc.useContext();

  const conversationUpdateAll = trpc.conversations.updateAll.useMutation({
    onMutate: async (updatedConversations: (Conversation | ConversationListing)[]) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, updatedConversations as ConversationListing[]);
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
    onMutate: async (conversation: Conversation | ConversationListing) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: ConversationListing[] | undefined) =>
          [conversation, ...(oldQueryData || [])]
      );
      const previousConversationId = selectedConversationId;
      dispatch({ field: 'selectedConversationId', value: conversation.id });
      dispatch({ field: 'selectedConversation', value: conversation });
      return { previousData, previousConversationId };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
      dispatch({ field: 'selectedConversationId', value: context?.previousConversationId });
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
      trpcContext.conversations.get.invalidate();
    },
  });

  const conversationUpdate = trpc.conversations.update.useMutation({
    onMutate: async (conversation: Conversation | ConversationListing) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: ConversationListing[] | undefined) =>
          updateOrInsertItem(oldQueryData, conversation, (a, b) => a.id == b.id, false)
      );
      let previousConversationId;
      if (selectedConversationId === conversation.id) {
        previousConversationId = selectedConversationId;
        dispatch({ field: 'selectedConversationId', value: conversation.id });
      }
      return { previousData, previousConversationId };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
      context?.previousConversationId &&
        dispatch({ field: 'selectedConversationId', value: context?.previousConversationId });
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
      trpcContext.conversations.get.invalidate();
    },
  });

  const conversationRemove = trpc.conversations.remove.useMutation({
    onMutate: async ({ id }) => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      let newData: ConversationListing[] = [];
      listQuery.setData(undefined,
        (oldQueryData: ConversationListing[] | undefined) =>
          newData = oldQueryData && oldQueryData.filter(
            (c) => c.id !== id,
          ) as ConversationListing[] || []
      );
      let previousConversationId = selectedConversationId;
      const newConversation = newData.length && newData[0] || buildNewConversation();
      dispatch({ field: 'selectedConversationId', value: newConversation.id });
      return { previousData, previousConversationId };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
      dispatch({ field: 'selectedConversationId', value: context?.previousConversationId });
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
      trpcContext.conversations.get.invalidate();
    },
  });

  const conversationRemoveAll = trpc.conversations.removeAll.useMutation({
    onMutate: async () => {
      const listQuery = trpcContext.conversations.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, []);
      let previousConversationId = selectedConversationId;
      const newConversation = buildNewConversation();
      dispatch({ field: 'selectedConversationId', value: newConversation.id });
      return { previousData, previousConversationId };
    },
    onError: (err, input, context) => {
      trpcContext.conversations.list.setData(undefined, context?.previousData);
      dispatch({ field: 'selectedConversationId', value: context?.previousConversationId });
    },
    onSettled: () => {
      trpcContext.conversations.list.invalidate();
      trpcContext.conversations.get.invalidate();
    },
  });

  const {
    state: { defaultModelId, conversations, selectedConversationId, settings, models, defaultSystemPrompt },
    dispatch,
  } = useContext(HomeContext);

  const buildNewConversation = (): Conversation => {
    return {
      id: uuidv4(),
      name: `${t('New Conversation')}`,
      messages: [],
      model: models.find(m => m.id == defaultModelId)!,
      prompt: defaultSystemPrompt,
      temperature: settings.defaultTemperature,
      folderId: null,
    };
  }

  const updateAll = useCallback(
    async (updated: (Conversation | ConversationListing)[]): Promise<(Conversation | ConversationListing)[]> => {
      await conversationUpdateAll.mutateAsync(updated);
      return updated;
    },
    [conversationUpdateAll, dispatch],
  );

  const add = useCallback(async () => {
    if (!defaultModelId) {
      throw new Error('No default model');
    }

    const newConversation = buildNewConversation();
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
    async (conversation: Conversation | ConversationListing) => {
      await conversationUpdate.mutateAsync(conversation);
      return conversation;
    },
    [conversationUpdate, dispatch],
  );

  const updateValue = useCallback(
    async (conversation: Conversation | ConversationListing, kv: KeyValuePair) => {
      const updatedConversation = {
        ...conversation,
        [kv.key]: kv.value,
      };
      return await update(updatedConversation);
    },
    [dispatch, update],
  );

  const remove = useCallback(
    async (conversationId: Conversation["id"]) => {
      await conversationRemove.mutateAsync({ id: conversationId });
      return conversations.filter(
        (c) => c.id !== conversationId,
      );
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
