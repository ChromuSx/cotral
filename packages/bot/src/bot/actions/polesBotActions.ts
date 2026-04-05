import { Markup, Telegraf } from "telegraf";
import { ExtendedContext } from "../../interfaces/ExtendedContext";
import { PolesCommands } from "../../commands/polesCommands";
import { SharedCommands } from "../../commands/sharedCommands";
import { handleCommand } from "../handlers/commandHandler";
import {
    handleGetPolesByCode,
    handleGetPolesByPosition,
    handleGetPoleByArrivalAndDestination,
    handleGetAllPolesDestinations
} from "./commandActions";

export const polesMenu = Markup.keyboard([
    [PolesCommands.GetFavoritePolesFromMenu, PolesCommands.GetPolesByCodeFromMenu, PolesCommands.GetPolesByPositionFromMenu],
    [PolesCommands.GetPoleByArrivalAndDestinationFromMenu, PolesCommands.GetAllPolesDestinationsByArrivalFromMenu],
    [SharedCommands.BackToMainMenu]
]).resize();

export function registerPolesBotActions(bot: Telegraf<ExtendedContext>) {
    bot.action(`poles:${PolesCommands.GetFavoritePoles}`, async (ctx: ExtendedContext) => {
        ctx.session.command = PolesCommands.GetFavoritePoles;
        await handleCommand(ctx, `/${PolesCommands.GetFavoritePoles}`);
    });

    bot.action(`poles:${PolesCommands.GetPolesByCode}`, async (ctx: ExtendedContext) => {
        await handleGetPolesByCode(ctx);
    });

    bot.action(`poles:${PolesCommands.GetPolesByPosition}`, async (ctx: ExtendedContext) => {
        ctx.session.command = PolesCommands.GetPolesByPosition;
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('Usa la mia posizione attuale', 'use_current_position')],
            [Markup.button.callback('Inserisco manualmente', 'enter_position_manually')],
            [Markup.button.callback('Indietro', 'POLES_MENU')]
        ]);
        await ctx.editMessageText('Vuoi usare la tua posizione attuale o inserire una posizione manualmente?', keyboard);
    });

    bot.action('use_current_position', async (ctx: ExtendedContext) => {
        await ctx.reply('Condividi la tua posizione:', Markup.keyboard([
            Markup.button.locationRequest('Condividi Posizione')
        ]).resize());
    });

    bot.action('enter_position_manually', async (ctx: ExtendedContext) => {
        await ctx.reply('Per favore, invia la posizione utilizzando l\'icona graffetta e poi "Posizione".');
    });

    bot.action(`poles:${PolesCommands.GetPoleByArrivalAndDestination}`, async (ctx: ExtendedContext) => {
        ctx.session.params = {};
        await handleGetPoleByArrivalAndDestination(ctx);
    });

    bot.action(`poles:${PolesCommands.GetAllPolesDestinationsByArrival}`, async (ctx: ExtendedContext) => {
        await handleGetAllPolesDestinations(ctx);
    });
}
