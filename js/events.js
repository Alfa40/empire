'use strict';
/* ============================================================
   EMPIRE - eventi casuali, immobili, borsa, franchising,
   acquisizioni, traguardi
   ============================================================ */

function queueEvent(ev) {
  if (!ev) return;
  ev.id = uid('ev'); ev.day = S.day;
  if (ev.type === 'info' && !ev.important) { log(ev.title + ': ' + ev.text, 'event', ev.biz || null); return; }
  if (ev.minor && ev.biz && autoManaged(ev.biz)) {
    const res = resolveEvent(ev, ev.auto || 0, true);
    log(`[Gestito dal responsabile] ${ev.title}: scelta "${ev.opts[ev.auto || 0]}". ${res || ''}`, 'event', ev.biz === 'hq' ? null : ev.biz);
    return;
  }
  S.events.push(ev);
}
function resolveEvent(ev, idx, silent) {
  const fn = EVENT_RESOLVE[ev.type];
  let res = '';
  try { res = fn ? fn(ev, idx) || '' : ''; } catch (e) { console.error(e); res = ''; }
  S.events = S.events.filter(x => x.id !== ev.id);
  if (!silent && ev.type !== 'info') log(`${ev.title}: ${ev.opts[idx]}. ${res}`, 'event', ev.biz && ev.biz !== 'hq' ? ev.biz : null);
  return res;
}

