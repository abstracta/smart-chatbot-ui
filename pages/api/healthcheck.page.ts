import { NextApiRequest, NextApiResponse } from 'next';

import { getDb } from '@/utils/server/storage';
import { getLlmApiAggregator } from '@/utils/server/llm';

const mongoDBCheck = async () => {
  try {
    await (await getDb()).command({ ping: 1 })
    return true;
  }
  catch (e) {
    console.error("MongoDB health check failed.", e);
    return false;
  }
}

const llmApisCheck = async () => {
  try {
    const llmApi = await getLlmApiAggregator();
    const models = await llmApi.listModels();
    return models.length > 0
  }
  catch (e) {
    console.error("OpenAI health check failed.", e);
    return false;
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const checks: (Promise<boolean>)[] = [
    llmApisCheck(),
    mongoDBCheck()
  ]
  const checkResults = await Promise.all(checks);
  const failedChecks = checkResults.filter(c => !c);
  res.status(failedChecks.length > 0 ? 500 : 200).end();
};

export default handler;
