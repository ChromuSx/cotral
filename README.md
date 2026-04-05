# Cotral

Monorepo per il sistema di trasporto pubblico Cotral: API REST + Bot Telegram.

## Packages

| Package | Descrizione |
|---------|-------------|
| [@cotral/server](packages/server/) | API REST Fastify con integrazione GTFS e dati real-time Cotral |
| [@cotral/bot](packages/bot/) | Bot Telegram per accesso utente al trasporto Cotral |
| [@cotral/shared](packages/shared/) | Interfacce TypeScript condivise (Pole, Stop, Transit, Vehicle) |

## Quick Start

```bash
# Installa tutte le dipendenze
npm install

# Build tutti i packages
npm run build

# Avvia il server API (terminale 1)
npm run start:server

# Avvia il bot Telegram (terminale 2)
npm run start:bot
```

## Configurazione

Ogni package ha il proprio `.env` (copia da `.env.example`):

```bash
cp packages/server/.env.example packages/server/.env
cp packages/bot/.env.example packages/bot/.env
```

Configura il `TELEGRAM_BOT_TOKEN` nel bot e il server scarichera' automaticamente i dati GTFS al primo avvio.

## Sviluppo

```bash
npm run build:shared     # Build solo interfacce condivise
npm run build:server     # Build solo server
npm run build:bot        # Build solo bot
npm test                 # Test tutti i packages
npm run test:server      # Test solo server
npm run test:bot         # Test solo bot
```

## Licenza

MIT

## Autore

**Giovanni Guarino** - [@ChromuSx](https://github.com/ChromuSx)
