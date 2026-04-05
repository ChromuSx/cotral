import { FastifyInstance } from 'fastify';
import { PolesController } from '../controllers/polesController';

export const registerPolesRoutes = (fastify: FastifyInstance): void => {
    new PolesController(fastify);
};
