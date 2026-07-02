import { describe, expect, it } from 'vitest';
import { Pole, Stop } from '@cotral/shared';
import { formatPoleSelectionLine } from '../apiHandlers/polesApiHandler';
import { formatStopSelectionLine } from '../apiHandlers/stopsApiHandler';

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
});
