import { config } from './config';
import { createBot } from './bot/bot';
import { logger } from './utils/logger';

const client = createBot();

client.login(config.discordToken).catch(err => {
    logger.error('Errore nel login del bot', err);
    process.exit(1);
});

process.on('SIGINT', () => {
    logger.info('Shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Shutting down...');
    client.destroy();
    process.exit(0);
});
