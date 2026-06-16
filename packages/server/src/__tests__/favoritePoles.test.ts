import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadDatabaseWithTempPath() {
    vi.resetModules();
    const dir = mkdtempSync(join(tmpdir(), 'cotral-favorites-'));
    process.env.DB_PATH = join(dir, 'database.sqlite');
    return import('../database');
}

afterEach(() => {
    delete process.env.DB_PATH;
    vi.resetModules();
});

describe('favorite poles persistence', () => {
    it('creates favorite_poles.user_id as TEXT to preserve full Telegram/Discord IDs', async () => {
        const { initDatabase, getDb } = await loadDatabaseWithTempPath();

        initDatabase();

        const columns = getDb().pragma('table_info(favorite_poles)') as { name: string; type: string }[];
        const userIdColumn = columns.find(column => column.name === 'user_id');
        expect(userIdColumn?.type).toBe('TEXT');
    });

    it('keeps distinct large snowflake IDs separate instead of rounding them as numbers', async () => {
        const { initDatabase, dbAll } = await loadDatabaseWithTempPath();
        const { PolesService } = await import('../services/polesService');
        const firstUserId = '10000000000000000001';
        const secondUserId = '10000000000000000002';
        const service = new PolesService();

        initDatabase();
        service.addFavoritePole(firstUserId, 'f1001', 41.1, 13.1);
        service.addFavoritePole(secondUserId, 'f1002', 41.2, 13.2);

        const rows = dbAll<{ user_id: string; pole_code: string }>(
            'SELECT user_id, pole_code FROM favorite_poles ORDER BY pole_code'
        );
        expect(rows).toEqual([
            { user_id: firstUserId, pole_code: 'f1001' },
            { user_id: secondUserId, pole_code: 'f1002' },
        ]);
        expect(service.checkFavoritePoleCodes(firstUserId, ['f1001', 'f1002'])).toEqual(new Set(['f1001']));
        expect(service.checkFavoritePoleCodes(secondUserId, ['f1001', 'f1002'])).toEqual(new Set(['f1002']));
    });
});
