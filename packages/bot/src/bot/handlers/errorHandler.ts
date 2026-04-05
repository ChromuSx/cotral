import { Context } from "telegraf";
import { logger } from "../../utils/logger";
import axios from "axios";

export async function handleErrors(ctx: Context, error: unknown) {
    logger.error('Errore nel bot Telegram', error, { userId: ctx.from?.id });

    let userMessage: string;

    if (axios.isAxiosError(error)) {
        if (!error.response) {
            userMessage = 'Il server non è raggiungibile al momento. Riprova tra qualche minuto.';
        } else if (error.response.status >= 500) {
            userMessage = 'Il servizio Cotral sta riscontrando problemi. Riprova più tardi.';
        } else if (error.response.status === 404) {
            userMessage = 'La risorsa richiesta non è stata trovata.';
        } else if (error.response.status === 400) {
            userMessage = 'I parametri forniti non sono validi. Controlla e riprova.';
        } else {
            userMessage = 'Si è verificato un errore nella comunicazione con il server.';
        }
    } else if (error instanceof Error && error.message.includes('timeout')) {
        userMessage = 'La richiesta ha impiegato troppo tempo. Riprova.';
    } else {
        userMessage = 'Si è verificato un errore imprevisto. Riprova più tardi.';
    }

    try {
        await ctx.reply(userMessage);
    } catch (replyError) {
        logger.error('Impossibile inviare messaggio di errore all\'utente', replyError);
    }
}
