import axios from 'axios';
import fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CotralAppController } from '../controllers/cotralAppController';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

async function buildTestApp() {
    const app = fastify({ logger: false });
    new CotralAppController(app);
    await app.ready();
    return app;
}

describe('Cotral app public API routes', () => {
    beforeEach(() => {
        mockedAxios.get.mockReset();
    });

    it('returns modern app place autocomplete results', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, payload: { loc: [{ id: '998008303', nome: 'Roma Anagnina' }] }, error: null },
        });

        const app = await buildTestApp();
        const response = await app.inject('/app/localities/autocomplete?input=anagnina');
        await app.close();

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([{ id: '998008303', name: 'Roma Anagnina' }]);
    });

    it('validates modern app stop search input', async () => {
        const app = await buildTestApp();
        const response = await app.inject('/app/stops/search?input=');
        await app.close();

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: 'Il parametro "input" è obbligatorio' });
        expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('returns modern app stop search results', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                success: true,
                payload: {
                    palina: [{
                        codicePalina: 'f3583',
                        nomePalina: 'ROMA | Anagnina (Metro A)',
                        coordX: '41.8432898070992',
                        coordY: '12.5855531083302',
                        localita: 'Roma Anagnina',
                        comune: 'Roma',
                        preferita: '0',
                    }],
                },
                error: null,
            },
        });

        const app = await buildTestApp();
        const response = await app.inject('/app/stops/search?input=anagnina');
        await app.close();

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([
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

    it('returns modern app bus fill by vehicle id', async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: { success: true, payload: { automezzo: '4225', livello: '-', dataEvento: '-' }, error: null },
        });

        const app = await buildTestApp();
        const response = await app.inject('/app/vehicles/4225/busfill');
        await app.close();

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ automezzo: '4225', livello: null, dataEvento: null });
    });
});
