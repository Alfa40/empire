'use strict';
/* ============================================================
   EMPIRE - schermate: personale, sede, finanza, banca, immobili,
   borsa, mercato, marketing, ricerca, calendario, registro...
   ============================================================ */

// ===================== PERSONALE =====================
VIEWS.staff = () => {
  const f = UI.st.filter;
  const all = Object.values(S.emps).filter(e => !f || e.biz === f);
  const rows = all.sort((a, c) => (a.biz > c.biz ? 1 : -1)).map(e => {
    const b = e.biz === 'hq' ? null : getBiz(e.biz);
    return tr([`<b>${esc(empName(e))}</b>`, b ? esc(b.name) : 'Sede', esc(ROLES[e.role].name), skillBadge(e.skill), skillBadge(e.morale), [eur0(e.wage), 'n'], empStatus(e) === 'Attivo' ? badge('Attivo', 'g') : badge(empStatus(e), 'y'), btn('⋯', 'empSheet', { e: e.id }, 'sm')]);
  });
  const sad = all.filter(e => e.morale < 40).length;
  return `<div class="head"><h1>Personale ${hb('ruoli')}</h1>${btn('+ Assumi', 'hireOpen', {}, 'pri')}</div>
    <div class="kpis">${kpi('Dipendenti', all.length)}${kpi('Costo/mese', eur0(sum(all, e => empMonthlyCost(e) * 1.37)), '', '', 'stipendio')}${kpi('Morale', all.length ? Math.round(avg(all, e => e.morale)) : '–', sad ? `<span class="neg">${sad} a rischio</span>` : '', '', 'morale')}${kpi('Competenza', all.length ? Math.round(avg(all, e => e.skill)) : '–', '', '', 'competenza')}</div>
    ${sec('Elenco', null, table(['Nome', 'Dove', 'Ruolo', 'Competenza', 'Morale', ['Stipendio', 'n'], 'Stato', ''], rows, { empty: '—' }), select('stFilter', [['', 'Tutti'], ['hq', 'Sede'], ...S.biz.map(b => [b.id, b.name])], f))}`;
};
CHG.stFilter = (v) => { UI.st.filter = v; render(); };

// ===================== SEDE =====================
VIEWS.hq = () => {
  const roles = Object.keys(ROLES).filter(r => ROLES[r].hq);
  return `<div class="head"><h1>Sede centrale ${hb('sede')}</h1>${btn('+ Assumi', 'hireOpen', { target: 'hq' }, 'pri')}</div>
    <div class="kpis">${roles.map(r => kpi(ROLES[r].name, hqCount(r))).join('')}</div>
    ${sec('Personale di sede', null, table(['Nome', 'Ruolo', 'Competenza', 'Morale', 'Stanchezza', ['Stipendio', 'n'], 'Stato', ''], hqEmps().map(empRow), { empty: '—' }))}
    ${sec('Gestione automatica', 'auto', `<label class="row"><input type="checkbox" data-c="autoMinor" ${S.settings.autoMinor ? 'checked' : ''}> Imprevisti minori decisi dai responsabili</label>`, '', { closed: true, sum: S.settings.autoMinor ? 'attiva' : 'spenta' })}`;
};
CHG.autoMinor = (v, d, el) => { S.settings.autoMinor = el.checked; commit(); };

