
import { LlmTemperature } from '@/types/llm';
import { Settings } from '@/types/settings';

export interface AdminInitialState {
  showNavBar: boolean;
  settings: Settings;
}

export const initialState: Partial<AdminInitialState> = {
  showNavBar: true,
  settings: {
    userId: '',
    theme: 'dark',
    defaultTemperature: LlmTemperature.NEUTRAL,
    defaultModelId: undefined,
    defaultSystemPrompt: '',
  },
};
