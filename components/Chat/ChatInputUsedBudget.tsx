import { memo, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';
import { trpc } from '@/utils/trpc';

export const ChatInputUsedBudget = memo(() => {
  const { t } = useTranslation('chat');
  const [usedBudgetPercent, setUsedBudgetPercent] = useState<number>(0)
  const usedBudgetPercentQuery = trpc.llmUsage.getBudgetConsumptionPercent.useQuery();
  const {
    state: { messageIsStreaming },
  } = useContext(HomeContext);

  useEffect(() => {
    setUsedBudgetPercent(Math.floor(usedBudgetPercentQuery.data || 0));
  }, [setUsedBudgetPercent, usedBudgetPercentQuery.data]);

  useEffect(() => {
    if (!messageIsStreaming) usedBudgetPercentQuery.refetch();
  }, [messageIsStreaming]);

  return (
    <div className="my-1 px-2 text-neutral-400 pointer-events-auto text-xs">
      {t('Used budget')}: <span className={usedBudgetPercent > 90 ? "text-red-400" : ""}>{usedBudgetPercent}%</span>
    </div>
  );
})
ChatInputUsedBudget.displayName = 'ChatInputUsedBudget';
