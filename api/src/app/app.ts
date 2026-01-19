import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import sensible from './plugins/sensible';
import authMiddleware from './plugins/auth-middleware';
import root from './routes/root';
import auth from './routes/auth';
import users from './routes/users';
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
  fastify.register(auth);
  fastify.register(users, { prefix: '/api/users' });
}