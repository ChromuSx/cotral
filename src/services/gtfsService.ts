import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

export interface GtfsStop {
    stopId: string;
    stopName: string;
    stopNameLower: string;
    stopLat: number;
    stopLon: number;
}

export interface GtfsRoute {
    routeId: string;
    routeShortName: string;
    routeLongName: string;
}

// In-memory GTFS data — swapped atomically on reload
let data = {
    stops: [] as GtfsStop[],
    stopById: new Map<string, GtfsStop>(),
    routes: new Map<string, GtfsRoute>(),
    stopToRouteIds: new Map<string, Set<string>>(),
};
let fileMtimes: Map<string, number> = new Map();
let loaded = false;
let lastReloadCheck = 0;
const RELOAD_CHECK_INTERVAL_MS = 60_000;

function gtfsFile(name: string): string {
    return path.resolve(config.gtfsPath, name);
}

function parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return fields;
}

function getFileMtime(filePath: string): number {
    try {
        return fs.statSync(filePath).mtimeMs;
    } catch {
        return 0;
    }
}

function needsReload(): boolean {
    if (!loaded) return true;

    const now = Date.now();
    if (now - lastReloadCheck < RELOAD_CHECK_INTERVAL_MS) return false;
    lastReloadCheck = now;

    const files = ['stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt'];
    for (const file of files) {
        const currentMtime = getFileMtime(gtfsFile(file));
        if (currentMtime !== (fileMtimes.get(file) || 0)) {
            return true;
        }
    }
    return false;
}

function loadStops(): { stops: GtfsStop[]; stopById: Map<string, GtfsStop>; mtime: number } {
    const filePath = gtfsFile('stops.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const stops: GtfsStop[] = [];
    const stopById = new Map<string, GtfsStop>();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCsvLine(line);
        const stopName = fields[1].replace(/ #\s*\w+$/, '').trim();
        const stop: GtfsStop = {
            stopId: fields[0],
            stopName,
            stopNameLower: stopName.toLowerCase(),
            stopLat: parseFloat(fields[2]) || 0,
            stopLon: parseFloat(fields[3]) || 0,
        };
        stops.push(stop);
        stopById.set(stop.stopId, stop);
    }
    return { stops, stopById, mtime: getFileMtime(filePath) };
}

function loadRoutes(): { routes: Map<string, GtfsRoute>; mtime: number } {
    const filePath = gtfsFile('routes.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const routes = new Map<string, GtfsRoute>();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCsvLine(line);
        routes.set(fields[0], {
            routeId: fields[0],
            routeShortName: fields[2],
            routeLongName: fields[3]
        });
    }
    return { routes, mtime: getFileMtime(filePath) };
}

function loadTrips(): { tripToRoute: Map<string, string>; mtime: number } {
    const filePath = gtfsFile('trips.txt');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const tripToRoute = new Map<string, string>();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const fields = parseCsvLine(line);
        tripToRoute.set(fields[2], fields[0]);
    }
    return { tripToRoute, mtime: getFileMtime(filePath) };
}

