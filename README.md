# Empire

Gestionale economico a turni in italiano, giocabile nel browser. Si parte con un capitale e una prima attività, e si cresce fino a un impero economico.

## Gioca

**https://alfa40.github.io/empire/**

Sul telefono puoi installarlo come app:
- **Android (Chrome):** menu ⋮ → "Installa app" oppure "Aggiungi a schermata Home".
- **iPhone (Safari):** tasto Condividi → "Aggiungi a schermata Home".

Dopo la prima apertura funziona anche senza connessione.

## Come avviarlo in locale

Apri `index.html` con un browser moderno (Edge, Chrome, Firefox). Non servono installazioni né connessione a Internet.

I salvataggi restano nel browser (5 slot e salvataggio automatico). Per fare un backup o spostare la partita su un altro dispositivo usa **Impostazioni → Esporta file / Importa file**.

## Interfaccia

- **Panoramica (Home):** tutto in una schermata corta.
  - Ogni attività ha 5 riquadri: Turni, Persone, Prezzi (o Produzione), Scorte, Macchine.
  - Verde = tutto ok, rosso = qualcosa da sistemare.
  - Tocca un riquadro per vedere i suoi elementi. Tocca un elemento (persona, prodotto, materiale, macchina, giorno) per aprirne la scheda e cambiarlo.
- **Pensata per il telefono:** menu in basso, finestre che compaiono dal basso, tabelle che diventano schede.
- **Testi minimi:** ogni schermata, indicatore e menu ha un tasto **?** con la spiegazione.
- **Giornata ora per ora:** clienti serviti e persi per ogni ora, con il motivo.
- **Turni:** griglia interattiva per giorno, con copertura oraria e clienti attesi.

## Contenuti

- **Calendario reale italiano**: ogni giorno è simulato con weekend, stagioni, festività (Pasqua calcolata), saldi, Black Friday, San Valentino, Ferragosto e meteo per città. Il tempo avanza solo su comando (1 giorno, 7 giorni, fine mese). L'avanzamento si ferma da solo quando serve una decisione.
- **21 tipi di attività**:
  - **12 negozi e servizi**: bar, panetteria, lavanderia, ristorante, pizzeria, gelateria, minimarket, abbigliamento, parrucchiere, palestra, officina, hotel.
  - **9 attività produttive**: azienda agricola, mulino, torrefazione, caseificio, pastificio, forno industriale, laboratorio tessile, birrificio, salumificio. Possono rifornire le tue attività (filiera) o vendere all'ingrosso.
- **10 città e 5 quartieri**, ognuno con passaggio, affitti, ricchezza e turismo diversi. In ogni zona ci sono concorrenti simulati che reagiscono alle tue mosse.
- **Dipendenti uno per uno**:
  - competenza, morale, stanchezza e tratti di carattere;
  - contratti (indeterminato, determinato, apprendistato, stagionale), turni giorno per giorno e ore;
  - straordinari, festivi, ferie, malattie, formazione, dimissioni, TFR e tredicesima.
- **Prodotti personalizzabili**: ricette, varianti, prezzi, sconti per i saldi. La qualità dipende da materie prime, personale e attrezzature.
- **Magazzino**:
  - tre fasce di fornitori, con prezzo, qualità e affidabilità diversi;
  - merci deperibili e riordino automatico.
- **Attrezzature e miglioramenti**: tre livelli, usura e guasti, leasing, più di 20 miglioramenti del locale.
- **Finanza**:
  - IVA mensile e imposte annuali secondo la forma giuridica (forfettario, ditta, S.r.l., S.p.A.);
  - conto economico, stato patrimoniale e ammortamenti;
  - banche, prestiti, fido e rating.
- **Immobili**: compravendita, mutui, affitti attivi e IMU.
- **Borsa**: titoli, dividendi e scalate a società concorrenti quotate. Puoi anche quotare la tua impresa (IPO).
- **Marchi, campagne pubblicitarie, franchising, ricerca e sviluppo, sede centrale** con ruoli dedicati.
- **Eventi casuali con scelte**: ispezioni, guasti, recensioni, grandi ordini, crisi, bandi…
- **Altro**:
  - 32 traguardi e 3 livelli di difficoltà;
  - fallimento dopo 30 giorni oltre il fido;
  - tutorial obbligatorio alla prima partita;
  - tema chiaro e scuro, testo regolabile.

## Struttura

| File | Contenuto |
|---|---|
| `js/util.js`, `js/calendar.js` | Funzioni comuni, date, festività, meteo |
| `js/data.js` | Dati di gioco (attività, materiali, città, ruoli, miglioramenti, ricerca, borsa) |
| `js/state.js` | Creazione della partita, concorrenti, salvataggi |
| `js/finance.js` | Contabilità, IVA, imposte, banca, valutazioni |
| `js/business.js` | Apertura attività, attrezzature, magazzino, ordini, personale |
| `js/sim.js` | Simulazione giornaliera |
| `js/shifts.js` | Turni con orario, simulazione ora per ora, ottimizzazione turni |
| `js/advisor.js` | Consulente: analisi e consigli |
| `js/help.js` | Spiegazioni dei tasti ? |
| `js/events.js` | Eventi, immobili, borsa, franchising, acquisizioni, traguardi |
| `js/ui.js`, `js/views_*.js`, `js/tutorial.js`, `js/main.js` | Interfaccia |

## Strumenti di bilanciamento (Node.js)

- `node tools/simtest.js bar torino semicentro 365`: simula un anno di una singola attività e stampa i risultati mese per mese.
- `node tools/stress.js 1095`: simula per tre anni un gruppo con tutte le attività e i sistemi avanzati, per scovare errori.
