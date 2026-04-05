import { Markup } from "telegraf";
import { TransitsCommands } from "../../commands/transitsCommands";
import { SharedCommands } from "../../commands/sharedCommands";

export const transitsMenu = Markup.keyboard([
    [TransitsCommands.GetTransitsByPoleCodeFromMenu],
    [SharedCommands.BackToMainMenu]
]).resize();
