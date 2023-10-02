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
        authError();
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

export async function validateAdminAccess(ctx: Context) {
  if (!isAdminUser(ctx)) authError();
}

export function isAdminUser(ctx: Context): boolean {
  return ctx.session?.user?.role === UserRole.ADMIN;
}

export async function authError() {
  throw new TRPCError({ code: 'UNAUTHORIZED' });
}