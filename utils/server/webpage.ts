import { calcCosineSimilarity, createEmbedding } from './similarity';

import { Tiktoken } from 'tiktoken';
import { Readability } from '@mozilla/readability';
import jsdom, { JSDOM } from 'jsdom';
import { getOpenAIApiEmbeddings } from './openai';
import { TaskExecutionContext } from '@/agent/plugins/executor';

export const extractTextFromHtml = (html: string): string => {
  const virtualConsole = new jsdom.VirtualConsole();
  virtualConsole.on('error', (error) => {
    if (!error.message.includes('Could not parse CSS stylesheet')) {
      console.error(error);
    }
  });

  const dom = new JSDOM(html, { virtualConsole });
  const doc = dom.window.document;
  const parsed = new Readability(doc).parse();
  if (!parsed) {
    return '';
  }
  return cleanSourceText(parsed.textContent);
};

export const getTokenSize = (text: string, encoding: Tiktoken): number => {
  return encoding.encode(text).length;
};

export const sliceByTokenSize = (
  encoding: Tiktoken,
  text: string,
  start: number,
  end: number,
): string => {
  const tokens = encoding.encode(text);
  const decoder = new TextDecoder();
  return decoder.decode(encoding.decode(tokens.slice(start, end)));
};

export const chunkTextByTokenSize = (
  encoding: Tiktoken,
  text: string,
  chunkTokenSize: number,
): string[] => {
  const chunks = [];
  const tokens = encoding.encode(text);
  for (let i = 0; i < tokens.length; i += chunkTokenSize) {
    const tokensChunk = tokens.slice(i, i + chunkTokenSize);
    chunks.push(tokensChunk);
  }
  const decoder = new TextDecoder();
  return chunks.map((chunk) => {
    return decoder.decode(encoding.decode(chunk));
  });
};

export const getSimilarChunks = async (
  encoding: Tiktoken,
  input: string,
  text: string,
  chunkSize: number,
  context: TaskExecutionContext,
): Promise<string[]> => {
  const openAIApi = getOpenAIApiEmbeddings();
  const inputEmbedding = await createEmbedding(input, openAIApi, context.userId);
  const chunks = chunkTextByTokenSize(encoding, text, chunkSize);
  // get embedding for each chunk
  const chunkEmbeddings = await Promise.all(
    chunks.map((chunk) => {
      return createEmbedding(chunk, openAIApi, context.userId).then((embedding) => {
        return {
          embedding,
          chunk,
        };
      });
    }),
  );
  // get similarity score for each chunk
  const chunkSimilarities = chunkEmbeddings.map((chunkEmbedding) => {
    const similarity = calcCosineSimilarity(
      inputEmbedding,
      chunkEmbedding.embedding,
    );
    return {
      similarity,
      ...chunkEmbedding,
    };
  });
  return chunkSimilarities
    .sort((a, b) => b.similarity - a.similarity)
    .map((c) => c.chunk);
};

export const cleanSourceText = (text: string) => {
  return text
    .trim()
    .replace(/(\n){4,}/g, '\n\n\n')
    .replace(/\n\n/g, ' ')
    .replace(/ {3,}/g, '  ')
    .replace(/\t/g, '')
    .replace(/\n+(\s*\n)*/g, '\n');
};

export function extractUrl(text: string): string | null {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]+)+(?::\d+)?(?:\/\S*)?/g;
  const m = text.matchAll(regex);
  const urls = Array.from(m).map((match) => match[0]);
  return urls.length > 0 ? urls[0] : null;
}
