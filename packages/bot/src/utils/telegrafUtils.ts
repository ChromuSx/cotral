import { Markup } from "telegraf";
import { ExtendedContext } from "../interfaces/ExtendedContext";
import { SharedCommands } from "../commands/sharedCommands";

const cancelKeyboard = Markup.keyboard([
    [SharedCommands.Cancel]
]).resize();

export async function promptForInput(ctx: ExtendedContext, message: string, sessionProperty: string) {
    await ctx.reply(message, { parse_mode: 'HTML' as const, ...cancelKeyboard });
    ctx.session.command = sessionProperty;
}
