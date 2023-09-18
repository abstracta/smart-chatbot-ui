import { useContext } from 'react';

import useConversations from '@/hooks/useConversations';

import { FolderInterface } from '@/types/folder';

import HomeContext from '@/pages/api/home/home.context';

import Folder from '@/components/Folder';

import { ConversationComponent } from './Conversation';
import useFolders from '@/hooks/useFolders';

interface Props {
  searchTerm: string;
}

export const ChatFolders = ({ searchTerm }: Props) => {
  const {
    state: { folders, conversations },
  } = useContext(HomeContext);
  const [_, conversationsAction] = useConversations();
  const [_f, foldersAction] = useFolders();

  const handleDrop = (e: any, folder: FolderInterface) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'));
      conversationsAction.updateValue(conversation, {
        key: 'folderId',
        value: folder.id,
      });
    }
  };

  const handleEditFolder = (folder: FolderInterface) => {
    foldersAction.update(folder);
  };

  const handleDeleteFolder = (folder: FolderInterface) => {
    foldersAction.remove(folder.id);
  };

  const ChatFolders = (currentFolder: FolderInterface) => {
    return (
      conversations &&
      conversations
        .filter((conversation) => conversation.folderId)
        .map((conversation, index) => {
          if (conversation.folderId === currentFolder.id) {
            return (
              <div key={index} className="ml-5 gap-2 border-l pl-2">
                <ConversationComponent conversation={conversation} />
              </div>
            );
          }
        })
    );
  };

  return (
    <div className="flex w-full flex-col pt-2">
      {folders
        .filter((folder) => folder.type === 'chat')
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((folder, index) => (
          <Folder
            key={index}
            searchTerm={searchTerm}
            currentFolder={folder}
            handleDrop={handleDrop}
            folderComponent={ChatFolders(folder)}
            handleEditFolder={handleEditFolder}
            handleDeleteFolder={handleDeleteFolder}
          />
        ))}
    </div>
  );
};
