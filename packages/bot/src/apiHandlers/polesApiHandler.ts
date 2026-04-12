import { Context, Markup } from 'telegraf';
import { Pole } from '@cotral/shared';
import { ExtendedContext } from '../interfaces/ExtendedContext';
import { fetchData, handleApiResponse } from '../utils/apiUtils';
import { logger } from '../utils/logger';
import api from '../services/axiosService';
import { Emoji, bold, escapeHtml, divider, mapsLink, resultCountHeader } from '../utils/messageFormatting';
import { convertAndValidateCoords } from '../utils/functions';

export async function getPolesByCode(ctx: Context, code: string, params: { userId?: number | undefined }): Promise<void> {
    const { userId } = params;
    const encoded = encodeURIComponent(code);
    const apiUrl = userId ? `/poles/${encoded}?userId=${userId}` : `/poles/${encoded}`;
    await handleApiResponse(ctx, apiUrl, formatPoleMessage);
}

export async function getPolesByPosition(ctx: ExtendedContext, params: { latitude: number, longitude: number, range?: number }): Promise<void> {
    const { latitude, longitude, range } = params;
    const apiUrl = `/poles/position?latitude=${latitude}&longitude=${longitude}${range ? `&range=${range}` : ''}`;
    await handlePolesAsSelection(ctx, apiUrl, `${Emoji.PIN} <b>Paline vicino a te:</b>`);
}

export async function getPoleByArrivalAndDestinationLocality(ctx: Context, params: { arrival: string, destination: string }): Promise<void> {
    const apiUrl = `/poles/${encodeURIComponent(params.arrival)}/${encodeURIComponent(params.destination)}`;
    await handlePolesAsSelection(ctx, apiUrl, `${Emoji.COMPASS} <b>Paline ${escapeHtml(params.arrival)} \u2192 ${escapeHtml(params.destination)}:</b>`);
}

