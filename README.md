# Cotral

<div align="center">
  <img src="logo.png" alt="Cotral" width="200">
</div>

<div align="center">

<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
<img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License: MIT">

</div>

<p align="center">
  <a href="https://github.com/sponsors/ChromuSx"><img src="https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/chromus"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://buymeacoffee.com/chromus"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
  <a href="https://www.paypal.com/paypalme/giovanniguarino1999"><img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>

<div align="center">

**Monorepo per il trasporto pubblico Cotral: server API + bot Telegram + bot Discord**

</div>

## 📖 Panoramica

Stack completo per consultare il trasporto pubblico Cotral (Lazio): un server API che unifica i dati GTFS offline e le API XML Cotral in tempo reale, più due bot (Telegram e Discord) che lo consumano.

## 📦 Pacchetti

| Pacchetto | Descrizione |
|-----------|-------------|
| [`@cotral/server`](packages/server) | API REST Fastify. GTFS come fonte primaria, API Cotral per real-time, SQLite per i preferiti |
| [`@cotral/telegram-bot`](packages/telegram-bot) | Bot Telegram (Telegraf) con menu inline, preferiti, transiti real-time |
| [`@cotral/discord-bot`](packages/discord-bot) | Bot Discord (discord.js) con slash commands, autocomplete e select menu |
| [`@cotral/shared`](packages/shared) | Tipi TypeScript e utility condivise tra i pacchetti |

## 🔧 Prerequisiti

- **Node.js** >= 18.x
- **npm** >= 8.x (workspaces)
- Per il deploy in container: **Docker** + **Docker Compose**

## 🚀 Installazione

```bash
git clone https://github.com/ChromuSx/cotral.git
cd cotral
npm install      # installa le dipendenze di tutti i workspace
```

## ⚙️ Configurazione

Ogni pacchetto ha il proprio `.env` (gitignored). Vedi i README dei singoli pacchetti per le variabili specifiche:

- [`@cotral/server`](packages/server/README.md#configurazione)
- [`@cotral/telegram-bot`](packages/telegram-bot/README.md#configurazione)
- [`@cotral/discord-bot`](packages/discord-bot/README.md#configurazione)

Per il deploy con Docker, le credenziali vivono in un `.env` nella root usato da `docker-compose.yml`:

```env
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
ALLOWED_USER_IDS=...
DISCORD_ALLOWED_USER_IDS=...
```

## 💻 Sviluppo locale (senza Docker)

```bash
npm run build                    # build di tutti i workspace
npm run start:server             # avvia il server (porta 3000)
npm run start:telegram-bot       # in un altro terminale
npm run start:discord-bot        # in un altro terminale
npm run deploy-commands:discord  # registra/aggiorna gli slash commands su Discord
```

Build del singolo workspace:

```bash
npm run build:shared
npm run build:server
npm run build:telegram-bot
npm run build:discord-bot
```

## 🐳 Avvio con Docker

Stack completo (server + entrambi i bot):

```bash
docker compose up -d --build
```

Caratteristiche:
- `server` espone l'API su `localhost:3001` (mappato sul `3000` interno)
- `telegram-bot` e `discord-bot` parlano col server tramite la rete interna del compose
- Tutti i container girano in `Europe/Rome` (`TZ` impostato sia in `docker-compose.yml` che nel `Dockerfile` con `tzdata`)
- Volumi nominati per persistenza GTFS / SQLite / sessioni Telegram

## 🧪 Test

```bash
npm test                       # esegue i test di tutti i workspace
npm run test:server
npm run test:telegram-bot
npm run test:discord-bot
```

## 📂 Struttura del repository

```
cotral/
├── packages/
│   ├── shared/          # tipi e util condivise
│   ├── server/          # API REST
│   ├── telegram-bot/    # bot Telegram
│   └── discord-bot/     # bot Discord
├── Dockerfile           # multi-stage: build comune + 3 immagini finali
├── docker-compose.yml   # stack server + bot
└── package.json         # workspaces npm
```

## 💖 Supporta il progetto

Questo progetto è libero e open source. Se lo trovi utile, considera di supportarne lo sviluppo — ogni contributo è prezioso e davvero apprezzato! ❤️

<p align="center">
  <a href="https://github.com/sponsors/ChromuSx"><img src="https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="GitHub Sponsors"></a>
  <a href="https://ko-fi.com/chromus"><img src="https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi"></a>
  <a href="https://buymeacoffee.com/chromus"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me a Coffee"></a>
  <a href="https://www.paypal.com/paypalme/giovanniguarino1999"><img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>

## 📄 Licenza

MIT — vedi [LICENSE](LICENSE).

## 👤 Autore

**Giovanni Guarino** — [@ChromuSx](https://github.com/ChromuSx)

<div align="center">
  <sub>Realizzato con ❤️ da <a href="https://github.com/ChromuSx">Giovanni Guarino</a></sub>
</div>
