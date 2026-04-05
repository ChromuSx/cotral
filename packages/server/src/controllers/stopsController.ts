import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { StopsService } from '../services/stopsService';

export class StopsController {
    private stopsService: StopsService;

    constructor(fastify: FastifyInstance) {
        this.stopsService = new StopsService();

        fastify.get('/stops/firststop/:locality', this.getFirstStopByLocality.bind(this));
        fastify.get('/stops/:locality', this.getStopsByLocality.bind(this));
    }

    public async getStopsByLocality(request: FastifyRequest<{ Params: { locality: string } }>, reply: FastifyReply): Promise<void> {
        const { locality } = request.params;

        if (!locality?.trim()) {
            reply.status(400).send({ error: 'Il parametro "locality" è obbligatorio' });
            return;
        }

        try {
            const stops = await this.stopsService.getStopsByLocality(locality);
            reply.status(200).send(stops);
        } catch (error) {
            request.log.error(error, 'Error searching stops');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }

    private async getFirstStopByLocality(request: FastifyRequest<{ Params: { locality: string } }>, reply: FastifyReply): Promise<void> {
        const { locality } = request.params;

        if (!locality?.trim()) {
            reply.status(400).send({ error: 'Il parametro "locality" è obbligatorio' });
            return;
        }

        try {
            const stop = await this.stopsService.getFirstStopByLocality(locality);
            reply.status(200).send(stop);
        } catch (error) {
            request.log.error(error, 'Error fetching stop by locality');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }
}
