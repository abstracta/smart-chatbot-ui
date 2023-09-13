import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trpc } from '@/utils/trpc';

import { OpenAIModels } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { v4 as uuidv4 } from 'uuid';
import { updateOrInsertItem } from '@/utils/app/arrays';

type PromptsAction = {
  update: (newState: Prompt) => Promise<Prompt>;
  updateAll: (newState: Prompt[]) => Promise<Prompt[]>;
  add: () => Promise<Prompt>;
  remove: (prompt: Prompt) => Promise<Prompt[]>;
};

export default function usePrompts(): [Prompt[], PromptsAction] {
  const { t: tErr } = useTranslation('error');
  const {
    state: { defaultModelId, prompts },
    dispatch,
  } = useContext(HomeContext);
  const trpcContext = trpc.useContext();
  const promptsListQuery = trpc.prompts.list.useQuery();

  const promptsUpdateAll = trpc.prompts.updateAll.useMutation({
    onMutate: async (prompts: Prompt[]) => {
      const promptsQuery = trpcContext.prompts.list;
      await promptsQuery.cancel();
      const previousPrompts = promptsQuery.getData();
      promptsQuery.setData(undefined, prompts);
      return { previousPrompts };
    },
    onError: (err, input, context) => {
      trpcContext.prompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.prompts.list.invalidate();
    },
  });

  const promptsUpdate = trpc.prompts.update.useMutation({
    onMutate: async (prompt: Prompt) => {
      const promptsQuery = trpcContext.prompts.list;
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
      trpcContext.prompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.prompts.list.invalidate();
    },
  });

  const promptRemove = trpc.prompts.remove.useMutation({
    onMutate: async ({ id }) => {
      const promptsQuery = trpcContext.prompts.list;
      await promptsQuery.cancel();
      const previousPrompts = promptsQuery.getData();
      promptsQuery.setData(undefined,
        (oldQueryData: Prompt[] | undefined) =>
          oldQueryData && oldQueryData.filter(
            (c) => c.id !== id,
          )
      );
      return { previousPrompts };
    },
    onError: (err, input, context) => {
      trpcContext.prompts.list.setData(undefined, context?.previousPrompts);
    },
    onSettled: () => {
      trpcContext.prompts.list.invalidate();
    },
  });

  const updateAll = useCallback(
    async (updated: Prompt[]): Promise<Prompt[]> => {
      await promptsUpdateAll.mutateAsync(updated);
      return updated;
    },
    [dispatch, promptsUpdateAll],
  );

  const add = useCallback(async () => {
    if (!defaultModelId) {
      const err = tErr('No Default Model');
      throw new Error(err);
    }
    const newPrompt: Prompt = {
      id: uuidv4(),
      name: `Prompt ${(promptsListQuery.data?.length || 0) + 1}`,
      description: '',
      content: '',
      model: OpenAIModels[defaultModelId],
      folderId: null,
    };
    await promptsUpdate.mutateAsync(newPrompt);
    return newPrompt;
  }, [defaultModelId, dispatch, promptsUpdate, tErr, promptsListQuery.data]);

  const update = useCallback(
    async (prompt: Prompt) => {
      await promptsUpdate.mutateAsync(prompt);
      return prompt;
    },
    [dispatch, promptsUpdate],
  );

  const remove = useCallback(
    async (prompt: Prompt) => {
      await promptRemove.mutateAsync({ id: prompt.id });
      return prompts.filter((f) => f.id !== prompt.id);
    },
    [dispatch, promptRemove, prompts],
  );

  return [
    prompts,
    {
      add,
      update,
      updateAll,
      remove,
    },
  ];
}
