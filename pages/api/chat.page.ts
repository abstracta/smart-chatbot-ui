import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { saveLlmUsage, verifyUserLlmUsage } from '@/utils/server/llmUsage';
import { ensureHasValidSession, getUserHash } from '@/utils/server/auth';
import { createMessagesToSend } from '@/utils/server/message';
import { getTiktokenEncoding } from '@/utils/server/tiktoken';
import { getErrorResponseBody } from '@/utils/server/error';

import { ChatBodySchema } from '@/types/chat';

import { authOptions } from '@/pages/api/auth/[...nextauth].page';

import path from 'node:path';
import loggerFn from 'pino';
import { getLlmApiAggregator } from '@/utils/server/llm';

const logger = loggerFn({ name: 'chat' });

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Vercel Hack
  // https://github.com/orgs/vercel/discussions/1278
  // eslint-disable-next-line no-unused-vars
  const vercelFunctionHack = path.resolve('./public', '');

  if (!(await ensureHasValidSession(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (session && process.env.AUDIT_LOG_ENABLED === 'true') {
    logger.info({ event: 'chat', user: session.user });
  }

  const userId = await getUserHash(req, res);
  const { modelId, messages, key, prompt, temperature } = ChatBodySchema.parse(
    req.body,
  );
  try {
    await verifyUserLlmUsage(userId, modelId);
  } catch (e: any) {
    return res.status(429).json({ error: e.message });
  }
  const llmApiAggregator = await getLlmApiAggregator();
  const model = await llmApiAggregator.getModel(modelId);
  if (!model) {
    return res.status(404).json({ error: "Model not found" });
  }

  const encoding = getTiktokenEncoding(modelId);
  try {
    let systemPromptToSend = prompt;
    if (!systemPromptToSend) {
      systemPromptToSend = DEFAULT_SYSTEM_PROMPT;
    }
    let { messages: messagesToSend, maxToken } = createMessagesToSend(
      encoding,
      model,
      systemPromptToSend,
      1000,
      messages,
    );
    if (messagesToSend.length === 0) {
      throw new Error('message is too long');
    }
    const llmApi = llmApiAggregator.getApiForModel(modelId);
    const { usage, message } = await llmApi.chatCompletion(modelId, messagesToSend,
      {
        temperature,
        maxTokens: maxToken,
        callbacks: {
          ...(llmApi.getCanStream() ? {
            handleNewToken: (token: string) => {
              res.write(token);
            },
          } : {})
        }
      }
    );
    if (!llmApi.getCanStream()) res.write(message.content);
    res.end();

    await saveLlmUsage(userId, model.id, "chat", {
      prompt: usage?.prompt ?? 0,
      completion: usage?.completion ?? 0,
      total: usage?.total ?? 0
    })

  } catch (error) {
    console.error(error);
    const errorRes = getErrorResponseBody(error);
    res.status(500).json(errorRes);
  } finally {
    encoding.free();
  }
};


export default handler;
