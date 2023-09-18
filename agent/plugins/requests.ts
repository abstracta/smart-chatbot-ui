// This file is derived from:
// https://github.com/hwchase17/langchainjs/blob/main/langchain/src/tools/requests.ts
import {
  calcCosineSimilarity,
  createEmbedding,
} from '@/utils/server/similarity';
import {
  chunkTextByTokenSize,
  extractTextFromHtml,
  extractUrl,
} from '@/utils/server/webpage';

import { Action, Plugin } from '@/types/agent';

import { TaskExecutionContext } from './executor';
import { getOpenAIApiEmbeddings } from '@/utils/server/openai';

export interface Headers {
  [key: string]: string;
}

export interface RequestTool {
  headers: Headers;
}

export class RequestsGetTool implements Plugin, RequestTool {
  nameForHuman = 'requests_get_api';
  nameForModel = 'requests_get_api';
  displayForUser = false;

  constructor(public headers: Headers = {}) { }

  async execute(context: TaskExecutionContext, action: Action) {
    const input = action.pluginInput;
    const res = await fetch(input, {
      headers: this.headers,
    });
    return res.text();
  }

  descriptionForHuman = 'Use this when you want to GET to a web using API.';
  descriptionForModel = `A portal to the internet. Use this when you need to get specific content using API. 
  Input should be a  url (i.e. https://www.google.com). The output will be the text response of the GET request.`;
}

export class RequestsPostTool implements Plugin, RequestTool {
  nameForHuman = 'requests_post_api';
  nameForModel = 'requests_post_api';
  displayForUser = false;

  constructor(public headers: Headers = {}) { }

  async execute(context: TaskExecutionContext, action: Action) {
    const input = action.pluginInput;
    try {
      const { url, data } = JSON.parse(input);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...this.headers },
        body: JSON.stringify(data),
      });
      return res.text();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return 'ERROR: Action Input must be a json with two keys: "url" and "data".';
      }
      return `${error}`;
    }
  }

  descriptionForHuman = 'Use this when you want to POST to an API endpoint.';
  descriptionForModel = `Use this when you want to POST to an API endpoint.
  Input should be a json string with two keys: "url" and "data".
  The value of "url" should be a string, and the value of "data" should be a dictionary of 
  key-value pairs you want to POST to the url as a JSON body.
  Be careful to always use double quotes for strings in the json string
  The output will be the text response of the POST request.`;
}

export class RequestsGetWebpageTool implements Plugin, RequestTool {
  nameForHuman = 'Get Webpage';
  nameForModel = 'requests_get_webpage_content';
  displayForUser = true;

  constructor(public headers: Headers = {}) { }

  async execute(context: TaskExecutionContext, action: Action) {
    const input = action.pluginInput;
    const url = extractUrl(input);
    if (!url) {
      throw new Error('invalid input.');
    }
    console.log(`fetch(${this.nameForModel}):` + url);
    const res = await fetch(url, {
      headers: this.headers,
    });
    const html = await res.text();
    const text = extractTextFromHtml(html);
    const encoding = await context.getEncoding();
    const openai = getOpenAIApiEmbeddings();
    const promises = chunkTextByTokenSize(encoding, text, 200)
      .slice(0, 10)
      .map((chunk) =>
        createEmbedding(chunk, openai, context.userId).then((embedding) => {
          return { chunk, embedding };
        }),
      );
    encoding.free();
    const thoughtEmbedding = await createEmbedding(
      action.thought,
      openai,
      context.userId
    );
    const webEmbeddings = await Promise.all(promises);
    const sortedWebChunks = webEmbeddings
      .map(({ chunk, embedding }) => {
        const similarity = calcCosineSimilarity(thoughtEmbedding, embedding);
        return { similarity, embedding, chunk };
      })
      .sort((a, b) => b.similarity - a.similarity);
    if (sortedWebChunks.length === 0) {
      return '';
    }
    return sortedWebChunks
      .map((c) => c.chunk)
      .slice(0, 5)
      .join('\n\n');
  }

  descriptionForHuman =
    'Use this when you want to GET a text content of the webpage.';
  descriptionForModel = `A portal to the internet. Use this when you need to get specific content from a website. 
  Input should be a  url (i.e. https://www.google.com). The output will be the text response of the GET request.`;
}

export class RequestsPostWebpageTool implements Plugin, RequestTool {
  nameForHuman = 'requests_post_webpage';
  nameForModel = 'requests_post_webpage';
  displayForUser = false;

  constructor(public headers: Headers = {}) { }

  async execute(context: TaskExecutionContext, action: Action) {
    const input = action.pluginInput;
    try {
      const { url, data } = JSON.parse(input);
      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
      });
      return res.text();
    } catch (error) {
      return `${error}`;
    }
  }

  descriptionForHuman = 'Use this when you want to POST to a webpage.';
  descriptionForModel = `Use this when you want to POST to a webpage.
  Input should be a json string with two keys: "url" and "data".
  The value of "url" should be a string, and the value of "data" should be a dictionary of 
  key-value pairs you want to POST to the url as a JSON body.
  Be careful to always use double quotes for strings in the json string
  The output will be the text response of the POST request.`;
}
