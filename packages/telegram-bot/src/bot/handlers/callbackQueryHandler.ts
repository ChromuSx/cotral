import { NarrowedContext, Markup } from 'telegraf';
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import * as transitsApiHandler from '../../apiHandlers/transitsApiHandler';
import * as vehiclesApiHandler from '../../apiHandlers/vehiclesApiHandler';
import { handleGetFavoritePoles, PolesCommands } from '../../commands/polesCommands';
import { ExtendedContext } from '../../interfaces/ExtendedContext';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';
import { transitsMenu } from '../actions/transitsBotActions';

export async function handleCallbackQuery(ctx:  NarrowedContext<ExtendedContext, Update.CallbackQueryUpdate<CallbackQuery>>) {
    if ('data' in ctx.callbackQuery) {
        const callbackData = ctx.callbackQuery.data;
        const parts = callbackData.split(':');
        const [contextAction, action] = parts;

        const userId = ctx.from?.id;

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
                await ctx.answerCbQuery();
            }
            return;
        }

        await ctx.answerCbQuery();

        if (contextAction === 'td' && parts[1] && parts[2] !== undefined) {
            const poleCode = parts[1];
            const index = parseInt(parts[2], 10);
            if (!isNaN(index)) {
                await transitsApiHandler.showTransitDetail(ctx, poleCode, index);
            }
        } else if (contextAction === 'transits' && parts[2]) {
            if (action === 'getTransits') {
                await transitsApiHandler.getTransitsByPoleCode(ctx, parts[2]);
            } else if (action === 'refresh') {
                await transitsApiHandler.refreshTransitsByPoleCode(ctx, parts[2]);
            }
        } else if (contextAction === 'poles') {
            if (action === PolesCommands.GetFavoritePoles) {
                await handleGetFavoritePoles(ctx, userId);
            }
        } else if (contextAction === 'vehicles' && parts[2]) {
            if (action === 'getVehicleRealTimePositions') {
                await vehiclesApiHandler.getVehicleRealTimePositions(ctx, parts[2]);
            }
        } else if (contextAction === 'sel') {
            if (action === 'pole' && parts[2]) {
                await polesApiHandler.displaySinglePoleDetails(ctx, parts[2], userId);
            } else if (action === 'stop' && parts[2]) {
                const lat = parts[3] ? parseFloat(parts[3]) : null;
                const lon = parts[4] ? parseFloat(parts[4]) : null;
                const stopName = parts[5] ? decodeURIComponent(parts[5]) : 'Fermata';
                const lines = [`\u{1F68F} <b>${stopName}</b>`, `\u25AA\uFE0F <b>Codice:</b> ${parts[2]}`];

                const keyboard: { text: string; callback_data: string }[][] = [];
                // Use the stop code to search transits (stop code = pole code in many cases)
                keyboard.push([{ text: `\u{1F68C} Cerca transiti`, callback_data: `transits:getTransits:${parts[2]}` }]);
                if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
                    keyboard.push([{ text: `\u{1F4CD} Mappa`, callback_data: `location:${lat.toFixed(5)}:${lon.toFixed(5)}` }]);
                }
                keyboard.push([{ text: `\u{1F519} Menu principale`, callback_data: 'MAIN_MENU' }]);

                await ctx.reply(lines.join('\n'), { reply_markup: { inline_keyboard: keyboard } });
            }
        } else if (contextAction === 'location' && parts[1] && parts[2]) {
            const lat = parseFloat(parts[1]);
            const lon = parseFloat(parts[2]);
            if (!isNaN(lat) && !isNaN(lon)) {
                await ctx.sendLocation(lat, lon);
            }
        } else if (contextAction === 'search') {
            if (action === 'arrdest' && parts[2] && parts[3]) {
                const arrival = decodeURIComponent(parts[2]);
                const destination = decodeURIComponent(parts[3]);
                await polesApiHandler.getPoleByArrivalAndDestinationLocality(ctx, { arrival, destination });
            }
        } else if (contextAction === 'nav') {
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
            }
        }
    }
}
