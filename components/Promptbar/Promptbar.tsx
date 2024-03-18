import { useContext, useEffect } from 'react';
import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';
import useFolders from '@/hooks/useFolders';
import usePrompts from '@/hooks/usePrompts';

import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { PromptFolders } from './components/PromptFolders';
import { Prompts } from './components/Prompts';
import Sidebar from '../Home/Sidebar';
import PromptbarContext from './PromptBar.context';
import { PromptbarInitialState, initialState } from './Promptbar.state';
import usePublicFolders from '@/hooks/usePublicFolders';
import usePublicPrompts from '@/hooks/usePublicPrompts';
import { FolderInterface } from '@/types/folder';
import Fuse from 'fuse.js';

const Promptbar = () => {
  const { t } = useTranslation('promptbar');
  const [_, foldersAction] = useFolders();
  const [publicFolders, publicFoldersAction] = usePublicFolders();
  const [prompts, promptsAction] = usePrompts();
  const [publicPrompts, publicPromptsAction] = usePublicPrompts();

  const promptBarContextValue = useCreateReducer<PromptbarInitialState>({
    initialState,
  });

  const {
    state: { showPromptbar, promptSharingEnabled },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredPrompts },
    dispatch: promptDispatch,
  } = promptBarContextValue;

  const handleTogglePromptbar = () => {
    homeDispatch({ field: 'showPromptbar', value: !showPromptbar });
    localStorage.setItem('showPromptbar', JSON.stringify(!showPromptbar));
  };

  const handleCreatePrompt = () => {
    promptsAction.add();
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    promptsAction.remove(prompt);
  };

  const handleUpdatePrompt = (prompt: Prompt) => {
    promptsAction.update(prompt);
  };

  const handleCreatePublicPrompt = (prompt: Prompt) => {
    publicPromptsAction.add(prompt);
  };

  const handleDeletePublicPrompt = (prompt: Prompt) => {
    publicPromptsAction.remove(prompt);
  };

  const handleUpdatePublicPrompt = (prompt: Prompt) => {
    publicPromptsAction.update(prompt);
  };

  const handleCreateFolder = () => {
    foldersAction.add(t('New folder'), "prompt");
  };

  const handleEditFolder = (folder: FolderInterface) => {
    foldersAction.update(folder);
  };

  const handleDeleteFolder = (folder: FolderInterface) => {
    foldersAction.remove(folder.id);
  };

  const handleCreatePublicFolder = () => {
    publicFoldersAction.add(t('New folder'));
  };

  const handleEditPublicFolder = (folder: FolderInterface) => {
    publicFoldersAction.update(folder);
  };

  const handleDeletePublicFolder = (folder: FolderInterface) => {
    publicFoldersAction.remove(folder.id);
  };

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const prompt = JSON.parse(e.dataTransfer.getData('prompt'));

      const updatedPrompt = {
        ...prompt,
        folderId: e.target.dataset.folderId || null,
      };

      handleUpdatePrompt(updatedPrompt);

      e.target.style.background = 'none';
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const fusePrompts = new Fuse(prompts, {
        keys: ["name", "description", "content"],
        threshold: 0.5
      })
      const results = fusePrompts.search((searchTerm))
      promptDispatch({
        field: 'filteredPrompts',
        value: results.map(r => r.item),
      });
      if (promptSharingEnabled) {
        const fusePublicPrompts = new Fuse(publicPrompts, {
          keys: ["name", "description", "content"],
          threshold: 0.5
        })
        const results = fusePublicPrompts.search((searchTerm))
        promptDispatch({
          field: 'filteredPublicPrompts',
          value: results.map(r => r.item),
        });
      }
    } else {
      promptDispatch({ field: 'filteredPrompts', value: prompts });
      if (promptSharingEnabled) {
        promptDispatch({ field: 'filteredPublicPrompts', value: publicPrompts });
      }
    }
  }, [searchTerm, prompts, publicPrompts, promptDispatch, promptSharingEnabled]);

  useEffect(() => {
  }, [publicFolders]);


  return (
    <PromptbarContext.Provider
      value={{
        ...promptBarContextValue,
        handleCreatePrompt,
        handleDeletePrompt,
        handleUpdatePrompt,
        handleCreatePublicPrompt,
        handleDeletePublicPrompt,
        handleUpdatePublicPrompt,
        handleCreateFolder,
        handleEditFolder,
        handleDeleteFolder,
        handleCreatePublicFolder,
        handleEditPublicFolder,
        handleDeletePublicFolder
      }}
    >
      <Sidebar<Prompt>
        side={'right'}
        isOpen={showPromptbar}
        addItemButtonTitle={t('New prompt')}
        itemComponent={
          <Prompts
            prompts={filteredPrompts.filter((prompt) => !prompt.folderId)}
            handleUpdatePrompt={handleUpdatePrompt}
            handleDeletePrompt={handleDeletePrompt}
            handleCreatePublicPrompt={handleCreatePublicPrompt}
            isShareable={promptSharingEnabled}
          />
        }
        folderComponent={<PromptFolders />}
        items={filteredPrompts}
        showSearch={prompts.length > 0 || publicPrompts.length > 0}
        searchTerm={searchTerm}
        searchPlaceholder={t('Search prompts...')}
        noItemsPlaceholder={t('No prompts.')}
        handleSearchTerm={(searchTerm: string) =>
          promptDispatch({ field: 'searchTerm', value: searchTerm })
        }
        toggleOpen={handleTogglePromptbar}
        handleCreateItem={handleCreatePrompt}
        handleCreateFolder={() => foldersAction.add(t('New folder'), 'prompt')}
        handleDrop={handleDrop}
      />
    </PromptbarContext.Provider>
  );
};

export default Promptbar;
