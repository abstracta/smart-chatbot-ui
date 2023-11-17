import { useContext } from 'react';

import { useAgentMode } from '@/hooks/chatmode/useAgentMode';
import { useDirectMode } from '@/hooks/chatmode/useDirectMode';
import { useGoogleMode } from '@/hooks/chatmode/useGoogleMode';

import { ChatModeRunner } from '@/types/chat';
import { ChatMode, ChatModeID } from '@/types/chatmode';

import HomeContext from '@/pages/api/home/home.context';

export const useChatModeRunner = () => {
  const {
    state: { stopConversationRef },
  } = useContext(HomeContext);
  const directMode = useDirectMode(stopConversationRef);
  const googleMode = useGoogleMode();
  const conversationalAgentMode = useAgentMode(
    stopConversationRef,
    true,
  );
  const agentMode = useAgentMode(stopConversationRef, false);
  return (plugin: ChatMode | null): ChatModeRunner => {
    if (!plugin) {
      return directMode;
    }
    switch (plugin.id) {
      case ChatModeID.GOOGLE_SEARCH:
        return googleMode;
      case ChatModeID.AGENT:
        return agentMode;
      case ChatModeID.CONVERSATIONAL_AGENT:
        return conversationalAgentMode;
      default:
        return directMode;
    }
  };
};
