import { MutableRefObject } from 'react';
import { createParser, type ParsedEvent, type ReconnectInterval } from 'eventsource-parser'

export const readEventStream = async (
  stream: ReadableStream<Uint8Array>,
  controller: AbortController,
  stopConversationRef: MutableRefObject<boolean>,
  onNewEvent: (chunk: ParsedEvent) => void,
): Promise<void> => {
  const decoder = new TextDecoder();
  const parser = createParser(function onParse(event: ParsedEvent | ReconnectInterval) {
    if (event.type === 'event') {
      onNewEvent(event);
    } else if (event.type === 'reconnect-interval') {
      throw new Error()
    }
  })

  for await (const chunk of readableStreamToAsyncIterator(stream.getReader())) {
    if (stopConversationRef.current === true) {
      stopConversationRef.current = false;
      controller.abort();
      break;
    }
    const chunkValue = decoder.decode(chunk);
    parser.feed(chunkValue);
  }
};


async function* readableStreamToAsyncIterator(reader: ReadableStreamDefaultReader): AsyncIterable<Uint8Array> {
  while (true) {
    const { done, value } = await reader.read();
    if (done) return;
    yield value;
  }
}