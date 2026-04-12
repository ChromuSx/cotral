import { Markup } from "telegraf";
import { ExtendedContext } from "../../interfaces/ExtendedContext";
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import * as stopsApiHandler from '../../apiHandlers/stopsApiHandler';
import * as transitsApiHandler from '../../apiHandlers/transitsApiHandler';
import * as vehiclesApiHandler from '../../apiHandlers/vehiclesApiHandler';
import { PolesCommands } from "../../commands/polesCommands";
import { StopsCommands } from "../../commands/stopsCommands";
import { VehiclesCommands } from "../../commands/vehiclesCommands";
import { TransitsCommands } from "../../commands/transitsCommands";
import { Emoji, escapeHtml } from "../../utils/messageFormatting";

const mainMenuKeyboard = Markup.keyboard([
    [PolesCommands.GetPolesMenu, StopsCommands.GetStopsMenu],
    [TransitsCommands.GetTransitsMenu, VehiclesCommands.GetVehiclesMenu]
]).resize();

async function restoreMainKeyboard(ctx: ExtendedContext): Promise<void> {
    await ctx.reply(`${Emoji.CHECK} Usa il menu per continuare.`, mainMenuKeyboard);
}

export const sessionActions: Record<string, (ctx: ExtendedContext, text: string, userId?: number) => Promise<void>> = {
    [PolesCommands.GetPolesByCode]: async (ctx, text, userId) => { await polesApiHandler.getPolesByCode(ctx, text, { userId }); await restoreMainKeyboard(ctx); },
    [PolesCommands.GetPoleByArrivalAndDestination]: async (ctx, text) => {
        if (ctx.session.step === 'arrival') {
            if (!ctx.session.params) ctx.session.params = {};
            ctx.session.params.arrival = text;
            ctx.session.step = 'destination';
            await ctx.reply(
                `${Emoji.COMPASS} <b>Ricerca per arrivo e destinazione</b> (2/2)\n\n` +
                `${Emoji.CHECK} Partenza: <b>${escapeHtml(text)}</b>\n\n` +
                `${Emoji.COMPASS} Inserisci la <b>localit\u00e0 di destinazione</b>:\n\n` +
                `<i>Esempio: Tivoli, Subiaco, Frosinone...</i>`
            );
        } else if (ctx.session.step === 'destination') {
            if (!ctx.session.params) ctx.session.params = {};
            ctx.session.params.destination = text;
            const arrival = ctx.session.params.arrival!;
            const destination = ctx.session.params.destination!;
            await ctx.reply(
                `${Emoji.SEARCH} <b>Ricerca in corso...</b>\n` +
                `${Emoji.PIN} ${escapeHtml(arrival)} \u2192 ${escapeHtml(destination)}`
            );
            await polesApiHandler.getPoleByArrivalAndDestinationLocality(ctx, {
                arrival,
                destination
            });
            ctx.session.command = undefined;
            ctx.session.step = undefined;
            ctx.session.params = {};
            await restoreMainKeyboard(ctx);
        }
    },
    [PolesCommands.GetAllPolesDestinationsByArrival]: async (ctx, text) => { await polesApiHandler.getAllPolesDestinationsByArrivalLocality(ctx, text); await restoreMainKeyboard(ctx); },
    [StopsCommands.GetStopsByLocality]: async (ctx, text) => { await stopsApiHandler.getStopsByLocality(ctx, text); await restoreMainKeyboard(ctx); },
    [StopsCommands.GetFirstStopByLocality]: async (ctx, text) => { await stopsApiHandler.getFirstStopByLocality(ctx, text); await restoreMainKeyboard(ctx); },
    [TransitsCommands.GetTransitsByPoleCode]: async (ctx, text) => { await transitsApiHandler.getTransitsByPoleCode(ctx, text); await restoreMainKeyboard(ctx); },
    [VehiclesCommands.GetVehicleRealTimePositions]: async (ctx, text) => { await vehiclesApiHandler.getVehicleRealTimePositions(ctx, text); await restoreMainKeyboard(ctx); },
};