export async function getAllPolesDestinationsByArrivalLocality(ctx: Context, arrivalLocality: string): Promise<void> {
    const apiUrl = `/poles/destinations/${encodeURIComponent(arrivalLocality)}`;
    try {
        await ctx.sendChatAction('typing');
        const destinations = await fetchData<string[]>(apiUrl);
        if (!destinations || destinations.length === 0) {
            await ctx.reply(
                `${Emoji.SEARCH} <b>Nessuna destinazione trovata</b> per ${bold(arrivalLocality)}.`,
                { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
            );
            return;
        }

        const MAX = 20;
        const shown = destinations.slice(0, MAX);
        const buttons: { text: string; callback_data: string }[][] = shown.map(dest => {
            const cb = `search:arrdest:${encodeURIComponent(arrivalLocality).slice(0, 20)}:${encodeURIComponent(dest).slice(0, 20)}`;
            return [{ text: `${Emoji.COMPASS} ${dest}`, callback_data: cb }];
        });
        buttons.push([{ text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' }]);

        const header = `${Emoji.COMPASS} <b>Destinazioni da ${bold(arrivalLocality)}</b> (${destinations.length})\n\n<i>Seleziona una destinazione per cercare le paline:</i>`;
        await ctx.reply(header, { reply_markup: { inline_keyboard: buttons } });
    } catch (error) {
        logger.error('Errore recupero destinazioni', error);
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero delle destinazioni.`);
    }
}

async function handlePolesAsSelection(ctx: Context, apiUrl: string, title: string): Promise<void> {
    try {
        await ctx.sendChatAction('typing');
        const poles = await fetchData<Pole[]>(apiUrl);
        if (!poles || poles.length === 0) {
            await ctx.reply(
                `${Emoji.SEARCH} <b>Nessuna palina trovata</b>\n\nProva con parametri diversi.`,
                { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
            );
            return;
        }

        if (poles.length === 1) {
            await ctx.reply(formatPoleMessage(poles[0]), {
                reply_markup: { inline_keyboard: buildPoleInlineKeyboard(poles[0]) },
                link_preview_options: { is_disabled: true },
            });
            return;
        }

        const MAX_BUTTONS = 15;
        const shown = poles.slice(0, MAX_BUTTONS);
        const buttons: { text: string; callback_data: string }[][] = shown.map(pole => {
            const name = pole.nomePalina ?? 'Palina';
            const dist = pole.distanza ? ` \u2022 ${pole.distanza}` : '';
            const label = `${Emoji.BUSSTOP} ${name} (${pole.codicePalina ?? '?'})${dist}`;
            return [{ text: label, callback_data: `sel:pole:${pole.codicePalina ?? ''}` }];
        });

        buttons.push([{ text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' }]);

        const header = poles.length > MAX_BUTTONS
            ? `${title}\n${resultCountHeader(poles.length, 'paline')} (prime ${MAX_BUTTONS})\n\n<i>Seleziona una palina per vedere i dettagli:</i>`
            : `${title}\n${resultCountHeader(poles.length, 'paline')}\n\n<i>Seleziona una palina per vedere i dettagli:</i>`;

        await ctx.reply(header, { reply_markup: { inline_keyboard: buttons } });
    } catch (error) {
        logger.error('Errore nel recupero paline', error);
        await ctx.reply(`${Emoji.WARNING} Si \u00e8 verificato un errore. Riprova.`);
    }
}

export function buildPoleInlineKeyboard(pole: Pole): { text: string; callback_data: string }[][] {
    const keyboard: { text: string; callback_data: string }[][] = [];
    if (pole.codicePalina) {
        const favButton = pole.preferita
            ? { text: `${Emoji.CROSS} Rimuovi preferito`, callback_data: `poles:remove_favorite:${pole.codicePalina}` }
            : (() => {
                const lat = Number(pole.coordX || 0).toFixed(4);
                const lon = Number(pole.coordY || 0).toFixed(4);
                return { text: `${Emoji.STAR} Preferito`, callback_data: `poles:fav:${pole.codicePalina}:${lat}:${lon}` };
            })();
        keyboard.push([
            { text: `${Emoji.BUS} Transiti`, callback_data: `transits:getTransits:${pole.codicePalina}` },
            favButton,
        ]);
    }
    if (pole.coordX && pole.coordY) {
        const coords = convertAndValidateCoords(String(pole.coordX), String(pole.coordY));
        if (coords) {
            keyboard.push([
                { text: `${Emoji.PIN} Mappa`, callback_data: `location:${coords.latitude.toFixed(5)}:${coords.longitude.toFixed(5)}` }
            ]);
        }
    }
    keyboard.push([
        { text: `${Emoji.BACK} Menu paline`, callback_data: 'nav:poles_menu' },
    ]);
    return keyboard;
}

export async function displaySinglePoleDetails(ctx: Context, poleCode: string, userId?: number): Promise<void> {
    try {
        await ctx.sendChatAction('typing');
        const encoded = encodeURIComponent(poleCode);
        const apiUrl = userId ? `/poles/${encoded}?userId=${userId}` : `/poles/${encoded}`;
        const poles = await fetchData<Pole[]>(apiUrl);
        if (!poles || poles.length === 0) {
            await ctx.reply(`${Emoji.SEARCH} Palina non trovata.`);
            return;
        }
        const pole = poles[0];
        await ctx.reply(formatPoleMessage(pole), {
            reply_markup: { inline_keyboard: buildPoleInlineKeyboard(pole) },
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        logger.error('Errore dettaglio palina', error, { poleCode });
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero dei dettagli.`);
    }
}

export async function getFavoritePolesButtons(ctx: ExtendedContext) {
    const userId = ctx.from?.id;
    if (!userId) return [];

    const favoritePoles = await fetchFavoritePoles(userId);
    return favoritePoles.flatMap(item =>
        item.codicePalina
            ? [Markup.button.callback(`${Emoji.BUSSTOP} ${item.nomePalina ?? 'Palina'} (${item.codicePalina})`, `sel:pole:${item.codicePalina}`)]
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
    try {
        await ctx.sendChatAction('typing');
        const poles = await fetchFavoritePoles(userId);
        if (!poles || poles.length === 0) {
            await ctx.reply(
                `${Emoji.STAR} <i>Non hai ancora paline preferite.\nCerca una palina e premi </i>${Emoji.STAR} Preferito<i> per aggiungerla!</i>`,
                { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
            );
            return;
        }

        const buttons: { text: string; callback_data: string }[][] = [];
        for (const pole of poles) {
            if (!pole.codicePalina) continue;
            const name = pole.nomePalina ?? 'Palina';
            buttons.push([
                { text: `${Emoji.BUSSTOP} ${name} (${pole.codicePalina})`, callback_data: `sel:pole:${pole.codicePalina}` },
            ]);
        }
        buttons.push([{ text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' }]);

        await ctx.reply(
            `${Emoji.STAR} <b>Le tue paline preferite</b> (${poles.length})\n\n<i>Seleziona una palina per i dettagli:</i>`,
            { reply_markup: { inline_keyboard: buttons } }
        );
    } catch (error) {
        logger.error('Errore visualizzazione preferiti', error, { userId });
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero dei preferiti.`);
    }
}

export async function addFavoritePole(ctx: Context, poleCode: string, poleLat: number, poleLon: number, userId: number): Promise<void> {
    try {
        await api.post('/poles/favorites', { userId, poleCode, poleLat, poleLon });

        try {
            const update = ctx.update as any;
            if (update.callbackQuery?.message?.reply_markup?.inline_keyboard) {
                const keyboard = update.callbackQuery.message.reply_markup.inline_keyboard;
                const updatedKeyboard = keyboard.map((row: any[]) =>
                    row.map((btn: any) => {
                        if (btn.callback_data?.startsWith(`poles:fav:${poleCode}`)) {
                            return { text: `${Emoji.CROSS} Rimuovi preferito`, callback_data: `poles:remove_favorite:${poleCode}` };
                        }
                        return btn;
                    })
                );
                await (ctx as any).editMessageReplyMarkup({ inline_keyboard: updatedKeyboard });
            }
        } catch { /* ignore edit errors */ }
    } catch (error) {
        logger.error('Errore aggiunta preferito', error, { poleCode, userId });
    }
}

export async function removeFavoritePole(ctx: Context, poleCode: string, userId: number): Promise<void> {
    try {
        await api.delete('/poles/favorites', { data: { userId, poleCode } });

        try {
            const update = ctx.update as any;
            if (update.callbackQuery?.message?.reply_markup?.inline_keyboard) {
                const keyboard = update.callbackQuery.message.reply_markup.inline_keyboard;
                const updatedKeyboard = keyboard.map((row: any[]) =>
                    row.map((btn: any) => {
                        if (btn.callback_data === `poles:remove_favorite:${poleCode}`) {
                            return { text: `${Emoji.STAR} Preferito`, callback_data: `poles:fav:${poleCode}:0:0` };
                        }
                        return btn;
                    })
                );
                await (ctx as any).editMessageReplyMarkup({ inline_keyboard: updatedKeyboard });
            }
        } catch { /* ignore edit errors */ }
    } catch (error) {
        logger.error('Errore rimozione preferito', error, { poleCode, userId });
    }
}

function formatPoleMessage(pole: Pole): string {
    const name = pole.nomePalina ?? 'Palina';
    const lines: string[] = [
        `${Emoji.BUSSTOP} ${bold(name)}`,
        divider(),
    ];

    if (pole.codicePalina) {
        lines.push(`${Emoji.POINT} <b>Codice:</b> ${escapeHtml(pole.codicePalina)}`);
    }

    if (pole.nomeStop || pole.codiceStop) {
        const stopName = pole.nomeStop ? escapeHtml(pole.nomeStop) : '';
        const stopCode = pole.codiceStop ? ` (${escapeHtml(String(pole.codiceStop))})` : '';
        lines.push(`${Emoji.POINT} <b>Fermata:</b> ${stopName}${stopCode}`);
    }

    const luogo = [pole.localita, pole.comune].filter(Boolean).join(', ');
    if (luogo) {
        lines.push(`${Emoji.PIN} ${escapeHtml(luogo)}`);
    }

    if (pole.destinazioni && pole.destinazioni.length > 0) {
        lines.push(`${Emoji.COMPASS} <b>Destinazioni:</b> ${pole.destinazioni.map(d => escapeHtml(d)).join(' \u2022 ')}`);
    }

    if (pole.distanza) {
        lines.push(`${Emoji.PIN} <b>Distanza:</b> ${escapeHtml(pole.distanza)}`);
    }

    if (pole.coordX && pole.coordY && !(pole.coordX === 0 && pole.coordY === 0)) {
        lines.push(`${Emoji.MAP} ${mapsLink(pole.coordX, pole.coordY)}`);
    }

    return lines.join('\n');
}

function formatStringArray(data: string[]): string {
    if (data.length === 0) return 'Nessuna destinazione trovata.';
    return `${Emoji.COMPASS} <b>Destinazioni disponibili:</b>\n\n${data.map(d => `${Emoji.POINT} ${escapeHtml(d)}`).join('\n')}`;
}
