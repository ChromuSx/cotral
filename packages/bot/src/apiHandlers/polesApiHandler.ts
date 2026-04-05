import { Context, Markup } from 'telegraf';
import { Pole } from '@cotral/shared';
import { ExtendedContext } from '../interfaces/ExtendedContext';
import { fetchData, handleApiResponse } from '../utils/apiUtils';
import { logger } from '../utils/logger';
import api from '../services/axiosService';

export async function getPolesByCode(ctx: Context, code: string, params: { userId?: number | undefined }): Promise<void> {
    const { userId } = params;
    const encoded = encodeURIComponent(code);
    const apiUrl = userId ? `/poles/${encoded}?userId=${userId}` : `/poles/${encoded}`;
    await handleApiResponse(ctx, apiUrl, formatPoleMessage);
}

export async function getPolesByPosition(ctx: ExtendedContext, params: { latitude: number, longitude: number, range?: number }): Promise<void> {
    const { latitude, longitude, range } = params;
    const apiUrl = `/poles/position?latitude=${latitude}&longitude=${longitude}${range ? `&range=${range}` : ''}`;
    await handleApiResponse(ctx, apiUrl, formatPoleMessage);
}

export async function getPoleByArrivalAndDestinationLocality(ctx: Context, params: { arrival: string, destination: string }): Promise<void> {
    const apiUrl = `/poles/${encodeURIComponent(params.arrival)}/${encodeURIComponent(params.destination)}`;
    await handleApiResponse(ctx, apiUrl, formatPoleMessage);
}

export async function getAllPolesDestinationsByArrivalLocality(ctx: Context, arrivalLocality: string): Promise<void> {
    const apiUrl = `/poles/destinations/${encodeURIComponent(arrivalLocality)}`;
    await handleApiResponse(ctx, apiUrl, formatStringArray, true);
}

export async function getFavoritePolesButtons(ctx: ExtendedContext) {
    const userId = ctx.from?.id;
    if (!userId) return [];

    const favoritePoles = await fetchFavoritePoles(userId);
    return favoritePoles.flatMap(item =>
        item.codicePalina
            ? [Markup.button.callback(`${item.codicePalina} ${item.nomePalina}`, `transits:getTransits:${item.codicePalina}`)]
            : []
    );
}

export async function fetchFavoritePoles(userId: number): Promise<Pole[]> {
    try {
        return await fetchData<Pole[]>(`/poles/favorites/${userId}`) ?? [];
    } catch (error) {
        logger.error('Errore recupero paline preferite', error, { userId });
        return [];
    }
}

export async function displayFavoritePoles(ctx: Context, userId: number): Promise<void> {
    await handleApiResponse(ctx, `/poles/favorites/${userId}`, formatPoleMessage);
}

export async function addFavoritePole(ctx: Context, poleCode: string, poleLat: number, poleLon: number, userId: number): Promise<void> {
    try {
        await api.post('/poles/favorites', { userId, poleCode, poleLat, poleLon });
        await ctx.reply('Palo aggiunto ai preferiti con successo!');
    } catch (error) {
        logger.error('Errore aggiunta preferito', error, { poleCode, userId });
        await ctx.reply('Si è verificato un errore durante l\'aggiunta del palo ai preferiti.');
    }
}

export async function removeFavoritePole(ctx: Context, poleCode: string, userId: number): Promise<void> {
    try {
        await api.delete('/poles/favorites', { data: { userId, poleCode } });
        await ctx.reply('Palo rimosso dai preferiti con successo!');
    } catch (error) {
        logger.error('Errore rimozione preferito', error, { poleCode, userId });
        await ctx.reply('Si è verificato un errore durante la rimozione del palo dai preferiti.');
    }
}

function formatPoleMessage(pole: Pole): string {
    return [
        `Codice Palina: ${pole.codicePalina ?? 'Non disponibile'}`,
        `Codice Stop: ${pole.codiceStop ?? 'Non disponibile'}`,
        `Nome Palina: ${pole.nomePalina ?? 'Non disponibile'}`,
        `Nome Stop: ${pole.nomeStop ?? 'Non disponibile'}`,
        `Località: ${pole.localita ?? 'Non disponibile'}`,
        `Comune: ${pole.comune ?? 'Non disponibile'}`,
        `Destinazioni: ${pole.destinazioni ? pole.destinazioni.join(', ') : 'Non disponibile'}`,
    ].join('\n');
}

function formatStringArray(data: string[]): string {
    return data.join(', ');
}
