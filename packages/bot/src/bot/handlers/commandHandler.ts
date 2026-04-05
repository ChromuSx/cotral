import { ExtendedContext } from "../../interfaces/ExtendedContext";
import { commandActions } from "../actions/commandActions";
import { sessionActions } from "../actions/sessionActions";
import { handleErrors } from "./errorHandler";

export async function handleCommand(ctx: ExtendedContext, text: string) {
    try {
        const userId = ctx.from?.id;
        const commandAction = commandActions[text];
        const sessionAction = ctx.session.command ? sessionActions[ctx.session.command] : undefined;

        if (commandAction) {
            await commandAction(ctx, userId);
        } else if (sessionAction) {
            await sessionAction(ctx, text, userId);
        } else {
            await ctx.reply('Comando non riconosciuto');
        }
    } catch (error) {
        await handleErrors(ctx, error);
    }
}
