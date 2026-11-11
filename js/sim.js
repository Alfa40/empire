'use strict';
/* ============================================================
   EMPIRE - simulazione giornaliera
   ============================================================ */

function hoursCoverage(T, hours) {
  const pr = HOURLY[T.hourly || 'sempre']; let tot = 0, cov = 0;
  for (let h = 0; h < 24; h++) { tot += pr[h]; if (h >= hours[0] && h < hours[1]) cov += pr[h]; }
  return tot ? cov / tot : 1;
}
function openHours(b) { return Math.max(0, b.hours[1] - b.hours[0]); }

function closedReason(b, info) {
  if (b.status === 'setup') return 'In allestimento';
  if (b.status === 'paused') return 'Chiusa temporaneamente';
  if (b.closedUntil && b.closedUntil >= S.day) return b.closedReason || 'Chiusa';
  if (!b.days[info.wd]) return 'Giorno di chiusura settimanale';
  if (b.closures.some(c => S.day >= c.from && S.day <= c.to)) return 'Chiusura per ferie';
  if (info.holiday && b.closeHolidays) return 'Chiusa per festività';
  return null;
}

function seasonalMult(T, b, info) {
  const city = CITY[b.city];
  let m = T.mon[info.m] * T.wk[info.wd];
  const tour = TOURISM[city.tourism][info.m];
  m *= 1 + (tour - 1) * (T.tourism != null ? T.tourism : 0.3);
  if (info.holiday && info.wd !== 6) m *= T.holiday;
  for (const k in info.sp) if (T.sp[k]) m *= T.sp[k];
  if (b.district === 'universita' && info.m === 7) m *= 0.55;
  return m;
}
function weatherMult(T, b, mods) {
  const w = S.weather[b.city];
  let x = (T.weather && T.weather[w.type]) || 1;
  if (w.type === 'caldo' && mods.heatProof && x < 1) x = 1;
  return x;
}
function attract(rep, q, pi, aw) {
  return (0.5 + rep / 100) * (0.6 + q / 100 * 0.8) * Math.pow(1 / clamp(pi, 0.3, 4), 1.6) * (0.7 + aw / 100 * 0.6);
}
function brandAw(b) { const br = b.brand && S.brands.find(x => x.id === b.brand); return br ? br.aw : 0; }
function effAw(b) { return Math.max(b.aw, brandAw(b) * 0.85); }

/** qualità di ogni prodotto attivo */
function productQuality(b, p, mods, roleSkill) {
  let matQ = 0, w = 0;
  for (const m in p.r) {
    const c = p.r[m] * MATERIALS[m].price;
    const sq = stockQuality(b, m) || 55;
    matQ += sq * c; w += c;
  }
  matQ = w > 0 ? matQ / w : 60;
  const t = tplOf(b, p);
  const richness = recipeCost(t.r) > 0 ? clamp(recipeCost(p.r) / recipeCost(t.r), 0.5, 2.5) : 1;
  const sk = roleSkill[p.role] != null ? roleSkill[p.role] : 35;
  return clamp(Math.round(matQ * 0.5 + sk * 0.3 + mods.quality + 10 + (richness - 1) * 18), 1, 100);
}
function priceIndexOf(b, info) {
  const T = bizType(b);
  let tw = 0, ti = 0;
  for (const p of b.products) {
    if (!p.on) continue;
    const t = tplOf(b, p);
    const price = effPrice(b, p, info);
    ti += t.a * price / refPrice(b, p); tw += t.a;
  }
  return tw ? ti / tw : 1;
}
function effPrice(b, p, info) {
  return info && info.sp.saldi && b.discount ? p.price * (1 - b.discount / 100) : p.price;
}

/** Calcolo domanda (anche per stime) */
function computeDemand(b, info, mods, avgQ, deterministic) {
  const T = bizType(b), city = CITY[b.city], d = DISTRICT[b.district];
  const diff = DIFFICULTY[S.meta.difficulty];
  let market = T.baseDemand * d.foot * city.size * seasonalMult(T, b, info) * weatherMult(T, b, mods)
    * Math.pow(S.eco.index, T.ecoSens) * diff.demand * effectMult('demand', scopesFor(b)) * mods.demand;
  if (info.wd >= 5) market *= mods.weekend;
  if (mods.dehors && info.m >= 3 && info.m <= 8) market *= 1.06;
  const pi = priceIndexOf(b, info);
  const myA = attract(b.rep, avgQ, pi, effAw(b));
  let others = 0;
  for (const c of compsIn(b.city, b.district, b.type)) others += attract(c.rep, c.q, c.pi, c.aw);
  for (const x of S.biz) if (x !== b && x.type === b.type && x.city === b.city && x.district === b.district && x.status === 'open') others += attract(x.rep, x.lastQ || 55, priceIndexOf(x, info), effAw(x));
  // opzione "esterna": parte della domanda va altrove se l'offerta è poco attraente
  const outside = 0.35;
  const share = myA / (myA + others + outside);
  const hc = T.capMode === 'day' ? 1 : hoursCoverage(T, b.hours);
  let wanted = market * share * hc;
  if (!deterministic) wanted *= clamp(gauss(1, 0.08), 0.7, 1.3);
  return { market, share, hc, wanted, pi, myA, others };
}
function physCapacity(b, mods, info) {
  const T = bizType(b);
  let phys = mods.phys;
  if (mods.dehors && info.m >= 3 && info.m <= 8) phys *= 1.3;
  if (T.capMode === 'day') return Math.floor(b.m2 / T.roomM2) * phys;
  return T.capPerHour * (b.m2 / T.size) * openHours(b) * phys;
}
function estimateCustomers(b) {
  const info = dayInfo(S.day);
  const mods = bizMods(b);
  const dem = computeDemand(b, info, mods, b.lastQ || 55, true);
  return Math.round(Math.min(dem.wanted, physCapacity(b, mods, info)));
}
function estimateProduction(b) {
  const T = bizType(b);
  const mods = bizMods(b);
  const staff = empsOf(b.id).filter(e => e.role === T.role);
  const out = T.outputs[b.output];
  const labor = sum(staff, e => e.hours * out.perHour * empEff(e)) * mods.speed;
  return Math.min(labor, machineCap(b, mods));
}
function machineCap(b, mods) {
  const T = bizType(b);
  const out = T.outputs[b.output];
  const specific = T.equip.filter(e => e.kind === 'prod' && e.only === b.output);
  const pool = specific.length ? specific : T.equip.filter(e => e.kind === 'prod' && !e.only);
  if (out.eq && !(b.equip[out.eq] && !b.equip[out.eq].broken)) return 0;
  let cap = 0;
  for (const e of pool) { const o = b.equip[e.cat]; if (o && !o.broken) cap += e.val * TIER_FX.prod[o.tier]; }
  return cap * mods.prodCap;
}

// ===================== Simulazione negozio =====================
function simShop(b, info, mods, staffToday) {
  const T = bizType(b);
  const R = b.today;
  // minuti disponibili per ruolo
  const roleMin = {}, roleSkillSum = {}, roleCnt = {};
  let presenceHours = 0, cleanHours = 0, serviceSkill = 0, serviceN = 0, satBonus = 0, managerOn = false;
  for (const e of staffToday) {
    const eff = empEff(e);
    roleMin[e.role] = (roleMin[e.role] || 0) + e.hours * 60 * eff * mods.speed;
    roleSkillSum[e.role] = (roleSkillSum[e.role] || 0) + e.skill; roleCnt[e.role] = (roleCnt[e.role] || 0) + 1;
    if (e.role !== 'pulizie') presenceHours += e.hours;
    if (e.role === 'pulizie') cleanHours += e.hours * eff;
    if (e.role === 'manager') managerOn = true;
    if (e.role === T.front || e.role === 'cameriere' || e.role === 'receptionist' || e.role === 'commesso') { serviceSkill += e.skill; serviceN++; }
    for (const t of e.traits) if (TRAITS[t].sat) satBonus += TRAITS[t].sat / Math.max(1, staffToday.length);
  }
  const roleSkill = {};
  for (const r in roleSkillSum) roleSkill[r] = roleSkillSum[r] / roleCnt[r];
  if (managerOn) for (const r in roleMin) roleMin[r] *= 1.06;

  // qualità prodotti
  const active = b.products.filter(p => p.on);
  const qmap = {};
  for (const p of active) qmap[p.id] = productQuality(b, p, mods, roleSkill);
  const avgQ = active.length ? avg(active, p => qmap[p.id]) : 0;
  b.lastQ = avgQ;

  const dem = computeDemand(b, info, mods, avgQ, false);
  const hourlyMode = T.capMode !== 'day';
  let wanted, customers;
  if (hourlyMode) {
    const hr = simHours(b, T, info, mods, staffToday, active, dem.wanted);
    R.hourly = hr.hours; wanted = hr.wanted; customers = hr.served;
  } else {
    const staffCov = clamp(presenceHours / 16, 0, 1);
    wanted = dem.wanted * (0.25 + 0.75 * staffCov);
    customers = Math.min(wanted, physCapacity(b, mods, info));
  }
  // reception / servizio (solo per le attività a capacità giornaliera, le altre sono gestite ora per ora)
  if (T.front && !hourlyMode) {
    const need = customers * T.frontMin;
    let avail = (roleMin[T.front] || 0);
    if (avail < need && roleMin.manager) { const use = Math.min(roleMin.manager * 0.5, need - avail); roleMin.manager -= use; avail += use; }
    if (avail < need) {
      // altri ruoli aiutano, con efficienza ridotta
      for (const r in roleMin) {
        if (r === T.front || r === 'pulizie' || avail >= need) continue;
        const use = Math.min(roleMin[r] * 0.35, (need - avail) / 0.6);
        roleMin[r] -= use; avail += use * 0.6;
      }
    }
    const used = Math.min(avail, need);
    if (roleMin[T.front]) roleMin[T.front] = Math.max(0, roleMin[T.front] - used);
    if (avail < need) customers = avail / T.frontMin;
  }
  customers = Math.max(0, customers);
  R.wanted = Math.round(wanted); R.customers = Math.round(customers);
  R.lostCap = Math.max(0, Math.round(wanted - customers));
  R.share = dem.share; R.market = dem.market;

  // domanda per prodotto
  const groups = {};
  for (const p of active) (groups[p.tpl] = groups[p.tpl] || []).push(p);
  const demand = {};
  for (const g in groups) {
    const t = T.products.find(x => x.id === g);
    if (t.eq && !(b.equip[t.eq] && !b.equip[t.eq].broken)) { for (const p of groups[g]) demand[p.id] = 0; continue; }
    const V = groups[g];
    const ap = V.map(p => {
      const r = effPrice(b, p, info) / refPrice(b, p);
      const pf = r > 3 ? 0.01 : clamp(Math.pow(r, -T.el * 0.8), 0.03, 2.2);
      return pf * (0.75 + qmap[p.id] / 100 * 0.5);
    });
    const best = Math.max(...ap);
    const gm = t.mon ? t.mon[info.m] : 1;
    const units = customers * t.a * gm * best * (1 + 0.08 * (V.length - 1));
    const s2 = sum(ap, x => x * x);
    V.forEach((p, i) => { demand[p.id] = units * (s2 > 0 ? ap[i] * ap[i] / s2 : 0); });
  }
  // limiti di personale per ruolo
  const needRole = {};
  for (const p of active) needRole[p.role] = (needRole[p.role] || 0) + demand[p.id] * p.min;
  const ratio = {};
  for (const r in needRole) {
    if (hourlyMode) { ratio[r] = 1; continue; }
    let avail = roleMin[r] || 0;
    if (avail < needRole[r]) {
      if (roleMin.manager && r !== 'manager') { const use = Math.min(roleMin.manager * 0.5, needRole[r] - avail); roleMin.manager -= use; avail += use; }
      for (const o in roleMin) {
        if (o === r || o === 'pulizie' || o === 'manager' || needRole[o] || avail >= needRole[r]) continue;
        const use = Math.min(roleMin[o] * 0.4, (needRole[r] - avail) / 0.5);
        roleMin[o] -= use; avail += use * 0.5;
      }
    }
    ratio[r] = needRole[r] > 0 ? clamp(avail / needRole[r], 0, 1) : 1;
  }
  // vendite con limiti di magazzino
  const sales = []; let unitsWanted = 0, unitsSold = 0, valueScore = 0, valueW = 0, qualSold = 0;
  const use = {}, stockouts = [];
  const order = active.slice().sort((a, c) => demand[c.id] - demand[a.id]);
  for (const p of order) {
    let want = demand[p.id] * ratio[p.role];
    unitsWanted += demand[p.id];
    if (want <= 0) continue;
    let maxU = Infinity;
    for (const m in p.r) maxU = Math.min(maxU, stockOf(b, m) / p.r[m]);
    let sell = Math.min(want, maxU);
    if (MATERIALS && Object.keys(p.r).length === 0) sell = want;
    sell = Math.floor(sell * 100) / 100;
    if (maxU < want * 0.98) stockouts.push(p.name);
    if (sell <= 0) continue;
    for (const m in p.r) { const q = p.r[m] * sell; takeStock(b, m, q); use[m] = (use[m] || 0) + q; }
    const price = effPrice(b, p, info);
    const t = tplOf(b, p);
    const iva = t.iva != null ? t.iva : T.iva;
    sales.push({ n: p.name, g: price * sell, iva });
    unitsSold += sell;
    const r = refPrice(b, p) / price;
    valueScore += clamp(r - 1, -1, 0.6) * sell; valueW += sell;
    qualSold += qmap[p.id] * sell;
    R.items[p.id] = (R.items[p.id] || 0) + sell;
  }
  let gross = 0;
  for (const x of sales) { gross += x.g; R.revNet += income(x.g, x.iva, 'vendite', b.id, x.n); }
  R.gross = gross;
  if (mods.commission && gross > 0) expense(gross * mods.commission / 1.22, 0.22, 'commissioni', b.id, 'Commissioni sugli incassi');
  R.use = use; R.stockouts = stockouts;
  S.counters.sold += unitsSold;

  // soddisfazione
  const fill = unitsWanted > 0 ? unitsSold / unitsWanted : 1;
  const waitPenalty = (wanted > 0 ? (1 - customers / wanted) : 0) * 28 + (1 - fill) * 32;
  const vs = valueW > 0 ? valueScore / valueW : 0;
  const qs = unitsSold > 0 ? qualSold / unitsSold : avgQ;
  const cleanNeed = b.m2 / 90;
  const clean = clamp(0.55 + cleanHours / Math.max(1, cleanNeed) * 0.45, 0, 1.1);
  const serv = serviceN ? (serviceSkill / serviceN - 50) * 0.1 : -3;
  let sat = 60 + (qs - 55) * 0.45 + vs * 30 - waitPenalty + (clean - 0.8) * 20 + serv + satBonus + mods.sat + gauss(0, 2);
  sat = clamp(sat, 0, 100);
  R.sat = sat; R.quality = qs; R.clean = clean;
  if (customers > 0) {
    b.sat = lerp(b.sat, sat, 0.3);
    b.rep = clamp(b.rep + (sat - b.rep) * 0.02 * clamp(customers / 40, 0.3, 1.5), 0, 100);
  }
  // recensioni
  if (customers > 0 && chance(clamp(customers / 60, 0.05, 0.8))) addReview(b, sat, stockouts.length > 0, R.lostCap > customers * 0.1, vs);
}

const REVIEW_TXT = {
  5: ['Esperienza fantastica, tornerò sicuramente!', 'Qualità eccellente e personale gentilissimo.', 'Il migliore della zona, senza dubbio.', 'Tutto perfetto, prezzi onesti.'],
  4: ['Molto bene, qualche piccolo dettaglio da migliorare.', 'Buona qualità, ambiente piacevole.', 'Consigliato, personale cordiale.'],
  3: ['Nella media, niente di speciale.', 'Discreto, ma i prezzi potrebbero essere più bassi.', 'Così così, mi aspettavo di più.'],
  2: ['Servizio lento e qualità scarsa.', 'Prezzi troppo alti per quello che offrono.', 'Deludente, non credo tornerò.'],
  1: ['Pessima esperienza, da evitare.', 'Attesa infinita e personale scortese.', 'Qualità inaccettabile.'],
};
function addReview(b, sat, stockout, waiting, vs) {
  const st = clamp(Math.round(1 + (sat + gauss(0, 10)) / 25), 1, 5);
  let txt = pick(REVIEW_TXT[st]);
  if (st <= 3 && stockout && chance(0.6)) txt = 'Mancavano diversi prodotti, scaffali vuoti.';
  else if (st <= 3 && waiting && chance(0.6)) txt = 'Troppa attesa, sembravano a corto di personale.';
  else if (st <= 3 && vs < -0.2 && chance(0.6)) txt = 'Prezzi davvero troppo alti.';
  else if (st >= 4 && vs > 0.1 && chance(0.4)) txt = 'Ottimo rapporto qualità/prezzo!';
  const who = pick(NAMES_M.concat(NAMES_F)) + ' ' + pick(SURNAMES)[0] + '.';
  b.reviews.unshift({ day: S.day, st, txt, who });
  if (b.reviews.length > 20) b.reviews.length = 20;
}

// ===================== Simulazione produzione =====================
function simProduction(b, info, mods, staffToday) {
  const T = bizType(b);
  const R = b.today;
  const out = T.outputs[b.output];
  let labor = 0, skillSum = 0, n = 0, bonus = 1;
  for (const e of staffToday) {
    const eff = empEff(e);
    if (e.role === T.role) { labor += e.hours * out.perHour * eff; skillSum += e.skill; n++; }
    else if (e.role === 'magazziniere') bonus += 0.06;
    else if (e.role === 'manager') bonus += 0.08;
    else labor += e.hours * out.perHour * eff * 0.3;
  }
  labor *= mods.speed * Math.min(bonus, 1.3);
  const mcap = machineCap(b, mods);
  const season = out.mon ? out.mon[info.m] : 1;
  let units = Math.min(labor, mcap) * season;
  if (b.prodTarget > 0) units = Math.min(units, b.prodTarget);
  // capacità del magazzino: al massimo circa 25 giorni di produzione
  const storeCap = Math.max(100, mcap * 25 * Math.max(1, b.m2 / T.size));
  const room = Math.max(0, storeCap - stockOf(b, b.output));
  if (room < units) { units = room; R.full = true; }
  const wantU = units;
  for (const m in out.in) units = Math.min(units, stockOf(b, m) / out.in[m]);
  if (units < wantU * 0.9) R.stockouts = Object.keys(out.in).filter(m => stockOf(b, m) / out.in[m] < wantU).map(m => MATERIALS[m].name);
  units = Math.max(0, Math.floor(units * 10) / 10);
  R.capLabor = labor; R.capMachine = mcap;
  let inQ = 0, inW = 0, inCost = 0;
  const use = {};
  if (units > 0) {
    for (const m in out.in) {
      const t = takeStock(b, m, out.in[m] * units);
      use[m] = t.taken; inCost += t.cost; inQ += t.quality * t.cost; inW += t.cost;
    }
    const skill = n ? skillSum / n : 30;
    const q = clamp(Math.round((inW > 0 ? inQ / inW : 55) * 0.45 + skill * 0.3 + mods.quality + 18), 1, 100);
    const overhead = (b.lastOverhead || 0);
    const unitCost = (inCost + overhead) / units;
    b.unitCost = b.unitCost ? lerp(b.unitCost, unitCost, 0.25) : unitCost;
    addStock(b, b.output, units, q, unitCost, mods.shelf);
    R.produced = units; R.quality = q; b.lastQ = q;
    R.hourly = prodHours(b, T, staffToday, units);
  }
  R.use = use;
  // vendita all'ingrosso
  if (b.wholesale && b.wholesale.on) {
    const q = stockQuality(b, b.output) || 55;
    const ref = wholesaleRef(b, q, mods);
    const price = b.wholesale.price || ref;
    const same = S.biz.filter(x => x.output === b.output && x.wholesale && x.wholesale.on && x.status === 'open').length;
    let dem = WHOLESALE_DEMAND[b.output] * Math.pow(ref / price, 2.2) * Math.sqrt(S.eco.index) * (hasResearch('export') ? 1.4 : 1) / Math.sqrt(Math.max(1, same)) * clamp(gauss(1, 0.12), 0.6, 1.4);
    if (!info.isTradingDay) dem *= 0.3;
    const avail = Math.max(0, stockOf(b, b.output) - (b.wholesale.reserve || 0));
    const sell = Math.floor(Math.min(dem, avail) * 10) / 10;
    if (sell > 0) {
      takeStock(b, b.output, sell);
      const iva = MATERIALS[b.output].iva;
      R.revNet += income(sell * price * (1 + iva), iva, 'ingrosso', b.id, MATERIALS[b.output].name);
      R.wsSold = sell; R.wsPrice = price;
    }
    R.wsDemand = dem;
  }
}
function wholesaleRef(b, q, mods) {
  return MATERIALS[b.output].price * S.eco.priceLevel * (0.8 + q / 100 * 0.4) * (mods ? mods.wholesale : 1);
}

