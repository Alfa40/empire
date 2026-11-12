'use strict';
/* ============================================================
   EMPIRE - Personale e Finanza raggruppati.
   Personale: gruppi per tipo di lavoro → sottogruppi per ruolo → persona.
   Finanza: gruppi di entrate/spese → voci → divisione per attività.
   ============================================================ */

// apre una scheda sopra la finestra attuale; chiudendola si torna indietro
ACT.sub = (d) => {
  const back = UI.modal;
  const fn = ACT[d.x]; if (!fn) return;
  fn(d);
  if (back && UI.modal && UI.modal !== back && !UI.modal.back) { UI.modal.back = back; render(); }
};

// ===================== PERSONALE =====================
const JOB_GROUPS = [
  { id: 'gestione', ic: '👔', n: 'Gestione', roles: ['manager', 'areamanager'] },
  { id: 'sala', ic: '🙋', n: 'Clienti e sala', roles: ['barista', 'cameriere', 'commesso', 'receptionist'] },
  { id: 'cucina', ic: '👨‍🍳', n: 'Cucina e laboratorio', roles: ['cuoco', 'pizzaiolo', 'fornaio', 'gelatiere'] },
  { id: 'servizi', ic: '✂️', n: 'Servizi e tecnici', roles: ['parrucchiere', 'istruttore', 'meccanico', 'lavanderia', 'pulizie'] },
  { id: 'produzione', ic: '🏭', n: 'Produzione e magazzino', roles: ['operaio', 'agricolo', 'magazziniere'] },
  { id: 'sede', ic: '🏢', n: 'Sede centrale', roles: ['contabile', 'hr', 'marketer', 'ricercatore'] },
];
function jobGroupOf(role) { return (JOB_GROUPS.find(g => g.roles.includes(role)) || { id: 'altro' }).id; }
function staffList() { const f = UI.st.filter; return Object.values(S.emps).filter(e => !f || e.biz === f); }
function staffGroups() {
  const all = staffList();
  const out = JOB_GROUPS.map(g => ({ ...g, emps: all.filter(e => jobGroupOf(e.role) === g.id) }));
  const other = all.filter(e => jobGroupOf(e.role) === 'altro');
  if (other.length) out.push({ id: 'altro', ic: '🧩', n: 'Altro', roles: [...new Set(other.map(e => e.role))], emps: other });
  return out;
}
// ---------- persone sempre divise per lavoro ----------
/** ordine dei ruoli: quello dei gruppi di lavoro, poi gli altri */
function roleRank(r) { const all = JOB_GROUPS.flatMap(g => g.roles); const i = all.indexOf(r); return i < 0 ? 99 : i; }
function roleIdByName(n) { return Object.keys(ROLES).find(k => ROLES[k].name === n) || null; }
/** [{r, items}] in ordine di ruolo */
function byRole(items, roleOf) {
  const m = new Map();
  for (const x of items) { const r = roleOf(x) || ''; if (!m.has(r)) m.set(r, []); m.get(r).push(x); }
  return [...m.entries()].sort((a, c) => roleRank(a[0]) - roleRank(c[0]) || String(a[0]).localeCompare(String(c[0]))).map(([r, items]) => ({ r, items }));
}
function roleName(r) { return ROLES[r] ? ROLES[r].name : r || 'Altro'; }
/** elenco diviso per ruolo: titolo "Barista 3" + contenuto */
function roleSections(items, roleOf, draw, wrap) {
  return byRole(items, roleOf).map(g => `<h4 class="rh">${esc(roleName(g.r))} <small class="muted">${g.items.length}</small></h4>${(wrap || (s => s))(g.items.map(draw).join(''))}`).join('');
}
/** "Mario Rossi · Barista (13ª)" -> { name, role, extra } */
function splitEmpLabel(w) {
  const m = /^(.*) · ([^·(]+?)(?: \((.*)\))?$/.exec(w || '');
  if (!m) return null;
  const role = roleIdByName(m[2].trim());
  return role ? { name: m[1], role, extra: m[3] || '' } : null;
}
/** perché una persona è in rosso */
function empWhy(e) { return lawIssues(e).length ? lawIssues(e)[0] : e.fatigue > 70 ? 'stanco ' + Math.round(e.fatigue) + '%' : e.morale < 40 ? 'morale ' + Math.round(e.morale) : 'contratto in scadenza'; }
function staffSentence(all) {
  if (!all.length) return '<p class="say">💬 Nessun dipendente: tocca "+ Assumi".</p>';
  const tired = all.filter(e => e.fatigue > 70).length, sad = all.filter(e => e.morale < 40).length, sick = all.filter(e => e.sickUntil > S.day).length;
  const bits = [];
  if (tired) bits.push(plural(tired, 'stanco', 'stanchi'));
  if (sad) bits.push(plural(sad, 'scontento', 'scontenti'));
  if (sick) bits.push(`${plural(sick, 'persona', 'persone')} in malattia`);
  return bits.length ? `<p class="say">⚠️ ${bits.join(', ')}</p>` : '';
}
function empChip(e) {
  const b = e.biz === 'hq' ? null : getBiz(e.biz);
  const st = empStatus(e), away = st !== 'Attivo';
  return ovChip(`${esc(e.first)}${S.biz.length > 1 || hqEmps().length ? ` <small>${b ? esc(b.name) : 'Sede'}</small>` : ''}`, away ? st.toLowerCase() : empBad(e) ? empWhy(e) : `${Math.round(e.skill)} · ${eur0(e.wage)}`, empBad(e) ? 'bad' : away ? 'off' : 'ok', 'sub', { x: 'empSheet', e: e.id }, face(e, 40));
}
VIEWS.staff = () => {
  const all = staffList();
  const sad = all.filter(empBad).length;
  const tiles = staffGroups().filter(g => g.emps.length).map(g => {
    const bad = g.emps.filter(empBad).length;
    return `<button class="ovt ${bad ? 'bad' : 'ok'}" data-a="staffGroup" data-g="${g.id}"><span class="ic">${g.ic}</span><b>${g.n} <span class="cnt">${g.emps.length}</span></b>${bad ? `<small>${bad} da vedere</small>` : ''}</button>`;
  }).join('');
  return `<div class="ov-head"><h1>Personale</h1>${hb('ruoli')}</div>
    ${staffSentence(all)}
    <div class="row mb">${S.biz.length > 1 || hqEmps().length ? select('stFilter', [['', 'Ovunque'], ['hq', 'Sede'], ...S.biz.map(b => [b.id, b.name])], UI.st.filter) : ''}${btn('+ Assumi', 'hireOpen', {}, 'pri')}</div>
    ${tiles ? `<div class="ovts">${tiles}</div>` : '<p class="muted">Nessun dipendente.</p>'}`;
};
ACT.staffGroup = (d) => openModal('staffGroup', { g: d.g });
MODALS.staffGroup = (M) => {
  const g = staffGroups().find(x => x.id === M.g); if (!g) return '';
  const subs = g.roles.map(r => ({ r, emps: g.emps.filter(e => e.role === r) })).filter(x => x.emps.length);
  const body = subs.map(x => `<h4>${esc(ROLES[x.r].name)} <small class="muted">${x.emps.length}</small></h4><div class="ovcs">${x.emps.sort((a, c) => (a.biz > c.biz ? 1 : -1)).map(empChip).join('')}</div>`).join('') || '<p class="muted">Nessuno.</p>';
  return sheet(`${g.ic} ${g.n}`, body, '', { help: 'ruoli' });
};

// ===================== FINANZA =====================
const FIN_GROUPS = [
  { id: 'vendite', c: 'green', ic: '🛒', n: 'Vendite', cats: ['vendite', 'ingrosso', 'interni'] },
  { id: 'rendite', c: 'teal', ic: '🏘️', n: 'Affitti incassati e rendite', cats: ['affitti_attivi', 'royalties', 'dividendi', 'plusvalenze', 'altri_ricavi', 'cessioni'] },
  { id: 'personale', c: 'orange', ic: '👥', n: 'Spese per dipendenti', cats: ['stipendi', 'contributi', 'formazione', 'tfr_pagato'] },
  { id: 'affitti', c: 'brown', ic: '🏠', n: 'Affitti', cats: ['affitto'] },
  { id: 'fisse', c: 'yellow', ic: '💡', n: 'Spese fisse', cats: ['utenze', 'assicurazioni', 'consulenze'] },
  { id: 'merci', c: 'teal', ic: '📦', n: 'Merci e materie prime', cats: ['materiali'] },
  { id: 'gestionali', c: 'purple', ic: '📋', n: 'Spese gestionali', cats: ['marketing', 'ricerca', 'licenze', 'commissioni'] },
  { id: 'manutenzione', c: 'gray', ic: '🔧', n: 'Manutenzione', cats: ['manutenzione'] },
  { id: 'tasse', c: 'blue', ic: '🧾', n: 'Tasse e imposte', cats: ['imposte', 'imposte_varie', 'iva', 'versamento_imposte'] },
  { id: 'banca', c: 'gray', ic: '🏦', n: 'Banca e finanziamenti', cats: ['interessi', 'finanziamenti', 'rimborsi', 'capitale', 'cauzioni'] },
  { id: 'invest', c: 'blue', ic: '🛠️', n: 'Investimenti e ammortamenti', cats: ['investimenti', 'ammortamenti', 'minusvalenze', 'immobili', 'titoli'] },
];
const FIN_PERIODS = [['mese', 'Questo mese'], ['scorso', 'Mese scorso'], ['anno', 'Anno']];
function finKeys() {
  const mk = monthKey(S.day);
  return UI.fin.per === 'scorso' ? [prevMonthKey(mk)] : UI.fin.per === 'anno' ? yearKeys(ymd(S.day).y) : [mk];
}
/** somma delle voci nel periodo; mode 'pl' = conto economico, 'cash' = movimenti di cassa */
function finTotals(keys, bizId, mode) {
  const tot = {};
  for (const k of keys) {
    const L = bizId ? (S.bizLedger[bizId] || {})[k] : S.ledger[k];
    if (!L) continue;
    for (const c in L) {
      if (!CATS[c]) continue;
      if (mode === 'pl' && CATS[c].nopl) continue;
      if (mode === 'cash' && (c === 'ammortamenti' || c === 'imposte')) continue;
      tot[c] = (tot[c] || 0) + L[c];
    }
  }
  return tot;
}
function finGroupData(tot) {
  return FIN_GROUPS.map(g => {
    const lines = g.cats.filter(c => tot[c]).map(c => ({ c, v: tot[c] }));
    return { ...g, lines, v: sum(lines, l => l.v) };
  }).filter(g => g.lines.length);
}
function finTiles(groups, mode, bizId) {
  return `<div class="ovts">${groups.map(g => `<button class="ovt c-${g.c || 'blue'} ${g.v >= 0 ? 'ok' : 'exp'}" data-a="finGroup" data-g="${g.id}" data-m="${mode}"${bizId ? ` data-b="${bizId}"` : ''}><span class="ic">${g.ic}</span><b>${g.n}</b><small class="${cls(g.v)}">${eur0(g.v)}</small></button>`).join('')}</div>`;
}
function finPerSeg() { return `<div class="seg mb">${FIN_PERIODS.map(([k, l]) => btn(l, 'finPer', { p: k }, 'sm ' + ((UI.fin.per || 'mese') === k ? 'on' : ''))).join('')}</div>`; }
function finFilters() {
  return `${finPerSeg()}
    ${S.biz.length > 1 ? `<div class="row mb">${select('finBiz', [['', 'Tutta l\'impresa'], ...S.biz.map(b => [b.id, b.name])], UI.fin.biz)}</div>` : ''}`;
}
ACT.finPer = (d) => { UI.fin.per = d.p; render(); };

const _financeOld = VIEWS.finance;
VIEWS.finance = () => {
  const tabs = [['ce', 'Entrate e spese'], ['cassa', 'Cassa'], ['sp', 'Patrimonio'], ['tasse', 'Imposte']].filter(t => !FIN_FEAT[t[0]] || has(FIN_FEAT[t[0]]));
  if (!tabs.some(t => t[0] === UI.fin.tab)) UI.fin.tab = 'ce';
  const head = `<div class="ov-head"><h1>Finanza</h1>${hb(UI.fin.tab === 'cassa' ? 'flussi' : UI.fin.tab === 'sp' ? 'sp' : UI.fin.tab === 'tasse' ? 'imposte' : 'ce')}</div><div class="seg mb">${tabs.map(([id, l]) => btn(l, 'finTab', { t: id }, 'sm ' + (UI.fin.tab === id ? 'on' : ''))).join('')}</div>`;
  if (UI.fin.tab === 'sp' || UI.fin.tab === 'tasse') return head + _financeOld().replace(/^<div class="head">[\s\S]*?<\/div><div class="tabs">[\s\S]*?<\/div>/, '');
  const keys = finKeys(), bizId = UI.fin.biz || null;
  if (UI.fin.tab === 'cassa') {
    const tot = finTotals(keys, bizId, 'cash');
    const groups = finGroupData(tot);
    const inn = sum(Object.values(tot).filter(v => v > 0), v => v), out = sum(Object.values(tot).filter(v => v < 0), v => v);
    return head + finFilters() + `<div class="ovcs ovg">${ovChip('⬆️ Entrate', eur0(inn), 'ok', 'help', { k: 'flussi' })}${ovChip('⬇️ Uscite', eur0(out), 'ok', 'help', { k: 'flussi' })}${ovChip('= Saldo', `<span class="${cls(inn + out)}">${eur0(inn + out)}</span>`, inn + out < 0 ? 'bad' : 'ok', 'help', { k: 'flussi' })}</div>`
      + (groups.length ? finTiles(groups, 'cash') : '<p class="muted">Nessun movimento.</p>');
  }
  // entrate e spese (conto economico)
  const tot = finTotals(keys, bizId, 'pl');
  const pl = plOf(tot);
  const groups = finGroupData(tot);
  const inc = groups.filter(g => g.v >= 0), exp = groups.filter(g => g.v < 0).sort((a, c) => a.v - c.v);
  const months = lastMonthKeys(6).reverse().filter(k => k >= monthKey(S.startDay));
  const trend = months.map(k => { const p = monthPL(k, bizId); return `<div class="kvl"><span>${monthLabel(k).slice(0, 3)} ${String(k).slice(2, 4)}</span><b class="${cls(p.profit)}">${eur0(p.profit)}</b></div>`; }).join('');
  return head + finFilters()
    + finHead(pl, exp)
    + (inc.length ? finTiles(inc, 'pl') : '')
    + (exp.length ? finTiles(exp, 'pl') : '')
    + (!groups.length ? '<p class="muted">Nessun movimento nel periodo.</p>' : '')
    + `<div class="mt">${sec('Utile mese per mese', 'ce', trend, '', { closed: true, sum: plural(months.length, 'mese', 'mesi') })}</div>`;
};
/** utile grande + ciambella delle spese */
function finHead(pl, exp) {
  return `<div class="finhead">${exp.length && pl.cost ? donut(exp.map(g => ({ v: g.v, c: g.c || 'blue' })), 76) : ''}<button class="fh-n" data-a="help" data-k="utile"><small>Utile</small><b class="${cls(pl.profit)}">${eur0(pl.profit)}</b><small>${eur0(pl.rev)} − ${eur0(-pl.cost)}</small></button></div>`;
}
/** ciambella delle spese con frase: dove vanno i soldi */
function finSpend(exp, cost) {
  if (!exp.length || !cost) return '';
  const top = exp[0], p = Math.round(top.v / cost * 100);
  return `<div class="spend">${donut(exp.map(g => ({ v: g.v, c: g.c || 'blue' })), 92, eur0(-cost))}<p class="say">💬 La spesa più grande è <b>${esc(top.n.toLowerCase())}</b>: ${p}% dei costi.${exp[1] ? ` Poi ${esc(exp[1].n.toLowerCase())} (${Math.round(exp[1].v / cost * 100)}%).` : ''}</p></div>`;
}

ACT.finGroup = (d) => openModal('finGroup', { g: d.g, m: d.m, b: d.b || '' });
MODALS.finGroup = (M) => {
  const g = FIN_GROUPS.find(x => x.id === M.g); if (!g) return '';
  const keys = finKeys(), bizId = M.b || UI.fin.biz || null;
  const tot = finTotals(keys, bizId, M.m);
  const lines = g.cats.filter(c => tot[c]).map(c => ({ c, v: tot[c] })).sort((a, c) => Math.abs(c.v) - Math.abs(a.v));
  const all = sum(lines, l => l.v);
  const max = Math.max(1, ...lines.map(l => Math.abs(l.v)));
  const voce = lines.map(l => `<button class="kvl tap" data-a="sub" data-x="finCat" data-c="${l.c}" data-b="${bizId || ''}" data-k="${keys.join(',')}"><span>${esc(CATS[l.c].n)}</span><b class="${cls(l.v)}">${eur0(l.v)} <i>›</i></b><span class="fbar">${bar(Math.abs(l.v), max, l.v >= 0 ? 'g' : 'y')}</span></button>`).join('') || '<p class="muted">—</p>';
  // spese per dipendenti: totale per persona (stipendio + contributi)
  let pers = '';
  if (g.id === 'personale') {
    const pp = {};
    for (const c of ['stipendi', 'contributi']) for (const r of finDetail(keys, c, bizId)) { const p = splitEmpLabel(r.w); const k = p ? p.name + '|' + p.role : r.w + '|'; pp[k] = (pp[k] || 0) + r.v; }
    const L = Object.entries(pp).map(([k, v]) => { const [n, role] = k.split('|'); return { n, role, v }; }).sort((a, c) => a.v - c.v);
    if (L.length) pers = `<h3 class="sh">Per persona <small class="muted">stipendio + contributi</small></h3>` + roleSections(L, x => x.role, x => `<div class="kvl"><span>${esc(x.n)}</span><b class="${cls(x.v)}">${eur0(x.v)}</b></div>`);
  }
  // divisione per attività
  let per = '';
  if (!bizId && S.biz.length) {
    const rows = S.biz.map(b => { const t = finTotals(keys, b.id, M.m); return { b, v: sum(g.cats, c => t[c] || 0) }; }).filter(x => Math.round(x.v));
    const rest = all - sum(rows, x => x.v);
    if (rows.length) per = `<h4>Per attività</h4>${rows.sort((a, c) => Math.abs(c.v) - Math.abs(a.v)).map(x => `<div class="kvl"><span>${bizType(x.b).icon} ${esc(x.b.name)}</span><b class="${cls(x.v)}">${eur0(x.v)}</b></div>`).join('')}${Math.round(rest) ? `<div class="kvl"><span>🏢 Sede e altro</span><b class="${cls(rest)}">${eur0(rest)}</b></div>` : ''}`;
  }
  const per_l = (FIN_PERIODS.find(p => p[0] === (UI.fin.per || 'mese')) || FIN_PERIODS[0])[1];
  return sheet(`${g.ic} ${g.n}`, `<small class="muted">${per_l}${bizId && getBiz(bizId) ? ' · ' + esc(getBiz(bizId).name) : ''}</small>
    <div class="kpis">${kpi('Totale', eur0(all), '', cls(all))}</div><h4>Voci</h4>${voce}${pers}${per}`, '', { help: M.m === 'cash' ? 'flussi' : 'ce' });
};

// ---------- dettaglio di una voce: ogni singola spesa o entrata ----------
/** righe del registro dettagliato: [{bz, w, v}] sommate sui mesi */
function finDetail(keys, cat, bizId) {
  const acc = {};
  for (const k of keys) {
    const dc = ((S.det || {})[k] || {})[cat]; if (!dc) continue;
    for (const key in dc) {
      const i = key.indexOf('|'), bz = key.slice(0, i), w = key.slice(i + 1);
      if (bizId && bz !== bizId) continue;
      const rk = bz + '|' + w;
      acc[rk] = (acc[rk] || 0) + dc[key];
    }
  }
  return Object.entries(acc).map(([rk, v]) => { const i = rk.indexOf('|'); return { bz: rk.slice(0, i), w: rk.slice(i + 1), v }; }).filter(r => Math.abs(r.v) >= 0.5);
}
ACT.finCat = (d) => openModal('finCat', { c: d.c, b: d.b || '', k: d.k });
MODALS.finCat = (M) => {
  const C = CATS[M.c]; if (!C) return '';
  const keys = String(M.k).split(',').filter(Boolean), bizId = M.b || null;
  const total = finTotals(keys, bizId, 'all')[M.c] || 0;
  const rows = finDetail(keys, M.c, bizId).sort((a, c) => Math.abs(c.v) - Math.abs(a.v));
  const rest = total - sum(rows, r => r.v);
  if (Math.abs(rest) >= 1) rows.push({ bz: '', w: '', v: rest, old: true });
  const max = Math.max(1, ...rows.map(r => Math.abs(r.v)));
  const many = !bizId && S.biz.length > 0;
  const where = r => { if (!many || r.old) return ''; const b = getBiz(r.bz); return '<small class="muted">' + (b ? bizType(b).icon + ' ' + esc(b.name) : r.bz ? 'attività chiusa' : '🏢 Sede') + '</small>'; };
  const line = (r, label) => '<div class="kvl"><span class="kvn">' + (r.old ? '<i>Movimenti senza dettaglio</i>' : esc(label != null ? label : r.w || 'Varie')) + where(r) + '</span><b class="' + cls(r.v) + '">' + eur2(r.v) + '</b><span class="fbar">' + bar(Math.abs(r.v), max, r.v >= 0 ? 'g' : 'y') + '</span></div>';
  const people = ['stipendi', 'contributi', 'tfr_pagato'].includes(M.c) && rows.some(r => splitEmpLabel(r.w));
  const list = (people
    ? roleSections(rows.filter(r => !r.old), r => { const p = splitEmpLabel(r.w); return p ? p.role : ''; }, r => { const p = splitEmpLabel(r.w); return line(r, p ? p.name + (p.extra ? ' (' + p.extra + ')' : '') : null); }) + rows.filter(r => r.old).map(r => line(r)).join('')
    : rows.map(r => line(r)).join('')) || '<p class="muted">Nessun movimento.</p>';
  const per = keys.length === 1 && keys[0] !== String(monthKey(S.day)) ? monthLabel(keys[0]) : (FIN_PERIODS.find(p => p[0] === (UI.fin.per || 'mese')) || FIN_PERIODS[0])[1];
  const n = rows.filter(r => !r.old).length;
  return sheet(esc(C.n), '<small class="muted">' + per + (bizId && getBiz(bizId) ? ' · ' + esc(getBiz(bizId).name) : '') + '</small>'
    + '<div class="kpis">' + kpi('Totale', eur0(total), plural(n, 'voce', 'voci'), cls(total)) + '</div>' + list, '', { help: 'ce' });
};

// ---------- Conti di un'attività: stessi gruppi della Finanza ----------
BIZ_TABS.statistiche = (b) => {
  const keys = finKeys();
  const tot = finTotals(keys, b.id, 'pl');
  const pl = plOf(tot);
  const groups = finGroupData(tot);
  const inc = groups.filter(g => g.v >= 0), exp = groups.filter(g => g.v < 0).sort((a, c) => a.v - c.v);
  const months = lastMonthKeys(6).reverse().filter(k => k >= monthKey(b.created));
  const trend = months.map(k => { const p = monthPL(k, b.id); return '<div class="kvl"><span>' + monthLabel(k).slice(0, 3) + ' ' + String(k).slice(2, 4) + '</span><b class="' + cls(p.profit) + '">' + eur0(p.profit) + '</b></div>'; }).join('');
  return finPerSeg()
    + finHead(pl, exp)
    + (inc.length ? finTiles(inc, 'pl', b.id) : '')
    + (exp.length ? finTiles(exp, 'pl', b.id) : '')
    + (!groups.length ? '<p class="muted">Nessun movimento nel periodo.</p>' : '')
    + '<div class="mt">' + sec('Utile mese per mese', 'ce', trend, '', { closed: true, sum: plural(months.length, 'mese', 'mesi') }) + '</div>'
    + sec('30 giorni', null, histTable(b, 30), '', { closed: true, c: 'green' });
};
