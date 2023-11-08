import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import ChatContext from './Chat.context';
import FileAttachment from './FileAttachment';

interface Props { }

const ChatInputFileAttachment = ({ }: Props) => {
  const { t } = useTranslation('chat');
  const {
    state: { attachments, attachmentsTokens },
    dispatch: chatDispatch,
  } = useContext(ChatContext);

  const handleFileRemove = (id: string) => {
    chatDispatch({ field: "attachments", value: attachments.filter(a => a._id !== id) })
    chatDispatch({
      field: "attachmentsTokens", value: Object.fromEntries(
        Object.entries(attachmentsTokens)
          .filter(([key, value]) => key !== id))
    })
  }

  return (
    <>
      {attachments.length > 0 &&
        (<div className='flex gap-1 bg-transparent px-2 pt-0 pb-1.5 text-black dark:bg-transparent dark:text-white'>
          {attachments.map((a) =>
            <FileAttachment key={a._id}
              attachment={a}
              removable={true}
              onRemove={() => handleFileRemove(a._id)}
            />
          )}
        </div>)
      }
    </>
  );
}
ChatInputFileAttachment.displayName = "ChatInputFileAttachment";

export default ChatInputFileAttachment;