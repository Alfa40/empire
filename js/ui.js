'use strict';
/* ============================================================
   EMPIRE - interfaccia: struttura, componenti, finestre a comparsa
   ============================================================ */

const UI = {
  view: 'dash', biz: null, tab: 'riepilogo', modal: null, wiz: null,
  fin: { tab: 'ce', biz: '' }, mk: { city: null, type: 'bar' }, re: { city: null }, cal: { mk: null },
  logf: 'all', hire: { city: null, role: '', target: null }, start: { mode: 'menu' }, st: { filter: '' }, tday: null,
};
const ACT = {}, CHG = {};

// ---------- utilità DOM ----------
function $(s) { return document.querySelector(s); }
function toast(msg, kind) {
  const box = $('#toast'); if (!box) return;
  const d = document.createElement('div'); d.className = kind || ''; d.textContent = msg;
  box.appendChild(d);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => d.remove(), kind === 'err' ? 4000 : 2400);
}
let _saveTimer = null;
function saveSoon() { clearTimeout(_saveTimer); _saveTimer = setTimeout(() => { if (S) saveGame(); }, 400); }
function commit(msg) { saveSoon(); render(); if (msg) toast(msg, 'ok'); }
function res(r, okMsg) {
  if (r && r.err) { toast(r.err, 'err'); return false; }
  commit(typeof okMsg === 'function' ? okMsg(r) : okMsg);
  return true;
}

