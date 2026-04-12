import { PolesCommands } from "../../commands/polesCommands";
import { StopsCommands } from "../../commands/stopsCommands";
import { TransitsCommands } from "../../commands/transitsCommands";
import { VehiclesCommands } from "../../commands/vehiclesCommands";
import { ExtendedContext } from "../../interfaces/ExtendedContext";
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import { Emoji } from "../../utils/messageFormatting";
import { Markup, NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

const mainMenuKeyboard = Markup.keyboard([
    [PolesCommands.GetPolesMenu, StopsCommands.GetStopsMenu],
    [TransitsCommands.GetTransitsMenu, VehiclesCommands.GetVehiclesMenu]
]).resize();

export async function handleLocation(ctx: NarrowedContext<ExtendedContext, {
    message: (Update.New & Update.NonChannel & Message.LocationMessage) | (Update.New & Update.NonChannel & Message.VenueMessage);
    update_id: number;
}>) {
    const myCtx = ctx as ExtendedContext;
    if (myCtx.session.command === PolesCommands.GetPolesByPosition) {
        const latitude = ctx.message?.location?.latitude;
        const longitude = ctx.message?.location?.longitude;
        if (latitude !== undefined && longitude !== undefined) {
            await polesApiHandler.getPolesByPosition(myCtx, { latitude, longitude });
            myCtx.session.command = undefined;
            await ctx.reply(`${Emoji.CHECK} Usa il menu per continuare.`, mainMenuKeyboard);
        } else {
            await ctx.reply('\u26A0\uFE0F Posizione non valida. Riprova condividendo la tua posizione.');
        }
    }
}
