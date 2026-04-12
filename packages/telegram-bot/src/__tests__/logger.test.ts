import { describe, it, expect, vi } from 'vitest';
import { logger } from '../utils/logger';

describe('logger', () => {
    it('should log info messages', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
        logger.info('test message');
        expect(spy).toHaveBeenCalledOnce();
        expect(spy.mock.calls[0][0]).toContain('[INFO]');
        expect(spy.mock.calls[0][0]).toContain('test message');
        spy.mockRestore();
    });

    it('should log warn messages', () => {
        const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('test warning');
        expect(spy).toHaveBeenCalledOnce();
        expect(spy.mock.calls[0][0]).toContain('[WARN]');
        spy.mockRestore();
    });

    it('should log error messages with Error objects', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('test error', new Error('boom'));
        expect(spy).toHaveBeenCalledOnce();
        expect(spy.mock.calls[0][0]).toContain('[ERROR]');
        expect(spy.mock.calls[0][0]).toContain('boom');
        spy.mockRestore();
    });

    it('should log error messages with string errors', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('test error', 'string error');
        expect(spy).toHaveBeenCalledOnce();
        expect(spy.mock.calls[0][0]).toContain('string error');
        spy.mockRestore();
    });

    it('should include context in messages', () => {
        const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
        logger.info('test', { userId: 123 });
        expect(spy.mock.calls[0][0]).toContain('123');
        spy.mockRestore();
    });
});
