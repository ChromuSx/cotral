import { Context } from 'telegraf';
import { Transit, Pole } from '@cotral/shared';
import { fetchData } from '../utils/apiUtils';
import { logger } from '../utils/logger';
import { Emoji, bold, escapeHtml, divider, relativeTime, parseTime, nowTimestamp } from '../utils/messageFormatting';
import { chunkArray } from '../utils/functions';

interface TransitsResponse {
    pole: Pole;
    transits: Transit[];
}

function sortTransitsByDeparture(transits: Transit[]): Transit[] {
    return [...transits].sort((a, b) => {
        const timeA = parseTime(a.orarioPartenzaCorsa);
        const timeB = parseTime(b.orarioPartenzaCorsa);
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return timeA.getTime() - timeB.getTime();
    });
}

function findNextDepartureIndex(transits: Transit[]): number {
    const now = new Date();
    for (let i = 0; i < transits.length; i++) {
        const t = parseTime(transits[i].orarioPartenzaCorsa);
        if (t && t.getTime() >= now.getTime() - 60000) return i;
    }
    return -1;
}

function buildTransitSelectionList(sorted: Transit[], nextIdx: number, poleName: string, poleCode: string) {
    let nextSummary = '';
    if (nextIdx >= 0) {
        const nextTime = sorted[nextIdx].orarioPartenzaCorsa;
        const rt = nextTime ? relativeTime(nextTime) : '';
        nextSummary = rt ? `\n${Emoji.BUS} Prossimo: ${escapeHtml(nextTime)} ${rt}` : '';
    }

    const header = [
        `${Emoji.BUSSTOP} <b>Transiti per: ${poleName}</b>`,
        `${Emoji.CLOCK} Aggiornato alle ${nowTimestamp()} \u2014 ${sorted.length} cors${sorted.length === 1 ? 'a' : 'e'}${nextSummary}`,
        '',
        '<i>Seleziona un transito per i dettagli:</i>',
    ].join('\n');

    const buttons: { text: string; callback_data: string }[][] = [];
    const MAX_BUTTONS = 15;

    for (let i = 0; i < Math.min(sorted.length, MAX_BUTTONS); i++) {
        const t = sorted[i];
        const time = t.orarioPartenzaCorsa || '??:??';
        const dest = t.arrivoCorsa || 'N/D';
        const rel = t.orarioPartenzaCorsa ? relativeTime(t.orarioPartenzaCorsa) : '';
        const cleanRel = rel.replace(/<\/?[^>]+(>|$)/g, '');
        const isNext = i === nextIdx;
        const prefix = isNext ? '\u{1F4A8} ' : `${Emoji.BUS} `;
        const delayMark = (t.ritardo && t.ritardo !== '00:00') ? ` \u{1F6A8}${t.ritardo}` : '';
        const label = `${prefix}${time} \u2192 ${dest} ${cleanRel}${delayMark}`;
        buttons.push([{ text: label, callback_data: `td:${poleCode}:${i}` }]);
    }

    buttons.push([
        { text: `\u{1F504} Aggiorna`, callback_data: `transits:refresh:${poleCode}` },
    ]);
    buttons.push([
        { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' },
    ]);

    return { text: header, keyboard: buttons };
}

export async function getTransitsByPoleCode(ctx: Context, poleCode: string): Promise<void> {
    const apiUrl = `/transits/${encodeURIComponent(poleCode)}`;

    try {
        await ctx.sendChatAction('typing');
        const response = await fetchData<TransitsResponse>(apiUrl);
        if (!response?.transits?.length) {
            await ctx.reply(
                `${Emoji.SEARCH} Nessun transito disponibile per questa palina.\n\n<i>Verifica il codice o riprova pi\u00f9 tardi.</i>`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: `${Emoji.SEARCH} Nuova ricerca`, callback_data: 'nav:transits_menu' },
                            { text: `${Emoji.BACK} Menu principale`, callback_data: 'MAIN_MENU' },
                        ]]
                    }
                }
            );
            return;
        }

        const sorted = sortTransitsByDeparture(response.transits);
        const nextIdx = findNextDepartureIndex(sorted);
        const poleName = response.pole?.nomePalina ? escapeHtml(response.pole.nomePalina) : escapeHtml(poleCode);
        const msg = buildTransitSelectionList(sorted, nextIdx, poleName, poleCode);

        await ctx.reply(msg.text, {
            reply_markup: { inline_keyboard: msg.keyboard },
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        logger.error('Errore recupero transiti', error, { poleCode });
        await ctx.reply(`${Emoji.WARNING} Si \u00e8 verificato un errore durante il recupero dei transiti.`);
    }
}

