import { Context } from 'telegraf';
import { ExtendedContext } from '../interfaces/ExtendedContext';
import { handleApiResponse } from '../utils/apiUtils';
import { Stop } from '@cotral/shared';

export async function getStopsByLocality(ctx: Context, locality: string): Promise<void> {
    const apiUrl = `/stops/${encodeURIComponent(locality)}`;
    await handleApiResponse(ctx, apiUrl, formatStopMessage);
}

export async function getFirstStopByLocality(ctx: ExtendedContext, locality: string): Promise<void> {
    const apiUrl = `/stops/firststop/${encodeURIComponent(locality)}`;
    await handleApiResponse(ctx, apiUrl, formatStopMessage);
}

function formatStopMessage(stop: Stop): string {
    return [
        `Codice Fermata: ${stop.codiceStop ?? 'Non disponibile'}`,
        `Nome Fermata: ${stop.nomeStop ?? 'Non disponibile'}`,
        `Località: ${stop.localita ?? 'Non disponibile'}`,
        `Coord X: ${stop.coordX ?? 'Non disponibile'}`,
        `Coord Y: ${stop.coordY ?? 'Non disponibile'}`,
    ].join('\n');
}
