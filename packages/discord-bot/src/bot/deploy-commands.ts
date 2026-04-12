import { REST, Routes } from 'discord.js';
import { config } from '../config';
import { commands } from '../commands';
import { logger } from '../utils/logger';

async function deploy() {
    const rest = new REST().setToken(config.discordToken);
    const commandsData = commands.map(c => c.data.toJSON());

    logger.info(`Registrazione di ${commandsData.length} comandi...`);

    await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commandsData },
    );

    logger.info('Comandi registrati con successo!');
}

deploy().catch(err => {
    logger.error('Errore nella registrazione dei comandi', err);
    process.exit(1);
});
