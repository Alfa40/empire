'use strict';
/* ============================================================
   EMPIRE - scheda di un'attività
   ============================================================ */

function curBiz() { return getBiz(UI.biz); }
const EQ_KIND = { speed: 'Velocità', phys: 'Capacità', quality: 'Qualità', prod: 'Produzione' };
const CONTRACTS = { indeterminato: 'Indeterminato', determinato: 'Determinato', apprendistato: 'Apprendistato', stagionale: 'Stagionale' };
const BIZ_TABS = {};
function bizTabs(T) {
  return T.mode === 'shop'
    ? [['riepilogo', 'Riepilogo'], ['giornata', 'Giornata'], ['turni', 'Turni'], ['personale', 'Personale'], ['prodotti', 'Prezzi'], ['magazzino', 'Magazzino'], ['attrezzature', 'Attrezzature'], ['miglioramenti', 'Migliorie'], ['marketing', 'Marketing'], ['impostazioni', 'Impostazioni'], ['statistiche', 'Conti'], ['recensioni', 'Recensioni']]
    : [['riepilogo', 'Riepilogo'], ['produzione', 'Produzione'], ['giornata', 'Giornata'], ['turni', 'Turni'], ['personale', 'Personale'], ['magazzino', 'Magazzino'], ['attrezzature', 'Attrezzature'], ['miglioramenti', 'Migliorie'], ['impostazioni', 'Impostazioni'], ['statistiche', 'Conti']];
}
const BIZ_SECTIONS = {
  riepilogo: ['🏠', 'Riepilogo', 'green'], giornata: ['⏰', 'Giornata', 'orange'], turni: ['🗓️', 'Turni', 'orange'], personale: ['👥', 'Personale', 'orange'],
  prodotti: ['🏷️', 'Prezzi', 'purple'], produzione: ['🏭', 'Produzione', 'teal'], magazzino: ['📦', 'Magazzino', 'teal'], attrezzature: ['🛠️', 'Attrezzature', 'teal'],
  miglioramenti: ['✨', 'Migliorie', 'teal'], marketing: ['📣', 'Marketing', 'purple'], statistiche: ['📊', 'Conti', 'green'], recensioni: ['⭐', 'Recensioni', 'yellow'], impostazioni: ['⚙️', 'Impostazioni', 'gray'],
};
function tileInfo(b, id) {
  const T = bizType(b), t = b.today || {}, x = b.hist[b.hist.length - 1] || {};
  const emps = empsOf(b.id);
  switch (id) {
    case 'giornata': { const lost = x.lost || 0; return [T.mode === 'shop' ? (lost ? `−${num(lost)} persi` : num(x.cust || 0) + ' clienti') : num1(x.prod || 0) + ' prodotti', lost > 2 ? 'r' : null]; }
    case 'turni': { let g = 0; for (let d = 0; d < 7; d++) if (dayBad(b, d)) g++; return [g ? `${g} giorni da sistemare` : emps.length + ' persone', g ? 'r' : null]; }
    case 'personale': { const sad = emps.filter(e => e.morale < 40).length; return [sad ? `${sad} scontenti` : plural(emps.length, 'dipendente', 'dipendenti'), sad ? 'y' : null]; }
    case 'prodotti': { let off = 0; for (const p of b.products) if (p.on) { const r = p.price / refPrice(b, p); if (r > 1.2 || r < 0.82) off++; } return [off ? `${off} prezzi fuori` : b.products.filter(p => p.on).length + ' attivi', off ? 'y' : null]; }
    case 'produzione': return [MATERIALS[b.output].name, t.full ? 'y' : null];
    case 'magazzino': { const so = (t.stockouts || []).length; return [so ? `${so} esauriti` : 'ok', so ? 'r' : null]; }
    case 'attrezzature': { const br = Object.values(b.equip).filter(o => o.broken).length, worn = Object.values(b.equip).filter(o => o.cond < 50).length; const miss = missingRequired(b).length; return [miss ? `mancano ${miss}` : br ? `${br} guaste` : worn ? `${worn} usurate` : 'ok', miss || br ? 'r' : worn ? 'y' : null]; }
    case 'miglioramenti': return [Object.keys(b.upg).length + ' installate', null];
    case 'marketing': return ['notorietà ' + Math.round(effAw(b)), null];
    case 'statistiche': { const p = monthPL(monthKey(S.day), b.id).profit; return [`<span class="${cls(p)}">${eur0(p)}</span> mese`, null]; }
    case 'recensioni': return [stars(b.rep), null];
    case 'impostazioni': return [T.capMode === 'day' || T.mode !== 'shop' ? 'orari e opzioni' : `${String(b.hours[0]).padStart(2, '0')}–${String(b.hours[1]).padStart(2, '0')}`, null];
    default: return ['', null];
  }
}
function bizHubTiles(b, fromSheet) {
  const T = bizType(b), tut = tutorialState();
  const adv = adviseBiz(b);
  const ids = bizTabs(T).map(t => t[0]).filter(id => id !== 'riepilogo');
  return `<div class="tiles">${ids.map(id => {
    const [ic, label] = BIZ_SECTIONS[id];
    let [m, flag] = tileInfo(b, id);
    const st = areaStatus(b, id, adv);
    // riquadro rosso: il motivo deve essere scritto sul riquadro
    if (st === 'bad' && flag !== 'r') { const a = adv.find(x => x.lv !== 'b' && x.area.includes(id)); if (a) m = esc(a.t); }
    const dis = tut && tut.tabs && !tut.tabs.includes(id);
    const hl = tut && tut.tab === id;
    return `<button class="tile st-${st} ${hl ? 'hl' : ''}" data-a="${fromSheet ? 'openBiz' : 'tab'}" data-id="${b.id}" data-t="${id}" data-tab="${id}"${dis ? ' disabled' : ''}><span class="ic">${ic}</span><b>${label}</b><span class="m">${m}</span></button>`;
  }).join('')}</div>`;
}
function bizPills(b) {
  const T = bizType(b), x = b.hist[b.hist.length - 1] || {}, r30 = recentDaily(30, b.id);
  const pill = (c, label, val, help) => `<button class="pill c-${c}" data-a="help" data-k="${help}"><small>${label}</small><b>${val}</b></button>`;
  return `<div class="pills">${T.mode === 'shop'
    ? pill('orange', 'Clienti', num(x.cust || 0) + (x.lost ? ` <span class="neg">−${num(x.lost)}</span>` : ''), 'giornata') + pill('green', 'Utile 30 gg', `<span class="${cls(r30.profit)}">${eur0(r30.profit)}</span>`, 'utile') + pill('yellow', 'Reputazione', stars(b.rep), 'reputazione') + pill('purple', 'Notorietà', Math.round(effAw(b)), 'notorieta') + pill('yellow', 'Qualità', Math.round(b.lastQ || 0), 'qualita')
    : pill('teal', 'Prodotti', num1(x.prod || 0), 'produzione') + pill('teal', 'Venduti', num1(x.ws || 0), 'ingrosso') + pill('green', 'Utile 30 gg', `<span class="${cls(r30.profit)}">${eur0(r30.profit)}</span>`, 'utile') + pill('teal', 'Magazzino', num(stockOf(b, b.output)), 'produzione')}</div>`;
}
VIEWS.biz = () => {
  const b = curBiz();
  if (!b) { UI.view = 'bizlist'; return VIEWS.bizlist(); }
  const T = bizType(b);
  if (!bizTabs(T).some(t => t[0] === UI.tab)) UI.tab = 'riepilogo';
  const dot = b.status === 'setup' ? 'y' : b.status === 'paused' ? 'r' : 'g';
  if (UI.tab === 'riepilogo') {
    return `<div class="bizhead">${btn('◀', 'nav', { v: 'bizlist' }, 'sm back', false, 'Attività')}<span class="bico">${T.icon}</span><h1>${esc(b.name)}</h1></div><p class="summary">${bizSummary(b)}</p>${BIZ_TABS.riepilogo(b, T)}`;
  }
  const [ic, label, c] = BIZ_SECTIONS[UI.tab];
  return `<div class="bizhead">${btn('◀', 'tab', { t: 'riepilogo' }, 'sm back', false, 'Torna a ' + b.name)}<span class="bico">${ic}</span><h1>${label}</h1></div>${(BIZ_TABS[UI.tab] || BIZ_TABS.riepilogo)(b, T)}`;
};

