import { useContext } from 'react';

import { FolderInterface } from '@/types/folder';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';
import { PromptComponent } from '@/components/Promptbar/components/Prompt';

import PromptbarContext from '../PromptBar.context';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { UserRole } from '@/types/user';

export const PromptFolders = () => {
  const { t } = useTranslation('promptbar');

  const {
    state: { folders, publicFolders, promptSharingEnabled },
  } = useContext(HomeContext);

  const {
    state: { searchTerm, filteredPrompts, filteredPublicPrompts },
    handleUpdatePrompt,
    handleDeletePrompt,
    handleCreatePublicPrompt,
    handleUpdatePublicPrompt,
    handleDeletePublicPrompt,
    handleCreateFolder,
    handleEditFolder,
    handleDeleteFolder,
    handleCreatePublicFolder,
    handleEditPublicFolder,
    handleDeletePublicFolder
  } = useContext(PromptbarContext);

  const session = useSession()
  const isPromptAdmin: boolean = session.data?.user?.role === UserRole.ADMIN || session.data?.user?.role === UserRole.PUBLIC_PROMPT_EDITOR;

  const handleDrop = (e: any, folder: FolderInterface) => {
    if (e.dataTransfer) {
      const prompt = JSON.parse(e.dataTransfer.getData('prompt'));

      const updatedPrompt = {
        ...prompt,
        folderId: folder.id,
      };

      handleUpdatePrompt(updatedPrompt);
    }
  };

  const PromptFolders = (prompts: Prompt[], folders: FolderInterface[], handleUpdatePrompt: any, handleDeletePrompt: any, handleCreatePublicPrompt: any,
    handleAddItem: any, handleEditFolder?: any, handleDeleteFolder?: any, handleDrop?: any, isShareable = true, isDraggable = true) => {
    return ([
      <div className="flex w-full flex-col" key="0">
        {
          (folders
            .filter((folder) => folder.type === 'prompt')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((folder, index) => (
              <Folder
                key={folder.id}
                searchTerm={searchTerm}
                currentFolder={folder}
                handleDrop={handleDrop || undefined}
                folderComponent={
                  prompts
                    .filter((p) => p.folderId)
                    .map((prompt, index) => {
                      if (prompt.folderId === folder.id) {
                        const canEditPrompt = isPromptAdmin || prompt.userId === session.data?.user?._id;
                        return (
                          <div key={prompt.id} className="ml-5 gap-2 border-l pl-2">
                            <PromptComponent
                              prompt={prompt}
                              isEditable={canEditPrompt}
                              isRemovable={canEditPrompt}
                              isShareable={isShareable}
                              isDraggable={isDraggable}
                              handleUpdatePrompt={handleUpdatePrompt}
                              handleDeletePrompt={handleDeletePrompt}
                              handlePublishPrompt={handleCreatePublicPrompt}
                            />
                          </div>
                        );
                      }
                    })
                }
                handleAddItem={handleAddItem}
                handleEditFolder={handleEditFolder}
                handleDeleteFolder={handleDeleteFolder}
              />
            )))
        }
      </div>]
    )
  }

  return (
    <div className="flex w-full flex-col pt-2">
      {!promptSharingEnabled && PromptFolders(filteredPrompts, folders, handleUpdatePrompt, handleDeletePrompt, handleCreatePublicPrompt,
        undefined, handleEditFolder, handleDeleteFolder, handleDrop, false, true)}
      {promptSharingEnabled && (
        <>
          <Folder
            key="folder-public-prompts"
            searchTerm={searchTerm}
            currentFolder={{
              id: "folder-public-prompts",
              name: t("Public prompts"),
              type: "prompt"
            }}
            folderComponent={PromptFolders(filteredPublicPrompts, publicFolders, handleUpdatePublicPrompt, handleDeletePublicPrompt, null,
              undefined, isPromptAdmin ? handleEditPublicFolder : undefined, isPromptAdmin ? handleDeletePublicFolder : undefined, undefined, false, false)}
            handleAddItem={isPromptAdmin ? handleCreatePublicFolder : undefined}
          />
          <Folder
            key="folder-my-prompts"
            searchTerm={searchTerm}
            currentFolder={{
              id: "folder-my-prompts",
              name: t("My prompts"),
              type: "prompt"
            }}
            folderComponent={PromptFolders(filteredPrompts, folders, handleUpdatePrompt, handleDeletePrompt, handleCreatePublicPrompt,
              undefined, handleEditFolder, handleDeleteFolder, handleDrop)}
          />
        </>
      )}
    </div>
  );
};
