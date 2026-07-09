import { describe, expect, it } from 'vitest';
import { Pole, Stop } from '@cotral/shared';
import { formatPoleSelectionLine, selectPoleByCode } from '../apiHandlers/polesApiHandler';
import { formatStopSelectionLine } from '../apiHandlers/stopsApiHandler';
import { formatSelectionList } from '../utils/messageFormatting';

describe('selection list formatting', () => {
    it('moves pole details into text lines instead of long inline button labels', () => {
        const line = formatPoleSelectionLine({
            codicePalina: '58700',
            nomePalina: 'SORA | Stazione FS',
            localita: 'SORA',
            comune: 'Sora',
            distanza: '350 m',
            destinazioni: ['ROMA | Anagnina', 'FROSINONE'],
        } as unknown as Pole, 0);

        expect(line).toContain('1.');
        expect(line).toContain('<b>SORA | Stazione FS</b>');
        expect(line).toContain('codice 58700');
        expect(line).toContain('350 m');
        expect(line).toContain('ROMA | Anagnina');
    });

    it('moves stop details into text lines instead of long inline button labels', () => {
        const line = formatStopSelectionLine({
            codiceStop: 'f5890',
            nomeStop: 'SORA | Stazione FS',
            localita: 'SORA',
        } as unknown as Stop, 1);

        expect(line).toContain('2.');
        expect(line).toContain('<b>SORA | Stazione FS</b>');
        expect(line).toContain('codice f5890');
        expect(line).toContain('SORA');
    });

    it('separates numbered options with a blank line for readability', () => {
        const list = formatSelectionList([
            '1. <b>Prima opzione</b>\n   Dettaglio A',
            '2. <b>Seconda opzione</b>\n   Dettaglio B',
            '3. <b>Terza opzione</b>',
        ]);

        expect(list).toBe([
            '1. <b>Prima opzione</b>\n   Dettaglio A',
            '2. <b>Seconda opzione</b>\n   Dettaglio B',
            '3. <b>Terza opzione</b>',
        ].join('\n\n'));
    });

    it('selects the exact pole code when a stop lookup returns multiple same-name paline', () => {
        const f5867 = {
            codicePalina: 'f5867',
            nomePalina: 'VEROLI | Abbazia di Casamari',
            destinazioni: ['Sora'],
        } as unknown as Pole;
        const f5915 = {
            codicePalina: 'f5915',
            nomePalina: 'VEROLI | Abbazia di Casamari',
            destinazioni: ['Roma Anagnina'],
        } as unknown as Pole;

        expect(selectPoleByCode([f5867, f5915], 'f5915')).toBe(f5915);
    });
});
