import { FC } from 'react';

import { Prompt } from '@/types/prompt';

import { PromptComponent } from './Prompt';

interface Props {
  prompts: Prompt[];
  handleUpdatePrompt(prompt: Prompt): void;
  handleDeletePrompt(prompt: Prompt): void
  handleCreatePublicPrompt(prompt: Prompt): void
  isShareable?: boolean
}

export const Prompts: FC<Props> = ({ prompts, handleUpdatePrompt, handleDeletePrompt, handleCreatePublicPrompt, isShareable = false }) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {prompts.map((prompt, index) => (
        <PromptComponent key={prompt.id} prompt={prompt}
          handleUpdatePrompt={handleUpdatePrompt}
          handleDeletePrompt={handleDeletePrompt}
          handlePublishPrompt={handleCreatePublicPrompt}
          isShareable={isShareable}
        />
      ))}
    </div>
  );
};
