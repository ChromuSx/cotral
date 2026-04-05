export function convertToReadableTime(seconds: string | number | undefined): string {
    const num = typeof seconds === 'string' ? parseInt(seconds, 10) : (seconds ?? 0);
    if (isNaN(num)) return '00:00';
    const sign = num < 0 ? '-' : '';
    const abs = Math.abs(num);
    const hours = Math.floor(abs / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
