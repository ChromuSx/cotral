import { Context } from 'telegraf';
import { ExtendedContext } from '../interfaces/ExtendedContext';
import { fetchData, handleApiResponse } from '../utils/apiUtils';
import { Stop } from '@cotral/shared';
import { Emoji, bold, escapeHtml, divider, mapsLink, resultCountHeader } from '../utils/messageFormatting';
import { logger } from '../utils/logger';

export async function getStopsByLocality(ctx: Context, locality: string): Promise<void> {
    const apiUrl = `/stops/${encodeURIComponent(locality)}`;
    await handleStopsAsSelection(ctx, apiUrl, `${Emoji.BUSSTOP} <b>Fermate a ${escapeHtml(locality)}:</b>`);
}

export async function getFirstStopByLocality(ctx: ExtendedContext, locality: string): Promise<void> {
    const apiUrl = `/stops/firststop/${encodeURIComponent(locality)}`;
    await handleApiResponse(ctx, apiUrl, formatStopMessage);
}

async function handleStopsAsSelection(ctx: Context, apiUrl: string, title: string): Promise<void> {
    try {
        await ctx.sendChatAction('typing');
        const stops = await fetchData<Stop[]>(apiUrl);
        if (!stops || !Array.isArray(stops) || stops.length === 0) {
            await ctx.reply(
                `${Emoji.SEARCH} <b>Nessuna fermata trovata</b>\n\nProva con un nome diverso.`,
                { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
            );
            return;
        }

        if (stops.length === 1) {
            const stop = stops[0];
            const keyboard: { text: string; callback_data: string }[][] = [];
            if (stop.coordX && stop.coordY && !(stop.coordX === 0 && stop.coordY === 0)) {
                keyboard.push([{ text: `${Emoji.PIN} Mappa`, callback_data: `location:${stop.coordX.toFixed(5)}:${stop.coordY.toFixed(5)}` }]);
            }
            keyboard.push([{ text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' }]);
            await ctx.reply(formatStopMessage(stop), {
                reply_markup: { inline_keyboard: keyboard },
                link_preview_options: { is_disabled: true },
            });
            return;
        }

        const MAX_BUTTONS = 20;
        const shown = stops.slice(0, MAX_BUTTONS);
        const buttons: { text: string; callback_data: string }[][] = shown.map(stop => {
            const name = stop.nomeStop ?? 'Fermata';
            const hasCoords = stop.coordX && stop.coordY && !(stop.coordX === 0 && stop.coordY === 0);
            const cb = hasCoords
                ? `sel:stop:${stop.codiceStop}:${stop.coordX.toFixed(4)}:${stop.coordY.toFixed(4)}:${encodeURIComponent(name).slice(0, 20)}`
                : `sel:stop:${stop.codiceStop}:0:0:${encodeURIComponent(name).slice(0, 20)}`;
            return [{ text: `${Emoji.BUSSTOP} ${name} (${stop.codiceStop ?? '?'})`, callback_data: cb }];
        });

        buttons.push([{ text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' }]);

        const header = stops.length > MAX_BUTTONS
            ? `${title}\n${resultCountHeader(stops.length, 'fermate')} (prime ${MAX_BUTTONS})\n\n<i>Seleziona una fermata:</i>`
            : `${title}\n${resultCountHeader(stops.length, 'fermate')}\n\n<i>Seleziona una fermata:</i>`;

        await ctx.reply(header, { reply_markup: { inline_keyboard: buttons } });
    } catch (error) {
        logger.error('Errore recupero fermate', error);
        await ctx.reply(`${Emoji.WARNING} Si \u00e8 verificato un errore. Riprova.`);
    }
}

function formatStopMessage(stop: Stop): string {
    const name = stop.nomeStop ?? 'Fermata';
    const lines: string[] = [
        `${Emoji.BUSSTOP} ${bold(name)}`,
        divider(),
    ];

    if (stop.codiceStop) {
        lines.push(`${Emoji.POINT} <b>Codice:</b> ${escapeHtml(stop.codiceStop)}`);
    }

    if (stop.localita) {
        lines.push(`${Emoji.PIN} ${escapeHtml(stop.localita)}`);
    }

    if (stop.coordX && stop.coordY && !(stop.coordX === 0 && stop.coordY === 0)) {
        lines.push(`${Emoji.MAP} ${mapsLink(stop.coordX, stop.coordY)}`);
    }

    return lines.join('\n');
}
