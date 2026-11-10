'use strict';
/* ============================================================
   EMPIRE - tutorial guidato (obbligatorio alla prima partita)
   testi brevi a punti, ogni passo evidenzia cosa toccare
   ============================================================ */

function tutBiz() { return S && S.biz[0]; }
function tutNeededMats(b) {
  const set = new Set();
  for (const p of b.products) if (p.on) { const t = tplOf(b, p); if (t.eq && !b.equip[t.eq]) continue; for (const m in p.r) set.add(m); }
  return [...set];
}
const ALL_NAV = NAV.filter(Boolean).map(n => n[0]);
const BIZ_NAV = ['bizlist', 'biz'];

const TUTORIAL = [
  { id: 'intro', nav: ['dash'], manual: true, title: 'Benvenuto',
    text: () => ['In alto: data e soldi.', '▶ fa passare un giorno.', 'Verde = ok, rosso = problema.'] },
  { id: 'open', nav: ['dash', 'bizlist'], hl: 'bizlist', hlBtn: 'openWizard', auto: true, title: 'Apri un\'attività',
    text: () => ['Tocca "Apri la prima attività".', 'Scegli tipo, città, quartiere e locale.', 'Consiglio: semicentro.'], done: () => S.biz.length > 0 },
  { id: 'equip', nav: BIZ_NAV, tab: 'attrezzature', tabs: ['riepilogo', 'attrezzature'], hlBtn: 'equip', auto: true, title: 'Attrezzature',
    text: () => { const miss = tutBiz() ? missingRequired(tutBiz()) : []; return ['Compra le obbligatorie, livello Base.', miss.length ? `Mancano: ${miss.length}` : '✓ Fatto']; },
    done: () => tutBiz() && missingRequired(tutBiz()).length === 0 },
  { id: 'hire', nav: BIZ_NAV, tab: 'personale', tabs: ['riepilogo', 'attrezzature', 'personale'], hlBtn: 'hire', manualWhenDone: true, title: 'Personale',
    text: () => { const b = tutBiz(); const T = bizType(b); const core = [...new Set(T.products.filter(p => !p.lock).map(p => p.role))]; return [`Serve: ${core.map(r => ROLES[r].name).join(', ')}${T.front ? ' + ' + ROLES[T.front].name : ''}.`, `Aperto ${openHours(b)} h al giorno: assumi almeno 2 persone.`, 'Poi tocca Avanti.']; },
    done: () => tutBiz() && empsOf(tutBiz().id).length >= 1 },
  { id: 'shifts', nav: BIZ_NAV, tab: 'turni', tabs: ['riepilogo', 'attrezzature', 'personale', 'turni'], hlBtn: 'shifts', manual: true, title: 'Turni',
    text: () => ['Blu = in turno. Rosso = ora scoperta.', 'Tocca una casella per spostare l\'inizio.', 'Giorno rosso = ore senza nessuno.'] },
  { id: 'stock', nav: BIZ_NAV, tab: 'magazzino', tabs: ['riepilogo', 'attrezzature', 'personale', 'turni', 'magazzino'], hlBtn: 'restock', manualWhenDone: true, title: 'Magazzino',
    text: () => { const b = tutBiz(); const miss = tutNeededMats(b).filter(m => stockOf(b, m) + incoming(b, m) <= 0); return ['Tocca "Ordina 3 gg": arriva domattina.', 'Poi "⚡ Auto-riordino".', miss.length ? `Mancano: ${miss.length} materiali` : '✓ Pronto']; },
    done: () => { const b = tutBiz(); return b && tutNeededMats(b).every(m => stockOf(b, m) + incoming(b, m) > 0); } },
  { id: 'prices', nav: BIZ_NAV, tab: 'prodotti', tabs: ['riepilogo', 'attrezzature', 'personale', 'turni', 'magazzino', 'prodotti'], manual: true, title: 'Prezzi',
    text: () => ['● verde = prezzo giusto.', '▲ troppo caro, ▼ troppo economico.', 'Per ora lasciali così.'] },
  { id: 'advance', nav: ['bizlist', 'biz', 'dash'], adv: true, adv1only: true, hl: 'adv', auto: true, title: 'Si apre!',
    text: () => ['Tocca ▶ Giorno.', 'Se oggi è chiuso, ripeti.'], enter: () => { S.tutorial.day0 = S.day; },
    done: () => { const b = tutBiz(); return b && b.hist.some(h => h.cust > 0 || h.prod > 0); } },
  { id: 'report', nav: ['dash', 'bizlist', 'biz'], adv: true, tab: 'giornata', manual: true, title: 'Giornata',
    text: () => { const x = tutBiz().hist[tutBiz().hist.length - 1] || {}; return [`Oggi: ${num(x.cust || 0)} clienti, ${eur0(x.rev || 0)}.`, 'Verde = serviti, rosso = persi.', 'Il motivo è scritto sotto ogni ora.']; } },
  { id: 'advisor', nav: ['dash', 'bizlist', 'biz'], adv: true, manual: true, title: 'Rosso o verde',
    text: () => ['Bordo verde = tutto a posto.', 'Bordo rosso = c\'è un problema.', 'Dentro, ciò che non va è in rosso: sistemalo tu.'], enter: () => { UI.view = 'biz'; UI.biz = S.biz[0].id; UI.tab = 'riepilogo'; } },
  { id: 'end', nav: ALL_NAV, adv: true, manual: true, last: true, title: 'Ora tocca a te',
    text: () => ['1° del mese: stipendi e affitti.', 'Il 16: IVA.', '» per avanzare più giorni.', 'Menu: banca, immobili, borsa, ricerca…'] },
];

