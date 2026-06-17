# Cotral API OSINT reconnaissance

Data: 2026-06-17

## Ambito e metodo

Ricognizione OSINT non invasiva sull'app Android ufficiale Cotral (`it.cotralspa.app`) e sugli endpoint pubblicamente raggiungibili. Non sono stati usati account, credenziali, token privati o bypass di autenticazione.

Artifact locale analizzato:

- `/home/giovanniguarino/work/cotral-osint/apk/it.cotralspa.app.xapk`
- App version: `5.0.4`
- Android package: `it.cotralspa.app`

Tool usati:

- `apkeep` per download XAPK da APKPure
- unzip/estrazione risorse
- `androguard` in venv locale per stringhe DEX
- probing HTTP controllato con Python stdlib

## Host/API base trovati

- Legacy già in uso nel progetto:
  - `http://travel.mob.cotralspa.it:7777/beApp/PIV.do`
  - `http://travel.mob.cotralspa.it:7777/beApp/Automezzi.do`
- Nuovo backend app Android:
  - `https://servizi.cotralspa.it:4444/`
- Login/account:
  - `https://servizi.cotralspa.it:4444/mw-travelCRMSF/app/loginhandler`
- Ticketing/payment web:
  - `https://ecommerce.ticketing.cotralspa.it/app/purchase/basket`
  - `https://ecommerce.ticketing.cotralspa.it/app/purchase/feedback`
  - `https://ecommerce.ticketing.cotralspa.it/eservice/nexi-notifications`

Nota: l'APK contiene riferimenti a chiavi/JWT/cache/token, ma non vanno riportati né riutilizzati. Gli endpoint che rispondono `401 Autorizzazione non valida` sono da trattare come non integrabili senza un flusso ufficiale/autorizzato.

## Endpoint estratti dall'APK

### `mw-travelCotralBE`

```text
mw-travelCotralBE/v1/checkIn/dettaglioFermate
mw-travelCotralBE/v1/checkIn/saveTratta
mw-travelCotralBE/v1/favourites/delete
mw-travelCotralBE/v1/favourites/list
mw-travelCotralBE/v1/live/busfill
mw-travelCotralBE/v1/live/busposition
mw-travelCotralBE/v1/orari
mw-travelCotralBE/v1/orari/orari-corse
mw-travelCotralBE/v1/place/autocomplete/destinationByOrigin
mw-travelCotralBE/v1/place/autocomplete/originByInput
mw-travelCotralBE/v1/place/autocomplete/stop-destination
mw-travelCotralBE/v1/place/autocomplete/stop-origin
mw-travelCotralBE/v1/route/ride/search
mw-travelCotralBE/v1/route/search
mw-travelCotralBE/v1/route/train
mw-travelCotralBE/v1/signals/insert
mw-travelCotralBE/v1/stop/palina
mw-travelCotralBE/v1/stop/palina/address
mw-travelCotralBE/v1/stop/search/address
mw-travelCotralBE/v1/stop/search/description
mw-travelCotralBE/v2/abitudini-viaggio/
mw-travelCotralBE/v2/bus/real-time-position/all
mw-travelCotralBE/v2/bus/real-time-trips
mw-travelCotralBE/v2/bus/real-time-trips-by-stop
mw-travelCotralBE/v2/checkIn/listaRagioni
mw-travelCotralBE/v2/checkIn/saveVotoCorsa
mw-travelCotralBE/v2/favourites/by-position
mw-travelCotralBE/v2/favourites/set
mw-travelCotralBE/v2/game/get-token-user
mw-travelCotralBE/v2/news/all-active
mw-travelCotralBE/v2/news/by-id
mw-travelCotralBE/v2/notification/list
mw-travelCotralBE/v2/place/autocomplete/destination-ferro
mw-travelCotralBE/v2/place/autocomplete/origin-ferro
mw-travelCotralBE/v2/poi/
mw-travelCotralBE/v2/poi/generic/
mw-travelCotralBE/v2/poi/generic/{id}
mw-travelCotralBE/v2/poi/home/
mw-travelCotralBE/v2/poi/home/{id}
mw-travelCotralBE/v2/poi/workplace/
mw-travelCotralBE/v2/poi/workplace/{id}
mw-travelCotralBE/v2/route/ride
mw-travelCotralBE/v2/ticket/validation-event
mw-travelCotralBE/v2/train/real-time-trips
mw-travelCotralBE/v3/favourites/all
mw-travelCotralBE/v3/favourites/set
mw-travelCotralBE/v3/route/tracciato-percorso
mw-travelCotralBE/v3/stop/palina/position
mw-travelCotralBE/v4/news/all-active
mw-travelCotralBE/v4/news/by-ids
```

