'use strict';
/* ============================================================
   EMPIRE - contabilità, IVA, imposte, banca, valutazioni
   ============================================================ */

const CATS = {
  vendite: { n: 'Vendite', rev: true },
  ingrosso: { n: 'Vendite all\'ingrosso', rev: true },
  interni: { n: 'Forniture alle tue attività', rev: true },
  affitti_attivi: { n: 'Affitti incassati', rev: true },
  royalties: { n: 'Royalties franchising', rev: true },
  dividendi: { n: 'Dividendi incassati', rev: true },
  plusvalenze: { n: 'Plusvalenze', rev: true },
  altri_ricavi: { n: 'Altri ricavi', rev: true },
  materiali: { n: 'Acquisti materiali e merci' },
  stipendi: { n: 'Stipendi lordi' },
  contributi: { n: 'Contributi INPS/INAIL e TFR' },
  affitto: { n: 'Affitti passivi' },
  utenze: { n: 'Energia e utenze' },
  marketing: { n: 'Marketing e pubblicità' },
  manutenzione: { n: 'Manutenzioni e canoni' },
  formazione: { n: 'Formazione e selezione' },
  consulenze: { n: 'Commercialista e consulenze' },
  assicurazioni: { n: 'Assicurazioni' },
  commissioni: { n: 'Commissioni e spese' },
  interessi: { n: 'Interessi passivi' },
  licenze: { n: 'Licenze, permessi e notaio' },
  imposte_varie: { n: 'IMU, tasse locali e sanzioni' },
  ricerca: { n: 'Ricerca e sviluppo' },
  ammortamenti: { n: 'Ammortamenti' },
  minusvalenze: { n: 'Minusvalenze e perdite' },
  imposte: { n: 'Imposte sul reddito' },
  investimenti: { n: 'Investimenti (attrezzature e lavori)', nopl: true },
  immobili: { n: 'Compravendita immobili', nopl: true },
  titoli: { n: 'Compravendita titoli', nopl: true },
  finanziamenti: { n: 'Finanziamenti ricevuti', nopl: true },
  rimborsi: { n: 'Rimborso quote capitale', nopl: true },
  cauzioni: { n: 'Depositi cauzionali', nopl: true },
  iva: { n: 'Versamenti IVA', nopl: true },
  versamento_imposte: { n: 'Versamento imposte', nopl: true },
  tfr_pagato: { n: 'Liquidazioni TFR', nopl: true },
  capitale: { n: 'Capitale da soci/Borsa', nopl: true },
  cessioni: { n: 'Incasso cessioni', nopl: true },
};

function hasIva() { return LEGAL_FORMS[S.meta.legal].iva; }

function book(cat, amount, bizId, what) {
  const mk = monthKey(S.day);
  // dettaglio voce per voce: S.det[mese][categoria]["attività|voce"]
  const D = S.det || (S.det = {}), dm = D[mk] || (D[mk] = {}), dc = dm[cat] || (dm[cat] = {});
  const dk = (bizId || '') + '|' + (what || '');
  dc[dk] = (dc[dk] || 0) + amount;
  const L = S.ledger[mk] || (S.ledger[mk] = {});
  L[cat] = (L[cat] || 0) + amount;
  if (bizId) {
    const BL = S.bizLedger[bizId] || (S.bizLedger[bizId] = {});
    const l = BL[mk] || (BL[mk] = {});
    l[cat] = (l[cat] || 0) + amount;
  }
  if (CATS[cat] && CATS[cat].rev && ['vendite', 'ingrosso', 'interni', 'affitti_attivi', 'royalties', 'altri_ricavi'].includes(cat)) S.tax.yearRevenue += amount;
}
/** incasso con IVA inclusa (gross) */
function income(gross, ivaRate, cat, bizId, what) {
  if (gross === 0) return 0;
  let net = gross;
  if (hasIva() && ivaRate) { net = gross / (1 + ivaRate); S.tax.ivaDebit += gross - net; }
  S.cash += gross;
  book(cat, net, bizId, what);
  return net;
}
/** spesa con prezzo netto + IVA */
function expense(net, ivaRate, cat, bizId, what) {
  if (net === 0) return 0;
  let gross = net * (1 + (ivaRate || 0));
  if (hasIva()) { S.tax.ivaCredit += gross - net; book(cat, -net, bizId, what); }
  else book(cat, -gross, bizId, what);
  S.cash -= gross;
  return gross;
}
/** movimento senza IVA (stipendi, interessi, tasse, finanziamenti...) */
function cashMove(amount, cat, bizId, what) {
  S.cash += amount;
  book(cat, amount, bizId, what);
}
/** registrazione solo contabile (non tocca la cassa) */
function bookOnly(cat, amount, bizId, what) { book(cat, amount, bizId, what); }
/** etichetta di un dipendente per il registro */
function empLbl(e) { return e.first + ' ' + e.last + ' · ' + ((ROLES[e.role] || {}).name || e.role); }
/** tiene il dettaglio solo degli ultimi 24 mesi */
function pruneDetail() { if (!S.det) return; const keep = new Set(lastMonthKeys(24)); for (const k in S.det) if (!keep.has(+k) && !keep.has(k)) delete S.det[k]; }

