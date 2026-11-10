'use strict';
/* ============================================================
   EMPIRE - Panoramica: tutto in una schermata corta.
   Ogni attività = 5 riquadri (Turni, Persone, Prezzi, Scorte, Macchine).
   Un riquadro apre una finestra con i suoi elementi;
   un elemento apre la sua scheda per controllarlo e cambiarlo.
   ============================================================ */

/** riquadro piccolo: st = ok | bad | off | add */
function ovChip(label, val, st, act, data) {
  return `<button class="ovc ov-${st}"${attrs(Object.assign({ a: act }, data))}><span class="l">${label}</span>${val != null && val !== '' ? `<b>${val}</b>` : ''}</button>`;
}
const pad2 = h => String(h).padStart(2, '0');

/** le aree di un'attività: riassunto + elenco di elementi */
function ovAreas(b) {
  const T = bizType(b), shop = T.mode === 'shop';
  const it = (x, extra) => Object.assign({ b: b.id, x }, extra);
  const t = b.today || {};
  const out = [];
  // turni: i giorni della settimana
  const wdNext = ymd(S.day + 1).wd;
  let gap = 0;
  const days = WEEKDAYS_SHORT.map((w, i) => {
    const closed = !b.days[i], g = !closed && uncoveredHours(b, i).length > 0;
    if (g) gap++;
    return ovChip(WEEKDAYS[i], closed ? 'chiuso' : g ? 'scoperto' : 'ok', closed ? 'off' : g ? 'bad' : 'ok', 'ovDay', { b: b.id, d: i });
  }).join('');
  out.push({ id: 'turni', ic: '🗓️', title: 'Turni', sum: gap ? `${gap} gg scoperti` : 'coperti', bad: gap > 0, chips: days, note: 'Tocca un giorno per i turni' });
  // persone
  const emps = empsOf(b.id).slice().sort((x, y) => (y.wdays[wdNext] - x.wdays[wdNext]) || startOn(x, wdNext) - startOn(y, wdNext));
  const nBad = emps.filter(empBad).length;
  const pc = emps.map(e => {
    const st = empStatus(e), away = st !== 'Attivo';
    const val = away ? st.toLowerCase() : e.wdays[wdNext] ? `${pad2(startOn(e, wdNext))}–${pad2(Math.min(24, startOn(e, wdNext) + e.hours))}` : 'riposo';
    return ovChip(`${esc(e.first)} <small>${esc(ROLES[e.role].name)}</small>`, val, empBad(e) ? 'bad' : away || !e.wdays[wdNext] ? 'off' : 'ok', 'ov', it('empSheet', { e: e.id }));
  }).join('') + ovChip('+ Assumi', '', 'add', 'ov', it('hireOpen', { target: b.id }));
  out.push({ id: 'personale', ic: '👥', title: 'Persone', sum: !emps.length ? 'nessuno' : nBad ? `${nBad} da vedere` : `${emps.length} ok`, bad: !emps.length || nBad > 0, chips: pc, note: `Orari di domani · ${WEEKDAYS[wdNext]}` });
  // prezzi / produzione
  if (shop) {
    let nb = 0;
    const prc = b.products.map(p => {
      const tp = tplOf(b, p), r = p.price / refPrice(b, p);
      const bad = p.on && (r > 1.2 || (tp.eq && !b.equip[tp.eq]));
      if (bad) nb++;
      return ovChip(esc(p.name), p.on ? eur2(p.price) : 'spento', bad ? 'bad' : p.on ? 'ok' : 'off', 'ov', it('prodEdit', { p: p.id }));
    }).join('') + ovChip('+ Nuovo', '', 'add', 'ov', it('prodNew'));
    out.push({ id: 'prodotti', ic: '🏷️', title: 'Prezzi', sum: nb ? `${nb} da vedere` : `${b.products.filter(p => p.on).length} attivi`, bad: nb > 0, chips: prc });
  } else {
    const ws = b.wholesale || {};
    const u = MATERIALS[b.output].unit;
    const pr = ovChip(esc(MATERIALS[b.output].name), `${num(stockOf(b, b.output))} ${u}`, t.full ? 'bad' : 'ok', 'openBiz', { id: b.id, tab: 'produzione' })
      + ovChip('Ingrosso', ws.on ? (ws.price ? eur2(ws.price) : 'mercato') : 'spento', ws.on ? 'ok' : 'off', 'openBiz', { id: b.id, tab: 'produzione' });
    out.push({ id: 'produzione', ic: '🏭', title: 'Produzione', sum: t.full ? 'magazzino pieno' : `${num1((b.hist[b.hist.length - 1] || {}).prod || 0)} ${u}`, bad: !!t.full, chips: pr });
  }
  // scorte
  let so = 0;
  const sc = bizMaterials(b).filter(m => !(T.mode === 'production' && m === b.output)).map(m => {
    const st = stockOf(b, m), inc = incoming(b, m), use = avgUsage(b, m);
    const dl = use > 0 ? st / use : null;
    const bad = ((t.stockouts || []).length && st <= 0) || (dl != null && dl < 1) || (st <= 0 && !inc);
    if (bad) so++;
    const auto = b.restock[m] && b.restock[m].on;
    return ovChip(esc(MATERIALS[m].name) + (auto ? '' : ' <small>manuale</small>'), dl != null ? `${num1(dl)} gg` : `${num1(st)} ${MATERIALS[m].unit}`, bad ? 'bad' : 'ok', 'ov', it('rsSheet', { m }));
  }).join('');
  out.push({ id: 'magazzino', ic: '📦', title: 'Scorte', sum: so ? `${so} in esaurimento` : 'ok', bad: so > 0, chips: sc, note: 'Durata in giorni' });
  // macchine
  let eb = 0;
  const ec = T.equip.map(e => {
    const own = b.equip[e.cat];
    if (!own && !e.req) return ovChip(esc(e.n), 'opzionale', 'off', 'ov', it('eqSheet', { c: e.cat }));
    const bad = !own || own.broken || own.cond < 50;
    if (bad) eb++;
    return ovChip(esc(e.n), !own ? 'manca' : own.broken ? 'guasta' : Math.round(own.cond) + '%', bad ? 'bad' : 'ok', 'ov', it('eqSheet', { c: e.cat }));
  }).join('');
  out.push({ id: 'attrezzature', ic: '🛠️', title: 'Macchine', sum: eb ? `${eb} da vedere` : 'ok', bad: eb > 0, chips: ec });
  return out;
}

