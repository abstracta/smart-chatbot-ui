import { PublicPromptsDb, getDb } from '@/utils/server/storage';

import { FolderSchema } from '@/types/folder';

import { procedure, router } from '../trpc';

import { z } from 'zod';
import { validateAdminAccess } from '../context';

export const publicFolders = router({
  list: procedure.query(async ({ ctx }) => {
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    return await publicPromptsDb.getFolders();
  }),
  remove: procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await validateAdminAccess(ctx);
      const publicPromptsDb = new PublicPromptsDb(await getDb());
      await publicPromptsDb.removeFolder(input.id);
      return { success: true };
    }),
  update: procedure.input(FolderSchema).mutation(async ({ ctx, input }) => {
    await validateAdminAccess(ctx);
    const publicPromptsDb = new PublicPromptsDb(await getDb());
    await publicPromptsDb.saveFolder(input);
    return { success: true };
  })
});
