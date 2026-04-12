import { EmbedBuilder } from 'discord.js';

export const Emoji = {
    BUS: '🚌',
    BUSSTOP: '🚏',
    PIN: '📍',
    STAR: '⭐',
    CLOCK: '🕐',
    ROUTE: '🛣️',
    CHECK: '✅',
    CROSS: '❌',
    WARNING: '⚠️',
    SEARCH: '🔍',
    MAP: '🗺️',
    BACK: '🔙',
    WAVE: '👋',
    GEAR: '⚙️',
    DELAY: '🚨',
    GREEN: '🟢',
    RED: '🔴',
    POINT: '▪️',
    COMPASS: '🧭',
    REFRESH: '🔄',
    NEXT: '💨',
};

export const Color = {
    PRIMARY: 0x3498db,
    SUCCESS: 0x2ecc71,
    WARNING: 0xf39c12,
    ERROR: 0xe74c3c,
    NEXT: 0xf1c40f,
};

export function mapsUrl(lat: number | string, lon: number | string): string {
    return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function mapsLink(lat: number | string, lon: number | string, label?: string): string {
    const url = mapsUrl(lat, lon);
    return `[${label ?? '📍 Apri in Google Maps'}](${url})`;
}

export function divider(): string {
    return '────────────────────';
}

export function parseTime(timeStr: string): Date | null {
    const parts = timeStr?.split(':');
    if (!parts || parts.length < 2) return null;
    const now = new Date();
    now.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
    return now;
}

export function relativeTime(timeStr: string): string {
    const target = parseTime(timeStr);
    if (!target) return '';
    const diffMs = target.getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 0) return '*(passato)*';
    if (diffMin === 0) return '*(in arrivo)*';
    if (diffMin === 1) return '*(tra 1 min)*';
    if (diffMin <= 60) return `*(tra ${diffMin} min)*`;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `*(tra ${h}h ${m}min)*`;
}

export function nowTimestamp(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function greetingByTime(): string {
    const h = new Date().getHours();
    if (h < 13) return 'Buongiorno';
    if (h < 18) return 'Buon pomeriggio';
    return 'Buonasera';
}

export function errorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Color.ERROR)
        .setDescription(`${Emoji.WARNING} ${message}`);
}

export function isValidCoord(lat: unknown, lon: unknown): boolean {
    const la = Number(lat);
    const lo = Number(lon);
    return !isNaN(la) && !isNaN(lo) && la !== 0 && lo !== 0;
}

export function resultCountHeader(count: number, label: string): string {
    return `${Emoji.CHECK} **${count} ${label} trovat${count === 1 ? 'o' : 'i'}**`;
}
