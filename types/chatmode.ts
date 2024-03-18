export interface ChatMode {
  id: ChatModeID;
  name: ChatModeName;
}

export enum ChatModeID {
  DIRECT = 'direct',
  AGENT = 'agent',
  CONVERSATIONAL_AGENT = 'conversational-agent',
  GOOGLE_SEARCH = 'google-search',
}

export enum ChatModeName {
  DIRECT = 'Chat',
  AGENT = 'Agent',
  CONVERSATIONAL_AGENT = 'Conversational Agent',
  GOOGLE_SEARCH = 'Google Search',
}

export const ChatModes: Record<ChatModeID, ChatMode> = {
  [ChatModeID.DIRECT]: {
    id: ChatModeID.DIRECT,
    name: ChatModeName.DIRECT,
  },
  [ChatModeID.AGENT]: {
    id: ChatModeID.AGENT,
    name: ChatModeName.AGENT,
  },
  [ChatModeID.CONVERSATIONAL_AGENT]: {
    id: ChatModeID.CONVERSATIONAL_AGENT,
    name: ChatModeName.CONVERSATIONAL_AGENT,
  },
  [ChatModeID.GOOGLE_SEARCH]: {
    id: ChatModeID.GOOGLE_SEARCH,
    name: ChatModeName.GOOGLE_SEARCH,
  },
};

export const ChatModeList = Object.values(ChatModes);
