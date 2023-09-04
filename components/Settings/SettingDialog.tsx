import { FC, useContext, useEffect } from 'react';

import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';


import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';

import { TemperatureSlider } from '../Chat/Temperature';
import { Dialog } from '../Dialog/Dialog';
import { OpenAIModelID } from '@/types/openai';
import { Select } from '../Input/Select';
import useSettings from '@/hooks/useSettings';
import { SystemPrompt } from '../Home/SystemPrompt';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingDialog: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('settings');
  const {
    state: { models, systemDefaultModelId },
  } = useContext(HomeContext);
  const [settings, settingsActions] = useSettings();
  const { state, dispatch } = useCreateReducer<Settings>({
    initialState: settings,
  });

  useEffect(() => {
    if (open) {
      dispatch({ type: 'replace_all', value: settings });
    }
  }, [dispatch, open, settings]);

  const handleSave = async () => {
    await settingsActions.update(state);
  };

  const handleModelSelect = (value: string) => {
    dispatch({ field: "defaultModelId", value: value ? value as OpenAIModelID : undefined });
  };

  // Render the dialog.
  return (
    <Dialog open={open} onClose={() => onClose()}>
      <div className="text-lg pb-4 font-bold text-black dark:text-neutral-200">
        {t('Settings')}
      </div>

      <div className="flex flex-col mb-2 ">
        <div className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
          {t('Theme')}
        </div>

        <Select
          options={[
            { value: "dark", label: t('Dark mode') },
            { value: "light", label: t('Light mode') },
          ]}
          onSelect={(value) => dispatch({ field: 'theme', value })}
          selectedValue={state.theme}
        />
      </div>

      <div className="flex flex-col mb-2 ">
        <label className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
          {t('Default Model')}
        </label>
        <Select placeholder={t('Select a model') || ""}
          options={[
            { value: "", label: `${t("System default")} (${models.find(m => m.id == systemDefaultModelId)?.name})` },
            ...models.map((m) => {
              return {
                value: m.id,
                label: m.name
              }
            }),
          ]}
          onSelect={handleModelSelect}
          selectedValue={state.defaultModelId || ""}
        />
      </div>

      <div className="flex flex-col mb-2 ">
        <div className="text-sm font-bold mt-2 mb-2 text-black dark:text-neutral-200">
          {t('Temperature')}
        </div>

        <TemperatureSlider
          temperature={state.defaultTemperature}
          onChangeTemperature={(temperature) =>
            dispatch({ field: 'defaultTemperature', value: temperature })
          }
        />
      </div>

      <div className="flex flex-col mb-2 ">
        <div className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
          {t('Default system prompt')}
        </div>

        <SystemPrompt
          systemPrompt={state.defaultSystemPrompt || ""}
          prompts={[]}
          publicPrompts={[]}
          onChangePrompt={(prompt) => dispatch({ field: "defaultSystemPrompt", value: prompt })}
          placeholder={t('Enter a prompt or leave empty to use system default') || ""}
        />
      </div>

      <button
        type="button"
        className="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
        onClick={() => {
          handleSave();
          onClose();
        }}
      >
        {t('Save')}
      </button>
    </Dialog>
  );
};