const EVENT_RESOLVE = {
  info: () => '',
  ferie(ev, i) {
    const e = S.emps[ev.emp]; if (!e) return '';
    if (i === 0) { e.holidayUntil = S.day + ev.days; e.holidays -= ev.days * 5 / 7; e.morale = clamp(e.morale + 4, 0, 100); return `${e.first} sarà in ferie fino al ${fmtDate(e.holidayUntil)}.`; }
    e.morale = clamp(e.morale - 10, 0, 100); return `${e.first} non l'ha presa bene (-10 morale).`;
  },
  dimissioni(ev, i) {
    const e = S.emps[ev.emp]; if (!e) return '';
    if (i === 0 && chance(0.7)) { e.wage = Math.round(e.wage * 1.12); e.morale = 60; e.lastRaise = S.day; return `${e.first} ha accettato e resta.`; }
    const b = getBiz(e.biz);
    fireEmployee(e, 'dimissioni');
    if (b) checkStaffing(b);
    return i === 0 ? `${e.first} ha rifiutato la controproposta e se ne va.` : `${e.first} lascia l'azienda.`;
  },
  aumento(ev, i) {
    const e = S.emps[ev.emp]; if (!e) return '';
    if (i === 0) { e.wage = Math.round(e.wage * 1.08); e.morale = clamp(e.morale + 15, 0, 100); return 'Morale +15.'; }
    if (i === 1) { e.wage = Math.round(e.wage * 1.04); e.morale = clamp(e.morale + 5, 0, 100); return 'Morale +5.'; }
    e.morale = clamp(e.morale - 14, 0, 100); return 'Morale -14.';
  },
  scadenza(ev, i) {
    const e = S.emps[ev.emp]; if (!e) return '';
    if (i === 0) { e.end = addMonths(e.end, 12); return `Nuova scadenza: ${fmtDate(e.end)}.`; }
    if (i === 1) { e.contract = 'indeterminato'; e.end = null; e.morale = clamp(e.morale + 15, 0, 100); return 'Ora è a tempo indeterminato. Morale +15.'; }
    return 'Il contratto terminerà alla scadenza.';
  },
  guasto(ev, i) {
    const b = getBiz(ev.biz); if (!b || !b.equip[ev.cat]) return '';
    if (i === 0) { const r = repairEquipment(b, ev.cat); return r.err ? r.err : `Riparato per ${eur(r.cost)}.`; }
    if (i === 1) { const r = buyEquipment(b, ev.cat, b.equip[ev.cat].tier, false); return r.err ? r.err : 'Attrezzatura sostituita con una nuova.'; }
    return 'L\'attrezzatura resta guasta: rendimento ridotto finché non la ripari.';
  },
  recensione_neg(ev, i) {
    const b = getBiz(ev.biz); if (!b) return '';
    if (i === 0) { expense(150, 0, 'marketing', b.id); b.rep = clamp(b.rep - 1, 0, 100); return 'Il cliente ha apprezzato la risposta.'; }
    b.rep = clamp(b.rep - 4, 0, 100); b.aw = clamp(b.aw - 3, 0, 100); return 'La recensione ha fatto il giro del web (reputazione -4).';
  },
  danni(ev, i) {
    const b = getBiz(ev.biz); if (!b) return '';
    const cost = i === 0 ? ev.cost : ev.cost * 0.6;
    const days = i === 0 ? ev.days : ev.days * 2 + 2;
    const covered = b.insurance ? cost * 0.85 : 0;
    expense(cost - covered, 0.22, 'manutenzione', b.id);
    b.closedUntil = S.day + days; b.closedReason = 'Chiusa per lavori dopo i danni';
    return `${b.insurance ? 'L\'assicurazione copre l\'85%. ' : ''}Costo a tuo carico ${eur((cost - covered) * 1.22)}, chiusura per ${days} giorni.`;
  },
  grande_ordine(ev, i) {
    const b = getBiz(ev.biz); if (!b || i !== 0) return 'Ordine rifiutato.';
    const p = b.products.find(x => x.id === ev.prod); if (!p) return '';
    let maxU = ev.qty;
    for (const m in p.r) maxU = Math.min(maxU, stockOf(b, m) / p.r[m]);
    maxU = Math.floor(maxU);
    for (const m in p.r) takeStock(b, m, p.r[m] * maxU);
    const T = bizType(b); const t = tplOf(b, p);
    income(maxU * ev.price, t.iva != null ? t.iva : T.iva, 'vendite', b.id);
    if (maxU < ev.qty) { b.rep = clamp(b.rep - 3, 0, 100); return `Hai consegnato solo ${maxU} pezzi su ${ev.qty} per mancanza di scorte: il cliente è insoddisfatto.`; }
    b.rep = clamp(b.rep + 2, 0, 100); b.aw = clamp(b.aw + 3, 0, 100);
    return `Consegnati ${maxU} pezzi: incasso ${eur(maxU * ev.price)}.`;
  },
  influencer(ev, i) {
    const b = getBiz(ev.biz); if (!b || i !== 0) return '';
    expense(ev.cost, 0.22, 'marketing', b.id);
    if (chance(0.6)) { b.aw = clamp(b.aw + 18, 0, 100); return 'Il post è stato un successo: notorietà +18!'; }
    return 'Il post è passato inosservato.';
  },
  offerta_acquisto(ev, i) {
    const b = getBiz(ev.biz); if (!b || i !== 0) return 'Offerta rifiutata.';
    sellBusiness(b, ev.price);
    return `Hai venduto l'attività per ${eur(ev.price)}.`;
  },
  locale_in_vendita(ev, i) {
    const b = getBiz(ev.biz); if (!b) return '';
    if (i === 0 || i === 1) {
      const total = ev.price * 1.09;
      if (i === 1) {
        const loanAmt = Math.round(ev.price * 0.7);
        if (S.cash < total - loanAmt) return 'Liquidità insufficiente anche con il mutuo.';
        takeLoan('nazionale', 'mutuo', loanAmt, 240, { label: 'locale ' + b.name });
      } else if (S.cash < total) return 'Liquidità insufficiente.';
      const p = { id: uid('h'), city: b.city, district: b.district, kind: 'commerciale', m2: b.m2, value: ev.price, bought: ev.price, idx0: S.market.index[b.city], day: S.day, biz: b.id, tenant: null };
      S.props.push(p);
      cashMove(-ev.price, 'immobili'); cashMove(-ev.price * 0.02, 'licenze'); cashMove(-ev.price * 0.07, 'imposte_varie');
      if (b.deposit) { cashMove(b.deposit, 'cauzioni', b.id); b.deposit = 0; }
      b.rent = 0; b.propId = p.id;
      unlockAch('primo_immobile');
      return 'Ora il locale è tuo: niente più affitto.';
    }
    if (chance(0.6)) { b.rent = Math.round(b.rent * 1.12); return `Il nuovo proprietario ha aumentato l'affitto a ${eur(b.rent)} al mese.`; }
    return 'Il nuovo proprietario mantiene il contratto alle stesse condizioni.';
  },
  talento(ev, i) {
    if (i !== 0) return '';
    const c = ev.cand;
    const r = hireCandidate(c, ev.biz, { wage: ev.wage, contract: 'indeterminato', hours: 8, wdays: [1, 1, 1, 1, 1, 0, 0] });
    if (r.err) return r.err;
    const b = getBiz(ev.biz);
    if (b && bizType(b).days) r.e.wdays = defaultWdays(b);
    return 'Benvenuto in squadra!';
  },
  infortunio(ev, i) {
    const b = getBiz(ev.biz); if (!b) return '';
    if (b.insurance) return 'L\'assicurazione ha coperto interamente il risarcimento.';
    if (i === 0) { cashMove(-ev.cost, 'minusvalenze', b.id); return `Pagati ${eur(ev.cost)}.`; }
    cashMove(-2000, 'consulenze', b.id);
    if (chance(0.5)) return 'Hai vinto la causa! Spese legali 2.000 €.';
    cashMove(-ev.cost * 1.6, 'minusvalenze', b.id); b.rep = clamp(b.rep - 3, 0, 100);
    return `Hai perso la causa: ${eur(ev.cost * 1.6)} più 2.000 € di spese legali.`;
  },
  normativa(ev, i) {
    if (i === 0) { expense(ev.cost, 0.22, 'consulenze'); return 'Tutte le attività sono in regola.'; }
    if (chance(0.45)) { cashMove(-ev.cost * 2, 'imposte_varie'); return `Un controllo ha rilevato le irregolarità: multa di ${eur(ev.cost * 2)}.`; }
    return 'Per ora nessun controllo.';
  },
  bando(ev, i) {
    if (i !== 0) return '';
    expense(600, 0.22, 'consulenze');
    if (chance(0.5)) { cashMove(ev.amount, 'altri_ricavi'); return `Bando vinto: contributo a fondo perduto di ${eur(ev.amount)}!`; }
    return 'La domanda non è stata accolta.';
  },
  prestito_agevolato(ev, i) {
    if (i !== 0) return '';
    const l = takeLoan('locale', 'prestito', ev.amount, 60, { label: 'agevolato' });
    l.rate = ev.rate; l.payment = payment(ev.amount, ev.rate, 60);
    return `Ricevuti ${eur(ev.amount)} al ${pct(ev.rate, 2)}.`;
  },
  sponsor(ev, i) {
    if (i !== 0) return '';
    cashMove(-ev.cost, 'marketing');
    for (const b of S.biz.filter(x => x.city === ev.city)) b.aw = clamp(b.aw + 8, 0, 100);
    return 'Il tuo nome è sulle maglie della squadra: notorietà +8 in città.';
  },
  lite(ev, i) {
    const list = empsOf(ev.biz);
    if (i === 0) { expense(300, 0.10, 'formazione', ev.biz); list.forEach(e => e.morale = clamp(e.morale + 8, 0, 100)); return 'Il clima in squadra è migliorato (+8 morale).'; }
    list.forEach(e => e.morale = clamp(e.morale - 6, 0, 100)); return 'La tensione resta (-6 morale).';
  },
  acquisizione_concorrente(ev, i) {
    const c = S.comps.find(x => x.id === ev.comp);
    if (!c) return 'Il concorrente non è più disponibile.';
    if (i !== 0) { S.comps = S.comps.filter(x => x !== c); return `${c.name} ha chiuso.`; }
    const price = compPrice(c);
    if (S.cash < price) { S.comps = S.comps.filter(x => x !== c); return 'Liquidità insufficiente: l\'attività ha chiuso.'; }
    cashMove(-price, 'licenze');
    const b = convertCompetitor(c);
    unlockAch('acquisizione');
    return `Ora "${b.name}" fa parte del tuo gruppo.`;
  },
  inquilino_moroso(ev, i) {
    const p = S.props.find(x => x.id === ev.prop); if (!p || !p.tenant) return '';
    if (i === 0) { cashMove(-2000, 'consulenze'); p.tenant = null; p.vacantUntil = addMonths(S.day, 3); return 'Sfratto avviato: l\'immobile tornerà disponibile tra circa 3 mesi.'; }
    p.tenant.arrears = (p.tenant.arrears || 0) + 2; return 'Hai concesso una dilazione.';
  },
  furto() { return ''; },
  takeover(ev, i) {
    if (i !== 0) return '';
    return doTakeover(ev.tk);
  },
};

function defaultWdays(b) {
  const open = b.days.map(Boolean);
  const w = [0, 0, 0, 0, 0, 0, 0];
  let n = 0;
  for (let i = 0; i < 7 && n < 5; i++) if (open[i]) { w[i] = 1; n++; }
  return w;
}

function makeBreakdownEvent(b, cat) {
  const def = equipDef(b, cat);
  const rc = repairCost(b, cat);
  const nc = equipCost(def, b.equip[cat].tier);
  return { type: 'guasto', biz: b.id, cat, title: 'Guasto', text: `Presso ${b.name} si è guastato: ${def.n} (${TIER_NAMES[b.equip[cat].tier]}). ${def.req ? 'È un\'attrezzatura essenziale: il rendimento è molto ridotto.' : ''}`, opts: [`Ripara (${eur(rc * 1.22)})`, `Sostituisci con una nuova (${eur(nc * 1.22)})`, 'Rimanda'], minor: true, auto: 0 };
}

