import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GMAIL_CLIENT_ID!,
      clientSecret: process.env.GMAIL_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request offline access to get a Refresh Token for the backend workers
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
        session.user.id = user.id; // Expose ID to client
      }
      return session;
    },
    // When a user registers, create their default CronJob and Preferences
    async signIn({ user, account, profile }) {
        // Note: PrismaAdapter usually handles user creation, but we can hook in 
        // to ensure relations exist or use Prisma Middleware/Triggers.
        // For simplicity, we assume the backend API ensures these exist on first data fetch.
        return true;
    }
  },
  session: {
    strategy: "database", // Use DB sessions for security and consistency
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };