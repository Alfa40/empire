'use strict';
/* ============================================================
   EMPIRE - turni con orario, simulazione ora per ora,
   ottimizzazione automatica dei turni
   ============================================================ */

function round1(x) { return Math.round(x * 10) / 10; }
function startOn(e, wd) { return e.starts && wd != null && e.starts[wd] != null ? e.starts[wd] : (e.start || 0); }
function onShift(e, h, wd) { const s = startOn(e, wd); return h >= s && h < s + e.hours; }
function shiftLabel(e, wd) { const s = startOn(e, wd); return `${String(s).padStart(2, '0')}:00–${String(Math.min(24, s + e.hours)).padStart(2, '0')}:00`; }

/** minuti di lavoro per cliente richiesti da ogni ruolo */
function minutesPerCustomer(b, T, info, active) {
  const mp = {}, groups = {};
  for (const p of active) (groups[p.tpl] = groups[p.tpl] || []).push(p);
  for (const g in groups) {
    const t = T.products.find(x => x.id === g);
    if (t.eq && !(b.equip[t.eq] && !b.equip[t.eq].broken)) continue;
    const gm = t.mon ? t.mon[info.m] : 1;
    for (const p of groups[g]) mp[p.role] = (mp[p.role] || 0) + t.a * gm * p.min / groups[g].length;
  }
  if (T.front) mp[T.front] = (mp[T.front] || 0) + T.frontMin;
  return mp;
}

/** simula la giornata ora per ora: domanda, personale presente, clienti serviti */
function simHours(b, T, info, mods, staff, active, wantedTotal) {
  const prof = HOURLY[T.hourly || 'sempre'];
  const o = b.hours[0], c = b.hours[1];
  let wsum = 0; for (let h = o; h < c; h++) wsum += prof[h];
  const mp = minutesPerCustomer(b, T, info, active);
  // ruoli che preparano in anticipo (fornaio, gelatiere): capacità sull'intera giornata
  const prep = (T.prep || []).filter(r => mp[r]);
  const prepNeed = {};
  for (const r of prep) { prepNeed[r] = mp[r]; delete mp[r]; }
  const roles = Object.keys(mp);
  const totNeed = sum(roles, r => mp[r]) || 1;
  let physH = T.capPerHour * (b.m2 / T.size) * mods.phys;
  if (mods.dehors && info.m >= 3 && info.m <= 8) physH *= 1.3;
  const effs = new Map(staff.map(e => [e.id, empEff(e) * mods.speed]));
  const hours = []; let wanted = 0, served = 0;
  for (let h = o; h < c; h++) {
    const demH = wsum > 0 ? wantedTotal * prof[h] / wsum : 0;
    const present = staff.filter(e => onShift(e, h, info.wd));
    const mins = {}; let mgr = 0, idle = 0;
    for (const e of present) {
      const m = 60 * effs.get(e.id);
      if (e.role === 'manager') mgr += m;
      else if (e.role === 'pulizie') continue;
      else if (mp[e.role]) mins[e.role] = (mins[e.role] || 0) + m;
      else idle += m;
    }
    if (mgr) for (const r in mins) mins[r] *= 1.06;
    const helpers = mgr * 0.5 + idle * 0.3;
    let capS = Infinity, lim = null;
    for (const r of roles) {
      let a = (mins[r] || 0) + helpers * mp[r] / totNeed;
      if (!mins[r]) a += sum(Object.keys(mins), x => mins[x]) * 0.15;
      const cap = a / mp[r];
      if (cap < capS) { capS = cap; lim = r; }
    }
    if (!present.some(e => e.role !== 'pulizie')) { capS = 0; lim = 'nessuno'; }
    const s = Math.max(0, Math.min(demH, capS, physH));
    let why = null;
    if (s < demH - 0.05) why = physH <= capS ? 'locale' : lim;
    hours.push({ h, d: round1(demH), s: round1(s), n: present.length, w: present.map(e => e.id), lim: why });
    wanted += demH; served += s;
  }
  // limite giornaliero dei ruoli di preparazione
  for (const r of prep) {
    const pool = sum(staff.filter(e => e.role === r), e => e.hours * 60 * effs.get(e.id)) + sum(staff.filter(e => e.role === 'manager'), e => e.hours * 30 * effs.get(e.id));
    const capDay = pool / prepNeed[r];
    if (served > capDay) {
      const k = capDay / served;
      for (const x of hours) { const ns = round1(x.s * k); if (ns < x.s - 0.05) x.lim = x.lim || r; x.s = ns; }
      served = capDay;
    }
  }
  return { hours, wanted, served };
}

/** ripartizione oraria della produzione (solo per il resoconto) */
function prodHours(b, T, staff, units) {
  const out = [];
  const workers = staff.filter(e => e.role !== 'pulizie');
  let tot = 0;
  const lab = [];
  const wd = ymd(S.day).wd;
  for (let h = 0; h < 24; h++) { const p = workers.filter(e => onShift(e, h, wd)); const l = sum(p, e => (e.role === T.role ? 1 : 0.3) * empEff(e)); lab.push([h, p, l]); tot += l; }
  for (const [h, p, l] of lab) if (p.length) out.push({ h, p: round1(tot ? units * l / tot : 0), n: p.length, w: p.map(e => e.id) });
  return out;
}

// ---------- ottimizzazione dei turni ----------
function hourWeights(b) {
  const T = bizType(b);
  const w = new Array(24).fill(0);
  if (T.mode === 'production') { for (let h = 6; h < 20; h++) w[h] = h >= 8 && h < 17 ? 1 : 0.3; return w; }
  if (T.capMode === 'day') { for (let h = 0; h < 24; h++) w[h] = h >= 7 && h < 23 ? 1 : 0.15; return w; }
  const prof = HOURLY[T.hourly || 'sempre'];
  for (let h = b.hours[0]; h < b.hours[1]; h++) w[h] = Math.max(0.6, prof[h]);
  return w;
}
function bestStart(e, cover, w, all) {
  let best = 0, bs = -Infinity;
  const maxW = Math.max(...w, 1);
  for (let s = 0; s <= 24 - e.hours; s++) {
    let sc = 0;
    for (let h = s; h < s + e.hours; h++) sc += w[h] > 0 ? w[h] / (1 + (cover[h] || 0)) + (all && !all[h] ? maxW * 1.5 : 0) : -0.4;
    if (sc > bs + 1e-9) { bs = sc; best = s; }
  }
  return best;
}
function roleGroup(T, role) {
  if (role === 'manager' || role === 'pulizie') return role;
  return role;
}
/** sceglie l'orario d'inizio migliore per un nuovo dipendente */
function suggestStart(b, role, hours) {
  if (!b) return 9;
  const T = bizType(b);
  if (role === 'pulizie') return Math.max(0, Math.min(24 - hours, (b.hours[1] || 20) - hours));
  const cover = new Array(24).fill(0), all = new Array(24).fill(0);
  for (const e of empsOf(b.id)) for (let h = 0; h < 24; h++) if (onShift(e, h)) { if (e.role !== 'pulizie') all[h]++; if (roleGroup(T, e.role) === roleGroup(T, role)) cover[h]++; }
  return bestStart({ hours }, cover, hourWeights(b), all);
}
/** ottimizza giorni e orari di tutti i dipendenti di un'attività */
function autoShifts(b, keepDays) {
  const T = bizType(b);
  const emps = empsOf(b.id).slice().sort((a, c) => (a.role > c.role ? 1 : -1) || c.skill - a.skill);
  const openDays = [0, 1, 2, 3, 4, 5, 6].filter(d => b.days[d]);
  if (!openDays.length) return;
  const wk = T.wk || [1, 1, 1, 1, 1, 1, 1];
  const w = hourWeights(b);
  const maxW = Math.max(...w, 1);
  const mk = () => openDays.reduce((o, d) => (o[d] = new Array(24).fill(0), o), {});
  const covR = {}, all = mk();
  const grp = e => roleGroup(T, e.role);
  const apply = (e, k) => {
    const c = covR[grp(e)] || (covR[grp(e)] = mk());
    for (const d of openDays) if (e.wdays[d]) for (let h = 0; h < 24; h++) if (onShift(e, h, d)) { c[d][h] += k; if (e.role !== 'pulizie') all[d][h] += k; }
  };
  const value = (e, d, s) => {
    const c = covR[grp(e)] || (covR[grp(e)] = mk());
    let v = 0;
    for (let h = s; h < s + e.hours; h++) {
      if (w[h] <= 0) { v -= 0.4; continue; }
      v += wk[d] * w[h] / (1 + c[d][h]);
      if (!all[d][h]) v += maxW * 1.5;
    }
    return v;
  };
  const cleanStart = e => Math.max(0, Math.min(24 - e.hours, (T.mode === 'shop' && T.capMode !== 'day' ? b.hours[1] : 20) - e.hours));
  for (let pass = 0; pass < 3; pass++) {
    for (const e of emps) {
      if (pass > 0) apply(e, -1);
      const n = clamp(e.wdays.filter(Boolean).length || 5, 1, openDays.length);
      const starts = e.role === 'pulizie' ? [cleanStart(e)] : Array.from({ length: 25 - e.hours }, (_, i) => i);
      // per ogni giorno, l'orario migliore e il suo valore
      const per = {};
      for (const d of openDays) { let bs = null; for (const s of starts) { const v = value(e, d, s); if (!bs || v > bs.v + 1e-9) bs = { s, v }; } per[d] = bs; }
      const days = keepDays ? openDays.filter(d => e.wdays[d]) : openDays.slice().sort((a, c) => per[c].v - per[a].v).slice(0, n);
      if (!keepDays) e.wdays = [0, 1, 2, 3, 4, 5, 6].map(d => days.includes(d) ? 1 : 0);
      e.starts = [0, 1, 2, 3, 4, 5, 6].map(d => per[d] ? per[d].s : null);
      const freq = {}; for (const d of days) freq[per[d].s] = (freq[per[d].s] || 0) + 1;
      e.start = +Object.keys(freq).sort((a, c) => freq[c] - freq[a])[0] || starts[0];
      apply(e, 1);
    }
  }
}
/** assegna un orario a chi non ce l'ha (salvataggi vecchi, acquisizioni) */
function ensureShifts() {
  if (!S) return;
  for (const b of S.biz) if (empsOf(b.id).some(e => e.start == null)) autoShifts(b, true);
  for (const e of Object.values(S.emps)) if (e.start == null) e.start = 9;
}
/** copertura oraria per un giorno della settimana: persone in turno per ora (escluse pulizie) */
function hourCoverage(b, wd) {
  const cov = new Array(24).fill(0);
  for (const e of empsOf(b.id)) if (e.wdays[wd] && e.role !== 'pulizie') for (let h = 0; h < 24; h++) if (onShift(e, h, wd)) cov[h]++;
  return cov;
}
/** ore di apertura scoperte in un giorno */
function uncoveredHours(b, wd) {
  const T = bizType(b);
  if (T.mode !== 'shop' || T.capMode === 'day' || !b.days[wd]) return [];
  const cov = hourCoverage(b, wd);
  const out = [];
  for (let h = b.hours[0]; h < b.hours[1]; h++) if (!cov[h]) out.push(h);
  return out;
}
function hoursRanges(list) {
  if (!list.length) return '';
  const r = []; let a = list[0], p = list[0];
  for (let i = 1; i <= list.length; i++) {
    if (list[i] === p + 1) { p = list[i]; continue; }
    r.push(a === p ? `${a}:00` : `${a}:00–${p + 1}:00`);
    a = p = list[i];
  }
  return r.join(', ');
}

