import NextAuth, { CallbacksOptions, NextAuthOptions, PagesOptions, Session } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CognitoProvider from 'next-auth/providers/cognito';
import Credentials from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { UserInfoDb, getDb } from '@/utils/server/storage';
import { User, UserRole } from '@/types/user';
import { getUserHashFromMail } from '@/utils/server/auth';

import loggerFn from 'pino';

const logger = loggerFn({ name: 'auth' });

const providers = [];
if (process.env.NEXTAUTH_ENABLED === 'false') {
  providers.push(
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'text' },
      },
      async authorize(credentials: any, req: any) {
        const email = credentials.email.trim();
        const id = getUserHashFromMail(email);
        return {
          id,
          email,
        };
      },
    }),
  );
}
if (process.env.GOOGLE_CLIENT_ID) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}
if (process.env.GITHUB_CLIENT_ID) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  );
}
if (process.env.COGNITO_CLIENT_ID) {
  providers.push(
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    }),
  );
}
if (process.env.AZURE_AD_CLIENT_ID) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      profile(profile) {
        return {
          id: profile.oid,
          name: profile.name,
          email: profile.email,
          image: null
        }
      }
    }),
  );
}

let pages: Partial<PagesOptions> = {};

if (process.env.NEXTAUTH_ENABLED === 'false') {
  pages['signIn'] = '/auth/autologin';
}

const callbacks: Partial<CallbacksOptions> = {
  async signIn({ user, account, profile, email, credentials }) {
    await updateOrCreateUser(user.email!, user.name || "");
    return true
  },
  async session({ session, token, user }) {
    session.user = await getUser(session);
    return session
  }
}

export const authOptions: NextAuthOptions = {
  providers: providers,
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.NEXTAUTH_SESSION_MAX_AGE || '86400'),
  },
  events: {
    async signIn(message) {
      if (process.env.AUDIT_LOG_ENABLED === 'true') {
        logger.info({ event: 'signIn', user: message.user });
      }
    },
  },
  pages,
  callbacks: callbacks
};

async function getUserDb() {
  return new UserInfoDb(await getDb());
}

async function getUser(session: Session): Promise<User> {
  if (!session.user?.email) throw new Error("Unauthorized");
  const userId = getUserHashFromMail(session.user.email);
  return (await (await getUserDb()).getUser(userId))!;
}

async function updateOrCreateUser(email: string, name?: string): Promise<User> {
  const userInfoDb = await getUserDb();
  const userId = getUserHashFromMail(email);
  const currentUser = await userInfoDb.getUser(userId);
  let updatedUser: User;
  if (!currentUser) {
    updatedUser = {
      _id: userId,
      email: email,
      name: name,
      role: UserRole.USER
    }
    await userInfoDb.addUser(updatedUser);
  }
  else {
    updatedUser = {
      ...currentUser,
      name: name
    };
    await userInfoDb.saveUser(updatedUser);
  }
  return updatedUser;
}

export default NextAuth(authOptions);