// ---------- Riepilogo (menu a riquadri) ----------
BIZ_TABS.riepilogo = (b, T) => bizHubTiles(b, false);
function bizSummary(b) {
  const T = bizType(b), x = b.hist[b.hist.length - 1] || {}, r30 = recentDaily(30, b.id);
  if (b.status === 'setup') return 'In allestimento';
  return `${T.mode === 'shop' ? num(x.cust || 0) + ' clienti' : num1(x.prod || 0) + ' prodotti'} · <span class="${cls(r30.profit)}">${eur0(r30.profit)}</span> in 30 gg${T.mode === 'shop' ? ' · ' + stars(b.rep) : ''}`;
}
/** problemi dell'area aperta, in cima alla sezione */
function areaProblems(b, area) {
  const list = adviseBiz(b).filter(a => a.area.includes(area));
  if (!list.length) return '';
  return `<div class="probs">${advList(list)}</div>`;
}
function histTable(b, n) {
  const T = bizType(b);
  const rows = b.hist.slice(-n).reverse().map(x => tr([`${WEEKDAYS_SHORT[ymd(x.day).wd]} ${fmtDateShort(x.day).slice(0, 5)}${x.closed ? ' ' + badge('chiusa') : ''}`,
    [T.mode === 'shop' ? num(x.cust) + (x.lost ? ` <small class="neg">−${num(x.lost)}</small>` : '') : num1(x.prod), 'n'], [eur0(x.rev), 'n'], moneyCell(x.profit)]));
  return table(['Giorno', [T.mode === 'shop' ? 'Clienti' : 'Prodotti', 'n'], ['Ricavi', 'n'], ['Utile', 'n']], rows, { empty: 'Nessun dato' });
}

// ---------- Giornata ora per ora ----------
BIZ_TABS.giornata = (b, T) => {
  const t = b.today || {};
  const hrs = t.hourly || [];
  if (!hrs.length) return sec('Giornata', 'giornata', `<p class="muted">${t.closed ? esc(t.closed) : 'Nessun dato: avanza di un giorno.'}</p>`);
  const name = id => { const e = S.emps[id]; return e ? e.first : '?'; };
  if (T.mode === 'production') {
    const max = Math.max(...hrs.map(x => x.p), 1);
    return sec('Produzione di oggi', 'giornata', `<div class="hours">${hrs.map(x => `<span class="hh">${String(x.h).padStart(2, '0')}:00</span>${meter(x.p, x.p, max)}<span class="nn">${num1(x.p)}</span><span class="nn">👤${x.n}</span>`).join('')}</div>`);
  }
  const max = Math.max(...hrs.map(x => x.d), 1);
  const served = sum(hrs, x => x.s), lost = sum(hrs, x => x.d - x.s);
  const peak = hrs.reduce((a, c) => c.d > a.d ? c : a, hrs[0]);
  const reason = l => l === 'locale' ? 'locale pieno' : l === 'nessuno' ? 'nessuno in turno' : 'manca ' + ROLES[l].name;
  const rows = hrs.map(x => `<span class="hh">${String(x.h).padStart(2, '0')}:00</span>${meter(x.s, x.d, max)}<span class="nn">${num(x.s)}/${num(x.d)}</span><span class="nn" title="${esc(x.w.map(name).join(', '))}">👤${x.n}</span>${x.lim && x.d - x.s >= 0.5 ? `<span class="why">−${num(x.d - x.s)} · ${esc(reason(x.lim))}</span>` : ''}`).join('');
  void peak;
  return `<p class="summary">${num(served)} serviti${lost >= 1 ? ` · <span class="neg">${num(lost)} persi</span>` : ''}</p>
    ${nextDaysStrip(b)}
    ${sec(`Oggi · ${WEEKDAYS[ymd(S.day).wd]}`, 'giornata', `<div class="hours">${rows}</div><div class="legend"><span><i style="background:var(--green)"></i>serviti</span><span><i style="background:var(--red)"></i>persi</span><span>👤 in turno</span></div>`, btn('Turni', 'tab', { t: 'turni' }, 'sm'))}`;
};

// ---------- Turni (griglia interattiva) ----------
BIZ_TABS.turni = (b, T) => {
  if (UI.tday == null) UI.tday = ymd(S.day + 1).wd;
  const wd = UI.tday;
  const emps = empsOf(b.id).slice().sort((a, c) => roleRank(a.role) - roleRank(c.role) || (c.wdays[wd] - a.wdays[wd]) || startOn(a, wd) - startOn(c, wd));
  const shop = T.mode === 'shop' && T.capMode !== 'day';
  let lo = shop ? b.hours[0] : 6, hi = shop ? b.hours[1] : 20;
  for (const e of emps) if (e.wdays[wd]) { lo = Math.min(lo, startOn(e, wd)); hi = Math.max(hi, startOn(e, wd) + e.hours); }
  lo = Math.max(0, lo); hi = Math.min(24, hi);
  const hours = []; for (let h = lo; h < hi; h++) hours.push(h);
  const cov = hourCoverage(b, wd);
  const isOpen = h => shop ? !!b.days[wd] && h >= b.hours[0] && h < b.hours[1] : !!b.days[wd] && h >= 8 && h < 17;
  let est = null;
  const fc = shop ? shiftForecast(b, wd) : null;
  const fh = {}; if (fc) for (const x of fc.hours) fh[x.h] = x;
  if (fc) est = h => fh[h] ? fh[h].d : 0;
  const head = `<tr><th class="nm">${WEEKDAYS[wd]}</th>${hours.map(h => `<th>${h}</th>`).join('')}</tr>`;
  const rows = emps.map(e => `<tr><td class="nm ${e.fatigue > 70 ? 'bad' : ''}"><b>${esc(e.first)}</b><small>${esc(ROLES[e.role].name)} · ${e.wdays[wd] ? shiftLabel(e, wd) : 'riposo'}${e.fatigue > 70 ? ' · <span class="neg">stanco ' + Math.round(e.fatigue) + '%</span>' : ''}</small></td>${hours.map(h => {
    const on = e.wdays[wd] && onShift(e, h, wd);
    return `<td class="cell ${on ? 'on' : ''} ${!e.wdays[wd] ? 'off' : isOpen(h) ? 'open' : ''}"><button data-a="shiftAt" data-e="${e.id}" data-h="${h}" aria-label="${esc(e.first)} dalle ${h}"></button></td>`;
  }).join('')}</tr>`).join('');
  const short = h => { const x = fh[h]; return x && x.lim && x.lim !== 'locale' && x.d - x.s >= 0.3; };
  const covRow = `<tr class="cov"><td class="nm">Copertura ${hb('copertura')}</td>${hours.map(h => `<td class="${isOpen(h) ? (!cov[h] || short(h) ? 'z' : 'ok') : ''}">${cov[h] || (isOpen(h) ? '0' : '')}</td>`).join('')}</tr>`;
  const fcBox = !b.days[wd] ? '<p class="muted">Giorno di chiusura.</p>' : fc ? (fc.probs.length
    ? `<div class="fc bad"><b>Previsione ${WEEKDAYS[wd]} ${fmtDateShort(fc.day).slice(0, 5)}: −${num(fc.lost)} clienti</b>${fc.probs.map(g => `<div class="kvl"><span class="kvn">${hoursRanges(g.h)}<small>${esc(probText(g))}</small></span><b class="neg">−${num(g.lost)}</b>${g.lim !== 'nessuno' ? btn('+ Assumi ' + ROLES[g.lim].name, 'hireOpen', { target: b.id, role: g.lim }, 'sm') : ''}</div>`).join('')}<small class="muted">Sposta o allunga i turni di chi fa quel lavoro, oppure assumi.</small></div>`
    : `<div class="fc ok"><b>Previsione ${WEEKDAYS[wd]} ${fmtDateShort(fc.day).slice(0, 5)}: ${num(fc.served)} clienti, tutti serviti</b></div>`) : '';
  const demRow = est ? `<tr class="dem"><td class="nm">Clienti attesi</td>${hours.map(h => `<td>${est(h) >= 0.5 ? num(est(h)) : ''}</td>`).join('')}</tr>` : '';
  const ctrl = emps.map(e => tr([`<b>${esc(e.first)}</b> <small>${esc(ROLES[e.role].name)}</small>`, dayToggles('empDay', e.wdays, { e: e.id }), stepper('empStart', { e: e.id }, e.starts && e.starts.some((x, i) => e.wdays[i] && x != null && x !== e.start) ? 'variabile' : String(e.start || 0).padStart(2, '0') + ':00'), stepper('empHrs', { e: e.id }, e.hours + ' h'), [`${weeklyHours(e)} h${weeklyHours(e) > 40 ? ' ' + badge('straord.', 'y') : ''}`, 'n']]));
  return sec('Turni', 'turni', `<div class="seg mb">${WEEKDAYS_SHORT.map((w, i) => btn(w + (b.days[i] ? '' : ' ✕'), 'tday', { d: i }, 'sm ' + (wd === i ? 'on ' : '') + (dayBad(b, i) ? 'bad' : b.days[i] ? 'good' : ''))).join('')}</div>
      ${emps.length ? `<div class="shift-wrap"><table class="shifts"><thead>${head}</thead><tbody>${rows}${covRow}${demRow}</tbody></table></div>
      <div class="legend"><span><i style="background:var(--accent)"></i>in turno</span><span><i style="background:var(--panel2)"></i>aperto</span><span><i style="background:var(--red-bg)"></i>personale insufficiente</span><span>tocca = inizio turno</span></div>` : `<p class="muted">Nessun dipendente.</p>`}${fcBox}`,
    btn('+ Assumi', 'hireOpen', { target: b.id }, 'sm pri'))
    + (emps.length ? sec('Orari', 'turni', table(['Dipendente', 'Giorni', 'Inizio', 'Ore', ['Sett.', 'n']], ctrl), '', { closed: true, c: 'orange', sum: plural(emps.length, 'persona', 'persone') }) : '');
};
ACT.tday = (d) => { UI.tday = +d.d; render(); };
ACT.shiftAt = (d) => {
  const e = S.emps[d.e]; if (!e) return;
  const wd = UI.tday;
  if (!e.wdays[wd]) e.wdays[wd] = 1;
  else { e.starts = e.starts || [null, null, null, null, null, null, null]; e.starts[wd] = clamp(+d.h, 0, 24 - e.hours); }
  commit();
};
ACT.empStart = (d) => { const e = S.emps[d.e]; e.start = clamp((e.start || 0) + +d.d, 0, 24 - e.hours); e.starts = null; commit(); };
ACT.empHrs = (d) => { const e = S.emps[d.e]; e.hours = clamp(e.hours + +d.d, 2, 12); e.start = clamp(e.start || 0, 0, 24 - e.hours); if (e.starts) e.starts = e.starts.map(x => x == null ? null : clamp(x, 0, 24 - e.hours)); commit(); };
ACT.empDay = (d) => { const e = S.emps[d.e]; if (!e) return; e.wdays[+d.i] = e.wdays[+d.i] ? 0 : 1; commit(); };