// ===================== Previsione per giorno della settimana =====================
// Stessa simulazione ora per ora della giornata vera, ma con i clienti attesi
// e le persone in turno quel giorno: dice in anticipo dove mancherà personale.
const _fcCache = new Map();
/** prossima data (da domani) che cade in quel giorno della settimana */
function nextDateOf(wd) { for (let k = 1; k <= 7; k++) if (ymd(S.day + k).wd === wd) return S.day + k; return S.day + 1; }
function shiftForecast(b, wd) {
  const T = bizType(b);
  if (T.mode !== 'shop' || T.capMode === 'day' || !b.days[wd] || b.status === 'setup') return null;
  const day = nextDateOf(wd);
  const emps = empsOf(b.id);
  const away = e => e.sickUntil > day || e.holidayUntil > day || e.trainUntil > day;
  const sig = [S.day, b.id, wd, b.hours.join('-'), b.products.map(p => p.on ? p.id + p.price : '').join(''), Object.keys(b.equip).map(k => k + b.equip[k].tier + (b.equip[k].broken ? 'x' : '')).join(''),
    emps.map(e => e.id + e.role + (e.wdays[wd] ? startOn(e, wd) + ':' + e.hours : '-') + (away(e) ? 'a' : '') + Math.round(e.skill / 5)).join(',')].join('|');
  if (_fcCache.has(sig)) return _fcCache.get(sig);
  const info = dayInfo(day), mods = bizMods(b);
  const active = b.products.filter(p => p.on);
  const staff = emps.filter(e => e.wdays[wd] && !away(e));
  const dem = computeDemand(b, info, mods, b.lastQ || 55, true);
  const hr = simHours(b, T, info, mods, staff, active, dem.wanted);
  // problemi di personale (il "locale pieno" non si risolve con i turni)
  const byLim = {};
  for (const x of hr.hours) if (x.lim && x.lim !== 'locale' && x.d - x.s >= 0.3) { const g = byLim[x.lim] || (byLim[x.lim] = { lim: x.lim, h: [], lost: 0 }); g.h.push(x.h); g.lost += x.d - x.s; }
  const probs = Object.values(byLim).filter(g => g.lost >= 1.5).sort((a, c) => c.lost - a.lost);
  const res = { day, hours: hr.hours, wanted: hr.wanted, served: hr.served, probs, lost: sum(probs, g => g.lost) };
  if (_fcCache.size > 300) _fcCache.clear();
  _fcCache.set(sig, res);
  return res;
}
/** giorno con problemi di personale: ore scoperte o clienti persi previsti */
function dayBad(b, wd) {
  if (uncoveredHours(b, wd).length) return true;
  const f = shiftForecast(b, wd);
  return !!(f && f.probs.length);
}
function probText(g) { return g.lim === 'nessuno' ? 'nessuno in turno' : 'serve un altro ' + ROLES[g.lim].name; }
