import { ConversationListing } from '@/types/chat';

export interface ChatbarInitialState {
  searchTerm: string;
  filteredConversations: ConversationListing[];
}

export const initialState: ChatbarInitialState = {
  searchTerm: '',
  filteredConversations: [],
};