### `mw-timetables`

```text
mw-timetables/v2/train/arrivals
mw-timetables/v2/train/departures
mw-timetables/v2/train/routelist
mw-timetables/v2/train/stopsroute
mw-timetables/v2/train/transitstation
mw-timetables/v3/bus/searchTimetablesByStops
mw-timetables/v3/train/searchByLocation
```

### `mw-coreTicketing`

```text
mw-coreTicketing/v1/tickets/payments
mw-coreTicketing/v1/tickets/purchase
mw-coreTicketing/v1/tickets/route
mw-coreTicketing/v1/tickets/transaction
mw-coreTicketing/v1/tickets/transactionKO
mw-coreTicketing/v1/tickets/validation
mw-coreTicketing/v2/basket/checkout-basket/{basketId}
mw-coreTicketing/v2/basket/create-basket
mw-coreTicketing/v2/basket/{basketId}/items
mw-coreTicketing/v2/basket/{basketId}/items/{itemId}
mw-coreTicketing/v2/basket/{basketId}/undo-check-out
mw-coreTicketing/v2/tickets/products/all
mw-coreTicketing/v2/tickets/validate
mw-coreTicketing/v2/tickets/{systemName}
mw-coreTicketing/v2/tickets/{userId}
```

### `mw-travelCRMSF`

```text
mw-travelCRMSF/app/loginhandler
mw-travelCRMSF/v1/faq/
mw-travelCRMSF/v2/contact/get/
mw-travelCRMSF/v2/contact/update/
mw-travelCRMSF/v2/oauth/logout
mw-travelCRMSF/v2/oauth/refreshtoken
mw-travelCRMSF/v2/oauth/validation
mw-travelCRMSF/v2/otp/check-otp
mw-travelCRMSF/v2/otp/send-otp
mw-travelCRMSF/v2/user/get/
mw-travelCRMSF/v2/user/update/
```

### Google/proxy travel

```text
mw-travelGMP/mw-travelGCP/v1/places/autocomplete
mw-travelGMP/mw-travelGCP/v1/route/findroute
```

## Probing controllato: risultati utili

Base: `https://servizi.cotralspa.it:4444/`

### Endpoint pubblici o semi-pubblici già promettenti

- `GET mw-travelCotralBE/v1/place/autocomplete/originByInput?input=roma`
  - Status: `200`
  - Payload: località/luoghi; esempio con `roma` ritorna `estratte: 64`.
  - Utilità: autocomplete località più moderno del legacy `PIV.do?cmd=6`, con ID numerici.

- `GET mw-travelCotralBE/v1/stop/search/description?input=roma`
  - Status: `200`
  - Payload: paline principali; esempio con `roma` ritorna `estratte: 12` con campi `codicePalina`, `nomePalina`, `coordX`, `coordY`, `localita`, `comune`.
  - Utilità: sostituto/integrazione più pulita per ricerca paline principali. Potrebbe migliorare UX su query ambigue tipo “Roma”, “Anagnina”, “Laurentina”.

- `GET mw-travelCotralBE/v1/live/busfill?id=4225`
  - Status con `id`: `200`
  - Payload: livello affollamento (`livello`), `dataEvento`, `automezzo`.
  - Esempio test: `{"livello":"-","dataEvento":"-","automezzo":"4225"}`.
  - Utilità: possibile campo extra nella scheda veicolo/transito se il bus ha un ID veicolo.

### Endpoint raggiungibili ma richiedono parametri non ancora ricostruiti

Rispondono `400 Dati non validi` senza i parametri esatti, non necessariamente autenticati:

- `mw-travelCotralBE/v1/place/autocomplete/destinationByOrigin`
- `mw-travelCotralBE/v1/place/autocomplete/stop-origin`
- `mw-travelCotralBE/v1/place/autocomplete/stop-destination`
- `mw-travelCotralBE/v1/stop/palina`
- `mw-travelCotralBE/v1/stop/palina/address`
- `mw-travelCotralBE/v1/stop/search/address`
- `mw-travelCotralBE/v1/live/busposition`
- `mw-travelCotralBE/v1/orari`
- `mw-travelCotralBE/v1/orari/orari-corse`
- `mw-timetables/v3/bus/searchTimetablesByStops`