// ---------- Report contabili ----------
function plOf(L) {
  const r = { rev: 0, cost: 0, lines: {} };
  if (!L) return r;
  for (const c in L) {
    if (!CATS[c] || CATS[c].nopl) continue;
    r.lines[c] = L[c];
    if (CATS[c].rev) r.rev += L[c]; else r.cost += L[c];
  }
  r.profit = r.rev + r.cost;
  return r;
}
function monthPL(mk, bizId) { return plOf(bizId ? (S.bizLedger[bizId] || {})[mk] : S.ledger[mk]); }
function periodPL(keys, bizId) {
  const tot = {};
  for (const k of keys) {
    const L = bizId ? (S.bizLedger[bizId] || {})[k] : S.ledger[k];
    if (!L) continue;
    for (const c in L) tot[c] = (tot[c] || 0) + L[c];
  }
  return plOf(tot);
}
function lastMonthKeys(n) {
  const out = []; let k = monthKey(S.day);
  for (let i = 0; i < n; i++) { out.push(k); k = prevMonthKey(k); }
  return out;
}
function yearKeys(y) { return Array.from({ length: 12 }, (_, i) => y * 100 + i + 1); }
/** profitto e ricavi su base giornaliera degli ultimi N giorni (dal registro storico) */
function recentDaily(n, bizId) {
  const h = bizId ? (getBiz(bizId) || {}).hist || [] : S.hist;
  const sl = h.slice(-n);
  return { rev: sum(sl, x => x.rev || 0), profit: sum(sl, x => x.profit || 0), days: sl.length };
}

// ---------- Ammortamenti ----------
function addAsset(cost, years, label, bizId, kind) {
  const a = { id: uid('a'), cost, book: cost, years, label, biz: bizId, kind: kind || 'attrezzatura', start: S.day };
  S.assets.push(a);
  return a.id;
}
function removeAsset(id) {
  const i = S.assets.findIndex(a => a.id === id);
  if (i < 0) return 0;
  const bookV = S.assets[i].book;
  S.assets.splice(i, 1);
  return bookV;
}
function monthlyDepreciation() {
  for (const a of S.assets) {
    const d = Math.min(a.book, a.cost / (a.years * 12));
    if (d <= 0) continue;
    a.book -= d;
    bookOnly('ammortamenti', -d, a.biz, a.label);
  }
  S.assets = S.assets.filter(a => a.book > 0.5 || a.kind === 'immobile');
}