// ---------- generazione eventi ----------
function rollEvents(info) {
  if (S.tutorial && S.tutorial.active) return;
  const diff = DIFFICULTY[S.meta.difficulty];
  const neg = diff.negEvents;
  for (const b of S.biz) {
    if (b.status !== 'open' || !chance(0.03)) continue;
    const T = bizType(b);
    const mods = bizMods(b);
    const age = S.day - b.opened;
    const pool = [];
    const r28 = recentDaily(28, b.id);
    if (T.tags.includes('food')) pool.push(['ispezione', 1.2 * neg]);
    if (T.mode === 'shop') {
      pool.push(['recensione_pos', 1.0], ['recensione_neg', 1.0 * neg], ['influencer', 0.6], ['infortunio', 0.35 * neg], ['grande_ordine', 0.8]);
    }
    pool.push(['furto', 0.6 * neg * mods.theft], ['danni', 0.35 * neg], ['talento', 0.7], ['blackout', mods.blackout ? 0 : 0.35 * neg]);
    if (empsOf(b.id).length >= 3) pool.push(['lite', 0.6 * neg]);
    if (b.rent > 0 && age > 60) pool.push(['locale_in_vendita', 0.35]);
    if (age > 150 && r28.profit > 0) pool.push(['offerta_acquisto', 0.4]);
    if (empsOf(b.id).some(e => weeklyHours(e) > 48)) pool.push(['ispettorato', 1.5 * neg]);
    const k = weightedPick(pool, x => x[1]);
    if (k) makeBizEvent(k[0], b, mods);
  }
  if (S.biz.length && chance(0.022)) {
    const pool = [['evento_citta', 1.2], ['sciopero', 0.6 * neg], ['energia', 0.5 * neg], ['crisi_materia', 0.7 * neg], ['boom', 0.7], ['normativa', 0.5 * neg], ['controllo_fiscale', 0.6 * neg], ['bando', 0.5], ['prestito_agevolato', 0.4], ['sponsor', 0.6], ['promo_concorrente', 0.6 * neg]];
    const k = weightedPick(pool, x => x[1]);
    if (k) makeGlobalEvent(k[0], info);
  }
}

function makeBizEvent(kind, b, mods) {
  const T = bizType(b);
  switch (kind) {
    case 'ispezione': {
      const clean = b.today && b.today.clean != null ? b.today.clean : 0.8;
      const avgCond = avg(Object.values(b.equip), o => o.cond) || 80;
      const risk = clamp((0.95 - clean) * 1.5 + (60 - avgCond) / 100, 0.05, 0.9);
      if (chance(risk)) {
        const fine = rint(10, 40) * 100;
        cashMove(-fine, 'imposte_varie', b.id); b.rep = clamp(b.rep - 3, 0, 100);
        queueEvent({ type: 'info', title: 'Ispezione sanitaria', text: `L'ASL ha ispezionato ${b.name} trovando carenze igieniche: multa di ${eur(fine)}. Più personale per le pulizie e attrezzature in buono stato riducono il rischio.`, opts: ['Capito'], important: true, biz: b.id });
      } else queueEvent({ type: 'info', title: 'Ispezione sanitaria', text: `Ispezione ASL superata a pieni voti presso ${b.name}.`, opts: ['Ok'], biz: b.id });
      break;
    }
    case 'recensione_pos':
      b.aw = clamp(b.aw + 12, 0, 100); b.rep = clamp(b.rep + 2, 0, 100);
      queueEvent({ type: 'info', title: 'Recensione virale', text: `Una recensione entusiasta su ${b.name} sta girando sui social: notorietà +12.`, opts: ['Ottimo'], biz: b.id });
      break;
    case 'recensione_neg':
      queueEvent({ type: 'recensione_neg', biz: b.id, title: 'Recensione negativa', text: `Un cliente ha pubblicato una recensione molto negativa su ${b.name} lamentando ${pick(['l\'attesa', 'i prezzi', 'la scortesia del personale', 'la qualità'])}.`, opts: ['Rispondi e offri un buono (150 €)', 'Ignora'], minor: true, auto: 0 });
      break;
    case 'influencer': {
      const cost = rint(3, 8) * 100;
      queueEvent({ type: 'influencer', biz: b.id, cost, title: 'Proposta di un influencer', text: `Un influencer locale propone un post su ${b.name} in cambio di ${eur(cost * 1.22)} tra prodotti e compenso.`, opts: ['Accetta', 'Rifiuta'], minor: true, auto: 1 });
      break;
    }
    case 'infortunio': {
      const cost = rint(3, 10) * 1000;
      queueEvent({ type: 'infortunio', biz: b.id, cost, title: 'Cliente infortunato', text: `Un cliente è scivolato presso ${b.name} e chiede un risarcimento di ${eur(cost)}.${b.insurance ? ' Sei assicurato.' : ' Non hai un\'assicurazione attiva.'}`, opts: ['Paga e chiudi la questione', 'Vai in causa'], important: !b.insurance, minor: true, auto: 0 });
      break;
    }
    case 'grande_ordine': {
      const prods = b.products.filter(p => p.on && Object.keys(p.r).length);
      if (!prods.length) break;
      const p = pick(prods);
      const t = tplOf(b, p);
      const qty = Math.round(clamp(40 / Math.max(0.5, t.p / 3), 10, 400));
      let canDo = qty; for (const m in p.r) canDo = Math.min(canDo, Math.floor((stockOf(b, m) + incoming(b, m)) / p.r[m]));
      if (canDo < qty * 0.6) break;
      const price = round2(refPrice(b, p) * 1.15);
      queueEvent({ type: 'grande_ordine', biz: b.id, prod: p.id, qty, price, title: 'Grande ordine', text: `Un'azienda chiede a ${b.name} ${qty} × "${p.name}" a ${eur2(price)} l'uno (totale ${eur(qty * price)}). Servono le scorte necessarie in magazzino.`, opts: ['Accetta', 'Rifiuta'], minor: true, auto: 0 });
      break;
    }
    case 'furto': {
      const loss = Math.round(rint(300, 2500) * (b.insurance ? 0.2 : 1));
      cashMove(-loss, 'minusvalenze', b.id);
      queueEvent({ type: 'info', title: 'Furto', text: `Ladri presso ${b.name}: danni e merce rubata per ${eur(loss)}${b.insurance ? ' (dopo il rimborso dell\'assicurazione)' : ''}. Un impianto di allarme riduce molto il rischio.`, opts: ['Capito'], important: loss > 1000, biz: b.id });
      break;
    }
    case 'danni': {
      const cost = rint(8, 40) * 100 * clamp(Math.sqrt(b.m2 / 100), 1, 3);
      const days = rint(2, 5);
      queueEvent({ type: 'danni', biz: b.id, cost, days, title: pick(['Allagamento', 'Corto circuito', 'Infiltrazioni dal tetto']), text: `Danni al locale di ${b.name}: riparazione stimata ${eur(cost * 1.22)} e ${days} giorni di chiusura.${b.insurance ? ' L\'assicurazione copre l\'85% dei costi.' : ''}`, opts: ['Ripara subito', 'Ripara con calma (-40% costo, chiusura più lunga)'], important: true });
      break;
    }
    case 'talento': {
      const roles = T.roles.filter(r => r !== 'pulizie');
      const role = pick(roles);
      const c = makePerson(role, b.city, 35); c.id = uid('c'); c.skill = clamp(Math.max(c.skill, rint(72, 92)), 0, 100); c.city = b.city;
      const wage = Math.round(marketWage(role, b.city, c.skill) * 1.1 / 10) * 10;
      c.expected = wage;
      queueEvent({ type: 'talento', biz: b.id, cand: c, wage, title: 'Un talento cerca lavoro', text: `${c.first} ${c.last}, ${c.age} anni, ${ROLES[role].name} con competenza ${Math.round(c.skill)}${c.traits.length ? ' (' + c.traits.map(t => TRAITS[t].n).join(', ') + ')' : ''}, vorrebbe lavorare presso ${b.name} per ${eur(wage)} lordi al mese.`, opts: ['Assumi', 'Non ora'], minor: false });
      break;
    }
    case 'blackout': {
      let loss = 0;
      for (const m in b.inv) if (MATERIALS[m].shelf && MATERIALS[m].shelf <= 10) for (const l of b.inv[m]) { const q = l.q * 0.4; loss += q * l.c; l.q -= q; }
      if (loss > 1) queueEvent({ type: 'info', title: 'Blackout', text: `Un blackout ha colpito ${b.name}: perse merci deperibili per ${eur(loss)}. Un gruppo elettrogeno evita il problema.`, opts: ['Capito'], biz: b.id });
      break;
    }
    case 'lite':
      queueEvent({ type: 'lite', biz: b.id, title: 'Tensioni nel personale', text: `Due dipendenti di ${b.name} hanno litigato e il clima è teso.`, opts: ['Organizza una cena di squadra (330 €)', 'Lascia correre'], minor: true, auto: 0 });
      break;
    case 'locale_in_vendita': {
      const city = CITY[b.city], d = DISTRICT[b.district];
      const price = Math.round(b.m2 * city.propM2 * d.prop * S.market.index[b.city] * (T.propFactor || (T.mode === 'production' ? 0.35 : 1.1)) * rfloat(0.9, 1.05) / 1000) * 1000;
      queueEvent({ type: 'locale_in_vendita', biz: b.id, price, title: 'Il proprietario vende il locale', text: `Il proprietario del locale di ${b.name} lo mette in vendita a ${eur(price)} (+9% tra notaio e imposte). Oggi paghi ${eur(b.rent)} al mese di affitto.`, opts: ['Compra in contanti', 'Compra con mutuo al 70% (20 anni)', 'Non comprare'], important: true });
      break;
    }
    case 'offerta_acquisto': {
      const price = Math.round(bizValuation(b) * rfloat(0.95, 1.45) / 1000) * 1000;
      if (price < 5000) break;
      queueEvent({ type: 'offerta_acquisto', biz: b.id, price, title: 'Offerta di acquisto', text: `Un imprenditore offre ${eur(price)} per rilevare ${b.name} con personale e attrezzature. Valutazione stimata: ${eur(bizValuation(b))}.`, opts: ['Vendi', 'Rifiuta'], important: true });
      break;
    }
    case 'ispettorato': {
      const over = empsOf(b.id).filter(e => weeklyHours(e) > 48);
      const fine = over.length * 1500;
      cashMove(-fine, 'imposte_varie', b.id);
      queueEvent({ type: 'info', title: 'Ispettorato del lavoro', text: `Controllo presso ${b.name}: ${over.length} dipendenti superano le 48 ore settimanali. Sanzione di ${eur(fine)}.`, opts: ['Capito'], important: true, biz: b.id });
      break;
    }
  }
}

