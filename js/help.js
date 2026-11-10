'use strict';
/* ============================================================
   EMPIRE - spiegazioni brevi aperte dal tasto "?"
   ogni voce: [titolo, [punti...]]
   ============================================================ */
const HELP = {
  panoramica: ['Panoramica', ['Tutto in una schermata.', 'Verde = ok, rosso = qualcosa da sistemare, grigio = spento o a riposo.', 'Tocca un riquadro per aprirne la scheda e cambiarlo.', 'Tocca il titolo di una riga per la sezione completa.']],
  // generali
  cassa: ['Cassa', ['Soldi disponibili sul conto.', 'Può andare in negativo fino al fido.', 'Oltre il fido per 30 giorni = fallimento.']],
  patrimonio: ['Patrimonio netto', ['Tutto ciò che possiedi meno i debiti.', 'Include attrezzature, merci, immobili, titoli.', 'È il tuo punteggio principale.']],
  utile: ['Utile', ['Ricavi meno costi del periodo.', 'Stipendi e affitti si pagano il 1° del mese: guarda i 30 giorni, non il singolo giorno.']],
  rating: ['Rating', ['Affidabilità per le banche (da AAA a D).', 'Sale con utili, patrimonio alto e debiti bassi.', 'Scende se vai oltre il fido.', 'Migliore rating = tassi più bassi.']],
  avanza: ['Avanzare il tempo', ['▶ simula un giorno.', '+7 e Fine mese avanzano più giorni.', 'Si fermano da soli se serve una tua decisione.', 'Tasto rapido: N.']],
  data: ['Calendario', ['Calendario reale italiano.', 'Weekend, festività, saldi, stagioni e meteo cambiano i clienti.', 'Ogni tipo di attività reagisce in modo diverso.']],
  consulente: ['Consulente', ['Analizza ogni giorno le tue attività.', 'Rosso = urgente, giallo = da migliorare, blu = idea.', 'I pulsanti applicano subito la soluzione.']],
  economia: ['Economia', ['Fiducia: sopra 1 i clienti spendono di più.', 'Inflazione: fa salire prezzi, materie prime e stipendi.', 'BCE: tasso base dei prestiti.']],
  scadenze: ['Scadenze', ['1° del mese: stipendi, contributi, affitti.', '16: IVA del mese prima.', '20 dicembre: tredicesima.', '30 giugno: imposte dell\'anno prima.', 'Più le rate dei finanziamenti.']],
  // apertura
  tipo: ['Tipo di attività', ['Negozi e servizi: vendono ai clienti.', 'Produzione: crea materie prime da vendere all\'ingrosso o alle tue attività.', 'Costi e margini cambiano molto tra i tipi.']],
  citta: ['Città', ['Grandezza = più clienti.', 'Costo della vita = stipendi e affitti.', 'Ricchezza = prezzi accettati più alti.', 'Mare: picco estivo. Arte: turisti tutto l\'anno.']],
  quartiere: ['Quartiere', ['Passaggio = clienti potenziali.', 'Centro: tanti clienti, affitti alti.', 'Periferia: costi bassi, meno clienti.', 'Zona industriale: per la produzione.']],
  locale: ['Locale', ['Più grande = più capacità, ma affitto e utenze più alti.', 'Cauzione: 3 mesi, ti torna se chiudi.', '"Da ristrutturare": costo extra subito.']],
  // attività
  stato: ['Stato', ['Allestimento: mancano attrezzature o personale.', 'Operativa: aperta al pubblico.', 'Sospesa: chiusa, ma paghi i costi fissi.']],
  domanda: ['Domanda', ['Clienti potenziali della zona.', 'La tua quota dipende da reputazione, qualità, prezzi e notorietà rispetto ai concorrenti.']],
  quota: ['Quota di mercato', ['Parte dei clienti della zona che sceglie te.', 'Sale con qualità, reputazione, notorietà e prezzi giusti.']],
  capacita: ['Capacità', ['Clienti che il locale può servire.', 'Dipende da superficie e attrezzature.', 'Se piena, i clienti in più vanno persi.']],
  reputazione: ['Reputazione', ['Da 1 a 5 stelle.', 'Cresce se i clienti sono soddisfatti.', 'Soddisfazione: qualità, prezzo giusto, attese brevi, pulizia, prodotti disponibili.']],
  notorieta: ['Notorietà', ['Quanta gente ti conosce (0-100).', 'Sale con pubblicità, campagne, marchio e buona reputazione.', 'Scende lentamente nel tempo.']],
  qualita: ['Qualità', ['Da 0 a 100.', 'Materie prime (fornitore), bravura del personale, attrezzature, miglioramenti, ricerca.']],
  giornata: ['Giornata ora per ora', ['Clienti arrivati e serviti per ogni ora.', 'Barra verde = serviti, rossa = persi.', 'Persi per: personale insufficiente, nessuno in turno o locale pieno.']],
  turni: ['Turni', ['Ogni dipendente ha giorni, ora d\'inizio e ore al giorno.', 'Tocca una casella: il turno di quel giorno inizia a quell\'ora.', 'Inizio −/+ sposta il turno di tutti i giorni.', 'Riga Copertura: persone presenti; rosso = ora scoperta.', 'Ottimizza: il consulente distribuisce i turni sulle ore di punta.']],
  copertura: ['Copertura', ['Persone in turno (escluse pulizie) per ogni ora.', 'Ogni ora di apertura deve avere qualcuno.', 'Nelle ore di punta ne servono di più.']],
  // personale
  competenza: ['Competenza', ['0-100. Più alta = più veloce e prodotti migliori.', 'Cresce lavorando e con la formazione.', 'Chi è bravo chiede più stipendio.']],
  morale: ['Morale', ['0-100. Basso = rende meno e può dimettersi.', 'Sale con stipendio sopra mercato, responsabile presente, riposo.', 'Scende con straordinari e stanchezza.']],
  stanchezza: ['Stanchezza', ['Sale con turni lunghi e troppi giorni di fila.', 'Oltre 40 riduce la produttività.', 'Si recupera nei giorni di riposo.']],
  contratto: ['Contratti', ['Indeterminato: stabile, licenziare costa un mese.', 'Determinato/stagionale: scade, poi rinnovi o lasci.', 'Apprendistato (under 30): impara in fretta, dopo 3 anni indeterminato.']],
  stipendio: ['Stipendio', ['Lordo mensile a tempo pieno (40 h).', 'Costo per te: +30% contributi +7% TFR.', 'Oltre 40 h: straordinari +25%. Festivi +30%.', '"Mercato" = quanto prenderebbe altrove.']],
  formazione: ['Formazione', ['Aumenta la competenza.', 'Durante il corso il dipendente non lavora.']],
  ruoli: ['Ruoli', ['Il personale è diviso per tipo di lavoro: tocca un gruppo per vedere le persone, divise per ruolo.', 'Ogni prodotto richiede un ruolo (es. caffè → barista).', 'Cameriere, commesso, receptionist servono i clienti.', 'Responsabile: +6% produttività, +morale, gestisce gli imprevisti.', 'Pulizie: soddisfazione e ispezioni.']],
  candidati: ['Candidati', ['Cambiano ogni lunedì.', 'Annuncio: 4 nuovi candidati del ruolo scelto.', 'Se offri meno della richiesta, può rifiutare.']],
  sede: ['Sede centrale', ['Contabile: -75% commercialista, meno sanzioni.', 'HR: candidati migliori, +morale.', 'Marketing: campagne +30%.', 'Area manager: gestisce 6 attività da solo.', 'Ricercatore: ricerca più veloce.']],
  auto: ['Gestione automatica', ['Con un Responsabile o un Area manager gli imprevisti minori vengono decisi da soli.']],
  // prodotti e magazzino
  prezzo_rif: ['Prezzo di riferimento', ['Il prezzo che i clienti della zona trovano giusto.', 'Sopra: meno clienti. Sotto: più clienti, meno margine.', 'Cambia con città, quartiere e inflazione.']],
  margine: ['Margine', ['(Prezzo senza IVA − costo ingredienti) / prezzo senza IVA.', 'Non include personale e affitto.']],
  ricetta: ['Ricetta', ['Ingredienti consumati per ogni unità.', 'Più ricca = qualità e prezzo accettato più alti.', 'Varianti: più versioni dello stesso prodotto.']],
  saldi: ['Sconto saldi', ['Applicato solo durante i saldi (gen-feb, lug-ago).', 'Più clienti, margine più basso.']],
  fornitori: ['Fornitori', ['Economico: costa meno, qualità bassa, a volte in ritardo.', 'Standard: equilibrato.', 'Premium: qualità alta.', 'Interno: una tua attività produttiva (filiera).']],
  riordino: ['Riordino automatico', ['Quando la giacenza scende sotto "sotto", ordina fino a "porta a".', 'Il consulente calcola soglie sui consumi reali.']],
  deperibili: ['Scadenza', ['I freschi scadono e vanno buttati.', 'La cella frigorifera li fa durare di più.']],
  ordine: ['Ordine', ['Pagato subito, arriva dopo i giorni indicati.', 'I prezzi sono IVA esclusa, l\'IVA la recuperi (tranne forfettario).']],
  // attrezzature
  attrezzature: ['Attrezzature', ['Obbligatorie: servono per aprire.', 'Base, Pro, Top: più velocità, capacità o qualità.', 'Si usurano: sotto il 45% possono guastarsi.', 'Leasing: 48 rate, niente esborso subito.']],
  miglioramenti: ['Miglioramenti', ['Investimenti permanenti sul locale.', 'Alcuni hanno un canone mensile.']],
  // marketing
  budget: ['Budget pubblicitario', ['Spesa giornaliera continua.', 'Aumenta la notorietà, con rendimento decrescente.']],
  campagne: ['Campagne', ['Spinta di notorietà per alcuni giorni.', 'Singola attività, città o tutto un marchio.']],
  marchio: ['Marchio', ['Le attività con lo stesso marchio condividono la notorietà.', 'Più locali = marchio più forte.', 'Serve per il franchising.']],
  franchising: ['Franchising', ['Altri aprono con il tuo marchio.', 'Ti pagano quota d\'ingresso e royalty mensili.', 'Affiliati scorretti danneggiano il marchio.']],
  // impostazioni attività
  orari: ['Orari', ['Più ore = più clienti, ma servono più turni.', 'La % indica quanta domanda giornaliera copri.']],
  ferie: ['Chiusura per ferie', ['Locale chiuso: niente incassi, costi fissi sì.', 'Utile per gelaterie d\'inverno o in agosto.']],
  assicurazione: ['Assicurazione', ['Copre danni, furti e cause dei clienti.', 'Premio mensile.']],
  valore: ['Valore attività', ['Attrezzature + scorte + avviamento.', 'L\'avviamento dipende dagli utili degli ultimi 90 giorni.']],
  // produzione
  produzione: ['Produzione', ['Limite: ore del personale o capacità delle macchine (il minore).', 'Servono le materie prime in magazzino.', 'Obiettivo 0 = produce il massimo.']],
  ingrosso: ['Ingrosso', ['Vendi sul mercato nazionale.', 'Prezzo più alto = meno domanda.', 'Weekend e festivi: quasi zero.', 'Scorta riservata: resta per le tue attività.']],
  filiera: ['Filiera', ['Le tue attività possono comprare da qui come fornitore interno.', 'Prezzo = costo di produzione +5%, senza IVA.']],
  // finanza
  ce: ['Entrate e spese', ['Ricavi e costi del periodo, divisi in gruppi (dipendenti, affitti, spese fisse…).', 'Tocca un gruppo per vedere le voci e quanto pesa ogni attività.', 'Senza IVA. Attrezzature e lavori sono ammortizzati negli anni.']],
  sp: ['Stato patrimoniale', ['Cosa possiedi (attività) e cosa devi (passività).', 'La differenza è il patrimonio netto.']],
  iva: ['IVA', ['Incassi l\'IVA sulle vendite, paghi quella sugli acquisti.', 'Il 16 versi la differenza del mese prima.', 'Nel forfettario non c\'è IVA.']],
  imposte: ['Imposte', ['Calcolate sull\'utile dell\'anno al 31 dicembre.', 'Si pagano entro il 30 giugno successivo.', 'Le perdite si riportano agli anni dopo.']],
  forma: ['Forma giuridica', ['Forfettario: 15% (5% primi 5 anni) su parte dei ricavi, max 85.000 €.', 'Ditta: IRPEF a scaglioni + INPS.', 'S.r.l.: 24% + 3,9% sugli utili.', 'S.p.A.: necessaria per la Borsa.']],
  flussi: ['Cassa', ['Tutti i soldi entrati e usciti, compresi prestiti, investimenti, IVA e tasse versate.', 'Tocca un gruppo per il dettaglio.']],
  // banca
  prestito: ['Prestito', ['Rate mensili costanti.', 'Importo massimo: ricavi, patrimonio, rating.', 'Estinzione anticipata: +1%.']],
  fido: ['Fido', ['Puoi andare in negativo fino al limite.', 'Interessi solo sulla parte usata + 0,5% annuo.', 'Oltre il limite: 16% e rischio fallimento.']],
  // immobili, borsa
  immobili: ['Immobili', ['Locali: ospitano tue attività senza affitto.', 'Case: da affittare.', 'Costi: notaio e imposte 9%, IMU, manutenzione.', 'Il valore segue il mercato della città.']],
  mutuo: ['Mutuo', ['Fino all\'80% del prezzo, 10-30 anni.', 'Tasso più basso di un prestito.']],
  borsa: ['Borsa', ['Aperta nei giorni feriali.', 'Commissione 0,2%. Tasse 26% su guadagni e dividendi.', 'Oltre il 50% di un gruppo: puoi incorporarlo.']],
  ipo: ['Quotazione', ['Vendi parte della tua impresa in Borsa per raccogliere capitale.', 'Serve: S.p.A., patrimonio 2 M€, 5 attività, utili.']],
  // mercato, ricerca
  mercato: ['Mercato', ['Concorrenti di ogni città e quartiere.', 'Indice prezzi: 1 = normale, sopra = più caro.', 'I concorrenti reagiscono ogni settimana.']],
  ricerca: ['Ricerca', ['Un progetto alla volta.', 'Sblocca prodotti o migliora tutte le attività.', 'I ricercatori in sede la accelerano.']],
  traguardi: ['Traguardi', ['Obiettivi facoltativi. Non c\'è una fine.']],
  registro: ['Registro', ['Tutto quello che è successo, giorno per giorno.']],
  salvataggi: ['Salvataggi', ['Automatico dopo ogni azione.', 'Esporta un file per backup o per un altro dispositivo.']],
};
