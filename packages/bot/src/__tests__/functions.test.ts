import { describe, it, expect } from 'vitest';
import { convertAndValidateCoords, formatBoolean } from '../utils/functions';

describe('convertAndValidateCoords', () => {
    it('should return valid coordinates', () => {
        const result = convertAndValidateCoords('41.9028', '12.4964');
        expect(result).toEqual({ latitude: 41.9028, longitude: 12.4964 });
    });

    it('should return null for invalid latitude', () => {
        const result = convertAndValidateCoords('abc', '12.4964');
        expect(result).toBeNull();
    });

    it('should return null for invalid longitude', () => {
        const result = convertAndValidateCoords('41.9028', 'xyz');
        expect(result).toBeNull();
    });

    it('should return null for both invalid', () => {
        const result = convertAndValidateCoords('', '');
        expect(result).toBeNull();
    });

    it('should handle negative coordinates', () => {
        const result = convertAndValidateCoords('-33.8688', '151.2093');
        expect(result).toEqual({ latitude: -33.8688, longitude: 151.2093 });
    });
});

describe('formatBoolean', () => {
    it('should return "Sì" for true', () => {
        expect(formatBoolean(true)).toBe('Sì');
    });

    it('should return "No" for false', () => {
        expect(formatBoolean(false)).toBe('No');
    });

    it('should return "Non disponibile" for null', () => {
        expect(formatBoolean(null)).toBe('Non disponibile');
    });

    it('should return "Non disponibile" for undefined', () => {
        expect(formatBoolean(undefined)).toBe('Non disponibile');
    });
});
