import { describe, expect, it } from 'vitest';
import { Transit } from '@cotral/shared';
import {
    buildTransitDetailCallbackData,
    buildTransitSelectionList,
    buildVehiclePositionFromTransitCallbackData,
    compactTransitDestination,
    formatTransitButtonLabel,
    formatTransitSelectionLine,
    getTransitDisplayTime,
    mergeRecentlySeenRealtimeTransits,
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

describe('transit selection button labels', () => {
    it('compacts Cotral stop names so Telegram buttons are readable', () => {
        expect(compactTransitDestination('SORA | Stazione FS (f5890)')).toBe('SORA Staz. FS');
        expect(compactTransitDestination('ROMA | Anagnina (Metro A) (f3583)')).toBe('ROMA Anagnina');
        expect(compactTransitDestination('FROSINONE | Via Monti Lepini Via Calvosa (f5827)')).toBe('FROSINONE');
    });

    it('keeps inline buttons numeric/short and moves details into message text', () => {
        const sample = transit({
            arrivoCorsa: 'SORA | Stazione FS (f5890)',
            tempoTransito: '18:02',
            monitorata: '1',
            automezzo: { codice: '1234', isAlive: true },
        });
        const label = formatTransitButtonLabel(sample, true);
        const line = formatTransitSelectionLine(sample, 0, true);

        expect(label).toBe('💨 18:02');
        expect(label).not.toContain('(tra');
        expect(label).not.toContain('(f5890)');
        expect(label.length).toBeLessThanOrEqual(10);
        expect(line).toContain('1. 💨 <b>18:02</b>');
        expect(line).toContain('da Roma Anagnina (part. 08:00) → SORA | Stazione FS');
        expect(line).toContain('Real-time');
        expect(line).toContain('mezzo 1234');
    });
});

describe('transit selection summary', () => {
    it('includes the selected pole code in the header to disambiguate same-name paline', () => {
        const msg = buildTransitSelectionList([
            transit({ idCorsa: 'casamari-roma', arrivoCorsa: 'ROMA | Anagnina (Metro A) (f3583)' }),
        ], 0, 'VEROLI, Abbazia di Casamari', 'f5915');

        expect(msg.text).toContain('Transiti per: VEROLI, Abbazia di Casamari · codice f5915');
    });

    it('keeps the default screen compact and adds a button for hidden scheduled rides', () => {
        const realtime = transit({
            idCorsa: 'rt',
            tempoTransito: '14:02',
            monitorata: '1',
            automezzo: { codice: '0149', isAlive: true },
            arrivoCorsa: 'SORA | Stazione FS',
        });
        const scheduled = Array.from({ length: 8 }, (_, i) => transit({
            idCorsa: `sched-${i}`,
            tempoTransito: `15:${String(i).padStart(2, '0')}`,
            monitorata: '0',
            automezzo: { codice: null, isAlive: false },
            arrivoCorsa: `Destinazione ${i}`,
        }));

        const msg = buildTransitSelectionList([realtime, ...scheduled], 0, 'FROSINONE', '58700');

        expect(msg.text).toContain('Mostro 4 transiti principali');
        expect(msg.text).toContain('5 schedulate nascoste');
        expect(msg.text).toContain('1. 💨 <b>14:02</b>');
        expect(msg.text).toContain('4. <b>15:02</b>');
        expect(msg.text).not.toContain('5. <b>15:03</b>');
        expect(msg.keyboard.flat()).toContainEqual({ text: '🕒 Vedi schedulate (8)', callback_data: 'transits:showAll:58700' });
    });

    it('can render the expanded scheduled view and a compact toggle', () => {
        const scheduled = Array.from({ length: 6 }, (_, i) => transit({
            idCorsa: `sched-${i}`,
            tempoTransito: `15:${String(i).padStart(2, '0')}`,
            monitorata: '0',
            automezzo: { codice: null, isAlive: false },
            arrivoCorsa: `Destinazione ${i}`,
        }));

        const msg = buildTransitSelectionList(scheduled, 0, 'FROSINONE', '58700', 'all');

        expect(msg.text).toContain('6 corse schedulate');
        expect(msg.text).toContain('6. <b>15:05</b>');
        expect(msg.keyboard.flat()).toContainEqual({ text: '🔍 Mostra solo principali', callback_data: 'transits:compact:58700' });
    });
});

describe('stable transit callback keys', () => {
    it('keeps a recently seen realtime transit when Cotral drops it from the refreshed live list', () => {
        const disappeared = transit({
            idCorsa: '11555106',
            tempoTransito: '18:02',
            ritardo: '00:33',
            monitorata: '1',
            automezzo: { codice: '0118', isAlive: true },
        });
        const current = transit({
            idCorsa: '10146974',
            tempoTransito: '19:02',
            monitorata: '1',
            automezzo: { codice: '0122', isAlive: true },
        });

        const merged = mergeRecentlySeenRealtimeTransits([current], [disappeared]);

        expect(merged.map(t => t.idCorsa)).toEqual(['10146974', '11555106']);
        expect(formatTransitSelectionLine(merged[1], 1, false)).toContain('Ultimo dato live Cotral');
    });

    it('builds detail and vehicle-position callback data using idCorsa instead of the list index', () => {
        const selected = transit({ idCorsa: 'corsa-42' });

        expect(buildTransitDetailCallbackData('58700', selected, 3)).toBe('td:58700:id:corsa-42');
        expect(buildVehiclePositionFromTransitCallbackData('58700', selected, 3)).toBe('vehicles:fromTransit:58700:id:corsa-42');

        const selectedWithVehicle = transit({ idCorsa: 'corsa-43', automezzo: { codice: '0118', isAlive: true } });
        expect(buildVehiclePositionFromTransitCallbackData('58700', selectedWithVehicle, 4)).toBe('vehicles:fromTransit:58700:id:corsa-43:vehicle:0118');
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
