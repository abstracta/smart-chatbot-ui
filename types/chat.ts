import { Plugin } from './agent';
import { LlmID, LlmTemperature } from './llm';
import { AzureOpenAIModelSchema } from './openai';

import * as z from 'zod';

export const RoleSchema = z.union([z.literal('system'), z.literal('assistant'), z.literal('user')]);

export type Role = z.infer<typeof RoleSchema>;

export const MessageAttachmentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  contentType: z.string(),
  content: z.string(),
  size: z.number(),
})

export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;

export const MessageSchema = z.object({
  role: RoleSchema,
  content: z.string(),
  attachments: z.array(MessageAttachmentSchema).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const ChatBodySchema = z.object({
  modelId: z.nativeEnum(LlmID),
  messages: z.array(MessageSchema),
  prompt: z.string(),
  temperature: z.nativeEnum(LlmTemperature),
  googleAPIKey: z.string().optional(),
  googleCSEId: z.string().optional(),
});

export type ChatBody = z.infer<typeof ChatBodySchema>;

export interface ChatModeRunner {
  run: (params: ChatModeRunnerParams) => void;
}

export interface ChatModeRunnerParams {
  body: ChatBody;
  message: Message;
  conversation: Conversation;
  selectedConversation: Conversation;
  plugins: Plugin[];
}

export const ConversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  messages: z.array(MessageSchema),
  model: AzureOpenAIModelSchema,
  prompt: z.string(),
  temperature: z.nativeEnum(LlmTemperature),
  folderId: z.string().nullable(),
});

export const ConversationSchemaArray = z.array(ConversationSchema);
export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationSchemaListing = ConversationSchema.pick({
  id: true,
  name: true,
  folderId: true
})
export type ConversationListing = z.infer<typeof ConversationSchemaListing>;
export const ConversationSchemaListingArray = z.array(ConversationSchemaListing);