function loadStopTimes(tripToRoute: Map<string, string>): { stopToRouteIds: Map<string, Set<string>>; mtime: number } {
    const filePath = gtfsFile('stop_times.txt');
    const stopToRouteIds = new Map<string, Set<string>>();

    const content = fs.readFileSync(filePath, 'utf-8');
    let pos = content.indexOf('\n') + 1;

    while (pos < content.length) {
        const lineEnd = content.indexOf('\n', pos);
        const end = lineEnd === -1 ? content.length : lineEnd;

        let fieldStart = pos;
        let commaIdx = content.indexOf(',', fieldStart);
        if (commaIdx === -1 || commaIdx >= end) { pos = end + 1; continue; }
        const tripId = content.substring(fieldStart, commaIdx).replace(/"/g, '');

        fieldStart = commaIdx + 1;
        commaIdx = content.indexOf(',', fieldStart);
        if (commaIdx === -1 || commaIdx >= end) { pos = end + 1; continue; }
        fieldStart = commaIdx + 1;
        commaIdx = content.indexOf(',', fieldStart);
        if (commaIdx === -1 || commaIdx >= end) { pos = end + 1; continue; }

        fieldStart = commaIdx + 1;
        commaIdx = content.indexOf(',', fieldStart);
        const stopEnd = (commaIdx === -1 || commaIdx >= end) ? end : commaIdx;
        const stopId = content.substring(fieldStart, stopEnd).replace(/"/g, '').trim();

        const routeId = tripToRoute.get(tripId);
        if (routeId && stopId) {
            let routeSet = stopToRouteIds.get(stopId);
            if (!routeSet) {
                routeSet = new Set();
                stopToRouteIds.set(stopId, routeSet);
            }
            routeSet.add(routeId);
        }

        pos = end + 1;
    }

    return { stopToRouteIds, mtime: getFileMtime(filePath) };
}

export function loadGtfs(): void {
    if (!needsReload()) return;
    console.log('Loading GTFS data...');
    const start = Date.now();

    // Build all data locally, then swap atomically
    const stopsData = loadStops();
    const routesData = loadRoutes();
    const tripsData = loadTrips();
    const stopTimesData = loadStopTimes(tripsData.tripToRoute);

    // Atomic swap — concurrent readers always see a consistent snapshot
    data = {
        stops: stopsData.stops,
        stopById: stopsData.stopById,
        routes: routesData.routes,
        stopToRouteIds: stopTimesData.stopToRouteIds,
    };

    const newMtimes = new Map<string, number>();
    newMtimes.set('stops.txt', stopsData.mtime);
    newMtimes.set('routes.txt', routesData.mtime);
    newMtimes.set('trips.txt', tripsData.mtime);
    newMtimes.set('stop_times.txt', stopTimesData.mtime);
    fileMtimes = newMtimes;
    loaded = true;

    console.log(`GTFS loaded: ${data.stops.length} stops, ${data.routes.size} routes, ${data.stopToRouteIds.size} stop-route mappings in ${Date.now() - start}ms`);
}

export function ensureLoaded(): void {
    if (needsReload()) loadGtfs();
}

// --- Query functions ---

export function findStopsByName(query: string, limit: number = 20): GtfsStop[] {
    ensureLoaded();
    const q = query.toLowerCase();
    const results: GtfsStop[] = [];
    for (const s of data.stops) {
        if (s.stopNameLower.includes(q)) {
            results.push(s);
            if (results.length >= limit) break;
        }
    }
    return results;
}

export function findStopById(stopId: string): GtfsStop | undefined {
    ensureLoaded();
    return data.stopById.get(stopId);
}

export function findStopsByPosition(lat: number, lon: number, range: number = 0.005, limit: number = 30): GtfsStop[] {
    ensureLoaded();
    const results: GtfsStop[] = [];
    for (const s of data.stops) {
        if (s.stopLat >= lat - range && s.stopLat <= lat + range &&
            s.stopLon >= lon - range && s.stopLon <= lon + range) {
            results.push(s);
            if (results.length >= limit) break;
        }
    }
    return results;
}

export function getRoutesForStop(stopId: string): GtfsRoute[] {
    ensureLoaded();
    const routeIds = data.stopToRouteIds.get(stopId);
    if (!routeIds) return [];

    return [...routeIds]
        .map(id => data.routes.get(id))
        .filter((r): r is GtfsRoute => r !== undefined);
}

export function getDestinationsForStop(stopId: string): string[] {
    return getDestinationsFromRoutes(getRoutesForStop(stopId));
}

export function getDestinationsFromRoutes(stopRoutes: GtfsRoute[]): string[] {
    const destinations = new Set<string>();
    for (const route of stopRoutes) {
        const name = route.routeLongName.replace(/ #\s*\w+$/, '').trim();
        const parts = name.split(' - ');
        if (parts.length >= 2) {
            destinations.add(parts[parts.length - 1].trim());
        }
    }
    return [...destinations].sort();
}
