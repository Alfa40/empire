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
function empChip(e) {
  const b = e.biz === 'hq' ? null : getBiz(e.biz);
  const st = empStatus(e), away = st !== 'Attivo';
  return ovChip(`${esc(e.first)} <small>${b ? esc(b.name) : 'Sede'}</small>`, away ? st.toLowerCase() : `${Math.round(e.skill)} · ${eur0(e.wage)}`, empBad(e) ? 'bad' : away ? 'off' : 'ok', 'sub', { x: 'empSheet', e: e.id });
}
VIEWS.staff = () => {
  const all = staffList();
  const sad = all.filter(empBad).length;
  const tiles = staffGroups().filter(g => g.emps.length).map(g => {
    const bad = g.emps.filter(empBad).length;
    return `<button class="ovt ${bad ? 'bad' : 'ok'}" data-a="staffGroup" data-g="${g.id}"><span class="ic">${g.ic}</span><b>${g.n}</b><small>${bad ? bad + ' da vedere' : plural(g.emps.length, 'persona', 'persone')}</small></button>`;
  }).join('');
  return `<div class="ov-head"><h1>Personale</h1>${hb('ruoli')}</div>
    <div class="ovcs ovg">${ovChip('👥 Persone', all.length, 'ok', 'help', { k: 'ruoli' })}${ovChip('💶 Costo/mese', eur0(sum(all, e => empMonthlyCost(e) * 1.37)), 'ok', 'help', { k: 'stipendio' })}${ovChip('🙂 Morale', all.length ? Math.round(avg(all, e => e.morale)) : '–', sad ? 'bad' : 'ok', 'help', { k: 'morale' })}</div>
    <div class="row mb">${select('stFilter', [['', 'Ovunque'], ['hq', 'Sede'], ...S.biz.map(b => [b.id, b.name])], UI.st.filter)}${btn('+ Assumi', 'hireOpen', {}, 'pri')}</div>
    ${tiles ? `<div class="ovts">${tiles}</div>` : '<p class="muted">Nessun dipendente.</p>'}`;
};
ACT.staffGroup = (d) => openModal('staffGroup', { g: d.g });
MODALS.staffGroup = (M) => {
  const g = staffGroups().find(x => x.id === M.g); if (!g) return '';
  const subs = g.roles.map(r => ({ r, emps: g.emps.filter(e => e.role === r) })).filter(x => x.emps.length);
  const body = subs.map(x => `<h4>${esc(ROLES[x.r].name)} <small class="muted">${x.emps.length}</small></h4><div class="ovcs">${x.emps.sort((a, c) => (a.biz > c.biz ? 1 : -1)).map(empChip).join('')}</div>`).join('') || '<p class="muted">Nessuno.</p>';
  return sheet(`${g.ic} ${g.n}`, `<small class="muted">Competenza · stipendio</small>${body}`, '', { help: 'ruoli' });
};

