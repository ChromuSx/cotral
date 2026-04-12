import bot from './bot/bot';
import { logger } from './utils/logger';

bot.launch().then(() => {
	logger.info('Il bot è avviato!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
