import { ExtendedContext } from "../interfaces/ExtendedContext";
import { displayFavoritePoles } from '../apiHandlers/polesApiHandler';

export enum PolesCommands {
    GetPolesMenu = 'Paline',
    GetFavoritePolesFromMenu = 'Preferiti',
    GetFavoritePoles = 'getfavoritepoles',
    GetPolesByCodeFromMenu = 'Codice',
    GetPolesByCode = 'getpolesbycode',
    GetPolesByPositionFromMenu = 'Posizione',
    GetPolesByPosition = 'getpolesbyposition',
    GetPoleByArrivalAndDestinationFromMenu = 'Arrivo e destinazione',
    GetPoleByArrivalAndDestination = 'getpolebyarrivalanddestination',
    GetAllPolesDestinationsByArrivalFromMenu = 'Località di arrivo',
    GetAllPolesDestinationsByArrival = 'getallpolesdestinationsbyarrival'
}

export async function handleGetFavoritePoles(ctx: ExtendedContext, userId: number | undefined) {
    if (userId) {
        await displayFavoritePoles(ctx, userId);
    } else {
        await ctx.reply('UserID non trovato');
    }
}
