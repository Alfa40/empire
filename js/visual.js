'use strict';
/* ============================================================
   EMPIRE - grafici semplici (SVG statici) e frasi che riassumono
   ============================================================ */

/** linea dell'andamento (es. utile giornaliero); verde se il totale è positivo */
function spark(vals, w = 120, h = 34) {
  if (!vals || vals.length < 2) return '';
  const mn = Math.min(0, ...vals), mx = Math.max(0, ...vals), rg = mx - mn || 1;
  const X = i => (i / (vals.length - 1) * (w - 4) + 2).toFixed(1), Y = v => (h - 3 - (v - mn) / rg * (h - 6)).toFixed(1);
  const pts = vals.map((v, i) => X(i) + ',' + Y(v)).join(' ');
  const tot = vals.reduce((a, c) => a + c, 0);
  return `<svg class="spark ${tot >= 0 ? 'up' : 'down'}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><line x1="0" x2="${w}" y1="${Y(0)}" y2="${Y(0)}" class="z"/><polyline points="${pts}"/><circle cx="${X(vals.length - 1)}" cy="${Y(vals[vals.length - 1])}" r="3"/></svg>`;
}
/** ciambella: segs = [{v, c (colore c-xxx)}] */
function donut(segs, size = 112, label = '') {
  const tot = segs.reduce((a, s) => a + Math.abs(s.v), 0); if (!tot) return '';
  const r = 15.9155; let off = 25;
  const arcs = segs.map(s => { const p = Math.abs(s.v) / tot * 100; const a = `<circle class="c-${s.c}" r="${r}" cx="21" cy="21" stroke-dasharray="${p.toFixed(2)} ${(100 - p).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>`; off -= p; return a; }).join('');
  return `<svg class="donut" viewBox="0 0 42 42" width="${size}" height="${size}" aria-hidden="true"><circle class="bg" r="${r}" cx="21" cy="21"/>${arcs}${label ? `<text x="21" y="23.2">${label}</text>` : ''}</svg>`;
}
/** utile giornaliero degli ultimi n giorni di un'attività */
function profitSeries(b, n = 30) { return b.hist.slice(-n).map(x => x.profit || 0); }

/** una frase semplice su come va un'attività */
function bizSentence(b) {
  const T = bizType(b);
  if (b.status === 'setup') {
    const miss = missingRequired(b).length, ne = empsOf(b.id).length;
    return `Stai allestendo il locale: ${miss ? 'mancano ' + plural(miss, 'attrezzatura', 'attrezzature') : 'attrezzature pronte'}${ne ? '' : ', nessun dipendente'}.`;
  }
  if (b.status === 'paused') return 'Attività sospesa: paghi affitto e stipendi senza incassare.';
  const days = S.day - (b.opened || b.created), r = recentDaily(30, b.id);
  let s = days < 21 ? 'Sei agli inizi: i clienti ti stanno scoprendo.' : r.profit >= 0 ? `Va bene: ${eur0(r.profit)} di utile negli ultimi 30 giorni.` : `È in perdita: ${eur0(r.profit)} negli ultimi 30 giorni.`;
  const top = adviseBiz(b).find(a => a.lv === 'r') || adviseBiz(b).find(a => a.lv === 'y');
  if (top) s += ` Da guardare: <b>${esc(top.t)}</b>.`;
  else if (days >= 21) s += ' Nessun problema in vista.';
  void T;
  return s;
}
const SECTOR_C = { 'Ristorazione': 'orange', 'Commercio': 'purple', 'Servizi': 'blue', 'Turismo': 'teal', 'Produzione': 'brown', 'Agricoltura': 'green' };
function bizColor(b) { return SECTOR_C[bizType(b).sector] || 'blue'; }
/** intestazione illustrata dell'attività: tenda a righe, icona grande, frase, andamento */
function bizHero(b) {
  const T = bizType(b), r = recentDaily(30, b.id);
  const sub = `${esc(CITY[b.city].name)} · ${esc(DISTRICT[b.district].name)}${T.mode === 'shop' && b.status !== 'setup' ? ' · ' + stars(b.rep) : ''}`;
  const ser = profitSeries(b);
  return `<section class="bhero c-${bizColor(b)}"><div class="awn" aria-hidden="true"></div>
    <div class="hrow"><span class="hico">${T.icon}</span><div class="hn"><h1>${esc(b.name)}</h1><small>${sub}</small></div></div>
    <p class="say">💬 ${bizSentence(b)}</p>
    ${ser.length >= 2 ? `<div class="hstat"><div><small>Utile 30 giorni</small><b class="${cls(r.profit)}">${eur0(r.profit)}</b></div>${spark(ser, 150, 38)}</div>` : ''}</section>`;
}
