import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { URL } from 'url';
import AdmZip from 'adm-zip';
import { config } from '../config';

const REQUIRED_FILES = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'];
export const MAX_GTFS_DOWNLOAD_BYTES = 150 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const DOWNLOAD_TIMEOUT_MS = 120000;

function gtfsFilesExist(): boolean {
    return REQUIRED_FILES.every(file =>
        fs.existsSync(path.join(config.gtfsPath, file))
    );
}

export async function ensureGtfsData(): Promise<void> {
    if (gtfsFilesExist()) return;

    console.log(`GTFS data not found at ${config.gtfsPath}, downloading from ${config.gtfsUrl}...`);

    const zipBuffer = await downloadFile(config.gtfsUrl);
    console.log(`Downloaded ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB, extracting...`);

    const extractedCount = extractGtfsZip(zipBuffer, config.gtfsPath);
    console.log(`GTFS extracted: ${extractedCount} files to ${config.gtfsPath}`);
}

export function extractGtfsZip(zipBuffer: Buffer, outputDir: string): number {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    fs.mkdirSync(outputDir, { recursive: true });

    const txtEntries = entries.filter(e => e.entryName.endsWith('.txt') && !e.isDirectory);
    if (txtEntries.length === 0) {
        throw new Error('No .txt files found in GTFS ZIP');
    }

    const firstEntry = txtEntries[0].entryName;
    const prefix = firstEntry.includes('/') ? firstEntry.substring(0, firstEntry.lastIndexOf('/') + 1) : '';
    const outputRoot = path.resolve(outputDir);

    for (const entry of txtEntries) {
        const fileName = entry.entryName.replace(prefix, '');
        const outputPath = resolveSafeOutputPath(outputRoot, fileName);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, entry.getData());
    }

    return txtEntries.length;
}

export function resolveSafeOutputPath(outputRoot: string, fileName: string): string {
    if (!fileName || path.isAbsolute(fileName)) {
        throw new Error(`Unsafe GTFS ZIP entry path: ${fileName}`);
    }

    const normalized = path.normalize(fileName);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
        throw new Error(`Unsafe GTFS ZIP entry path: ${fileName}`);
    }

    const outputPath = path.resolve(outputRoot, normalized);
    const relative = path.relative(outputRoot, outputPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Unsafe GTFS ZIP entry path: ${fileName}`);
    }

    return outputPath;
}

export function getGtfsDownloadRequestOptions(url: string): https.RequestOptions {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
        throw new Error('GTFS download URL must use HTTPS');
    }

    return {
        timeout: DOWNLOAD_TIMEOUT_MS,
        rejectUnauthorized: true,
    };
}

export function validateRedirectUrl(sourceUrl: string, redirectLocation: string): string {
    const source = new URL(sourceUrl);
    const redirect = new URL(redirectLocation, source);

    if (redirect.protocol !== 'https:') {
        throw new Error(`GTFS redirect rejected: target must use HTTPS (${redirect.href})`);
    }

    if (redirect.host !== source.host) {
        throw new Error(`GTFS redirect rejected: target host differs from source host (${redirect.host})`);
    }

    return redirect.href;
}

export function appendDownloadChunk(chunks: Buffer[], chunk: Buffer, maxBytes: number = MAX_GTFS_DOWNLOAD_BYTES): number {
    const currentBytes = chunks.reduce((sum, existing) => sum + existing.length, 0);
    const nextBytes = currentBytes + chunk.length;
    if (nextBytes > maxBytes) {
        throw new Error(`GTFS download too large: exceeded ${(maxBytes / 1024 / 1024).toFixed(0)} MB limit`);
    }

    chunks.push(chunk);
    return nextBytes;
}

export function downloadFile(url: string, redirectsRemaining: number = MAX_REDIRECTS): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let settled = false;
        const fail = (error: Error): void => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        let request: ReturnType<typeof https.get>;
        try {
            const requestOptions = getGtfsDownloadRequestOptions(url);
            request = https.get(url, requestOptions, (response) => {
                const statusCode = response.statusCode ?? 0;

                if ([301, 302, 303, 307, 308].includes(statusCode)) {
                    response.resume();
                    if (redirectsRemaining <= 0) {
                        fail(new Error('GTFS download failed: too many redirects'));
                        return;
                    }

                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        fail(new Error('GTFS download failed: redirect without Location header'));
                        return;
                    }

                    let safeRedirect: string;
                    try {
                        safeRedirect = validateRedirectUrl(url, redirectUrl);
                    } catch (error) {
                        fail(error instanceof Error ? error : new Error(String(error)));
                        return;
                    }

                    downloadFile(safeRedirect, redirectsRemaining - 1).then(resolve).catch(reject);
                    return;
                }

                if (statusCode !== 200) {
                    response.resume();
                    fail(new Error(`GTFS download failed: HTTP ${statusCode}`));
                    return;
                }

                const contentLength = response.headers['content-length'];
                if (contentLength && Number(contentLength) > MAX_GTFS_DOWNLOAD_BYTES) {
                    response.resume();
                    fail(new Error(`GTFS download too large: content-length ${contentLength}`));
                    return;
                }

                const chunks: Buffer[] = [];
                response.on('data', (chunk: Buffer) => {
                    try {
                        appendDownloadChunk(chunks, chunk);
                    } catch (error) {
                        request.destroy(error instanceof Error ? error : new Error(String(error)));
                    }
                });
                response.on('end', () => {
                    if (settled) return;
                    settled = true;
                    resolve(Buffer.concat(chunks));
                });
                response.on('error', fail);
            });
        } catch (error) {
            fail(error instanceof Error ? error : new Error(String(error)));
            return;
        }

        request.on('error', fail);
        request.on('timeout', () => {
            request.destroy(new Error('GTFS download timeout'));
        });
    });
}
