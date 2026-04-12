import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { StopsService } from '../services/stopsService';
import { searchLocalities } from '../services/gtfsService';

export class StopsController {
    private stopsService: StopsService;

    constructor(fastify: FastifyInstance) {
        this.stopsService = new StopsService();

        fastify.get('/localities/search', this.searchLocalities.bind(this));
        fastify.get('/stops/firststop/:locality', this.getFirstStopByLocality.bind(this));
        fastify.get('/stops/:locality', this.getStopsByLocality.bind(this));
    }

    public async searchLocalities(request: FastifyRequest<{ Querystring: { query?: string; limit?: string } }>, reply: FastifyReply): Promise<void> {
        const query = request.query.query?.trim() ?? '';
        const limit = Math.min(parseInt(request.query.limit ?? '25', 10) || 25, 25);

        if (!query) {
            reply.status(200).send([]);
            return;
        }

        try {
            const results = searchLocalities(query, limit);
            reply.status(200).send(results);
        } catch (error) {
            request.log.error(error, 'Error searching localities');
            reply.status(500).send({ error: 'Internal server error' });
        }
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
