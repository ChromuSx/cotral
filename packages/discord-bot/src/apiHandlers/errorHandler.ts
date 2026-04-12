import { DiscordAPIError, type CommandInteraction, type MessageComponentInteraction } from 'discord.js';
import { AxiosError } from 'axios';
import { errorEmbed } from '../utils/formatting';
import { logger } from '../utils/logger';

type Interaction = CommandInteraction | MessageComponentInteraction;

const EXPIRED_CODES = new Set([10062, 40060]); // Unknown interaction, Interaction already acknowledged

export function isExpiredInteraction(error: unknown): boolean {
    return error instanceof DiscordAPIError && EXPIRED_CODES.has(error.code as number);
}

export async function safeEditReply(interaction: Interaction, payload: Parameters<Interaction['editReply']>[0]) {
    try {
        await interaction.editReply(payload);
    } catch (error) {
        if (isExpiredInteraction(error)) {
            logger.debug('Interaction expired, skipping reply');
        } else {
            throw error;
        }
    }
}

export async function handleApiError(interaction: Interaction, error: unknown) {
    let message = 'Errore imprevisto. Riprova più tardi.';

    if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (!error.response) {
            message = 'Server non raggiungibile. Riprova più tardi.';
        } else if (status && status >= 500) {
            message = 'Servizio temporaneamente non disponibile.';
        } else if (status === 404) {
            message = 'Nessun risultato trovato.';
        } else if (status === 400) {
            message = 'Dati non validi. Controlla i parametri inseriti.';
        } else if (error.code === 'ECONNABORTED') {
            message = 'Tempo scaduto. Il server non ha risposto in tempo.';
        }
    }

    logger.error('API error', error, { user: interaction.user.id });
    await safeEditReply(interaction, { embeds: [errorEmbed(message)] });
}
