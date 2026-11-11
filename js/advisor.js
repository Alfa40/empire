'use strict';
/* ============================================================
   EMPIRE - consulente: analizza le attività e propone azioni
   ogni consiglio: { lv: 'r'|'y'|'b', t: testo breve, acts: [[etichetta, azione, dati]] }
   ============================================================ */

function adviseBiz(b) {
  const T = bizType(b);
  const out = [];
  // area = riquadri della scheda a cui appartiene il problema
  const add = (lv, t, acts, area) => out.push({ lv, t, acts: acts || [], biz: b.id, area: [].concat(area || []) });
  const shifts = ['Sistema i turni', 'advShifts', { b: b.id }];
  if (b.status === 'setup') {
    const miss = missingRequired(b);
    if (miss.length) add('r', `Mancano ${miss.length} attrezzature`, [], 'attrezzature');
    if (!empsOf(b.id).length) add('r', 'Nessun dipendente', [['Assumi', 'hireOpen', { target: b.id }]], 'personale');
    return out;
  }
  if (b.status === 'paused') { add('r', 'Attività sospesa', [], 'impostazioni'); return out; }
  const t = b.today || {};
  // ---- ora per ora ----
  if (T.mode === 'shop' && t.hourly && t.hourly.length) {
    const byLim = {};
    for (const x of t.hourly) if (x.lim && x.d - x.s > 0.4) { const k = x.lim; (byLim[k] = byLim[k] || { h: [], lost: 0 }); byLim[k].h.push(x.h); byLim[k].lost += x.d - x.s; }
    for (const k in byLim) {
      const g = byLim[k]; if (g.lost < 2) continue;
      const when = hoursRanges(g.h);
      if (k === 'locale') add('y', `${when}: locale pieno (−${num(g.lost)})`, [['Migliorie', 'tab', { t: 'miglioramenti' }]], ['giornata', 'attrezzature']);
      else if (k === 'nessuno') add('r', `${when}: nessuno in turno (−${num(g.lost)})`, [shifts], 'giornata');
      else add('r', `${when}: manca ${ROLES[k].name} (−${num(g.lost)})`, [shifts, ['Assumi', 'hireOpen', { target: b.id, role: k }]], 'giornata');
    }
    const idle = t.hourly.filter(x => x.n >= 2 && x.d < 1.5 && !x.lim).map(x => x.h);
    if (idle.length >= 3) add('b', `Personale inattivo: ${hoursRanges(idle)}`, [shifts], 'turni');
  }
  if (t.closed === 'Nessun dipendente in servizio') add('r', 'Oggi chiusa: nessuno in turno', [shifts], ['giornata', 'turni']);
  if (T.mode === 'shop' && T.capMode !== 'day') {
    const gaps = [];
    const need = {};
    for (let d = 0; d < 7; d++) {
      if (uncoveredHours(b, d).length) gaps.push(WEEKDAYS_SHORT[d]);
      const f = shiftForecast(b, d);
      if (f) for (const g of f.probs) if (g.lim !== 'nessuno') (need[g.lim] = need[g.lim] || []).push(WEEKDAYS_SHORT[d]);
    }
    if (gaps.length) add('r', `Ore scoperte: ${gaps.join(' ')}`, [shifts], 'turni');
    for (const r in need) add('r', `Pochi ${ROLES[r].name.toLowerCase()}: ${need[r].join(' ')}`, [shifts, ['Assumi', 'hireOpen', { target: b.id, role: r }]], 'turni');
  }
  // ---- scorte ----
  if (t.stockouts && t.stockouts.length) add('r', `${T.mode === 'shop' ? 'Esauriti' : 'Mancano'}: ${t.stockouts.slice(0, 3).join(', ')}${t.stockouts.length > 3 ? '…' : ''}`, [['Ordina subito', 'advOrder', { b: b.id }]], 'magazzino');
  const mats = bizMaterials(b).filter(m => !(T.mode === 'production' && m === b.output));
  const noAuto = mats.filter(m => !(b.restock[m] && b.restock[m].on));
  if (noAuto.length) add('y', `Riordino automatico spento (${noAuto.length})`, [['Attiva', 'advRestock', { b: b.id }]], 'magazzino');
  const r14 = b.hist.slice(-14);
  const waste = sum(r14, x => x.waste || 0), rev14 = sum(r14, x => x.rev || 0);
  if (waste > 30 && waste > rev14 * 0.04) add('y', `Merce scaduta: ${eur0(waste)}`, [['Ricalcola', 'advRestock', { b: b.id }]], 'magazzino');
  // ---- prezzi ----
  if (T.mode === 'shop') {
    let hi = 0, lo = 0;
    for (const p of b.products) if (p.on) { const r = p.price / refPrice(b, p); if (r > 1.2) hi++; else if (r < 0.82) lo++; }
    if (hi) add('y', `${hi} prezzi troppo alti`, [['Sistema', 'advPrices', { b: b.id }]], 'prodotti');
    if (lo) add('b', `${lo} prezzi molto bassi`, [['Sistema', 'advPrices', { b: b.id }]], 'prodotti');
  }
  // ---- personale ----
  const emps = empsOf(b.id);
  const sad = emps.filter(e => e.morale < 40), tired = emps.filter(e => e.fatigue > 70);
  if (sad.length) add(sad.some(e => e.morale < 30) ? 'r' : 'y', `${sad.length} scontenti`, [], 'personale');
  if (tired.length) add('y', `${tired.length} stanchi`, [shifts], ['personale', 'turni']);
  const expiring = emps.filter(e => e.end && e.end - S.day <= 20 && e.contract !== 'apprendistato');
  if (expiring.length) add('b', `${expiring.length} contratti in scadenza`, [], 'personale');
  // ---- attrezzature ----
  for (const cat in b.equip) {
    const o = b.equip[cat];
    if (o.broken || o.cond < 50) add(o.broken ? 'r' : 'y', `${equipDef(b, cat).n}: ${o.broken ? 'guasta' : Math.round(o.cond) + '%'}`, [[`Ripara ${eur0(repairCost(b, cat) * 1.22)}`, 'advRepair', { b: b.id, c: cat }]], 'attrezzature');
  }
  // ---- produzione ----
  if (T.mode === 'production') {
    if (t.full) add('y', 'Magazzino pieno', [], 'produzione');
    if (b.wholesale && !b.wholesale.on && !S.biz.some(x => x.id !== b.id && bizType(x).materials.includes(b.output))) add('y', 'Nessuno compra la produzione', [], 'produzione');
  }
  // ---- risultati ----
  const r30 = recentDaily(30, b.id);
  if (S.day - b.opened > 45 && r30.days >= 25 && r30.profit < 0) add('y', `In perdita: ${eur0(r30.profit)} in 30 gg`, [], 'statistiche');
  if (T.mode === 'shop' && b.rep < 45 && b.hist.length > 10) add('y', 'Clienti poco soddisfatti', [], 'recensioni');
  if (T.mode === 'shop' && b.aw < 25 && S.day - b.opened > 10) add('b', 'Poco conosciuta', [], 'marketing');
  return out;
}
/** stato di un'area: 'bad' se c'è un problema (rosso/giallo), altrimenti 'ok' */
function areaStatus(b, area, adv) {
  adv = adv || adviseBiz(b);
  return adv.some(a => a.lv !== 'b' && a.area.includes(area)) ? 'bad' : 'ok';
}
function bizStatus(b, adv) { adv = adv || adviseBiz(b); return adv.some(a => a.lv !== 'b') ? 'bad' : 'ok'; }

