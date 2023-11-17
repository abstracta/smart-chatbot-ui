import { MutableRefObject } from 'react';

export const readStream = async (
  stream: ReadableStream<Uint8Array>,
  controller: AbortController,
  stopConversationRef: MutableRefObject<boolean>,
  onNewChunk: (chunk: string) => void,
): Promise<void> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let text = '';
  while (!done) {
    if (stopConversationRef.current === true) {
      stopConversationRef.current = false;
      controller.abort();
      done = true;
      break;
    }
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    text += chunkValue;
    onNewChunk(chunkValue);
    await new Promise(r => setTimeout(r, 10))
  }
};
