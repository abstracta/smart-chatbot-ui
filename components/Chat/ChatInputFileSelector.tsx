import { ChangeEvent, useCallback, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';

import { IconFileUpload } from '@tabler/icons-react';
import ChatContext from './Chat.context';
import toast from 'react-hot-toast';
import { MessageAttachment } from '@/types/chat';
import { readFileToText } from '@/utils/app/api';
import { v4 as uuidv4 } from 'uuid';
import { ChatInitialState } from './Chat.state';
import wcmatch from 'wildcard-match'
import { ErrorResponseCode } from '@/types/error';

const allowedTypes = ["text/*", "application/json", "application/yaml", "application/x-yaml",
  "application/xml", "application/xhtml+xml", "application/x-shellscript"]
const maxAttachments = 3;
const maxFileSizeBytes = 1048576 //1MB;

interface Props {
  onSelect: (attachments: MessageAttachment[], attachmentTokens: ChatInitialState["attachmentsTokens"])
    => void
}
const ChatInputFileSelector = ({ onSelect }: Props) => {
  const { t } = useTranslation('chat');
  const { t: tError } = useTranslation('error');
  const {
    state: { attachments, tokenizer, attachmentsTokens, droppedFiles },
    dispatch: chatDispatch,
  } = useContext(ChatContext);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = useCallback((file: File): { valid: boolean, error?: string } => {
    const matches = allowedTypes.some((t) => wcmatch(t)(file.type))
    if (!matches) {
      return {
        valid: false,
        error: tError("The selected file {{fileName}} is not in a supported format. Please select a text file.",
          { fileName: file.name }) as string
      }
    }
    if (file.size > maxFileSizeBytes) {
      return {
        valid: false,
        error: tError("The file {{fileName}} size exceeds the maximum allowed limit. Please choose a file that is smaller than {{maxFileSize}}.",
          { fileName: file.name, maxFileSize: "1MB" }) as string
      }
    }
    return { valid: true };
  }, [tError])

  const processFiles = useCallback(async (files: File[]) => {
    if (attachments.length + files.length > 3) {
      toast.error(tError("You have selected more than {{maxAttachments}} files. Please select up to {{maxAttachments}} files only.",
        { maxAttachments }) as string);
      return false;
    }
    try {
      const newAttachments = await Promise.all([...files.map(async (f) => {
        const { valid, error } = validateFile(f);
        if (!valid) throw new Error(error)
        return {
          _id: uuidv4(),
          name: f.name,
          contentType: f.type,
          content: await readFileToText(f),
          size: f.size,
        }
      })]);
      const newAttachmentTokens = newAttachments.reduce((prev, curr) => {
        const tokens = tokenizer.current?.encode(curr.content, "all").length;
        prev[curr._id] = (tokens || 0);
        return prev;
      }, {} as typeof attachmentsTokens)

      onSelect(newAttachments, newAttachmentTokens);
    } catch (e) {
      if (e instanceof Error) toast.error(e.message)
    }
  }, [tokenizer, attachments, onSelect, tError, validateFile])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (inputRef.current && inputRef.current.files?.length) {
      processFiles(Array.from(inputRef.current.files));
      inputRef.current.value = "";
    }
  }

  useEffect(() => {
    (async () => {
      if (droppedFiles.length) {
        await processFiles(droppedFiles);
        chatDispatch({ field: "droppedFiles", value: [] });
      }
    })()
  }, [droppedFiles, chatDispatch, processFiles])

  return (
    <div>
      <button
        className="absolute left-10 top-2 rounded p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 
          hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
        onClick={() => { inputRef.current?.click() }}
      >
        <IconFileUpload size={20} />
      </button>
      <div className="hidden">
        <input type="file" ref={inputRef}
          onChange={handleFileChange}
          accept={allowedTypes.join(",")}
          multiple={true}
          hidden />
      </div>
    </div>
  );
}
ChatInputFileSelector.displayName = "ChatInputFileSelector";

export default ChatInputFileSelector;