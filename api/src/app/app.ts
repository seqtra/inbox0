import { FastifyInstance } from 'fastify';
import sensible from './plugins/sensible';
import root from './routes/root';
import auth from './routes/auth';
/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  // Place here your custom code!

  // MANUALLY REGISTER PLUGINS
  // (Instead of using AutoLoad, we import and register them explicitly)
  fastify.register(sensible);

  // MANUALLY REGISTER ROUTES
  fastify.register(root);
  fastify.register(auth);
}