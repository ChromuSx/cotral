import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

function writeGtfsFixture(dir: string): void {
    fs.writeFileSync(path.join(dir, 'stops.txt'), [
        'stop_id,stop_name,stop_lat,stop_lon',
        'sorano1,SORANO | TERME,42.6627,11.7178',
        'sora1,SORA | Borgo San Domenico,41.6967,13.5793',
        'balsorano1,BALSORANO | Centro,41.8092,13.5585',
        'roma1,ROMA | Ponte Mammolo (Metro B),41.9200,12.5650',
        'oriolo1,ORIOLO | Piazza Claudia,42.1550,12.1390',
        '',
    ].join('\n'));
    fs.writeFileSync(path.join(dir, 'routes.txt'), 'route_id,agency_id,route_short_name,route_long_name\n');
    fs.writeFileSync(path.join(dir, 'trips.txt'), 'route_id,service_id,trip_id\n');
    fs.writeFileSync(path.join(dir, 'stop_times.txt'), 'trip_id,arrival_time,departure_time,stop_id,stop_sequence\n');
}

async function loadGtfsWithFixture() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cotral-gtfs-'));
    writeGtfsFixture(dir);
    process.env.GTFS_PATH = dir;
    vi.resetModules();
    const gtfs = await import('../services/gtfsService');
    return { gtfs, dir };
}

afterEach(() => {
    delete process.env.GTFS_PATH;
    vi.resetModules();
});

describe('GTFS locality search', () => {
    it('prefers exact locality matches over substring matches', async () => {
        const { gtfs, dir } = await loadGtfsWithFixture();
        try {
            expect(gtfs.findStopsByLocality('Sora').map(stop => stop.stopId)).toEqual(['sora1']);
            expect(gtfs.findStopsByLocality('Roma').map(stop => stop.stopId)).toEqual(['roma1']);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('falls back to locality substring matches only when no exact locality exists', async () => {
        const { gtfs, dir } = await loadGtfsWithFixture();
        try {
            expect(gtfs.findStopsByLocality('Sor').map(stop => stop.stopId)).toEqual(['sorano1', 'sora1', 'balsorano1']);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