function makeGlobalEvent(kind, info) {
  const cities = [...new Set(S.biz.map(b => b.city))];
  switch (kind) {
    case 'evento_citta': {
      const c = pick(cities);
      const ev = pick(['un grande concerto', 'una fiera internazionale', 'una maratona', 'un festival gastronomico', 'una partita di cartello', 'una settimana della moda']);
      addEffect('city:' + c, 'demand', 1.35, 3, ev);
      queueEvent({ type: 'info', title: 'Evento in città', text: `A ${CITY[c].name} c'è ${ev}: nei prossimi 3 giorni +35% di clienti per le attività in città.`, opts: ['Ottimo'], important: false });
      break;
    }
    case 'sciopero':
      addEffect('global', 'reliability', 0.6, 5, 'sciopero dei trasporti');
      queueEvent({ type: 'info', title: 'Sciopero dei trasporti', text: 'Per 5 giorni le consegne dei fornitori potranno subire ritardi: controlla le scorte.', opts: ['Capito'], important: true });
      break;
    case 'energia':
      addEffect('global', 'energy', 1.28, 60, 'rincari energia');
      queueEvent({ type: 'info', title: 'Rincari dell\'energia', text: 'Il prezzo dell\'energia sale del 28% per i prossimi 2 mesi.', opts: ['Capito'], important: true });
      break;
    case 'crisi_materia': {
      const used = new Set(); for (const b of S.biz) for (const m of bizType(b).materials) used.add(m);
      const m = pick([...used]); if (!m) break;
      const mult = rfloat(1.2, 1.45);
      addEffect('mat:' + m, 'matPrice', mult, 45, 'crisi ' + m);
      queueEvent({ type: 'info', title: 'Crisi di approvvigionamento', text: `Il prezzo di ${MATERIALS[m].name} aumenta del ${pct(mult - 1)} per 45 giorni.`, opts: ['Capito'], important: true });
      break;
    }
    case 'boom': {
      const c = pick(cities);
      addEffect('city:' + c, 'demand', 1.15, 20, 'boom turistico');
      queueEvent({ type: 'info', title: 'Boom turistico', text: `${CITY[c].name} è di moda: +15% clienti per 20 giorni.`, opts: ['Ottimo'] });
      break;
    }
    case 'normativa': {
      const cost = Math.round(S.biz.length * rint(5, 15) * 100 * S.eco.priceLevel);
      queueEvent({ type: 'normativa', cost, title: 'Nuova normativa', text: `È entrata in vigore una nuova normativa su ${pick(['sicurezza sul lavoro', 'privacy e dati dei clienti', 'tracciabilità alimentare', 'prevenzione incendi', 'accessibilità dei locali'])}. Adeguare tutte le attività costa ${eur(cost * 1.22)}.`, opts: ['Adegua subito', 'Rimanda (rischio multa)'], important: true });
      break;
    }
    case 'controllo_fiscale': {
      const rev = annualRevenue();
      const covered = Math.min(1, hqCount('contabile') * 12 / Math.max(1, S.biz.length));
      if (chance(0.35 * (1 - covered * 0.8))) {
        const fine = Math.round(Math.max(800, rev * rfloat(0.005, 0.02)) / 100) * 100;
        cashMove(-fine, 'imposte_varie');
        queueEvent({ type: 'info', title: 'Verifica fiscale', text: `La Guardia di Finanza ha trovato irregolarità formali nella contabilità: sanzione di ${eur(fine)}. Avere contabili in sede riduce questo rischio.`, opts: ['Capito'], important: true });
      } else queueEvent({ type: 'info', title: 'Verifica fiscale', text: 'Controllo fiscale concluso senza rilievi.', opts: ['Ok'] });
      break;
    }
    case 'bando': {
      const amount = rint(5, 25) * 1000;
      queueEvent({ type: 'bando', amount, title: 'Bando regionale', text: `La Regione ha aperto un bando per l'innovazione delle piccole imprese: contributo a fondo perduto di ${eur(amount)}. La pratica costa ${eur(732)}.`, opts: ['Partecipa', 'Non partecipare'] });
      break;
    }
    case 'prestito_agevolato': {
      const amount = rint(3, 10) * 10000;
      const rate = Math.max(0.005, S.eco.bce - 0.005);
      queueEvent({ type: 'prestito_agevolato', amount, rate, title: 'Finanziamento agevolato', text: `Grazie a un fondo di garanzia statale puoi ottenere ${eur(amount)} in 5 anni al tasso agevolato del ${pct(rate, 2)}.`, opts: ['Accetta', 'Rifiuta'] });
      break;
    }
    case 'sponsor': {
      const c = pick(cities);
      const cost = rint(10, 30) * 100;
      queueEvent({ type: 'sponsor', city: c, cost, title: 'Sponsorizzazione', text: `La squadra di calcio dilettantistica di ${CITY[c].name} cerca uno sponsor: ${eur(cost)} per la stagione.`, opts: ['Sponsorizza', 'Rifiuta'] });
      break;
    }
    case 'promo_concorrente': {
      const b = pick(S.biz.filter(x => bizType(x).mode === 'shop'));
      if (!b) break;
      const list = compsIn(b.city, b.district, b.type);
      if (!list.length) break;
      const c = pick(list);
      c.pi = round2(clamp(c.pi - 0.12, 0.65, 1.5)); c.aw = clamp(c.aw + 10, 0, 100);
      queueEvent({ type: 'info', title: 'Promozione aggressiva', text: `${c.name}, concorrente di ${b.name}, ha abbassato i prezzi e lanciato una forte campagna pubblicitaria.`, opts: ['Capito'], important: true, biz: b.id });
      break;
    }
  }
  void info;
}

