import { memo, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

import ChatContext from './Chat.context';
import HomeContext from '@/pages/api/home/home.context';
import { createMessagesToSend } from '@/utils/server/message';
import { IconInfoCircle } from '@tabler/icons-react';
import Tooltip from '../Tooltip';

const ChatInputTokenCount = memo(function () {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation, defaultSystemPrompt, messageIsStreaming },
  } = useContext(HomeContext);
  const {
    state: { userMessageTokens, attachmentsTokens, tokenizer },
  } = useContext(ChatContext);

  const [count, setCount] = useState<number>(0);
  const [contextCount, setContextCount] = useState<number>(0);

  useEffect(() => {
    const filesTokens = Object.values(attachmentsTokens)
      .reduce((prev, curr) => prev + curr, 0)
    setCount(userMessageTokens + filesTokens);
  }, [userMessageTokens, attachmentsTokens])

  useEffect(() => {
    if (!messageIsStreaming && tokenizer) {
      if (selectedConversation?.messages) {
        let { tokenCount } = createMessagesToSend(
          tokenizer,
          selectedConversation.model,
          defaultSystemPrompt,
          1000,
          selectedConversation?.messages
        )
        setContextCount(tokenCount);
      } else setContextCount(0);
    }
  }, [selectedConversation?.messages, selectedConversation?.model, tokenizer, defaultSystemPrompt, messageIsStreaming]);

  const formatTokens = (tokenCount: number): string => {
    if (tokenCount > 1000) return (tokenCount / 1000).toFixed(1) + "k";
    return tokenCount.toString();
  }

  const tooltipContent = (<div className='flex flex-col w-[15rem] gap-1'>
    <p>
      {t('tokenCountTooltipTotalTokens', { inputCount: formatTokens(count), contextCount: formatTokens(contextCount) })}
    </p>
    <p>
      {t('tokenCountTooltipAboutConsumtion')}
    </p>
    <p>
      {t('tokenCountTooltipHowToReduceConsumption')}
    </p>
  </div>)

  return (
    <div className={`flex align-items-center gap-1 py-1 px-2 text-neutral-400 pointer-events-auto text-xs 
      ${selectedConversation?.model.tokenLimit && count > selectedConversation.model.tokenLimit ?
        'text-red-400' : ''}`}
    >
      <Tooltip content={tooltipContent} position="top">
        <div className='flex gap-1'>
          <span className='flex gap-1'>
            {formatTokens(count + contextCount)}
          </span>
          <span>
            {t('Tokens')}
          </span>
          <span>
            <IconInfoCircle size={16} />
          </span>
        </div>
      </Tooltip>
    </div>
  );
})
ChatInputTokenCount.displayName = "ChatInputTokenCount";

export default ChatInputTokenCount;