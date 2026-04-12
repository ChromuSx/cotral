import { Markup } from "telegraf";
import { Emoji } from "../../utils/messageFormatting";
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
const handleCancel: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply(`${Emoji.CHECK} Operazione annullata.`); await mainMenu(ctx); };

const handleGetPolesMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('\u{1F68F} <b>Paline</b>\n\nCosa vuoi fare?', polesMenu); };
const handleGetStopsMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('\u{1F68F} <b>Fermate</b>\n\nCosa vuoi fare?', stopsMenu); };
const handleGetTransitsMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('\u{1F68C} <b>Transiti</b>\n\nCosa vuoi fare?', transitsMenu); };
const handleGetVehiclesMenu: ActionFunction = async ctx => { clearSession(ctx); await ctx.reply('\u2699\uFE0F <b>Veicoli</b>\n\nCosa vuoi fare?', vehiclesMenu); };

export const handleGetPolesByCode: ActionFunction = async ctx => await promptForInput(ctx, '\u{1F50D} Inserisci il <b>codice della palina</b>:\n\n<i>Esempio: 30125</i>', PolesCommands.GetPolesByCode);

export const handleGetPolesByPosition: ActionFunction = async ctx => {
    ctx.session.command = PolesCommands.GetPolesByPosition;
    await ctx.reply(
        `${Emoji.PIN} <b>Condividi la tua posizione</b> per trovare le paline vicine.\n\n<i>Oppure invia una posizione manualmente con l'icona graffetta \u2192 Posizione.</i>`,
        Markup.keyboard([
            [Markup.button.locationRequest(`${Emoji.PIN} Condividi Posizione`)],
            [SharedCommands.Cancel],
        ]).resize()
    );
};

export const handleGetPoleByArrivalAndDestination: ActionFunction = async ctx => {
    ctx.session.step = 'arrival';
    await promptForInput(ctx, `${Emoji.COMPASS} <b>Ricerca per arrivo e destinazione</b> (1/2)\n\n${Emoji.PIN} Inserisci la <b>localit\u00e0 di partenza</b>:\n\n<i>Esempio: Roma, Tivoli, Latina...</i>`, PolesCommands.GetPoleByArrivalAndDestination);
};

export const handleGetAllPolesDestinations: ActionFunction = async ctx => await promptForInput(ctx, '\u{1F4CD} Inserisci la <b>localit\u00e0 di arrivo</b>:\n\n<i>Esempio: Roma, Tivoli, Latina...</i>', PolesCommands.GetAllPolesDestinationsByArrival);

const handleFavoritePoles: ActionFunction = async (ctx, userId) => await handleGetFavoritePoles(ctx, userId);

const handleGetStopsByLocality: ActionFunction = async ctx => await promptForInput(ctx, '\u{1F50D} Inserisci il <b>nome della localit\u00e0</b>:\n\n<i>Esempio: Tivoli, Frascati, Guidonia...</i>', StopsCommands.GetStopsByLocality);
const handleGetFirstStopByLocality: ActionFunction = async ctx => await promptForInput(ctx, '\u{1F50D} Inserisci il <b>nome della localit\u00e0</b>:\n\n<i>Esempio: Tivoli, Frascati, Guidonia...</i>', StopsCommands.GetFirstStopByLocality);
const handleGetTransitsByPoleCode: ActionFunction = async ctx => await promptForInput(ctx, '\u{1F50D} Inserisci il <b>codice della palina</b>:\n\n<i>Lo trovi sulla pensilina della fermata.</i>', TransitsCommands.GetTransitsByPoleCode);
const handleGetVehiclePositions: ActionFunction = async ctx => await promptForInput(ctx, '\u{1F50D} Inserisci il <b>codice del veicolo</b>:\n\n<i>Lo trovi a bordo o nei dettagli del transito.</i>', VehiclesCommands.GetVehicleRealTimePositions);

export const commandActions: Record<string, ActionFunction> = {
    // Navigation
    [`${SharedCommands.BackToMainMenu}`]: handleBackToMainMenu,
    [`${SharedCommands.Cancel}`]: handleCancel,

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