// ---------- cessione / chiusura attività ----------
function bizBookValues(b) {
  return sum(S.assets.filter(a => a.biz === b.id), a => a.book) + inventoryValue(b);
}
function sellBusiness(b, price) {
  const bookV = bizBookValues(b);
  const emps = empsOf(b.id);
  const tfr = sum(emps, e => e.tfr || 0);
  for (const e of emps) delete S.emps[e.id];
  S.assets = S.assets.filter(a => a.biz !== b.id);
  if (b.deposit) cashMove(b.deposit, 'cauzioni', b.id);
  let propValue = 0;
  if (b.propId) {
    const p = S.props.find(x => x.id === b.propId);
    if (p) { propValue = p.value; S.props = S.props.filter(x => x !== p); payoffPropertyLoan(p); }
  }
  const net = price + propValue - tfr;
  cashMove(net, 'cessioni');
  bookOnly('plusvalenze', price - tfr - bookV);
  bookOnly('cessioni', -(price - tfr - bookV));
  S.orders = S.orders.filter(o => o.biz !== b.id);
  S.biz = S.biz.filter(x => x !== b);
  log(`Hai ceduto "${b.name}" per ${eur(price)}${propValue ? ' più ' + eur(propValue) + ' per l\'immobile' : ''}. I dipendenti sono passati al nuovo titolare.`, 'good');
}
function closeBusiness(b) {
  for (const e of empsOf(b.id)) fireEmployee(e, 'licenziato');
  const equipBook = sum(S.assets.filter(a => a.biz === b.id), a => a.book);
  const resale = equipBook * 0.25 + inventoryValue(b) * 0.3;
  cashMove(resale, 'cessioni');
  bookOnly('minusvalenze', -(equipBook + inventoryValue(b) - resale));
  bookOnly('cessioni', equipBook + inventoryValue(b) - resale);
  S.assets = S.assets.filter(a => a.biz !== b.id);
  if (b.deposit) cashMove(b.deposit, 'cauzioni', b.id);
  if (b.propId) { const p = S.props.find(x => x.id === b.propId); if (p) p.biz = null; }
  S.orders = S.orders.filter(o => o.biz !== b.id);
  S.biz = S.biz.filter(x => x !== b);
  log(`Hai chiuso "${b.name}". Ricavati ${eur(resale)} dalla vendita di attrezzature e merci.`, 'bad');
}

/** trasforma un concorrente in una tua attività */
function convertCompetitor(c) {
  const T = BUSINESS_TYPES[c.type];
  const L = rentListings(c.city, c.district, c.type)[1];
  const b = {
    id: uid('b'), name: c.name.replace(/ \(.*\)$/, ''), type: c.type, city: c.city, district: c.district, brand: null,
    m2: L.m2, rent: L.rent, propId: null, deposit: L.deposit, status: 'open', opened: S.day, created: S.day,
    hours: [...T.hours], days: [...T.days], closures: [], equip: {}, upg: {}, products: [], inv: {}, restock: {},
    aw: c.aw, rep: c.rep, sat: 60, mkBudget: 0, insurance: false, discount: 0, hist: [], reviews: [], today: null, license: T.license,
    paidRentMonth: monthKey(S.day),
  };
  b.products = T.products.filter(p => !p.lock || hasResearch(p.lock)).map(p => productFromTemplate(p));
  for (const p of b.products) p.price = round2(p.price * c.pi * S.eco.priceLevel);
  for (const e of T.equip) if (e.req || chance(0.4)) {
    const tier = c.q > 70 ? 1 : 0;
    const cost = equipCost(e, tier) * 0.6;
    b.equip[e.cat] = { tier, cond: rint(55, 85), bought: S.day, asset: addAsset(cost, 5, e.n, b.id), broken: false };
  }
  S.biz.push(b);
  // personale
  const staffPlan = T.roles.filter(r => r !== 'manager').slice(0, 3);
  const opens = openHours(b);
  for (const r of staffPlan) {
    const n = r === staffPlan[0] ? Math.max(1, Math.ceil(opens / 8)) : 1;
    for (let i = 0; i < n; i++) {
      const p = makePerson(r, c.city, (c.q - 50) / 3);
      const e = Object.assign(p, { id: uid('e'), biz: b.id, wage: marketWage(r, c.city, p.skill), contract: 'indeterminato', end: null, hours: 8, wdays: defaultWdays(b), hired: S.day, fatigue: 10, exp: 200, holidays: 15, tfr: 0, sickUntil: 0, holidayUntil: 0, trainUntil: 0, monthExtra: 0, consec: 0, lastRaise: S.day, city: c.city });
      delete e.expected;
      S.emps[e.id] = e;
    }
  }
  autoShifts(b);
  // scorte iniziali
  for (const m of T.materials) {
    const sg = suggestRestock(b, m, 60);
    if (sg.target > 0) { addStock(b, m, sg.target, 60, MATERIALS[m].price * S.eco.priceLevel); b.restock[m] = { on: true, min: sg.min, target: sg.target, sup: m + '_std' }; }
  }
  S.comps = S.comps.filter(x => x !== c);
  log(`Acquisita l'attività "${b.name}" a ${CITY[b.city].name}.`, 'good', b.id);
  return b;
}

