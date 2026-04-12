import { Context } from 'telegraf';
import { fetchData } from '../utils/apiUtils';
import { VehiclePosition } from '@cotral/shared';
import { Emoji, bold, escapeHtml, divider, mapsLink } from '../utils/messageFormatting';
import { logger } from '../utils/logger';

export async function getVehicleRealTimePositions(ctx: Context, vehicleCode: string): Promise<void> {
    const apiUrl = `/vehiclerealtimepositions/${encodeURIComponent(vehicleCode)}`;

    try {
        await ctx.sendChatAction('typing');
        const data = await fetchData<VehiclePosition>(apiUrl);

        if (!data) {
            await ctx.reply(
                `${Emoji.SEARCH} <b>Posizione non disponibile</b> per il veicolo ${bold(vehicleCode)}.\n\n<i>Il veicolo potrebbe non essere in servizio.</i>`,
                { reply_markup: { inline_keyboard: [[ { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' } ]] } }
            );
            return;
        }

        const lines: string[] = [
            `${Emoji.GEAR} ${bold(`Veicolo ${escapeHtml(vehicleCode)}`)}`,
            divider(),
            `${Emoji.CLOCK} <b>Ultimo aggiornamento:</b> ${data.time ? escapeHtml(data.time) : 'Non disponibile'}`,
        ];

        const keyboard: { text: string; callback_data: string }[][] = [];

        if (data.coordX?.length > 0 && data.coordY?.length > 0) {
            const lastX = parseFloat(data.coordX[data.coordX.length - 1]);
            const lastY = parseFloat(data.coordY[data.coordY.length - 1]);
            if (!isNaN(lastX) && !isNaN(lastY) && !(lastX === 0 && lastY === 0)) {
                lines.push(`${Emoji.MAP} ${mapsLink(lastX, lastY)}`);
                keyboard.push([{ text: `${Emoji.PIN} Mappa`, callback_data: `location:${lastX.toFixed(5)}:${lastY.toFixed(5)}` }]);
            }
        }

        keyboard.push([
            { text: `\u{1F504} Aggiorna`, callback_data: `vehicles:getVehicleRealTimePositions:${vehicleCode}` },
        ]);
        keyboard.push([
            { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' },
        ]);

        await ctx.reply(lines.join('\n'), {
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
