import { describe, expect, it } from 'vitest';
import { buildPoleDescriptionSearchUrl } from '../apiHandlers/polesApiHandler';
import { PolesCommands } from '../commands/polesCommands';

describe('modern pole description search integration', () => {
    it('builds the server URL for modern Cotral app stop/pole search', () => {
        expect(buildPoleDescriptionSearchUrl(' Roma Anagnina ')).toBe('/app/stops/search?input=Roma%20Anagnina');
    });

    it('rejects blank modern pole search input before calling the API', () => {
        expect(buildPoleDescriptionSearchUrl('   ')).toBeNull();
    });

    it('exposes the modern search command labels', () => {
        expect(PolesCommands.SearchPolesByDescriptionFromMenu).toBe('🔎 Cerca per nome');
        expect(PolesCommands.SearchPolesByDescription).toBe('searchpolesbydescription');
    });
});
