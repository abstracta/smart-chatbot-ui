import { memo, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { Tiktoken } from 'tiktoken/lite';
import { getTiktokenEncoding } from '@/utils/server/tiktoken';

const ChatInputTokenCount = memo(function (props: { content: string | undefined }) {
  const { t } = useTranslation('chat');
  const {
    state: { selectedConversation },
  } = useContext(HomeContext);

  const tokenizer = useRef<Tiktoken | null>(null);

  useEffect(() => {
    let model: Tiktoken | null;
    if (selectedConversation?.model) {
      model = getTiktokenEncoding(selectedConversation?.model.id);
      tokenizer.current = model;
    }
    return () => {
      model?.free();
    };
  }, [selectedConversation?.model]);

  const serialized = `${props.content || ''}`;
  const count = tokenizer.current?.encode(serialized, 'all').length;
  if (count == null) return null;
  return (
    <div className="py-1 px-2 text-neutral-400 pointer-events-auto text-xs">
      {t('{{count}} tokens', {
        count,
      })}
    </div>
  );
})
ChatInputTokenCount.displayName = "ChatInputTokenCount";

export default ChatInputTokenCount;