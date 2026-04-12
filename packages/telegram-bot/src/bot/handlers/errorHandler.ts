import { Context } from "telegraf";
import { logger } from "../../utils/logger";
import axios from "axios";

export async function handleErrors(ctx: Context, error: unknown) {
    logger.error('Errore nel bot Telegram', error, { userId: ctx.from?.id });

    let userMessage: string;

    if (axios.isAxiosError(error)) {
        if (!error.response) {
            userMessage = '\u26A0\uFE0F <b>Server non raggiungibile</b>\n\nIl server non risponde al momento.\nRiprova tra qualche minuto.';
        } else if (error.response.status >= 500) {
            userMessage = '\u26A0\uFE0F <b>Servizio temporaneamente non disponibile</b>\n\nIl servizio Cotral sta riscontrando problemi.\nRiprova tra qualche minuto.';
        } else if (error.response.status === 404) {
            userMessage = '\u{1F50D} <b>Nessun risultato trovato</b>\n\nLa risorsa richiesta non esiste.\nVerifica i dati inseriti e riprova.';
        } else if (error.response.status === 400) {
            userMessage = '\u26A0\uFE0F <b>Dati non validi</b>\n\nI parametri inseriti non sono corretti.\nControlla e riprova.\n\n<i>Suggerimento: usa i pulsanti del menu per un inserimento guidato.</i>';
        } else {
            userMessage = '\u26A0\uFE0F <b>Errore di comunicazione</b>\n\nSi \u00e8 verificato un problema con il server.\nRiprova.';
        }
    } else if (error instanceof Error && error.message.includes('timeout')) {
        userMessage = '\u{1F552} <b>Tempo scaduto</b>\n\nLa richiesta ha impiegato troppo tempo.\nRiprova tra qualche istante.';
    } else {
        userMessage = '\u26A0\uFE0F <b>Errore imprevisto</b>\n\nSi \u00e8 verificato un errore inatteso.\nRiprova pi\u00f9 tardi o riavvia con /start.';
    }

    try {
        await ctx.reply(userMessage);
    } catch (replyError) {
        logger.error('Impossibile inviare messaggio di errore all\'utente', replyError);
    }
}