// ---------- Personale ----------
BIZ_TABS.personale = (b) => {
  const emps = empsOf(b.id);
  return sec(`Personale · ${emps.length}`, 'ruoli', emps.length ? '<small class="muted">Competenza · stipendio</small>' + roleSections(emps, e => e.role, empChip, s => `<div class="ovcs">${s}</div>`) : '<p class="muted">Nessuno.</p>',
    btn('+ Assumi', 'hireOpen', { target: b.id }, 'sm pri' + (tutorialHl('hire') ? ' hl' : '')));
};
function empRow(e) {
  const st = empStatus(e);
  const mw = marketWage(e.role, e.city, e.skill);
  return tr([`<b>${esc(empName(e))}</b>`, esc(ROLES[e.role].name), skillBadge(e.skill), `<span class="${e.morale < 40 ? 'neg' : ''}">${skillBadge(e.morale)}</span>`, `<span class="${e.fatigue > 70 ? 'neg' : ''}">${bar(100 - e.fatigue)} ${Math.round(e.fatigue)}</span>`,
    [`${eur0(e.wage)} <small class="${e.wage < mw * 0.95 ? 'neg' : 'muted'}">${e.wage < mw * 0.95 ? '▼' : e.wage > mw * 1.05 ? '▲' : '='}</small>`, 'n'],
    st === 'Attivo' ? badge('Attivo', 'g') : badge(st, 'y'), btn('⋯', 'empSheet', { e: e.id }, 'sm')], empBad(e) ? 'bad' : '');
}
function empBad(e) { return e.morale < 40 || e.fatigue > 70 || (e.end && e.end - S.day <= 20 && e.contract !== 'apprendistato'); }
ACT.empSheet = (d) => openModal('emp', { e: d.e });
MODALS.emp = (m) => {
  const e = S.emps[m.e]; if (!e) return '';
  const mw = marketWage(e.role, e.city, e.skill);
  const others = e.biz === 'hq' ? [] : S.biz.filter(x => x.id !== e.biz && x.city === e.city);
  const hasShift = e.biz !== 'hq';
  const tab = m.tab || (hasShift ? 'turno' : 'paga');
  const tabs = [hasShift && ['turno', '🗓️ Turno'], ['paga', '💶 Paga'], ['altro', '🎓 Altro']].filter(Boolean);
  const stat = (l, v, bad, k) => `<button class="ovc ov-${bad ? 'bad' : 'ok'}" data-a="help" data-k="${k}"><span class="l">${l}</span><b>${v}</b></button>`;
  let body = '';
  if (tab === 'turno') body = `<div class="emp-shift">${dayToggles('empDay', e.wdays, { e: e.id })}<div class="row">${stepper('empStart', { e: e.id }, String(e.start || 0).padStart(2, '0') + ':00', 'inizio')}${stepper('empHrs', { e: e.id }, e.hours + ' h', 'al giorno')}</div><small class="muted">${weeklyHours(e)} h/settimana${weeklyHours(e) > 40 ? ' · straordinari' : ''}</small></div>`;
  else if (tab === 'paga') body = `<div class="kvl"><span>Stipendio ${hb('stipendio')}</span>${numIn('empWage', e.wage, { e: e.id }, 'step="10" min="500" style="width:6.5rem"')}</div>
    <div class="kvl"><span>Mercato</span><b class="${e.wage < mw * 0.95 ? 'neg' : ''}">${eur0(mw)}</b></div>
    <div class="kvl"><span>Costo/mese</span><b>${eur0(empMonthlyCost(e) * 1.37)}</b></div>
    <div class="kvl"><span>Contratto ${hb('contratto')}</span><b>${esc(CONTRACTS[e.contract])}${e.end ? ' · ' + fmtDateShort(e.end) : ''}</b></div>`;
  else body = `<div class="row mb">${badge(e.age + ' anni')} ${e.traits.map(t => `<span class="badge p" title="${esc(TRAITS[t].d)}">${esc(TRAITS[t].n)}</span>`).join(' ')} ${badge('Ferie ' + Math.floor(e.holidays) + ' gg')}</div>
    <h4>Formazione ${hb('formazione')}</h4><div class="seg">${COURSES.map(c => btn(`${c.n} · ${eur0(c.cost * (hasResearch('formazione') ? 0.7 : 1) * 1.22)}`, 'empTrain', { e: e.id, c: c.id }, 'sm', e.skill >= c.max || (c.min && e.skill < c.min) || e.trainUntil > S.day)).join('')}</div>
    ${others.length ? `<h4>Trasferisci</h4>${select('empMove', [['', '—'], ...others.map(o => [o.id, o.name])], '', { e: e.id })}` : ''}`;
  return sheet(`${esc(empName(e))} <small class="muted">${esc(ROLES[e.role].name)}</small>`, `<div class="ovcs mb">${stat('Competenza', Math.round(e.skill), false, 'competenza')}${stat('Morale', Math.round(e.morale), e.morale < 40, 'morale')}${stat('Stanchezza', Math.round(e.fatigue), e.fatigue > 70, 'stanchezza')}</div>
    <div class="seg mb">${tabs.map(([k, l]) => btn(l, 'empTab', { t: k }, 'sm ' + (tab === k ? 'on' : ''))).join('')}</div>${body}`,
    tab === 'altro' ? btn('Ferie 7 gg', 'empHoliday', { e: e.id }, '', e.holidays < 5 || empStatus(e) !== 'Attivo') + btn('Licenzia', 'empFire', { e: e.id }, 'danger') : btn('OK', 'closeModal', {}, 'pri'));
};
ACT.empTab = (d) => { if (UI.modal) { UI.modal.tab = d.t; render(); } };
CHG.empWage = (v, d) => {
  const e = S.emps[d.e]; if (!e) return;
  const nv = Math.max(500, Math.round(+v || e.wage));
  if (nv > e.wage) e.morale = clamp(e.morale + clamp((nv / e.wage - 1) * 150, 0, 25), 0, 100);
  if (nv < e.wage) e.morale = clamp(e.morale - clamp((1 - nv / e.wage) * 250, 0, 40), 0, 100);
  e.wage = nv; e.lastRaise = S.day; commit('Stipendio aggiornato');
};
ACT.empTrain = (d) => res(startTraining(S.emps[d.e], d.c), 'Formazione avviata');
ACT.empHoliday = (d) => { const e = S.emps[d.e]; e.holidayUntil = S.day + 7; e.holidays -= 5; e.fatigue = Math.max(0, e.fatigue - 10); e.morale = clamp(e.morale + 3, 0, 100); commit('In ferie 7 giorni'); };
CHG.empMove = (v, d) => { if (!v) return; const e = S.emps[d.e]; const to = getBiz(v); const from = getBiz(e.biz); e.biz = v; e.start = suggestStart(to, e.role, e.hours); e.starts = null; e.morale = clamp(e.morale - 3, 0, 100); checkReady(to); if (from) checkStaffing(from); UI.modal = null; commit('Trasferito'); };
ACT.empFire = (d) => {
  const e = S.emps[d.e];
  const notice = e.contract === 'indeterminato' ? e.wage * 1.3 : e.contract === 'apprendistato' ? e.wage * 0.65 : 0;
  confirmBox('Licenziare ' + empName(e) + '?', `Costo ≈ ${eur0(notice + (e.tfr || 0))}`, 'empFireOk', { e: e.id }, 'Licenzia', true);
};
ACT.empFireOk = (d) => { const e = S.emps[d.e]; if (!e) return; const b = getBiz(e.biz); fireEmployee(e, 'licenziato'); log(`Licenziato ${empName(e)}.`, 'info', b ? b.id : null); if (b) checkStaffing(b); UI.modal = null; commit('Licenziato'); };

