import { getMonthlyUsedBudgetPercent } from '@/utils/server/llmUsage';
import { adminProcedure, procedure, router } from '../trpc';
import { UserInfoDb, getDb } from '@/utils/server/storage';
import { z } from 'zod';

export const llmUsage = router({
  getBudgetConsumptionPercent: procedure.query(async ({ ctx }) => {
    return await getMonthlyUsedBudgetPercent(ctx.userHash);
  }),
  getLlmUsageStatsPerUser: adminProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .query(async ({ ctx, input }) => {
      const userInfoDB = new UserInfoDb(await getDb());
      return userInfoDB.queryLlmUsageStatsPerUser(input.start, input.end);
    })
});

