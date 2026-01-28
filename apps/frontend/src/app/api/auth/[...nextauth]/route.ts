// apps/frontend/src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions & { trustHost?: boolean } = {
  adapter: PrismaAdapter(prisma),
  // Use the request host for callbacks (required on Vercel; accepted at runtime by next-auth)
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GMAIL_CLIENT_ID!,
      clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      // [FIX] Allow merging accounts with the same email
      allowDangerousEmailAccountLinking: true, 
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly" 
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // The PrismaAdapter handles the account creation/linking automatically
      // if 'allowDangerousEmailAccountLinking' is true or if the user is already logged in.
      return true;
    }
  },
  session: {
    strategy: "database",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };