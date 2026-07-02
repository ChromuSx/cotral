import { Context } from 'telegraf';
import { Transit, Pole, getTransitTrackingStatus } from '@cotral/shared';
import { fetchData } from '../utils/apiUtils';
import { logger } from '../utils/logger';
import { Emoji, bold, escapeHtml, divider, formatSelectionList, relativeTime, parseTime, nowTimestamp } from '../utils/messageFormatting';
import { chunkArray } from '../utils/functions';
import { getVehicleRealTimePositions, VehiclePositionContext } from './vehiclesApiHandler';

interface TransitsResponse {
    pole: Pole;
    transits: Transit[];
}

export function getTransitDisplayTime(transit: Transit): string {
    return transit.tempoTransito || transit.orarioPartenzaCorsa || '';
}

export function sortTransitsByDisplayTime(transits: Transit[]): Transit[] {
    return [...transits].sort((a, b) => {
        const timeA = parseTime(getTransitDisplayTime(a));
        const timeB = parseTime(getTransitDisplayTime(b));
        if (!timeA && !timeB) return 0;
        if (!timeA) return 1;
        if (!timeB) return -1;
        return timeA.getTime() - timeB.getTime();
    });
}

function buildTransitCallbackKey(transit: Transit, fallbackIndex: number): string {
    return transit.idCorsa ? `id:${encodeURIComponent(transit.idCorsa)}` : String(fallbackIndex);
}

export function buildTransitDetailCallbackData(poleCode: string, transit: Transit, fallbackIndex: number): string {
    return `td:${poleCode}:${buildTransitCallbackKey(transit, fallbackIndex)}`;
}

export function buildVehiclePositionFromTransitCallbackData(poleCode: string, transit: Transit, fallbackIndex: number): string {
    return `vehicles:fromTransit:${poleCode}:${buildTransitCallbackKey(transit, fallbackIndex)}`;
}

export function isValidTransitCallbackKey(key: string | undefined): key is string {
    if (!key) return false;
    if (/^\d+$/.test(key)) return true;
    if (!key.startsWith('id:')) return false;
    return key.slice(3).trim().length > 0;
}

export function resolveTransitByCallbackKey(transits: Transit[], key: string): Transit | undefined {
    if (key.startsWith('id:')) {
        const transitId = decodeURIComponent(key.slice(3));
        return transits.find(transit => transit.idCorsa === transitId);
    }

    const index = parseInt(key, 10);
    if (Number.isNaN(index)) return undefined;
    return transits[index];
}

export function formatTransitDelayLabel(delay: string): string {
    const isAhead = delay.startsWith('-');
    const cleanDelay = isAhead ? delay.slice(1) : delay;
    return isAhead
        ? `Stima Cotral: anticipo ${cleanDelay}`
        : `Stima Cotral: ritardo ${cleanDelay}`;
}

function findNextTransitIndex(transits: Transit[]): number {
    const now = new Date();
    for (let i = 0; i < transits.length; i++) {
        const t = parseTime(getTransitDisplayTime(transits[i]));
        if (t && t.getTime() >= now.getTime() - 60000) return i;
    }
    return -1;
}

export function compactTransitDestination(destination: string | null | undefined): string {
    if (!destination) return 'N/D';

    const withoutCode = cleanTransitEndpoint(destination);
    const [localityRaw, detailRaw] = withoutCode.split('|').map(part => part.trim());
    const locality = localityRaw || withoutCode;
    const detail = detailRaw
        ?.replace(/Stazione\s+FS/ig, 'Staz. FS')
        .replace(/\bMetro\b/ig, 'M.')
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const compact = detail ? `${locality} ${detail}` : locality;
    return compact.length > 24 ? locality : compact;
}