// ---------- Assunzioni ----------
ACT.hireOpen = (d) => {
  const target = d.target || null;
  const b = target && target !== 'hq' ? getBiz(target) : null;
  UI.hire = { city: b ? b.city : (UI.hire.city || (S.biz[0] ? S.biz[0].city : 'milano')), role: d.role || '', target, cand: null };
  openModal('hire');
};
CHG.hireRole = (v) => { UI.hire.role = v; UI.hire.cand = null; render(); };
CHG.hireCity = (v) => { UI.hire.city = v; UI.hire.cand = null; render(); };
CHG.hireTarget = (v) => { UI.hire.target = v; const b = getBiz(v); if (b) UI.hire.city = b.city; UI.hire.cand = null; render(); };
ACT.hireCand = (d) => {
  const c = (S.candidates[UI.hire.city] || []).find(x => x.id === d.c);
  const b = getBiz(UI.hire.target);
  UI.hire.cand = d.c;
  UI.hire.offer = { wage: c.expected, contract: 'indeterminato', hours: 8, wdays: b ? defaultWdays(b) : [1, 1, 1, 1, 1, 0, 0], months: 12, start: b ? suggestStart(b, c.role, 8) : 9 };
  render();
};
ACT.hireBack = () => { UI.hire.cand = null; render(); };
ACT.hireDay = (d) => { const o = UI.hire.offer; o.wdays[+d.i] = o.wdays[+d.i] ? 0 : 1; render(); };
ACT.offerHrs = (d) => { const o = UI.hire.offer; o.hours = clamp(o.hours + +d.d, 2, 12); o.start = clamp(o.start, 0, 24 - o.hours); render(); };
ACT.offerStart = (d) => { const o = UI.hire.offer; o.start = clamp(o.start + +d.d, 0, 24 - o.hours); render(); };
CHG.offerWage = (v) => { UI.hire.offer.wage = Math.round(+v || 0); render(); };
CHG.offerContract = (v) => { UI.hire.offer.contract = v; render(); };
CHG.offerMonths = (v) => { UI.hire.offer.months = +v; render(); };
ACT.hireDo = () => {
  const H = UI.hire;
  const c = (S.candidates[H.city] || []).find(x => x.id === H.cand);
  if (!c) return;
  if (!H.target) { toast('Scegli dove', 'err'); return; }
  c.city = H.city;
  const r = hireCandidate(c, H.target, H.offer);
  if (r.err) { toast(r.err, 'err'); H.cand = null; render(); return; }
  H.cand = null;
  tutorialEvent('hired');
  commit(`${r.e.first} assunto`);
};
ACT.hireAd = () => {
  const H = UI.hire;
  if (!H.role) { toast('Scegli un ruolo', 'err'); return; }
  if (S.cash < 183) { toast('Liquidità insufficiente', 'err'); return; }
  expense(150, 0.22, 'formazione', H.target && H.target !== 'hq' ? H.target : null, 'Annuncio di lavoro · ' + ((ROLES[H.role] || {}).name || H.role));
  const hr = hqCount('hr') > 0 ? 10 : 0;
  for (let i = 0; i < 4; i++) { const p = makePerson(H.role, H.city, 6 + hr); p.id = uid('c'); p.city = H.city; S.candidates[H.city].unshift(p); }
  commit('4 nuovi candidati');
};
MODALS.hire = () => {
  const H = UI.hire;
  const b = H.target && H.target !== 'hq' ? getBiz(H.target) : null;
  const isHq = H.target === 'hq';
  const roles = isHq ? Object.keys(ROLES).filter(r => ROLES[r].hq) : b ? bizType(b).roles : Object.keys(ROLES).filter(r => !ROLES[r].hq);
  const c = H.cand && (S.candidates[H.city] || []).find(x => x.id === H.cand);
  if (c) {
    const o = H.offer;
    const cost = empMonthlyCost({ wage: o.wage, hours: o.hours, wdays: o.wdays });
    const contracts = Object.entries(CONTRACTS).filter(([k]) => k !== 'apprendistato' || c.age <= 29);
    return sheet(`Offerta · ${esc(c.first)}`, `<div class="row mb">${badge(ROLES[c.role].name, 'b')} ${badge('competenza ' + Math.round(c.skill))} ${badge('chiede ' + eur0(c.expected), 'y')}</div>
      <label class="field"><span>Contratto ${hb('contratto')}</span>${select('offerContract', contracts, o.contract)}</label>
      ${o.contract === 'determinato' || o.contract === 'stagionale' ? `<label class="field"><span>Durata</span>${select('offerMonths', [3, 6, 12, 24].map(m => [m, m + ' mesi']), o.months)}</label>` : ''}
      <label class="field"><span>Stipendio lordo ${hb('stipendio')}</span>${numIn('offerWage', o.wage, {}, 'step="10"')}</label>
      <div class="field"><span>Giorni</span>${dayToggles('hireDay', o.wdays)}</div>
      <div class="row mb"><div class="field"><span>Inizio</span>${stepper('offerStart', {}, String(o.start).padStart(2, '0') + ':00')}</div><div class="field"><span>Ore/giorno</span>${stepper('offerHrs', {}, o.hours + ' h')}</div></div>
      ${table(['Voce', ['Valore', 'n']], [tr(['Ore/settimana', [o.hours * o.wdays.filter(Boolean).length, 'n']]), tr(['Costo/mese', [`<b>${eur0(cost * 1.37)}</b>`, 'n']])])}
      ${o.wage < c.expected ? '<div class="note y">Sotto la richiesta: può rifiutare</div>' : ''}`,
      btn('◀', 'hireBack') + btn('Invia offerta ✓', 'hireDo', {}, 'pri' + (tutorialHl('hire') ? ' hl' : ''), !H.target), { help: 'stipendio' });
  }
  const list = (S.candidates[H.city] || []).filter(x => roles.includes(x.role) && (!H.role || x.role === H.role)).sort((a, z) => z.skill - a.skill);
  return sheet('Assumi', `<div class="row mb">
      ${select('hireTarget', [['', 'Dove…'], ['hq', 'Sede'], ...S.biz.map(x => [x.id, x.name])], H.target || '')}
      ${b ? '' : select('hireCity', CITIES.map(x => [x.id, x.name]), H.city)}
      ${select('hireRole', [['', 'Tutti i ruoli'], ...roles.map(r => [r, ROLES[r].name])], H.role)}
      ${btn('📣 Annuncio 183 €', 'hireAd', {}, 'sm', !H.role)}</div>
    ${list.length ? roleSections(list, x => x.role, x => `<button class="card" data-a="hireCand" data-c="${x.id}"><h4>${esc(x.first + ' ' + x.last)}</h4>
      <div class="kv">${esc(ROLES[x.role].name)} <b>${x.age} anni</b></div><div class="kv">Competenza <b>${skillBadge(x.skill)}</b></div>
      <div class="kv">Chiede <b>${eur0(x.expected)}</b></div>${x.traits.length ? `<small>${x.traits.map(t => esc(TRAITS[t].n)).join(' · ')}</small>` : ''}</button>`, s => `<div class="cards">${s}</div>`) : '<p class="muted">Nessuno: pubblica un annuncio.</p>'}`,
    '', { wide: true, help: isHq ? 'sede' : 'candidati' });
};

