// apps/frontend/src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// On Vercel, NEXTAUTH_URL is not expanded from ${VERCEL_URL} in the dashboard.
// Derive it here so you can leave NEXTAUTH_URL unset or use the real URL.
if (process.env.VERCEL_URL) {
  const url = process.env.NEXTAUTH_URL;
  if (!url?.startsWith("https://") || url.includes("${")) {
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  }
}

// In Docker, DIRECT_URL is set to the internal Docker network URL (postgres:5432)
// Use it as the primary URL for database connections in containerized environments
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
    async jwt({ token, user }) {
      // On sign-in, persist the user fields into the JWT so they are available to session().
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) {
        // JWT strategy: user is often undefined; rely on token.
        // DB strategy: user is present; keep compatibility.
        session.user.id = user?.id ?? (typeof token?.sub === "string" ? token.sub : session.user.id);
        session.user.email =
          user?.email ??
          (typeof token?.email === "string" ? token.email : session.user.email);
        // Load isAdmin from DB so it is always up to date (not stored in JWT).
        const userId = session.user.id;
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true },
          });
          session.user.isAdmin = dbUser?.isAdmin ?? false;
        } else {
          session.user.isAdmin = false;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // The PrismaAdapter handles the account creation/linking automatically
      // if 'allowDangerousEmailAccountLinking' is true or if the user is already logged in.
      return true;
    },
    async redirect({ url, baseUrl }) {
      // After sign in, redirect to dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    }
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };