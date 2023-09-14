import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/pages/api/auth/[...nextauth]';

import crypto from 'crypto';

export const ensureHasValidSession = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> => {
  const session = await getServerSession(req, res, authOptions);
  return session !== null;
};

export const getUserHash = async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<string> => {
  // TODO: support no auth environment.

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    throw new AuthError('Unauthorized');
  }
  const email = session.user?.email;
  if (!email) {
    throw new AuthError('Unauthorized. No email found in session');
  }
  return getUserHashFromMail(email);
};

export class AuthError extends Error{}

export const getUserHashFromMail = (email: string): string => {
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  return hash;
};
