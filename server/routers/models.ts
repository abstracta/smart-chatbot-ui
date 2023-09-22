import {
  AZURE_OPENAI_DEPLOYMENTS,
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';

import { procedure, router } from '../trpc';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const models = router({
  list: procedure
    .input(
      z.object({
        key: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (OPENAI_API_TYPE === 'openai') {
        const key = input.key;

        let url = `${OPENAI_API_HOST}/v1/models`;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
            ...(OPENAI_ORGANIZATION && {
              'OpenAI-Organization': OPENAI_ORGANIZATION,
            }),
          },
        });

        if (response.status === 401) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
        } else if (response.status !== 200) {
          console.error(
            `OpenAI API returned an error ${response.status
            }: ${await response.text()}`,
          );
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'OpenAI API returned an error',
          });
        }

        const json = await response.json();

        const models: OpenAIModel[] = json.data
          .map((model: any) => {
            for (const [key, value] of Object.entries(OpenAIModelID)) {
              const modelId = model.id;
              if (value === modelId) {
                const r: OpenAIModel = {
                  id: modelId,
                  name: OpenAIModels[value].name,
                  maxLength: OpenAIModels[value].maxLength,
                  tokenLimit: OpenAIModels[value].tokenLimit,
                  type: OpenAIModels[value].type,
                };
                return r;
              }
            }
          })
          .filter(Boolean);
        return models;
      } else {
        return AZURE_OPENAI_DEPLOYMENTS ? Object.values(AZURE_OPENAI_DEPLOYMENTS) : [];
      }
    }),
});