// ===================== FINANZA =====================
const FIN_GROUPS = [
  { id: 'vendite', ic: '🛒', n: 'Vendite', cats: ['vendite', 'ingrosso', 'interni'] },
  { id: 'rendite', ic: '🏘️', n: 'Affitti incassati e rendite', cats: ['affitti_attivi', 'royalties', 'dividendi', 'plusvalenze', 'altri_ricavi', 'cessioni'] },
  { id: 'personale', ic: '👥', n: 'Spese per dipendenti', cats: ['stipendi', 'contributi', 'formazione', 'tfr_pagato'] },
  { id: 'affitti', ic: '🏠', n: 'Affitti', cats: ['affitto'] },
  { id: 'fisse', ic: '💡', n: 'Spese fisse', cats: ['utenze', 'assicurazioni', 'consulenze'] },
  { id: 'merci', ic: '📦', n: 'Merci e materie prime', cats: ['materiali'] },
  { id: 'gestionali', ic: '📋', n: 'Spese gestionali', cats: ['marketing', 'ricerca', 'licenze', 'commissioni'] },
  { id: 'manutenzione', ic: '🔧', n: 'Manutenzione', cats: ['manutenzione'] },
  { id: 'tasse', ic: '🧾', n: 'Tasse e imposte', cats: ['imposte', 'imposte_varie', 'iva', 'versamento_imposte'] },
  { id: 'banca', ic: '🏦', n: 'Banca e finanziamenti', cats: ['interessi', 'finanziamenti', 'rimborsi', 'capitale', 'cauzioni'] },
  { id: 'invest', ic: '🛠️', n: 'Investimenti e ammortamenti', cats: ['investimenti', 'ammortamenti', 'minusvalenze', 'immobili', 'titoli'] },
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
function finTiles(groups, mode) {
  return `<div class="ovts">${groups.map(g => `<button class="ovt ${g.v >= 0 ? 'ok' : 'exp'}" data-a="finGroup" data-g="${g.id}" data-m="${mode}"><span class="ic">${g.ic}</span><b>${g.n}</b><small class="${cls(g.v)}">${eur0(g.v)}</small></button>`).join('')}</div>`;
}
function finFilters() {
  return `<div class="seg mb">${FIN_PERIODS.map(([k, l]) => btn(l, 'finPer', { p: k }, 'sm ' + ((UI.fin.per || 'mese') === k ? 'on' : ''))).join('')}</div>
    <div class="row mb">${select('finBiz', [['', 'Tutta l\'impresa'], ...S.biz.map(b => [b.id, b.name])], UI.fin.biz)}</div>`;
}
ACT.finPer = (d) => { UI.fin.per = d.p; render(); };

const _financeOld = VIEWS.finance;
VIEWS.finance = () => {
  const tabs = [['ce', '💶 Entrate e spese'], ['cassa', '🔁 Cassa'], ['sp', '🏛️ Patrimonio'], ['tasse', '🧾 Imposte']];
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
    + `<div class="ovcs ovg">${ovChip('⬆️ Ricavi', eur0(pl.rev), 'ok', 'help', { k: 'ce' })}${ovChip('⬇️ Costi', eur0(pl.cost), 'ok', 'help', { k: 'ce' })}${ovChip('= Utile', `<span class="${cls(pl.profit)}">${eur0(pl.profit)}</span>`, pl.profit < 0 ? 'bad' : 'ok', 'help', { k: 'utile' })}</div>`
    + (inc.length ? `<h4>Entrate</h4>${finTiles(inc, 'pl')}` : '')
    + (exp.length ? `<h4>Spese</h4>${finTiles(exp, 'pl')}` : '')
    + (!groups.length ? '<p class="muted">Nessun movimento nel periodo.</p>' : '')
    + `<div class="mt">${sec('Utile mese per mese', 'ce', trend, '', { closed: true, sum: plural(months.length, 'mese', 'mesi') })}</div>`;
};

ACT.finGroup = (d) => openModal('finGroup', { g: d.g, m: d.m });
MODALS.finGroup = (M) => {
  const g = FIN_GROUPS.find(x => x.id === M.g); if (!g) return '';
  const keys = finKeys(), bizId = UI.fin.biz || null;
  const tot = finTotals(keys, bizId, M.m);
  const lines = g.cats.filter(c => tot[c]).map(c => ({ c, v: tot[c] })).sort((a, c) => Math.abs(c.v) - Math.abs(a.v));
  const all = sum(lines, l => l.v);
  const max = Math.max(1, ...lines.map(l => Math.abs(l.v)));
  const voce = lines.map(l => `<div class="kvl"><span>${esc(CATS[l.c].n)}</span><b class="${cls(l.v)}">${eur0(l.v)}</b><span class="fbar">${bar(Math.abs(l.v), max, l.v >= 0 ? 'g' : 'y')}</span></div>`).join('') || '<p class="muted">—</p>';
  // divisione per attività
  let per = '';
  if (!bizId && S.biz.length) {
    const rows = S.biz.map(b => { const t = finTotals(keys, b.id, M.m); return { b, v: sum(g.cats, c => t[c] || 0) }; }).filter(x => Math.round(x.v));
    const rest = all - sum(rows, x => x.v);
    if (rows.length) per = `<h4>Per attività</h4>${rows.sort((a, c) => Math.abs(c.v) - Math.abs(a.v)).map(x => `<div class="kvl"><span>${bizType(x.b).icon} ${esc(x.b.name)}</span><b class="${cls(x.v)}">${eur0(x.v)}</b></div>`).join('')}${Math.round(rest) ? `<div class="kvl"><span>🏢 Sede e altro</span><b class="${cls(rest)}">${eur0(rest)}</b></div>` : ''}`;
  }
  const per_l = (FIN_PERIODS.find(p => p[0] === (UI.fin.per || 'mese')) || FIN_PERIODS[0])[1];
  return sheet(`${g.ic} ${g.n}`, `<small class="muted">${per_l}${bizId && getBiz(bizId) ? ' · ' + esc(getBiz(bizId).name) : ''}</small>
    <div class="kpis">${kpi('Totale', eur0(all), '', cls(all))}</div><h4>Voci</h4>${voce}${per}`, '', { help: M.m === 'cash' ? 'flussi' : 'ce' });
};
