import { PublicPromptsDb, UserDb, getDb } from '@/utils/server/storage';

import { PublicPromptSchema } from '@/types/prompt';

import { procedure, router } from '../trpc';

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Context, isAdminUser, isPublicPromptEditor } from '../context';

export const publicPrompts = router({
  list: procedure.query(async ({ ctx }) => {
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    return await publicPromptsDb.getPrompts();
  }),
  add: procedure.input(PublicPromptSchema).mutation(async ({ ctx, input }) => {
    const userDb = await UserDb.fromUserHash(ctx.userHash);
    await userDb.publishPrompt(input);
    return { success: true };
  }),
  remove: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const publicPromptsDb = new PublicPromptsDb(await getDb());
      await validateOwnerOrAdminAccess(input.id, ctx);
      await publicPromptsDb.removePrompt(input.id);
      return { success: true };
    }),
  update: procedure.input(PublicPromptSchema).mutation(async ({ ctx, input }) => {
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    await validateOwnerOrAdminAccess(input.id, ctx);
    await publicPromptsDb.savePrompt(input);
    return { success: true };
  }),
  increaseUsageCount: procedure.input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const publicPromptsDb = new PublicPromptsDb(await getDb());
      await publicPromptsDb.increasePromptUsageCount(input.id);
      return { success: true };
    }),
});

async function validateOwnerOrAdminAccess(promptId: string, ctx: Context) {
  if (!isAdminUser(ctx) && !isPublicPromptEditor(ctx)) {
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    const prompt = await publicPromptsDb.getPrompt(promptId);
    if (!prompt || prompt.userId != ctx.userHash!) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
  }
}