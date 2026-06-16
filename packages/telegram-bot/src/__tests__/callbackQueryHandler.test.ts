import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../apiHandlers/transitsApiHandler', () => ({
    getTransitsByPoleCode: vi.fn(),
    refreshTransitsByPoleCode: vi.fn(),
    showTransitDetail: vi.fn(),
    showTransitDetailByKey: vi.fn(),
    showVehiclePositionForTransit: vi.fn(),
    showVehiclePositionForTransitByKey: vi.fn(),
    isValidTransitCallbackKey: (key: string | undefined) => {
        if (typeof key !== 'string') return false;
        return /^\d+$/.test(key) || /^id:.+/.test(key);
    },
}));

vi.mock('../apiHandlers/polesApiHandler', () => ({
    addFavoritePole: vi.fn(),
    removeFavoritePole: vi.fn(),
    displaySinglePoleDetails: vi.fn(),
    getPoleByArrivalAndDestinationLocality: vi.fn(),
}));

vi.mock('../apiHandlers/vehiclesApiHandler', () => ({
    getVehicleRealTimePositions: vi.fn(),
}));

vi.mock('../commands/polesCommands', () => ({
    PolesCommands: { GetFavoritePoles: 'getFavoritePoles' },
    handleGetFavoritePoles: vi.fn(),
}));

vi.mock('../bot/actions/transitsBotActions', () => ({
    transitsMenu: { reply_markup: { inline_keyboard: [] } },
}));

vi.mock('../utils/logger', () => ({
    logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import * as transitsApiHandler from '../apiHandlers/transitsApiHandler';
import { handleCallbackQuery } from '../bot/handlers/callbackQueryHandler';

describe('Telegram callback query handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function ctxWithData(data: string): any {
        return {
            callbackQuery: { data },
            from: { id: 123 },
            session: {},
            answerCbQuery: vi.fn().mockResolvedValue(undefined),
            reply: vi.fn().mockResolvedValue(undefined),
            sendLocation: vi.fn().mockResolvedValue(undefined),
        };
    }

    it('routes transit detail callbacks by stable idCorsa key', async () => {
        const ctx = ctxWithData('td:58700:id:corsa-42');

        await handleCallbackQuery(ctx);

        expect(transitsApiHandler.showTransitDetailByKey).toHaveBeenCalledWith(ctx, '58700', 'id:corsa-42');
        expect(transitsApiHandler.showTransitDetail).not.toHaveBeenCalled();
    });

    it('routes vehicle position callbacks by stable idCorsa key', async () => {
        const ctx = ctxWithData('vehicles:fromTransit:58700:id:corsa-42');

        await handleCallbackQuery(ctx);

        expect(transitsApiHandler.showVehiclePositionForTransitByKey).toHaveBeenCalledWith(ctx, '58700', 'id:corsa-42');
        expect(transitsApiHandler.showVehiclePositionForTransit).not.toHaveBeenCalled();
    });

    it('shows a clean alert instead of throwing when a callback handler fails', async () => {
        vi.mocked(transitsApiHandler.getTransitsByPoleCode).mockRejectedValue(new Error('upstream down'));
        const ctx = ctxWithData('transits:getTransits:58700');

        await expect(handleCallbackQuery(ctx)).resolves.toBeUndefined();

        expect(ctx.answerCbQuery).toHaveBeenCalledWith('⚠️ Operazione non riuscita. Riprova.', { show_alert: true });
    });

    it('warns the user when callback data is incomplete or malformed', async () => {
        const ctx = ctxWithData('td:58700:id');

        await handleCallbackQuery(ctx);

        expect(ctx.answerCbQuery).toHaveBeenCalledWith('⚠️ Azione non più valida. Riprova dal menu.', { show_alert: true });
    });
});