// ===================== FINANZA =====================
VIEWS.finance = () => {
  const tabs = [['ce', 'Conto economico'], ['sp', 'Patrimonio'], ['tasse', 'Imposte'], ['cassa', 'Flussi']];
  let h = `<div class="head"><h1>Finanza</h1></div><div class="tabs">${tabs.map(([id, l]) => `<button data-a="finTab" data-t="${id}" class="${UI.fin.tab === id ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const keys = lastMonthKeys(6).reverse().filter(k => k >= monthKey(S.startDay));
  const mh = k => [monthLabel(k).slice(0, 3) + ' ' + String(k).slice(2, 4), 'n'];
  if (UI.fin.tab === 'ce') {
    const bizId = UI.fin.biz || null;
    const pls = keys.map(k => monthPL(k, bizId));
    const all = [...new Set(pls.flatMap(p => Object.keys(p.lines)))];
    const line = c => tr([esc(CATS[c].n), ...pls.map(p => [p.lines[c] ? `<span class="${cls(p.lines[c])}">${eur0(p.lines[c])}</span>` : '–', 'n'])]);
    const ytd = periodPL(yearKeys(ymd(S.day).y), bizId);
    h += `<div class="kpis">${kpi('Ricavi anno', eur0(ytd.rev))}${kpi('Costi anno', eur0(ytd.cost))}${kpi('Utile anno', eur0(ytd.profit), '', cls(ytd.profit), 'utile')}</div>`;
    h += sec('Mese per mese', 'ce', table(['Voce', ...keys.map(mh)], [...all.filter(c => CATS[c].rev).map(line), tr(['Ricavi', ...pls.map(p => [eur0(p.rev), 'n'])], 'tot'), ...all.filter(c => !CATS[c].rev).map(line), tr(['Costi', ...pls.map(p => [eur0(p.cost), 'n'])], 'tot'), tr(['Risultato', ...pls.map(p => moneyCell(p.profit))], 'tot')]),
      select('finBiz', [['', 'Tutta l\'impresa'], ...S.biz.map(b => [b.id, b.name])], UI.fin.biz));
  } else if (UI.fin.tab === 'sp') {
    const bs = balanceSheet();
    const r = (l, v) => tr([l, [eur0(v), 'n']]);
    h += `<div class="kpis">${kpi('Patrimonio netto', eur0(bs.equity), S.ipo ? 'tua quota ' + eur0(bs.equity * playerShareFraction()) : '', cls(bs.equity), 'patrimonio')}${kpi('Valore impresa', eur0(companyValuation()), '', '', 'valore')}</div>
      <div class="grid g2">${sec('Possiedi', 'sp', table(['Voce', ['€', 'n']], [r('Cassa', bs.cash), r('Magazzino', bs.inv), r('Attrezzature', bs.equip), r('Immobili', bs.props), r('Titoli', bs.titles), r('Cauzioni', bs.deposits), r('Credito IVA', bs.ivaCredit), tr(['Totale', [eur0(bs.assets), 'n']], 'tot')]))}
      ${sec('Devi', 'sp', table(['Voce', ['€', 'n']], [r('Scoperto', bs.overdraft), r('Finanziamenti', bs.loans), r('IVA', bs.ivaDebt), r('Imposte', bs.taxes), r('TFR', bs.tfr), tr(['Totale', [eur0(bs.liab), 'n']], 'tot')]))}</div>`;
  } else if (UI.fin.tab === 'tasse') {
    const ytd = periodPL(yearKeys(ymd(S.day).y));
    const est = legalTaxEstimate(Math.max(0, ytd.profit - S.tax.lossCarry), S.tax.yearRevenue);
    h += `<div class="kpis">${kpi('Forma', LEGAL_FORMS[S.meta.legal].name, '', '', 'forma')}${kpi('Stima imposte', eur0(est.tax + est.inps), 'anno in corso', '', 'imposte')}${kpi('IVA da versare', eur0(S.tax.ivaDue), hasIva() ? 'il 16' : 'forfettario', '', 'iva')}${kpi('Perdite riportate', eur0(S.tax.lossCarry))}</div>
      ${sec('In scadenza', 'imposte', table(['Voce', 'Data', ['€', 'n']], S.tax.due.map(t => tr([esc(t.label.split(' (')[0]), fmtDateShort(t.due), [eur0(t.amount), 'n']])), { empty: '—' }))}
      ${sec('Cambia forma', 'forma', `<div class="seg">${Object.entries(LEGAL_FORMS).filter(([k]) => k !== S.meta.legal).map(([k, v]) => btn(`${v.name} · ${eur0(v.setup || 500)}`, 'legalChange', { v: k }, 'sm', k === 'forfettario' && (S.tax.prevYearRevenue > 85000 || S.tax.yearRevenue > 85000))).join('')}</div>`, '', { closed: true, sum: LEGAL_FORMS[S.meta.legal].name })}`;
  } else {
    const cf = keys.map(k => S.ledger[k] || {});
    const cats = [...new Set(cf.flatMap(L => Object.keys(L)))].filter(c => c !== 'ammortamenti' && c !== 'imposte');
    h += sec('Movimenti', 'flussi', table(['Voce', ...keys.map(mh)], cats.map(c => tr([esc(CATS[c].n), ...cf.map(L => [L[c] ? `<span class="${cls(L[c])}">${eur0(L[c])}</span>` : '–', 'n'])]))))
      + sec('Ultimi 14 giorni', null, table(['Giorno', ['Cassa', 'n'], ['Ricavi', 'n'], ['Utile', 'n']], S.hist.slice(-14).reverse().map(x => tr([fmtDateShort(x.day).slice(0, 5), [eur0(x.cash), 'n'], [eur0(x.rev), 'n'], moneyCell(x.profit)]))), '', { closed: true });
  }
  return h;
};
CHG.finBiz = (v) => { UI.fin.biz = v; render(); };
ACT.legalChange = (d) => { const L = LEGAL_FORMS[d.v]; confirmBox('Passare a ' + L.name + '?', `Costo ${eur0(L.setup || 500)}${L.capital ? ` · serve patrimonio ${eur0(L.capital)}` : ''}`, 'legalChangeOk', { v: d.v }); };
ACT.legalChangeOk = (d) => {
  const L = LEGAL_FORMS[d.v];
  if (L.capital && S.nw < L.capital) { toast('Patrimonio insufficiente', 'err'); return; }
  const cost = L.setup || 500;
  if (S.cash < cost) { toast('Liquidità insufficiente', 'err'); return; }
  cashMove(-cost, 'licenze'); S.meta.legal = d.v; S.meta.legalSince = S.day;
  UI.modal = null; log(`Nuova forma giuridica: ${L.name}.`, 'info'); commit('Fatto');
};

