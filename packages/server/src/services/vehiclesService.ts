import { VehiclePosition } from '@cotral/shared';
import { config } from '../config';
import { fetchCotralXml, extractArray } from '../utils/cotralApi';

export class VehiclesService {
    public async getVehicleRealTimePositions(vehicleId: string): Promise<VehiclePosition[]> {
        const parsed = await fetchCotralXml('Automezzi.do', {
            cmd: 'loc',
            userId: config.cotral.userId,
            pAutomezzo: vehicleId,
            pFormato: 'xml'
        });

        const positions = extractArray(parsed, 'listaPosizioni', 'posizione');
        return positions.map((vehicleData: Record<string, any>) => ({
            coordX: vehicleData?.$?.pX?.split(' ') ?? [],
            coordY: vehicleData?.$?.pY?.split(' ') ?? [],
            time: vehicleData?._ ?? ''
        }));
    }
}
