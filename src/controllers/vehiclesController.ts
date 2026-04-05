import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { VehiclesService } from '../services/vehiclesService';

export class VehiclesController {
    private vehiclesService: VehiclesService;

    constructor(fastify: FastifyInstance) {
        this.vehiclesService = new VehiclesService();

        fastify.get('/vehiclerealtimepositions/:vehicleCode', this.getVehicleRealTimePositions.bind(this));
    }

    private async getVehicleRealTimePositions(request: FastifyRequest<{ Params: { vehicleCode: string } }>, reply: FastifyReply): Promise<void> {
        const { vehicleCode } = request.params;

        if (!vehicleCode?.trim()) {
            reply.status(400).send({ error: 'Il parametro "vehicleCode" è obbligatorio' });
            return;
        }

        try {
            const vehicleRealTimePositions = await this.vehiclesService.getVehicleRealTimePositions(vehicleCode);
            reply.status(200).send(vehicleRealTimePositions);
        } catch (error) {
            request.log.error(error, 'Error fetching vehicles locations');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }
}