// ===================== Costi giornalieri =====================
function dailyEnergy(b, mods, open) {
  const T = bizType(b);
  let en = T.energy * Math.pow(b.m2 / T.size, 0.7);
  for (const e of T.equip) { const o = b.equip[e.cat]; if (o) en += e.en * (1 + 0.2 * o.tier); }
  en *= mods.energy * S.eco.energy * effectMult('energy', scopesFor(b));
  return en * (open ? 1 : 0.35);
}

// ===================== Dipendenti =====================
function employeeDay(e, info, worked) {
  const traits = e.traits.map(t => TRAITS[t]);
  const tf = traits.reduce((m, t) => m * (t.fatigue || 1), 1);
  if (worked) {
    e.consec = (e.consec || 0) + 1;
    e.fatigue += (Math.max(0, e.hours - 6) * 2.4 + (e.consec > 5 ? 7 : 0) + 1) * tf;
    if (info.isFestivo) e.monthExtra += e.wage / 26 * (e.hours / 8) * 0.3;
    e.exp++;
    const learn = traits.reduce((m, t) => m * (t.learn || 1), 1) * (hasResearch('formazione') ? 1.3 : 1) * (e.contract === 'apprendistato' ? 1.4 : 1);
    e.skill = Math.min(100, e.skill + 0.035 * (1 - e.skill / 105) * learn);
  } else { e.consec = 0; e.fatigue -= 16; }
  e.fatigue = clamp(e.fatigue, 0, 100);
  if (e.trainUntil && e.trainUntil === S.day) {
    e.skill = Math.min(100, e.skill + (e.trainGain || 5)); e.morale = clamp(e.morale + (e.trainMorale || 3), 0, 100);
    log(`${empName(e)} ha completato la formazione: competenza ora ${Math.round(e.skill)}.`, 'good', e.biz);
  }
  // morale
  const mw = marketWage(e.role, e.city, e.skill);
  const wh = weeklyHours(e);
  const effWage = e.wage * Math.min(wh, 40) / 40 + Math.max(0, wh - 40) * e.wage / 40 * 1.25;
  const wageRatio = wh > 0 ? (e.wage / mw) : 1;
  let target = 62 + clamp((wageRatio - 1) * 110, -30, 22) - Math.max(0, e.fatigue - 45) * 0.55 - Math.max(0, wh - 40) * 1.0;
  const b = e.biz !== 'hq' ? getBiz(e.biz) : null;
  const colleagues = e.biz !== 'hq' ? empsOf(e.biz) : hqEmps();
  if (colleagues.some(c => c.role === 'manager' && c.id !== e.id)) target += 5;
  if (hqCount('hr') > 0) target += Math.min(1, hqCount('hr') * 60 / Math.max(1, Object.keys(S.emps).length)) * 4;
  if (hasResearch('welfare')) target += 5;
  for (const c of colleagues) if (c.id !== e.id && c.traits.includes('leader')) { target += 3; break; }
  if (b) target += (b.sat - 60) * 0.08;
  target += peopleMoraleAdj(e, b);
  if (e.contract === 'determinato' || e.contract === 'stagionale') target -= 3;
  const swing = traits.reduce((m, t) => m * (t.moodSwing || 1), 1);
  e.morale = clamp(e.morale + (target - e.morale) * 0.04 + gauss(0, 0.8 * swing), 0, 100);
  void effWage;
  // malattia
  const sickF = traits.reduce((m, t) => m * (t.sick || 1), 1);
  if (e.sickUntil <= S.day && e.holidayUntil <= S.day && chance(0.0032 * (1 + e.fatigue / 60) * sickF * (info.season === 'inverno' ? 1.5 : 1))) {
    const days = chance(0.85) ? rint(1, 4) : rint(5, 15);
    e.sickUntil = S.day + days;
    if (b) log(`${empName(e)} (${b.name}) è in malattia per ${days} giorni.`, 'bad', e.biz);
  }
  peopleDay(e);
}

