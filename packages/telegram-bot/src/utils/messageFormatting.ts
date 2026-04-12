export const Emoji = {
    BUS: '\u{1F68C}',
    BUSSTOP: '\u{1F68F}',
    PIN: '\u{1F4CD}',
    STAR: '\u2B50',
    CLOCK: '\u{1F552}',
    ROUTE: '\u{1F6E4}\uFE0F',
    CHECK: '\u2705',
    CROSS: '\u274C',
    WARNING: '\u26A0\uFE0F',
    SEARCH: '\u{1F50D}',
    MAP: '\u{1F5FA}\uFE0F',
    BACK: '\u{1F519}',
    WAVE: '\u{1F44B}',
    GEAR: '\u2699\uFE0F',
    DELAY: '\u{1F6A8}',
    GREEN: '\u{1F7E2}',
    RED: '\u{1F534}',
    POINT: '\u25AA\uFE0F',
    COMPASS: '\u{1F9ED}',
} as const;

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function bold(text: string): string {
    return `<b>${escapeHtml(text)}</b>`;
}

export function italic(text: string): string {
    return `<i>${escapeHtml(text)}</i>`;
}

export function code(text: string): string {
    return `<code>${escapeHtml(text)}</code>`;
}

export function section(emoji: string, title: string, value: string): string {
    return `${emoji} <b>${escapeHtml(title)}:</b> ${escapeHtml(value)}`;
}

export function divider(): string {
    return '\u2500'.repeat(20);
}

export function mapsLink(lat: number, lon: number, label?: string): string {
    const text = label || 'Apri in Google Maps';
    return `<a href="https://www.google.com/maps?q=${lat},${lon}">${escapeHtml(text)}</a>`;
}

export function parseTime(timeStr: string): Date | null {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(match[1]), parseInt(match[2]));
    return date;
}

export function relativeTime(timeStr: string): string {
    const target = parseTime(timeStr);
    if (!target) return '';
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < -5) return '<i>(passato)</i>';
    if (diffMin <= 0) return '<b>(in arrivo)</b>';
    if (diffMin === 1) return '<b>(tra 1 min)</b>';
    if (diffMin <= 60) return `<b>(tra ${diffMin} min)</b>`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return m > 0 ? `(tra ${h}h ${m}min)` : `(tra ${h}h)`;
}

export function nowTimestamp(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function greetingByTime(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 13) return 'Buongiorno';
    if (hour >= 13 && hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
}

export function resultCountHeader(count: number, label: string): string {
    if (count === 1) return `${Emoji.CHECK} <b>1 ${label} trovato</b>`;
    return `${Emoji.CHECK} <b>${count} ${label} trovati</b>`;
}
