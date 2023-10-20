import { PublicPromptsDb, getDb } from '@/utils/server/storage';

import { FolderSchema } from '@/types/folder';

import { procedure, router } from '../trpc';

import { z } from 'zod';
import { Context, isAdminUser, isPublicPromptEditor } from '../context';
import { TRPCError } from '@trpc/server';

export const publicFolders = router({
  list: procedure.query(async ({ ctx }) => {
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    return await publicPromptsDb.getFolders();
  }),
  remove: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await validateAdminOrEditorAccess(ctx);
      const publicPromptsDb = new PublicPromptsDb(await getDb());
      await publicPromptsDb.removeFolder(input.id);
      return { success: true };
    }),
  update: procedure.input(FolderSchema).mutation(async ({ ctx, input }) => {
    await validateAdminOrEditorAccess(ctx);
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    await publicPromptsDb.saveFolder(input);
    return { success: true };
  })
});

async function validateAdminOrEditorAccess(ctx: Context) {
  if (!(isAdminUser(ctx) || isPublicPromptEditor(ctx))) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
}