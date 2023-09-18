import { router } from '../trpc';
import { conversations } from './conversations';
import { folders } from './folders';
import { publicFolders } from './publicFolders';
import { models } from './models';
import { prompts } from './prompts';
import { publicPrompts } from './publicPrompts';
import { settings } from './settings';
import { llmUsage } from './llmUsage';

export const appRouter = router({
  models,
  settings,
  prompts,
  publicPrompts,
  folders,
  publicFolders,
  conversations,
  llmUsage
});

// export type definition of API
export type AppRouter = typeof appRouter;
