import { Pole } from '../interfaces/Pole';
import { StopsService } from './stopsService';
import { dbAll, dbRun } from '../database';
import { config } from '../config';
import { fetchCotralXml, extractArray } from '../utils/cotralApi';
import * as gtfs from './gtfsService';

interface FavoritePoleRow {
    pole_code: string;
    pole_lat: number;
    pole_lon: number;
}

export class PolesService {
    private stopsService: StopsService;

    constructor() {
        this.stopsService = new StopsService();
    }

    // Uses GTFS data to find poles near a stop, enriched with destinations from GTFS routes
    public async getPolesByStopCode(stopCode: string | number): Promise<Pole[]> {
        // First try: exact GTFS stop match (the stop IS a pole in GTFS)
        const gtfsStop = gtfs.findStopById(String(stopCode));
        if (gtfsStop) {
            // Find all nearby poles from GTFS
            const nearbyStops = gtfs.findStopsByPosition(gtfsStop.stopLat, gtfsStop.stopLon, 0.003);
            if (nearbyStops.length > 0) {
                return nearbyStops.map(s => this.mapGtfsStopToPole(s));
            }
        }

        // Fallback: get stop coords, then use cmd=7 (GPS position)
        const stop = await this.stopsService.getFirstStopByStopCode(stopCode);
        if (!stop) return [];
        return this.getPolesByPosition(stop.coordX, stop.coordY, 0.003);
    }

    public async getPolesByPosition(latitude: number, longitude: number, range: number = 0.005): Promise<Pole[]> {
        // Try GTFS first (instant)
        const gtfsStops = gtfs.findStopsByPosition(latitude, longitude, range);
        if (gtfsStops.length > 0) {
            return gtfsStops.map(s => this.mapGtfsStopToPole(s));
        }

        // Fallback to Cotral API cmd=7
        const parsed = await fetchCotralXml('PIV.do', {
            cmd: 7,
            pX1: latitude - range,
            pY1: longitude - range,
            pX2: latitude + range,
            pY2: longitude + range,
            pZ: 90
        });

        const poles = extractArray(parsed, 'paline', 'palina');
        if (poles.length === 0) return [];

        return poles.map((poleData: Record<string, string[]>) => ({
            codicePalina: poleData.codicePalina?.[0],
            nomePalina: poleData.nomePalina?.[0],
            coordX: parseFloat(poleData.coordX?.[0]) || 0,
            coordY: parseFloat(poleData.coordY?.[0]) || 0,
            destinazioni: (poleData as Record<string, any>).destinazioni?.[0]?.destinazione,
            isCotral: poleData.isCotral?.[0] ? 1 : null,
            isBanchinato: poleData.isBanchinato?.[0] ? Number(poleData.isBanchinato[0]) : null
        }));
    }

    public async getPolesByArrivalAndDestinationLocality(arrivalLocality: string, destinationLocality: string): Promise<Pole[]> {
        const stops = await this.stopsService.getStopsByLocality(arrivalLocality);
        if (stops.length === 0) return [];

        // Deduplicate by coordinates
        const uniqueCoords = new Map<string, { coordX: number; coordY: number }>();
        for (const stop of stops) {
            const key = `${stop.coordX.toFixed(3)},${stop.coordY.toFixed(3)}`;
            if (!uniqueCoords.has(key)) {
                uniqueCoords.set(key, { coordX: stop.coordX, coordY: stop.coordY });
            }
        }

        const polesPerLocation = await Promise.all(
            [...uniqueCoords.values()].map(coord =>
                this.getPolesByPosition(coord.coordX, coord.coordY, 0.003)
            )
        );

        const destLower = destinationLocality.toLowerCase();
        const seen = new Set<string>();
        return polesPerLocation.flat().filter(pole => {
            if (!pole.codicePalina || seen.has(pole.codicePalina)) return false;
            seen.add(pole.codicePalina);
            return pole.destinazioni?.some(dest => dest.toLowerCase().includes(destLower));
        });
    }

    public async getAllPolesDestinationsByArrivalLocality(arrivalLocality: string): Promise<string[]> {
        const firstStop = await this.stopsService.getFirstStopByLocality(arrivalLocality);
        if (!firstStop) return [];

        const poles = await this.getPolesByPosition(firstStop.coordX, firstStop.coordY, 0.003);
        const allDestinations = new Set<string>();

        for (const pole of poles) {
            pole.destinazioni?.forEach(dest => allDestinations.add(dest));
        }

        return [...allDestinations];
    }

    public checkFavoritePoleCodes(userId: number, poleCodes: string[]): Set<string> {
        if (poleCodes.length === 0) return new Set();
        const placeholders = poleCodes.map(() => '?').join(',');
        const rows = dbAll<{ pole_code: string }>(
            `SELECT pole_code FROM favorite_poles WHERE user_id = ? AND pole_code IN (${placeholders})`,
            [userId, ...poleCodes]
        );
        return new Set(rows.map(r => r.pole_code));
    }

    public async getFavoritePoles(userId: number): Promise<Pole[]> {
        const rows = dbAll<FavoritePoleRow>(
            'SELECT pole_code, pole_lat, pole_lon FROM favorite_poles WHERE user_id = ?',
            [userId]
        );
        if (rows.length === 0) return [];

        const favoritePoleCodes = new Set(rows.map(row => row.pole_code));
        const favoritePoles: Pole[] = [];

        for (const row of rows) {
            // Try GTFS first
            const gtfsStop = gtfs.findStopById(row.pole_code);
            if (gtfsStop) {
                favoritePoles.push({ ...this.mapGtfsStopToPole(gtfsStop), preferita: true });
            } else if (row.pole_lat && row.pole_lon) {
                // Fallback: use stored coordinates
                const nearby = await this.getPolesByPosition(row.pole_lat, row.pole_lon, 0.001);
                const match = nearby.find(p => p.codicePalina && favoritePoleCodes.has(p.codicePalina));
                if (match) {
                    favoritePoles.push({ ...match, preferita: true });
                }
            }
        }

        return favoritePoles;
    }

    public addFavoritePole(userId: number, poleCode: string, poleLat: number, poleLon: number): void {
        dbRun(
            'INSERT OR REPLACE INTO favorite_poles(user_id, pole_code, pole_lat, pole_lon) VALUES(?, ?, ?, ?)',
            [userId, poleCode, poleLat, poleLon]
        );
    }

    public removeFavoritePole(userId: number, poleCode: string): void {
        dbRun('DELETE FROM favorite_poles WHERE user_id = ? AND pole_code = ?', [userId, poleCode]);
    }

    private mapGtfsStopToPole(s: gtfs.GtfsStop): Pole {
        const stopRoutes = gtfs.getRoutesForStop(s.stopId);
        const destinations = gtfs.getDestinationsFromRoutes(stopRoutes);

        const parts = s.stopName.split(/[|!(]/);
        const localita = parts[0].trim();

        return {
            codicePalina: s.stopId,
            codiceStop: s.stopId,
            nomePalina: s.stopName,
            nomeStop: s.stopName,
            localita,
            coordX: s.stopLat,
            coordY: s.stopLon,
            destinazioni: destinations.length > 0 ? destinations : undefined,
            isCotral: stopRoutes.length > 0 ? 1 : null,
        };
    }
}
