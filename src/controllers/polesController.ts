import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PolesService } from '../services/polesService';

export class PolesController {
    private polesService: PolesService;

    constructor(fastify: FastifyInstance) {
        this.polesService = new PolesService();

        // Static routes MUST be registered before parametric ones to avoid shadowing
        fastify.get('/poles/position', this.getPolesByPosition.bind(this));
        fastify.get('/poles/destinations/:arrivalLocality', this.getAllPolesDestinationsByArrivalLocality.bind(this));
        fastify.get('/poles/favorites/:userId', this.getFavoritePoles.bind(this));
        fastify.post('/poles/favorites', this.addFavoritePole.bind(this));
        fastify.delete('/poles/favorites', this.removeFavoritePole.bind(this));
        fastify.get('/poles/:arrivalLocality/:destinationLocality', this.getPolesByArrivalAndDestinationLocality.bind(this));
        fastify.get('/poles/:stopCode', this.getPolesByStopCode.bind(this));
    }

    public async getPolesByStopCode(request: FastifyRequest<{ Params: { stopCode: string }; Querystring: { userId?: string } }>, reply: FastifyReply): Promise<void> {
        const { stopCode } = request.params;
        const userId = request.query.userId ? parseInt(request.query.userId, 10) : undefined;

        try {
            const poles = await this.polesService.getPolesByStopCode(stopCode);
            // Set codiceStop only if not already populated (GTFS sets it per-pole)
            poles.forEach(pole => { if (!pole.codiceStop) pole.codiceStop = stopCode; });

            if (poles.length > 0 && userId) {
                const poleCodes = poles.map(p => p.codicePalina).filter((c): c is string => c !== undefined);
                const favSet = this.polesService.checkFavoritePoleCodes(userId, poleCodes);
                poles.forEach(pole => {
                    pole.preferita = pole.codicePalina ? favSet.has(pole.codicePalina) : false;
                });
            }

            reply.status(200).send(poles);
        } catch (error) {
            request.log.error(error, `Error searching poles by stop code "${stopCode}"`);
            reply.status(500).send({ error: 'Failed to retrieve poles' });
        }
    }

    public async getPolesByPosition(request: FastifyRequest<{ Querystring: { latitude: string; longitude: string; range?: string } }>, reply: FastifyReply): Promise<void> {
        const { latitude: latStr, longitude: lonStr, range: rangeStr } = request.query;
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lonStr);
        const range = rangeStr ? parseFloat(rangeStr) : undefined;

        if (isNaN(latitude) || isNaN(longitude)) {
            reply.status(400).send({ error: 'I parametri "latitude" e "longitude" devono essere numeri validi' });
            return;
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            reply.status(400).send({ error: 'Coordinate fuori range (lat: -90/90, lon: -180/180)' });
            return;
        }

        try {
            const poles = await this.polesService.getPolesByPosition(latitude, longitude, range);
            reply.status(200).send(poles);
        } catch (error) {
            request.log.error(error, 'Error getting poles by position');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }

    public async getPolesByArrivalAndDestinationLocality(request: FastifyRequest<{ Params: { arrivalLocality: string; destinationLocality: string } }>, reply: FastifyReply): Promise<void> {
        const { arrivalLocality, destinationLocality } = request.params;

        if (!arrivalLocality?.trim() || !destinationLocality?.trim()) {
            reply.status(400).send({ error: 'I parametri "arrivalLocality" e "destinationLocality" sono obbligatori' });
            return;
        }

        try {
            const poles = await this.polesService.getPolesByArrivalAndDestinationLocality(arrivalLocality, destinationLocality);
            reply.status(200).send(poles);
        } catch (error) {
            request.log.error(error, 'Error getting pole by arrival and destination locality');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }

    public async getAllPolesDestinationsByArrivalLocality(
        request: FastifyRequest<{ Params: { arrivalLocality: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const { arrivalLocality } = request.params;

        if (!arrivalLocality?.trim()) {
            reply.status(400).send({ error: 'Il parametro "arrivalLocality" è obbligatorio' });
            return;
        }

        try {
            const destinations = await this.polesService.getAllPolesDestinationsByArrivalLocality(arrivalLocality);
            reply.status(200).send(destinations);
        } catch (error) {
            request.log.error(error, `Error getting all destinations by arrival locality "${arrivalLocality}"`);
            reply.status(500).send({ error: 'Failed to retrieve destinations' });
        }
    }

    public async getFavoritePoles(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply): Promise<void> {
        const userId = parseInt(request.params.userId, 10);

        if (isNaN(userId)) {
            reply.status(400).send({ error: 'Il parametro "userId" deve essere un numero valido' });
            return;
        }

        try {
            const favoritePoles = await this.polesService.getFavoritePoles(userId);
            reply.status(200).send(favoritePoles);
        } catch (error) {
            request.log.error(error, `Error getting favorite poles for user "${userId}"`);
            reply.status(500).send({ error: 'Failed to retrieve favorite poles' });
        }
    }

    public async addFavoritePole(request: FastifyRequest<{ Body: { userId: number; poleCode: string; poleLat: number; poleLon: number } }>, reply: FastifyReply): Promise<void> {
        const { userId, poleCode, poleLat, poleLon } = request.body;

        if (userId === undefined || userId === null || !poleCode) {
            reply.status(400).send({ error: 'I parametri "userId" e "poleCode" sono obbligatori' });
            return;
        }

        try {
            this.polesService.addFavoritePole(userId, poleCode, poleLat || 0, poleLon || 0);
            reply.status(201).send({ message: 'Pole added to favorites' });
        } catch (error) {
            request.log.error(error, 'Error adding favorite pole');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }

    public async removeFavoritePole(request: FastifyRequest<{ Body: { userId: number; poleCode: string } }>, reply: FastifyReply): Promise<void> {
        const { userId, poleCode } = request.body;

        if (userId === undefined || userId === null || !poleCode) {
            reply.status(400).send({ error: 'I parametri "userId" e "poleCode" sono obbligatori' });
            return;
        }

        try {
            this.polesService.removeFavoritePole(userId, poleCode);
            reply.status(200).send({ message: 'Pole removed from favorites' });
        } catch (error) {
            request.log.error(error, 'Error removing favorite pole');
            reply.status(500).send({ error: 'Internal server error' });
        }
    }
}
