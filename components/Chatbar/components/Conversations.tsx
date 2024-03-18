import { ConversationListing } from '@/types/chat';

import { ConversationComponent } from './Conversation';

interface Props {
  conversations: ConversationListing[];
}

export const Conversations = ({ conversations }: Props) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {conversations
        .filter((conversation) => !conversation.folderId)
        .map((conversation) => (
          <ConversationComponent key={conversation.id} conversation={conversation} />
        ))}
    </div>
  );
};