// ---------- Immobili ----------
const PROP_KINDS = { residenziale: { n: 'Appartamento', f: 1.0 }, commerciale: { n: 'Locale commerciale', f: 1.1 }, industriale: { n: 'Capannone', f: 0.35 } };
function propListings(cityId) {
  const city = CITY[cityId];
  const r = hrng(hashStr('P' + cityId + monthKey(S.day)));
  const out = [];
  const idx = S.market.index[cityId];
  for (let i = 0; i < 10; i++) {
    const kind = i < 5 ? 'residenziale' : i < 8 ? 'commerciale' : 'industriale';
    const dists = kind === 'industriale' ? ['industriale', 'periferia'] : DISTRICTS.filter(d => d.id !== 'industriale').map(d => d.id);
    const district = dists[Math.floor(r() * dists.length)];
    const d = DISTRICT[district];
    const m2 = kind === 'residenziale' ? Math.round(45 + r() * 95) : kind === 'commerciale' ? Math.round(40 + r() * 260) : Math.round(300 + r() * 1200);
    const price = Math.round(m2 * city.propM2 * d.prop * idx * PROP_KINDS[kind].f * (0.85 + r() * 0.3) / 1000) * 1000;
    const rent = Math.round(price * (0.042 + r() * 0.025) / 12 / 10) * 10;
    const id = `P${cityId}${monthKey(S.day)}${i}`;
    if (S.market.bought[id]) continue;
    out.push({ id, city: cityId, district, kind, m2, price, rent, cond: r() < 0.3 ? 'da ristrutturare' : 'buono' });
  }
  return out;
}
function buyProperty(L, mortgagePct, years) {
  const fees = L.price * 0.09;
  const loanAmt = Math.round(L.price * mortgagePct);
  if (S.cash < L.price + fees - loanAmt) return { err: 'Liquidità insufficiente.' };
  if (loanAmt > 0) {
    if (S.credit.score < 30) return { err: 'La banca non concede il mutuo con il tuo rating attuale.' };
    takeLoan('nazionale', 'mutuo', loanAmt, years * 12, { label: PROP_KINDS[L.kind].n + ' ' + CITY[L.city].name });
  }
  const p = { id: uid('h'), city: L.city, district: L.district, kind: L.kind, m2: L.m2, value: L.price, bought: L.price, idx0: S.market.index[L.city], day: S.day, biz: null, tenant: null, rentAsk: L.rent, rentOut: false, cond: L.cond };
  if (loanAmt > 0) S.loans[S.loans.length - 1].prop = p.id;
  S.props.push(p);
  S.market.bought[L.id] = true;
  cashMove(-L.price, 'immobili');
  cashMove(-L.price * 0.02, 'licenze');
  cashMove(-L.price * 0.07, 'imposte_varie');
  log(`Hai acquistato: ${PROP_KINDS[L.kind].n} di ${L.m2} m² a ${CITY[L.city].name} (${DISTRICT[L.district].name}) per ${eur(L.price)}.`, 'good');
  unlockAch('primo_immobile');
  return { ok: true };
}
function payoffPropertyLoan(p) {
  for (const l of S.loans.filter(x => x.prop === p.id)) { cashMove(-l.balance, 'rimborsi'); l.balance = 0; }
  S.loans = S.loans.filter(l => l.balance > 0);
}
function sellProperty(p) {
  if (p.biz) return { err: 'Nell\'immobile c\'è una tua attività: chiudila o vendila prima.' };
  const price = Math.round(p.value * rfloat(0.95, 1.02));
  const agency = price * 0.03;
  cashMove(price, 'immobili'); cashMove(-agency, 'commissioni');
  const gain = price - p.bought;
  bookOnly(gain >= 0 ? 'plusvalenze' : 'minusvalenze', gain); bookOnly('immobili', -gain);
  payoffPropertyLoan(p);
  S.props = S.props.filter(x => x !== p);
  log(`Venduto immobile a ${CITY[p.city].name} per ${eur(price)} (${gain >= 0 ? 'plusvalenza' : 'minusvalenza'} ${eur(gain)}).`, gain >= 0 ? 'good' : 'bad');
  return { ok: true, price };
}
function propertiesMonth(t) {
  for (const p of S.props) {
    p.value = Math.round(p.bought * S.market.index[p.city] / (p.idx0 || 1));
    if (p.renovated) p.value = Math.round(p.value * 1.12);
    cashMove(-p.value * 0.0008, 'manutenzione', p.biz || null);
    if (p.biz) continue;
    if (p.tenant) {
      if (p.tenant.arrears > 0 && chance(0.5)) { p.tenant.arrears--; continue; }
      cashMove(p.tenant.rent, 'affitti_attivi');
      if (chance(0.012)) queueEvent({ type: 'inquilino_moroso', prop: p.id, title: 'Inquilino moroso', text: `L'inquilino del tuo immobile a ${CITY[p.city].name} (${p.m2} m²) non paga l'affitto di ${eur(p.tenant.rent)}.`, opts: ['Avvia lo sfratto (2.000 €)', 'Concedi una dilazione'], important: true });
      else if (chance(0.02)) { log(`L'inquilino ha lasciato il tuo immobile a ${CITY[p.city].name}.`, 'info'); p.tenant = null; }
    } else if (p.rentOut && (!p.vacantUntil || p.vacantUntil <= S.day)) {
      const fair = fairRent(p);
      const pr = clamp(0.5 * Math.pow(fair / Math.max(1, p.rentAsk), 3), 0.02, 0.9);
      if (chance(pr)) { p.tenant = { rent: p.rentAsk, since: S.day }; log(`Trovato un inquilino per il tuo immobile a ${CITY[p.city].name}: ${eur(p.rentAsk)} al mese.`, 'good'); }
    }
  }
  void t;
}
function fairRent(p) { return Math.round(p.value * 0.052 / 12 / 10) * 10 * (p.kind === 'industriale' ? 1.15 : 1); }

