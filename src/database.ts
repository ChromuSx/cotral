import Database from 'better-sqlite3';
import { config } from './config';

let db: Database.Database | null = null;

export function initDatabase(): void {
    const database = getDb();
    database.exec(`
        CREATE TABLE IF NOT EXISTS favorite_poles (
            user_id INTEGER,
            pole_code TEXT,
            pole_lat REAL DEFAULT 0,
            pole_lon REAL DEFAULT 0,
            PRIMARY KEY (user_id, pole_code)
        )
    `);
    // Migrate old schema: add pole_lat/pole_lon if missing
    const columns = database.pragma('table_info(favorite_poles)') as { name: string }[];
    const colNames = columns.map(c => c.name);
    if (!colNames.includes('pole_lat')) {
        database.exec('ALTER TABLE favorite_poles ADD COLUMN pole_lat REAL DEFAULT 0');
    }
    if (!colNames.includes('pole_lon')) {
        database.exec('ALTER TABLE favorite_poles ADD COLUMN pole_lon REAL DEFAULT 0');
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
