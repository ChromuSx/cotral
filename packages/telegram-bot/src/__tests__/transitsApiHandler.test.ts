import { describe, expect, it } from 'vitest';
import { Transit } from '@cotral/shared';
import { getTransitDisplayTime, sortTransitsByDisplayTime } from '../apiHandlers/transitsApiHandler';

function transit(overrides: Partial<Transit>): Transit {
    return {
        idCorsa: '1',
        percorso: 'SO483D',
        partenzaCorsa: 'Roma Anagnina',
        orarioPartenzaCorsa: '08:00',
        arrivoCorsa: 'Sora',
        orarioArrivoCorsa: '10:10',
        soppressa: '0',
        numeroOrdine: '1',
        tempoTransito: '09:37',
        ritardo: '00:00',
        passato: '0',
        automezzo: { codice: null, isAlive: false },
        testoFermata: '-',
        dataModifica: '',
        instradamento: '',
        banchina: '',
        monitorata: '0',
        accessibile: '0',
        ...overrides,
    };
}

describe('transit display time', () => {
    it('uses the pole transit time instead of the route departure time', () => {
        const result = getTransitDisplayTime(transit({
            orarioPartenzaCorsa: '08:00',
            tempoTransito: '09:37',
        }));

        expect(result).toBe('09:37');
    });

    it('sorts the transit list by pole transit time', () => {
        const earlyAtOriginLateAtPole = transit({
            idCorsa: 'early-origin',
            orarioPartenzaCorsa: '08:00',
            tempoTransito: '10:37',
        });
        const laterAtOriginEarlyAtPole = transit({
            idCorsa: 'late-origin',
            orarioPartenzaCorsa: '09:00',
            tempoTransito: '09:37',
        });

        const sorted = sortTransitsByDisplayTime([
            earlyAtOriginLateAtPole,
            laterAtOriginEarlyAtPole,
        ]);

        expect(sorted.map(t => t.idCorsa)).toEqual(['late-origin', 'early-origin']);
    });
});
