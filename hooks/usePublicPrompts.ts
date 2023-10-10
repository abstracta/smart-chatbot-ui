import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trpc } from '@/utils/trpc';

import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';
import { updateOrInsertItem } from '@/utils/app/arrays';

type PublicPromptsAction = {
  update: (newState: Prompt) => Promise<Prompt>;
  add: (prompt: Prompt) => Promise<Prompt>;
  remove: (prompt: Prompt) => Promise<Prompt[]>;
  increaseUsage: (prompt: Prompt) => Promise<Prompt>;
};

export default function usePublicPrompts(): [Prompt[], PublicPromptsAction] {
  const { t: tErr } = useTranslation('error');
  const {
    state: { defaultModelId, publicPrompts },
    dispatch,
  } = useContext(HomeContext);
  const trpcContext = trpc.useContext();
  const promptsAdd = trpc.publicPrompts.add.useMutation({
    onMutate: async (prompt: Prompt) => {
      const promptsQuery = trpcContext.publicPrompts.list;
      await promptsQuery.cancel();
      const previousPrompts = promptsQuery.getData();
      promptsQuery.setData(undefined,
        (oldQueryData: Prompt[] | undefined) => {
          if (!oldQueryData || oldQueryData.length == 0) return [prompt]
          else return [...oldQueryData, prompt]
            .sort((a, b) => a.name > b.name ? 1 : -1);
        });
      return { previousPrompts };
    },
    onError: (err, input, context) => {
      trpcContext.publicPrompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.publicPrompts.list.invalidate();
    },
  });
  const promptsUpdate = trpc.publicPrompts.update.useMutation({
    onMutate: async (prompt: Prompt) => {
      const promptsQuery = trpcContext.publicPrompts.list;
      await promptsQuery.cancel();
      const previousPrompts = promptsQuery.getData();
      promptsQuery.setData(undefined,
        (oldQueryData: Prompt[] | undefined) =>
          updateOrInsertItem(oldQueryData, prompt, (a, b) => a.id == b.id)
            .sort((a, b) => a.name > b.name ? 1 : -1)
      );
      return { previousPrompts };
    },
    onError: (err, input, context) => {
      trpcContext.publicPrompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.publicPrompts.list.invalidate();
    },
  });
  const promptsIncreaseUsage = trpc.publicPrompts.increaseUsageCount.useMutation({
    onMutate: async ({ id }) => {
      const promptsQuery = trpcContext.publicPrompts.list;
      await promptsQuery.cancel();
      const previousPrompts = promptsQuery.getData();
      promptsQuery.setData(undefined,
        (oldQueryData: Prompt[] | undefined) => {
          const prompt = oldQueryData?.find(p => p.id == id);
          if (prompt) {
            return updateOrInsertItem(oldQueryData, prompt, (a, b) => a.id == b.id)
              .sort((a, b) => a.name > b.name ? 1 : -1)
          }
          return oldQueryData;
        }
      );
      return { previousPrompts };
    },
    onError: (err, input, context) => {
      trpcContext.publicPrompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.publicPrompts.list.invalidate();
    },
  });
  const promptRemove = trpc.publicPrompts.remove.useMutation({
    onMutate: async ({ id }) => {
      const promptsQuery = trpcContext.publicPrompts.list;
      await promptsQuery.cancel();
      const previousPrompts = promptsQuery.getData();
      promptsQuery.setData(undefined,
        (oldQueryData: Prompt[] | undefined) => {
          return oldQueryData?.filter((f) => f.id !== id) || []
        });
      return { previousPrompts };
    },
    onError: (err, input, context) => {
      trpcContext.publicPrompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.publicPrompts.list.invalidate();
    },
  });

  const add = useCallback(async (prompt: Prompt) => {
    if (!defaultModelId) {
      const err = tErr('No Default Model');
      throw new Error(err);
    }
    await promptsAdd.mutateAsync(prompt);
    return prompt;
  }, [defaultModelId, dispatch, promptsAdd, tErr]);

  const update = useCallback(
    async (prompt: Prompt) => {
      await promptsUpdate.mutateAsync(prompt);
      return prompt;
    },
    [dispatch, promptsUpdate],
  );

  const increaseUsage = useCallback(
    async (prompt: Prompt) => {
      await promptsIncreaseUsage.mutateAsync(prompt);
      return prompt;
    },
    [dispatch, promptsUpdate],
  );

  const remove = useCallback(
    async (prompt: Prompt) => {
      await promptRemove.mutateAsync({ id: prompt.id });
      return publicPrompts.filter((f) => f.id !== prompt.id);
    },
    [dispatch, promptRemove, publicPrompts],
  );

  return [
    publicPrompts,
    {
      add,
      update,
      remove,
      increaseUsage,
    },
  ];
}