// ===================== BANCA =====================
VIEWS.bank = () => {
  S.credit.score = computeScore();
  const B = UI.bank || (UI.bank = { bank: 'locale', amount: 20000, months: 60 });
  const bank = BANKS.find(x => x.id === B.bank);
  const mx = maxLoan(bank), rate = loanRate(bank, 'prestito');
  const amt = Math.min(B.amount, mx);
  const odMax = Math.max(0, Math.floor(maxLoan(BANKS[0]) * 0.3 / 1000) * 1000);
  const rows = S.loans.map(l => tr([esc(loanLabel(l)), [eur0(l.balance), 'n'], [pct(l.rate, 2), 'n'], [eur0(l.payment), 'n'], [l.left, 'n'], btn('Estingui', 'loanRepay', { l: l.id }, 'sm', S.cash < l.balance * 1.01)]));
  return `<div class="head"><h1>Banca</h1></div>
    <div class="kpis">${kpi('Rating', ratingOf(S.credit.score), S.credit.score + '/100', '', 'rating')}${kpi('Debiti', eur0(sum(S.loans, l => l.balance)))}${kpi('Rate/mese', eur0(sum(S.loans, l => l.payment)))}${kpi('Fido', eur0(S.overdraft.limit), pct(overdraftRate(), 1), '', 'fido')}</div>
    ${sec('Finanziamenti', 'prestito', table(['Finanziamento', ['Residuo', 'n'], ['Tasso', 'n'], ['Rata', 'n'], ['Rate', 'n'], ''], rows, { empty: '—' }), '', { closed: !S.loans.length, sum: S.loans.length ? S.loans.length + ' attivi' : 'nessuno' })}
    <div class="grid g2">${sec('Nuovo prestito', 'prestito', `<div class="seg mb">${BANKS.map(x => btn(x.n.split(' ').slice(0, 2).join(' '), 'bkBank', { v: x.id }, 'sm ' + (B.bank === x.id ? 'on' : ''))).join('')}</div>
      ${mx > 0 ? `<label class="field"><span>Importo · max ${eur0(mx)}</span>${numIn('bkAmount', amt, {}, `min="1000" max="${mx}" step="1000"`)}</label>
      <div class="seg mb">${[12, 24, 36, 48, 60, 72, 84].map(m => btn(m / 12 + ' a', 'bkMonths', { v: m }, 'sm ' + (B.months === m ? 'on' : ''))).join('')}</div>
      <div class="kpis">${kpi('Tasso', pct(rate, 2))}${kpi('Rata', eur0(payment(amt, rate, B.months)))}</div>${btn('Richiedi ✓', 'loanTake', {}, 'pri')}` : `<div class="note r">Rating insufficiente (min ${bank.minScore})</div>`}`, '', { closed: true, sum: mx > 0 ? 'fino a ' + eur0(mx) : 'non disponibile' })}
    ${sec('Fido', 'fido', `<div class="kpis">${kpi('Attuale', eur0(S.overdraft.limit))}${kpi('Massimo', eur0(odMax))}</div><div class="row">${numIn('odLimit', S.overdraft.limit, {}, `id="odLimit" min="0" max="${odMax}" step="1000"`)}${btn('Imposta', 'odSet', {}, 'sm pri')}</div>`, '', { closed: true, sum: eur0(S.overdraft.limit) })}</div>`;
};
ACT.bkBank = (d) => { UI.bank.bank = d.v; render(); };
CHG.bkAmount = (v) => { UI.bank.amount = Math.max(1000, Math.round(+v / 1000) * 1000 || 1000); render(); };
ACT.bkMonths = (d) => { UI.bank.months = +d.v; render(); };
CHG.odLimit = () => { };
ACT.loanTake = () => {
  const B = UI.bank; const bank = BANKS.find(x => x.id === B.bank);
  const amt = Math.min(B.amount, maxLoan(bank));
  if (amt < 1000) { toast('Importo non valido', 'err'); return; }
  takeLoan(B.bank, 'prestito', amt, B.months); log(`Prestito di ${eur(amt)} da ${bank.n}.`, 'good');
  commit(`+${eur0(amt)}`);
};
ACT.loanRepay = (d) => { if (repayLoan(d.l)) commit('Estinto'); else toast('Liquidità insufficiente', 'err'); };
ACT.odSet = () => {
  const v = Math.max(0, Math.round((+$('#odLimit').value || 0) / 1000) * 1000);
  const odMax = Math.max(0, Math.floor(maxLoan(BANKS[0]) * 0.3 / 1000) * 1000);
  if (v > odMax && v > S.overdraft.limit) { toast(`Massimo ${eur0(odMax)}`, 'err'); return; }
  if (v < -S.cash) { toast('Sotto lo scoperto attuale', 'err'); return; }
  S.overdraft.limit = v; S.overdraft.bank = 'locale'; commit('Fido aggiornato');
};

