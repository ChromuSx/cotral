import axios from 'axios';
import { config } from '../config';

export interface CotralAppLocality {
    id: string;
    name: string;
}

export interface CotralAppPoleSearchResult {
    codicePalina: string;
    nomePalina: string;
    coordX: number;
    coordY: number;
    localita: string;
    comune: string;
    preferita: boolean;
}

export interface CotralAppBusFill {
    automezzo: string;
    livello: string | null;
    dataEvento: string | null;
}

interface CotralAppEnvelope<T = unknown> {
    success?: boolean;
    payload?: T;
    error?: unknown;
}

export async function fetchCotralAppJson<T = unknown>(
    endpoint: string,
    params: Record<string, unknown>
): Promise<T> {
    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    const response = await axios.get<CotralAppEnvelope<T>>(`${config.cotralApp.baseURL}/${normalizedEndpoint}`, {
        params,
        timeout: 15000,
        headers: {
            Accept: 'application/json',
            'User-Agent': 'cotral-bot/1.0',
        },
    });

    const envelope = response.data;
    if (envelope?.success === false) {
        throw new Error(`Cotral app API error: ${JSON.stringify(envelope.error ?? 'unknown')}`);
    }

    return envelope?.payload as T;
}

export function mapPlaceAutocomplete(payload: any): CotralAppLocality[] {
    const places = Array.isArray(payload?.loc) ? payload.loc : [];
    return places
        .map((place: Record<string, unknown>) => ({
            id: String(place.id ?? '').trim(),
            name: String(place.nome ?? '').trim(),
        }))
        .filter((place: CotralAppLocality) => place.id && place.name);
}

export function mapStopSearch(payload: any): CotralAppPoleSearchResult[] {
    const poles = Array.isArray(payload?.palina) ? payload.palina : [];
    return poles
        .map((pole: Record<string, unknown>) => ({
            codicePalina: String(pole.codicePalina ?? '').trim(),
            nomePalina: String(pole.nomePalina ?? '').trim(),
            coordX: parseFloat(String(pole.coordX ?? '')),
            coordY: parseFloat(String(pole.coordY ?? '')),
            localita: String(pole.localita ?? '').trim(),
            comune: String(pole.comune ?? '').trim(),
            preferita: String(pole.preferita ?? '0') === '1',
        }))
        .filter((pole: CotralAppPoleSearchResult) => pole.codicePalina && Number.isFinite(pole.coordX) && Number.isFinite(pole.coordY));
}

export function mapBusFill(payload: any): CotralAppBusFill {
    return {
        automezzo: String(payload?.automezzo ?? '').trim(),
        livello: normalizeNullableString(payload?.livello),
        dataEvento: normalizeNullableString(payload?.dataEvento),
    };
}

function normalizeNullableString(value: unknown): string | null {
    const text = String(value ?? '').trim();
    return text && text !== '-' ? text : null;
}
