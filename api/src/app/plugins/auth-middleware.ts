import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { decode, getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();

// 1. Augment Fastify Types
declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
  interface FastifyRequest {
    user?: { id: string; email: string };
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    // 2. Prefer NextAuth JWT (strategy: "jwt")
    // This supports the local CredentialsProvider admin bypass and any JWT-based sessions.
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) {
      try {
        // `getToken` only needs cookie headers; Fastify's `request.raw` doesn't match Next.js req types.
        const reqShim = { headers: request.headers, cookies: request.cookies } as any;
        let token =
          (await getToken({ req: reqShim, secret, cookieName: 'next-auth.session-token' })) ??
          (await getToken({ req: reqShim, secret, cookieName: '__Secure-next-auth.session-token' })) ??
          (await getToken({ req: reqShim, secret }));

        // Some environments/parsers confuse `getToken` (returns null without throwing).
        // Fall back to decoding the cookie value directly.
        if (!token) {
          const rawCookie =
            (request.cookies ?? {})['next-auth.session-token'] ??
            (request.cookies ?? {})['__Secure-next-auth.session-token'];
          if (typeof rawCookie === 'string' && rawCookie.length > 0) {
            try {
              token = await decode({ token: rawCookie, secret });
            } catch (err) {
              request.log.warn({ err }, 'JWT decode failed');
            }
          }
        }

        const email = typeof token?.email === 'string' ? token.email : undefined;
        const id = typeof token?.sub === 'string' ? token.sub : undefined;

        if (process.env.NODE_ENV !== 'production') {
          const sessionCookie =
            (request.cookies ?? {})['next-auth.session-token'] ??
            (request.cookies ?? {})['__Secure-next-auth.session-token'] ??
            null;
          const sessionCookieDotCount =
            typeof sessionCookie === 'string' ? sessionCookie.split('.').length - 1 : null;
          const secretFingerprint = `${secret.slice(0, 4)}…${secret.slice(-4)} (len=${secret.length})`;
          request.log.info(
            {
              hasCookieHeader: typeof request.headers.cookie === 'string' && request.headers.cookie.length > 0,
              cookieKeys: Object.keys(request.cookies ?? {}),
              sessionCookieLength: typeof sessionCookie === 'string' ? sessionCookie.length : null,
              sessionCookieDotCount,
              secretFingerprint,
              tokenEmail: email ?? null,
              tokenSub: id ?? null,
            },
            'Auth debug (NextAuth JWT)'
          );
        }

        if (email) {
          request.user = { id: id ?? 'jwt', email };
          return;
        }
      } catch (err) {
        request.log.warn({ err }, 'Failed to decode NextAuth JWT (will fall back to DB session)');
      }
    } else {
      request.log.warn('NEXTAUTH_SECRET is not set (JWT auth disabled; falling back to DB session)');
    }

    // 3. Fall back to DB sessions (strategy: "database") for backward compatibility
    const cookies = request.cookies || {};
    const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];

    if (!sessionToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // 4. Validate against Database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return reply.status(401).send({ error: 'Session expired' });
    }

    // 5. Attach user to request
    request.user = { id: session.user.id, email: session.user.email };
  });
});