// ===================== IMMOBILI =====================
VIEWS.realestate = () => {
  const city = UI.re.city || (S.biz[0] ? S.biz[0].city : 'milano'); UI.re.city = city;
  const own = S.props.map(p => {
    const b = p.biz && getBiz(p.biz);
    const use = b ? badge(b.name, 'b') : p.tenant ? badge(eur0(p.tenant.rent) + '/mese', 'g') : p.rentOut ? badge('cerca inquilino', 'y') : badge('sfitto');
    return tr([`<b>${esc(PROP_KINDS[p.kind].n)}</b> ${num(p.m2)} m²`, esc(CITY[p.city].name), [eur0(p.value), 'n'], moneyCell(p.value - p.bought), use, b ? '' : btn('⋯', 'propSheet', { p: p.id }, 'sm')]);
  });
  const list = propListings(city);
  return `<div class="head"><h1>Immobili ${hb('immobili')}</h1></div>
    <div class="kpis">${kpi('Immobili', S.props.length)}${kpi('Valore', eur0(sum(S.props, p => p.value)))}${kpi('Affitti', eur0(sum(S.props.filter(p => p.tenant), p => p.tenant.rent)) + '/m')}${kpi('Mutui', eur0(sum(S.loans.filter(l => l.kind === 'mutuo'), l => l.balance)), '', '', 'mutuo')}</div>
    ${sec('Tuoi immobili', 'immobili', table(['Immobile', 'Città', ['Valore', 'n'], ['+/−', 'n'], 'Uso', ''], own, { empty: '—' }), '', { sum: S.props.length })}
    ${sec('In vendita', 'immobili', `<div class="seg mb">${CITIES.map(c => btn(esc(c.name), 'reCity', { c: c.id }, 'sm ' + (city === c.id ? 'on' : ''))).join('')}</div>
      <div class="cards">${list.map(L => `<button class="card" data-a="reBuyOpen" data-id="${L.id}"><h4>${esc(PROP_KINDS[L.kind].n)} · ${num(L.m2)} m²</h4><small>${esc(DISTRICT[L.district].name)}</small>
        <div class="kv">Prezzo <b>${eur0(L.price)}</b></div><div class="kv">Affitto <b>${eur0(L.rent)}/m</b></div><div class="kv">Rendimento <b>${pct(L.rent * 12 / L.price, 1)}</b></div></button>`).join('') || '<p class="muted">—</p>'}</div>`, '', { closed: true, sum: esc(CITY[city].name) })}`;
};
ACT.reCity = (d) => { UI.re.city = d.c; render(); };
ACT.propSheet = (d) => openModal('prop', { p: d.p });
MODALS.prop = (m) => {
  const p = S.props.find(x => x.id === m.p); if (!p) return '';
  return sheet(`${esc(PROP_KINDS[p.kind].n)} · ${num(p.m2)} m²`, `<div class="kpis">${kpi('Valore', eur0(p.value))}${kpi('Acquisto', eur0(p.bought))}${kpi('Affitto equo', eur0(fairRent(p)))}</div>
    ${p.tenant ? `<p>Affittato a ${eur0(p.tenant.rent)}/mese</p>` : `<label class="field"><span>Affitto richiesto</span>${numIn('reAsk', p.rentAsk || fairRent(p), { p: p.id }, 'step="10"')}</label>${btn(p.rentOut ? 'Ritira dall\'affitto' : 'Metti in affitto', 'reRent', { p: p.id }, p.rentOut ? '' : 'pri')}`}`,
    btn('Vendi', 'reSell', { p: p.id }, 'danger'), { help: 'immobili' });
};
CHG.reAsk = (v, d) => { const p = S.props.find(x => x.id === d.p); p.rentAsk = Math.max(0, Math.round(+v || 0)); commit(); };
ACT.reRent = (d) => { const p = S.props.find(x => x.id === d.p); p.rentOut = !p.rentOut; if (!p.rentAsk) p.rentAsk = fairRent(p); commit(p.rentOut ? 'In affitto' : 'Ritirato'); };
ACT.reSell = (d) => { const p = S.props.find(x => x.id === d.p); confirmBox('Vendere?', `Valore ${eur0(p.value)} · agenzia 3%`, 'reSellOk', { p: p.id }, 'Vendi', true); };
ACT.reSellOk = (d) => { const p = S.props.find(x => x.id === d.p); UI.modal = null; res(sellProperty(p), r => `Venduto · ${eur0(r.price)}`); };
ACT.reBuyOpen = (d) => { const L = propListings(UI.re.city).find(x => x.id === d.id); openModal('reBuy', { L, pct: 0, years: 20 }); };
ACT.reBuyPct = (d) => { UI.modal.pct = +d.v; render(); };
ACT.reBuyYears = (d) => { UI.modal.years = +d.v; render(); };
ACT.reBuyOk = () => { const M = UI.modal; const r = buyProperty(M.L, M.pct / 100, M.years); if (r.err) { toast(r.err, 'err'); return; } UI.modal = null; commit('Acquistato'); };
MODALS.reBuy = (M) => {
  const L = M.L; const loan = L.price * M.pct / 100;
  const rate = loanRate(BANKS[1], 'mutuo');
  return sheet(`${esc(PROP_KINDS[L.kind].n)} · ${num(L.m2)} m²`, `<div class="kpis">${kpi('Prezzo', eur0(L.price))}${kpi('Notaio+imposte', eur0(L.price * 0.09))}</div>
    <h4>Mutuo ${hb('mutuo')}</h4><div class="seg mb">${[0, 30, 50, 70, 80].map(x => btn(x ? x + '%' : 'No', 'reBuyPct', { v: x }, 'sm ' + (M.pct === x ? 'on' : ''))).join('')}</div>
    ${M.pct ? `<div class="seg mb">${[10, 15, 20, 25, 30].map(x => btn(x + ' anni', 'reBuyYears', { v: x }, 'sm ' + (M.years === x ? 'on' : ''))).join('')}</div><div class="kpis">${kpi('Tasso', pct(rate, 2))}${kpi('Rata', eur0(payment(loan, rate, M.years * 12)))}</div>` : ''}
    <div class="kpis">${kpi('Paghi ora', eur0(L.price * 1.09 - loan))}${kpi('Cassa', eur0(S.cash))}</div>`, btn('Acquista ✓', 'reBuyOk', {}, 'pri'), { help: 'immobili' });
};

