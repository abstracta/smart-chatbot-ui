import { useTranslation } from 'react-i18next';

import { IconDownload, IconFile, IconX } from '@tabler/icons-react';
import { MessageAttachment } from '@/types/chat';

interface Props {
  className?: string;
  attachment: MessageAttachment;
  removable?: boolean;
  downloadable?: boolean;
  onRemove?: () => void;
  onDownload?: () => void;
}

const FileAttachment = ({
  className,
  attachment,
  removable,
  downloadable,
  onRemove,
  onDownload,
}: Props) => {
  const { t } = useTranslation('common');

  return (
    <div className={`flex items-center gap-4 min-w-[120px] w-auto max-w-[250px] px-2 py-1.5
          rounded border border-neutral-500 dark:border-neutral-800 
          dark:bg-zinc-300 dark:text-neutral-700 shadow shadow-inset text-sm ${className}`}
    >
      <div className="flex gap-1 items-center">
        <IconFile size={18} className='flex-shrink-0' />
        <span className='flex-grow text-ellipsis line-clamp-1 break-all overflow-hidden'
          title={attachment.name}>
          {attachment.name}
        </span>
      </div>
      <div className="flex">
        {downloadable && <IconDownload size={16} className='flex-shrink-0 cursor-pointer text-gray-800'
          onClick={onDownload} />}
        {removable && <IconX size={14} className='flex-shrink-0 text-red-700 cursor-pointer'
          onClick={onRemove} />}
      </div>
    </div>
  );
}
FileAttachment.displayName = "FileAttachment";

export default FileAttachment;