function ovBiz(b) {
  const T = bizType(b);
  const st = b.status === 'setup' ? 'bad' : bizStatus(b);
  const r30 = recentDaily(30, b.id);
  const tiles = ovAreas(b).map(x => `<button class="ovt ${x.bad ? 'bad' : 'ok'}" data-a="ovArea" data-b="${b.id}" data-t="${x.id}"><span class="ic">${x.ic}</span><b>${x.title}</b><small>${x.sum}</small></button>`).join('');
  const sub = b.status === 'setup' ? 'da completare' : b.status === 'paused' ? 'sospesa' : `<span class="${cls(r30.profit)}">${eur0(r30.profit)}</span> in 30 gg${T.mode === 'shop' ? ' · ' + stars(b.rep) : ''}`;
  return `<section class="ovb st-${st}"><button class="ovb-t" data-a="openBiz" data-id="${b.id}" data-tab="riepilogo"><span class="bi">${T.icon}</span><span class="nm"><b>${esc(b.name)}</b><small>${sub}</small></span><i>›</i></button><div class="ovts">${tiles}</div></section>`;
}

function ovGroup() {
  const pl = monthPL(monthKey(S.day));
  const dl = deadlines(30).filter(x => x.v);
  return `<div class="ovcs ovg">${ovChip('💶 Cassa', `<span class="${S.cash < 0 ? 'neg' : ''}">${eur0(S.cash)}</span>`, S.cash < 0 ? 'bad' : 'ok', 'moneySheet', {})}${ovChip('📆 Mese', `<span class="${cls(pl.profit)}">${eur0(pl.profit)}</span>`, pl.profit < 0 ? 'bad' : 'ok', 'nav', { v: 'finance' })}${dl.length ? ovChip('⏳ ' + fmtDateShort(dl[0].d).slice(0, 5) + ' ' + esc(dl[0].t), eur0(dl[0].v), -dl[0].v > S.cash ? 'bad' : 'ok', 'nav', { v: 'calendar' }) : ''}</div>`;
}