// ---------- Stato patrimoniale ----------
function inventoryValue(b) {
  let v = 0;
  for (const m in b.inv) for (const l of b.inv[m]) v += l.q * l.c;
  return v;
}
function balanceSheet() {
  const inv = sum(S.biz, b => inventoryValue(b));
  const equip = sum(S.assets.filter(a => a.kind !== 'immobile'), a => a.book);
  const props = sum(S.props, p => p.value);
  const titles = sum(Object.keys(S.holdings), tk => S.holdings[tk].qty * stockPrice(tk));
  const deposits = sum(S.biz, b => b.deposit || 0);
  const ivaCredit = S.tax.ivaCarry + Math.max(0, S.tax.ivaCredit - S.tax.ivaDebit);
  const pending = sum(S.orders.filter(o => !o.internal), o => o.paid || 0);
  const cash = Math.max(0, S.cash);
  const overdraft = Math.max(0, -S.cash);
  const loans = sum(S.loans, l => l.balance);
  const ivaDebt = S.tax.ivaDue + Math.max(0, S.tax.ivaDebit - S.tax.ivaCredit);
  const taxes = sum(S.tax.due, t => t.amount);
  const tfr = sum(Object.values(S.emps), e => e.tfr || 0);
  const assets = cash + inv + equip + props + titles + deposits + ivaCredit + pending;
  const liab = overdraft + loans + ivaDebt + taxes + tfr;
  return { cash, inv, equip, props, titles, deposits, ivaCredit, pending, overdraft, loans, ivaDebt, taxes, tfr, assets, liab, equity: assets - liab };
}
function netWorth() { return balanceSheet().equity; }

// ---------- Valutazioni ----------
function bizValuation(b) {
  const r = recentDaily(90, b.id);
  const annual = r.days > 0 ? r.profit / r.days * 365 : 0;
  const equipV = sum(S.assets.filter(a => a.biz === b.id && a.kind !== 'immobile'), a => a.book);
  const invV = inventoryValue(b);
  const repBonus = 1 + (b.rep - 50) / 200;
  const goodwill = Math.max(0, annual) * 3.2 * repBonus;
  return Math.max(0, Math.round(equipV * 0.7 + invV + goodwill + (b.license || 0) * 0.5));
}
function companyValuation() {
  const bs = balanceSheet();
  const bizV = sum(S.biz, b => bizValuation(b));
  const equipV = bs.equip;
  return Math.max(0, Math.round(bs.equity - equipV - bs.inv + bizV));
}

// ---------- Imposte ----------
function legalTaxEstimate(profit, revenue, legal) {
  legal = legal || S.meta.legal;
  const y0 = dayFromYMD(ymd(S.day).y, 0, 1);
  const frac = clamp((S.day - Math.max(y0, S.startDay)) / 365, 0.05, 1);
  if (legal === 'forfettario') {
    const coef = forfCoef();
    const base = Math.max(0, revenue) * coef;
    const years = (S.day - S.meta.legalSince) / 365;
    const rate = years < 5 ? 0.05 : 0.15;
    return { tax: base * rate, inps: Math.max(4500 * frac, base * 0.24), label: `Imposta sostitutiva ${pct(rate)} su ${pct(coef)} dei ricavi` };
  }
  if (legal === 'ditta') {
    const p = Math.max(0, profit);
    let t = Math.min(p, 28000) * 0.23 + Math.max(0, Math.min(p, 50000) - 28000) * 0.35 + Math.max(0, p - 50000) * 0.43;
    return { tax: t, inps: Math.max(4500 * frac, p * 0.24), label: 'IRPEF a scaglioni + INPS titolare' };
  }
  const p = Math.max(0, profit);
  return { tax: p * 0.24 + p * 0.039, inps: 0, label: 'IRES 24% + IRAP 3,9%' };
}
function forfCoef() {
  if (!S.biz.length) return 0.4;
  const serv = S.biz.filter(b => bizType(b).sector === 'Servizi').length;
  return serv > S.biz.length / 2 ? 0.67 : 0.4;
}
function closeFiscalYear(y) {
  const pl = periodPL(yearKeys(y));
  const revenue = S.tax.yearRevenue;
  let profit = pl.profit;
  let taxable = profit;
  if (S.meta.legal !== 'forfettario') {
    if (taxable > 0 && S.tax.lossCarry > 0) { const used = Math.min(taxable * 0.8, S.tax.lossCarry); taxable -= used; S.tax.lossCarry -= used; }
    else if (taxable < 0) { S.tax.lossCarry += -taxable; taxable = 0; }
  }
  const est = legalTaxEstimate(taxable, revenue);
  const total = Math.round(est.tax + est.inps);
  if (total > 0) {
    bookOnly('imposte', -total, null, 'Imposte anno ' + y);
    S.tax.due.push({ amount: total, due: dayFromYMD(y + 1, 5, 30), label: `Imposte anno ${y} (${est.label})` });
  }
  log(`Chiuso l'esercizio ${y}: utile ante imposte ${eur(profit)}, imposte e contributi dovuti ${eur(total)} entro il 30 giugno ${y + 1}.`, profit >= 0 ? 'good' : 'bad');
  S.tax.prevYearRevenue = revenue;
  S.tax.yearRevenue = 0;
  if (S.meta.legal === 'forfettario' && revenue > 85000) {
    S.meta.legal = 'ditta'; S.meta.legalSince = S.day;
    log('I ricavi hanno superato 85.000 €: esci dal regime forfettario e passi alla contabilità ordinaria (ditta individuale).', 'bad');
  }
}

