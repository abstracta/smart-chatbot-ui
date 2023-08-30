import { useCallback, useContext, useEffect } from 'react';

import { useTranslation } from 'next-i18next';

import useConversations from '@/hooks/useConversations';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import { useExporter } from '@/hooks/useExporter';
import useFolders from '@/hooks/useFolders';
import { useImporter } from '@/hooks/useImporter';


import { Conversation } from '@/types/chat';
import { ChatModeKey } from '@/types/chatmode';
import { LatestExportFormat, SupportedExportFormats } from '@/types/export';

import HomeContext from '@/pages/api/home/home.context';

import { ChatFolders } from './components/ChatFolders';
import { ChatbarSettings } from './components/ChatbarSettings';
import { Conversations } from './components/Conversations';

import Sidebar from '../Sidebar';
import ChatbarContext from './Chatbar.context';
import { ChatbarInitialState, initialState } from './Chatbar.state';


export const Chatbar = () => {
  const { t } = useTranslation('sidebar');
  const { t: tChat } = useTranslation('chat');
  const [folders, foldersAction] = useFolders();
  const exporter = useExporter();
  const importer = useImporter();

  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  });

  const {
    state: { showChatbar, chatModeKeys: pluginKeys, settings },
    dispatch: homeDispatch,
  } = useContext(HomeContext);
  const [conversations, conversationsAction] = useConversations();

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue;

  const handleApiKeyChange = useCallback(
    (apiKey: string) => {
      homeDispatch({ field: 'apiKey', value: apiKey });

      localStorage.setItem('apiKey', apiKey);
    },
    [homeDispatch],
  );

  const handlePluginKeyChange = (pluginKey: ChatModeKey) => {
    if (pluginKeys.some((key) => key.chatModeId === pluginKey.chatModeId)) {
      const updatedPluginKeys = pluginKeys.map((key) => {
        if (key.chatModeId === pluginKey.chatModeId) {
          return pluginKey;
        }

        return key;
      });

      homeDispatch({ field: 'chatModeKeys', value: updatedPluginKeys });

      localStorage.setItem('chatModeKeys', JSON.stringify(updatedPluginKeys));
    } else {
      homeDispatch({
        field: 'chatModeKeys',
        value: [...pluginKeys, pluginKey],
      });

      localStorage.setItem(
        'chatModeKeys',
        JSON.stringify([...pluginKeys, pluginKey]),
      );
    }
  };

  const handleClearPluginKey = (pluginKey: ChatModeKey) => {
    const updatedPluginKeys = pluginKeys.filter(
      (key) => key.chatModeId !== pluginKey.chatModeId,
    );

    if (updatedPluginKeys.length === 0) {
      homeDispatch({ field: 'chatModeKeys', value: [] });
      localStorage.removeItem('pluginKeys');
      return;
    }

    homeDispatch({ field: 'chatModeKeys', value: updatedPluginKeys });

    localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys));
  };

  const handleExportData = async () => {
    return exporter.exportData();
  };

  const handleImportConversations = async (data: SupportedExportFormats) => {
    const { history, folders, prompts }: LatestExportFormat =
      await importer.importData(settings, data);
    homeDispatch({ field: 'conversations', value: history });
    homeDispatch({
      field: 'selectedConversation',
      value: history[history.length - 1],
    });
    homeDispatch({ field: 'folders', value: folders });
    homeDispatch({ field: 'prompts', value: prompts });
  };

  const handleClearConversations = async () => {
    await conversationsAction.clear();
    await foldersAction.clear();
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    await conversationsAction.remove(conversation);
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
      chatDispatch({
        field: 'filteredConversations',
        value: conversations.filter((conversation) => {
          const searchable =
            conversation.name.toLocaleLowerCase() +
            ' ' +
            conversation.messages.map((message) => message.content).join(' ');
          return searchable.toLowerCase().includes(searchTerm.toLowerCase());
        }),
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
        handleImportConversations,
        handleExportData,
        handlePluginKeyChange,
        handleClearPluginKey,
        handleApiKeyChange,
      }}
    >
      <Sidebar<Conversation>
        side={'left'}
        isOpen={showChatbar}
        addItemButtonTitle={t('New chat')}
        itemComponent={<Conversations conversations={filteredConversations} />}
        folderComponent={<ChatFolders searchTerm={searchTerm} />}
        items={filteredConversations}
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
