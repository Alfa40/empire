'use strict';
/* ============================================================
   EMPIRE - percorso: una attività → catena → altri settori.
   Ogni traguardo sblocca funzioni nuove e apre una breve lezione
   che spiega il concetto reale usando i numeri del giocatore.
   ============================================================ */

// tipi di attività disponibili all'inizio: facili da capire
const START_TYPES = ['bar', 'pizzeria', 'parrucchiere', 'abbigliamento'];

function custServed() { return sum(S.biz, b => sum(b.hist, h => h.cust || 0) + sum(b.hist, h => h.prod || 0)); }
function pastMonths() { const cur = monthKey(S.day); return Object.keys(S.ledger).map(Number).filter(k => k < cur).sort(); }
function profitMonths() { return pastMonths().filter(k => monthPL(k).profit > 0).length; }
function openBizN() { return S.biz.filter(b => b.status === 'open').length; }
const lastHist = () => { const b = S.biz[0]; return b && b.hist[b.hist.length - 1] || {}; };

/* ogni traguardo: goal (testo), prog() -> [valore, obiettivo], unlocks, lesson() -> {t, lines} */
const MILESTONES = [
  { id: 'apertura', ic: '🚪', n: 'Il primo giorno', goal: 'Apri la tua attività e servi i primi clienti',
    prog: () => [S.biz.some(b => b.hist.some(h => h.cust > 0 || h.prod > 0)) ? 1 : 0, 1], unlocks: [],
    lesson: () => { const x = lastHist(); return { t: 'Ricavi, costi e utile', lines: [
      `<b>Ricavi</b>: quello che incassi vendendo. Il tuo ultimo giorno: <b>${eur0(x.rev || 0)}</b>.`,
      '<b>Costi</b>: stipendi, merci, affitto, energia. Alcuni li paghi ogni giorno, altri a inizio mese.',
      `<b>Utile</b> = ricavi − costi. Ultimo giorno: <b class="${cls(x.profit || 0)}">${eur0(x.profit || 0)}</b>.`,
      'All\'inizio è normale perdere: i clienti arrivano piano piano, man mano che ti conoscono.'] }; } },
  { id: 'primo_mese', ic: '💶', n: 'Il primo stipendio', goal: 'Arriva al primo del mese e paga gli stipendi',
    prog: () => [Object.values(S.ledger).some(L => L.stipendi) ? 1 : 0, 1], unlocks: ['cassa'],
    lesson: () => { const L = S.ledger[monthKey(S.day)] || {}; const st = -(L.stipendi || 0), co = -(L.contributi || 0); return { t: 'Quanto costa davvero un dipendente', lines: [
      `<b>Stipendio lordo</b>: quanto spetta al dipendente prima delle tasse. Questo mese: <b>${eur0(st)}</b>.`,
      `<b>Contributi INPS e INAIL</b> (circa il 30% in più) e il <b>TFR</b> (la liquidazione che si accumula, circa il 7%): <b>${eur0(co)}</b>.`,
      'Quindi un dipendente costa all\'impresa circa 1,37 volte il suo lordo.',
      'Novità: in Finanza c\'è la scheda <b>Cassa</b>, che mostra i soldi entrati e usciti davvero.'] }; } },
  { id: 'banca', ic: '🏦', n: 'La banca', goal: 'Gestisci un mese intero di attività',
    prog: () => { const b = S.biz[0]; const d = b ? S.day - (b.opened || b.created) : 0; return [S.cash < 8000 ? 30 : clamp(d, 0, 30), 30]; }, unlocks: ['bank'],
    lesson: () => ({ t: 'Liquidità e prestiti', lines: [
      '<b>Liquidità</b>: i soldi che hai in cassa adesso. Puoi essere in utile e restare senza soldi, se incassi dopo e paghi prima.',
      `Hai in cassa <b>${eur0(S.cash)}</b>. Se scende sotto zero sei in <b>scoperto</b> e paghi interessi alti.`,
      `Un <b>prestito</b> si restituisce a rate. Esempio: 20.000 € in 5 anni al 6% = rata di <b>${eur0(payment(20000, 0.06, 60))}</b> al mese.`,
      'Il <b>tasso</b> dipende dal tuo rating: più sei affidabile, meno paghi.'] }) },
  { id: 'marketing', ic: '📣', n: 'Farsi conoscere', goal: 'Servi 1.000 clienti',
    prog: () => [Math.min(1000, Math.round(custServed())), 1000], unlocks: ['marketing'],
    lesson: () => ({ t: 'Notorietà e marketing', lines: [
      '<b>Notorietà</b>: quante persone in zona conoscono il tuo locale. Più è alta, più clienti entrano.',
      '<b>Reputazione</b>: quanto sono contenti i clienti. Dipende da qualità, prezzi e attese.',
      'Il marketing aumenta la notorietà, ma costa: conviene se ogni cliente in più porta più utile di quanto spendi.',
      'Novità: scheda <b>Marketing</b> in ogni attività e nel menu.'] }) },
  { id: 'utile', ic: '📈', n: 'Il primo mese in utile', goal: 'Chiudi un mese con utile positivo',
    prog: () => [profitMonths() ? 1 : 0, 1], unlocks: ['migliorie', 'conti'],
    lesson: () => { const k = pastMonths().filter(k => monthPL(k).profit > 0).pop(); const p = k ? monthPL(k).profit : 0; return { t: 'Utile, imposte e patrimonio', lines: [
      `Mese chiuso con utile di <b class="pos">${eur0(p)}</b>. Bravo!`,
      `Sull'utile si pagano le <b>imposte</b> (${esc(LEGAL_FORMS[S.meta.legal].name)}): si versano l'anno dopo, quindi mettile da parte.`,
      '<b>Ammortamento</b>: una macchina da 10.000 € che dura 5 anni pesa 2.000 € l\'anno sull\'utile, anche se l\'hai pagata tutta subito.',
      'Novità: <b>Migliorie</b> nelle attività, <b>Patrimonio</b> e <b>Imposte</b> in Finanza.'] }; } },
  { id: 'secondo', ic: '🏪', n: 'Il secondo locale', goal: 'Chiudi 3 mesi in utile',
    prog: () => [Math.min(3, profitMonths()), 3], unlocks: ['biz2'],
    lesson: () => ({ t: 'Aprire un secondo locale', lines: [
      'Hai un modello che funziona: ora puoi <b>replicarlo</b>.',
      'Servono soldi per attrezzature, affitto e i primi mesi di stipendi, prima che arrivino i clienti.',
      'Non puoi essere in due posti: un <b>responsabile</b> bravo in ogni locale tiene alto morale e qualità.',
      'Novità: puoi aprire una seconda attività.'] }) },
  { id: 'catena', ic: '🔗', n: 'Nasce la catena', goal: 'Due attività in utile nello stesso mese',
    prog: () => { const k = pastMonths().pop(); const n = k ? S.biz.filter(b => monthPL(k, b.id).profit > 0).length : 0; return [Math.min(2, n), 2]; }, unlocks: ['hq', 'biz5'],
    lesson: () => ({ t: 'Catena e sede centrale', lines: [
      'Con più locali nascono i <b>costi di struttura</b>: contabilità, personale, acquisti.',
      'La <b>sede centrale</b> assume chi lavora per tutti i locali: contabile, risorse umane, marketing.',
      '<b>Economie di scala</b>: comprando di più per più locali, ogni cosa costa meno.',
      'Novità: menu <b>Sede</b>, fino a 5 attività.'] }) },
  { id: 'settori', ic: '🧭', n: 'Nuovi settori', goal: 'Gestisci 3 attività aperte',
    prog: () => [Math.min(3, openBizN()), 3], unlocks: ['tipi_tutti', 'market', 'biz_inf'],
    lesson: () => ({ t: 'Diversificare', lines: [
      'Avere attività diverse riduce il <b>rischio</b>: se un settore va male, gli altri compensano.',
      'Ogni settore ha clienti, stagioni e costi diversi: studia il <b>Mercato</b> prima di aprire.',
      'Novità: tutti i tipi di negozio e servizio, schermata <b>Mercato</b>, nessun limite di attività.'] }) },
  { id: 'filiera', ic: '🏭', n: 'La filiera', goal: 'Patrimonio di 250.000 €',
    prog: () => [Math.round(clamp(S.nw, 0, 250000)), 250000], unlocks: ['produzione', 'research'],
    lesson: () => ({ t: 'Produrre in proprio', lines: [
      '<b>Integrazione verticale</b>: produci tu quello che i tuoi locali comprano (farina, caffè, pasta).',
      'Guadagni il margine del fornitore, ma servono macchine, magazzino e operai.',
      '<b>Ricerca e sviluppo</b>: investi oggi per prodotti e metodi migliori domani.',
      'Novità: attività di <b>produzione</b> e <b>Ricerca</b>.'] }) },
  { id: 'investimenti', ic: '🏘️', n: 'Investire', goal: 'Patrimonio di 400.000 €',
    prog: () => [Math.round(clamp(S.nw, 0, 400000)), 400000], unlocks: ['realestate', 'stocks'],
    lesson: () => ({ t: 'Rendimento e rischio', lines: [
      '<b>Immobili</b>: comprare il locale invece di affittarlo, o affittarlo ad altri. Rende poco ma è stabile.',
      '<b>Borsa</b>: azioni di altre società. Possono rendere molto, ma anche perdere valore.',
      'Regola d\'oro: più rendimento promesso = più rischio.',
      'Novità: <b>Immobili</b> e <b>Borsa</b>.'] }) },
];

