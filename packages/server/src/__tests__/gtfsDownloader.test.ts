import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { afterEach, describe, expect, it } from 'vitest';
import {
    appendDownloadChunk,
    extractGtfsZip,
    getGtfsDownloadRequestOptions,
    resolveSafeOutputPath,
    validateRedirectUrl,
} from '../utils/gtfsDownloader';

const tmpDirs: string[] = [];

function makeTempDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cotral-gtfs-test-'));
    tmpDirs.push(dir);
    return dir;
}

function makeZip(entries: Record<string, string>): Buffer {
    const zip = new AdmZip();
    for (const [entryName, content] of Object.entries(entries)) {
        zip.addFile(entryName, Buffer.from(content));
    }
    return zip.toBuffer();
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe('GTFS downloader hardening', () => {
    it('keeps TLS certificate validation enabled for GTFS downloads', () => {
        const options = getGtfsDownloadRequestOptions('https://travel.mob.cotralspa.it:4443/GTFS/GTFS_COTRAL.zip');

        expect(options.rejectUnauthorized).not.toBe(false);
    });

    it('rejects redirects to plain HTTP or a different host', () => {
        const source = 'https://travel.mob.cotralspa.it:4443/GTFS/GTFS_COTRAL.zip';

        expect(() => validateRedirectUrl(source, 'http://travel.mob.cotralspa.it/GTFS.zip')).toThrow(/https/i);
        expect(() => validateRedirectUrl(source, 'https://evil.example/GTFS.zip')).toThrow(/host/i);
    });

    it('resolves safe relative redirects on the same HTTPS host', () => {
        const redirect = validateRedirectUrl(
            'https://travel.mob.cotralspa.it:4443/GTFS/GTFS_COTRAL.zip',
            '/GTFS/latest.zip'
        );

        expect(redirect).toBe('https://travel.mob.cotralspa.it:4443/GTFS/latest.zip');
    });

    it('aborts when the GTFS download exceeds the configured size limit', () => {
        const chunks: Buffer[] = [];

        expect(() => appendDownloadChunk(chunks, Buffer.alloc(6), 5)).toThrow(/too large/i);
        expect(chunks).toHaveLength(0);
    });

    it('extracts GTFS text files while stripping a common ZIP folder prefix', () => {
        const outputDir = makeTempDir();
        const zipBuffer = makeZip({
            'GTFS_COTRAL/stops.txt': 'stop_id,stop_name\n1,Fermata',
            'GTFS_COTRAL/routes.txt': 'route_id,route_short_name\n1,R1',
            'GTFS_COTRAL/trips.txt': 'trip_id,route_id\n1,1',
            'GTFS_COTRAL/stop_times.txt': 'trip_id,arrival_time\n1,10:00',
        });

        const extracted = extractGtfsZip(zipBuffer, outputDir);

        expect(extracted).toBe(4);
        expect(fs.readFileSync(path.join(outputDir, 'stops.txt'), 'utf8')).toContain('Fermata');
        expect(fs.existsSync(path.join(outputDir, 'GTFS_COTRAL'))).toBe(false);
    });

    it('blocks ZIP output paths that would escape the GTFS output directory', () => {
        const outputDir = makeTempDir();
        const outputRoot = path.resolve(outputDir);

        expect(() => resolveSafeOutputPath(outputRoot, '../evil.txt')).toThrow(/unsafe/i);
        expect(() => resolveSafeOutputPath(outputRoot, '/tmp/evil.txt')).toThrow(/unsafe/i);
    });
});