export function cleanTransitEndpoint(value: string | null | undefined): string {
    if (!value) return 'N/D';
    return value
        .replace(/\s*\((?:f\d+|\d+)\)\s*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function formatTransitButtonLabel(transit: Transit, isNext: boolean): string {
    const prefix = isNext ? '💨 ' : '';
    return `${prefix}${getTransitDisplayTime(transit) || '??:??'}`;
}

export function formatTransitSelectionLine(transit: Transit, index: number, isNext: boolean): string {
    const time = getTransitDisplayTime(transit) || '??:??';
    const rel = time !== '??:??' ? ` ${relativeTime(time)}` : '';
    const destination = cleanTransitEndpoint(transit.arrivoCorsa);
    const status = getTransitTrackingStatus(transit);
    const vehicle = transit.automezzo?.codice ? ` · mezzo ${escapeHtml(transit.automezzo.codice)}` : '';
    const next = isNext ? '💨 ' : '';
    let statusLine: string;

    if (status === 'realtime') {
        const delay = transit.ritardo && transit.ritardo !== '00:00'
            ? ` · ${escapeHtml(formatTransitDelayLabel(transit.ritardo))}`
            : ' · puntuale';
        statusLine = `${Emoji.GREEN} Real-time${delay}${vehicle}`;
    } else if (status === 'monitored_offline') {
        statusLine = `🟡 Tracciata, bus non in trasmissione${vehicle}`;
    } else {
        statusLine = `⚪ Schedulata, no real-time${vehicle}`;
    }

    return [
        `${index + 1}. ${next}<b>${escapeHtml(time)}</b>${rel}`,
        `   → ${escapeHtml(destination)}`,
        `   ${statusLine}`,
    ].join('\n');
}

function buildTransitSelectionList(sorted: Transit[], nextIdx: number, poleName: string, poleCode: string) {
    const realtimeCount = sorted.filter(t => getTransitTrackingStatus(t) === 'realtime').length;
    const scheduledCount = sorted.length - realtimeCount;

    let nextSummary = '';
    if (nextIdx >= 0) {
        const nextTime = getTransitDisplayTime(sorted[nextIdx]);
        const rt = nextTime ? relativeTime(nextTime) : '';
        nextSummary = rt ? `\n${Emoji.BUS} Prossimo alla palina: ${escapeHtml(nextTime)} ${rt}` : '';
    }

    const counts = realtimeCount > 0
        ? `${sorted.length} cors${sorted.length === 1 ? 'a' : 'e'} (${realtimeCount} real-time, ${scheduledCount} schedulat${scheduledCount === 1 ? 'a' : 'e'})`
        : `${sorted.length} cors${sorted.length === 1 ? 'a' : 'e'} schedulat${sorted.length === 1 ? 'a' : 'e'}`;

    const buttons: { text: string; callback_data: string }[][] = [];
    const MAX_BUTTONS = 15;
    const shown = sorted.slice(0, MAX_BUTTONS);
    const list = formatSelectionList(shown.map((transit, i) => formatTransitSelectionLine(transit, i, i === nextIdx)));

    const header = [
        `${Emoji.BUSSTOP} <b>Transiti per: ${poleName}</b>`,
        `${Emoji.CLOCK} Aggiornato alle ${nowTimestamp()} \u2014 ${counts}${nextSummary}`,
        '',
        list,
        '',
        '<i>Tocca il numero del transito per aprire i dettagli:</i>',
    ].join('\n');

    for (const row of chunkArray(shown, 5)) {
        buttons.push(row.map((t) => {
            const i = shown.indexOf(t);
            return { text: String(i + 1), callback_data: buildTransitDetailCallbackData(poleCode, t, i) };
        }));
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

        const sorted = sortTransitsByDisplayTime(response.transits);
        const nextIdx = findNextTransitIndex(sorted);
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

        const sorted = sortTransitsByDisplayTime(response.transits);
        const nextIdx = findNextTransitIndex(sorted);
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

export async function showVehiclePositionForTransit(ctx: Context, poleCode: string, index: number): Promise<void> {
    await showVehiclePositionForTransitByKey(ctx, poleCode, String(index));
}

export async function showVehiclePositionForTransitByKey(ctx: Context, poleCode: string, transitKey: string): Promise<void> {
    const apiUrl = `/transits/${encodeURIComponent(poleCode)}`;

    try {
        await ctx.sendChatAction('typing');
        const response = await fetchData<TransitsResponse>(apiUrl);
        if (!response?.transits?.length) {
            await ctx.reply(`${Emoji.SEARCH} Transito non più disponibile.`);
            return;
        }

        const sorted = sortTransitsByDisplayTime(response.transits);
        const transit = resolveTransitByCallbackKey(sorted, transitKey);
        const vehicleCode = transit?.automezzo?.codice;
        if (!transit || !vehicleCode) {
            await ctx.reply(`${Emoji.SEARCH} Posizione veicolo non disponibile per questo transito.`);
            return;
        }

        await getVehicleRealTimePositions(ctx, vehicleCode, buildVehiclePositionContext(transit, poleCode, transitKey));
    } catch (error) {
        logger.error('Errore posizione veicolo da transito', error, { poleCode, transitKey });
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero della posizione.`);
    }
}

function buildVehiclePositionContext(transit: Transit, poleCode: string, transitKey: string): VehiclePositionContext {
    const partenza = transit.partenzaCorsa || 'N/D';
    const arrivo = transit.arrivoCorsa || 'N/D';
    const status = getTransitTrackingStatus(transit);
    const delayLabel = status === 'realtime' && transit.ritardo && transit.ritardo !== '00:00'
        ? formatTransitDelayLabel(transit.ritardo)
        : undefined;

    return {
        route: `${partenza} → ${arrivo}`,
        transitTime: getTransitDisplayTime(transit) || undefined,
        arrivalTime: transit.orarioArrivoCorsa || undefined,
        delayLabel,
        trackingLabel: status === 'realtime'
            ? 'real-time Cotral'
            : status === 'monitored_offline'
                ? 'tracciata, bus non in trasmissione'
                : 'schedulata, no real-time',
        refreshCallbackData: `vehicles:fromTransit:${poleCode}:${transitKey}`,
    };
}

export async function showTransitDetail(ctx: Context, poleCode: string, index: number): Promise<void> {
    await showTransitDetailByKey(ctx, poleCode, String(index));
}

export async function showTransitDetailByKey(ctx: Context, poleCode: string, transitKey: string): Promise<void> {
    const apiUrl = `/transits/${encodeURIComponent(poleCode)}`;

    try {
        await ctx.sendChatAction('typing');
        const response = await fetchData<TransitsResponse>(apiUrl);
        if (!response?.transits?.length) {
            await ctx.reply(`${Emoji.SEARCH} Transito non più disponibile.`);
            return;
        }

        const sorted = sortTransitsByDisplayTime(response.transits);
        const nextIdx = findNextTransitIndex(sorted);
        const transit = resolveTransitByCallbackKey(sorted, transitKey);
        if (!transit) {
            await ctx.reply(`${Emoji.SEARCH} Transito non trovato. Potrebbe essere cambiato.`);
            return;
        }

        const transitIndex = sorted.indexOf(transit);
        const isNext = transitIndex === nextIdx;
        const message = formatTransitMessage(transit, isNext);

        const keyboard: { text: string; callback_data: string }[][] = [];
        if (transit.automezzo?.codice) {
            keyboard.push([{
                text: `${Emoji.GEAR} Posizione veicolo`,
                callback_data: buildVehiclePositionFromTransitCallbackData(poleCode, transit, transitIndex)
            }]);
        }
        keyboard.push([
            { text: `${Emoji.BACK} Torna alla lista`, callback_data: `transits:getTransits:${poleCode}` },
            { text: `\u{1F504} Aggiorna`, callback_data: buildTransitDetailCallbackData(poleCode, transit, transitIndex) },
        ]);

        await ctx.reply(message, {
            reply_markup: { inline_keyboard: keyboard },
            link_preview_options: { is_disabled: true },
        });
    } catch (error) {
        logger.error('Errore dettaglio transito', error, { poleCode, transitKey });
        await ctx.reply(`${Emoji.WARNING} Errore nel recupero dei dettagli.`);
    }
}

function formatTransitMessage(transit: Transit, isNext: boolean): string {
    const dv = (val: string | null | undefined): string => val || 'N/D';
    const partenza = dv(transit.partenzaCorsa);
    const arrivo = dv(transit.arrivoCorsa);

    const lines: string[] = [];

    if (isNext) {
        lines.push(`\u{1F4A8} <b>PROSSIMO TRANSITO ALLA PALINA</b>`);
    }

    lines.push(`${Emoji.BUS} ${bold(`${partenza} \u2192 ${arrivo}`)}`);

    const orarioTransito = getTransitDisplayTime(transit);
    const orarioA = transit.orarioArrivoCorsa;
    if (orarioTransito || orarioA) {
        const transito = orarioTransito ? escapeHtml(orarioTransito) : 'N/D';
        const arri = orarioA ? escapeHtml(orarioA) : 'N/D';
        const rel = orarioTransito ? ` ${relativeTime(orarioTransito)}` : '';
        lines.push(`${Emoji.CLOCK} Transito palina: ${transito}${rel} | Arrivo: ${arri}`);
    }

    if (transit.orarioPartenzaCorsa && transit.orarioPartenzaCorsa !== orarioTransito) {
        lines.push(`${Emoji.CLOCK} Partenza corsa: ${escapeHtml(transit.orarioPartenzaCorsa)}`);
    }

    const status = getTransitTrackingStatus(transit);
    if (status === 'realtime') {
        if (transit.ritardo && transit.ritardo !== '00:00') {
            const label = formatTransitDelayLabel(transit.ritardo);
            lines.push(`${Emoji.GREEN} <b>Real-time</b> \u00b7 ${Emoji.DELAY} <b>${escapeHtml(label)}</b>`);
        } else {
            lines.push(`${Emoji.GREEN} <b>Real-time \u00b7 puntuale</b>`);
        }
    } else if (status === 'monitored_offline') {
        lines.push(`\u{1F7E1} <b>Tracciata</b> <i>(bus non in trasmissione)</i>`);
    } else {
        lines.push(`\u26aa <b>Schedulata</b> <i>(orario teorico, no real-time)</i>`);
    }

    if (transit.instradamento) {
        lines.push(`${Emoji.ROUTE} ${escapeHtml(transit.instradamento)}`);
    }

    if (transit.automezzo?.codice) {
        const trackingText = transit.automezzo.isAlive ? `${Emoji.GREEN} In tempo reale` : `${Emoji.CLOCK} Ultima posizione nota`;
        lines.push(`${Emoji.GEAR} Mezzo: ${escapeHtml(transit.automezzo.codice)} \u2014 ${trackingText}`);
    }

    lines.push(divider());
    return lines.join('\n');
}
