import { MutableRefObject } from 'react';

import { Conversation, ConversationListing, Message } from '@/types/chat';
import { FolderInterface } from '@/types/folder';
import { Prompt, PublicPrompt } from '@/types/prompt';
import { Llm, LlmID, LlmTemperature } from '@/types/llm';
import { Settings } from '@/types/settings';

export interface HomeInitialState {
  appName: string;
  apiKey: string;
  loading: boolean;
  settings: Settings;
  messageIsStreaming: boolean;
  modelError: Error | null;
  models: Llm[];
  folders: FolderInterface[];
  publicFolders: FolderInterface[];
  conversations: ConversationListing[];
  selectedConversationId: Conversation["id"] | undefined;
  selectedConversation: Conversation | undefined;
  currentMessage: Message | undefined;
  prompts: Prompt[];
  publicPrompts: PublicPrompt[];
  showChatbar: boolean;
  showPromptbar: boolean;
  currentFolder: FolderInterface | undefined;
  messageError: boolean;
  searchTerm: string;
  systemDefaultModelId: LlmID;
  defaultModelId: LlmID | undefined;
  defaultSystemPrompt: string;
  stopConversationRef: MutableRefObject<boolean>;
  consumptionLimitEnabled: boolean;
  userConsumptionLimitUSD: number | undefined;
  isAzureOpenAI: boolean;
  supportEmail: string;
  promptSharingEnabled: boolean;
  isGoogleSearchEnabled: boolean;
  isAgentEnabled: boolean;
  modelMigrations: Record<LlmID, LlmID> | undefined;
}

export const initialState: Partial<HomeInitialState> = {
  appName: '',
  loading: false,
  settings: {
    userId: '',
    theme: 'dark',
    defaultTemperature: LlmTemperature.NEUTRAL,
    defaultModelId: undefined,
    defaultSystemPrompt: '',
  },
  messageIsStreaming: false,
  modelError: null,
  models: [],
  folders: [],
  publicFolders: [],
  conversations: [],
  currentMessage: undefined,
  prompts: [],
  publicPrompts: [],
  showPromptbar: true,
  showChatbar: true,
  currentFolder: undefined,
  messageError: false,
  searchTerm: '',
  systemDefaultModelId: undefined,
  defaultModelId: undefined,
  defaultSystemPrompt: '',
  consumptionLimitEnabled: false,
  userConsumptionLimitUSD: undefined,
  isAzureOpenAI: false,
  supportEmail: '',
  promptSharingEnabled: false,
  isGoogleSearchEnabled: false,
  isAgentEnabled: false,
};
