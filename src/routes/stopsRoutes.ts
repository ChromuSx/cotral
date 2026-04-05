import { FastifyInstance } from 'fastify';
import { StopsController } from '../controllers/stopsController';

export const registerStopsRoutes = (fastify: FastifyInstance): void => {
    new StopsController(fastify);
};
