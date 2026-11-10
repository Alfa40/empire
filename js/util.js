'use strict';
/* ============================================================
   EMPIRE - utilità generali (RNG, formattazione, date)
   ============================================================ */

// ---------- Generatore casuale con seme (mulberry32) ----------
let RNG_STATE = 123456789;
function rnd() {
  RNG_STATE = (RNG_STATE + 0x6D2B79F5) | 0;
  let t = RNG_STATE;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rint(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function rfloat(a, b) { return a + rnd() * (b - a); }
function chance(p) { return rnd() < p; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
function gauss(mean = 0, sd = 1) {
  let u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function weightedPick(list, wfn) {
  let tot = 0;
  const ws = list.map(x => { const w = Math.max(0, wfn(x)); tot += w; return w; });
  if (tot <= 0) return null;
  let r = rnd() * tot;
  for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
  return list[list.length - 1];
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

// ---------- Matematica ----------
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function round2(v) { return Math.round(v * 100) / 100; }
function sum(arr, fn) { let s = 0; for (const x of arr) s += fn ? fn(x) : x; return s; }
function avg(arr, fn) { return arr.length ? sum(arr, fn) / arr.length : 0; }
function lerp(a, b, t) { return a + (b - a) * t; }

// ---------- Formattazione ----------
const _fmtEur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const _fmtEur2 = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const _fmtNum = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 });
const _fmtNum1 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });
const _fmtNum2 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
function eur(v) { if (!isFinite(v)) v = 0; return Math.abs(v) < 100 && Math.round(v) !== v ? _fmtEur2.format(v) : _fmtEur.format(v); }
function eur0(v) { return _fmtEur.format(isFinite(v) ? v : 0); }
function eur2(v) { return _fmtEur2.format(isFinite(v) ? v : 0); }
function num(v) { return _fmtNum.format(isFinite(v) ? v : 0); }
function num1(v) { return _fmtNum1.format(isFinite(v) ? v : 0); }
function num2(v) { return _fmtNum2.format(isFinite(v) ? v : 0); }
function pct(v, dec = 0) { return (isFinite(v) ? (v * 100).toFixed(dec).replace('.', ',') : '0') + '%'; }
function qty(v) { return v > 0 && v < 0.1 ? v.toLocaleString('it-IT', { maximumFractionDigits: 3 }) : num2(v); }
function signEur(v) { return (v > 0 ? '+' : '') + eur(v); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function cls(v) { return v > 0.005 ? 'pos' : v < -0.005 ? 'neg' : ''; }
function stars(rep) {
  const s = clamp(1 + rep / 25, 1, 5);
  return num1(s) + ' ★';
}

// ---------- Date (giorni dall'epoca Unix, UTC) ----------
const DAY_MS = 86400000;
const WEEKDAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const MONTHS_CAP = MONTHS.map(m => m[0].toUpperCase() + m.slice(1));

function dayFromYMD(y, m, d) { return Math.round(Date.UTC(y, m, d) / DAY_MS); }
function dateOf(day) { return new Date(day * DAY_MS); }
function ymd(day) { const d = dateOf(day); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: (d.getUTCDay() + 6) % 7 }; }
function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }
function todayReal() { const n = new Date(); return dayFromYMD(n.getFullYear(), n.getMonth(), n.getDate()); }
function fmtDate(day) { const t = ymd(day); return `${t.d} ${MONTHS[t.m]} ${t.y}`; }
function fmtDateLong(day) { const t = ymd(day); return `${WEEKDAYS[t.wd]} ${t.d} ${MONTHS[t.m]} ${t.y}`; }
function fmtDateShort(day) { const t = ymd(day); return `${String(t.d).padStart(2, '0')}/${String(t.m + 1).padStart(2, '0')}/${t.y}`; }
function monthKey(day) { const t = ymd(day); return t.y * 100 + (t.m + 1); }
function monthLabel(key) { return MONTHS_CAP[(key % 100) - 1] + ' ' + Math.floor(key / 100); }
function prevMonthKey(key) { const y = Math.floor(key / 100), m = key % 100; return m === 1 ? (y - 1) * 100 + 12 : y * 100 + m - 1; }
function addMonths(day, n) {
  const t = ymd(day);
  let m = t.m + n, y = t.y + Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return dayFromYMD(y, m, Math.min(t.d, daysInMonth(y, m)));
}
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
