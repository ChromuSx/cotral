import { describe, expect, it } from 'vitest';
import { isValidPoleSearchRange, MAX_POLE_SEARCH_RANGE } from '../controllers/polesController';

describe('poles controller validation', () => {
    it('accepts only positive bounded position search ranges', () => {
        expect(isValidPoleSearchRange(0.003)).toBe(true);
        expect(isValidPoleSearchRange(MAX_POLE_SEARCH_RANGE)).toBe(true);
        expect(isValidPoleSearchRange(0)).toBe(false);
        expect(isValidPoleSearchRange(-0.001)).toBe(false);
        expect(isValidPoleSearchRange(MAX_POLE_SEARCH_RANGE + 0.001)).toBe(false);
        expect(isValidPoleSearchRange(Number.NaN)).toBe(false);
        expect(isValidPoleSearchRange(Number.POSITIVE_INFINITY)).toBe(false);
    });
});