// ===================== Giorno =====================
function simulateDay() {
  if (S.over) return;
  S.day++;
  const info = dayInfo(S.day);
  const t = ymd(S.day);
  const startCash = S.cash;
  // snapshot profitto mese per attività
  const mk = monthKey(S.day);
  const snap = {};
  for (const b of S.biz) snap[b.id] = plOf((S.bizLedger[b.id] || {})[mk]).profit;
  const snapG = plOf(S.ledger[mk]).profit;
  const snapRev = plOf(S.ledger[mk]).rev;

  // meteo
  for (const c of CITIES) S.weather[c.id] = rollWeather(c, t.m, S.weather[c.id]);
  // economia
  if (t.d === 1) monthlyEconomy(info);
  if (info.isTradingDay) stockMarketDay(info);

  processDeliveries();

  // periodici di inizio mese
  if (t.d === 1) monthStart(info);

  // simulazione attività
  let totCust = 0;
  for (const b of S.biz) {
    const T = bizType(b);
    const mods = bizMods(b);
    b.today = { customers: 0, wanted: 0, lostCap: 0, revNet: 0, gross: 0, items: {}, use: {}, closed: null, waste: 0 };
    const reason = closedReason(b, info);
    let staffToday = [];
    if (!reason) {
      staffToday = empsOf(b.id).filter(e => isWorking(e, info));
      if (!staffToday.length) b.today.closed = 'Nessun dipendente in servizio';
    } else b.today.closed = reason;
    const open = !b.today.closed;
    if (open) {
      if (T.mode === 'shop') simShop(b, info, mods, staffToday); else simProduction(b, info, mods, staffToday);
      totCust += b.today.customers || 0;
    } else if (b.status === 'open' && reason !== 'Giorno di chiusura settimanale' && reason !== 'Chiusura per ferie' && reason !== 'Chiusa per festività') {
      if (T.mode === 'shop' && b.today.closed === 'Nessun dipendente in servizio') b.rep = clamp(b.rep - 0.3, 0, 100);
    }
    const workedIds = new Set(open ? staffToday.map(e => e.id) : []);
    for (const e of empsOf(b.id)) employeeDay(e, info, workedIds.has(e.id));
    // costi
    if (b.status !== 'setup' || Object.keys(b.equip).length) {
      const en = dailyEnergy(b, mods, open);
      if (en > 0) expense(en, 0.22, 'utenze', b.id, 'Luce, gas e acqua');
    }
    if (b.mkBudget > 0 && b.status === 'open') expense(b.mkBudget, 0.22, 'marketing', b.id, 'Pubblicità giornaliera');
    // scadenze magazzino
    const waste = expireStock(b, mods);
    b.today.waste = waste;
    // usura attrezzature
    for (const cat in b.equip) {
      const o = b.equip[cat];
      if (o.broken) continue;
      o.cond = Math.max(0, o.cond - (open ? rfloat(0.03, 0.09) : 0.01) * mods.wear);
      if (o.cond < 45 && chance((45 - o.cond) / 45 * 0.025 * mods.wear)) {
        o.broken = true;
        queueEvent(makeBreakdownEvent(b, cat));
      }
    }
    // consapevolezza del marchio
    updateAwareness(b, mods);
    autoRestock(b);
  }
  // sede
  for (const e of hqEmps()) employeeDay(e, info, isWorking(e, info) && info.wd < 5 && !info.holiday);
  // contratti, dimissioni, richieste
  employeeLifecycle(info);
  // overhead produzione stimato per il costo unitario
  for (const b of S.biz) if (bizType(b).mode === 'production') {
    b.lastOverhead = sum(empsOf(b.id), e => empMonthlyCost(e) * 1.37) / 30 + (b.rent || 0) / 30 + dailyEnergy(b, bizMods(b), true);
  }
  // pagamenti periodici
  if (t.d === 16) midMonth(info);
  if (t.m === 11 && t.d === 20) tredicesima();
  for (const d of S.tax.due.slice()) if (d.due <= S.day) {
    cashMove(-d.amount, 'versamento_imposte', null, d.label);
    log(`Pagate ${d.label}: ${eur(d.amount)}.`, 'info');
    S.tax.due = S.tax.due.filter(x => x !== d);
  }
  processLoans();
  dailyBankInterest();
  researchDay();
  campaignsDay();
  if (info.wd === 0) weeklyMarket(info);
  for (const c of CITIES) if (info.wd === 0) refreshCandidates(c.id, false);
  S.effects = S.effects.filter(e => e.until >= S.day);
  rollEvents(info);
  if (info.isLastOfMonth && t.m === 11) closeFiscalYear(t.y);

  // registro storico
  for (const b of S.biz) {
    const p = plOf((S.bizLedger[b.id] || {})[mk]).profit - (snap[b.id] || 0);
    const r = b.today;
    b.hist.push({ day: S.day, cust: Math.round(r.customers || 0), wanted: Math.round(r.wanted || 0), lost: r.lostCap || 0, rev: r.revNet + (r.internal || 0), profit: p, use: r.use, sat: Math.round(r.sat || b.sat), q: Math.round(r.quality || b.lastQ || 0), closed: r.closed, prod: r.produced || 0, ws: r.wsSold || 0, waste: r.waste });
    if (b.hist.length > 90) b.hist.shift();
  }
  const pl = plOf(S.ledger[mk]);
  const bs = balanceSheet();
  S.nw = bs.equity; S.maxNw = Math.max(S.maxNw, S.nw);
  S.hist.push({ day: S.day, cash: Math.round(S.cash), nw: Math.round(S.nw), rev: pl.rev - snapRev, profit: pl.profit - snapG, cust: totCust });
  if (S.hist.length > 400) S.hist.shift();
  S.report = { day: S.day, cashDelta: S.cash - startCash, cust: totCust };
  bankruptcyCheck();
  checkAchievements();
}

function updateAwareness(b, mods) {
  const target = 20 + b.rep * 0.4;
  b.aw += (target - b.aw) * 0.01;
  const mkEff = (hqCount('marketer') > 0 ? 1.3 : 1) * (hasResearch('digital') ? 1.25 : 1);
  if (b.mkBudget > 0 && b.status === 'open') b.aw += Math.sqrt(b.mkBudget) * 0.09 * mkEff * (1 - b.aw / 100);
  b.aw = clamp(b.aw, 0, 100);
}