// funzione → traguardo che la sblocca
const FEATURE_OF = {};
for (const m of MILESTONES) for (const f of m.unlocks) FEATURE_OF[f] = m.id;
const VIEW_FEAT = { bank: 'bank', marketing: 'marketing', realestate: 'realestate', stocks: 'stocks', market: 'market', research: 'research', hq: 'hq' };
const TAB_FEAT = { marketing: 'marketing', miglioramenti: 'migliorie' };
const FIN_FEAT = { cassa: 'cassa', sp: 'conti', tasse: 'conti' };

function progInit() { if (S && !S.prog) S.prog = { all: true, done: {}, queue: [] }; }
/** la funzione è disponibile? */
function has(f) {
  if (!S || !S.prog || S.prog.all) return true;
  const m = FEATURE_OF[f];
  return !m || !!S.prog.done[m];
}
function viewOk(v) { return !VIEW_FEAT[v] || has(VIEW_FEAT[v]); }
function maxBiz() { return has('biz_inf') ? 99 : has('biz5') ? 5 : has('biz2') ? 2 : 1; }
function typeOk(T) {
  if (has('tipi_tutti') && (T.mode === 'shop' || has('produzione'))) return true;
  return START_TYPES.includes(T.id);
}
function curMilestone() { if (!S.prog || S.prog.all) return null; return MILESTONES.find(m => !S.prog.done[m.id]) || null; }

