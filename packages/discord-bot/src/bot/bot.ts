import { Client, GatewayIntentBits, Events, ActivityType, type Interaction } from 'discord.js';
import { config } from '../config';
import { commands } from '../commands';
import { handleButton, handleSelectMenu } from '../handlers/interactionHandler';
import { isExpiredInteraction } from '../apiHandlers/errorHandler';
import { logger } from '../utils/logger';

export function createBot(): Client {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });

    // Build command map for lookup
    const commandMap = new Map(commands.map(c => [c.data.name, c]));

    client.once(Events.ClientReady, (c) => {
        logger.info(`Bot online come ${c.user.tag}`);
        c.user.setPresence({
            activities: [{ name: 'Cotral | /help', type: ActivityType.Watching }],
            status: 'online',
        });
    });

    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        try {
            // Access control
            if (config.allowedUserIds && !config.allowedUserIds.has(interaction.user.id)) {
                if (interaction.isRepliable()) {
                    await interaction.reply({ content: '⚠️ Accesso non autorizzato.', ephemeral: true });
                }
                return;
            }

            // Autocomplete
            if (interaction.isAutocomplete()) {
                const cmd = commandMap.get(interaction.commandName);
                if (cmd && 'autocomplete' in cmd) {
                    await cmd.autocomplete(interaction);
                }
                return;
            }

            // Slash commands
            if (interaction.isChatInputCommand()) {
                const cmd = commandMap.get(interaction.commandName);
                if (cmd) {
                    await cmd.execute(interaction);
                } else {
                    await interaction.reply({ content: 'Comando non riconosciuto.', ephemeral: true });
                }
                return;
            }

            // Buttons
            if (interaction.isButton()) {
                // Ignore disabled/done buttons
                if (interaction.customId.startsWith('poles:fav_done:')) return;
                await handleButton(interaction);
                return;
            }

            // Select menus
            if (interaction.isStringSelectMenu()) {
                await handleSelectMenu(interaction);
                return;
            }
        } catch (error) {
            if (isExpiredInteraction(error)) {
                logger.debug('Interaction expired', { user: interaction.user.id });
                return;
            }
            logger.error('Unhandled interaction error', error, { user: interaction.user.id });
            if (interaction.isRepliable()) {
                const msg = { content: '❌ Si è verificato un errore.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(msg).catch(() => {});
                } else {
                    await interaction.reply(msg).catch(() => {});
                }
            }
        }
    });

    return client;
}
