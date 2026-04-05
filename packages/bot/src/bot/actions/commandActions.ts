import { Markup } from "telegraf";
import { PolesCommands, handleGetFavoritePoles } from "../../commands/polesCommands";
import { ActionFunction } from "../../interfaces/ExtendedContext";
import { promptForInput } from "../../utils/telegrafUtils";
import { StopsCommands } from "../../commands/stopsCommands";
import { TransitsCommands } from "../../commands/transitsCommands";
import { VehiclesCommands } from "../../commands/vehiclesCommands";
import { polesMenu } from "../actions/polesBotActions";
import { stopsMenu } from "../actions/stopsbotActions";
import { transitsMenu } from "../actions/transitsBotActions";
import { vehiclesMenu } from "../actions/vehiclesBotActions";
import { SharedCommands } from "../../commands/sharedCommands";
import { mainMenu } from "../bot";

function clearSession(ctx: { session: { command?: string; step?: string; params?: any } }) {
    ctx.session.command = undefined;
    ctx.session.step = undefined;
    ctx.session.params = undefined;
}

const handleBackToMainMenu: ActionFunction = async ctx => { clearSession(ctx); await mainMenu(ctx); };

const handleGetPolesMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('Seleziona un\'opzione:', polesMenu); };
const handleGetStopsMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('Seleziona un\'opzione:', stopsMenu); };
const handleGetTransitsMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('Seleziona un\'opzione:', transitsMenu); };
const handleGetVehiclesMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('Seleziona un\'opzione:', vehiclesMenu); };

export const handleGetPolesByCode: ActionFunction = async ctx => await promptForInput(ctx, 'Inserisci il codice:', PolesCommands.GetPolesByCode);

export const handleGetPolesByPosition: ActionFunction = async ctx => {
    ctx.session.command = PolesCommands.GetPolesByPosition;
    const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Usa la mia posizione attuale', 'use_current_position'),
        Markup.button.callback('Inserisco manualmente', 'enter_position_manually'),
    ]);
    await ctx.reply('Vuoi usare la tua posizione attuale o inserire una posizione manualmente?', keyboard);
};

export const handleGetPoleByArrivalAndDestination: ActionFunction = async ctx => {
    ctx.session.step = 'arrival';
    await promptForInput(ctx, 'Inserisci l\'arrivo:', PolesCommands.GetPoleByArrivalAndDestination);
};

export const handleGetAllPolesDestinations: ActionFunction = async ctx => await promptForInput(ctx, 'Inserisci la località di arrivo:', PolesCommands.GetAllPolesDestinationsByArrival);

const handleFavoritePoles: ActionFunction = async (ctx, userId) => await handleGetFavoritePoles(ctx, userId);

const handleGetStopsByLocality: ActionFunction = async ctx => await promptForInput(ctx, 'Inserisci la località:', StopsCommands.GetStopsByLocality);
const handleGetFirstStopByLocality: ActionFunction = async ctx => await promptForInput(ctx, 'Inserisci la località:', StopsCommands.GetFirstStopByLocality);
const handleGetTransitsByPoleCode: ActionFunction = async ctx => await promptForInput(ctx, 'Inserisci il codice della palina:', TransitsCommands.GetTransitsByPoleCode);
const handleGetVehiclePositions: ActionFunction = async ctx => await promptForInput(ctx, 'Inserisci il codice del veicolo:', VehiclesCommands.GetVehicleRealTimePositions);

export const commandActions: Record<string, ActionFunction> = {
    // Navigation
    [`${SharedCommands.BackToMainMenu}`]: handleBackToMainMenu,

    // Main menu -> sub-menus
    [`${PolesCommands.GetPolesMenu}`]: handleGetPolesMenu,
    [`${StopsCommands.GetStopsMenu}`]: handleGetStopsMenu,
    [`${TransitsCommands.GetTransitsMenu}`]: handleGetTransitsMenu,
    [`${VehiclesCommands.GetVehiclesMenu}`]: handleGetVehiclesMenu,

    // Poles sub-menu buttons + slash commands
    [`${PolesCommands.GetPolesByCodeFromMenu}`]: handleGetPolesByCode,
    [`/${PolesCommands.GetPolesByCode}`]: handleGetPolesByCode,
    [`${PolesCommands.GetPolesByPositionFromMenu}`]: handleGetPolesByPosition,
    [`/${PolesCommands.GetPolesByPosition}`]: handleGetPolesByPosition,
    [`${PolesCommands.GetPoleByArrivalAndDestinationFromMenu}`]: handleGetPoleByArrivalAndDestination,
    [`/${PolesCommands.GetPoleByArrivalAndDestination}`]: handleGetPoleByArrivalAndDestination,
    [`${PolesCommands.GetAllPolesDestinationsByArrivalFromMenu}`]: handleGetAllPolesDestinations,
    [`/${PolesCommands.GetAllPolesDestinationsByArrival}`]: handleGetAllPolesDestinations,
    [`${PolesCommands.GetFavoritePolesFromMenu}`]: handleFavoritePoles,
    [`/${PolesCommands.GetFavoritePoles}`]: handleFavoritePoles,

    // Stops sub-menu buttons + slash commands
    [`${StopsCommands.GetStopsByLocalityFromMenu}`]: handleGetStopsByLocality,
    [`/${StopsCommands.GetStopsByLocality}`]: handleGetStopsByLocality,
    [`${StopsCommands.GetFirstStopByLocalityFromMenu}`]: handleGetFirstStopByLocality,
    [`/${StopsCommands.GetFirstStopByLocality}`]: handleGetFirstStopByLocality,

    // Transits sub-menu buttons + slash commands
    [`${TransitsCommands.GetTransitsByPoleCodeFromMenu}`]: handleGetTransitsByPoleCode,
    [`/${TransitsCommands.GetTransitsByPoleCode}`]: handleGetTransitsByPoleCode,

    // Vehicles sub-menu buttons + slash commands
    [`${VehiclesCommands.GetVehicleRealTimePositionsFromMenu}`]: handleGetVehiclePositions,
    [`/${VehiclesCommands.GetVehicleRealTimePositions}`]: handleGetVehiclePositions,
};
