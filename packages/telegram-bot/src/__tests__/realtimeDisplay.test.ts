import { describe, expect, it } from 'vitest';
import { formatTransitDelayLabel } from '../apiHandlers/transitsApiHandler';
import { formatVehiclePositionMessage, normalizeVehiclePositionResponse } from '../apiHandlers/vehiclesApiHandler';

describe('real-time display wording', () => {
    it('labels negative Cotral delay as an external estimate, not as a confirmed fact', () => {
        expect(formatTransitDelayLabel('-00:08')).toBe('Stima Cotral: anticipo 00:08');
    });

    it('labels positive Cotral delay as an external estimate, not as a confirmed fact', () => {
        expect(formatTransitDelayLabel('00:05')).toBe('Stima Cotral: ritardo 00:05');
    });
});

describe('vehicle position response normalization', () => {
    it('uses the first vehicle position when the server returns the Cotral positions array', () => {
        const normalized = normalizeVehiclePositionResponse([
            { coordX: ['41.1'], coordY: ['13.2'], time: '09:42' },
        ]);

        expect(normalized).toEqual({ coordX: ['41.1'], coordY: ['13.2'], time: '09:42' });
    });

    it('keeps the legacy single-object response shape working', () => {
        const normalized = normalizeVehiclePositionResponse({ coordX: ['41.1'], coordY: ['13.2'], time: '09:42' });

        expect(normalized).toEqual({ coordX: ['41.1'], coordY: ['13.2'], time: '09:42' });
    });

    it('formats vehicle position without a wrapping divider line', () => {
        const message = formatVehiclePositionMessage('4150', { coordX: ['41.69878'], coordY: ['13.58221'], time: '10:30:41' });

        expect(message).toContain('Veicolo 4150');
        expect(message).toContain('Posizione aggiornata:</b> 10:30:41');
        expect(message).toContain('Coordinate:</b> 41.69878, 13.58221');
        expect(message).toContain('https://www.google.com/maps?q=41.69878,13.58221');
        expect(message).not.toContain('────────');
    });

    it('adds transit context when the vehicle position comes from a selected ride', () => {
        const message = formatVehiclePositionMessage(
            '4150',
            { coordX: ['41.69878'], coordY: ['13.58221'], time: '10:30:41' },
            {
                route: 'SORA → CASSINO',
                transitTime: '10:42',
                arrivalTime: '11:15',
                trackingLabel: 'real-time Cotral',
                delayLabel: 'Stima Cotral: ritardo 00:05',
            }
        );

        expect(message).toContain('Corsa:</b> SORA → CASSINO');
        expect(message).toContain('Orari corsa:</b> transito 10:42 · arrivo 11:15');
        expect(message).toContain('Stato:</b> real-time Cotral');
        expect(message).toContain('Stima Cotral: ritardo 00:05');
    });
});
