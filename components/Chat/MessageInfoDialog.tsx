import { FC, useContext } from 'react';
import { useTranslation } from 'next-i18next';
import HomeContext from '@/pages/api/home/home.context';
import { Dialog } from '../Dialog/Dialog';
import ChatContext from './Chat.context';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const MessageInfoDialog: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation, consumptionLimitEnabled, userConsumptionLimitUSD },
  } = useContext(HomeContext);
  const {
    state: { selectedMessageIndex },
  } = useContext(ChatContext);

  const roundToFirstNonZeroDecimal = (num: number): number => {
    if (num === 0) return 0;
    // Find the factor needed to make the first significant digit after the decimal point.
    let factor = 1;
    while (Math.abs(num * factor) < 1) {
      factor *= 10;
    }
    // Round the number at the first significant digit
    return Math.round(num * factor) / factor;
  }

  const calculateBudgetPercent = (usd: number): number => {
    return userConsumptionLimitUSD !== undefined ? usd / userConsumptionLimitUSD * 100 : 0;
  }

  return (
    <Dialog open={open} onClose={() => onClose()} >
      <div className='text-black dark:text-neutral-200'>
        <div className="text-lg pb-4 font-bold text-black dark:text-neutral-200">
          {t('Message Info')}
        </div>
        {(selectedMessageIndex != undefined && selectedConversation) &&
          (<div className="flex flex-col gap-1 mb-2 ">
            {selectedConversation.messages[selectedMessageIndex].usage && (
              <>
                <div className='font-bold mb-2 text-black dark:text-neutral-200'>{t("Consumption")} </div>
                <div className='flex flex-col gap-1 pl-3'>
                  <div className='flex justify-between border-b border-white/20'>
                    <span>{t("Prompt tokens")}: </span><span>{selectedConversation.messages[selectedMessageIndex].usage?.tokens?.prompt}</span>
                  </div>
                  <div className='flex justify-between border-b border-white/20'>
                    <span>{t("Completion tokens")}: </span><span>{selectedConversation.messages[selectedMessageIndex].usage?.tokens?.completion}</span>
                  </div>
                  <div className='flex justify-between border-b border-white/20'>
                    <span>{t("Total tokens")}: </span><span>{selectedConversation.messages[selectedMessageIndex].usage?.tokens?.total}</span>
                  </div>
                  {consumptionLimitEnabled && (
                    <div className='flex justify-between border-b border-white/20'>
                      <span>{t("Estimated budget")}: </span><span>
                        {roundToFirstNonZeroDecimal(calculateBudgetPercent(selectedConversation.messages[selectedMessageIndex].usage?.totalPriceUSD || 0))}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>)
        }
      </div>
    </Dialog>
  );
};