// ===================== BORSA =====================
VIEWS.stocks = () => {
  const info = dayInfo(S.day);
  const rows = S.stocks.map(s => {
    const d = stockDef(s.tk);
    const ch = s.prev ? s.price / s.prev - 1 : 0;
    const h30 = s.hist[Math.max(0, s.hist.length - 22)];
    const hold = S.holdings[s.tk];
    return tr([`<b>${esc(s.tk)}</b> <small>${esc(d.n)}</small>`, [eur2(s.price), 'n'], [`<span class="${cls(ch)}">${pct(ch, 1)}</span>`, 'n'], [`<span class="${cls(s.price / h30 - 1)}">${pct(s.price / h30 - 1, 1)}</span>`, 'n'], [pct(d.div, 1), 'n'],
      [hold ? num(hold.qty) : '–', 'n'], btn('⋯', 'stockSheet', { tk: s.tk }, 'sm')]);
  });
  const port = sum(Object.keys(S.holdings), tk => S.holdings[tk].qty * stockPrice(tk));
  const cost = sum(Object.keys(S.holdings), tk => S.holdings[tk].qty * S.holdings[tk].avg);
  let ipo;
  if (S.ipo) {
    const I = S.ipo;
    ipo = sec(`La tua società · ${esc(I.tk)}`, 'ipo', `<div class="kpis">${kpi('Prezzo', eur2(I.price))}${kpi('Capitalizzazione', eur0(I.price * I.shares))}${kpi('Tua quota', pct(playerShareFraction()))}</div>
      <div class="row">${btn('Colloca 5%', 'ipoMore', {}, 'sm', I.float / I.shares >= 0.45)}${btn('Riacquista 5%', 'ipoBack', {}, 'sm', I.float <= 0)}${btn('Dividendo 1%', 'ipoDiv', {}, 'sm')}</div>`);
  } else {
    const req = ipoRequirements();
    ipo = sec('Quotazione', 'ipo', `${req.map(r => `<div class="${r.ok ? 'pos' : 'neg'}">${r.ok ? '✓' : '✗'} ${esc(r.t)}</div>`).join('')}
      ${req.every(r => r.ok) ? `<div class="seg mt">${[10, 20, 30, 40].map(p => btn(`${p}% · ${eur0(companyValuation() * p / 100 * 0.94)}`, 'ipoDo', { p }, 'sm pri')).join('')}</div>` : ''}`, '', { closed: true, sum: req.filter(r => r.ok).length + '/' + req.length });
  }
  return `<div class="head"><h1>Borsa ${hb('borsa')}</h1>${info.isTradingDay ? badge('Aperta', 'g') : badge('Chiusa', 'r')}</div>
    <div class="kpis">${kpi('Portafoglio', eur0(port))}${kpi('Guadagno', eur0(port - cost), '', cls(port - cost))}${kpi('Mercato oggi', pct(S.marketRet || 0, 2), '', cls(S.marketRet || 0))}</div>
    ${sec('Titoli', null, table(['Titolo', ['Prezzo', 'n'], ['Oggi', 'n'], ['1 mese', 'n'], ['Div.', 'n'], ['Tue', 'n'], ''], rows))}${ipo}`;
};
ACT.stockSheet = (d) => openModal('stock', { tk: d.tk, q: 100 });
ACT.stQ = (d) => { UI.modal.q = Math.max(1, Math.round(UI.modal.q * +d.f)); render(); };
CHG.stQty = (v) => { UI.modal.q = Math.max(1, Math.floor(+v || 1)); render(); };
MODALS.stock = (m) => {
  const s = S.stocks.find(x => x.tk === m.tk); if (!s) return '';
  const d = stockDef(s.tk), h = S.holdings[s.tk], info = dayInfo(S.day);
  const v = m.q * s.price;
  return sheet(`${esc(s.tk)} · ${esc(d.n)}`, `<div class="kpis">${kpi('Prezzo', eur2(s.price))}${kpi('Settore', esc(d.sector))}${kpi('Dividendo', pct(d.div, 1))}${d.types ? kpi('Attività', S.comps.filter(c => c.owner === s.tk).length) : ''}</div>
    ${h ? `<div class="kpis">${kpi('Possiedi', num(h.qty), pct(h.qty / s.shares, 2) + ' del capitale')}${kpi('Prezzo medio', eur2(h.avg))}${kpi('Guadagno', eur0((s.price - h.avg) * h.qty), '', cls(s.price - h.avg))}</div>` : ''}
    <div class="row"><label class="field"><span>Quantità</span>${numIn('stQty', m.q, {}, 'min="1" step="1"')}</label>${btn('½', 'stQ', { f: 0.5 }, 'sm')}${btn('×10', 'stQ', { f: 10 }, 'sm')}</div>
    <div class="kpis">${kpi('Valore', eur0(v))}${kpi('Commissione', eur2(tradeCommission(v)))}</div>${info.isTradingDay ? '' : '<div class="note y">Mercato chiuso</div>'}`,
    btn('Vendi', 'stSell', { tk: s.tk }, '', !info.isTradingDay || !h) + btn('Compra ✓', 'stBuy', { tk: s.tk }, 'ok', !info.isTradingDay), { help: 'borsa' });
};
ACT.stBuy = (d) => { const q = UI.modal.q; UI.modal = null; res(buyStock(d.tk, q), `+${num(q)} ${d.tk}`); };
ACT.stSell = (d) => { const q = Math.min(UI.modal.q, (S.holdings[d.tk] || {}).qty || 0); UI.modal = null; res(sellStock(d.tk, q), r => `−${num(q)} ${d.tk} · ${eur0(r.gain)}`); };
ACT.ipoDo = (d) => confirmBox('Quotarsi in Borsa?', `${d.p}% delle azioni · commissioni 6%`, 'ipoDoOk', { p: d.p });
ACT.ipoDoOk = (d) => { UI.modal = null; res(doIPO(+d.p / 100), 'Quotata!'); };
ACT.ipoMore = () => { const I = S.ipo; const n = Math.round(I.shares * 0.05); cashMove(n * I.price * 0.95, 'capitale'); I.float += n; I.price = round2(I.price * 0.97); commit(`+${eur0(n * I.price * 0.95)}`); };
ACT.ipoBack = () => { const I = S.ipo; const n = Math.min(I.float, Math.round(I.shares * 0.05)); const c = n * I.price * 1.03; if (S.cash < c) { toast('Liquidità insufficiente', 'err'); return; } cashMove(-c, 'capitale'); I.float -= n; I.price = round2(I.price * 1.02); commit(`−${eur0(c)}`); };
ACT.ipoDiv = () => { const I = S.ipo; const out = I.price * I.shares * 0.01 * I.float / I.shares; if (S.cash < out) { toast('Liquidità insufficiente', 'err'); return; } cashMove(-out, 'capitale'); I.sentiment = Math.min(1.6, I.sentiment + 0.04); commit(`Dividendo ${eur0(out)}`); };

