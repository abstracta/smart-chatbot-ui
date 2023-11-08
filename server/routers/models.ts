import { procedure, router } from '../trpc';

import { TRPCError } from '@trpc/server';
import { getLlmApiAggregator } from '@/utils/server/llm';

export const models = router({
  list: procedure
    .query(async ({ ctx, input }) => {
      let models;
      try {
        const llmApi = await getLlmApiAggregator();
        models = await llmApi.listModels();
      }
      catch (e) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      if (!models || models.length == 0) throw new TRPCError({ message: "No models found.", code: "NOT_FOUND" })
      return models;
    }),
});
