import { IconExternalLink } from '@tabler/icons-react';
import { useContext } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';
import { Select } from '../Input/Select';
import useConversations from '@/hooks/useConversations';
import { OpenAIModel } from '@/types/openai';

export const ModelSelect = () => {
  const { t } = useTranslation('chat');
  const [_, conversationsAction] = useConversations();
  const {
    state: { models, selectedConversation, defaultModelId },
  } = useContext(HomeContext);

  const handleModelSelect = (modelId: string) => {
    selectedConversation &&
      conversationsAction.updateValue(selectedConversation, {
        key: 'model',
        value: models.find(
          (model) => model.id === modelId,
        ) as OpenAIModel,
      });
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {t('Model')}
      </label>
      <Select placeholder={t('Select a model') || ""}
        options={models.map((m) => {
          return {
            value: m.id,
            label: m.id == defaultModelId ? `${t('Default')} (${m.name})` : m.name
          }
        })}
        onSelect={handleModelSelect}
        selectedValue={selectedConversation?.model?.id || defaultModelId}
      />
      <div className="w-full mt-3 text-left text-neutral-700 dark:text-neutral-400 flex items-center">
        <a
          href="https://platform.openai.com/account/usage"
          target="_blank"
          className="flex items-center"
        >
          <IconExternalLink size={18} className={'inline mr-1'} />
          {t('View Account Usage')}
        </a>
      </div>
    </div>
  );
};
