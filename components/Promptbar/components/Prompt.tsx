import {
  IconBulbFilled,
  IconCheck,
  IconTrash,
  IconCloudUpload,
  IconX,
} from '@tabler/icons-react';
import {
  DragEvent,
  MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Prompt } from '@/types/prompt';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';

import PromptbarContext from '../PromptBar.context';
import { PromptModal } from './PromptModal';
import { PromptShareModal } from './PromptShareModal';
import usePublicFolders from '@/hooks/usePublicFolders';

interface Props {
  prompt: Prompt;
  isEditable?: boolean;
  isRemovable?: boolean;
  isShareable?: boolean;
  isDraggable?: boolean;
  handleUpdatePrompt(prompt: Prompt): void;
  handleDeletePrompt(prompt: Prompt): void;
  handlePublishPrompt(prompt: Prompt): void;
}

export const PromptComponent = ({ prompt, isEditable = true, isRemovable = true, isShareable = true, isDraggable = true, handleUpdatePrompt, handleDeletePrompt, handlePublishPrompt }: Props) => {
  const {
    dispatch: promptDispatch,
  } = useContext(PromptbarContext);

  const [publicFolders] = usePublicFolders();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [actionButtonCount] = useState([isShareable, isRemovable].filter((bool) => bool).length);

  const handleUpdate = (prompt: Prompt) => {
    handleUpdatePrompt(prompt);
    promptDispatch({ field: 'searchTerm', value: '' });
  };

  const handlePublish = (prompt: Prompt) => {
    handlePublishPrompt(prompt);
    promptDispatch({ field: 'searchTerm', value: '' });
  };

  const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();

    if (isDeleting) {
      handleDeletePrompt(prompt);
      promptDispatch({ field: 'searchTerm', value: '' });
    }

    setIsDeleting(false);
  };

  const handleCancelDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, prompt: Prompt) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('prompt', JSON.stringify(prompt));
    }
  };

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  return (
    <div className="relative flex items-center">
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90"
        draggable={isDraggable}
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        onDragStart={isDraggable ? (e) => handleDragStart(e, prompt) : undefined}
        onMouseLeave={() => {
          setIsDeleting(false);
          setIsRenaming(false);
          setRenameValue('');
        }}
      >
        <IconBulbFilled size={18} />

        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3"
          style={{ paddingRight: actionButtonCount * 1.5 + "rem" }}>
          {prompt.name}
        </div>
      </button>

      {(isDeleting || isRenaming) && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          <SidebarActionButton handleClick={handleDelete}>
            <IconCheck size={18} />
          </SidebarActionButton>

          <SidebarActionButton handleClick={handleCancelDelete}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          {isShareable &&
            <SidebarActionButton handleClick={() => setShowShareModal(true)}>
              <IconCloudUpload size={18} />
            </SidebarActionButton>
          }
          {isRemovable &&
            <SidebarActionButton handleClick={handleOpenDeleteModal}>
              <IconTrash size={18} />
            </SidebarActionButton>
          }
        </div>
      )}

      {showModal && (
        <PromptModal
          open={showModal}
          prompt={prompt}
          onClose={() => setShowModal(false)}
          onUpdatePrompt={handleUpdate}
          isEditable={isEditable}
        />
      )}

      {showShareModal && (
        <PromptShareModal
          open={showShareModal}
          prompt={prompt}
          folders={publicFolders}
          onClose={() => setShowShareModal(false)}
          onPublishPrompt={handlePublish}
        />
      )}
    </div>
  );
};