VIEWS.dash = () => {
  let h = `<div class="ov-head"><h1>Panoramica</h1>${hb('panoramica')}</div>`;
  h += ovGroup();
  h += S.biz.map(ovBiz).join('');
  h += `<button class="tile st-new ov-new" data-a="openWizard"${tutorialHl('openWizard') ? ' style="outline:3px dashed var(--yellow)"' : ''}><span class="ic">${S.biz.length ? '➕' : '🚀'}</span><b>${S.biz.length ? 'Nuova attività' : 'Apri la prima attività'}</b></button>`;
  return h;
};

// finestra di un'area: elenco dei suoi elementi, ognuno si tocca
ACT.ovArea = (d) => openModal('ovArea', { b: d.b, t: d.t });
MODALS.ovArea = (M) => {
  const b = getBiz(M.b); if (!b) return '';
  const x = ovAreas(b).find(a => a.id === M.t); if (!x) return '';
  return sheet(`${x.ic} ${x.title}`, `<small class="muted">${esc(b.name)}${x.note ? ' · ' + x.note : ''}</small><div class="ovcs ovlist">${x.chips}</div>`, btn('Sezione completa ›', 'openBiz', { id: b.id, tab: x.id }), { help: 'panoramica' });
};
// apre la scheda di un elemento; chiudendola si torna all'elenco
ACT.ov = (d) => {
  const back = UI.modal;
  UI.biz = d.b;
  const fn = ACT[d.x]; if (!fn) return;
  fn(d);
  if (back && UI.modal && UI.modal !== back && !UI.modal.back) { UI.modal.back = back; render(); }
};
ACT.ovDay = (d) => { UI.modal = null; UI.view = 'biz'; UI.biz = d.b; UI.tab = 'turni'; UI.tday = +d.d; render(); window.scrollTo(0, 0); };

// ---------- scheda di una macchina ----------
ACT.eqSheet = (d) => openModal('eq', { c: d.c });
MODALS.eq = (M) => {
  const b = curBiz(); if (!b) return '';
  const e = equipDef(b, M.c); if (!e) return '';
  const own = b.equip[e.cat];
  const buys = [0, 1, 2].filter(i => !own || i > own.tier || own.broken).map(i => btn(`${TIER_NAMES[i].split(' ')[0]} · ${eur0(equipCost(e, i) * 1.22)}`, 'eqBuy', { c: e.cat, t: i }, 'sm' + (!own && i === 0 ? ' pri' : '')));
  return sheet(esc(e.n), `<div class="kpis">${kpi('Effetto', EQ_KIND[e.kind])}${kpi('Livello', own ? TIER_NAMES[own.tier].split(' ')[0] : '—', '', own ? '' : 'neg')}${own ? kpi('Stato', Math.round(own.cond) + '%', own.broken ? 'guasta' : '', own.broken || own.cond < 50 ? 'neg' : '') : ''}</div>
    ${e.req ? `<div class="row mb">${badge('Obbligatoria', 'y')}</div>` : ''}
    <label class="row mb"><input type="checkbox" data-c="eqLeasing" ${UI.leasing ? 'checked' : ''}> Leasing</label>
    <h4>${own ? 'Cambia' : 'Compra'}</h4><div class="row">${buys.join('') || '<small class="muted">Già al massimo</small>'}</div>`,
    (own && (own.cond < 80 || own.broken) ? btn(`Ripara · ${eur0(repairCost(b, e.cat) * 1.22)}`, 'eqRepair', { c: e.cat }, 'ok') : '') + btn('OK', 'closeModal', {}, 'pri'), { help: 'attrezzature' });
};
