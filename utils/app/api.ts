import { ChatMode, ChatModeID } from '@/types/chatmode';

export const getEndpoint = (plugin: ChatMode | null) => {
  if (!plugin) {
    return 'api/chat';
  }

  if (plugin.id === ChatModeID.GOOGLE_SEARCH) {
    return 'api/google';
  }

  return 'api/chat';
};

export const watchRefToAbort = async <R>(
  ref: React.MutableRefObject<boolean>,
  fn: (controller: AbortController) => Promise<R>,
  abortController?: AbortController,
): Promise<R> => {
  const controller = abortController || new AbortController();
  let interval: any | null = null;
  try {
    interval = setInterval(() => {
      if (ref.current === true) {
        ref.current = false;
        controller.abort();
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    }, 200);
    return await fn(controller);
  } finally {
    if (interval) {
      clearInterval(interval);
    }
  }
};

export function readFileToText(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(file, "utf-8");
  });
}

export function encodeFileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; // Extract the Base64 data from the Data URL
      resolve(base64Data);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}