import { Markup } from "telegraf";
import { VehiclesCommands } from "../../commands/vehiclesCommands";
import { SharedCommands } from "../../commands/sharedCommands";

export const vehiclesMenu = Markup.keyboard([
    [VehiclesCommands.GetVehicleRealTimePositionsFromMenu],
    [SharedCommands.BackToMainMenu]
]).resize();