### Endpoint protetti o da non integrare senza flusso autorizzato

Rispondono `401 Autorizzazione non valida`, quindi non vanno integrati tramite workaround:

- `mw-travelCotralBE/v2/news/all-active`
- `mw-travelCotralBE/v4/news/all-active`
- `mw-travelCotralBE/v4/news/by-ids`
- `mw-travelCotralBE/v2/bus/real-time-position/all`
- `mw-travelCotralBE/v2/bus/real-time-trips`
- `mw-travelCotralBE/v2/bus/real-time-trips-by-stop`
- `mw-travelCotralBE/v2/train/real-time-trips`
- `mw-timetables/v2/train/routelist`
- `mw-timetables/v2/train/departures`
- `mw-timetables/v2/train/arrivals`
- `mw-timetables/v2/train/stopsroute`
- `mw-timetables/v2/train/transitstation`

## Legacy `PIV.do` già confermato

Oltre agli endpoint già implementati nel progetto, una mini-enumerazione controllata `cmd=0..15` ha evidenziato:

- `cmd=1`: transiti palina, già in uso.
- `cmd=2`: ricerca stop ampia. Con `roma` ha risposto con circa `1083` stop.
- `cmd=6`: ricerca località/stop già in uso; con `roma` circa `150` risultati.
- `cmd=7`: ricerca paline da bounding box, già in uso.
- `cmd=9`: paline/terminal principali. Con `roma` ritorna terminal tipo Anagnina, Laurentina, Cornelia, Saxa Rubra.

## Opportunità per il bot/server

Priorità alta:

1. Aggiungere un client sperimentale read-only per `servizi.cotralspa.it:4444/mw-travelCotralBE/v1`.
2. Integrare `GET /v1/stop/search/description?input=` come endpoint server nuovo, ad esempio:
   - `GET /poles/search-v2?query=roma`
   - oppure usarlo internamente come fallback/suggest per `/poles/destinations`.
3. Integrare `GET /v1/place/autocomplete/originByInput?input=` come autocomplete località moderno, ad esempio:
   - `GET /localities/search-v2?query=roma`.
4. Integrare opzionalmente `GET /v1/live/busfill?id=` nella schermata veicolo/transito, con fallback silenzioso se payload è vuoto o `-`.

Priorità media:

5. Usare `PIV.do?cmd=9` per suggerimenti terminal/capolinea quando la query è generica.
6. Valutare `PIV.do?cmd=2` come ricerca stop estesa, ma attenzione al volume: con query generiche produce molti risultati.

Da rimandare:

7. Route planning, treni realtime, news, notifiche e ticketing: l'APK mostra endpoint moderni ma molti richiedono autorizzazione o parametri complessi. Meglio non forzare: servirebbe osservazione dinamica dell'app con account/test device autorizzato e solo per funzioni non sensibili.

## Autorizzazione endpoint moderni

Dall'analisi statica dell'APK emerge questo schema:

- L'app usa un interceptor OkHttp/Retrofit (`CotralBeInterceptor`) che legge annotazioni sui metodi API.
- Le chiamate annotate con un tipo JWT ricevono un header `Authorization` con token Bearer applicativo.
- I tipi JWT dichiarati sono:
  - `TIMETABLE`
  - `TRAVELCOTRAL_BE`
  - `TRAVEL_GMP`
  - `TRAVEL_CRMSF`
  - `CORETICKETING`
  - `NO_JWT`
- Il JWT app è generato localmente dall'app con algoritmo `HS256`, subject `cotral-app`, durata breve circa 3 minuti, cache interna e refresh quando sta per scadere.
- Le chiavi/segreti hardcoded estratti dall'APK non sono documentati qui e non devono essere riusati nel nostro backend.
- Se esiste una sessione utente, l'interceptor aggiunge anche:
  - header `Authorization` con token Bearer utente per il token account/sessione,
  - `x-user-id`,
  - `x-contact-id`,
  - `x-account-id`.
- Alcune chiamate annotate `UserId` aggiungono un header `userId` applicativo legacy.
- Header generali aggiunti dall'app:
  - `Accept-Language`,
  - `x-platform-type: android`.

Interpretazione pratica:

- Gli endpoint `401` non sono semplicemente “pubblici con parametro mancante”: richiedono un JWT applicativo Cotral e, in diversi casi, anche una vera sessione utente.
- Per il nostro bot/server non conviene replicare o incorporare i segreti dell'APK: sarebbe fragile e discutibile sul piano autorizzativo.
- Possiamo invece usare solo gli endpoint che rispondono senza token, oppure chiedere/ottenere accesso ufficiale Cotral, oppure usare flussi utente espliciti solo se necessari e consentiti.

## Matrice operativa senza utente loggato

Per il bot/server, ignorando tutto ciò che riguarda utenti loggati, la classificazione diventa:

### Verde: integrabile subito, no auth osservata

Questi endpoint sono stati riprovati con chiamate controllate e rispondono `200` senza token:

```text
GET mw-travelCotralBE/v1/place/autocomplete/originByInput?input=anagnina
GET mw-travelCotralBE/v1/stop/search/description?input=anagnina
GET mw-travelCotralBE/v1/live/busfill?id=4225
```

Output osservato:

- autocomplete località: `anagnina` ritorna `Roma Anagnina` con id `998008303`.
- ricerca paline: `anagnina` ritorna 12 paline, inclusa `f3583` Anagnina Metro A, con coordinate.
- affollamento bus: `id=4225` ritorna payload valido ma spesso senza dato reale (`livello: "-"`).

### Giallo: informativo, non personale, ma protetto o non ancora parametrizzato

Questi endpoint sono utili per trasporto pubblico, non sono legati a profilo/ticket/account, ma non sono integrabili subito perché rispondono `401` senza JWT applicativo oppure `400` senza parametri esatti:

```text
mw-travelCotralBE/v2/bus/real-time-position/all
mw-travelCotralBE/v2/bus/real-time-trips
mw-travelCotralBE/v2/bus/real-time-trips-by-stop
mw-travelCotralBE/v2/train/real-time-trips
mw-timetables/v2/train/routelist
mw-timetables/v2/train/departures
mw-timetables/v2/train/arrivals
mw-timetables/v2/train/stopsroute
mw-timetables/v2/train/transitstation
mw-timetables/v3/bus/searchTimetablesByStops
mw-timetables/v3/train/searchByLocation
mw-travelCotralBE/v1/live/busposition
mw-travelCotralBE/v1/orari
mw-travelCotralBE/v1/orari/orari-corse
mw-travelCotralBE/v1/route/search
mw-travelCotralBE/v1/route/ride/search
mw-travelCotralBE/v2/route/ride
mw-travelCotralBE/v3/route/tracciato-percorso
mw-travelCotralBE/v3/stop/palina/position
mw-travelCotralBE/v2/news/all-active
mw-travelCotralBE/v4/news/all-active
mw-travelCotralBE/v4/news/by-ids
```

Probing aggiuntivo osservato:

- `mw-travelCotralBE/v3/stop/palina/position?...` -> `401 Autorizzazione non valida`.
- `mw-travelCotralBE/v2/news/all-active` -> `401 Autorizzazione non valida`.
- `mw-travelCotralBE/v2/bus/real-time-position/all` -> `401 Autorizzazione non valida`.
- `mw-timetables/v2/train/routelist` -> `401 Autorizzazione non valida`.
- `mw-timetables/v3/train/searchByLocation?input=roma` -> `400 Dati non validi`.

Decisione: non usare segreti/JWT dell'APK. Se un endpoint giallo è strategico, serve accesso ufficiale o un'alternativa legacy/pubblica.

### Rosso: fuori perimetro perché utente/account/ticketing/scrittura

Da ignorare per scelta progettuale:

```text
mw-coreTicketing/*
mw-travelCRMSF/*
mw-travelCotralBE/*/favourites/*
mw-travelCotralBE/*/checkIn/*
mw-travelCotralBE/*/poi/*
mw-travelCotralBE/v2/abitudini-viaggio/*
mw-travelCotralBE/v2/notification/list
mw-travelCotralBE/v1/signals/insert
mw-travelCotralBE/v2/game/get-token-user
```

## Prossimo step tecnico consigliato

Implementare dietro feature flag/env:

- `COTRAL_APP_API_BASE=https://servizi.cotralspa.it:4444`
- timeout breve, user-agent identificabile, rate limit/cache.
- mapping normalizzato verso i tipi server esistenti.
- test con mock HTTP per payload success/errore.

Endpoint candidato MVP:

```http
GET /localities/search-v2?query=roma
GET /poles/search-v2?query=roma
GET /vehicles/:vehicleId/fill-level
```

Non usare né committare credenziali/token/JWT estratti dall'APK.
