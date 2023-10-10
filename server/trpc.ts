import type { Context } from './context';

import { TRPCError, initTRPC } from '@trpc/server';

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;

const loggerMiddleware = middleware(async (opts) => {
  const start = Date.now();
  const result = await opts.next();
  const durationMs = Date.now() - start;
  const meta = {
    path: opts.path,
    type: opts.type, durationMs,
    userId: opts.ctx.userHash,
    input: opts.rawInput
  };

  if (meta.type === "mutation" && (meta.path.startsWith("publicPrompt") ||
    meta.path.startsWith("publicFolder"))) {
    result.ok ? console.log('OK request timing:', meta)
      : console.error('Non-OK request timing', meta);
  }

  return result;
});

const secure = middleware(async ({ ctx, next }) => {
  if (!ctx.userHash) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      userHash: ctx.userHash,
    },
  });
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const procedure = t.procedure.use(secure).use(loggerMiddleware);