function tutorialState() {
  if (!S || !S.tutorial || !S.tutorial.active) return null;
  const st = TUTORIAL[S.tutorial.step];
  if (!st) { S.tutorial.active = false; return null; }
  return { ...st, i: S.tutorial.step, adv: !!st.adv };
}
function tutorialHl(key) { const t = tutorialState(); return !!t && t.hlBtn === key; }
function tutorialBlocksEvents() { const t = tutorialState(); return !!t && t.i < 7; }
function tutorialEvent() { tutorialCheck(); }
function tutorialCheck() {
  let guard = 0;
  while (guard++ < 10) {
    const t = tutorialState();
    if (!t || !t.auto || !t.done || !t.done()) break;
    tutorialGo(t.i + 1);
  }
}
function tutorialGo(i) {
  S.tutorial.step = i;
  const st = TUTORIAL[i];
  if (!st) { S.tutorial.active = false; return; }
  if (st.enter) st.enter();
  if (st.tab && S.biz[0]) { UI.view = 'biz'; UI.biz = S.biz[0].id; UI.tab = st.tab; UI.modal = null; }
}
function tutorialBox(t) {
  if (UI.tutMin) return `<aside class="tut"><div class="row between"><b>📘 ${esc(t.title)}</b>${btn('Mostra', 'tutMin', {}, 'sm')}</div></aside>`;
  const can = t.manual || (t.manualWhenDone && t.done && t.done());
  return `<aside class="tut" aria-live="polite"><div class="row between"><span class="step">Tutorial ${t.i + 1}/${TUTORIAL.length}</span>${btn('—', 'tutMin', {}, 'sm ghost', false, 'Riduci')}</div>
    <h3>${esc(t.title)}</h3><ul>${t.text().map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="row">${t.last ? btn('Fine ✓', 'tutNext', {}, 'pri') : can ? btn('Avanti ▶', 'tutNext', {}, 'pri') : '<small class="muted">Completa l\'azione</small>'}</div></aside>`;
}
ACT.tutNext = () => {
  const t = tutorialState(); if (!t) return;
  if (t.last) { S.tutorial.active = false; setMeta({ tutorialDone: true }); log('Tutorial completato.', 'good'); commit('Tutorial completato'); return; }
  tutorialGo(t.i + 1); tutorialCheck(); commit();
};
ACT.tutMin = () => { UI.tutMin = !UI.tutMin; render(); };
ACT.tutRestart = () => { S.tutorial = { active: true, step: 0 }; UI.view = 'dash'; commit(); };
