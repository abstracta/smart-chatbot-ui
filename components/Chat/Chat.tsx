import { IconArrowDown, IconEraser, IconSettings } from '@tabler/icons-react';
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import useConversations from '@/hooks/useConversations';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import useMesseageSender from '@/hooks/useMessageSender';

import { Plugin } from '@/types/agent';
import { Message } from '@/types/chat';
import { ChatMode } from '@/types/chatmode';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import ChatContext from './Chat.context';
import { ChatInitialState, initialState } from './Chat.state';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from '../Home/SystemPrompt';
import { TemperatureSlider } from './Temperature';
import { Llm, LlmTemperature } from '@/types/llm';
import useIsomorphicLayoutEffect from '@/hooks/useIsomorphicLayoutEffect';
import { MessageInfoDialog } from './MessageInfoDialog';

enum ModelStatus {
  Available,
  NotAvailable,
  Migrated,
}

export const Chat = memo(() => {
  const { t } = useTranslation('chat');

  const {
    state: {
      appName,
      selectedConversation,
      models,
      modelError,
      loading,
      prompts,
      publicPrompts,
      settings,
      defaultSystemPrompt,
      modelMigrations,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const chatContextValue = useCreateReducer<ChatInitialState>({
    initialState,
  });

  const [conversations, conversationsAction] = useConversations();

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);
  const [systemPrompt, setSystemPrompt] = useState<string>(defaultSystemPrompt);
  const [temperature, setTemperature] = useState<LlmTemperature>(
    settings.defaultTemperature,
  );
  const [selectedModel, setSelectedModel] = useState<Llm | undefined>();
  const [modelStatus, setModelStatus] = useState<ModelStatus>(ModelStatus.Available);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useMesseageSender();

  const handleSend = useCallback(
    async (
      message: Message,
      deleteCount = 0,
      chatMode: ChatMode | null = null,
      plugins: Plugin[],
    ) => {
      if (!selectedConversation) {
        return;
      }
      const conversation = selectedConversation;
      if (
        conversation.messages.length === 0 &&
        (conversation.prompt !== systemPrompt ||
          conversation.temperature !== temperature)
      ) {
        conversation.prompt = systemPrompt;
        conversation.temperature = temperature;
        await conversationsAction.update(conversation);
      }
      sendMessage(message, deleteCount, chatMode, plugins, selectedModel);
    },
    [
      selectedConversation,
      systemPrompt,
      temperature,
      sendMessage,
      conversationsAction,
    ],
  );

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      conversationsAction.updateValue(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const handleMessageInfoDialogOpen = (index: number) => {
    chatContextValue.dispatch({ field: "selectedMessageIndex", value: index })
    setIsMessageDialogOpen(true);
  }

  const handleMessageInfoDialogClose = () => {
    setIsMessageDialogOpen(false);
    chatContextValue.dispatch({ field: "selectedMessageIndex", value: undefined })
  }

  useEffect(() => {
    setSystemPrompt(defaultSystemPrompt);
    setTemperature(settings.defaultTemperature);
  }, [selectedConversation, settings.defaultTemperature, defaultSystemPrompt]);

  useIsomorphicLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView(true);
  }, [selectedConversation]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  useEffect(() => {
    if (selectedConversation?.model) {
      const selectedModel = selectedConversation?.model;
      const isModelAvailable = models.some((m) => m.id === selectedModel.id);
      if (!isModelAvailable) {
        if (modelMigrations &&
          selectedModel.id in modelMigrations &&
          models.some(m => m.id === modelMigrations[selectedModel.id])) {
          const newModel = models.find(m => m.id === modelMigrations[selectedModel.id])!;
          setModelStatus(ModelStatus.Migrated);
          setSelectedModel(newModel);
        } else {
          setModelStatus(ModelStatus.NotAvailable);
          setSelectedModel(undefined);
          setShowSettings(false);
        }
      } else {
        setModelStatus(ModelStatus.Available);
        setSelectedModel(selectedModel);
      }
    }
  }, [models, selectedConversation, modelMigrations])


  return (
    <ChatContext.Provider value={{ ...chatContextValue }}>
      <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
        {modelError ? (
          <ErrorMessageDiv error={modelError} />
        ) : (
          <>
            <div
              className="max-h-full overflow-x-hidden"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {selectedConversation?.messages.length === 0 ? (
                <>
                  <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px] max-h-[calc(100vh_-_140px)]">
                    <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                      {models.length === 0 ? (
                        <div>
                          <Spinner size="16px" className="mx-auto" />
                        </div>
                      ) : (
                        appName
                      )}
                    </div>

                    {models.length > 0 && (
                      <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                        <ModelSelect selectedModelId={selectedModel?.id} />

                        <div className="flex flex-col">
                          <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
                            {t('System Prompt')}
                          </label>
                          <SystemPrompt
                            maxLength={selectedConversation.model?.maxLength}
                            systemPrompt={systemPrompt}
                            prompts={prompts}
                            publicPrompts={publicPrompts}
                            onChangePrompt={(prompt) => setSystemPrompt(prompt)}
                            placeholder={t(`Enter a prompt or type "/" to select a prompt...`) || ""}
                          />
                        </div>

                        <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
                          {t('Temperature')}
                        </label>

                        <TemperatureSlider
                          temperature={temperature}
                          onChangeTemperature={(temperature) =>
                            setTemperature(temperature)
                          }
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="sticky top-0 z-20 bg-neutral-100 text-neutral-500 dark:bg-[#444654] dark:text-neutral-200">
                    <div className="flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                      {selectedConversation?.name}
                      {modelStatus != ModelStatus.NotAvailable &&
                        <>
                          <button
                            className="ml-2 cursor-pointer hover:opacity-50"
                            onClick={handleSettings}
                          >
                            <IconSettings size={18} />
                          </button>
                          <button
                            className="ml-2 cursor-pointer hover:opacity-50"
                            onClick={onClearAll}
                          >
                            <IconEraser size={18} />
                          </button>
                        </>}
                    </div>
                    {showSettings && (
                      <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                        <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                          <ModelSelect selectedModelId={selectedModel?.id} />
                        </div>
                      </div>
                    )}
                    {modelStatus == ModelStatus.NotAvailable &&
                      <div className="flex w-100 justify-center px-4 py-1 bg-red-500">
                        <span className="text-white">{t('Selected model is currently unavailable, please start a new chat')}</span>
                      </div>
                    }
                    {modelStatus == ModelStatus.Migrated &&
                      <div className="flex w-100 justify-center px-4 py-1 bg-blue-500">
                        <span className="text-white">
                          {t('chatNotificationModelMigrated')}
                        </span>
                      </div>
                    }
                  </div>

                  {selectedConversation?.messages.map((message, index) => (
                    <MemoizedChatMessage
                      key={selectedConversation.id + index}
                      message={message}
                      messageIndex={index}
                      handleOpenInfoDialog={() => handleMessageInfoDialogOpen(index)}
                    />
                  ))}

                  {loading && <ChatLoader />}

                  <div
                    className="h-[210px] bg-white dark:bg-[#343541]"
                    ref={messagesEndRef}
                  />
                </>
              )}
            </div>

            <ChatInput
              textareaRef={textareaRef}
              onSend={(message, chatMode, plugins) => {
                handleSend(message, 0, chatMode, plugins);
              }}
              onRegenerate={(chatMode, plugins) => {
                const latestIndex = selectedConversation?.messages.findLastIndex(m => m.role == "user");
                if (latestIndex != undefined)
                  handleSend(selectedConversation!.messages[latestIndex],
                    selectedConversation!.messages.length - latestIndex, chatMode, plugins);
              }}
              disabled={modelStatus == ModelStatus.NotAvailable}
            />
          </>
        )}
        {showScrollDownButton && (
          <div className="absolute bottom-0 right-0 mb-4 mr-4 pb-20">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
              onClick={handleScrollDown}
            >
              <IconArrowDown size={18} />
            </button>
          </div>
        )}
        <MessageInfoDialog open={isMessageDialogOpen} onClose={handleMessageInfoDialogClose} />
      </div>
    </ChatContext.Provider>
  );
});
Chat.displayName = 'Chat';
