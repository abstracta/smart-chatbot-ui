import { Dispatch, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { Conversation } from '@/types/chat';

import { HomeInitialState } from './home.state';

export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;
  handleSelectConversation: (conversationId: Conversation["id"]) => void;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;
