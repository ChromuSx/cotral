import { Context } from 'telegraf';
import { fetchData } from '../utils/apiUtils';
import { VehiclePosition } from '@cotral/shared';
import { Emoji, bold, escapeHtml, mapsLink } from '../utils/messageFormatting';
import { logger } from '../utils/logger';

type VehiclePositionResponse = VehiclePosition | VehiclePosition[];

export interface VehiclePositionContext {
    route?: string;
    transitTime?: string;
    arrivalTime?: string;
    delayLabel?: string;
    trackingLabel?: string;
    refreshCallbackData?: string;
}

export function normalizeVehiclePositionResponse(data: VehiclePositionResponse | null): VehiclePosition | null {
    if (!data) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    return data;
}

export function formatVehiclePositionMessage(vehicleCode: string, data: VehiclePosition, context?: VehiclePositionContext): string {
    const lines: string[] = [
        `${Emoji.GEAR} ${bold(`Veicolo ${escapeHtml(vehicleCode)}`)}`,
    ];

    if (context?.route) {
        lines.push(`${Emoji.BUS} <b>Corsa:</b> ${escapeHtml(context.route)}`);
    }
    if (context?.transitTime || context?.arrivalTime) {
        const timeParts = [
            context.transitTime ? `transito ${context.transitTime}` : null,
            context.arrivalTime ? `arrivo ${context.arrivalTime}` : null,
        ].filter(Boolean).join(' · ');
        lines.push(`${Emoji.CLOCK} <b>Orari corsa:</b> ${escapeHtml(timeParts)}`);
    }
    if (context?.trackingLabel) {
        lines.push(`${Emoji.GREEN} <b>Stato:</b> ${escapeHtml(context.trackingLabel)}`);
    }
    if (context?.delayLabel) {
        lines.push(`${Emoji.DELAY} <b>${escapeHtml(context.delayLabel)}</b>`);
    }

    lines.push(`${Emoji.CLOCK} <b>Posizione aggiornata:</b> ${data.time ? escapeHtml(data.time) : 'Non disponibile'}`);

    if (data.coordX?.length > 0 && data.coordY?.length > 0) {
        const lastX = parseFloat(data.coordX[data.coordX.length - 1]);
        const lastY = parseFloat(data.coordY[data.coordY.length - 1]);
        if (!isNaN(lastX) && !isNaN(lastY) && !(lastX === 0 && lastY === 0)) {
            lines.push(`${Emoji.PIN} <b>Coordinate:</b> ${lastX.toFixed(5)}, ${lastY.toFixed(5)}`);
            lines.push(`${Emoji.MAP} ${mapsLink(lastX, lastY)}`);
        }
    }

    return lines.join('\n');
}

export async function getVehicleRealTimePositions(ctx: Context, vehicleCode: string, context?: VehiclePositionContext): Promise<void> {
    const apiUrl = `/vehiclerealtimepositions/${encodeURIComponent(vehicleCode)}`;

    try {
        await ctx.sendChatAction('typing');
        const response = await fetchData<VehiclePositionResponse>(apiUrl);
        const data = normalizeVehiclePositionResponse(response);

        if (!data) {
            await ctx.reply(
                `${Emoji.SEARCH} <b>Posizione non disponibile</b> per il veicolo ${bold(vehicleCode)}.\n\n<i>Il veicolo potrebbe non essere in servizio.</i>`,
                { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
            );
            return;
        }

        const message = formatVehiclePositionMessage(vehicleCode, data, context);

        const keyboard: { text: string; callback_data: string }[][] = [];

        if (data.coordX?.length > 0 && data.coordY?.length > 0) {
            const lastX = parseFloat(data.coordX[data.coordX.length - 1]);
            const lastY = parseFloat(data.coordY[data.coordY.length - 1]);
            if (!isNaN(lastX) && !isNaN(lastY) && !(lastX === 0 && lastY === 0)) {
                keyboard.push([{ text: `${Emoji.PIN} Mappa`, callback_data: `location:${lastX.toFixed(5)}:${lastY.toFixed(5)}` }]);
            }
        }

        keyboard.push([
            { text: `\u{1F504} Aggiorna`, callback_data: context?.refreshCallbackData ?? `vehicles:getVehicleRealTimePositions:${vehicleCode}` },
        ]);
        keyboard.push([
            { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' },
        ]);

        await ctx.reply(message, {
            reply_markup: { inline_keyboard: keyboard },
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        logger.error('Errore posizione veicolo', error, { vehicleCode });
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero della posizione.`,
            { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
        );
    }
}
