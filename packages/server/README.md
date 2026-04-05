# Cotral Server API

<div align="center">
  <img src="logo.png" alt="CotralServerAPI" width="200">
</div>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white)](https://github.com/sponsors/ChromuSx)
[![Ko-fi](https://img.shields.io/badge/Support-Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/chromus)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/chromus)
[![PayPal](https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/giovanniguarino1999)

**API REST per l'accesso ai dati del trasporto pubblico Cotral**

[Documentazione API](./OpenAPI.yaml) | [Segnala Bug](https://github.com/ChromuSx/cotral-server-api/issues)

</div>

## Descrizione

Cotral Server API e' un servizio backend TypeScript che fornisce dati del trasporto pubblico Cotral. Utilizza i dati GTFS (General Transit Feed Specification) come fonte primaria per fermate, paline e percorsi, con fallback sulle API XML di Cotral per i dati in tempo reale (transiti e posizioni veicoli).

## Caratteristiche

- **Dati GTFS offline** - Fermate, paline e percorsi caricati dai file GTFS Cotral (download automatico se assenti)
- **Transiti real-time** - Monitoraggio arrivi in tempo reale tramite API Cotral
- **Tracking veicoli** - Posizioni GPS dei veicoli in servizio
- **Gestione preferiti** - Paline preferite per utente con persistenza SQLite
- **Auto-reload GTFS** - Ricarica automatica quando i file vengono aggiornati
- **API RESTful** con documentazione OpenAPI

## Stack Tecnologico

| Tecnologia | Utilizzo |
|------------|----------|
| **TypeScript** | Linguaggio principale |
| **Fastify** | Framework web |
| **better-sqlite3** | Database per preferiti |
| **Axios** | Client HTTP per API Cotral |
| **xml2js** | Parser XML per risposte Cotral |
| **adm-zip** | Estrazione ZIP GTFS |
| **Vitest** | Test framework |

## Architettura

```
packages/server/
├── src/
│   ├── controllers/        # Gestione richieste HTTP
│   ├── services/           # Logica di business
│   │   ├── gtfsService.ts  # Caricamento e query dati GTFS
│   │   ├── polesService.ts # Paline (GTFS + API fallback)
│   │   ├── stopsService.ts # Fermate (GTFS + API fallback)
│   │   ├── transitsService.ts  # Transiti real-time (API)
│   │   └── vehiclesService.ts  # Posizioni veicoli (API)
│   ├── routes/             # Definizione route Fastify
│   ├── utils/
│   │   ├── cotralApi.ts    # Helper chiamate API Cotral
│   │   ├── gtfsDownloader.ts   # Download automatico GTFS
│   │   └── timeUtils.ts    # Conversione tempi
│   ├── config.ts           # Configurazione centralizzata
│   ├── database.ts         # Gestione SQLite
│   └── app.ts              # Entry point
├── GTFS_COTRAL/            # File GTFS (scaricati automaticamente)
├── OpenAPI.yaml            # Documentazione API
└── database.sqlite         # Database preferiti (generato)
```

## Prerequisiti

- **Node.js** >= 18.x
- **npm** >= 8.x

## Installazione

```bash
git clone https://github.com/ChromuSx/cotral-server-api.git
cd cotral-server-api
npm install
```

## Configurazione

Crea un file `.env` (oppure copia `.env.example`):

```env
PORT=3000
HOST=127.0.0.1
DB_PATH=./database.sqlite
GTFS_PATH=./GTFS_COTRAL
GTFS_URL=https://travel.mob.cotralspa.it:4443/GTFS/GTFS_COTRAL.zip
COTRAL_BASE_URL=http://travel.mob.cotralspa.it:7777/beApp
COTRAL_USER_ID=your_user_id_here
COTRAL_DELTA=261
```

I dati GTFS vengono scaricati automaticamente al primo avvio se la cartella `GTFS_COTRAL` non esiste.

## Avvio

```bash
npm start
```

Il server:
1. Verifica la presenza dei file GTFS, li scarica se assenti (~52 MB)
2. Carica i dati GTFS in memoria (~14.000 fermate, ~4.300 linee)
3. Avvia il server su `http://localhost:3000`

## API Endpoints

### Fermate (Stops)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/stops/{locality}` | Fermate per localita' |
| GET | `/stops/firststop/{locality}` | Prima fermata per localita' |

### Paline (Poles)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/poles/{stopCode}` | Paline vicine a un codice fermata |
| GET | `/poles/position?latitude=X&longitude=Y&range=R` | Paline per posizione GPS |
| GET | `/poles/{arrival}/{destination}` | Paline per percorso |
| GET | `/poles/destinations/{arrivalLocality}` | Destinazioni disponibili |
| GET | `/poles/favorites/{userId}` | Paline preferite |
| POST | `/poles/favorites` | Aggiungi preferito (`{userId, poleCode, poleLat, poleLon}`) |
| DELETE | `/poles/favorites` | Rimuovi preferito (`{userId, poleCode}`) |

### Transiti (Transits)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/transits/{poleCode}` | Transiti real-time per palina |

### Veicoli (Vehicles)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/vehiclerealtimepositions/{vehicleCode}` | Posizione GPS veicolo |

## Test

```bash
npm test
```

## Note tecniche

- **GTFS come fonte primaria**: le ricerche fermate/paline usano i dati GTFS locali (istantanei). L'API Cotral XML e' usata come fallback e per i dati real-time (transiti, veicoli)
- **cmd=5 dell'API Cotral e' rotto**: non restituisce mai paline. Il workaround usa le coordinate GPS dal GTFS + cmd=7
- **Lat/lon swap in cmd=1**: l'API Cotral inverte latitudine/longitudine per molte paline. Il server normalizza automaticamente
- **Auto-reload GTFS**: i file vengono ricontrollati ogni 60 secondi. Se aggiornati, i dati vengono ricaricati atomicamente

## Licenza

MIT - Vedi [LICENSE](LICENSE)

## Autore

**Giovanni Guarino** - [@ChromuSx](https://github.com/ChromuSx)
