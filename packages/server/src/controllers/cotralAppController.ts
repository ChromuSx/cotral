import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
    fetchCotralAppJson,
    mapBusFill,
    mapPlaceAutocomplete,
    mapStopSearch,
} from '../utils/cotralAppApi';

export class CotralAppController {
    constructor(fastify: FastifyInstance) {
        fastify.get('/app/localities/autocomplete', this.autocompleteLocalities.bind(this));
        fastify.get('/app/stops/search', this.searchStops.bind(this));
        fastify.get('/app/vehicles/:vehicleId/busfill', this.getBusFill.bind(this));
    }

    private async autocompleteLocalities(
        request: FastifyRequest<{ Querystring: { input?: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const input = request.query.input?.trim() ?? '';
        if (!input) {
            reply.status(400).send({ error: 'Il parametro "input" è obbligatorio' });
            return;
        }

        try {
            const payload = await fetchCotralAppJson('mw-travelCotralBE/v1/place/autocomplete/originByInput', { input });
            reply.status(200).send(mapPlaceAutocomplete(payload));
        } catch (error) {
            request.log.error(error, 'Error fetching Cotral app localities autocomplete');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }

    private async searchStops(
        request: FastifyRequest<{ Querystring: { input?: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const input = request.query.input?.trim() ?? '';
        if (!input) {
            reply.status(400).send({ error: 'Il parametro "input" è obbligatorio' });
            return;
        }

        try {
            const payload = await fetchCotralAppJson('mw-travelCotralBE/v1/stop/search/description', { input });
            reply.status(200).send(mapStopSearch(payload));
        } catch (error) {
            request.log.error(error, 'Error fetching Cotral app stop search');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }

    private async getBusFill(
        request: FastifyRequest<{ Params: { vehicleId: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const vehicleId = request.params.vehicleId?.trim() ?? '';
        if (!vehicleId) {
            reply.status(400).send({ error: 'Il parametro "vehicleId" è obbligatorio' });
            return;
        }

        try {
            const payload = await fetchCotralAppJson('mw-travelCotralBE/v1/live/busfill', { id: vehicleId });
            reply.status(200).send(mapBusFill(payload));
        } catch (error) {
            request.log.error(error, 'Error fetching Cotral app bus fill');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }
}
