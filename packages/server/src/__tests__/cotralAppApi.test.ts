import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    fetchCotralAppJson,
    mapBusFill,
    mapPlaceAutocomplete,
    mapStopSearch,
} from '../utils/cotralAppApi';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('cotral app API utilities', () => {
    beforeEach(() => {
        mockedAxios.get.mockReset();
    });

    it('fetches JSON from the modern public Cotral app API base URL', async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { success: true, payload: { ok: true }, error: null } });

        await expect(fetchCotralAppJson('mw-travelCotralBE/v1/live/busfill', { id: '4225' })).resolves.toEqual({ ok: true });

        expect(mockedAxios.get).toHaveBeenCalledWith(
            'https://servizi.cotralspa.it:4444/mw-travelCotralBE/v1/live/busfill',
            expect.objectContaining({
                params: { id: '4225' },
                timeout: 15000,
                headers: expect.objectContaining({ Accept: 'application/json' }),
            })
        );
    });

    it('maps place autocomplete payloads to compact localities', () => {
        expect(mapPlaceAutocomplete({ estratte: '1', loc: [{ id: '998008303', nome: 'Roma Anagnina' }] })).toEqual([
            { id: '998008303', name: 'Roma Anagnina' },
        ]);
    });

    it('maps stop search payloads to stable pole search results', () => {
        expect(mapStopSearch({
            estratte: '1',
            palina: [{
                codicePalina: 'f3583',
                nomePalina: 'ROMA | Anagnina (Metro A)',
                coordX: '41.8432898070992',
                coordY: '12.5855531083302',
                localita: 'Roma Anagnina',
                comune: 'Roma',
                preferita: '0',
            }],
        })).toEqual([
            {
                codicePalina: 'f3583',
                nomePalina: 'ROMA | Anagnina (Metro A)',
                coordX: 41.8432898070992,
                coordY: 12.5855531083302,
                localita: 'Roma Anagnina',
                comune: 'Roma',
                preferita: false,
            },
        ]);
    });

    it('maps bus fill payloads without inventing unavailable crowding data', () => {
        expect(mapBusFill({ livello: '-', dataEvento: '-', automezzo: '4225' })).toEqual({
            automezzo: '4225',
            livello: null,
            dataEvento: null,
        });

        expect(mapBusFill({ livello: '2', dataEvento: '2026-06-17T09:00:00', automezzo: '4225' })).toEqual({
            automezzo: '4225',
            livello: '2',
            dataEvento: '2026-06-17T09:00:00',
        });
    });
});
