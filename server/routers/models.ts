import { procedure, router } from '../trpc';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getLlmApiAggregator } from '@/utils/server/llm';

export const models = router({
  list: procedure
    .input(
      z.object({
        key: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const llmApi = await getLlmApiAggregator();
      return await llmApi.listModels();
    }),
});
