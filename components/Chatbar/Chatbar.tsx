import { useContext, useEffect } from 'react';

import { useTranslation } from 'next-i18next';

import useConversations from '@/hooks/useConversations';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import useFolders from '@/hooks/useFolders';


import { Conversation, ConversationListing } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import { ChatFolders } from './components/ChatFolders';
import { ChatbarSettings } from './components/ChatbarSettings';
import { Conversations } from './components/Conversations';

import Sidebar from '../Home/Sidebar';
import ChatbarContext from './Chatbar.context';
import { ChatbarInitialState, initialState } from './Chatbar.state';
import Fuse from 'fuse.js';


export const Chatbar = () => {
  const { t } = useTranslation('sidebar');
  const { t: tChat } = useTranslation('chat');
  const [folders, foldersAction] = useFolders();

  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  });

  const {
    state: { showChatbar },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const [conversations, conversationsAction] = useConversations();

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue;

  const handleClearConversations = async () => {
    await conversationsAction.clear();
    await foldersAction.clear();
  };

  const handleDeleteConversation = async (conversationId: Conversation["id"]) => {
    await conversationsAction.remove(conversationId);
    chatDispatch({ field: 'searchTerm', value: '' });
  };

  const handleToggleChatbar = () => {
    homeDispatch({ field: 'showChatbar', value: !showChatbar });
    localStorage.setItem('showChatbar', JSON.stringify(!showChatbar));
  };

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'));
      conversationsAction.updateValue(conversation, {
        key: 'folderId',
        value: null,
      });
      chatDispatch({ field: 'searchTerm', value: '' });
      e.target.style.background = 'none';
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const fuse = new Fuse(conversations, {
        keys: ["name", "messages.content"],
        threshold: 0.5
      })
      const results = fuse.search((searchTerm))
      chatDispatch({
        field: 'filteredConversations',
        value: results.map(r => r.item),
      });
    } else {
      chatDispatch({
        field: 'filteredConversations',
        value: conversations,
      });
    }
  }, [searchTerm, conversations, chatDispatch]);

  return (
    <ChatbarContext.Provider
      value={{
        ...chatBarContextValue,
        handleDeleteConversation,
        handleClearConversations,
      }}
    >
      <Sidebar<ConversationListing>
        side={'left'}
        isOpen={showChatbar}
        addItemButtonTitle={t('New chat')}
        itemComponent={<Conversations conversations={filteredConversations} />}
        folderComponent={<ChatFolders searchTerm={searchTerm} />}
        items={filteredConversations}
        showSearch={conversations.length > 0}
        searchTerm={searchTerm}
        searchPlaceholder={t('Search conversations...')}
        noItemsPlaceholder={t('No conversations.')}
        handleSearchTerm={(searchTerm: string) =>
          chatDispatch({ field: 'searchTerm', value: searchTerm })
        }
        toggleOpen={handleToggleChatbar}
        handleCreateItem={() => conversationsAction.add()}
        handleCreateFolder={() => foldersAction.add(t('New folder'), 'chat')}
        handleDrop={handleDrop}
        footerComponent={<ChatbarSettings />}
      />
    </ChatbarContext.Provider>
  );
};
