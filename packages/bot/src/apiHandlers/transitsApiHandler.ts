import { Context } from 'telegraf';
import { Transit, Pole } from '@cotral/shared';
import { fetchData } from '../utils/apiUtils';
import { logger } from '../utils/logger';
import { formatBoolean } from '../utils/functions';

interface TransitsResponse {
    pole: Pole;
    transits: Transit[];
}

export async function getTransitsByPoleCode(ctx: Context, poleCode: string): Promise<void> {
    const apiUrl = `/transits/${encodeURIComponent(poleCode)}`;

    try {
        const response = await fetchData<TransitsResponse>(apiUrl);
        if (!response?.transits?.length) {
            await ctx.reply('Nessun transito disponibile.');
            return;
        }

        for (const transit of response.transits) {
            const inlineKeyboard: { text: string; callback_data: string }[][] = [];
            if (transit.automezzo?.codice) {
                inlineKeyboard.push([{ text: "Veicolo", callback_data: `vehicles:getVehicleRealTimePositions:${transit.automezzo.codice}` }]);
            }
            await ctx.reply(formatTransitMessage(transit), {
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                }
            });
        }
    } catch (error) {
        logger.error('Errore recupero transiti', error, { poleCode });
        await ctx.reply('Si è verificato un errore durante il recupero dei transiti.');
    }
}

function formatTransitMessage(transit: Transit): string {
    const displayValue = (val: string | null | undefined): string => val || 'Non disponibile';

    return [
        `Partenza: ${displayValue(transit.partenzaCorsa)}`,
        `Orario partenza: ${displayValue(transit.orarioPartenzaCorsa)}`,
        `Arrivo: ${displayValue(transit.arrivoCorsa)}`,
        `Orario arrivo: ${displayValue(transit.orarioArrivoCorsa)}`,
        `Tempo Transito: ${displayValue(transit.tempoTransito)}`,
        `Ritardo: ${transit.ritardo && transit.ritardo !== '00:00' ? transit.ritardo : 'No'}`,
        `Automezzo: Codice - ${transit.automezzo?.codice ?? 'Non disponibile'}, Attivo - ${formatBoolean(transit.automezzo?.isAlive)}`,
        `Instradamento: ${displayValue(transit.instradamento)}`,
    ].join('\n');
}
