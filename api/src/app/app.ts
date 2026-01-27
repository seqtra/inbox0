import { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import sensible from './plugins/sensible';
import authMiddleware from './plugins/auth-middleware';
import { registerCronJobs, stopCronJobs } from '../jobs';
import root from './routes/root';
import users from './routes/users';
import emails from './routes/emails';
import blogs from './routes/blogs';
import trello from './routes/trello';
/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!
  fastify.register(cookie);
  // Register CORS to allow frontend (localhost:4200) to access API (localhost:3000)
  fastify.register(cors, {
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  });
  // MANUALLY REGISTER PLUGINS
  // (Instead of using AutoLoad, we import and register them explicitly)
  fastify.register(sensible);
  fastify.register(authMiddleware); // <--- Register middleware

  // Cron jobs (stub handlers; extend in jobs/index.ts)
  registerCronJobs(fastify);
  fastify.addHook('onClose', (instance, done) => {
    stopCronJobs();
    done();
  });

  // MANUALLY REGISTER ROUTES
  fastify.register(root);
  fastify.register(users, { prefix: '/api/users' });
  fastify.register(emails, { prefix: '/api/emails' });
  fastify.register(trello, { prefix: '/api/trello' });
  fastify.register(blogs, { prefix: '/api' }); // Blog routes under /api
}