function campaignsDay() {
  const mkEff = (hqCount('marketer') > 0 ? 1.3 : 1) * (hasResearch('digital') ? 1.25 : 1);
  for (const c of S.campaigns) {
    if (c.until < S.day) continue;
    const C = CAMPAIGN[c.camp];
    const per = C.aw / C.days * mkEff;
    let targets = [];
    if (C.scope === 'biz') targets = S.biz.filter(b => b.id === c.target);
    else if (C.scope === 'city') targets = S.biz.filter(b => b.city === c.target);
    else if (C.scope === 'brand') {
      const br = S.brands.find(x => x.id === c.target);
      if (br) br.aw = clamp(br.aw + per * (1 - br.aw / 110), 0, 100);
      targets = S.biz.filter(b => b.brand === c.target);
    }
    for (const b of targets) b.aw = clamp(b.aw + per * (1 - b.aw / 110), 0, 100);
  }
  S.campaigns = S.campaigns.filter(c => c.until >= S.day);
  // marchi: consapevolezza = media delle attività + bonus catena
  for (const br of S.brands) {
    const list = S.biz.filter(b => b.brand === br.id);
    const target = list.length ? avg(list, b => b.aw) * 0.6 + Math.min(30, list.length * 2.5) + (S.franchise.on && S.franchise.brand === br.id ? Math.min(25, S.franchise.affiliates * 0.3) : 0) : 0;
    br.aw = clamp(br.aw + (target - br.aw) * 0.02, 0, 100);
  }
}

function researchDay() {
  const a = S.research.active;
  if (!a) return;
  a.progress += 1 + 0.35 * Math.min(5, hqCount('ricercatore'));
  if (a.progress >= a.days) {
    S.research.done[a.id] = S.day;
    S.research.active = null;
    const R = RESEARCH_BY[a.id];
    log(`Ricerca completata: ${R.n}. ${R.d}`, 'good');
    queueEvent({ type: 'info', title: 'Ricerca completata', text: `Il progetto "${R.n}" è completato. ${R.d}`, opts: ['Ottimo'], important: true });
    // sblocca prodotti nelle attività esistenti
    for (const b of S.biz) {
      const T = bizType(b);
      if (T.mode !== 'shop') continue;
      for (const p of T.products) if (p.lock === a.id && !b.products.some(x => x.tpl === p.id)) b.products.push(productFromTemplate(p, b));
    }
  }
}
function startResearch(id) {
  const R = RESEARCH_BY[id];
  if (S.research.active) return { err: 'C\'è già un progetto in corso.' };
  if (R.req && R.req.some(r => !hasResearch(r))) return { err: 'Requisiti mancanti.' };
  const cost = Math.round(R.cost * S.eco.priceLevel * (1 - 0.05 * Math.min(5, hqCount('ricercatore'))));
  if (S.cash < cost) return { err: 'Liquidità insufficiente.' };
  cashMove(-cost, 'ricerca', null, R.n);
  S.research.active = { id, progress: 0, days: R.days, started: S.day };
  return { ok: true };
}

// ---------- ciclo di vita dipendenti ----------
function employeeLifecycle(info) {
  const t = ymd(S.day);
  for (const e of Object.values(S.emps)) {
    const b = e.biz !== 'hq' ? getBiz(e.biz) : null;
    const auto = autoManaged(e.biz);
    // ferie
    if (e.holidays >= 5 && e.holidayUntil <= S.day && e.sickUntil <= S.day && e.trainUntil <= S.day) {
      const p = 0.003 * (t.m === 7 ? 6 : t.m === 6 ? 2.5 : t.m === 11 ? 2 : 1) * (e.holidays > 20 ? 1.5 : 1);
      if (chance(p)) {
        const days = Math.min(Math.floor(e.holidays), rint(5, t.m === 7 ? 14 : 8));
        if (auto) { e.holidayUntil = S.day + days; e.holidays -= days * 5 / 7; }
        else queueEvent({ type: 'ferie', emp: e.id, biz: e.biz, days, title: 'Richiesta di ferie', text: `${empName(e)} (${ROLES[e.role].name}${b ? ', ' + b.name : ''}) chiede ${days} giorni di ferie a partire da domani.`, opts: ['Approva', 'Rifiuta (il morale cala)'], minor: true });
      }
    }
    // dimissioni
    if (e.morale < 32) {
      const quitF = e.traits.reduce((m, tr) => m * (TRAITS[tr].quit || 1), 1);
      if (chance((32 - e.morale) / 32 * 0.03 * quitF)) {
        queueEvent({ type: 'dimissioni', emp: e.id, biz: e.biz, title: 'Dimissioni', text: `${empName(e)} (${ROLES[e.role].name}${b ? ', ' + b.name : ''}) vuole dimettersi: morale ${Math.round(e.morale)}/100. Stipendio attuale ${eur(e.wage)}, il mercato offre circa ${eur(marketWage(e.role, e.city, e.skill))}.`, opts: [`Controproposta: aumento del 12% (${eur(e.wage * 1.12)})`, 'Accetta le dimissioni'], important: true });
        e.morale = 33;
      }
    }
    // richiesta aumento
    const raiseF = e.traits.includes('ambizioso') ? 2 : 1;
    if (S.day - (e.lastRaise || e.hired) > 240 && e.wage < marketWage(e.role, e.city, e.skill) * 1.08 && chance(0.004 * raiseF)) {
      e.lastRaise = S.day;
      queueEvent({ type: 'aumento', emp: e.id, biz: e.biz, title: 'Richiesta di aumento', text: `${empName(e)} (${ROLES[e.role].name}, competenza ${Math.round(e.skill)}) chiede un aumento dell'8%: da ${eur(e.wage)} a ${eur(e.wage * 1.08)} lordi al mese.`, opts: ['Concedi l\'8%', 'Concedi il 4%', 'Rifiuta'], minor: true, auto: 1 });
    }
    // scadenza contratti
    if (e.end && e.end - S.day === 14 && e.contract !== 'apprendistato') {
      queueEvent({ type: 'scadenza', emp: e.id, biz: e.biz, title: 'Contratto in scadenza', text: `Il contratto ${e.contract} di ${empName(e)} (${ROLES[e.role].name}${b ? ', ' + b.name : ''}) scade il ${fmtDate(e.end)}.`, opts: ['Rinnova per 12 mesi', 'Trasforma a tempo indeterminato (+morale)', 'Lascia scadere'], important: true });
    }
    if (e.end && e.end <= S.day) {
      if (e.contract === 'apprendistato') {
        e.contract = 'indeterminato'; e.end = null; e.wage = Math.max(e.wage, Math.round(marketWage(e.role, e.city, e.skill) * 0.95));
        log(`L'apprendistato di ${empName(e)} è terminato: ora è assunto a tempo indeterminato.`, 'info', e.biz);
      } else {
        log(`Il contratto di ${empName(e)} è scaduto: lascia l'azienda.`, 'info', e.biz);
        fireEmployee(e, 'scadenza');
        if (b) checkStaffing(b);
      }
    }
  }
}
function autoManaged(bizId) {
  if (!S.settings.autoMinor) return false;
  if (bizId === 'hq') return hqCount('hr') > 0;
  const hasMgr = empsOf(bizId).some(e => e.role === 'manager');
  if (hasMgr) return true;
  const am = hqCount('areamanager');
  if (am > 0) { const idx = S.biz.findIndex(b => b.id === bizId); return idx >= 0 && idx < am * 6; }
  return false;
}
function checkStaffing(b) {
  if (b.status === 'open' && empsOf(b.id).length === 0) log(`Attenzione: "${b.name}" non ha più dipendenti e non può aprire.`, 'bad', b.id);
}

