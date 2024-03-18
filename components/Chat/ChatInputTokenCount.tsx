import { memo, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

import ChatContext from './Chat.context';
import HomeContext from '@/pages/api/home/home.context';

const ChatInputTokenCount = memo(function () {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation },
  } = useContext(HomeContext);
  const {
    state: { userMessageTokens, attachmentsTokens },
  } = useContext(ChatContext);

  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const filesTokens = Object.values(attachmentsTokens)
      .reduce((prev, curr) => prev + curr, 0)
    setCount(userMessageTokens + filesTokens);
  }, [userMessageTokens, attachmentsTokens])

  return (
    <div className={`py-1 px-2 text-neutral-400 pointer-events-auto text-xs 
      ${selectedConversation?.model.tokenLimit && count > selectedConversation.model.tokenLimit ?
        'text-red-400' : ''}`}
    >
      {t('{{count}} tokens', { count })}
    </div>
  );
})
ChatInputTokenCount.displayName = "ChatInputTokenCount";

export default ChatInputTokenCount;