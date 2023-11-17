import { Message } from './chat';

import { TaskExecutionContext } from '@/agent/plugins/executor';
import { LlmID } from './llm';

export type Action = {
  type: 'action';
  thought: string;
  plugin: PluginSummary;
  pluginInput: string;
};
export type Answer = {
  type: 'answer';
  answer: string;
};
export type ReactAgentResult = Action | Answer;

export interface PlanningResponse {
  taskId: string;
  result: ReactAgentResult;
}

export interface PluginResult {
  action: Action;
  result: string;
}

export interface PlanningRequest {
  taskId?: string;
  modelId: LlmID;
  messages: Message[];
  enabledToolNames: string[];
  pluginResults: PluginResult[];
}

export interface RunPluginRequest {
  taskId: string;
  modelId: LlmID;
  input: string;
  action: Action;
}

export interface ToolDefinitionApi {
  type: string;
  url: string;
  hasUserAuthentication: boolean;
}

export interface ToolAuth {
  type: string;
}
export interface Plugin {
  nameForHuman: string;
  nameForModel: string;
  descriptionForModel: string;
  descriptionForHuman: string;
  execute?: (context: TaskExecutionContext, action: Action) => Promise<string>;
  api?: ToolDefinitionApi;
  apiSpec?: string;
  auth?: ToolAuth;
  logoUrl?: string;
  contactEmail?: string;
  legalInfoUrl?: string;
  displayForUser: boolean;
}

export interface RemotePluginTool extends Plugin {
  api: ToolDefinitionApi;
  apiSpec: string;
  auth: ToolAuth;
}

export interface PluginSummary {
  nameForHuman: string;
  nameForModel: string;
  descriptionForModel: string;
  descriptionForHuman: string;
  displayForUser: boolean;
  logoUrl?: string;
}
