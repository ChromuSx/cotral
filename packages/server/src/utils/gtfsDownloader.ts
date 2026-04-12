import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import AdmZip from 'adm-zip';
import { config } from '../config';

const REQUIRED_FILES = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'];

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

    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // Create output directory
    fs.mkdirSync(config.gtfsPath, { recursive: true });

    // Find if files are in a subdirectory inside the ZIP
    const txtEntries = entries.filter(e => e.entryName.endsWith('.txt') && !e.isDirectory);
    if (txtEntries.length === 0) {
        throw new Error('No .txt files found in GTFS ZIP');
    }

    // Determine common prefix (e.g., "GTFS_COTRAL/")
    const firstEntry = txtEntries[0].entryName;
    const prefix = firstEntry.includes('/') ? firstEntry.substring(0, firstEntry.lastIndexOf('/') + 1) : '';

    for (const entry of txtEntries) {
        const fileName = entry.entryName.replace(prefix, '');
        const outputPath = path.join(config.gtfsPath, fileName);
        fs.writeFileSync(outputPath, entry.getData());
    }

    console.log(`GTFS extracted: ${txtEntries.length} files to ${config.gtfsPath}`);
}

function downloadFile(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { rejectUnauthorized: false, timeout: 120000 }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadFile(redirectUrl).then(resolve).catch(reject);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                reject(new Error(`GTFS download failed: HTTP ${response.statusCode}`));
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk: Buffer) => chunks.push(chunk));
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { Buffer: NodeBuffer } = require('node:buffer');
            response.on('end', () => resolve(NodeBuffer.concat(chunks)));
            response.on('error', reject);
        });

        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('GTFS download timeout'));
        });
    });
}
