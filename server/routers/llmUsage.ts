import { getMonthlyUsedBudgetPercent } from '@/utils/server/llmUsage';
import { procedure, router } from '../trpc';

export const llmUsage = router({
  getBudgetConsumptionPercent: procedure.query(async ({ ctx }) => {
    return await getMonthlyUsedBudgetPercent(ctx.userHash);
  }),
});

