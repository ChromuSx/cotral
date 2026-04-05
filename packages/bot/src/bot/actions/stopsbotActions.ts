import { Markup } from "telegraf";
import { StopsCommands } from "../../commands/stopsCommands";
import { SharedCommands } from "../../commands/sharedCommands";

export const stopsMenu = Markup.keyboard([
    [StopsCommands.GetStopsByLocalityFromMenu],
    [StopsCommands.GetFirstStopByLocalityFromMenu],
    [SharedCommands.BackToMainMenu]
]).resize();
