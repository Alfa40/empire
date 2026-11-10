'use strict';
/* ============================================================
   EMPIRE - stato di gioco, creazione partita, salvataggi
   ============================================================ */

let S = null; // stato corrente

function uid(p) { S.nextId = (S.nextId || 1) + 1; return p + S.nextId.toString(36); }

// hash deterministico (per annunci immobiliari stabili nel mese)
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function hrng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- Persone ----------
function makePerson(role, cityId, bias = 0) {
  const female = rnd() < 0.5;
  const first = pick(female ? NAMES_F : NAMES_M);
  const last = pick(SURNAMES);
  const age = clamp(Math.round(gauss(33, 10)), 18, 63);
  let skill = clamp(Math.round(gauss(38 + (age - 18) * 0.7 + bias, 14)), 5, 95);
  const traits = [];
  const tk = Object.keys(TRAITS);
  if (chance(0.7)) traits.push(pick(tk));
  if (chance(0.25)) { const t2 = pick(tk); if (!traits.includes(t2)) traits.push(t2); }
  const city = CITY[cityId] || CITIES[0];
  const base = ROLES[role].wage * city.cost * (S ? S.eco.wageLevel : 1);
  const expected = Math.round(base * (0.82 + skill / 100 * 0.55) / 10) * 10;
  return {
    id: null, first, last, female, age, role, skill, traits, expected,
    morale: clamp(Math.round(gauss(68, 10)), 35, 95),
  };
}
function marketWage(role, cityId, skill) {
  const city = CITY[cityId] || CITIES[0];
  return Math.round(ROLES[role].wage * city.cost * S.eco.wageLevel * (0.82 + skill / 100 * 0.55) / 10) * 10;
}

function refreshCandidates(cityId, full) {
  const list = S.candidates[cityId] || [];
  const hrBonus = hqCount('hr') > 0 ? 10 : 0;
  let keep = full ? [] : list.filter(() => chance(0.45));
  // ogni ruolo ha sempre almeno 3 candidati (2 per i ruoli di sede)
  for (const r of Object.keys(ROLES)) {
    const min = ROLES[r].hq ? 2 : 3;
    let have = keep.filter(c => c.role === r).length;
    while (have < min) {
      const p = makePerson(r, cityId, (ROLES[r].hq ? 10 : 0) + hrBonus);
      p.id = uid('c'); p.city = cityId; keep.push(p); have++;
    }
  }
  if (keep.length > 90) keep = keep.slice(-90);
  S.candidates[cityId] = keep;
}

// ---------- Mondo: concorrenti ----------
function generateCompetitors() {
  S.comps = [];
  const groupCount = {};
  for (const city of CITIES) {
    for (const d of DISTRICTS) {
      for (const t of Object.values(BUSINESS_TYPES)) {
        if (t.mode !== 'shop') continue;
        let mean = d.foot * 1.5 * city.size;
        if (d.id === 'industriale') mean = t.id === 'officina' ? 1.5 : t.id === 'bar' ? 0.8 : 0.15;
        if (t.id === 'hotel') mean *= (city.tourism !== 'none' ? 1.2 : 0.6) * (d.id === 'centro' ? 1.4 : 0.6);
        const n = Math.max(0, Math.round(mean + gauss(0, 0.8)));
        for (let i = 0; i < n; i++) S.comps.push(makeCompetitor(t.id, city.id, d.id, groupCount));
      }
    }
  }
}
function makeCompetitor(type, city, district, groupCount) {
  const q = clamp(Math.round(gauss(55, 14)), 20, 92);
  const c = {
    id: uid('k'), type, city, district,
    name: pick(COMPETITOR_NAMES[type] || ['Concorrente']),
    q, pi: round2(clamp(gauss(1 + (q - 55) / 200, 0.08), 0.75, 1.4)),
    rep: clamp(Math.round(gauss(55, 12)), 20, 90), aw: clamp(Math.round(gauss(45, 15)), 10, 90),
    health: 1, owner: null, since: S.day, dist: DISTRICT[district].foot,
  };
  // appartenenza a un gruppo quotato
  const g = STOCKS.find(s => s.types && s.types.includes(type));
  if (g && groupCount && chance(0.16) && (groupCount[g.tk] || 0) < 24) {
    c.owner = g.tk; groupCount[g.tk] = (groupCount[g.tk] || 0) + 1;
    c.name = c.name + ' (' + g.n + ')';
  }
  return c;
}

// ---------- Borsa ----------
function initStocks() {
  S.stocks = STOCKS.map(s => ({ tk: s.tk, price: s.price, prev: s.price, hist: [s.price], shares: s.shares, eps: s.price * 0.07, divPaid: 0 }));
  S.holdings = {};
}

