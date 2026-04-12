import { Context } from "telegraf";
import api from "../services/axiosService";
import { convertAndValidateCoords, chunkArray } from "./functions";
import { logger } from "./logger";
import { Emoji, divider, resultCountHeader } from "./messageFormatting";

const NO_DATA_MESSAGE = `${Emoji.SEARCH} <b>Nessun risultato trovato</b>\n\nProva a:\n${Emoji.POINT} Controllare i dati inseriti\n${Emoji.POINT} Usare un termine di ricerca diverso\n${Emoji.POINT} Riprovare tra qualche minuto`;
const DATA_ERROR_MESSAGE = `${Emoji.WARNING} <b>Errore nel recupero dati</b>\n\nRiprova tra qualche istante o torna al menu principale con /start.`;

const emptyStateKeyboard = {
    inline_keyboard: [[
        { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' },
    ]]
};

interface ApiItem {
    codicePalina?: string;
    codiceStop?: string | number;
    preferita?: boolean;
    coordX?: number | string;
    coordY?: number | string;
}

function buildInlineKeyboard(apiItem: ApiItem): { text: string; callback_data: string }[][] {
    const inlineKeyboard: { text: string; callback_data: string }[][] = [];
    if (apiItem.codicePalina) {
        const favButton = apiItem.preferita
            ? { text: `${Emoji.CROSS} Rimuovi preferito`, callback_data: `poles:remove_favorite:${apiItem.codicePalina}` }
            : (() => {
                const lat = Number(apiItem.coordX).toFixed(4);
                const lon = Number(apiItem.coordY).toFixed(4);
                return { text: `${Emoji.STAR} Preferito`, callback_data: `poles:fav:${apiItem.codicePalina}:${lat}:${lon}` };
            })();
        inlineKeyboard.push([
            { text: `${Emoji.BUS} Transiti`, callback_data: `transits:getTransits:${apiItem.codicePalina}` },
            favButton,
        ]);
    }
    if (apiItem.coordX !== undefined && apiItem.coordX !== null &&
        apiItem.coordY !== undefined && apiItem.coordY !== null) {
        const coords = convertAndValidateCoords(String(apiItem.coordX), String(apiItem.coordY));
        if (coords) {
            inlineKeyboard.push([
                { text: `${Emoji.PIN} Mappa`, callback_data: `location:${coords.latitude.toFixed(5)}:${coords.longitude.toFixed(5)}` }
            ]);
        }
    }
    return inlineKeyboard;
}

export async function handleApiResponse<T>(
    ctx: Context,
    apiUrl: string | null,
    formatter: (data: T) => string,
    isStringArray: boolean = false
): Promise<void> {
    if (!apiUrl) {
        await ctx.reply(`${Emoji.WARNING} Per favore, fornisci parametri validi.`);
        return;
    }

    try {
        await ctx.sendChatAction('typing');
        const data = await fetchData<T>(apiUrl);
        if (data === null || data === undefined) {
            await ctx.reply(NO_DATA_MESSAGE, { reply_markup: emptyStateKeyboard });
            return;
        }
        if (Array.isArray(data)) {
            if (data.length === 0) {
                await ctx.reply(NO_DATA_MESSAGE, { reply_markup: emptyStateKeyboard });
                return;
            }
            if (isStringArray) {
                await ctx.reply(formatter(data as unknown as T), { link_preview_options: { is_disabled: true } });
            } else {
                const BATCH_SIZE = 5;
                const batches = chunkArray(data, BATCH_SIZE);
                const totalCount = data.length;
                let isFirstBatch = true;

                for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
                    const batch = batches[batchIdx];
                    const isLastBatch = batchIdx === batches.length - 1;
                    const messageParts: string[] = [];
                    if (isFirstBatch && totalCount > 1) {
                        messageParts.push(resultCountHeader(totalCount, 'risultati'));
                        messageParts.push('');
                        isFirstBatch = false;
                    }
                    const allInlineButtons: { text: string; callback_data: string }[][] = [];

                    for (const item of batch) {
                        messageParts.push(formatter(item));
                        const apiItem = item as unknown as ApiItem;
                        const buttons = buildInlineKeyboard(apiItem);
                        allInlineButtons.push(...buttons);
                    }

                    if (isLastBatch) {
                        allInlineButtons.push([
                            { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' },
                        ]);
                    }

                    const combinedMessage = messageParts.join(`\n\n`);

                    await ctx.reply(combinedMessage, {
                        reply_markup: allInlineButtons.length > 0 ? { inline_keyboard: allInlineButtons } : undefined,
                        link_preview_options: { is_disabled: true },
                    });
                }
            }
        } else {
            const message = typeof data === 'object' ? formatter(data) : NO_DATA_MESSAGE;
            const apiItem = data as unknown as ApiItem;
            const buttons = buildInlineKeyboard(apiItem);

            await ctx.reply(message, {
                reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
                link_preview_options: { is_disabled: true },
            });
        }
    } catch (error) {
        logger.error('Errore nella risposta API', error);
        await ctx.reply(DATA_ERROR_MESSAGE, { reply_markup: emptyStateKeyboard });
    }
}

export async function fetchData<T>(apiUrl: string): Promise<T | null> {
    const response = await api.get<T>(apiUrl);
    return response.data;
}