// ---------- Franchising ----------
function franchiseAvailable() {
  return hasResearch('franchising') && S.brands.some(br => S.biz.filter(b => b.brand === br.id).length >= 5);
}
function franchiseMonth() {
  const F = S.franchise;
  if (!F.on) return;
  const br = S.brands.find(x => x.id === F.brand);
  if (!br) { F.on = false; return; }
  const list = S.biz.filter(b => b.brand === br.id);
  const rep = list.length ? avg(list, b => b.rep) : 40;
  const expected = br.aw / 100 * 1.6 * (rep / 60) * (F.entry > 25000 ? 0.6 : F.entry < 12000 ? 1.4 : 1) * (F.fee > 900 ? 0.6 : F.fee < 400 ? 1.4 : 1);
  let n = 0; for (let i = 0; i < 4; i++) if (chance(expected / 4)) n++;
  if (F.affiliates + n > 400) n = 0;
  if (n > 0) { F.affiliates += n; cashMove(n * F.entry, 'royalties'); log(`${n} nuovi affiliati in franchising per il marchio ${br.name} (+${eur(n * F.entry)} di quote d'ingresso).`, 'good'); unlockAch('franchising'); }
  if (F.affiliates > 0) {
    income(F.affiliates * F.fee * S.eco.priceLevel * 1.22, 0.22, 'royalties');
    if (chance(0.01 * F.affiliates / 10)) { F.affiliates--; log('Un affiliato ha lasciato la rete in franchising.', 'info'); }
    if (chance(0.03)) { br.aw = clamp(br.aw - 8, 0, 100); queueEvent({ type: 'info', title: 'Affiliato scorretto', text: `Un affiliato del marchio ${br.name} è finito sui giornali per pessimo servizio: notorietà del marchio -8.`, opts: ['Capito'], important: true }); }
  }
}

// ---------- Borsa ----------
function stockDef(tk) { return STOCKS.find(s => s.tk === tk); }
function stockPrice(tk) {
  if (S.ipo && tk === S.ipo.tk) return S.ipo.price;
  const s = S.stocks.find(x => x.tk === tk); return s ? s.price : 0;
}
function stockMarketDay(info) {
  const mkt = gauss(0.00025, 0.0085) + (S.eco.index - 1) * 0.0009;
  S.marketRet = mkt;
  for (const s of S.stocks) {
    const d = stockDef(s.tk);
    s.prev = s.price;
    const ret = 0.0001 + d.beta * mkt + d.vol * gauss(0, 0.85);
    s.price = Math.max(0.05, round2(s.price * Math.exp(ret) * 1000) / 1000);
    s.hist.push(s.price); if (s.hist.length > 120) s.hist.shift();
    // dividendi trimestrali
    const q = info.y * 10 + Math.floor(info.m / 3);
    if ([2, 5, 8, 11].includes(info.m) && info.d >= 20 && s.divQ !== q) {
      s.divQ = q;
      const h = S.holdings[s.tk];
      if (h && h.qty > 0 && d.div > 0) {
        const gross = h.qty * s.price * d.div / 4;
        cashMove(gross * 0.74, 'dividendi');
        log(`Dividendo ${d.n}: ${eur(gross * 0.74)} netti (ritenuta 26%).`, 'good');
      }
    }
  }
  if (S.ipo) ipoDay();
}
function tradeCommission(v) { return Math.max(5, v * 0.002); }
function buyStock(tk, qty) {
  qty = Math.floor(qty); if (qty <= 0) return { err: 'Quantità non valida.' };
  const price = stockPrice(tk); const v = price * qty; const fee = tradeCommission(v);
  if (S.cash < v + fee) return { err: 'Liquidità insufficiente.' };
  const s = S.stocks.find(x => x.tk === tk);
  const h = S.holdings[tk] || (S.holdings[tk] = { qty: 0, avg: 0 });
  if (s && h.qty + qty > s.shares) return { err: 'Non ci sono abbastanza azioni sul mercato.' };
  h.avg = (h.avg * h.qty + v) / (h.qty + qty); h.qty += qty;
  cashMove(-v, 'titoli'); cashMove(-fee, 'commissioni');
  // acquisti importanti spingono in alto il prezzo
  if (s) { const impact = qty / s.shares * 3; s.price = round2(s.price * (1 + impact) * 1000) / 1000; }
  unlockAch('prima_azione');
  checkTakeover(tk);
  return { ok: true };
}
function sellStock(tk, qty) {
  const h = S.holdings[tk]; qty = Math.floor(qty);
  if (!h || qty <= 0 || qty > h.qty) return { err: 'Quantità non valida.' };
  const price = stockPrice(tk); const v = price * qty; const fee = tradeCommission(v);
  const gain = (price - h.avg) * qty;
  cashMove(v, 'titoli'); cashMove(-fee, 'commissioni');
  bookOnly(gain >= 0 ? 'plusvalenze' : 'minusvalenze', gain); bookOnly('titoli', -gain);
  if (gain > 0) cashMove(-gain * 0.26, 'imposte_varie');
  h.qty -= qty; if (h.qty <= 0) delete S.holdings[tk];
  const s = S.stocks.find(x => x.tk === tk);
  if (s) { const impact = qty / s.shares * 3; s.price = round2(s.price * (1 - impact) * 1000) / 1000; }
  return { ok: true, gain };
}
function checkTakeover(tk) {
  const d = stockDef(tk); const s = S.stocks.find(x => x.tk === tk); const h = S.holdings[tk];
  if (!d || !d.types || !s || !h) return;
  if (h.qty / s.shares > 0.5 && !S.events.some(e => e.type === 'takeover' && e.tk === tk)) {
    const n = S.comps.filter(c => c.owner === tk).length;
    queueEvent({ type: 'takeover', tk, title: 'Controllo societario', text: `Possiedi più del 50% di ${d.n}. Puoi incorporare la società: le sue ${n} attività diventeranno tue e le azioni verranno ritirate dalla Borsa (le azioni restanti saranno liquidate dagli altri soci al prezzo attuale).`, opts: ['Incorpora la società', 'Non ora'], important: true });
  }
}
function doTakeover(tk) {
  const d = stockDef(tk); const s = S.stocks.find(x => x.tk === tk); const h = S.holdings[tk];
  if (!s || !h || h.qty / s.shares <= 0.5) return 'Non hai più la maggioranza.';
  const list = S.comps.filter(c => c.owner === tk);
  for (const c of list) convertCompetitor(c);
  // il valore delle azioni diventa avviamento delle nuove attività
  delete S.holdings[tk];
  S.stocks = S.stocks.filter(x => x !== s);
  unlockAch('acquisizione');
  unlockAch('scalata');
  log(`Hai incorporato ${d.n}: ${list.length} nuove attività nel tuo gruppo.`, 'good');
  return `${list.length} attività acquisite.`;
}

