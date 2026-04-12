# Cotral

Monorepo per il sistema di trasporto pubblico Cotral: API REST + Bot Telegram + Bot Discord.

## Packages

| Package | Descrizione |
|---------|-------------|
| [@cotral/server](packages/server/) | API REST Fastify con integrazione GTFS e dati real-time Cotral |
| [@cotral/telegram-bot](packages/telegram-bot/) | Bot Telegram per accesso utente al trasporto Cotral |
| [@cotral/discord-bot](packages/discord-bot/) | Bot Discord per accesso utente al trasporto Cotral |
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
npm run start:telegram-bot

# Avvia il bot Discord (terminale 3)
npm run deploy-commands:discord    # prima volta / quando cambi i comandi
npm run start:discord-bot
```

## Configurazione

Ogni package ha il proprio `.env` (copia da `.env.example`):

```bash
cp packages/server/.env.example packages/server/.env
cp packages/telegram-bot/.env.example packages/telegram-bot/.env
cp packages/discord-bot/.env.example packages/discord-bot/.env
```

Configura:
- `TELEGRAM_BOT_TOKEN` nel bot Telegram
- `DISCORD_BOT_TOKEN` e `DISCORD_CLIENT_ID` nel bot Discord
- Il server scarichera' automaticamente i dati GTFS al primo avvio

## Sviluppo

```bash
npm run build:shared          # Build solo interfacce condivise
npm run build:server          # Build solo server
npm run build:telegram-bot    # Build solo bot Telegram
npm run build:discord-bot     # Build solo bot Discord
npm test                      # Test tutti i packages
```

## Licenza

MIT

## Autore

**Giovanni Guarino** - [@ChromuSx](https://github.com/ChromuSx)
