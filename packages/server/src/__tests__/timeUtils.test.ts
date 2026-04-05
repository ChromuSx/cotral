import { describe, it, expect } from 'vitest';
import { convertToReadableTime } from '../utils/timeUtils';

describe('convertToReadableTime', () => {
    it('should convert numeric seconds to HH:MM format', () => {
        expect(convertToReadableTime(3661)).toBe('01:01');
    });

    it('should convert string seconds to HH:MM format', () => {
        expect(convertToReadableTime('3661')).toBe('01:01');
    });

    it('should handle 0 seconds', () => {
        expect(convertToReadableTime(0)).toBe('00:00');
    });

    it('should handle exact hours', () => {
        expect(convertToReadableTime(7200)).toBe('02:00');
    });

    it('should handle exact minutes', () => {
        expect(convertToReadableTime(1800)).toBe('00:30');
    });

    it('should handle large values (full day)', () => {
        expect(convertToReadableTime(86399)).toBe('23:59');
    });

    it('should pad single digits', () => {
        expect(convertToReadableTime(3900)).toBe('01:05');
    });

    it('should handle undefined', () => {
        expect(convertToReadableTime(undefined)).toBe('00:00');
    });

    it('should handle non-numeric string', () => {
        expect(convertToReadableTime('abc')).toBe('00:00');
    });
});
