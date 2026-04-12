# Cotral Telegram Bot

<div align="center">
  <img src="logo.png" alt="CotralTelegramBot" width="200">
</div>

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/ChromuSx)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/chromus)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/chromus)
[![PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/giovanniguarino1999)

**Bot Telegram per il trasporto pubblico Cotral**

</div>

## Descrizione

Bot Telegram per accedere in tempo reale alle informazioni del trasporto pubblico Cotral: fermate, paline, transiti, posizioni veicoli e gestione preferiti. Comunica con il [Cotral Server API](https://github.com/ChromuSx/cotral-server-api) che deve essere in esecuzione.

## Funzionalita'

### Paline
| Comando | Descrizione |
|---------|-------------|
| `/getfavoritepoles` | Paline preferite |
| `/getpolesbycode` | Cerca per codice fermata |
| `/getpolesbyposition` | Cerca per posizione GPS |
| `/getpolebyarrivalanddestination` | Cerca per arrivo e destinazione |
| `/getallpolesdestinationsbyarrival` | Destinazioni disponibili da una localita' |

### Fermate
| Comando | Descrizione |
|---------|-------------|
| `/getstopsbylocality` | Fermate per localita' |
| `/getfirststopbylocality` | Prima fermata per localita' |

### Transiti e Veicoli
| Comando | Descrizione |
|---------|-------------|
| `/gettransitsbypolecode` | Transiti real-time per palina |
| `/getvehiclerealtimepositions` | Posizione GPS veicolo |

## Prerequisiti

- **Node.js** >= 18.x
- **[Cotral Server API](https://github.com/ChromuSx/cotral-server-api)** in esecuzione
- **Token Telegram Bot** (da [@BotFather](https://t.me/botfather))

## Installazione

```bash
git clone https://github.com/ChromuSx/cotral-telegram-bot.git
cd cotral-telegram-bot
npm install
```

## Configurazione

Crea un file `.env` (oppure copia `.env.example`):

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
API_BASE_URL=http://localhost:3000
SESSION_DB_PATH=session_db.json
LOG_LEVEL=info
```

## Avvio

Assicurati che il Cotral Server API sia in esecuzione, poi:

```bash
npm start
```

## Architettura

```
cotral-telegram-bot/
├── src/
│   ├── bot/
│   │   ├── bot.ts              # Inizializzazione bot e menu
│   │   ├── actions/
│   │   │   ├── commandActions.ts   # Handler comandi da testo/keyboard
│   │   │   ├── sessionActions.ts   # Handler flussi multi-step
│   │   │   ├── polesBotActions.ts  # Azioni inline paline
│   │   │   ├── stopsbotActions.ts  # Menu fermate
│   │   │   ├── transitsBotActions.ts   # Menu transiti
│   │   │   └── vehiclesBotActions.ts   # Menu veicoli
│   │   └── handlers/
│   │       ├── commandHandler.ts       # Dispatcher comandi
│   │       ├── callbackQueryHandler.ts # Handler pulsanti inline
│   │       ├── locationHandler.ts      # Handler posizione GPS
│   │       └── errorHandler.ts         # Gestione errori
│   ├── apiHandlers/        # Comunicazione con il server API
│   ├── commands/            # Enum comandi
│   ├── interfaces/          # TypeScript interfaces
│   ├── services/
│   │   └── axiosService.ts  # Client HTTP verso server API
│   ├── utils/
│   │   ├── apiUtils.ts      # Gestione risposte API + rendering
│   │   ├── functions.ts     # Validazione coordinate, formatting
│   │   ├── logger.ts        # Logging strutturato
│   │   └── telegrafUtils.ts # Helper Telegraf
│   └── app.ts               # Entry point
└── session_db.json          # Sessioni utente (generato)
```

## Flusso interazione

1. L'utente avvia il bot con `/start`
2. Il menu principale mostra: Paline, Fermate, Transiti, Veicoli
3. Ogni sezione ha un sotto-menu con le opzioni disponibili
4. Le paline preferite appaiono come pulsanti rapidi nel menu principale
5. I transiti mostrano pulsanti inline per vedere il veicolo associato

## Test

```bash
npm test
```

## Licenza

MIT - Vedi `LICENSE`

## Autore

**Giovanni Guarino** - [@ChromuSx](https://github.com/ChromuSx)