// ---------- componenti ----------
function hb(k) { return HELP[k] ? `<button class="hq" data-a="help" data-k="${k}" aria-label="Spiegazione: ${esc(HELP[k][0])}" title="Spiegazione">?</button>` : ''; }
function kpi(label, value, sub, cl, help) {
  const tap = help && HELP[help];
  const tag = tap ? 'button' : 'div';
  return `<${tag} class="kpi${tap ? ' tap' : ''}"${tap ? ` data-a="help" data-k="${help}" aria-label="${esc(label)}: spiegazione"` : ''}><small>${esc(label)}</small><b class="${cl || ''}">${value}</b>${sub ? `<span class="sub">${sub}</span>` : ''}</${tag}>`;
}
function badge(t, c) { return `<span class="badge ${c || ''}">${esc(t)}</span>`; }
function bar(v, max = 100, c) { const p = clamp(v / max * 100, 0, 100); const cc = c || (p >= 66 ? 'g' : p >= 40 ? '' : p >= 25 ? 'y' : 'r'); return `<span class="bar ${cc}"><i style="width:${p.toFixed(0)}%"></i></span>`; }
function meter(served, demand, max) {
  const m = Math.max(1, max);
  const s = clamp(served / m * 100, 0, 100), l = clamp((demand - served) / m * 100, 0, 100 - s);
  return `<span class="meter"><i class="s" style="width:${s.toFixed(1)}%"></i><i class="l" style="width:${l.toFixed(1)}%"></i></span>`;
}
function attrs(data) { return Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join(''); }
function btn(label, act, data = {}, cl = '', dis = false, title = '') {
  return `<button class="btn ${cl}" data-a="${act}"${attrs(data)}${dis ? ' disabled' : ''}${title ? ` title="${esc(title)}"` : ''}>${label}</button>`;
}
function select(chg, options, value, data = {}, extra = '') {
  return `<select data-c="${chg}"${attrs(data)} ${extra}>${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
}
function numIn(chg, value, data = {}, extra = '') { return `<input type="number" inputmode="decimal" data-c="${chg}"${attrs(data)} value="${esc(value)}" ${extra}>`; }
function stepper(act, data, value, label) { return `<span class="stepper">${btn('−', act, Object.assign({ d: -1 }, data), 'sm')}<b>${value}</b>${btn('+', act, Object.assign({ d: 1 }, data), 'sm')}${label ? `<small>${label}</small>` : ''}</span>`; }
function dayToggles(act, days, data = {}) {
  return `<span class="days">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((w, i) => `<button data-a="${act}" data-i="${i}"${attrs(data)} class="${days[i] ? 'on' : ''}" title="${WEEKDAYS[i]}" aria-pressed="${days[i] ? 'true' : 'false'}">${w}</button>`).join('')}</span>`;
}
function table(headers, rows, opts = {}) {
  const labels = headers.map(h => { const t = Array.isArray(h) ? h[0] : h; return String(t).replace(/<[^>]+>/g, '').replace(/\?$/, ''); });
  const body = rows.length ? rows.map(r => { let i = 0; return r.replace(/<td class="/g, () => `<td data-label="${esc(labels[i++] || '')}" class="`); }).join('') : `<tr class="empty"><td colspan="${headers.length}" class="muted">${opts.empty || '—'}</td></tr>`;
  return `<div class="tw"><table class="rt ${opts.cls || ''}"><thead><tr>${headers.map(h => { const [t, c] = Array.isArray(h) ? h : [h, '']; return `<th class="${c || ''}">${t}</th>`; }).join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function tr(cells, cl = '') { return `<tr class="${cl}">${cells.map(c => { const [t, k] = Array.isArray(c) ? c : [c, '']; return `<td class="${k}"><span class="v">${t}</span></td>`; }).join('')}</tr>`; }
function moneyCell(v) { return [`<span class="${cls(v)}">${eur(v)}</span>`, 'n']; }
function plural(n, s, p) { return `${num(n)} ${n === 1 ? s : p}`; }
function skillBadge(s) { return `${bar(s)} <span class="nowrap">${Math.round(s)}</span>`; }
const SEC_COLOR = {
  consulente: 'red', utile: 'green', ce: 'green', valore: 'green', domanda: 'green', quota: 'green', stato: 'green',
  sp: 'blue', flussi: 'blue', imposte: 'blue', iva: 'blue', forma: 'blue', prestito: 'blue', fido: 'blue', mutuo: 'blue', scadenze: 'blue', cassa: 'blue',
  turni: 'orange', ruoli: 'orange', giornata: 'orange', copertura: 'orange', candidati: 'orange', sede: 'orange', auto: 'orange', stipendio: 'orange',
  riordino: 'teal', ordine: 'teal', fornitori: 'teal', produzione: 'teal', ingrosso: 'teal', filiera: 'teal', attrezzature: 'teal', miglioramenti: 'teal',
  prezzo_rif: 'purple', saldi: 'purple', budget: 'purple', campagne: 'purple', marchio: 'purple', franchising: 'purple', notorieta: 'purple',
  reputazione: 'yellow', qualita: 'yellow', traguardi: 'yellow', ricerca: 'yellow',
  immobili: 'brown', borsa: 'brown', ipo: 'brown', mercato: 'brown', economia: 'brown',
  orari: 'gray', ferie: 'gray', assicurazione: 'gray', registro: 'gray', salvataggi: 'gray', data: 'gray',
};
function secKey(title) { return (UI.view === 'biz' ? 'b:' + UI.tab + ':' : UI.view + ':') + String(title).replace(/<[^>]+>/g, '').replace(/[·0-9].*$/, '').trim(); }
/** sezione pieghevole e colorata: chiusa mostra solo titolo e riassunto */
function sec(title, help, body, right, opts = {}) {
  const k = opts.k || secKey(title);
  const st = getMeta().secs || {};
  const open = st[k] != null ? st[k] : !opts.closed;
  const c = opts.c || SEC_COLOR[help] || 'blue';
  return `<section class="panel col c-${c} ${open ? 'open' : ''}"><div class="ph${open && right ? ' wrap' : ''}"><button class="ph-t" data-a="secToggle" data-k="${esc(k)}" data-o="${open ? 1 : 0}" aria-expanded="${open}"><span class="cdot"></span><h3>${title}</h3>${!open && opts.sum != null && opts.sum !== '' ? `<span class="sum">${opts.sum}</span>` : ''}<span class="chev">${open ? '▾' : '▸'}</span></button>${open && (help || right) ? `<div class="row ph-a">${right || ''}${help ? hb(help) : ''}</div>` : ''}</div>${open ? `<div class="pb">${body}</div>` : ''}</section>`;
}
ACT.secToggle = (d) => { const s = getMeta().secs || {}; s[d.k] = d.o !== '1'; setMeta({ secs: s }); render(); };
function advList(list, max) {
  if (!list.length) return `<div class="adv-ok">🎉 Tutto in ordine</div>`;
  const shown = max ? list.slice(0, max) : list;
  return `<ul class="adv-list">${shown.map(a => `<li class="lv-${a.lv}"><span class="dot">${a.lv === 'r' ? '🚨' : a.lv === 'y' ? '⚠️' : '💡'}</span><div class="tx">${a.biz && S.biz.length > 1 ? `<small>${esc((getBiz(a.biz) || {}).name || '')}</small>` : ''}<span>${esc(a.t)}</span></div><div class="ac">${a.acts.map(([l, act, d], i) => btn(esc(l), act, d, 'sm ' + (i === 0 ? 'pri' : ''))).join('')}</div></li>`).join('')}</ul>${max && list.length > max ? `<div class="more">${btn(`+${list.length - max} altri`, 'advAll', {}, 'sm ghost')}</div>` : ''}`;
}

// ---------- struttura ----------
const NAV = [
  ['dash', '🏠', 'Home'], ['bizlist', '🏪', 'Attività'], ['staff', '👥', 'Personale'], ['hq', '🏢', 'Sede'], null,
  ['finance', '💶', 'Finanza'], ['bank', '🏦', 'Banca'], ['realestate', '🏘️', 'Immobili'], ['stocks', '📈', 'Borsa'], null,
  ['market', '🧭', 'Mercato'], ['marketing', '📣', 'Marketing'], ['research', '🔬', 'Ricerca'], null,
  ['calendar', '📅', 'Calendario'], ['log', '📜', 'Registro'], ['ach', '🏆', 'Traguardi'], ['settings', '⚙️', 'Impostazioni'],
];
const MOBILE_NAV = ['dash', 'bizlist', 'staff', 'finance'];
function navAllowed(id, tut) { return !tut || tut.nav.includes(id); }

function render() {
  const app = $('#app');
  applyTheme();
  if (!S) { app.innerHTML = viewStart(); renderModal(); return; }
  tutorialCheck();
  progressCheck(); progressPopup();
  const tut = tutorialState();
  const cur = UI.view === 'biz' ? 'bizlist' : UI.view;
  const navHtml = NAV.filter(n => !n || viewOk(n[0])).map(n => {
    if (!n) return '<div class="sep"></div>';
    const [id, ic, label] = n;
    let cnt = '';
    if (id === 'bizlist') cnt = `<span class="cnt">${S.biz.length}</span>`;
    if (id === 'staff') cnt = `<span class="cnt">${Object.keys(S.emps).length}</span>`;
    return `<button data-a="nav" data-v="${id}" class="${cur === id ? 'on' : ''} ${tut && tut.hl === id ? 'hl' : ''}"${navAllowed(id, tut) ? '' : ' disabled'}><span class="ic">${ic}</span><span class="lb">${label}</span>${cnt}</button>`;
  }).join('') + recentSide(tut);
  const mob = MOBILE_NAV.map(id => { const n = NAV.find(x => x && x[0] === id); return `<button data-a="nav" data-v="${id}" class="${cur === id ? 'on' : ''} ${tut && tut.hl === id ? 'hl' : ''}"${navAllowed(id, tut) ? '' : ' disabled'}><span class="ic">${n[1]}</span><span>${n[2]}</span></button>`; }).join('')
    + `<button data-a="menu" class="${MOBILE_NAV.includes(cur) ? '' : 'on'} ${tut && tut.hl && !MOBILE_NAV.includes(tut.hl) && tut.hl !== 'adv' ? 'hl' : ''}"><span class="ic">🧩</span><span>Menu</span></button>`;
  const view = (VIEWS[UI.view] || VIEWS.dash)();
  trackRecent();
  app.innerHTML = `${topBar(tut)}<div class="layout"><nav class="side">${navHtml}</nav><main>${view}</main></div><nav class="bottom">${mob}</nav>${tut ? tutorialBox(tut) : ''}`;
  renderModal();
}

function topBar(tut) {
  const info = dayInfo(S.day);
  const city = S.biz[0] ? S.biz[0].city : 'milano';
  const w = S.weather[city];
  const pl = monthPL(monthKey(S.day));
  const can = (!tut || tut.adv) && !S.over;
  const t = ymd(S.day);
  const chips = [info.holiday ? `<span class="chip r">${esc(info.holiday)}</span>` : '', ...info.labels.slice(0, 2).map(l => `<span class="chip">${esc(l)}</span>`)].join('');
  const pending = S.events.length;
  const special = info.holiday || info.labels[0];
  void chips;
  return `<header class="top">
    <button class="when" data-a="calDay" data-d="${S.day}" aria-label="Dettagli del giorno"><b>${WEEKDAYS_SHORT[t.wd]} ${t.d} ${MONTHS[t.m].slice(0, 3)} <span class="wx">${WEATHER[w.type].icon} ${w.temp}°</span></b>${special ? `<span class="chip ${info.holiday ? 'r' : 'y'}">${esc(special)}</span>` : ''}</button>
    <button class="money ${adviseGlobal().some(a => a.lv === 'r') ? 'st-bad' : ''}" data-a="moneySheet" aria-label="Situazione finanziaria">
      <span><small>Cassa</small><b class="${S.cash < 0 ? 'neg' : ''}">${eur0(S.cash)}</b></span>
      <span><small>Mese</small><b class="${cls(pl.profit)}">${eur0(pl.profit)}</b></span>
      <span class="dsk"><small>Patrimonio</small><b>${eur0(S.nw)}</b></span>
    </button>
    <div class="adv">
      ${pending ? btn(`⚑ ${pending}`, 'showEvent', {}, 'danger', false, 'Decisioni in attesa') : ''}
      ${btn('▶', 'adv', { n: 1 }, 'pri big play' + (tut && tut.hl === 'adv' ? ' hl' : ''), !can, 'Giorno successivo (N)')}
      ${btn('»', 'advMenu', {}, 'big', !can || (tut && tut.adv1only), 'Avanza più giorni')}
    </div>
  </header>`;
}

function applyTheme() {
  const m = getMeta();
  let theme = m.theme;
  if (theme === 'auto') theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.pal = m.pal || 'pesca';
  if (document.body) document.body.dataset.view = S ? UI.view : 'dash';
  document.documentElement.style.fontSize = (m.font || 16) + 'px';
  document.documentElement.style.setProperty('--top-extra', (m.topPad || 0) + 'px');
}

// ---------- finestre a comparsa ----------
const MODALS = {};
function openModal(kind, data) { UI.modal = Object.assign({ kind }, data || {}); render(); }
function closeModal() { UI.modal = UI.modal && UI.modal.back ? UI.modal.back : null; render(); }
ACT.closeModal = () => closeModal();
ACT.bgClose = (d, el, ev) => { if (ev && ev.target === el && UI.modal && UI.modal.kind !== 'event') closeModal(); };
function sheet(title, body, foot, opts = {}) {
  return `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title.replace(/<[^>]+>/g, ''))}">
    <div class="mh"><h2>${title}${opts.help ? hb(opts.help) : ''}</h2>${opts.noClose ? '' : btn('✕', 'closeModal', {}, 'ghost x', false, 'Chiudi')}</div>
    <div class="mb">${body}</div>${foot ? `<div class="foot">${foot}</div>` : ''}</div>`;
}
function renderModal() {
  const root = $('#modal');
  let html = '', closable = true;
  if (S && S.over && !(UI.modal && UI.modal.kind === 'saves')) { html = modalGameOver(); closable = false; }
  else if (UI.modal && UI.modal.kind === 'help') html = MODALS.help(UI.modal);
  else if (UI.modal && MODALS[UI.modal.kind]) html = MODALS[UI.modal.kind](UI.modal);
  else if (S && S.events.length && !tutorialBlocksEvents()) { html = modalEvent(S.events[0]); closable = false; }
  root.innerHTML = html ? `<div class="modal-bg"${closable ? ' data-a="bgClose"' : ''}>${html}</div>` : '';
}
MODALS.help = (m) => {
  const h = HELP[m.k]; if (!h) return '';
  return sheet(esc(h[0]), `<ul class="help">${h[1].map(x => `<li>${esc(x)}</li>`).join('')}</ul>`, btn('Ho capito', 'closeModal', {}, 'pri'));
};
ACT.help = (d) => { const back = UI.modal && UI.modal.kind !== 'help' ? UI.modal : null; UI.modal = { kind: 'help', k: d.k, back }; render(); };
function modalEvent(ev) {
  const b = ev.biz && ev.biz !== 'hq' ? getBiz(ev.biz) : null;
  return `<div class="modal" role="dialog" aria-modal="true">
    <div class="mh"><h2>${esc(ev.title)}</h2>${S.events.length > 1 ? badge(`+${S.events.length - 1}`, 'y') : ''}</div>
    <div class="mb"><small class="muted">${fmtDateShort(ev.day)}${b ? ' · ' + esc(b.name) : ''}</small><p>${esc(ev.text)}</p></div>
    <div class="opts">${ev.opts.map((o, i) => btn(esc(o), 'evChoose', { i }, i === 0 ? 'pri' : '')).join('')}</div>
  </div>`;
}
ACT.evChoose = (d) => { const ev = S.events[0]; if (!ev) return; const r = resolveEvent(ev, +d.i); if (r) toast(r); commit(); };
ACT.showEvent = () => { UI.modal = null; render(); };
function modalGameOver() {
  return sheet('Fallimento', `<p>${esc(S.meta.company)} è fallita dopo ${plural(S.day - S.startDay, 'giorno', 'giorni')}.</p>
    <div class="kpis">${kpi('Patrimonio max', eur(S.maxNw))}${kpi('Attività', S.biz.length)}${kpi('Traguardi', Object.keys(S.ach).length + '/' + ACHIEVEMENTS.length)}</div>`,
    btn('Salvataggi', 'openSaves') + btn('Menu principale', 'quitMenu', {}, 'pri'), { noClose: true });
}
ACT.openSaves = () => openModal('saves');
MODALS.saves = () => sheet('Salvataggi', savesPanel(true), '', { help: 'salvataggi' });
function confirmBox(title, text, act, data, okLabel = 'Conferma', danger) { openModal('confirm', { title, text, act, data, okLabel, danger }); }
MODALS.confirm = (m) => sheet(esc(m.title), `<p>${m.text}</p>`, btn('Annulla', 'closeModal') + btn(esc(m.okLabel), m.act, m.data || {}, m.danger ? 'danger' : 'pri'));

// situazione finanziaria (tocco sulla cassa)
ACT.moneySheet = () => openModal('money');
MODALS.money = () => {
  const pl = monthPL(monthKey(S.day)), r30 = recentDaily(30);
  return sheet('Situazione', `<div class="kpis grid2">${kpi('Cassa', eur0(S.cash), S.overdraft.limit ? 'fido ' + eur0(S.overdraft.limit) : '', S.cash < 0 ? 'neg' : '', 'cassa')}${kpi('Patrimonio', eur0(S.nw), '', '', 'patrimonio')}${kpi('Utile mese', eur0(pl.profit), 'ricavi ' + eur0(pl.rev), cls(pl.profit), 'utile')}${kpi('Utile 30 gg', eur0(r30.profit), '', cls(r30.profit), 'utile')}${kpi('Rating', ratingOf(S.credit.score), '', '', 'rating')}${kpi('Debiti', eur0(sum(S.loans, l => l.balance)), '', '', 'prestito')}</div>`, btn('Finanza', 'nav', { v: 'finance' }) + btn('Banca', 'nav', { v: 'bank' }, 'pri'));
};
// menu completo (telefono)
ACT.menu = () => openModal('menu');
MODALS.menu = () => {
  const tut = tutorialState();
  return sheet('Menu', `${tut ? '' : recentRow()}<div class="menu-grid">${S && S.prog && !S.prog.all ? '<button data-a="path"><span class="ic">🗺️</span>Percorso</button>' : ''}${NAV.filter(n => n && viewOk(n[0])).map(([id, ic, l]) => `<button data-a="nav" data-v="${id}"${navAllowed(id, tut) ? '' : ' disabled'} class="${UI.view === id ? 'on' : ''} ${tut && tut.hl === id ? 'hl' : ''}"><span class="ic">${ic}</span>${l}</button>`).join('')}</div>`);
};
// avanzamento
ACT.advMenu = () => openModal('adv');
MODALS.adv = () => {
  const dl = deadlines(7).filter(x => x.v);
  return sheet('Avanza', `<div class="menu-grid three">
      <button data-a="adv" data-n="1"><span class="ic">☀️</span>1 giorno</button>
      <button data-a="adv" data-n="7"><span class="ic">🗓️</span>7 giorni</button>
      <button data-a="adv" data-n="m"><span class="ic">📆</span>Fine mese</button></div>
    ${dl.length ? `<h4 class="mt">Scadenze in 7 gg${hb('scadenze')}</h4>${table(['Data', 'Voce', ['€', 'n']], dl.map(x => tr([fmtDateShort(x.d), esc(x.t), [eur(x.v), 'n']])))}` : ''}`, '', { help: 'avanza' });
};

// ---------- navigazione ----------
ACT.nav = (d) => { if (!viewOk(d.v)) { lockedMsg(VIEW_FEAT[d.v]); return; } UI.view = d.v; UI.modal = null; if (d.v !== 'biz') UI.biz = null; render(); window.scrollTo(0, 0); };
ACT.openBiz = (d) => { UI.modal = null; UI.view = 'biz'; UI.biz = d.id; UI.tab = d.tab || (UI.biz === d.id ? UI.tab : 'riepilogo') || 'riepilogo'; render(); window.scrollTo(0, 0); };
ACT.tab = (d) => { UI.tab = d.t; render(); };
ACT.finTab = (d) => { UI.fin.tab = d.t; render(); };
/** funzione non ancora sbloccata: dice quale traguardo serve */
function lockedMsg(f) { const m = MILESTONES.find(x => x.id === FEATURE_OF[f]); toast(m ? `Si sblocca con il traguardo "${m.n}"` : 'Non ancora disponibile', 'err'); }

// ---------- avanzamento ----------
function daysToMonthEnd() { const t = ymd(S.day); return daysInMonth(t.y, t.m) - t.d + 1; }
ACT.adv = (d) => {
  if (S.over) return;
  if (S.events.length) { UI.modal = null; render(); return; }
  UI.modal = null;
  const n = d.n === 'm' ? daysToMonthEnd() : +d.n;
  const done = advanceDays(n);
  saveGame();
  render();
  if (done > 1) { const r = recentDaily(done); toast(`${done} giorni · utile ${eur(r.profit)}${done < n ? ' · fermato' : ''}`); }
};

// ---------- azioni del consulente ----------
ACT.advAll = () => openModal('advAll');
MODALS.advAll = () => sheet('Consulente', advList(adviseAll()), '', { help: 'consulente', wide: true });
ACT.advShifts = (d) => { const b = getBiz(d.b); autoShifts(b); UI.modal = null; commit('Turni ottimizzati'); };
ACT.advOrder = (d) => { const b = getBiz(d.b); const r = orderDays(b, 3); if (r.err) { toast(r.err, 'err'); return; } UI.modal = null; commit(r.n ? `${r.n} ordini · ${eur(r.tot)}` : 'Scorte già sufficienti'); };
ACT.advRestock = (d) => { const b = getBiz(d.b); restockAll(b); UI.modal = null; commit('Riordino automatico attivo'); };
ACT.advPrices = (d) => { const b = getBiz(d.b); alignPrices(b); UI.modal = null; commit('Prezzi allineati'); };
ACT.advRepair = (d) => { const b = getBiz(d.b); UI.modal = null; res(repairEquipment(b, d.c), r => `Riparata · ${eur(r.cost * 1.22)}`); };

// ---------- barra laterale: schede aperte di recente ----------
function curKey() { return UI.view === 'biz' ? 'biz:' + UI.biz : 'v:' + UI.view; }
function trackRecent() {
  if (!S) return;
  const R = S.recent || (S.recent = []);
  const k = curKey();
  let label, ic;
  if (UI.view === 'biz') { const b = getBiz(UI.biz); if (!b) return; label = b.name; ic = bizType(b).icon; }
  else { const n = NAV.find(x => x && x[0] === UI.view); if (!n) return; label = n[2]; ic = n[1]; }
  const i = R.findIndex(x => x.k === k);
  const item = { k, v: UI.view, id: UI.biz, tab: UI.tab, label, ic };
  if (i >= 0) R[i] = item; else { R.unshift(item); if (R.length > 7) R.pop(); }
  // rimuove schede di attività che non esistono più
  S.recent = R.filter(x => x.v !== 'biz' || getBiz(x.id));
}
/** schede recenti: elenco nel menu laterale (computer) */
function recentSide(tut) {
  const R = (S.recent || []).filter(x => x.k !== curKey());
  if (tut || !R.length) return '';
  return `<div class="sep"></div><div class="side-h">Recenti</div>${R.slice(0, 5).map(x => `<button data-a="recentGo" data-k="${esc(x.k)}"><span class="ic">${x.ic}</span><span class="lb">${esc(x.label)}</span></button>`).join('')}`;
}
/** schede recenti: riga di pulsanti in cima al Menu (telefono) */
function recentRow() {
  const R = (S.recent || []).filter(x => x.k !== curKey());
  if (!R.length) return '';
  return `<h4>Recenti</h4><div class="recent-row">${R.slice(0, 6).map(x => `<button class="pill c-gray" data-a="recentGo" data-k="${esc(x.k)}"><b>${x.ic} ${esc(x.label)}</b></button>`).join('')}</div><h4>Sezioni</h4>`;
}
function railHtml(tut) {
  const R = (S.recent || []);
  if (tut || R.length < 2) return '';
  const open = !!getMeta().rail;
  const k = curKey();
  if (!open) return `<aside class="rail"><button class="rail-handle" data-a="railToggle" aria-label="Schede aperte" title="Schede aperte">◂<span>${R.length}</span></button></aside>`;
  return `<aside class="rail open"><div class="rail-head"><small>Schede</small>${btn('▸', 'railToggle', {}, 'sm ghost', false, 'Nascondi')}</div>
    ${R.map(x => `<div class="rail-item ${x.k === k ? 'on' : ''}"><button data-a="recentGo" data-k="${esc(x.k)}" title="${esc(x.label)}"><span class="ic">${esc(x.ic)}</span><span class="lb">${esc(x.label)}</span></button><button class="x" data-a="recentDel" data-k="${esc(x.k)}" aria-label="Chiudi scheda">✕</button></div>`).join('')}</aside>`;
}
ACT.railToggle = () => { setMeta({ rail: !getMeta().rail }); render(); };
ACT.recentGo = (d) => {
  const x = (S.recent || []).find(r => r.k === d.k); if (!x) return;
  UI.modal = null; UI.view = x.v;
  if (x.v === 'biz') { UI.biz = x.id; UI.tab = x.tab || 'riepilogo'; } else UI.biz = null;
  render(); window.scrollTo(0, 0);
};
ACT.recentDel = (d) => { S.recent = (S.recent || []).filter(r => r.k !== d.k); render(); };
