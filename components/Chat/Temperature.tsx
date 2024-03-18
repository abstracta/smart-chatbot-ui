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
        sm:flex bg-transparent text-neutral-900 dark:border-neutral-600 
        dark:text-neutral-100">
        {Object.values(LlmTemperature).map((temp, index, arr) => {
          return (
            <li className={`w-full border border-neutral-250 text-neutral-700 
              dark:border-neutral-600 dark:text-neutral-100 ${temp == temperature ? "bg-neutral-200 border-neutral-500 dark:bg-[#343541] dark:brightness-125 " :
                "bg-white dark:bg-[#343541] "} ${index == 0 ? "rounded-l-lg" : ""} ${index == arr.length - 1 ? "rounded-r-lg" : ""}
              cursor-pointer transition-all  dark:hover:brightness-125 focus:outline-black dark:focus:outline-white
              hover:bg-neutral-100 hover:border-neutral-300 focus:border-neutral-900`}
              key={index}
              onClick={() => onChangeTemperature(temp)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key == ' ') {
                  e.preventDefault();
                  onChangeTemperature(temp);
                }
              }}
              tabIndex={0}>
              <div className="flex items-center justify-center px-4 py-1 cursor-pointer">
                <label htmlFor="vue-checkbox-list" className="py-2 ml-2 text-sm font-medium cursor-pointer">
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