// ---------- periodici ----------
function monthlyEconomy(info) {
  const E = S.eco;
  E.trend = E.trend * 0.85 + gauss(0, 0.004);
  E.index = clamp(E.index + gauss(0, 0.01) + (1 - E.index) * 0.06 + E.trend, 0.8, 1.2);
  E.phase = E.index > 1.06 ? 'Espansione' : E.index > 1.01 ? 'Crescita moderata' : E.index > 0.97 ? 'Stabile' : E.index > 0.92 ? 'Rallentamento' : 'Recessione';
  E.infl = clamp(E.infl + gauss(0, 0.0018) + (0.021 - E.infl) * 0.06 + (E.index - 1) * 0.008, -0.005, 0.08);
  E.priceLevel *= 1 + E.infl / 12;
  E.energy = clamp(E.energy * (1 + gauss(0, 0.025)) + (E.priceLevel - E.energy) * 0.08, 0.7, 2.0);
  const target = clamp(0.015 + (E.infl - 0.02) * 1.6, 0, 0.065);
  E.bce = Math.round((E.bce + (target - E.bce) * 0.2) * 400) / 400;
  for (const c of CITIES) S.market.index[c.id] = clamp(S.market.index[c.id] * (1 + gauss(0.0018, 0.005) + (E.index - 1) * 0.004), 0.6, 2.5);
}
function monthStart(info) {
  const t = ymd(S.day);
  const prevMk = prevMonthKey(monthKey(S.day));
  const prevDim = daysInMonth(t.m === 0 ? t.y - 1 : t.y, t.m === 0 ? 11 : t.m - 1);
  // stipendi del mese precedente
  for (const e of Object.values(S.emps)) {
    const from = Math.max(e.hired, S.day - prevDim);
    const frac = clamp((S.day - from) / prevDim, 0, 1);
    const gross = empMonthlyCost(e) * frac + (e.monthExtra || 0);
    e.monthExtra = 0;
    if (gross <= 0) continue;
    const bz = e.biz === 'hq' ? null : e.biz;
    cashMove(-gross, 'stipendi', bz, empLbl(e));
    cashMove(-gross * 0.3, 'contributi', bz, empLbl(e));
    const tfr = gross / 13.5;
    e.tfr = (e.tfr || 0) + tfr;
    bookOnly('contributi', -tfr, bz, empLbl(e) + ' (TFR)');
  }
  // affitti, canoni, assicurazioni
  for (const b of S.biz) {
    const mods = bizMods(b);
    if (b.rent > 0 && b.paidRentMonth !== monthKey(S.day)) { expense(b.rent, 0, 'affitto', b.id, 'Affitto del locale'); b.paidRentMonth = monthKey(S.day); }
    if (mods.monthly > 0) expense(mods.monthly * S.eco.priceLevel, 0.22, 'manutenzione', b.id, 'Canoni mensili');
    if (b.insurance) cashMove(-insurancePremium(b), 'assicurazioni', b.id, 'Polizza attività');
  }
  // commercialista
  const nb = S.biz.length;
  if (nb > 0) {
    let fee = (110 + 55 * nb) * S.eco.priceLevel;
    const covered = Math.min(nb, hqCount('contabile') * 12);
    fee *= 1 - 0.75 * covered / nb;
    expense(fee, 0.22, 'consulenze', null, 'Commercialista');
  }
  if (S.overdraft.limit > 0) cashMove(-S.overdraft.limit * 0.005 / 12, 'commissioni', null, 'Fido bancario');
  labourInspection();
  monthlyDepreciation();
  pruneDetail();
  // IVA del mese precedente
  if (hasIva()) {
    let due = S.tax.ivaDebit - S.tax.ivaCredit - S.tax.ivaCarry;
    if (due < 0) { S.tax.ivaCarry = -due; due = 0; } else S.tax.ivaCarry = 0;
    S.tax.ivaDue += due;
  }
  S.tax.ivaDebit = 0; S.tax.ivaCredit = 0;
  // immobili
  propertiesMonth(t);
  franchiseMonth();
  // rating
  S.credit.score = computeScore();
  S.credit.lateDays = Math.max(0, S.credit.lateDays * 0.85 - 1);
  // gennaio: rinnovi contrattuali e ferie
  if (t.m === 0) {
    const raise = Math.max(0, S.eco.infl * 0.8);
    S.eco.wageLevel *= 1 + raise;
    for (const e of Object.values(S.emps)) { e.wage = Math.round(e.wage * (1 + raise)); e.holidays = Math.min(40, (e.holidays || 0) + 26); e.age++; }
    for (const b of S.biz) if (b.rent > 0) b.rent = Math.round(b.rent * (1 + S.eco.infl * 0.75));
    if (raise > 0) log(`Rinnovo contratti collettivi: stipendi aumentati del ${pct(raise, 1)}. Affitti adeguati all'ISTAT.`, 'info');
  }
  void prevMk; void info;
}
function insurancePremium(b) { return Math.round((35 + b.m2 * 0.35 + sum(Object.values(b.equip), () => 6)) * S.eco.priceLevel); }
function midMonth(info) {
  const t = ymd(S.day);
  if (S.tax.ivaDue > 0) {
    cashMove(-S.tax.ivaDue, 'iva', null, 'IVA del mese precedente');
    log(`Versata l'IVA del mese precedente: ${eur(S.tax.ivaDue)}.`, 'info');
    S.tax.ivaDue = 0;
  }
  if (t.m === 5 || t.m === 11) {
    let imu = 0;
    for (const p of S.props) imu += p.value * 0.0062 / 2;
    if (imu > 0) { cashMove(-imu, 'imposte_varie', null, 'IMU immobili'); log(`Pagata la rata IMU sugli immobili: ${eur(imu)}.`, 'info'); }
  }
  void info;
}
function tredicesima() {
  let tot = 0;
  const y0 = dayFromYMD(ymd(S.day).y, 0, 1);
  for (const e of Object.values(S.emps)) {
    const months = clamp((S.day - Math.max(y0, e.hired)) / 30.4, 0, 12);
    const g = empMonthlyCost(e) * Math.min(1, e.wdays.filter(Boolean).length * e.hours / 40) * months / 12;
    if (g <= 0) continue;
    const bz = e.biz === 'hq' ? null : e.biz;
    cashMove(-g, 'stipendi', bz, empLbl(e) + ' (13ª)'); cashMove(-g * 0.3, 'contributi', bz, empLbl(e) + ' (13ª)');
    tot += g * 1.3;
  }
  if (tot > 0) log(`Pagata la tredicesima ai dipendenti: ${eur(tot)} (contributi inclusi).`, 'info');
}