// ---------- Prodotti ----------
BIZ_TABS.prodotti = (b, T) => {
  const mods = bizMods(b);
  const roleSkill = {};
  for (const e of empsOf(b.id)) roleSkill[e.role] = roleSkill[e.role] != null ? (roleSkill[e.role] + e.skill) / 2 : e.skill;
  const last = (b.today && b.today.items) || {};
  const rows = b.products.map(p => {
    const t = tplOf(b, p);
    const cost = recipeCost(p.r);
    const net = p.price / (1 + (t.iva != null ? t.iva : T.iva));
    const margin = net > 0 ? (net - cost) / net : 0;
    const ref = refPrice(b, p), r = p.price / ref;
    const eqMissing = t.eq && !b.equip[t.eq];
    return tr([`<b>${esc(p.name)}</b>${eqMissing ? ' ' + badge('serve attrezzatura', 'r') : ''}`,
      btn(p.on ? 'ON' : 'OFF', 'prodToggle', { p: p.id }, 'sm ' + (p.on ? 'ok' : '')),
      [numIn('prodPrice', p.price.toFixed(2), { p: p.id }, 'step="0.1" min="0" style="width:5.5rem"'), 'n'],
      [`${eur2(ref)} <small class="${r > 1.15 ? 'neg' : r < 0.85 ? 'warn' : 'pos'}">${r > 1.15 ? '▲' : r < 0.85 ? '▼' : '●'}</small>`, 'n'],
      [`<span class="${margin < 0.3 ? 'neg' : margin > 0.6 ? 'pos' : ''}">${pct(margin)}</span>`, 'n'], [productQuality(b, p, mods, roleSkill), 'n'], [num1(last[p.id] || 0), 'n'],
      btn('⋯', 'prodEdit', { p: p.id }, 'sm')], p.on && (r > 1.2 || eqMissing) ? 'bad' : '');
  });
  return sec('Prodotti e prezzi', 'prezzo_rif', table(['Prodotto', 'Stato', ['Prezzo', 'n'], ['Rif.', 'n'], ['Margine', 'n'], ['Qualità', 'n'], ['Oggi', 'n'], ''], rows),
    btn('+ Nuovo', 'prodNew', {}, 'sm pri'))
    + sec('Sconto saldi', 'saldi', `<div class="seg">${[0, 10, 20, 30, 40, 50].map(x => btn(x + '%', 'bizDiscount', { v: x }, 'sm ' + ((b.discount || 0) === x ? 'on' : ''))).join('')}</div>`, '', { closed: true, sum: (b.discount || 0) + '%' });
};
ACT.prodToggle = (d) => { const p = curBiz().products.find(x => x.id === d.p); p.on = !p.on; commit(); };
CHG.prodPrice = (v, d) => { const p = curBiz().products.find(x => x.id === d.p); p.price = Math.max(0, round2(+v || 0)); commit(); };
ACT.bizDiscount = (d) => { curBiz().discount = +d.v; commit(); };
ACT.prodNew = () => { const b = curBiz(); const avail = bizType(b).products.filter(p => !p.lock || hasResearch(p.lock)); openModal('prodEdit', { bizId: b.id, draft: productFromTemplate(avail[0], b), isNew: true }); };
ACT.prodEdit = (d) => { const b = curBiz(); openModal('prodEdit', { bizId: b.id, draft: deepClone(b.products.find(x => x.id === d.p)), isNew: false }); };
CHG.peTpl = (v) => { const b = getBiz(UI.modal.bizId); UI.modal.draft = productFromTemplate(bizType(b).products.find(x => x.id === v), b); render(); };
CHG.peName = (v) => { UI.modal.draft.name = v; };
CHG.peOn = (v, d, el) => { UI.modal.draft.on = el.checked; render(); };
CHG.pePrice = (v) => { UI.modal.draft.price = Math.max(0, round2(+v || 0)); render(); };
CHG.peQty = (v, d) => { UI.modal.draft.r[d.m] = Math.max(0, +v || 0); if (!UI.modal.draft.r[d.m]) delete UI.modal.draft.r[d.m]; render(); };
CHG.peAdd = (v) => { if (v) { UI.modal.draft.r[v] = UI.modal.draft.r[v] || 0.05; render(); } };
ACT.peRemove = (d) => { delete UI.modal.draft.r[d.m]; render(); };
ACT.peSave = () => {
  const M = UI.modal; const b = getBiz(M.bizId);
  const nm = $('#pe_name'); if (nm) M.draft.name = nm.value.trim() || M.draft.name;
  if (M.isNew) b.products.push(M.draft); else { const i = b.products.findIndex(x => x.id === M.draft.id); if (i >= 0) b.products[i] = M.draft; }
  UI.modal = null; commit('Salvato');
};
ACT.peDup = () => { const M = UI.modal; const b = getBiz(M.bizId); const c = deepClone(M.draft); c.id = uid('p'); c.name += ' (2)'; b.products.push(c); UI.modal = null; commit('Variante creata'); };
ACT.peDel = () => { const M = UI.modal; const b = getBiz(M.bizId); b.products = b.products.filter(x => x.id !== M.draft.id); UI.modal = null; commit('Eliminato'); };
MODALS.prodEdit = (M) => {
  const b = getBiz(M.bizId), T = bizType(b), p = M.draft;
  const t = T.products.find(x => x.id === p.tpl);
  const cost = recipeCost(p.r), ref = refPrice(b, p);
  const net = p.price / (1 + (t.iva != null ? t.iva : T.iva));
  const avail = T.products.filter(x => !x.lock || hasResearch(x.lock));
  const mats = Object.keys(MATERIALS).filter(m => !p.r[m]);
  const canDel = !M.isNew && b.products.filter(x => x.tpl === p.tpl).length > 1;
  return sheet(M.isNew ? 'Nuovo prodotto' : 'Prodotto', `
    ${M.isNew ? `<label class="field"><span>Categoria</span>${select('peTpl', avail.map(x => [x.id, x.n]), p.tpl)}</label>` : ''}
    ${M.isNew ? '' : `<label class="row mb"><input type="checkbox" data-c="peOn" ${p.on ? 'checked' : ''}> In vendita</label>`}
    <label class="field"><span>Nome</span><input id="pe_name" data-c="peName" value="${esc(p.name)}" maxlength="40"></label>
    <h4>Ricetta ${hb('ricetta')}</h4>
    ${table(['Ingrediente', ['Q.tà', 'n'], ['€', 'n'], ''], Object.entries(p.r).map(([m, q]) => tr([esc(MATERIALS[m].name), [numIn('peQty', q, { m }, 'step="0.005" min="0" style="width:5.5rem"') + ' ' + MATERIALS[m].unit, 'n'], [eur2(q * MATERIALS[m].price * S.eco.priceLevel), 'n'], btn('✕', 'peRemove', { m }, 'sm')])), { empty: 'Solo lavoro' })}
    <div class="row mt">${select('peAdd', [['', '+ ingrediente'], ...mats.map(m => [m, MATERIALS[m].name])], '')}</div>
    <label class="field mt"><span>Prezzo</span>${numIn('pePrice', p.price.toFixed(2), {}, 'step="0.1" min="0"')}</label>
    <div class="kpis">${kpi('Costo', eur2(cost))}${kpi('Margine', pct(net > 0 ? (net - cost) / net : 0), '', cls(net - cost), 'margine')}${kpi('Rif.', eur2(ref), '', '', 'prezzo_rif')}</div>`,
    (M.isNew ? '' : btn('Variante', 'peDup') + (canDel ? btn('Elimina', 'peDel', {}, 'danger') : '')) + btn('Salva ✓', 'peSave', {}, 'pri'));
};