// ---------- Banca e rating ----------
function annualRevenue() {
  const r = recentDaily(365);
  return r.days ? r.rev / r.days * 365 : 0;
}
function computeScore() {
  const months = (S.day - S.startDay) / 30;
  let s = 28 + Math.min(14, months * 0.7);
  const r90 = recentDaily(90);
  if (r90.days > 20) {
    const margin = r90.rev > 0 ? r90.profit / r90.rev : -1;
    s += clamp(margin * 120, -15, 22);
  }
  const bs = balanceSheet();
  const debt = bs.loans + bs.overdraft;
  if (bs.equity > 0) s += clamp(10 * Math.log10(1 + bs.equity / Math.max(1, debt + 5000)), 0, 14);
  else s -= 12;
  const rev = annualRevenue();
  if (debt > 0 && rev > 0) s -= clamp((debt / rev - 1) * 6, 0, 15);
  s += clamp(Math.log10(Math.max(1, bs.equity)) * 2 - 8, -4, 8);
  s -= clamp(S.credit.lateDays * 0.4, 0, 35);
  return clamp(Math.round(s), 0, 100);
}
function ratingOf(score) {
  return score >= 85 ? 'AAA' : score >= 75 ? 'AA' : score >= 65 ? 'A' : score >= 55 ? 'BBB' : score >= 45 ? 'BB' : score >= 35 ? 'B' : score >= 22 ? 'CCC' : 'D';
}
function ratingSpread(score) {
  return score >= 85 ? 0.01 : score >= 75 ? 0.015 : score >= 65 ? 0.02 : score >= 55 ? 0.028 : score >= 45 ? 0.036 : score >= 35 ? 0.048 : score >= 22 ? 0.065 : 0.1;
}
function loanRate(bank, kind) {
  const diff = DIFFICULTY[S.meta.difficulty];
  let r = S.eco.bce + bank.spread / 100 + ratingSpread(S.credit.score) + diff.rateAdj / 100;
  if (kind === 'mutuo') r -= 0.012;
  if (kind === 'leasing') r += 0.01;
  if (hasResearch('finanza')) r -= 0.005;
  return Math.max(0.01, r);
}
function maxLoan(bank) {
  if (S.credit.score < bank.minScore) return 0;
  const bs = balanceSheet();
  const rev = annualRevenue();
  const unsecured = sum(S.loans.filter(l => l.kind === 'prestito'), l => l.balance);
  const base = Math.max(25000, rev * 0.45 + Math.max(0, bs.equity) * 0.6);
  const lim = base * bank.mult * clamp(S.credit.score / 55, 0.4, 1.6) - unsecured;
  return Math.max(0, Math.floor(lim / 1000) * 1000);
}
function payment(principal, annualRate, months) {
  const r = annualRate / 12;
  if (r <= 0) return principal / months;
  return principal * r / (1 - Math.pow(1 + r, -months));
}
function takeLoan(bankId, kind, amount, months, extra = {}) {
  const bank = BANKS.find(b => b.id === bankId);
  const rate = loanRate(bank, kind);
  const pay = payment(amount, rate, months);
  const loan = Object.assign({ id: uid('l'), bank: bankId, kind, principal: amount, balance: amount, rate, months, left: months, payment: pay, nextDue: addMonths(S.day, 1), start: S.day }, extra);
  S.loans.push(loan);
  if (!extra.noCash) cashMove(amount, 'finanziamenti', null, loanLabel(loan));
  const fee = Math.round(amount * (kind === 'mutuo' ? 0.01 : 0.005));
  if (fee) cashMove(-fee, 'commissioni', null, 'Istruttoria ' + loanLabel(loan));
  return loan;
}
function processLoans() {
  for (const l of S.loans) {
    if (S.day < l.nextDue) continue;
    const interest = l.balance * l.rate / 12;
    const princ = Math.min(l.balance, l.payment - interest);
    cashMove(-interest, 'interessi', l.biz || null, loanLabel(l));
    cashMove(-princ, 'rimborsi', null, loanLabel(l));
    l.balance -= princ; l.left--;
    l.nextDue = addMonths(l.nextDue, 1);
    if (S.cash < -S.overdraft.limit) { S.credit.lateDays += 5; log(`Rata del finanziamento (${loanLabel(l)}) pagata in sconfinamento: il rating peggiora.`, 'bad'); }
    if (l.left <= 0 || l.balance < 1) { l.balance = 0; log(`Hai estinto il finanziamento "${loanLabel(l)}".`, 'good'); unlockAch('prestito_estinto'); }
  }
  S.loans = S.loans.filter(l => l.balance > 0);
}
function loanLabel(l) {
  const bank = BANKS.find(b => b.id === l.bank);
  const k = { prestito: 'Prestito', mutuo: 'Mutuo', leasing: 'Leasing' }[l.kind];
  return `${k}${l.label ? ' ' + l.label : ''} - ${bank ? bank.n : ''}`;
}
function repayLoan(id) {
  const l = S.loans.find(x => x.id === id);
  if (!l) return false;
  const fee = l.balance * 0.01;
  if (S.cash < l.balance + fee) return false;
  cashMove(-l.balance, 'rimborsi', null, loanLabel(l)); cashMove(-fee, 'commissioni', null, 'Estinzione ' + loanLabel(l));
  S.loans = S.loans.filter(x => x !== l);
  log(`Hai estinto anticipatamente: ${loanLabel(l)}.`, 'good');
  unlockAch('prestito_estinto');
  return true;
}
function overdraftRate() { return S.eco.bce + 0.065 + ratingSpread(S.credit.score) * 0.6; }
function dailyBankInterest() {
  if (S.cash >= 0) return;
  const neg = -S.cash;
  const within = Math.min(neg, S.overdraft.limit), over = neg - within;
  const cost = within * overdraftRate() / 365 + over * 0.16 / 365;
  if (cost > 0) cashMove(-cost, 'interessi', null, 'Scoperto di conto');
}

