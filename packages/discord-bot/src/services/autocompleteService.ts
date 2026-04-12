import type { AutocompleteInteraction } from 'discord.js';
import { api } from './axiosService';
import { logger } from '../utils/logger';

export async function searchLocalitiesAutocomplete(interaction: AutocompleteInteraction, query: string) {
    try {
        if (!query || query.length < 2) {
            await interaction.respond([]);
            return;
        }

        const { data: localities } = await api.get<string[]>('/localities/search', {
            params: { query, limit: 25 },
        });

        await interaction.respond(
            (localities || []).map(loc => ({ name: loc, value: loc })),
        );
    } catch (error) {
        logger.debug('Autocomplete error', { error });
        await interaction.respond([]).catch(() => {});
    }
}
