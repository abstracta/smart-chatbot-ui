import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';

import { Dialog } from '@/components/Dialog/Dialog';
import { FolderInterface } from '@/types/folder';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  open: boolean;
  prompt: Prompt;
  folders: FolderInterface[];
  onClose: () => void;
  onPublishPrompt: (prompt: Prompt) => void;
}

export const PromptShareModal: FC<Props> = ({
  open,
  prompt,
  folders,
  onClose,
  onPublishPrompt,
}) => {
  const { t } = useTranslation('promptbar');
  const [selectedFolderId, setSelectedFolder] = useState<string>(folders.length > 0 ? folders[0].id : "");

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onPublishPrompt({ ...prompt, folderId: selectedFolderId });
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFolder(e.target.value);
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onKeyDown={handleEnter}
    >
      <div className="text-sm font-bold text-black dark:text-neutral-200">
        {t('Select public folder')}
      </div>
      <div className="w-full rounded-lg border border-neutral-200 bg-transparent mt-4 pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          className="w-full bg-transparent p-2"
          value={selectedFolderId}
          onChange={handleChange}
        >
          {folders.map((folder) => (
            <option
              key={folder.id}
              value={folder.id}
              className="dark:bg-[#343541] dark:text-white"
            >
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
        disabled={!selectedFolderId}
        onClick={() => {
          const updatedPrompt = {
            ...prompt,
            id: uuidv4(),
            folderId: selectedFolderId
          };
          onPublishPrompt(updatedPrompt);
          onClose();
        }}
      >
        {t('Publish')}
      </button>
    </Dialog>
  );
};
