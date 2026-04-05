import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { TransitsService } from '../services/transitsService';

export class TransitsController {
    private transitsService: TransitsService;

    constructor(fastify: FastifyInstance) {
        this.transitsService = new TransitsService();

        fastify.get('/transits/:poleCode', this.getTransitsByPoleCode.bind(this));
    }

    private async getTransitsByPoleCode(request: FastifyRequest<{ Params: { poleCode: string } }>, reply: FastifyReply): Promise<void> {
        const { poleCode } = request.params;

        if (!poleCode?.trim()) {
            reply.status(400).send({ error: 'Il parametro "poleCode" è obbligatorio' });
            return;
        }

        try {
            const transits = await this.transitsService.getTransitsByPoleCode(poleCode);
            reply.status(200).send(transits);
        } catch (error) {
            request.log.error(error, 'Error fetching transits by pole code');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }
}
