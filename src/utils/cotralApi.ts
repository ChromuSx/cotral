import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { config } from '../config';

export async function fetchCotralXml(
    endpoint: string,
    params: Record<string, unknown>
): Promise<Record<string, any>> {
    const response = await axios.get(`${config.cotral.baseURL}/${endpoint}`, { params, timeout: 15000 });
    return parseStringPromise(response.data);
}

export function extractArray(parsed: Record<string, any>, ...path: string[]): any[] {
    let current: any = parsed;
    for (const key of path) {
        current = current?.[key];
    }
    return Array.isArray(current) ? current : [];
}

// Cotral API cmd=1 has lat/lon swapped for many poles.
// In Lazio: latitude ~41-43, longitude ~11-14.
// If lat < 20, it's actually longitude (swapped).
export function normalizeLatLon(lat: number, lon: number): { lat: number; lon: number } {
    if (lat > 0 && lat < 20 && lon > 20) {
        return { lat: lon, lon: lat };
    }
    return { lat, lon };
}