// ---------- Produzione ----------
BIZ_TABS.produzione = (b, T) => {
  const mods = bizMods(b);
  const out = T.outputs[b.output];
  const q = stockQuality(b, b.output) || b.lastQ || 55;
  const ref = wholesaleRef(b, q, mods);
  const x = b.today || {};
  const clients = S.biz.filter(o => o.id !== b.id && bizType(o).materials.includes(b.output));
  const u = MATERIALS[b.output].unit;
  return sec('Produzione', 'produzione', `<div class="seg mb">${Object.keys(T.outputs).map(o => btn(esc(MATERIALS[o].name), 'prodOutput', { v: o }, 'sm ' + (b.output === o ? 'on' : ''))).join('')}</div>
      <div class="kpis">${kpi('Personale', num(x.capLabor || estimateProduction(b)) + '/g')}${kpi('Macchine', num(machineCap(b, mods)) + '/g')}${kpi('Oggi', num1(x.produced || 0) + ' ' + u)}${kpi('Costo unit.', b.unitCost ? eur2(b.unitCost) : '–')}</div>
      <small class="muted">1 ${u} = ${Object.entries(out.in).map(([m, qq]) => qty(qq) + ' ' + MATERIALS[m].unit + ' ' + MATERIALS[m].name).join(' + ')}</small>
      <label class="field mt"><span>Obiettivo/giorno (0 = max)</span>${numIn('prodTarget', b.prodTarget || 0, {}, 'min="0" step="10"')}</label>`)
    + sec('Ingrosso', 'ingrosso', `<label class="row mb"><input type="checkbox" data-c="wsOn" ${b.wholesale.on ? 'checked' : ''}> Vendi all'ingrosso</label>
      <div class="row"><label class="field"><span>Prezzo (mercato ${eur2(ref)})</span><input type="number" data-c="wsPrice" value="${b.wholesale.price || ''}" step="0.01" min="0" placeholder="${ref.toFixed(2)}"></label>
      <label class="field"><span>Riserva</span>${numIn('wsReserve', b.wholesale.reserve || 0, {}, 'min="0" step="10"')}</label></div>
      <div class="kpis">${kpi('Domanda oggi', num1(x.wsDemand || 0))}${kpi('Venduti', num1(x.wsSold || 0))}${kpi('Magazzino', num1(stockOf(b, b.output)))}</div>`)
    + sec('Filiera', 'filiera', clients.length ? clients.map(c => `<div class="row">${btn(esc(c.name), 'openBiz', { id: c.id, tab: 'magazzino' }, 'sm')} <small>${eur2(transferPrice(b, b.output))}/${u}</small></div>`).join('') : '<p class="muted">—</p>');
};
ACT.prodOutput = (d) => { const b = curBiz(); b.output = d.v; b.unitCost = 0; commit(); };
CHG.prodTarget = (v) => { curBiz().prodTarget = Math.max(0, +v || 0); commit(); };
CHG.wsOn = (v, d, el) => { curBiz().wholesale.on = el.checked; commit(); };
CHG.wsPrice = (v) => { curBiz().wholesale.price = +v > 0 ? round2(+v) : null; commit(); };
CHG.wsReserve = (v) => { curBiz().wholesale.reserve = Math.max(0, +v || 0); commit(); };

// ---------- Magazzino ----------
BIZ_TABS.magazzino = (b, T) => {
  const rows = bizMaterials(b).map(m => {
    const M = MATERIALS[m];
    const st = stockOf(b, m), inc = incoming(b, m), use = avgUsage(b, m);
    const nextExp = (b.inv[m] || []).filter(l => l.exp).map(l => l.exp).sort((a, c) => a - c)[0];
    const r = b.restock[m] || {};
    const isOut = T.mode === 'production' && m === b.output;
    const daysLeft = use > 0 ? st / use : null;
    const out = !isOut && ((b.today && (b.today.stockouts || []).length && st <= 0) || (daysLeft != null && daysLeft < 1) || (st <= 0 && !inc));
    return tr([`<b>${esc(M.name)}</b>${isOut ? ' ' + badge('prodotto', 'b') : ''}`,
      [`<b class="${st <= 0 && !isOut ? 'neg' : ''}">${num1(st)}</b> ${M.unit}${inc ? ` <small class="muted">+${num1(inc)}</small>` : ''}`, 'n'],
      [daysLeft == null ? '–' : `<span class="${daysLeft < 1.5 ? 'neg' : ''}">${num1(daysLeft)} gg</span>`, 'n'],
      [nextExp ? `<span class="${nextExp - S.day <= 1 ? 'neg' : ''}">${fmtDateShort(nextExp).slice(0, 5)}</span>` : '–', 'n'],
      isOut ? '' : btn(r.on ? 'AUTO' : 'manuale', 'rsToggle', { m }, 'sm ' + (r.on ? 'ok' : 'bad')),
      isOut ? '' : `<span class="row">${btn('Ordina', 'orderOpen', { m }, 'sm pri')}${btn('⋯', 'rsSheet', { m }, 'sm')}</span>`], out ? 'bad' : '');
  });
  const orders = S.orders.filter(o => o.biz === b.id).sort((a, c) => a.arrive - c.arrive);
  return sec('Magazzino', 'riordino', table(['Materiale', ['Giacenza', 'n'], ['Durata', 'n'], ['Scade', 'n'], 'Riordino', ''], rows),
    btn('⚡ Auto-riordino', 'advRestock', { b: b.id }, 'sm' + (tutorialHl('restock') ? ' hl' : '')) + btn('Ordina 3 gg', 'advOrder', { b: b.id }, 'sm pri' + (tutorialHl('restock') ? ' hl' : '')))
    + sec('In arrivo', 'ordine', table(['Materiale', ['Q.tà', 'n'], 'Arrivo'], orders.map(o => tr([esc(MATERIALS[o.mat].name), [num1(o.qty), 'n'], fmtDateShort(o.arrive).slice(0, 5) + (o.late ? ' ' + badge('ritardo', 'y') : '')])), { empty: '—' }), '', { closed: true, sum: plural(orders.length, 'ordine', 'ordini') });
};
ACT.rsToggle = (d) => { const b = curBiz(); const r = b.restock[d.m] || (b.restock[d.m] = { on: false, min: 0, target: 0, sup: d.m + '_std' }); r.on = !r.on; if (r.on && !r.target) { const s = suggestRestock(b, d.m); r.min = s.min; r.target = s.target; } commit(); };
ACT.rsSheet = (d) => openModal('rs', { m: d.m });
MODALS.rs = (M) => {
  const b = curBiz(); const m = M.m;
  const r = b.restock[m] || { on: false, min: 0, target: 0, sup: m + '_std' };
  const sups = [...suppliersFor(m).map(s => [s.id, `${s.tierName} · ${eur2(materialPrice(m, s))}`]), ...internalSuppliers(b, m).map(s => [s.id, `${s.name} · ${eur2(s.unit)}`])];
  const sg = suggestRestock(b, m);
  const st = stockOf(b, m), use = avgUsage(b, m), inc = incoming(b, m);
  return sheet(esc(MATERIALS[m].name), `<div class="kpis">${kpi('Giacenza', num1(st) + ' ' + MATERIALS[m].unit, '', st <= 0 ? 'neg' : '')}${kpi('Durata', use > 0 ? num1(st / use) + ' gg' : '–', '', use > 0 && st / use < 1.5 ? 'neg' : '')}${kpi('In arrivo', num1(inc))}</div>
    <label class="row mb"><input type="checkbox" data-c="rsOn" data-m="${m}" ${r.on ? 'checked' : ''}> Riordino automatico</label>
    <div class="row"><label class="field"><span>Sotto</span>${numIn('rsMin', r.min, { m })}</label><label class="field"><span>Porta a</span>${numIn('rsTarget', r.target, { m })}</label></div>
    <small class="muted">Consigliato: ${sg.min} → ${sg.target}</small>
    <label class="field mt"><span>Fornitore ${hb('fornitori')}</span>${select('rsSup', sups, r.sup || m + '_std', { m })}</label>`, btn('Ordina ora', 'orderOpen', { m }) + btn('OK', 'closeModal', {}, 'pri'), { help: 'riordino' });
};
function rsOf(m) { const b = curBiz(); return b.restock[m] || (b.restock[m] = { on: true, min: 0, target: 0, sup: m + '_std' }); }
CHG.rsOn = (v, d, el) => { const b = curBiz(); const r = rsOf(d.m); r.on = el.checked; if (r.on && !r.target) { const s = suggestRestock(b, d.m); r.min = s.min; r.target = s.target; } commit(); };
CHG.rsMin = (v, d) => { rsOf(d.m).min = Math.max(0, +v || 0); commit(); };
CHG.rsTarget = (v, d) => { rsOf(d.m).target = Math.max(0, +v || 0); commit(); };
CHG.rsSup = (v, d) => { rsOf(d.m).sup = v; commit(); };
ACT.orderOpen = (d) => { const b = curBiz(); openModal('order', { bizId: b.id, mat: d.m, sup: (b.restock[d.m] && b.restock[d.m].sup) || d.m + '_std', qty: Math.max(1, suggestRestock(b, d.m).target || 10) }); };
ACT.orderSup = (d) => { UI.modal.sup = d.s; render(); };
CHG.orderQty = (v) => { UI.modal.qty = Math.max(0, +v || 0); render(); };
ACT.orderQ = (d) => { UI.modal.qty = Math.max(0, Math.round((UI.modal.qty * +d.f) * 100) / 100); render(); };
ACT.orderDo = () => {
  const M = UI.modal; const b = getBiz(M.bizId);
  const r = placeOrder(b, M.mat, M.sup, M.qty, false);
  if (r.err) { toast(r.err, 'err'); return; }
  UI.modal = null; tutorialEvent('restock'); commit(`Ordinato · ${eur0(r.total)}`);
};
MODALS.order = (M) => {
  const b = getBiz(M.bizId); const m = M.mat; const Mt = MATERIALS[m];
  const sups = suppliersFor(m).map(s => ({ id: s.id, name: s.name, tier: s.tierName, q: s.q, days: s.days, rel: s.rel, unit: materialPrice(m, s), stock: null }));
  for (const s of internalSuppliers(b, m)) sups.push({ id: s.id, name: s.name, tier: 'Interno', q: s.q, days: s.days, rel: 1, unit: s.unit, stock: s.stock });
  const sel = sups.find(s => s.id === M.sup) || sups[1];
  const tot = sel.unit * M.qty * (sel.stock != null ? 1 : 1 + Mt.iva);
  return sheet(`Ordina ${esc(Mt.name)}`, `<div class="kpis">${kpi('Giacenza', num1(stockOf(b, m)) + ' ' + Mt.unit)}${kpi('Uso/giorno', num1(avgUsage(b, m)))}</div>
    <div class="cards">${sups.map(s => `<button class="card ${sel.id === s.id ? 'on' : ''}" data-a="orderSup" data-s="${s.id}"><h4>${esc(s.tier)}</h4><small>${esc(s.name)}</small>
      <div class="kv">Prezzo <b>${eur2(s.unit)}</b></div><div class="kv">Qualità <b>${s.q}</b></div><div class="kv">Arrivo <b>${s.days} gg · ${pct(s.rel)}</b></div>${s.stock != null ? `<div class="kv">Disponibili <b>${num1(s.stock)}</b></div>` : ''}</button>`).join('')}</div>
    <div class="row mt"><label class="field"><span>Quantità (${Mt.unit})</span>${numIn('orderQty', M.qty, {}, 'min="0"')}</label>${btn('½', 'orderQ', { f: 0.5 }, 'sm')}${btn('×2', 'orderQ', { f: 2 }, 'sm')}</div>`,
    `<b class="nowrap">${eur0(tot)}</b>` + btn('Ordina ✓', 'orderDo', {}, 'pri', M.qty <= 0), { help: 'fornitori' });
};

