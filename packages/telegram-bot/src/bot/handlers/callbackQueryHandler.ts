import { NarrowedContext, Markup } from 'telegraf';
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import * as transitsApiHandler from '../../apiHandlers/transitsApiHandler';
import * as vehiclesApiHandler from '../../apiHandlers/vehiclesApiHandler';
import { handleGetFavoritePoles, PolesCommands } from '../../commands/polesCommands';
import { ExtendedContext } from '../../interfaces/ExtendedContext';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';
import { transitsMenu } from '../actions/transitsBotActions';
import { logger } from '../../utils/logger';

const INVALID_CALLBACK_ALERT = '⚠️ Azione non più valida. Riprova dal menu.';
const CALLBACK_ERROR_ALERT = '⚠️ Operazione non riuscita. Riprova.';

async function answerInvalidCallback(ctx: NarrowedContext<ExtendedContext, Update.CallbackQueryUpdate<CallbackQuery>>): Promise<void> {
    await ctx.answerCbQuery(INVALID_CALLBACK_ALERT, { show_alert: true });
}

function transitKeyFromParts(parts: string[], startIndex: number): string | undefined {
    const key = parts.slice(startIndex).join(':');
    return transitsApiHandler.isValidTransitCallbackKey(key) ? key : undefined;
}

export async function handleCallbackQuery(ctx: NarrowedContext<ExtendedContext, Update.CallbackQueryUpdate<CallbackQuery>>) {
    if (!('data' in ctx.callbackQuery)) return;

    const callbackData = ctx.callbackQuery.data;
    const parts = callbackData.split(':');
    const [contextAction, action] = parts;
    const userId = ctx.from?.id;

    try {
        // Handle favorite actions with toast feedback
        if (contextAction === 'poles' && (action === 'fav' || action === 'remove_favorite')) {
            if (action === 'fav' && userId && parts[2]) {
                const poleLat = parseFloat(parts[3]) || 0;
                const poleLon = parseFloat(parts[4]) || 0;
                await polesApiHandler.addFavoritePole(ctx, parts[2], poleLat, poleLon, userId);
                await ctx.answerCbQuery(`\u2B50 Aggiunta ai preferiti!`, { show_alert: false });
            } else if (action === 'remove_favorite' && userId && parts[2]) {
                await polesApiHandler.removeFavoritePole(ctx, parts[2], userId);
                await ctx.answerCbQuery(`\u274C Rimossa dai preferiti`, { show_alert: false });
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        if (contextAction === 'td') {
            const poleCode = parts[1];
            const transitKey = transitKeyFromParts(parts, 2);
            if (!poleCode || !transitKey) {
                await answerInvalidCallback(ctx);
                return;
            }
            await ctx.answerCbQuery();
            await transitsApiHandler.showTransitDetailByKey(ctx, poleCode, transitKey);
            return;
        }

        if (contextAction === 'transits') {
            if (!parts[2]) {
                await answerInvalidCallback(ctx);
                return;
            }
            await ctx.answerCbQuery();
            if (action === 'getTransits') {
                await transitsApiHandler.getTransitsByPoleCode(ctx, parts[2]);
            } else if (action === 'refresh') {
                await transitsApiHandler.refreshTransitsByPoleCode(ctx, parts[2]);
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        if (contextAction === 'poles') {
            await ctx.answerCbQuery();
            if (action === PolesCommands.GetFavoritePoles) {
                await handleGetFavoritePoles(ctx, userId);
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        if (contextAction === 'vehicles') {
            await ctx.answerCbQuery();
            if (action === 'getVehicleRealTimePositions' && parts[2]) {
                await vehiclesApiHandler.getVehicleRealTimePositions(ctx, parts[2]);
            } else if (action === 'fromTransit' && parts[2]) {
                const transitKey = transitKeyFromParts(parts, 3);
                if (!transitKey) {
                    await answerInvalidCallback(ctx);
                    return;
                }
                await transitsApiHandler.showVehiclePositionForTransitByKey(ctx, parts[2], transitKey);
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        if (contextAction === 'sel') {
            await ctx.answerCbQuery();
            if (action === 'pole' && parts[2]) {
                await polesApiHandler.displaySinglePoleDetails(ctx, parts[2], userId);
            } else if (action === 'stop' && parts[2]) {
                const lat = parts[3] ? parseFloat(parts[3]) : null;
                const lon = parts[4] ? parseFloat(parts[4]) : null;
                const stopName = parts[5] ? decodeURIComponent(parts[5]) : 'Fermata';
                const lines = [`\u{1F68F} <b>${stopName}</b>`, `\u25AA\uFE0F <b>Codice:</b> ${parts[2]}`];

                const keyboard: { text: string; callback_data: string }[][] = [];
                keyboard.push([{ text: `\u{1F68C} Cerca transiti`, callback_data: `transits:getTransits:${parts[2]}` }]);
                if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                    keyboard.push([{ text: `\u{1F4CD} Mappa`, callback_data: `location:${lat.toFixed(5)}:${lon.toFixed(5)}` }]);
                }
                keyboard.push([{ text: `\u{1F519} Menu principale`, callback_data: 'MAIN_MENU' }]);

                await ctx.reply(lines.join('\n'), { reply_markup: { inline_keyboard: keyboard } });
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        if (contextAction === 'location') {
            const lat = parts[1] ? parseFloat(parts[1]) : NaN;
            const lon = parts[2] ? parseFloat(parts[2]) : NaN;
            if (isNaN(lat) || isNaN(lon)) {
                await answerInvalidCallback(ctx);
                return;
            }
            await ctx.answerCbQuery();
            await ctx.sendLocation(lat, lon);
            return;
        }

        if (contextAction === 'search') {
            if (action === 'arrdest' && parts[2] && parts[3]) {
                await ctx.answerCbQuery();
                const arrival = decodeURIComponent(parts[2]);
                const destination = decodeURIComponent(parts[3]);
                await polesApiHandler.getPoleByArrivalAndDestinationLocality(ctx, { arrival, destination });
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        if (contextAction === 'nav') {
            await ctx.answerCbQuery();
            if (action === 'transits_menu') {
                ctx.session.command = undefined;
                await ctx.reply('\u{1F68C} <b>Transiti</b>\n\nCosa vuoi fare?', transitsMenu);
            } else if (action === 'poles_menu') {
                ctx.session.command = undefined;
                const { polesMenu } = await import('../actions/polesBotActions');
                await ctx.reply('\u{1F68F} <b>Paline</b>\n\nCosa vuoi fare?', polesMenu);
            } else if (action === 'stops_menu') {
                ctx.session.command = undefined;
                const { stopsMenu } = await import('../actions/stopsbotActions');
                await ctx.reply('\u{1F68F} <b>Fermate</b>\n\nCosa vuoi fare?', stopsMenu);
            } else {
                await answerInvalidCallback(ctx);
            }
            return;
        }

        await answerInvalidCallback(ctx);
    } catch (error) {
        logger.error('Errore gestione callback Telegram', error, { callbackData });
        try {
            await ctx.answerCbQuery(CALLBACK_ERROR_ALERT, { show_alert: true });
        } catch { /* ignore */ }
    }
}