export async function refreshTransitsByPoleCode(ctx: Context, poleCode: string): Promise<void> {
    const apiUrl = `/transits/${encodeURIComponent(poleCode)}`;

    try {
        const response = await fetchData<TransitsResponse>(apiUrl);
        if (!response?.transits?.length) {
            try {
                await (ctx as any).editMessageText(
                    `${Emoji.SEARCH} Nessun transito disponibile al momento.`,
                    {
                        parse_mode: 'HTML' as const,
                        reply_markup: {
                            inline_keyboard: [[
                                { text: `\u{1F504} Riprova`, callback_data: `transits:refresh:${poleCode}` },
                                { text: `${Emoji.BACK} Menu`, callback_data: 'MAIN_MENU' },
                            ]]
                        }
                    }
                );
            } catch { await ctx.reply(`${Emoji.SEARCH} Nessun transito disponibile.`); }
            return;
        }

        const sorted = sortTransitsByDeparture(response.transits);
        const nextIdx = findNextDepartureIndex(sorted);
        const poleName = response.pole?.nomePalina ? escapeHtml(response.pole.nomePalina) : escapeHtml(poleCode);
        const msg = buildTransitSelectionList(sorted, nextIdx, poleName, poleCode);

        try {
            await (ctx as any).editMessageText(msg.text, {
                parse_mode: 'HTML' as const,
                reply_markup: { inline_keyboard: msg.keyboard },
                link_preview_options: { is_disabled: true },
            });
        } catch {
            await ctx.reply(msg.text, {
                reply_markup: { inline_keyboard: msg.keyboard },
                link_preview_options: { is_disabled: true },
            });
        }
    } catch (error) {
        logger.error('Errore refresh transiti', error, { poleCode });
        try {
            await (ctx as any).answerCbQuery(`${Emoji.WARNING} Errore. Riprova.`, { show_alert: true });
        } catch { /* ignore */ }
    }
}

export async function showTransitDetail(ctx: Context, poleCode: string, index: number): Promise<void> {
    const apiUrl = `/transits/${encodeURIComponent(poleCode)}`;

    try {
        await ctx.sendChatAction('typing');
        const response = await fetchData<TransitsResponse>(apiUrl);
        if (!response?.transits?.length) {
            await ctx.reply(`${Emoji.SEARCH} Transito non pi\u00f9 disponibile.`);
            return;
        }

        const sorted = sortTransitsByDeparture(response.transits);
        const nextIdx = findNextDepartureIndex(sorted);
        const transit = sorted[index];
        if (!transit) {
            await ctx.reply(`${Emoji.SEARCH} Transito non trovato. Potrebbe essere cambiato.`);
            return;
        }

        const isNext = index === nextIdx;
        const message = formatTransitMessage(transit, isNext);

        const keyboard: { text: string; callback_data: string }[][] = [];
        if (transit.automezzo?.codice) {
            keyboard.push([{
                text: `${Emoji.GEAR} Posizione veicolo`,
                callback_data: `vehicles:getVehicleRealTimePositions:${transit.automezzo.codice}`
            }]);
        }
        keyboard.push([
            { text: `${Emoji.BACK} Torna alla lista`, callback_data: `transits:getTransits:${poleCode}` },
            { text: `\u{1F504} Aggiorna`, callback_data: `td:${poleCode}:${index}` },
        ]);

        await ctx.reply(message, {
            reply_markup: { inline_keyboard: keyboard },
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        logger.error('Errore dettaglio transito', error, { poleCode, index });
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero dei dettagli.`);
    }
}

function formatTransitMessage(transit: Transit, isNext: boolean): string {
    const dv = (val: string | null | undefined): string => val || 'N/D';
    const partenza = dv(transit.partenzaCorsa);
    const arrivo = dv(transit.arrivoCorsa);

    const lines: string[] = [];

    if (isNext) {
        lines.push(`\u{1F4A8} <b>PROSSIMA PARTENZA</b>`);
    }

    lines.push(`${Emoji.BUS} ${bold(`${partenza} \u2192 ${arrivo}`)}`);

    const orarioP = transit.orarioPartenzaCorsa;
    const orarioA = transit.orarioArrivoCorsa;
    if (orarioP || orarioA) {
        const parti = orarioP ? escapeHtml(orarioP) : 'N/D';
        const arri = orarioA ? escapeHtml(orarioA) : 'N/D';
        const rel = orarioP ? ` ${relativeTime(orarioP)}` : '';
        lines.push(`${Emoji.CLOCK} Partenza: ${parti}${rel} | Arrivo: ${arri}`);
    }

    if (transit.tempoTransito) {
        lines.push(`${Emoji.CLOCK} Durata: ${escapeHtml(transit.tempoTransito)}`);
    }

    if (transit.ritardo && transit.ritardo !== '00:00') {
        lines.push(`${Emoji.DELAY} <b>Ritardo: ${escapeHtml(transit.ritardo)}</b>`);
    } else {
        lines.push(`${Emoji.GREEN} Puntuale`);
    }

    if (transit.instradamento) {
        lines.push(`${Emoji.ROUTE} ${escapeHtml(transit.instradamento)}`);
    }

    if (transit.automezzo?.codice) {
        const trackingText = transit.automezzo.isAlive ? `${Emoji.GREEN} In tempo reale` : `${Emoji.CLOCK} Ultima posizione nota`;
        lines.push(`${Emoji.GEAR} Mezzo: ${escapeHtml(transit.automezzo.codice)} \u2014 ${trackingText}`);
    } else {
        lines.push(`${Emoji.GEAR} <i>Posizione veicolo non disponibile</i>`);
    }

    lines.push(divider());
    return lines.join('\n');
}
