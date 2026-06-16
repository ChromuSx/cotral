import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGet } = vi.hoisted(() => ({
    apiGet: vi.fn(),
}));

vi.mock('../services/axiosService', () => ({
    api: {
        get: apiGet,
    },
}));

vi.mock('../apiHandlers/errorHandler', () => ({
    handleApiError: vi.fn(),
}));

import { getFirstStopByLocality, getStopsByLocality } from '../apiHandlers/stopsApiHandler';
import { getVehiclePositions } from '../apiHandlers/vehiclesApiHandler';

function interaction() {
    return {
        editReply: vi.fn(),
    } as any;
}

describe('Discord API endpoint mappings', () => {
    beforeEach(() => {
        apiGet.mockReset();
    });

    it('uses the server stops-by-locality endpoint exposed by the API', async () => {
        apiGet.mockResolvedValueOnce({ data: [] });

        await getStopsByLocality(interaction(), 'Veroli Scalo');

        expect(apiGet).toHaveBeenCalledWith('/stops/Veroli%20Scalo');
    });

    it('uses the server first-stop endpoint exposed by the API', async () => {
        apiGet.mockResolvedValueOnce({ data: null });

        await getFirstStopByLocality(interaction(), 'Veroli Scalo');

        expect(apiGet).toHaveBeenCalledWith('/stops/firststop/Veroli%20Scalo');
    });

    it('uses the server realtime vehicle position endpoint exposed by the API', async () => {
        apiGet.mockResolvedValueOnce({ data: { coordX: [], coordY: [] } });

        await getVehiclePositions(interaction(), '4150');

        expect(apiGet).toHaveBeenCalledWith('/vehiclerealtimepositions/4150');
    });
});
