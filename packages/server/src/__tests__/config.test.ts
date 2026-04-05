import { describe, it, expect } from 'vitest';
import { config } from '../config';

describe('config', () => {
    it('should have default port', () => {
        expect(config.port).toBe(3000);
    });

    it('should have default host', () => {
        expect(config.host).toBe('127.0.0.1');
    });

    it('should have default database path', () => {
        expect(config.dbPath).toContain('database.sqlite');
    });

    it('should have cotral base URL', () => {
        expect(config.cotral.baseURL).toContain('cotralspa');
    });

    it('should have cotral userId', () => {
        expect(config.cotral.userId).toBeTruthy();
    });

    it('should have cotral delta', () => {
        expect(config.cotral.delta).toBe('261');
    });
});