// ---------- Quotazione (IPO) ----------
function ipoRequirements() {
  const out = [];
  out.push({ ok: S.meta.legal === 'spa', t: 'Forma giuridica S.p.A.' });
  out.push({ ok: S.nw >= 2000000, t: 'Patrimonio netto di almeno 2.000.000 €' });
  out.push({ ok: S.biz.length >= 5, t: 'Almeno 5 attività' });
  out.push({ ok: recentDaily(180).profit > 0, t: 'Utile positivo negli ultimi 6 mesi' });
  return out;
}
function doIPO(pctFloat) {
  const val = companyValuation();
  const shares = 10000000;
  const price = round2(val / shares * 100) / 100;
  const floatShares = Math.round(shares * pctFloat);
  const proceeds = floatShares * price;
  const tk = S.meta.company.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  S.ipo = { tk, shares, float: floatShares, price, hist: [price], day: S.day, sentiment: 1 };
  cashMove(proceeds, 'capitale');
  cashMove(-proceeds * 0.06, 'consulenze');
  log(`Quotazione in Borsa completata! Collocato il ${pct(pctFloat)} delle azioni a ${eur2(price)}: raccolti ${eur(proceeds)} (commissioni 6%).`, 'good');
  unlockAch('quotazione');
  return { ok: true };
}
function ipoDay() {
  const I = S.ipo;
  const fund = Math.max(0.01, companyValuation() / I.shares);
  const r90 = recentDaily(90);
  const growth = r90.days > 30 ? clamp(r90.profit / Math.max(1, Math.abs(recentDaily(180).profit - r90.profit)) - 1, -0.5, 0.5) : 0;
  I.sentiment = clamp(I.sentiment + gauss(0, 0.01) + growth * 0.002 + (S.marketRet || 0), 0.6, 1.6);
  const target = fund * I.sentiment;
  I.price = Math.max(0.01, round2((I.price + (target - I.price) * 0.04) * Math.exp(gauss(0, 0.012)) * 100) / 100);
  I.hist.push(I.price); if (I.hist.length > 120) I.hist.shift();
}
function playerShareFraction() { return S.ipo ? 1 - S.ipo.float / S.ipo.shares : 1; }

// ---------- Traguardi ----------
const ACHIEVEMENTS = [
  { id: 'prima_attivita', n: 'Si comincia', d: 'Apri la tua prima attività.' },
  { id: 'primo_dipendente', n: 'Datore di lavoro', d: 'Assumi il primo dipendente.' },
  { id: 'primo_mese', n: 'Primo mese in attivo', d: 'Chiudi un mese con un utile.' },
  { id: 'fatturato_100k', n: 'Fatturato 100k', d: 'Raggiungi 100.000 € di ricavi in un anno.', chk: () => S.tax.yearRevenue >= 100000 },
  { id: 'fatturato_1m', n: 'Fatturato milionario', d: 'Raggiungi 1.000.000 € di ricavi in un anno.', chk: () => S.tax.yearRevenue >= 1e6 },
  { id: 'patrimonio_250k', n: 'Piccolo imprenditore', d: 'Patrimonio netto di 250.000 €.', chk: () => S.nw >= 250000 },
  { id: 'patrimonio_1m', n: 'Milionario', d: 'Patrimonio netto di 1.000.000 €.', chk: () => S.nw >= 1e6 },
  { id: 'patrimonio_10m', n: 'Magnate', d: 'Patrimonio netto di 10.000.000 €.', chk: () => S.nw >= 1e7 },
  { id: 'patrimonio_100m', n: 'Impero economico', d: 'Patrimonio netto di 100.000.000 €.', chk: () => S.nw >= 1e8 },
  { id: 'attivita_3', n: 'Piccola catena', d: 'Possiedi 3 attività.', chk: () => S.biz.length >= 3 },
  { id: 'attivita_10', n: 'Gruppo', d: 'Possiedi 10 attività.', chk: () => S.biz.length >= 10 },
  { id: 'attivita_25', n: 'Holding', d: 'Possiedi 25 attività.', chk: () => S.biz.length >= 25 },
  { id: 'attivita_50', n: 'Conglomerato', d: 'Possiedi 50 attività.', chk: () => S.biz.length >= 50 },
  { id: 'citta_3', n: 'Fuori porta', d: 'Attività in 3 città diverse.', chk: () => new Set(S.biz.map(b => b.city)).size >= 3 },
  { id: 'citta_10', n: 'Presenza nazionale', d: 'Attività in tutte e 10 le città.', chk: () => new Set(S.biz.map(b => b.city)).size >= 10 },
  { id: 'settori_5', n: 'Diversificato', d: 'Attività di 5 tipi diversi.', chk: () => new Set(S.biz.map(b => b.type)).size >= 5 },
  { id: 'dipendenti_25', n: 'Squadra', d: '25 dipendenti.', chk: () => Object.keys(S.emps).length >= 25 },
  { id: 'dipendenti_100', n: 'Azienda vera', d: '100 dipendenti.', chk: () => Object.keys(S.emps).length >= 100 },
  { id: 'dipendenti_500', n: 'Grande impresa', d: '500 dipendenti.', chk: () => Object.keys(S.emps).length >= 500 },
  { id: 'cinque_stelle', n: 'Cinque stelle', d: 'Un\'attività con reputazione di almeno 4,8 stelle.', chk: () => S.biz.some(b => b.rep >= 95) },
  { id: 'primo_immobile', n: 'Mattone', d: 'Acquista il primo immobile.' },
  { id: 'immobili_10', n: 'Immobiliarista', d: 'Possiedi 10 immobili.', chk: () => S.props.length >= 10 },
  { id: 'prima_azione', n: 'Investitore', d: 'Compra la prima azione.' },
  { id: 'prestito_estinto', n: 'Debito saldato', d: 'Estingui un finanziamento.' },
  { id: 'filiera', n: 'Filiera corta', d: 'Rifornisci una tua attività con un tuo prodotto.' },
  { id: 'acquisizione', n: 'Shopping aziendale', d: 'Acquisisci un\'attività concorrente.' },
  { id: 'scalata', n: 'Scalata', d: 'Incorpora una società quotata.' },
  { id: 'quotazione', n: 'Piazza Affari', d: 'Quota la tua società in Borsa.' },
  { id: 'franchising', n: 'Franchisor', d: 'Ottieni il primo affiliato in franchising.' },
  { id: 'ricerca_5', n: 'Innovatore', d: 'Completa 5 progetti di ricerca.', chk: () => Object.keys(S.research.done).length >= 5 },
  { id: 'anno_1', n: 'Primo anno', d: 'Sopravvivi un anno.', chk: () => S.day - S.startDay >= 365 },
  { id: 'anno_5', n: 'Veterano', d: 'Sopravvivi cinque anni.', chk: () => S.day - S.startDay >= 1826 },
];
function unlockAch(id) {
  if (!S || S.ach[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id); if (!a) return;
  S.ach[id] = S.day;
  log(`Traguardo raggiunto: "${a.n}" - ${a.d}`, 'ach');
}
function checkAchievements() {
  for (const a of ACHIEVEMENTS) if (!S.ach[a.id] && a.chk && a.chk()) unlockAch(a.id);
  const t = ymd(S.day);
  if (t.d === 1 && !S.ach.primo_mese) {
    const pl = monthPL(prevMonthKey(monthKey(S.day)));
    if (pl.profit > 0 && S.biz.length) unlockAch('primo_mese');
  }
}
