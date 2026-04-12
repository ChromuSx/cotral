import { ExtendedContext } from "../interfaces/ExtendedContext";
import { displayFavoritePoles } from '../apiHandlers/polesApiHandler';

export enum PolesCommands {
    GetPolesMenu = '\u{1F68F} Paline',
    GetFavoritePolesFromMenu = '\u2B50 Preferiti',
    GetFavoritePoles = 'getfavoritepoles',
    GetPolesByCodeFromMenu = '\u{1F50D} Cerca per codice',
    GetPolesByCode = 'getpolesbycode',
    GetPolesByPositionFromMenu = '\u{1F4CD} Cerca vicino a me',
    GetPolesByPosition = 'getpolesbyposition',
    GetPoleByArrivalAndDestinationFromMenu = '\u{1F9ED} Arrivo e destinazione',
    GetPoleByArrivalAndDestination = 'getpolebyarrivalanddestination',
    GetAllPolesDestinationsByArrivalFromMenu = '\u{1F5FA}\uFE0F Destinazioni da localit\u00e0',
    GetAllPolesDestinationsByArrival = 'getallpolesdestinationsbyarrival'
}

export async function handleGetFavoritePoles(ctx: ExtendedContext, userId: number | undefined) {
    if (userId) {
        await displayFavoritePoles(ctx, userId);
    } else {
        await ctx.reply('\u26A0\uFE0F ID utente non trovato. Riprova o riavvia con /start.');
    }
}
