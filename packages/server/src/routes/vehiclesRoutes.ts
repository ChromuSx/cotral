import { FastifyInstance } from 'fastify';
import { VehiclesController } from '../controllers/vehiclesController';

export const registerVehiclesRoutes = (fastify: FastifyInstance): void => {
    new VehiclesController(fastify);
};
