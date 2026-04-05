import { Context } from 'telegraf';
import { handleApiResponse } from '../utils/apiUtils';
import { VehiclePosition } from '@cotral/shared';

export async function getVehicleRealTimePositions(ctx: Context, vehicleCode: string): Promise<void> {
    const apiUrl = `/vehiclerealtimepositions/${encodeURIComponent(vehicleCode)}`;
    await handleApiResponse(ctx, apiUrl, formatVehicleRealTimePositions);
}

function formatVehicleRealTimePositions(vehicleData: VehiclePosition): string {
    return `Ora: ${vehicleData.time ?? 'Non disponibile'}`;
}