// ---------- Scadenze ----------
function deadlines(days) {
  const out = [];
  const end = S.day + days;
  const staffCost = sum(Object.values(S.emps), e => empMonthlyCost(e) * 1.3);
  const rent = sum(S.biz, b => b.rent || 0);
  for (let d = S.day + 1; d <= end; d++) {
    const t = ymd(d);
    if (t.d === 1 && staffCost) out.push({ d, t: 'Stipendi', v: -staffCost });
    if (t.d === 1 && rent) out.push({ d, t: 'Affitti', v: -rent });
    if (t.d === 16 && hasIva()) out.push({ d, t: 'IVA', v: d - S.day <= 16 && S.tax.ivaDue ? -S.tax.ivaDue : null });
    if (t.m === 11 && t.d === 20 && staffCost) out.push({ d, t: 'Tredicesima', v: -staffCost / 1.3 * 0.9 });
    if ((t.m === 5 || t.m === 11) && t.d === 16 && S.props.length) out.push({ d, t: 'IMU', v: -sum(S.props, p => p.value * 0.0031) });
  }
  for (const l of S.loans) if (l.nextDue <= end) out.push({ d: l.nextDue, t: 'Rata ' + ({ prestito: 'prestito', mutuo: 'mutuo', leasing: 'leasing' }[l.kind]), v: -l.payment });
  for (const x of S.tax.due) if (x.due <= end) out.push({ d: x.due, t: 'Imposte', v: -x.amount });
  return out.sort((a, b) => a.d - b.d);
}
