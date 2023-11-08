import { useEffect, useRef } from 'react';

import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT, OPENAI_API_TYPE, PROMPT_SHARING_ENABLED, SUPPORT_EMAIL, DEFAULT_USER_LIMIT_USD_MONTHLY } from '@/utils/app/const';
import { trpc } from '@/utils/trpc';

import { Conversation, ConversationListing } from '@/types/chat';

import { HomeMain } from '@/components/Home/HomeMain';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../auth/[...nextauth].page';
import { getServerSession } from 'next-auth/next';
import { LlmID } from '@/types/llm';
import useSettings from '@/hooks/useSettings';
import Spinner from '@/components/Spinner';

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  consumptionLimitEnabled: boolean;
  isAzureOpenAI: boolean;
  promptSharingEnabled: boolean;
  supportEmail: string;
  systemDefaultModelId: LlmID;
  systemDefaultSystemPrompt: string;
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  consumptionLimitEnabled,
  isAzureOpenAI,
  supportEmail,
  promptSharingEnabled,
  systemDefaultModelId,
  systemDefaultSystemPrompt,
}: Props) => {
  const { t } = useTranslation('chat');

  const stopConversationRef = useRef<boolean>(false);
  const contextValue = useCreateReducer<HomeInitialState>({
    initialState: {
      ...initialState,
      stopConversationRef: stopConversationRef,
      consumptionLimitEnabled: consumptionLimitEnabled,
      isAzureOpenAI,
      supportEmail,
      promptSharingEnabled: promptSharingEnabled,
      defaultSystemPrompt: systemDefaultSystemPrompt,
    } as HomeInitialState,
  });

  const {
    state: { settings, selectedConversation, selectedConversationId, models, defaultModelId, defaultSystemPrompt },
    dispatch,
  } = contextValue;

  const settingsQuery = useSettings()[0];
  const promptsQuery = trpc.prompts.list.useQuery();
  const foldersQuery = trpc.folders.list.useQuery();
  const conversationsQuery = trpc.conversations.list.useQuery();
  const selectedConversationQuery = trpc.conversations.get.useQuery({ id: selectedConversationId || "" });
  const publicPromptsQuery = trpc.publicPrompts.list.useQuery();
  const publicFoldersQuery = trpc.publicFolders.list.useQuery();

  const modelsQuery = trpc.models.list.useQuery(undefined, { staleTime: 60000 });

  useEffect(() => {
    if (modelsQuery.data)
      dispatch({ field: 'models', value: modelsQuery.data });
  }, [modelsQuery.data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: modelsQuery.error || null });
  }, [dispatch, modelsQuery.error]);

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = async (conversationId: Conversation["id"]) => {
    if (conversationId !== selectedConversationId) {
      dispatch({ field: 'selectedConversationId', value: conversationId });
    }
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [dispatch, selectedConversation]);

  useEffect(() => {
    dispatch({ field: 'systemDefaultModelId', value: systemDefaultModelId });
    const defaultModelId = models.length > 0 ?
      models.find(m => m.id == settings.defaultModelId || m.id == systemDefaultModelId) || models[0] : undefined;
    dispatch({ field: 'defaultModelId', value: defaultModelId?.id });

    dispatch({ field: 'defaultSystemPrompt', value: settings.defaultSystemPrompt || systemDefaultSystemPrompt });

    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
  }, [
    t,
    systemDefaultModelId,
    systemDefaultSystemPrompt,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
    settings,
    models,
  ]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    if (settingsQuery.data) {
      dispatch({
        field: 'settings',
        value: settingsQuery.data
      });
    }
  }, [dispatch, settingsQuery.data, systemDefaultModelId]);

  useEffect(() => {
    if (promptsQuery.data) {
      dispatch({ field: 'prompts', value: promptsQuery.data });
    }
  }, [dispatch, promptsQuery.data]);

  useEffect(() => {
    if (foldersQuery.data) {
      dispatch({ field: 'folders', value: foldersQuery.data });
    }
  }, [dispatch, foldersQuery.data]);

  useEffect(() => {
    if (promptSharingEnabled && publicPromptsQuery.data) {
      dispatch({ field: 'publicPrompts', value: publicPromptsQuery.data });
    }
  }, [dispatch, publicPromptsQuery.data, promptSharingEnabled]);

  useEffect(() => {
    if (promptSharingEnabled && publicFoldersQuery.data) {
      dispatch({ field: 'publicFolders', value: publicFoldersQuery.data });
    }
  }, [dispatch, publicFoldersQuery.data, promptSharingEnabled]);

  useEffect(() => {
    if (conversationsQuery.data) {
      dispatch({ field: 'conversations', value: conversationsQuery.data });
      const conversation: ConversationListing | undefined =
        conversationsQuery.data.length > 0
          ? conversationsQuery.data[0]
          : undefined;

      if (!selectedConversationId && modelsQuery.isFetched && modelsQuery.data) {
        if (conversation) {
          dispatch({ field: "selectedConversationId", value: conversation.id })
        } else {
          dispatch({
            field: 'selectedConversation',
            value: conversation ?? {
              id: uuidv4(),
              name: t('New Conversation'),
              messages: [],
              model: modelsQuery.data.find(m => m.id == defaultModelId) ||
                modelsQuery.data.length > 0 && modelsQuery.data[0],
              prompt: defaultSystemPrompt,
              temperature: settings.defaultTemperature,
              folderId: null,
            }
          });
        }
      }
    }
  }, [
    dispatch,
    defaultModelId,
    defaultSystemPrompt,
    conversationsQuery.data,
    settings.defaultTemperature,
    t,
    modelsQuery.data,
    modelsQuery.isFetched,
    selectedConversationId
  ]);

  useEffect(() => {
    if (selectedConversationQuery.data) {
      dispatch({ field: "selectedConversation", value: selectedConversationQuery.data });
    }
  }, [selectedConversationQuery.data, dispatch])

  useEffect(() => {
    // const apiKey = localStorage.getItem('apiKey');

    // if (serverSideApiKeyIsSet) {
    //   dispatch({ field: 'apiKey', value: '' });

    //   localStorage.removeItem('apiKey');
    // } else if (apiKey) {
    //   dispatch({ field: 'apiKey', value: apiKey });
    // }

    // const chatModeKeys = localStorage.getItem('chatModeKeys');
    // if (serverSidePluginKeysSet) {
    //   dispatch({ field: 'chatModeKeys', value: [] });
    //   localStorage.removeItem('chatModeKeys');
    // } else if (chatModeKeys) {
    //   dispatch({ field: 'chatModeKeys', value: chatModeKeys });
    // }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }
  }, [
    systemDefaultModelId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleSelectConversation,
      }}
    >
      <Head>
        <title>Chatbot UI</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {settingsQuery.data && (
        <HomeMain />
      )}
      {settingsQuery.isLoading && (<div className="absolute w-full h-full flex flex-1 self-stretch items-center justify-center bg-white dark:bg-[#343541]" >
        <Spinner size="25px" className="m-auto" />
      </div>)}
    </HomeContext.Provider>
  );
};
export default Home;

export const getServerSideProps: GetServerSideProps = async ({ locale, req, res }) => {
  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  const session = await getServerSession(req, res, authOptions)
  const consumptionLimitEnabled = (session?.user?.monthlyUSDConsumptionLimit && session.user.monthlyUSDConsumptionLimit >= 0)
    || DEFAULT_USER_LIMIT_USD_MONTHLY >= 0

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      isAzureOpenAI: OPENAI_API_TYPE === "azure",
      serverSidePluginKeysSet,
      supportEmail: SUPPORT_EMAIL,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
        'error'
      ])),
      promptSharingEnabled: PROMPT_SHARING_ENABLED,
      consumptionLimitEnabled,
      systemDefaultModelId: DEFAULT_MODEL,
      systemDefaultSystemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
  };
};
