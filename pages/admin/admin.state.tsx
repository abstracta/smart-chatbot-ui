
import { Settings } from '@/types/settings';

export interface AdminInitialState {
  showNavBar: boolean;
  settings: Settings;
  appName: string;
}

export const initialState: Partial<AdminInitialState> = {
  showNavBar: true,
  settings: {
    userId: '',
    theme: 'dark',
    defaultTemperature: 1.0,
    defaultModelId: undefined,
    defaultSystemPrompt: '',
  },
  appName: "",
};