function adviseGlobal() {
  const out = [];
  const add = (lv, t, acts) => out.push({ lv, t, acts: acts || [] });
  if (!S.biz.length) add('b', 'Apri la prima attività', [['Apri', 'openWizard', {}]]);
  if (S.cash < 0) add('r', `Cassa negativa${S.credit.overDays ? ` · oltre il fido da ${S.credit.overDays}/30 gg` : ''}`, [['Banca', 'nav', { v: 'bank' }]]);
  const need = -sum(deadlines(30).filter(x => x.v), x => x.v);
  if (S.cash >= 0 && need > S.cash + S.overdraft.limit) add('r', `Scadenze 30 gg: ${eur(need)} > cassa`, [['Banca', 'nav', { v: 'bank' }], ['Scadenze', 'nav', { v: 'calendar' }]]);
  if (!S.research.active && S.cash > 80000 && RESEARCH.some(r => !hasResearch(r.id))) add('b', 'Ricerca ferma', [['Ricerca', 'nav', { v: 'research' }]]);
  if (S.biz.length >= 6 && !hqCount('contabile')) add('b', 'Un contabile ridurrebbe i costi', [['Sede', 'nav', { v: 'hq' }]]);
  return out;
}

function adviseAll() {
  const lvOrder = { r: 0, y: 1, b: 2 };
  const list = adviseGlobal();
  for (const b of S.biz) list.push(...adviseBiz(b));
  return list.sort((a, c) => lvOrder[a.lv] - lvOrder[c.lv]);
}