// ---------- mercato e concorrenti ----------
function weeklyMarket(info) {
  const diff = DIFFICULTY[S.meta.difficulty];
  const myKeys = new Set(S.biz.map(b => b.city + '|' + b.district + '|' + b.type));
  const byKey = {};
  for (const c of S.comps) (byKey[c.city + '|' + c.district + '|' + c.type] = byKey[c.city + '|' + c.district + '|' + c.type] || []).push(c);
  for (const key in byKey) {
    const list = byKey[key];
    const mine = S.biz.filter(b => b.city + '|' + b.district + '|' + b.type === key && b.status === 'open');
    const total = sum(list, c => attract(c.rep, c.q, c.pi, c.aw)) + sum(mine, b => attract(b.rep, b.lastQ || 55, priceIndexOf(b, info), effAw(b))) + 0.35;
    for (const c of list) {
      const share = attract(c.rep, c.q, c.pi, c.aw) / total;
      const fair = 1 / (list.length + mine.length + 0.5);
      c.health = clamp(c.health + (share / fair - 0.75) * 0.03 + gauss(0, 0.02), -0.2, 1.2);
      c.rep = clamp(c.rep + gauss(0, 1), 10, 95);
      c.aw = clamp(c.aw + gauss(0, 1), 5, 95);
      if (mine.length && share < fair * 0.8 && chance(0.25 * diff.compAggr)) {
        if (chance(0.5)) c.pi = round2(clamp(c.pi - 0.03, 0.7, 1.5));
        else { c.q = clamp(c.q + 2, 10, 95); c.aw = clamp(c.aw + 4, 5, 95); }
      } else if (share > fair * 1.3 && chance(0.2)) c.pi = round2(clamp(c.pi + 0.02, 0.7, 1.5));
    }
  }
  // chiusure
  const closing = S.comps.filter(c => c.health < 0);
  for (const c of closing) {
    const k = c.city + '|' + c.district + '|' + c.type;
    if (myKeys.has(k) && !c.owner && chance(0.5)) {
      queueEvent({ type: 'acquisizione_concorrente', comp: c.id, title: 'Concorrente in vendita', text: `${c.name} (${BUSINESS_TYPES[c.type].name}, ${CITY[c.city].name} - ${DISTRICT[c.district].name}) è in difficoltà e il titolare vuole cedere l'attività per ${eur(compPrice(c))}. Riceveresti locale, attrezzature e clientela (reputazione ${Math.round(c.rep)}).`, opts: ['Acquista', 'Lascia chiudere'], important: true });
      c.health = 0.05;
    } else {
      S.comps = S.comps.filter(x => x !== c);
      if (myKeys.has(k)) log(`Il concorrente ${c.name} (${CITY[c.city].name}, ${DISTRICT[c.district].name}) ha chiuso.`, 'good');
    }
  }
  // aperture
  for (const b of S.biz) {
    const T = bizType(b);
    if (T.mode !== 'shop' || b.status !== 'open') continue;
    const r = recentDaily(28, b.id);
    const prof = r.days ? r.profit / r.days : 0;
    if (chance((prof > 150 ? 0.035 : 0.012) * diff.compAggr)) {
      const c = makeCompetitor(b.type, b.city, b.district, null);
      c.q = clamp(c.q + 5, 10, 95); c.aw = 35;
      S.comps.push(c);
      queueEvent({ type: 'info', title: 'Nuovo concorrente', text: `Ha aperto "${c.name}" nella stessa zona di ${b.name}: qualità ${c.q}, prezzi ${c.pi > 1 ? 'sopra' : 'sotto'} la media. Aspettati meno clienti.`, opts: ['Capito'], biz: b.id });
    }
  }
  // nuovi concorrenti nel resto del mercato per mantenere il mondo vivo
  if (chance(0.5)) {
    const city = pick(CITIES), d = pick(DISTRICTS), types = Object.values(BUSINESS_TYPES).filter(x => x.mode === 'shop');
    const tp = pick(types);
    if (compsIn(city.id, d.id, tp.id).length < 4) S.comps.push(makeCompetitor(tp.id, city.id, d.id, null));
  }
}
function compPrice(c) {
  const T = BUSINESS_TYPES[c.type];
  return Math.round((sum(T.equip.filter(e => e.req), e => e.cost) * 0.7 + T.license + c.rep * 250 * DISTRICT[c.district].foot) * S.eco.priceLevel / 100) * 100;
}

// ---------- fallimento ----------
function bankruptcyCheck() {
  const limit = S.overdraft.limit;
  if (S.cash < -limit) {
    S.credit.overDays++;
    S.credit.lateDays += 1;
    const d = S.credit.overDays;
    if (d === 1) queueEvent({ type: 'info', title: 'Conto in sconfinamento', text: `La liquidità (${eur(S.cash)}) ha superato il fido disponibile (${eur(limit)}). Se la situazione non rientra entro 30 giorni l'impresa fallirà. Valuta un prestito, la vendita di beni o il taglio dei costi.`, opts: ['Capito'], important: true });
    if (d === 15) queueEvent({ type: 'info', title: 'Ultimo avviso della banca', text: `Sei in sconfinamento da 15 giorni. Mancano 15 giorni all'istanza di fallimento.`, opts: ['Capito'], important: true });
    if (d >= 30) {
      S.over = true;
      log('La banca ha chiesto il fallimento: la tua impresa è stata dichiarata fallita.', 'bad');
    }
  } else S.credit.overDays = 0;
}

// ---------- avanzamento ----------
/** avanza di n giorni; si ferma su eventi importanti. ritorna giorni effettivi */
function advanceDays(n) {
  let done = 0;
  for (let i = 0; i < n; i++) {
    if (S.over) break;
    simulateDay();
    done++;
    if (S.events.length) break;
  }
  return done;
}
function autoManagedEvent(e) { return e.minor && e.biz && autoManaged(e.biz); }
