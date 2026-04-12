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
import { Emoji, greetingByTime } from '../utils/messageFormatting';

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

const allowedUserIds: Set<number> | null = (() => {
    const raw = process.env.ALLOWED_USER_IDS;
    if (!raw || !raw.trim()) return null;
    const ids = raw.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    return ids.length > 0 ? new Set(ids) : null;
})();

bot.use(async (ctx, next) => {
    if (allowedUserIds) {
        const userId = ctx.from?.id;
        if (!userId || !allowedUserIds.has(userId)) {
            try {
                await ctx.reply('\u{1F6AB} Accesso non autorizzato.\n\nQuesto bot \u00e8 riservato a utenti autorizzati.');
            } catch { /* ignore */ }
            return;
        }
    }
    await next();
});

bot.use(async (ctx, next) => {
    const originalReply = ctx.reply.bind(ctx);
    (ctx as any).reply = (text: string, extra?: any) => {
        return originalReply(text, { parse_mode: 'HTML' as const, ...extra });
    };
    await next();
});

registerPolesBotActions(bot);

async function registerCommands() {
    await bot.telegram.setMyCommands([
        { command: 'start', description: 'Avvia il bot' },
        { command: 'help', description: 'Guida e suggerimenti' },
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

function buildWelcomeMessage(): string {
    return [
        `${Emoji.WAVE} <b>${greetingByTime()}! Benvenuto su CotralBot</b>`,
        '',
        'Il tuo assistente per il trasporto pubblico regionale del Lazio.',
        '',
        'Ecco cosa posso fare:',
        `${Emoji.BUSSTOP} <b>Paline</b> \u2014 Cerca per codice, posizione o destinazione`,
        `${Emoji.BUS} <b>Transiti</b> \u2014 Orari in tempo reale`,
        `${Emoji.BUSSTOP} <b>Fermate</b> \u2014 Trova fermate per localit\u00e0`,
        `${Emoji.GEAR} <b>Veicoli</b> \u2014 Posizione bus in tempo reale`,
        '',
        "Seleziona un'opzione dal menu o digita /help per la guida.",
    ].join('\n');
}

const mainMenuButtons = [
    [PolesCommands.GetPolesMenu, StopsCommands.GetStopsMenu],
    [TransitsCommands.GetTransitsMenu, VehiclesCommands.GetVehiclesMenu]
];

bot.start(async ctx => {
    await mainMenu(ctx);
});

bot.command('help', async ctx => {
    const helpMessage = [
        `${Emoji.SEARCH} <b>Guida a CotralBot</b>`,
        '',
        `${Emoji.BUSSTOP} <b>Paline</b>`,
        `${Emoji.POINT} Cerca per codice (es. <code>30125</code>)`,
        `${Emoji.POINT} Cerca vicino a te con la posizione GPS`,
        `${Emoji.POINT} Cerca per localit\u00e0 di arrivo e destinazione`,
        `${Emoji.POINT} Vedi tutte le destinazioni da una localit\u00e0`,
        '',
        `${Emoji.BUS} <b>Transiti</b>`,
        `${Emoji.POINT} Inserisci il codice palina per vedere gli orari in tempo reale`,
        `${Emoji.POINT} I transiti sono ordinati per orario di partenza`,
        `${Emoji.POINT} Usa il bottone \u{1F504} Aggiorna per dati aggiornati`,
        '',
        `${Emoji.BUSSTOP} <b>Fermate</b>`,
        `${Emoji.POINT} Cerca fermate per nome della localit\u00e0`,
        '',
        `${Emoji.GEAR} <b>Veicoli</b>`,
        `${Emoji.POINT} Posizione in tempo reale di un bus tramite codice veicolo`,
        '',
        `${Emoji.STAR} <b>Preferiti</b>`,
        `${Emoji.POINT} Aggiungi paline ai preferiti per accesso rapido`,
        `${Emoji.POINT} Li troverai nel menu principale dopo /start`,
        '',
        `<b>Suggerimenti:</b>`,
        `${Emoji.POINT} Il codice palina si trova sulla pensilina della fermata`,
        `${Emoji.POINT} Puoi usare ${Emoji.CROSS} <b>Annulla</b> per interrompere un inserimento`,
        `${Emoji.POINT} Digita /start per tornare al menu principale`,
    ].join('\n');
    await ctx.reply(helpMessage);
});

bot.action('MAIN_MENU', async ctx => {
    await mainMenu(ctx);
});

export async function mainMenu(ctx: ExtendedContext) {
    await ctx.sendChatAction('typing');
    const favoritePolesButtons = await getFavoritePolesButtons(ctx);

    const favoritePolesInlineKeyboard = Markup.inlineKeyboard(
        favoritePolesButtons.map(button => Markup.button.callback(button.text, button.callback_data)),
        { columns: 1 }
    );

    await ctx.reply(buildWelcomeMessage(), Markup.keyboard(mainMenuButtons).resize());

    if (favoritePolesButtons.length > 0) {
        await ctx.reply(`${Emoji.STAR} <b>Le tue paline preferite:</b>`, favoritePolesInlineKeyboard);
    } else {
        await ctx.reply(
            `${Emoji.STAR} <i>Non hai ancora paline preferite.\nCerca una palina e premi </i>${Emoji.STAR} Preferito<i> per aggiungerla qui!</i>`
        );
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
