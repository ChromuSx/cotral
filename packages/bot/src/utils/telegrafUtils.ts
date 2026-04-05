import { ExtendedContext } from "../interfaces/ExtendedContext";

export async function promptForInput(ctx: ExtendedContext, message: string, sessionProperty: string) {
    await ctx.reply(message);
    ctx.session.command = sessionProperty;
}
