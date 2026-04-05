import { convertToReadableTime } from '../utils/timeUtils';
import { Pole, Transit, Vehicle } from '@cotral/shared';
import { config } from '../config';
import { fetchCotralXml, normalizeLatLon } from '../utils/cotralApi';

export class TransitsService {
    public async getTransitsByPoleCode(poleCode: string): Promise<{ pole: Pole; transits: Transit[] } | null> {
        const parsed = await fetchCotralXml('PIV.do', {
            cmd: 1,
            userId: config.cotral.userId,
            pCodice: poleCode,
            pFormato: 'xml',
            pDelta: config.cotral.delta
        });

        const poleData = parsed?.transiti?.palina?.[0];
        const transitsData = parsed?.transiti?.corsa;

        if (!poleData || !transitsData) {
            return null;
        }

        // cmd=1 has lat/lon swapped for many poles — normalize
        const rawLat = parseFloat(poleData.latitudine?.[0]) || 0;
        const rawLon = parseFloat(poleData.longitudine?.[0]) || 0;
        const coords = normalizeLatLon(rawLat, rawLon);

        const pole: Pole = {
            codicePalina: poleData.codice?.[0],
            nomePalina: poleData.nomePalina?.[0],
            localita: poleData.localita?.[0],
            coordX: coords.lat,
            coordY: coords.lon,
            comune: poleData.comune?.[0],
            nomeStop: poleData.nomeStop?.[0],
            preferita: poleData.preferita?.[0] === '1'
        };

        const transits = Array.isArray(transitsData) ? transitsData : [transitsData];

        return {
            pole,
            transits: transits.map((transitData: Record<string, any>) => {
                const automezzo: Vehicle = {
                    codice: transitData?.automezzo?.[0]?._ ?? null,
                    isAlive: transitData?.automezzo?.[0]?.$?.isAlive === '1'
                };

                return {
                    idCorsa: transitData.idCorsa?.[0],
                    percorso: transitData.percorso?.[0],
                    partenzaCorsa: transitData.partenzaCorsa?.[0],
                    orarioPartenzaCorsa: convertToReadableTime(transitData.orarioPartenzaCorsa?.[0]),
                    arrivoCorsa: transitData.arrivoCorsa?.[0],
                    orarioArrivoCorsa: convertToReadableTime(transitData.orarioArrivoCorsa?.[0]),
                    soppressa: transitData.soppressa?.[0],
                    numeroOrdine: transitData.numeroOrdine?.[0],
                    tempoTransito: convertToReadableTime(transitData.tempoTransito?.[0]),
                    ritardo: convertToReadableTime(transitData.ritardo?.[0]),
                    passato: transitData.passato?.[0],
                    automezzo,
                    testoFermata: transitData.testoFermata?.[0],
                    dataModifica: transitData.dataModifica?.[0],
                    instradamento: transitData.instradamento?.[0],
                    banchina: transitData.banchina?.[0],
                    monitorata: transitData.monitorata?.[0],
                    accessibile: transitData.accessibile?.[0]
                };
            })
        };
    }
}