// ---------- Attrezzature ----------
BIZ_TABS.attrezzature = (b, T) => {
  const cards = T.equip.map(e => {
    const own = b.equip[e.cat];
    const buys = [0, 1, 2].filter(i => !own || i > own.tier || own.broken).map(i => btn(`${TIER_NAMES[i].split(' ')[0]} ${eur0(equipCost(e, i) * 1.22)}`, 'eqBuy', { c: e.cat, t: i }, 'sm' + (i === 0 && !own && e.req && tutorialHl('equip') ? ' hl pri' : '')));
    const bad = (e.req && !own) || (own && (own.broken || own.cond < 50));
    return `<div class="card ${bad ? 'bad' : own ? 'good' : ''}" style="cursor:default"><div class="top-row"><h4>${esc(e.n)}</h4>${e.req ? badge('Obbligatoria', 'y') : ''}</div>
      <div class="kv">Effetto <b>${EQ_KIND[e.kind]}</b></div>
      <div class="kv">Attuale <b>${own ? TIER_NAMES[own.tier] + (own.broken ? ' ' + badge('guasta', 'r') : '') : '—'}</b></div>
      ${own ? `<div class="kv">Stato <b>${bar(own.cond)} ${Math.round(own.cond)}%</b></div>` : ''}
      <div class="row mt">${buys.join('')}${own && (own.cond < 80 || own.broken) ? btn(`Ripara ${eur0(repairCost(b, e.cat) * 1.22)}`, 'eqRepair', { c: e.cat }, 'sm ok') : ''}</div></div>`;
  });
  return sec('Attrezzature', 'attrezzature', `<label class="row mb"><input type="checkbox" data-c="eqLeasing" ${UI.leasing ? 'checked' : ''}> Leasing</label><div class="cards">${cards.join('')}</div>`);
};
CHG.eqLeasing = (v, d, el) => { UI.leasing = el.checked; render(); };
ACT.eqBuy = (d) => { const r = buyEquipment(curBiz(), d.c, +d.t, !!UI.leasing); if (!r.err) tutorialEvent('equip'); res(r, 'Acquistata'); };
ACT.eqRepair = (d) => res(repairEquipment(curBiz(), d.c), r => `Riparata · ${eur0(r.cost * 1.22)}`);

// ---------- Migliorie ----------
BIZ_TABS.miglioramenti = (b) => sec('Migliorie', 'miglioramenti', `<div class="cards">${UPGRADES.filter(u => upgradeAllowed(b, u)).map(u => {
  const has = !!b.upg[u.id], cost = upgradeCost(b, u);
  return `<div class="card" style="cursor:default"><h4>${esc(u.n)}</h4><small>${esc(u.d)}</small>
    <div class="kv">Costo <b>${cost ? eur0(cost * 1.22) : '–'}</b></div>${u.monthly ? `<div class="kv">Canone <b>${eur0(u.monthly * S.eco.priceLevel * 1.22)}/mese</b></div>` : ''}
    <div class="row mt">${has ? badge('Installato', 'g') + (u.monthly ? ' ' + btn('Disdici', 'upgRemove', { u: u.id }, 'sm') : '') : btn('Acquista', 'upgBuy', { u: u.id }, 'sm pri')}</div></div>`;
}).join('')}</div>`);
ACT.upgBuy = (d) => res(buyUpgrade(curBiz(), d.u), 'Installato');
ACT.upgRemove = (d) => { removeUpgrade(curBiz(), d.u); commit('Disdetto'); };

// ---------- Marketing ----------
BIZ_TABS.marketing = (b) => {
  const active = S.campaigns.filter(c => c.target === b.id || c.target === b.city || c.target === b.brand);
  return `<div class="kpis">${kpi('Notorietà', Math.round(b.aw), '', '', 'notorieta')}${kpi('Marchio', b.brand ? Math.round(brandAw(b)) : '—', '', '', 'marchio')}${kpi('Reputazione', stars(b.rep), '', '', 'reputazione')}</div>
    ${sec('Budget giornaliero', 'budget', `<div class="seg">${[0, 5, 10, 20, 40, 80].map(v => btn(v ? v + ' €' : 'Zero', 'mkSet', { b: b.id, v }, 'sm ' + ((b.mkBudget || 0) === v ? 'on' : ''))).join('')}</div><small class="muted">≈ ${eur0((b.mkBudget || 0) * 36.6)}/mese</small>`, '', { closed: true, sum: (b.mkBudget || 0) + ' €/g' })}
    ${sec('Campagne', 'campagne', `<div class="cards">${CAMPAIGNS.filter(c => c.scope === 'biz').map(c => `<div class="card" style="cursor:default"><h4>${esc(c.n)}</h4><div class="kv">${c.days} giorni <b>${eur0(c.cost * S.eco.priceLevel * 1.22)}</b></div>${btn('Lancia', 'campLaunch', { c: c.id, t: b.id }, 'sm pri')}</div>`).join('')}</div>
      ${active.length ? `<h4>Attive</h4>${active.map(c => `<div>${badge(CAMPAIGN[c.camp].n, 'b')} fino al ${fmtDateShort(c.until)}</div>`).join('')}` : ''}`, '', { closed: true, sum: active.length ? active.length + ' attive' : '' })}`;
};
ACT.mkSet = (d) => { getBiz(d.b).mkBudget = +d.v; commit(); };
ACT.campLaunch = (d) => {
  const C = CAMPAIGN[d.c]; const cost = Math.round(C.cost * S.eco.priceLevel);
  if (S.cash < cost * 1.22) { toast('Liquidità insufficiente', 'err'); return; }
  expense(cost, 0.22, 'marketing', C.scope === 'biz' ? d.t : null, C.n);
  S.campaigns.push({ id: uid('m'), camp: C.id, target: d.t, until: S.day + C.days, start: S.day });
  commit('Campagna avviata');
};

