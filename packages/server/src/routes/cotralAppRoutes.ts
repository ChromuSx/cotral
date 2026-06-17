import { FastifyInstance } from 'fastify';
import { CotralAppController } from '../controllers/cotralAppController';

export const registerCotralAppRoutes = (fastify: FastifyInstance): void => {
    new CotralAppController(fastify);
};
