import NextAuth, { DefaultSession } from "next-auth";
import { User } from './user'
declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: User
  }
}