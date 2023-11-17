import { getMonthlyUsedBudgetPercent } from '@/utils/server/llmUsage';
import { adminProcedure, procedure, router } from '../trpc';
import { UserInfoDb, getDb } from '@/utils/server/storage';
import { z } from 'zod';
import { LlmID } from '@/types/llm';

export const llmUsage = router({
  getBudgetConsumptionPercent: procedure.query(async ({ ctx }) => {
    return await getMonthlyUsedBudgetPercent(ctx.userHash);
  }),
  getLlmUsageStatsPerUser: adminProcedure
    .input(z.object({ start: z.date(), end: z.date(), modelIds: z.array(z.nativeEnum(LlmID)).optional() }))
    .query(async ({ ctx, input }) => {
      const userInfoDB = new UserInfoDb(await getDb());
      return userInfoDB.queryLlmUsageStatsPerUser(input.start, input.end, input.modelIds);
    }),
  getLlmUsageIds: adminProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .query(async ({ ctx, input }) => {
      const userInfoDB = new UserInfoDb(await getDb());
      return userInfoDB.getLlmUsageIds(input.start, input.end);
    })
});

