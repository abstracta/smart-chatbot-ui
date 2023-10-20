import { useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Settings } from '@/types/settings';
import { DefinedUseQueryResult } from '@tanstack/react-query';

type SettingsAction = {
  update: (newState: Settings) => Promise<Settings>;
};

export default function useSettings(): [
  DefinedUseQueryResult<Settings>,
  SettingsAction,
] {
  const trpcContext = trpc.useContext();
  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    initialData: {
      userId: '',
      theme: 'dark',
      defaultTemperature: 1.0,
      defaultModelId: undefined,
      defaultSystemPrompt: '',
    }
  });

  const updateMutation = trpc.settings.settingsUpdate.useMutation({
    onMutate: async (settings: Settings) => {
      const listQuery = trpcContext.settings.get;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, settings);
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.settings.get.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.settings.get.invalidate();
    },
  });

  const update = useCallback(
    async (settings: Settings) => {
      await updateMutation.mutateAsync(settings);
      return settings;
    },
    [updateMutation],
  );

  return [
    settingsQuery,
    {
      update,
    },
  ];
}