/** controlla i traguardi (in ordine: si sblocca uno alla volta) */
function progressCheck() {
  if (!S || !S.prog || S.prog.all || S.over) return;
  let guard = 0;
  while (guard++ < MILESTONES.length) {
    const m = curMilestone(); if (!m) return;
    const [v, max] = m.prog();
    if (v < max) return;
    S.prog.done[m.id] = S.day;
    S.prog.queue.push(m.id);
    log(`Traguardo raggiunto: ${m.n}.`, 'good');
  }
}
/** apre la lezione del traguardo appena raggiunto, se non c'è altro in corso */
function progressPopup() {
  if (!S || !S.prog || !S.prog.queue.length || UI.modal || S.events.length || tutorialState()) return;
  UI.modal = { kind: 'lesson', id: S.prog.queue.shift(), fresh: true };
}

// ---------- schede ----------
ACT.lesson = (d) => openModal('lesson', { id: d.id });
MODALS.lesson = (M) => {
  const m = MILESTONES.find(x => x.id === M.id); if (!m) return '';
  const L = m.lesson();
  return sheet(`${m.ic} ${M.fresh ? 'Traguardo: ' : ''}${esc(m.n)}`, `<div class="lesson"><h3>📘 ${esc(L.t)}</h3><ul>${L.lines.map(x => `<li>${x}</li>`).join('')}</ul></div>`,
    btn('Percorso', 'path', {}, '') + btn('Ho capito ✓', 'closeModal', {}, 'pri'), {});
};
ACT.path = () => openModal('path');
MODALS.path = () => {
  const cur = curMilestone();
  const rows = MILESTONES.map((m, i) => {
    const done = S.prog.all || S.prog.done[m.id], now = cur && cur.id === m.id;
    const [v, max] = now ? m.prog() : [0, 1];
    return `<button class="pstep ${done ? 'done' : now ? 'now' : 'lock'}" data-a="${done ? 'lesson' : 'help'}" data-id="${m.id}" data-k="percorso"${!done && !now ? ' disabled' : ''}>
      <span class="pn">${done ? '✓' : i + 1}</span><span class="pt"><b>${m.ic} ${esc(m.n)}</b><small>${done ? 'Fatto · tocca per rileggere la lezione' : now ? esc(m.goal) : '???'}</small>${now ? `<span class="fbar">${bar(v, max)}</span>` : ''}</span></button>`;
  }).join('');
  return sheet('🗺️ Il tuo percorso', `<small class="muted">Ogni traguardo sblocca nuove funzioni e una breve lezione.</small><div class="path">${rows}</div>`, '', { help: 'percorso' });
};
/** riquadro "prossimo obiettivo" per la Panoramica */
function goalCard() {
  const m = curMilestone(); if (!m) return '';
  const [v, max] = m.prog();
  const i = MILESTONES.indexOf(m);
  return `<button class="goal" data-a="path"><span class="gi">${m.ic}</span><span class="gt"><small>Obiettivo ${i + 1}/${MILESTONES.length}</small><b>${esc(m.goal)}</b><span class="fbar">${bar(v, max, 'g')}</span></span><i>›</i></button>`;
}