// ---------- Impostazioni ----------
function isoOf(day) { const t = ymd(day); return `${t.y}-${String(t.m + 1).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`; }
BIZ_TABS.impostazioni = (b, T) => {
  const hoursOpts = Array.from({ length: 25 }, (_, i) => [i, String(i).padStart(2, '0') + ':00']);
  const closures = b.closures.filter(c => c.to >= S.day);
  return `<div class="grid g2">${sec('Generale', null, `<label class="field"><span>Nome</span><input data-c="bizName" value="${esc(b.name)}" maxlength="40"></label>
      ${S.brands.length ? `<label class="field"><span>Marchio ${hb('marchio')}</span>${select('bizBrand', [['', '—'], ...S.brands.map(x => [x.id, x.name])], b.brand || '')}</label>` : ''}
      <label class="row"><input type="checkbox" data-c="bizIns" ${b.insurance ? 'checked' : ''}> Assicurazione ${eur0(insurancePremium(b))}/mese ${hb('assicurazione')}</label>`, '', { closed: true, c: 'gray', sum: esc(b.name) })}
    ${sec('Orari', 'orari', `${T.mode === 'shop' && T.capMode !== 'day' ? `<div class="row">${select('bizOpen', hoursOpts.slice(0, 24), b.hours[0])} → ${select('bizClose', hoursOpts.slice(1), b.hours[1])} <small class="muted">${openHours(b)} h · ${pct(hoursCoverage(T, b.hours))}</small></div>` : ''}
      <div class="field mt"><span>Giorni</span>${dayToggles('bizDay', b.days)}</div>
      <label class="row"><input type="checkbox" data-c="bizHol" ${b.closeHolidays ? 'checked' : ''}> Chiusa nei festivi</label>`, '', { sum: T.mode === 'shop' && T.capMode !== 'day' ? `${b.hours[0]}–${b.hours[1]}` : '' })}</div>
    ${sec('Ferie', 'ferie', `<div class="row"><input type="date" id="cl_from" value="${isoOf(S.day + 1)}"><input type="number" id="cl_days" value="7" min="1" max="60" style="width:4.5rem"> gg ${btn('+', 'bizClosure', {}, 'sm')}</div>
      ${closures.map(c => `<div class="row mt">${badge(fmtDateShort(c.from) + ' → ' + fmtDateShort(c.to), 'b')} ${btn('✕', 'bizClosureDel', { i: b.closures.indexOf(c) }, 'sm')}</div>`).join('')}`, '', { closed: !closures.length, sum: closures.length ? closures.length + ' programmate' : 'nessuna' })}
    ${sec('Gestione', 'valore', `<div class="kpis">${kpi('Valore', eur0(bizValuation(b)), '', '', 'valore')}</div>
      <div class="row">${b.status === 'paused' ? btn('Riapri', 'bizPause', {}, 'ok') : b.status === 'open' ? btn('Sospendi', 'bizPause') : ''}${btn('Vendi', 'bizSell', {}, '', b.status === 'setup')}${btn('Chiudi', 'bizClose', {}, 'danger')}</div>`, '', { closed: true, c: 'red', sum: eur0(bizValuation(b)) })}`;
};
CHG.bizName = (v) => { const b = curBiz(); b.name = v.trim() || b.name; commit(); };
CHG.bizBrand = (v) => { curBiz().brand = v || null; commit(); };
CHG.bizIns = (v, d, el) => { curBiz().insurance = el.checked; commit(); };
CHG.bizOpen = (v) => { const b = curBiz(); b.hours[0] = Math.min(+v, b.hours[1] - 1); commit(); };
CHG.bizClose = (v) => { const b = curBiz(); b.hours[1] = Math.max(+v, b.hours[0] + 1); commit(); };
CHG.bizHol = (v, d, el) => { curBiz().closeHolidays = el.checked; commit(); };
ACT.bizDay = (d) => { const b = curBiz(); b.days[+d.i] = b.days[+d.i] ? 0 : 1; commit(); };
ACT.bizClosure = () => {
  const b = curBiz(); const v = $('#cl_from').value; const n = clamp(+$('#cl_days').value || 7, 1, 60);
  if (!v) return; const [y, m, dd] = v.split('-').map(Number); const from = dayFromYMD(y, m - 1, dd);
  if (from <= S.day) { toast('Data futura', 'err'); return; }
  b.closures.push({ from, to: from + n - 1 }); commit('Programmata');
};
ACT.bizClosureDel = (d) => { curBiz().closures.splice(+d.i, 1); commit(); };
ACT.bizPause = () => { const b = curBiz(); b.status = b.status === 'paused' ? 'open' : 'paused'; commit(b.status === 'paused' ? 'Sospesa' : 'Riaperta'); };
ACT.bizSell = () => { const b = curBiz(); const price = Math.round(bizValuation(b) * 0.85 / 100) * 100; confirmBox('Vendere ' + b.name + '?', `Offerta immediata: <b>${eur0(price)}</b>${b.propId ? ' + immobile' : ''}`, 'bizSellOk', { p: price }, 'Vendi', true); };
ACT.bizSellOk = (d) => { sellBusiness(curBiz(), +d.p); UI.modal = null; UI.view = 'bizlist'; UI.biz = null; commit('Venduta'); };
ACT.bizClose = () => confirmBox('Chiudere ' + curBiz().name + '?', 'Licenzi tutti e svendi attrezzature e merci.', 'bizCloseOk', {}, 'Chiudi', true);
ACT.bizCloseOk = () => { closeBusiness(curBiz()); UI.modal = null; UI.view = 'bizlist'; UI.biz = null; commit('Chiusa'); };

// ---------- Conti ----------
BIZ_TABS.statistiche = (b) => {
  const keys = lastMonthKeys(4).reverse().filter(k => k >= monthKey(b.created));
  const pls = keys.map(k => monthPL(k, b.id));
  const cats = [...new Set(pls.flatMap(p => Object.keys(p.lines)))].sort((a, c) => (CATS[c].rev ? 1 : 0) - (CATS[a].rev ? 1 : 0));
  const rows = cats.map(c => tr([esc(CATS[c].n), ...pls.map(p => [p.lines[c] ? `<span class="${cls(p.lines[c])}">${eur0(p.lines[c])}</span>` : '–', 'n'])]));
  rows.push(tr(['Utile', ...pls.map(p => moneyCell(p.profit))], 'tot'));
  return sec('Conto economico', 'ce', table(['Voce', ...keys.map(k => [monthLabel(k).slice(0, 3) + ' ' + String(k).slice(2, 4), 'n'])], rows)) + sec('30 giorni', null, histTable(b, 30), '', { closed: true, c: 'green' });
};
BIZ_TABS.recensioni = (b) => sec('Recensioni', 'reputazione', b.reviews.length ? `<ul class="list-log">${b.reviews.map(r => `<li><span class="d">${fmtDateShort(r.day).slice(0, 5)}</span><span><b>${'★'.repeat(r.st)}${'☆'.repeat(5 - r.st)}</b> ${esc(r.txt)}</span></li>`).join('')}</ul>` : '<p class="muted">—</p>');

/** prossimi 7 giorni: previsione clienti persi; tocca un giorno per i suoi turni */
function nextDaysStrip(b) {
  const T = bizType(b);
  if (T.mode !== 'shop' || T.capMode === 'day') return '';
  const chips = [];
  for (let k = 1; k <= 7; k++) {
    const wd = ymd(S.day + k).wd;
    const lbl = (k === 1 ? 'Domani' : WEEKDAYS[wd]) + ' <small>' + fmtDateShort(S.day + k).slice(0, 5) + '</small>';
    if (!b.days[wd]) { chips.push(ovChip(lbl, 'chiuso', 'off', 'ovDay', { b: b.id, d: wd })); continue; }
    const f = shiftForecast(b, wd), unc = uncoveredHours(b, wd).length;
    const bad = unc || (f && f.probs.length);
    chips.push(ovChip(lbl, unc ? 'scoperto' : f && f.probs.length ? '−' + num(f.lost) + ' clienti' : 'ok', bad ? 'bad' : 'ok', 'ovDay', { b: b.id, d: wd }));
  }
  return '<h4>Prossimi giorni <small class="muted">previsione · tocca per i turni</small></h4><div class="ovcs">' + chips.join('') + '</div>';
}
