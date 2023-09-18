import { FC, MutableRefObject } from 'react';

import { Prompt } from '@/types/prompt';
import { IconShare } from '@tabler/icons-react';

interface Props {
  prompts: Prompt[];
  publicPrompts: Prompt[];
  activePromptIndex: number;
  onSelect: () => void;
  onMouseOver: (index: number) => void;
  promptListRef: MutableRefObject<HTMLUListElement | null>;
}

export const PromptList: FC<Props> = ({
  prompts,
  publicPrompts,
  activePromptIndex,
  onSelect,
  onMouseOver,
  promptListRef,
}) => {
  const promptItems = (prompts: Prompt[], isPublic: boolean, startIndex: number) => {
    return (
      prompts.map((prompt, index) => (
        <li
          key={prompt.id}
          className={`${
           startIndex + index === activePromptIndex
              ? 'bg-gray-200 dark:bg-[#202123] dark:text-black'
              : ''
          } cursor-pointer px-3 py-2 text-sm text-black dark:text-white flex justify-between`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
          }}
          onMouseEnter={() => onMouseOver(startIndex + index)}
        >
          {prompt.name}
          {isPublic && (
            <IconShare size={18} />
          )}
        </li>
      ))
    )
  }
  return (
    <ul
      ref={promptListRef}
      className="z-10 max-h-52 w-full overflow-scroll rounded border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-neutral-500 dark:bg-[#343541] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]"
    >
      {
        [
          ...promptItems(prompts, false, 0),
          ...promptItems(publicPrompts, true, prompts.length)
        ]
      }
    </ul>
  );
};
