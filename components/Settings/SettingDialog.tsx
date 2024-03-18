import { FC, useContext, useEffect, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';

import { TemperatureSlider } from '../Chat/Temperature';
import { Dialog } from '../Dialog/Dialog';
import { Select } from '../Input/Select';
import useSettings from '@/hooks/useSettings';
import { SystemPrompt } from '../Home/SystemPrompt';
import { LlmID, LlmType } from '@/types/llm';
import Spinner from '../Spinner';
import { initialState as homeInitialState } from '@/pages/api/home/home.state';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingDialog: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('settings');
  const {
    state: { models, systemDefaultModelId },
  } = useContext(HomeContext);
  const [settingsQuery, settingsActions] = useSettings();
  const [settings, setSettings] = useState<Settings>(homeInitialState.settings!);

  useEffect(() => {
    if (open) {
      setSettings(settingsQuery.data);
    }
  }, [setSettings, open, settingsQuery.data]);

  const handleSave = async () => {
    await settingsActions.update(settings);
  };

  const handleModelSelect = (value: string) => {
    setSettings({ ...settings, defaultModelId: value ? value as LlmID : undefined });
  };

  // Render the dialog.
  return (
    <Dialog open={open} onClose={() => onClose()}>
      <div className="text-lg pb-4 font-bold text-black dark:text-neutral-200">
        {t('Settings')}
      </div>
      {settingsQuery.isFetched && (<div>
        <div className="flex flex-col mb-2 ">
          <div className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
            {t('Theme')}
          </div>

          <Select
            options={[
              { value: "dark", label: t('Dark mode') },
              { value: "light", label: t('Light mode') },
            ]}
            onSelect={(value: "light" | "dark") => setSettings({ ...settings, theme: value })}
            selectedValue={settings.theme}
          />
        </div>

        <div className="flex flex-col mb-2 ">
          <label className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
            {t('Default model')}
          </label>
          <Select placeholder={t('Select a model') || ""}
            options={[
              { value: "", label: `${t("System default")} (${models.find(m => m.id == systemDefaultModelId)?.name})` },
              ...models.filter(m => m.type == LlmType.CHAT).map((m) => {
                return {
                  value: m.id,
                  label: m.name
                }
              }),
            ]}
            onSelect={handleModelSelect}
            selectedValue={settings.defaultModelId || ""}
          />
        </div>

        <div className="flex flex-col mb-2 ">
          <div className="text-sm font-bold mt-2 mb-2 text-black dark:text-neutral-200">
            {t('Default temperature')}
          </div>

          <TemperatureSlider
            temperature={settings.defaultTemperature}
            onChangeTemperature={(temperature) =>
              setSettings({ ...settings, defaultTemperature: temperature })
            }
          />
        </div>

        <div className="flex flex-col mb-2 ">
          <div className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
            {t('Default system prompt')}
          </div>

          <SystemPrompt
            systemPrompt={settings.defaultSystemPrompt || ""}
            prompts={[]}
            publicPrompts={[]}
            onChangePrompt={(prompt) => setSettings({ ...settings, defaultSystemPrompt: prompt })}
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
      </div>)}
      {!settingsQuery.isFetched && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
        <Spinner size="25px" className="m-auto" />
      </div>)}
    </Dialog>
  );
};
