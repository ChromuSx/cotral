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
    [PolesCommands.GetFavoritePolesFromMenu, PolesCommands.GetPolesByCodeFromMenu],
    [PolesCommands.GetPolesByPositionFromMenu],
    [PolesCommands.GetPoleByArrivalAndDestinationFromMenu],
    [PolesCommands.GetAllPolesDestinationsByArrivalFromMenu],
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
        await handleGetPolesByPosition(ctx);
    });

    bot.action(`poles:${PolesCommands.GetPoleByArrivalAndDestination}`, async (ctx: ExtendedContext) => {
        ctx.session.params = {};
        await handleGetPoleByArrivalAndDestination(ctx);
    });

    bot.action(`poles:${PolesCommands.GetAllPolesDestinationsByArrival}`, async (ctx: ExtendedContext) => {
        await handleGetAllPolesDestinations(ctx);
    });
}
