import { describe, expect, it } from 'vitest';
import { Transit } from '@cotral/shared';
import {
    buildTransitDetailCallbackData,
    buildVehiclePositionFromTransitCallbackData,
    getTransitDisplayTime,
    resolveTransitByCallbackKey,
    sortTransitsByDisplayTime,
} from '../apiHandlers/transitsApiHandler';

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

describe('stable transit callback keys', () => {
    it('builds detail and vehicle-position callback data using idCorsa instead of the list index', () => {
        const selected = transit({ idCorsa: 'corsa-42' });

        expect(buildTransitDetailCallbackData('58700', selected, 3)).toBe('td:58700:id:corsa-42');
        expect(buildVehiclePositionFromTransitCallbackData('58700', selected, 3)).toBe('vehicles:fromTransit:58700:id:corsa-42');
    });

    it('resolves a selected transit by idCorsa even if the refreshed list order changed', () => {
        const oldFirst = transit({ idCorsa: 'old-first', tempoTransito: '09:10' });
        const selected = transit({ idCorsa: 'selected', tempoTransito: '09:20' });
        const oldThird = transit({ idCorsa: 'old-third', tempoTransito: '09:30' });

        const refreshedDifferentOrder = [oldThird, oldFirst, selected];

        expect(resolveTransitByCallbackKey(refreshedDifferentOrder, 'id:selected')).toBe(selected);
    });

    it('keeps legacy index callback keys working as fallback', () => {
        const first = transit({ idCorsa: 'first' });
        const second = transit({ idCorsa: 'second' });

        expect(resolveTransitByCallbackKey([first, second], '1')).toBe(second);
    });
});
