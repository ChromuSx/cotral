import fastify, { FastifyInstance } from 'fastify';
import { registerStopsRoutes } from './routes/stopsRoutes';
import { registerPolesRoutes } from './routes/polesRoutes';
import { registerTransitsRoutes } from './routes/transitsRoutes';
import { registerVehiclesRoutes } from './routes/vehiclesRoutes';
import { config } from './config';
import { initDatabase } from './database';
import { loadGtfs } from './services/gtfsService';
import { ensureGtfsData } from './utils/gtfsDownloader';

const createApp = async (): Promise<FastifyInstance> => {
    const app = await fastify({ logger: true });

    initDatabase();
    await ensureGtfsData();
    loadGtfs();

    registerStopsRoutes(app);
    registerPolesRoutes(app);
    registerTransitsRoutes(app);
    registerVehiclesRoutes(app);

    return app;
};

const start = async (): Promise<void> => {
    const app = await createApp();

    try {
        await app.listen({ host: config.host, port: config.port });
        app.log.info(`Server listening on ${config.host}:${config.port}`);
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
};

start();
