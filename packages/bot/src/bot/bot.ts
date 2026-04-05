import * as path from 'path';
import * as dotenv from 'dotenv';

const packageRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(packageRoot, '.env') });

import { Markup, Telegraf } from 'telegraf';
import LocalSession from 'telegraf-session-local';
import { ExtendedContext } from '../interfaces/ExtendedContext';
import { registerPolesBotActions } from './actions/polesBotActions';
import { PolesCommands } from '../commands/polesCommands';
import { StopsCommands } from '../commands/stopsCommands';
import { TransitsCommands } from '../commands/transitsCommands';
import { VehiclesCommands } from '../commands/vehiclesCommands';
import { handleCommand } from './handlers/commandHandler';
import { handleCallbackQuery } from './handlers/callbackQueryHandler';
import { handleLocation } from './handlers/locationHandler';
import { getFavoritePolesButtons } from '../apiHandlers/polesApiHandler';
import { logger } from '../utils/logger';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (typeof token !== 'string') {
    throw new Error('TELEGRAM_BOT_TOKEN must be set in environment.');
}

const bot = new Telegraf<ExtendedContext>(token);

const sessionDbPath = process.env.SESSION_DB_PATH || path.join(packageRoot, 'session_db.json');
const localSession = new LocalSession({
    database: sessionDbPath,
    storage: LocalSession.storageFileAsync,
});

bot.use(localSession.middleware('session'));

registerPolesBotActions(bot);

async function registerCommands() {
    await bot.telegram.setMyCommands([
        { command: 'start', description: 'Avvia il bot' },
        { command: PolesCommands.GetFavoritePoles, description: 'Ottieni le tue paline preferite' },
        { command: PolesCommands.GetPolesByCode, description: 'Ottieni paline per codice' },
        { command: PolesCommands.GetPolesByPosition, description: 'Ottieni paline per posizione' },
        { command: PolesCommands.GetPoleByArrivalAndDestination, description: 'Ottieni palina per arrivo e destinazione' },
        { command: PolesCommands.GetAllPolesDestinationsByArrival, description: 'Ottieni tutte le destinazioni per arrivo' },
        { command: StopsCommands.GetStopsByLocality, description: 'Ottieni fermate per località' },
        { command: StopsCommands.GetFirstStopByLocality, description: 'Ottieni prima fermata per località' },
        { command: TransitsCommands.GetTransitsByPoleCode, description: 'Ottieni transiti per codice palina' },
        { command: VehiclesCommands.GetVehicleRealTimePositions, description: 'Ottieni posizione veicolo per codice veicolo' },
    ]);
}

registerCommands().catch(err => logger.error('Errore nella registrazione dei comandi', err));

const welcomeMessage = 'Benvenuto!\nPer accedere ai servizi, seleziona una delle opzioni qui sotto\n oppure usa le scorciatoie del menu per un accesso rapido.';

const mainMenuButtons = [
    [PolesCommands.GetPolesMenu, StopsCommands.GetStopsMenu],
    [TransitsCommands.GetTransitsMenu, VehiclesCommands.GetVehiclesMenu]
];

bot.start(async ctx => {
    await mainMenu(ctx);
});

bot.action('MAIN_MENU', async ctx => {
    await mainMenu(ctx);
});

export async function mainMenu(ctx: ExtendedContext) {
    const favoritePolesButtons = await getFavoritePolesButtons(ctx);

    const favoritePolesInlineKeyboard = Markup.inlineKeyboard(
        favoritePolesButtons.map(button => Markup.button.callback(button.text, button.callback_data)),
        { columns: favoritePolesButtons.length > 1 ? 2 : 1 }
    );

    await ctx.reply(welcomeMessage, Markup.keyboard(mainMenuButtons).resize());

    if (favoritePolesButtons.length > 0) {
        await ctx.reply('Le tue paline preferite:', favoritePolesInlineKeyboard);
    }
}

bot.on('text', async (ctx) => {
    const text = ctx.message?.text;
    await handleCommand(ctx, text);
});

bot.on('location', async (ctx) => {
    await handleLocation(ctx);
});

bot.on('callback_query', async (ctx) => {
    await handleCallbackQuery(ctx);
});

export default bot;
