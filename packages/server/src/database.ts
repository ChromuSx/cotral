import Database from 'better-sqlite3';
import { config } from './config';

let db: Database.Database | null = null;

function createFavoritePolesTableSql(tableName = 'favorite_poles'): string {
    return `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            user_id TEXT,
            pole_code TEXT,
            pole_lat REAL DEFAULT 0,
            pole_lon REAL DEFAULT 0,
            PRIMARY KEY (user_id, pole_code)
        )
    `;
}

export function initDatabase(): void {
    const database = getDb();
    database.exec(createFavoritePolesTableSql());

    const columns = database.pragma('table_info(favorite_poles)') as { name: string; type: string }[];
    const colNames = columns.map(c => c.name);

    if (!colNames.includes('pole_lat')) {
        database.exec('ALTER TABLE favorite_poles ADD COLUMN pole_lat REAL DEFAULT 0');
    }
    if (!colNames.includes('pole_lon')) {
        database.exec('ALTER TABLE favorite_poles ADD COLUMN pole_lon REAL DEFAULT 0');
    }

    const refreshedColumns = database.pragma('table_info(favorite_poles)') as { name: string; type: string }[];
    const userIdColumn = refreshedColumns.find(c => c.name === 'user_id');
    if (userIdColumn?.type.toUpperCase() !== 'TEXT') {
        database.transaction(() => {
            database.exec(createFavoritePolesTableSql('favorite_poles_new'));
            database.exec(`
                INSERT OR REPLACE INTO favorite_poles_new(user_id, pole_code, pole_lat, pole_lon)
                SELECT CAST(user_id AS TEXT), pole_code, COALESCE(pole_lat, 0), COALESCE(pole_lon, 0)
                FROM favorite_poles
            `);
            database.exec('DROP TABLE favorite_poles');
            database.exec('ALTER TABLE favorite_poles_new RENAME TO favorite_poles');
        })();
    }
}

export const getDb = (): Database.Database => {
    if (!db) {
        db = new Database(config.dbPath);

        process.once('exit', () => {
            if (db) {
                db.close();
            }
        });
    }
    return db;
};

export function dbRun(sql: string, params: unknown[] = []): void {
    getDb().prepare(sql).run(...params);
}

export function dbAll<T>(sql: string, params: unknown[] = []): T[] {
    return getDb().prepare(sql).all(...params) as T[];
}

export function dbGet<T>(sql: string, params: unknown[] = []): T | undefined {
    return getDb().prepare(sql).get(...params) as T | undefined;
}
