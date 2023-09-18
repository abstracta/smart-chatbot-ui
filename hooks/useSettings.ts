import { useCallback, useContext } from 'react';
import { trpc } from '@/utils/trpc';
import HomeContext from '@/pages/api/home/home.context';
import { Settings } from '@/types/settings';

type SettingsAction = {
  update: (newState: Settings) => Promise<Settings>;
};

export default function useConversations(): [
  Settings,
  SettingsAction,
] {
  const {
    state: { settings },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const updateMutation = trpc.settings.settingsUpdate.useMutation();

  const update = useCallback(
    async (settings: Settings) => {
      await updateMutation.mutateAsync(settings);
      homeDispatch({ field: 'settings', value: settings });
      return settings;
    },
    [settings, homeDispatch],
  );

  return [
    settings,
    {
      update,
    },
  ];
}
