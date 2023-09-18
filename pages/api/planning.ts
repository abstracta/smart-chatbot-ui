import { NextApiRequest, NextApiResponse } from 'next';

import { OpenAIError } from '@/utils/server';
import { ensureHasValidSession, getUserHash } from '@/utils/server/auth';

import { PlanningRequest, PlanningResponse } from '@/types/agent';

import { executeNotConversationalReactAgent } from '@/agent/agent';
import { createContext } from '@/agent/plugins/executor';
import path from 'node:path';
import { v4 } from 'uuid';
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
      model,
      messages,
      enabledToolNames,
      pluginResults: toolActionResults,
    } = req.body as PlanningRequest;

    try {
      await verifyUserLlmUsage(userId, model.id);
    } catch (e: any) {
      return res.status(429).json({ error: e.message });
    }
    
    let { taskId } = req.body;
    if (!taskId) {
      taskId = v4();
    }

    const lastMessage = messages[messages.length - 1];
    const verbose = process.env.DEBUG_AGENT_LLM_LOGGING === 'true';
    const context = await createContext(taskId, req, res, model, verbose);
    const result = await executeNotConversationalReactAgent(
      context,
      enabledToolNames,
      lastMessage.content,
      toolActionResults,
      verbose,
    );
    const responseJson = {
      result,
      taskId,
    } as PlanningResponse;
    res.status(200).json(responseJson);
  } catch (error) {
    console.error(error);
    const errorRes = getErrorResponseBody(error);
    res.status(500).json(errorRes);
  }
};

export default handler;