// ---------- Nuova partita ----------
function newGame(opts) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  RNG_STATE = seed | 0;
  const diff = DIFFICULTY[opts.difficulty] || DIFFICULTY.normale;
  const start = todayReal();
  S = {
    v: GAME_VERSION,
    meta: { player: opts.player || 'Imprenditore', company: opts.company || 'La mia impresa', difficulty: opts.difficulty || 'normale', legal: opts.legal || 'ditta', created: Date.now(), slot: opts.slot || 1, legalSince: start },
    day: start, startDay: start, nextId: 1,
    cash: diff.cash,
    eco: { index: 1, trend: 0, phase: 'Stabile', infl: 0.021, bce: 0.0215, priceLevel: 1, wageLevel: 1, energy: 1 },
    weather: {},
    biz: [], emps: {}, candidates: {}, orders: [],
    loans: [], overdraft: { limit: 0, bank: null, fee: 0 }, credit: { score: 40, missed: 0, overDays: 0, lateDays: 0 },
    props: [], market: { bought: {}, index: Object.fromEntries(CITIES.map(c => [c.id, 1])) },
    comps: [], stocks: [], holdings: {}, ipo: null,
    brands: [], research: { done: {}, active: null }, campaigns: [], effects: [],
    ledger: {}, bizLedger: {},
    tax: { ivaDebit: 0, ivaCredit: 0, ivaDue: 0, ivaCarry: 0, due: [], lossCarry: 0, yearRevenue: 0, prevYearRevenue: 0, warnings: 0 },
    assets: [], log: [], events: [], ach: {}, hist: [], report: null,
    tutorial: { active: !!opts.tutorial, step: 0 },
    franchise: { on: false, brand: null, affiliates: 0, fee: 0, entry: 0 },
    over: false, counters: { sold: 0, revenue: 0 }, nw: diff.cash, maxNw: diff.cash,
    settings: { autoMinor: true },
  };
  for (const c of CITIES) { S.weather[c.id] = rollWeather(c, ymd(start).m, null); refreshCandidates(c.id, true); }
  generateCompetitors();
  initStocks();
  if (LEGAL_FORMS[S.meta.legal].setup) S.cash -= LEGAL_FORMS[S.meta.legal].setup;
  log(`Benvenuto, ${S.meta.player}! Hai fondato "${S.meta.company}" con un capitale di ${eur(diff.cash)}.`, 'good');
  S.rng = RNG_STATE;
  return S;
}

// ---------- Utility di stato ----------
function getBiz(id) { return S.biz.find(b => b.id === id); }
function bizType(b) { return BUSINESS_TYPES[b.type]; }
function empsOf(bizId) { return Object.values(S.emps).filter(e => e.biz === bizId); }
function hqEmps() { return empsOf('hq'); }
function hqCount(role) { return S ? Object.values(S.emps).filter(e => e.biz === 'hq' && e.role === role && !e.leftDay).length : 0; }
function compsIn(city, district, type) { return S.comps.filter(c => c.city === city && c.district === district && c.type === type); }

function log(text, type = 'info', bizId = null) {
  S.log.unshift({ day: S.day, text, type, biz: bizId });
  if (S.log.length > 500) S.log.length = 500;
}
function addEffect(scope, key, mult, days, label) {
  S.effects.push({ scope, key, mult, until: S.day + days, label });
}
function effectMult(key, scopes) {
  let m = 1;
  for (const e of S.effects) if (e.key === key && e.until >= S.day && scopes.includes(e.scope)) m *= e.mult;
  return m;
}
function scopesFor(b) { return ['global', 'city:' + b.city, 'biz:' + b.id, 'type:' + b.type]; }
function hasResearch(id) { return !!S.research.done[id]; }

// ---------- Salvataggi ----------
const SAVE_PREFIX = 'empire_slot_';
const META_KEY = 'empire_meta';
const SLOTS = 5;
function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function storageSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function storageDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
function getMeta() {
  try { return Object.assign({ tutorialDone: false, lastSlot: null, theme: 'auto', font: 16 }, JSON.parse(storageGet(META_KEY) || '{}')); }
  catch (e) { return { tutorialDone: false, lastSlot: null, theme: 'auto', font: 16 }; }
}
function setMeta(patch) { const m = Object.assign(getMeta(), patch); storageSet(META_KEY, JSON.stringify(m)); return m; }
function saveGame(slot) {
  if (!S) return false;
  slot = slot || S.meta.slot;
  S.meta.slot = slot;
  S.rng = RNG_STATE;
  S.meta.saved = Date.now();
  let ok = storageSet(SAVE_PREFIX + slot, JSON.stringify(S));
  if (!ok) {
    // spazio esaurito: riduce lo storico e riprova
    S.log.length = Math.min(S.log.length, 120);
    S.hist = S.hist.slice(-120);
    for (const b of S.biz) { b.hist = b.hist.slice(-35); b.reviews = b.reviews.slice(0, 5); }
    for (const c in S.candidates) S.candidates[c] = S.candidates[c].slice(-40);
    ok = storageSet(SAVE_PREFIX + slot, JSON.stringify(S));
  }
  if (ok) setMeta({ lastSlot: slot });
  return ok;
}
function loadGame(slot) {
  const raw = storageGet(SAVE_PREFIX + slot);
  if (!raw) return false;
  try { S = migrate(JSON.parse(raw)); S.meta.slot = slot; RNG_STATE = S.rng | 0; ensureShifts(); setMeta({ lastSlot: slot }); return true; }
  catch (e) { console.error(e); return false; }
}
function slotInfo(slot) {
  const raw = storageGet(SAVE_PREFIX + slot);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    return { company: s.meta.company, player: s.meta.player, day: s.day, cash: s.cash, nw: s.nw, biz: s.biz.length, saved: s.meta.saved, over: s.over, difficulty: s.meta.difficulty };
  } catch (e) { return { corrupt: true }; }
}
function deleteSlot(slot) { storageDel(SAVE_PREFIX + slot); }
function exportSave() { S.rng = RNG_STATE; return JSON.stringify(S); }
function importSave(text, slot) {
  const s = JSON.parse(text);
  if (!s || !s.meta || !Array.isArray(s.biz)) throw new Error('File di salvataggio non valido');
  S = migrate(s); S.meta.slot = slot; RNG_STATE = S.rng | 0; ensureShifts(); saveGame(slot);
}
function migrate(s) {
  s.settings = s.settings || { autoMinor: true };
  s.effects = s.effects || [];
  s.franchise = s.franchise || { on: false, brand: null, affiliates: 0, fee: 0, entry: 0 };
  return s;
}
