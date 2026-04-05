import { PolesCommands } from "../../commands/polesCommands";
import { ExtendedContext } from "../../interfaces/ExtendedContext";
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import { NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

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
        } else {
            await ctx.reply('Posizione non valida');
        }
    }
}
