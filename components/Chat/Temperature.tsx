import { FC } from 'react';
import { useTranslation } from 'next-i18next';

import { LlmTemperature } from '@/types/llm';

interface Props {
  temperature: LlmTemperature;
  onChangeTemperature: (temperature: LlmTemperature) => void;
}

export const TemperatureSlider: FC<Props> = ({
  temperature,
  onChangeTemperature
}) => {
  const { t } = useTranslation('chat');

  return (
    <div className="flex flex-col">
      <ul className="items-center w-full text-sm font-medium 
        rounded-lg sm:flex border border-neutral-200 bg-transparent text-neutral-900 dark:border-neutral-600 
        dark:text-neutral-100 overflow-hidden">
        {Object.values(LlmTemperature).map((temp, index) => {
          return (
            <li className={`w-full border-b border-gray-200 sm:border-b-0 sm:border-r border-neutral-200 text-neutral-900 
              dark:border-neutral-600 dark:text-neutral-100 ${temp == temperature ? "bg-slate-900/20 dark:bg-gray-900/30" :
                "bg-white dark:bg-[#343541]"}
              cursor-pointer transition-bg dark:hover:dark:bg-gray-900/30`}
              key={index}
              onClick={() => onChangeTemperature(temp)}>
              <div className="flex items-center justify-center px-4 py-1 cursor-pointer">
                <label htmlFor="vue-checkbox-list" className="py-2 ml-2 text-sm font-medium text-gray-900 
                dark:text-gray-300 cursor-pointer">
                  {t(temp)}
                </label>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  );
};
