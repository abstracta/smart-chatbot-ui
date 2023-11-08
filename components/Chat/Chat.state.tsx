import { Plugin } from '@/types/agent';
import { MessageAttachment, MessageAttachmentSchema } from '@/types/chat';
import { ChatMode, ChatModes } from '@/types/chatmode';
import { MutableRefObject } from 'react';
import { Tiktoken } from 'tiktoken/lite';

export interface ChatInitialState {
  chatMode: ChatMode;
  selectedPlugins: Plugin[];
  attachments: MessageAttachment[];
  attachmentsTokens: Record<MessageAttachment["_id"], number>;
  userMessageTokens: number;
  tokenizer: MutableRefObject<Tiktoken | null>;
  droppedFiles: File[];
}

export const initialState: ChatInitialState = {
  chatMode: ChatModes.direct,
  selectedPlugins: [],
  attachments: [],
  attachmentsTokens: {},
  userMessageTokens: 0,
  tokenizer: { current: null },
  droppedFiles: []
};