// ===================== MERCATO =====================
VIEWS.market = () => {
  const city = UI.mk.city || (S.biz[0] ? S.biz[0].city : 'milano'); UI.mk.city = city;
  const type = UI.mk.type, info = dayInfo(S.day);
  const rows = [];
  for (const d of DISTRICTS) {
    for (const b of S.biz.filter(x => x.city === city && x.district === d.id && x.type === type)) rows.push(tr([`<b>${esc(b.name)}</b> ${badge('tua', 'b')}`, esc(d.name), [Math.round(b.lastQ || 0), 'n'], [num2(priceIndexOf(b, info)), 'n'], [stars(b.rep), 'n'], [Math.round(effAw(b)), 'n']], 'sel'));
    for (const c of compsIn(city, d.id, type)) rows.push(tr([esc(c.name) + (c.owner ? ' ' + badge(c.owner, 'p') : ''), esc(d.name), [c.q, 'n'], [num2(c.pi), 'n'], [stars(c.rep), 'n'], [Math.round(c.aw), 'n']]));
  }
  return `<div class="head"><h1>Mercato ${hb('mercato')}</h1></div>
    <div class="kpis">${kpi('Fase', S.eco.phase, '', '', 'economia')}${kpi('Fiducia', num2(S.eco.index))}${kpi('Inflazione', pct(S.eco.infl, 1))}${kpi('Concorrenti', num(S.comps.length))}</div>
    ${sec('Concorrenza', 'mercato', `<div class="seg mb">${CITIES.map(c => btn(esc(c.name), 'mkCity', { c: c.id }, 'sm ' + (city === c.id ? 'on' : ''))).join('')}</div>
      <div class="mb">${select('mkType', Object.values(BUSINESS_TYPES).filter(t => t.mode === 'shop').map(t => [t.id, t.name]), type)}</div>
      ${table(['Nome', 'Quartiere', ['Qualità', 'n'], ['Prezzi', 'n'], ['Rep.', 'n'], ['Notorietà', 'n']], rows, { empty: '—' })}`)}`;
};
ACT.mkCity = (d) => { UI.mk.city = d.c; render(); };
CHG.mkType = (v) => { UI.mk.type = v; render(); };

