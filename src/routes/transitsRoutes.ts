import { FastifyInstance } from 'fastify';
import { TransitsController } from '../controllers/transitsController';

export const registerTransitsRoutes = (fastify: FastifyInstance): void => {
    new TransitsController(fastify);
};
