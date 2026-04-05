import { Context } from "telegraf";
import api from "../services/axiosService";
import { convertAndValidateCoords } from "./functions";
import { logger } from "./logger";

const NO_DATA_MESSAGE = 'Nessun dato disponibile.';
const DATA_ERROR_MESSAGE = 'Si è verificato un errore durante il recupero dei dati.';

interface ApiItem {
    codicePalina?: string;
    codiceStop?: string | number;
    preferita?: boolean;
    coordX?: number | string;
    coordY?: number | string;
}

async function sendLocationIfPresent(ctx: Context, item: ApiItem): Promise<void> {
    if (item.coordX !== undefined && item.coordX !== null && item.coordY !== undefined && item.coordY !== null) {
        const coords = convertAndValidateCoords(String(item.coordX), String(item.coordY));
        if (coords) {
            await ctx.sendLocation(coords.latitude, coords.longitude);
        }
    }
}

export async function handleApiResponse<T>(
    ctx: Context,
    apiUrl: string | null,
    formatter: (data: T) => string,
    isStringArray: boolean = false
): Promise<void> {
    if (!apiUrl) {
        await ctx.reply('Per favore, fornisci parametri validi.');
        return;
    }

    try {
        const data = await fetchData<T>(apiUrl);
        if (data === null || data === undefined) {
            await ctx.reply(NO_DATA_MESSAGE);
            return;
        }
        if (Array.isArray(data)) {
            if (data.length === 0) {
                await ctx.reply(NO_DATA_MESSAGE);
                return;
            }
            if (isStringArray) {
                await ctx.reply(formatter(data as unknown as T));
            } else {
                for (const item of data) {
                    const message = formatter(item);
                    const apiItem = item as unknown as ApiItem;

                    const inlineKeyboard: { text: string; callback_data: string }[][] = [];
                    if (apiItem.codicePalina) {
                        inlineKeyboard.push([{ text: "Transiti", callback_data: `transits:getTransits:${apiItem.codicePalina}` }]);
                        if (apiItem.preferita) {
                            inlineKeyboard.push([{ text: "Rimuovi dai preferiti", callback_data: `poles:remove_favorite:${apiItem.codicePalina}` }]);
                        } else {
                            const lat = Number(apiItem.coordX).toFixed(4);
                            const lon = Number(apiItem.coordY).toFixed(4);
                            inlineKeyboard.push([{ text: "Aggiungi ai preferiti", callback_data: `poles:fav:${apiItem.codicePalina}:${lat}:${lon}` }]);
                        }
                    }

                    if (inlineKeyboard.length > 0) {
                        await ctx.reply(message, { reply_markup: { inline_keyboard: inlineKeyboard } });
                    } else {
                        await ctx.reply(message);
                    }

                    await sendLocationIfPresent(ctx, apiItem);
                }
            }
        } else {
            const message = typeof data === 'object' ? formatter(data) : NO_DATA_MESSAGE;
            await ctx.reply(message);
            await sendLocationIfPresent(ctx, data as unknown as ApiItem);
        }
    } catch (error) {
        logger.error('Errore nella risposta API', error);
        await ctx.reply(DATA_ERROR_MESSAGE);
    }
}

export async function fetchData<T>(apiUrl: string): Promise<T | null> {
    const response = await api.get<T>(apiUrl);
    return response.data;
}
