import { getServerSession } from 'next-auth';

import { getUserHash, AuthError } from '@/utils/server/auth';

import { authOptions } from '@/pages/api/auth/[...nextauth].page';

import { TRPCError, inferAsyncReturnType } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { UserRole } from '@/types/user';

export async function createContext(opts: CreateNextContextOptions) {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  let userHash: string | undefined;
  if (session) {
    try {
      userHash = await getUserHash(opts.req, opts.res);
    }
    catch (e) {
      if (e instanceof AuthError) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      throw e;
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    session,
    userHash,
  };
}
export type Context = inferAsyncReturnType<typeof createContext>;

export function isAdminUser(ctx: Context): boolean {
  return ctx.session?.user?.role === UserRole.ADMIN;
}

export function isPublicPromptEditor(ctx: Context): boolean {
  return ctx.session?.user?.role === UserRole.PUBLIC_PROMPT_EDITOR;
}
