import { Stop } from '@cotral/shared';
import { config } from '../config';
import { fetchCotralXml, extractArray } from '../utils/cotralApi';
import * as gtfs from './gtfsService';

export class StopsService {
    public async getFirstStopByLocality(locality: string): Promise<Stop | null> {
        // Try GTFS first (instant, offline)
        const gtfsStops = gtfs.findStopsByName(locality);
        if (gtfsStops.length > 0) {
            return this.mapGtfsStop(gtfsStops[0]);
        }

        // Fallback to Cotral API
        const parsed = await fetchCotralXml('PIV.do', {
            cmd: 6,
            userId: config.cotral.userId,
            pStringa: locality.toLowerCase()
        });

        const stops = extractArray(parsed, 'listaStop', 'stop');
        if (stops.length === 0) return null;
        return this.mapXmlStop(stops[0]);
    }

    public async getFirstStopByStopCode(stopCode: string | number): Promise<Stop | null> {
        // Try GTFS by stop ID
        const gtfsStop = gtfs.findStopById(String(stopCode));
        if (gtfsStop) return this.mapGtfsStop(gtfsStop);

        // Fallback: search by code as text via API
        const stops = await this.getStopsByLocality(String(stopCode));
        return stops.find(s => s.codiceStop === String(stopCode)) || stops[0] || null;
    }

    public async getStopsByLocality(locality: string): Promise<Stop[]> {
        // Try GTFS first
        const gtfsStops = gtfs.findStopsByName(locality);
        if (gtfsStops.length > 0) {
            return gtfsStops.map(s => this.mapGtfsStop(s));
        }

        // Fallback to Cotral API
        const parsed = await fetchCotralXml('PIV.do', {
            cmd: 6,
            userId: config.cotral.userId,
            pStringa: locality.toLowerCase()
        });

        const stops = extractArray(parsed, 'listaStop', 'stop');
        return stops.map((stopData: Record<string, string[]>) => this.mapXmlStop(stopData));
    }

    private mapGtfsStop(s: gtfs.GtfsStop): Stop {
        // Extract locality from stop name (format: "CITY | Details" or "CITY (Details)")
        const parts = s.stopName.split(/[|!(]/);
        const localita = parts[0].trim();
        return {
            codiceStop: s.stopId,
            nomeStop: s.stopName,
            localita,
            coordX: s.stopLat,
            coordY: s.stopLon
        };
    }

    private mapXmlStop(stopData: Record<string, string[]>): Stop {
        return {
            codiceStop: stopData.codiceStop?.[0] ?? '',
            nomeStop: stopData.nomeStop?.[0] ?? '',
            localita: stopData.localita?.[0] ?? '',
            coordX: parseFloat(stopData.coordX?.[0]) || 0,
            coordY: parseFloat(stopData.coordY?.[0]) || 0
        };
    }
}
