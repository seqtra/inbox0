import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import sensible from './plugins/sensible';
import authMiddleware from './plugins/auth-middleware';
import root from './routes/root';
import users from './routes/users';
import emails from './routes/emails';
/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!
  fastify.register(cookie);
  // MANUALLY REGISTER PLUGINS
  // (Instead of using AutoLoad, we import and register them explicitly)
  fastify.register(sensible);
  fastify.register(authMiddleware); // <--- Register middleware

  // MANUALLY REGISTER ROUTES
  fastify.register(root);
  fastify.register(users, { prefix: '/api/users' });
  fastify.register(emails, { prefix: '/api/emails' });
}