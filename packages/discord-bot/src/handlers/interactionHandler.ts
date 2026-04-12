import type { ButtonInteraction, StringSelectMenuInteraction } from 'discord.js';
import { getTransitsByPoleCode, refreshTransitsByPoleCode, showTransitDetail } from '../apiHandlers/transitsApiHandler';
import { addFavoritePole, removeFavoritePole, displaySinglePoleDetails, getPolesByArrivalDestination } from '../apiHandlers/polesApiHandler';
import { getVehiclePositions } from '../apiHandlers/vehiclesApiHandler';
import { logger } from '../utils/logger';

export async function handleButton(interaction: ButtonInteraction) {
    const id = interaction.customId;
    const parts = id.split(':');
    const userId = interaction.user.id;

    logger.debug('Button interaction', { customId: id, userId });

    // Actions that update the current message (no new reply)
    const isUpdate = id.startsWith('transits:refresh:')
        || id.startsWith('poles:fav:')
        || id.startsWith('poles:remove_favorite:');

    if (isUpdate) {
        await interaction.deferUpdate();
    } else {
        await interaction.deferReply();
    }

    if (id.startsWith('transits:getTransits:')) {
        await getTransitsByPoleCode(interaction, parts[2]);
    } else if (id.startsWith('transits:refresh:')) {
        await refreshTransitsByPoleCode(interaction, parts[2]);
    } else if (id.startsWith('poles:fav:')) {
        // poles:fav:code:lat:lon
        await addFavoritePole(interaction, parts[2], parts[3], parts[4], userId);
    } else if (id.startsWith('poles:remove_favorite:')) {
        // poles:remove_favorite:code
        await removeFavoritePole(interaction, parts[2], userId);
    } else if (id.startsWith('vehicles:getVehicleRealTimePositions:')) {
        await getVehiclePositions(interaction, parts[2]);
    }
}

export async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
    const value = interaction.values[0];
    const parts = value.split(':');
    const userId = interaction.user.id;

    logger.debug('Select menu interaction', { value, userId });

    await interaction.deferReply();

    if (value.startsWith('sel:pole:')) {
        // sel:pole:code
        await displaySinglePoleDetails(interaction, parts[2], userId);
    } else if (value.startsWith('sel:stop:')) {
        // sel:stop:code:lat:lon:name — show transits for the nearest pole
        await displaySinglePoleDetails(interaction, parts[2], userId);
    } else if (value.startsWith('td:')) {
        // td:poleCode:index
        const { showTransitDetail } = await import('../apiHandlers/transitsApiHandler');
        await showTransitDetail(interaction, parts[1], parseInt(parts[2], 10));
    } else if (value.startsWith('search:arrdest:')) {
        // search:arrdest:encodedArrival:encodedDestination
        const arrival = decodeURIComponent(parts[2]);
        const destination = decodeURIComponent(parts[3]);
        await getPolesByArrivalDestination(interaction, arrival, destination);
    }
}
