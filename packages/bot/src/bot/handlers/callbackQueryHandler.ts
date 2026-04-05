import { NarrowedContext } from 'telegraf';
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import * as transitsApiHandler from '../../apiHandlers/transitsApiHandler';
import * as vehiclesApiHandler from '../../apiHandlers/vehiclesApiHandler';
import { handleGetFavoritePoles, PolesCommands } from '../../commands/polesCommands';
import { ExtendedContext } from '../../interfaces/ExtendedContext';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';

export async function handleCallbackQuery(ctx:  NarrowedContext<ExtendedContext, Update.CallbackQueryUpdate<CallbackQuery>>) {
    await ctx.answerCbQuery();

    if ('data' in ctx.callbackQuery) {
        const callbackData = ctx.callbackQuery.data;
        const parts = callbackData.split(':');
        const [contextAction, action] = parts;

        const userId = ctx.from?.id;

        if (contextAction === 'transits' && parts[2]) {
            if (action === 'getTransits') {
                await transitsApiHandler.getTransitsByPoleCode(ctx, parts[2]);
            }
        } else if (contextAction === 'poles') {
            if (action === 'fav') {
                // callback data: poles:fav:poleCode:lat:lon
                if (userId && parts[2]) {
                    const poleLat = parseFloat(parts[3]) || 0;
                    const poleLon = parseFloat(parts[4]) || 0;
                    await polesApiHandler.addFavoritePole(ctx, parts[2], poleLat, poleLon, userId);
                }
            } else if (action === 'remove_favorite') {
                if (userId && parts[2]) {
                    await polesApiHandler.removeFavoritePole(ctx, parts[2], userId);
                }
            } else if (action === PolesCommands.GetFavoritePoles) {
                await handleGetFavoritePoles(ctx, userId);
            }
        } else if (contextAction === 'vehicles' && parts[2]) {
            if (action === 'getVehicleRealTimePositions') {
                await vehiclesApiHandler.getVehicleRealTimePositions(ctx, parts[2]);
            }
        }
    }
}