// ===================== MARKETING E MARCHI =====================
VIEWS.marketing = () => {
  const cities = [...new Set(S.biz.map(b => b.city))];
  const F = S.franchise;
  const camps = CAMPAIGNS.filter(c => c.scope !== 'biz');
  let fr;
  if (F.on) {
    const br = S.brands.find(b => b.id === F.brand);
    fr = `<div class="kpis">${kpi('Marchio', esc(br ? br.name : '?'))}${kpi('Affiliati', F.affiliates)}${kpi('Royalty/mese', eur0(F.affiliates * F.fee * S.eco.priceLevel))}</div>
      <div class="row"><label class="field"><span>Ingresso</span>${numIn('frEntry', F.entry, {}, 'step="1000" min="0"')}</label><label class="field"><span>Royalty</span>${numIn('frFee', F.fee, {}, 'step="50" min="0"')}</label></div>${btn('Chiudi rete', 'frStop', {}, 'sm danger')}`;
  } else if (franchiseAvailable()) fr = `<div class="seg">${S.brands.filter(br => S.biz.filter(b => b.brand === br.id).length >= 5).map(br => btn('Avvia · ' + esc(br.name), 'frStart', { b: br.id }, 'pri')).join('')}</div>`;
  else fr = `<div>${hasResearch('franchising') ? '✓' : '✗'} Ricerca "Franchising"</div><div>${S.brands.some(br => S.biz.filter(b => b.brand === br.id).length >= 5) ? '✓' : '✗'} Marchio con 5 attività</div>`;
  return `<div class="head"><h1>Marketing</h1></div>
    ${sec('Marchi', 'marchio', `${table(['Marchio', ['Attività', 'n'], ['Notorietà', 'n'], ''], S.brands.map(br => tr([`<b>${esc(br.name)}</b>`, [S.biz.filter(b => b.brand === br.id).length, 'n'], [Math.round(br.aw), 'n'], btn('✕', 'brandDel', { b: br.id }, 'sm danger')])), { empty: '—' })}
      <div class="row mt"><input id="brandName" placeholder="Nuovo marchio" maxlength="30">${btn('Crea · 1.500 €', 'brandNew', {}, 'sm pri')}</div>`, '', { sum: S.brands.length })}
    ${sec('Campagne', 'campagne', `<div class="cards">${camps.map(C => {
      const opts = C.scope === 'city' ? cities.map(c => [c, CITY[c].name]) : S.brands.map(b => [b.id, b.name]);
      return `<div class="card" style="cursor:default"><h4>${esc(C.n)}</h4><div class="kv">${C.scope === 'city' ? 'Città' : 'Marchio'} · ${C.days} gg <b>${eur0(C.cost * S.eco.priceLevel * 1.22)}</b></div>
        ${opts.length ? `<div class="row"><select id="ct_${C.id}">${opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>${btn('Lancia', 'campCity', { c: C.id }, 'sm pri')}</div>` : '<small class="muted">—</small>'}</div>`;
    }).join('')}</div>`, '', { closed: true, sum: S.campaigns.length ? S.campaigns.length + ' attive' : '' })}
    ${sec('Franchising', 'franchising', fr, '', { closed: true, sum: F.on ? F.affiliates + ' affiliati' : 'no' })}`;
};
ACT.brandNew = () => { const n = $('#brandName').value.trim(); if (!n) { toast('Scrivi un nome', 'err'); return; } if (S.cash < 1500) { toast('Liquidità insufficiente', 'err'); return; } cashMove(-1500, 'licenze'); S.brands.push({ id: uid('br'), name: n, aw: 0 }); commit('Marchio creato'); };
ACT.brandDel = (d) => { S.brands = S.brands.filter(b => b.id !== d.b); for (const b of S.biz) if (b.brand === d.b) b.brand = null; if (S.franchise.brand === d.b) S.franchise.on = false; commit(); };
ACT.campCity = (d) => ACT.campLaunch({ c: d.c, t: $('#ct_' + d.c).value });
ACT.frStart = (d) => { S.franchise = { on: true, brand: d.b, affiliates: S.franchise.affiliates || 0, fee: 600, entry: 18000 }; commit('Franchising avviato'); };
ACT.frStop = () => { S.franchise.on = false; S.franchise.affiliates = 0; commit(); };
CHG.frEntry = (v) => { S.franchise.entry = Math.max(0, +v || 0); commit(); };
CHG.frFee = (v) => { S.franchise.fee = Math.max(0, +v || 0); commit(); };

// ===================== RICERCA =====================
VIEWS.research = () => {
  const a = S.research.active;
  const disc = 1 - 0.05 * Math.min(5, hqCount('ricercatore')), speed = 1 + 0.35 * Math.min(5, hqCount('ricercatore'));
  return `<div class="head"><h1>Ricerca ${hb('ricerca')}</h1></div>
    ${a ? `<div class="panel"><b>${esc(RESEARCH_BY[a.id].n)}</b> ${bar(a.progress, a.days, 'g')} ${pct(a.progress / a.days)} · ${Math.ceil((a.days - a.progress) / speed)} gg</div>` : ''}
    <div class="cards">${RESEARCH.map(R => {
      const done = hasResearch(R.id), ok = !R.req || R.req.every(hasResearch);
      return `<div class="card" style="cursor:default"><div class="top-row"><h4>${esc(R.n)}</h4>${done ? badge('✓', 'g') : a && a.id === R.id ? badge('in corso', 'b') : ''}</div><small>${esc(R.d)}</small>
        <div class="kv">${eur0(R.cost * S.eco.priceLevel * disc)} <b>${Math.ceil(R.days / speed)} gg</b></div>
        ${R.req ? `<small class="${ok ? 'pos' : 'neg'}">Serve: ${R.req.map(x => RESEARCH_BY[x].n).join(', ')}</small>` : ''}
        ${done || (a && a.id === R.id) ? '' : btn('Avvia', 'resStart', { r: R.id }, 'sm pri', !!a || !ok)}</div>`;
    }).join('')}</div>`;
};
ACT.resStart = (d) => res(startResearch(d.r), 'Avviata');

// ===================== CALENDARIO =====================
VIEWS.calendar = () => {
  const mk = UI.cal.mk || monthKey(S.day);
  const y = Math.floor(mk / 100), m = (mk % 100) - 1;
  const first = dayFromYMD(y, m, 1), dim = daysInMonth(y, m);
  const dl = deadlines(400);
  const cells = [];
  for (let i = 0; i < ymd(first).wd; i++) cells.push('<div class="c out"></div>');
  for (let d = 1; d <= dim; d++) {
    const day = first + d - 1, inf = dayInfo(day);
    const items = dl.filter(z => z.d === day);
    const txt = [inf.holiday, ...inf.labels.slice(0, 1), ...items.map(x => x.t)].filter(Boolean);
    cells.push(`<button class="c ${inf.isFestivo ? 'fest' : ''} ${day === S.day ? 'today' : ''} ${day < S.day ? 'past' : ''}" data-a="calDay" data-d="${day}" style="font:inherit;text-align:left;cursor:pointer;color:inherit"><span class="dn">${d}</span>${items.length ? '<span class="mk"></span>' : ''}<div class="txt">${txt.slice(0, 3).map(t => `<div>${esc(t.length > 16 ? t.slice(0, 15) + '…' : t)}</div>`).join('')}</div></button>`);
  }
  return `<div class="head"><h1>Calendario ${hb('data')}</h1><div class="row">${btn('◀', 'calMove', { d: -1 }, 'sm')}<b>${MONTHS_CAP[m]} ${y}</b>${btn('▶', 'calMove', { d: 1 }, 'sm')}${btn('Oggi', 'calMove', { d: 0 }, 'sm')}</div></div>
    <div class="panel"><div class="cal">${WEEKDAYS_SHORT.map(w => `<div class="h">${w}</div>`).join('')}${cells.join('')}</div></div>
    ${sec('Scadenze', 'scadenze', table(['Data', 'Voce', ['€', 'n']], deadlines(45).slice(0, 10).map(x => tr([fmtDateShort(x.d), esc(x.t), [x.v == null ? '–' : eur0(x.v), 'n']])), { empty: '—' }), '', { closed: true })}`;
};
ACT.calMove = (d) => {
  if (+d.d === 0) { UI.cal.mk = null; render(); return; }
  const mk = UI.cal.mk || monthKey(S.day);
  let y = Math.floor(mk / 100), m = mk % 100 + +d.d;
  if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
  UI.cal.mk = y * 100 + m; render();
};
ACT.calDay = (d) => openModal('calDay', { d: +d.d });
MODALS.calDay = (m) => {
  const inf = dayInfo(m.d);
  const items = deadlines(800).filter(z => z.d === m.d);
  const clos = S.biz.filter(b => b.closures.some(c => m.d >= c.from && m.d <= c.to));
  return sheet(fmtDateLong(m.d), `<div class="row mb">${badge(SEASON_NAMES[inf.season])} ${inf.holiday ? badge(inf.holiday, 'r') : ''} ${inf.labels.map(l => badge(l, 'y')).join(' ')}</div>
    ${items.length ? table(['Voce', ['€', 'n']], items.map(x => tr([esc(x.t), [x.v == null ? '–' : eur0(x.v), 'n']]))) : '<p class="muted">Nessuna scadenza</p>'}
    ${clos.length ? `<h4>Chiuse per ferie</h4>${clos.map(b => badge(b.name, 'b')).join(' ')}` : ''}`);
};

// ===================== REGISTRO, TRAGUARDI, IMPOSTAZIONI =====================
VIEWS.log = () => {
  const f = UI.logf;
  return `<div class="head"><h1>Registro</h1></div><div class="seg mb">${[['all', 'Tutto'], ['good', '▲'], ['bad', '▼'], ['event', '◆'], ['ach', '★']].map(([k, l]) => btn(l, 'logF', { f: k }, 'sm ' + (f === k ? 'on' : ''))).join('')}</div>
    <div class="panel">${logList(S.log.filter(l => f === 'all' || l.type === f).slice(0, 300))}</div>`;
};
ACT.logF = (d) => { UI.logf = d.f; render(); };
VIEWS.ach = () => `<div class="head"><h1>Traguardi ${hb('traguardi')}</h1><b>${Object.keys(S.ach).length}/${ACHIEVEMENTS.length}</b></div>
  <div class="cards">${ACHIEVEMENTS.map(a => `<div class="card" style="cursor:default;${S.ach[a.id] ? '' : 'opacity:.55'}"><h4>${S.ach[a.id] ? '★' : '☆'} ${esc(a.n)}</h4><small>${esc(a.d)}</small>${S.ach[a.id] ? `<small class="pos">${fmtDateShort(S.ach[a.id])}</small>` : ''}</div>`).join('')}</div>`;
VIEWS.settings = () => `<div class="head"><h1>Impostazioni</h1></div>
  ${sec('Aspetto', null, `<div class="row">${themeButtons()}</div>${topPadPicker()}`, '', { c: 'gray' })}
  ${sec('Salvataggi', 'salvataggi', savesPanel(true), '', { closed: true, sum: 'slot ' + S.meta.slot })}
  ${sec('Partita', null, `<div class="row">${btn('Menu principale', 'quitMenu')}${btn('Rivedi tutorial', 'tutRestart')}</div>`, '', { closed: true, c: 'gray' })}`;
