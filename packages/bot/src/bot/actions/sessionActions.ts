import { ExtendedContext } from "../../interfaces/ExtendedContext";
import * as polesApiHandler from '../../apiHandlers/polesApiHandler';
import * as stopsApiHandler from '../../apiHandlers/stopsApiHandler';
import * as transitsApiHandler from '../../apiHandlers/transitsApiHandler';
import * as vehiclesApiHandler from '../../apiHandlers/vehiclesApiHandler';
import { PolesCommands } from "../../commands/polesCommands";
import { StopsCommands } from "../../commands/stopsCommands";
import { VehiclesCommands } from "../../commands/vehiclesCommands";
import { TransitsCommands } from "../../commands/transitsCommands";

export const sessionActions: Record<string, (ctx: ExtendedContext, text: string, userId?: number) => Promise<void>> = {
    [PolesCommands.GetPolesByCode]: async (ctx, text, userId) => await polesApiHandler.getPolesByCode(ctx, text, { userId }),
    [PolesCommands.GetPoleByArrivalAndDestination]: async (ctx, text) => {
        if (ctx.session.step === 'arrival') {
            if (!ctx.session.params) ctx.session.params = {};
            ctx.session.params.arrival = text;
            ctx.session.step = 'destination';
            await ctx.reply(`Inserisci la destinazione:`);
        } else if (ctx.session.step === 'destination') {
            if (!ctx.session.params) ctx.session.params = {};
            ctx.session.params.destination = text;
            await polesApiHandler.getPoleByArrivalAndDestinationLocality(ctx, {
                arrival: ctx.session.params.arrival!,
                destination: ctx.session.params.destination!
            });
            ctx.session.command = undefined;
            ctx.session.step = undefined;
            ctx.session.params = {};
        }
    },
    [PolesCommands.GetAllPolesDestinationsByArrival]: async (ctx, text) => await polesApiHandler.getAllPolesDestinationsByArrivalLocality(ctx, text),
    [StopsCommands.GetStopsByLocality]: async (ctx, text) => await stopsApiHandler.getStopsByLocality(ctx, text),
    [StopsCommands.GetFirstStopByLocality]: async (ctx, text) => await stopsApiHandler.getFirstStopByLocality(ctx, text),
    [TransitsCommands.GetTransitsByPoleCode]: async (ctx, text) => await transitsApiHandler.getTransitsByPoleCode(ctx, text),
    [VehiclesCommands.GetVehicleRealTimePositions]: async (ctx, text) => await vehiclesApiHandler.getVehicleRealTimePositions(ctx, text),
};
