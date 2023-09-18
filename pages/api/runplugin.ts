import { NextApiRequest, NextApiResponse } from 'next';

import { ensureHasValidSession, getUserHash } from '@/utils/server/auth';

import { PluginResult, RunPluginRequest } from '@/types/agent';

import { createContext, executeTool } from '@/agent/plugins/executor';
import path from 'node:path';
import { getErrorResponseBody } from '@/utils/server/error';
import { verifyUserLlmUsage } from '@/utils/server/llmUsage';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Vercel Hack
  // https://github.com/orgs/vercel/discussions/1278
  // eslint-disable-next-line no-unused-vars
  const vercelFunctionHack = path.resolve('./public', '');

  if (!(await ensureHasValidSession(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = await getUserHash(req, res);

  try {
    const {
      taskId,
      model,
      action: toolAction,
    } = (await req.body) as RunPluginRequest;
    try {
      await verifyUserLlmUsage(userId, model.id);
    } catch (e: any) {
      return res.status(429).json({ error: e.message });
    }

    const verbose = process.env.DEBUG_AGENT_LLM_LOGGING === 'true';
    const context = await createContext(taskId, req, res, model, verbose);
    const toolResult = await executeTool(context, toolAction);
    const result: PluginResult = {
      action: toolAction,
      result: toolResult,
    };
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    const errorRes = getErrorResponseBody(error);
    res.status(500).json(errorRes);
  }
};

export default handler;
