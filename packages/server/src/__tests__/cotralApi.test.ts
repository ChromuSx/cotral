import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { fetchCotralXml, normalizeLatLon, parseCotralXmlResponse } from '../utils/cotralApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('cotralApi utilities', () => {
    it('normalizes Lazio coordinates when upstream swaps lat/lon', () => {
        expect(normalizeLatLon(13.2687, 41.5502)).toEqual({ lat: 41.5502, lon: 13.2687 });
        expect(normalizeLatLon(41.5502, 13.2687)).toEqual({ lat: 41.5502, lon: 13.2687 });
    });

    it('treats Cotral closing-tag-only responses as no data instead of throwing a parser error', async () => {
        await expect(parseCotralXmlResponse('\r\n\r\n </transiti>')).resolves.toEqual({});
    });

    it('uses the same no-data handling when fetching Cotral XML', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: '\r\n\r\n </transiti>' });

        await expect(fetchCotralXml('PIV.do', { cmd: 1, pCodice: 'f0000' })).resolves.toEqual({});
    });
});
