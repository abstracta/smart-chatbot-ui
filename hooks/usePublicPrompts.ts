import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { trpc } from '@/utils/trpc';

import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

type PublicPromptsAction = {
  update: (newState: Prompt) => Promise<Prompt[]>;
  add: (prompt: Prompt) => Promise<Prompt[]>;
  remove: (prompt: Prompt) => Promise<Prompt[]>;
};

export default function usePublicPrompts(): [Prompt[], PublicPromptsAction] {
  const { t: tErr } = useTranslation('error');
  const {
    state: { defaultModelId, publicPrompts },
    dispatch,
  } = useContext(HomeContext);
  const promptsAdd = trpc.publicPrompts.add.useMutation();
  const promptsUpdate = trpc.publicPrompts.update.useMutation();
  const promptRemove = trpc.publicPrompts.remove.useMutation();

  const add = useCallback(async (prompt: Prompt) => {
    if (!defaultModelId) {
      const err = tErr('No Default Model');
      throw new Error(err);
    }
    await promptsAdd.mutateAsync(prompt);
    const newState = [prompt, ...publicPrompts];
    dispatch({ field: 'publicPrompts', value: newState });
    return newState;
  }, [defaultModelId, dispatch, publicPrompts, promptsAdd, tErr]);

  const update = useCallback(
    async (prompt: Prompt) => {
      const newState = publicPrompts.map((f) => f.id === prompt.id ? prompt : f);
      await promptsUpdate.mutateAsync(prompt);
      dispatch({ field: 'publicPrompts', value: newState });
      return newState;
    },
    [dispatch, publicPrompts, promptsUpdate],
  );

  const remove = useCallback(
    async (prompt: Prompt) => {
      const newState = publicPrompts.filter((f) => f.id !== prompt.id);
      await promptRemove.mutateAsync({ id: prompt.id });
      dispatch({ field: 'publicPrompts', value: newState });
      return newState;
    },
    [dispatch, promptRemove, publicPrompts],
  );

  return [
    publicPrompts,
    {
      add,
      update,
      remove,
    },
  ];
}
