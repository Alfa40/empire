'use strict';
/* ============================================================
   EMPIRE - gestione attività: apertura, attrezzature, prodotti,
   magazzino, ordini, personale
   ============================================================ */

// ---------- Locali disponibili ----------
function rentListings(cityId, districtId, typeId) {
  const T = BUSINESS_TYPES[typeId], city = CITY[cityId], d = DISTRICT[districtId];
  const r = hrng(hashStr(cityId + districtId + typeId + monthKey(S.day)));
  const out = [];
  const idx = S.market.index[cityId] || 1;
  const sizes = [0.75, 1, 1.35, 1.8];
  for (let i = 0; i < 4; i++) {
    const m2 = Math.round(T.size * sizes[i] * (0.9 + r() * 0.2));
    const perM2 = city.rentM2 * d.rent * idx * (T.rentFactor || (T.mode === 'production' ? 0.55 : 1)) * (0.85 + r() * 0.3);
    const rent = Math.round(m2 * perM2 / 10) * 10;
    const condition = r() < 0.3 ? 'da ristrutturare' : r() < 0.7 ? 'buono' : 'ottimo';
    const id = `R${cityId}${districtId}${typeId}${monthKey(S.day)}${i}`;
    out.push({ id, m2, rent, condition, deposit: rent * 3, agency: Math.round(rent * 0.8) });
  }
  return out;
}

function districtAllowed(typeId, districtId) {
  const T = BUSINESS_TYPES[typeId];
  if (T.mode === 'production') return districtId === 'industriale' || districtId === 'periferia';
  return true;
}

/** Costi di apertura stimati */
function openingCost(typeId, listing, ownProp) {
  const T = BUSINESS_TYPES[typeId];
  const reqEq = T.equip.filter(e => e.req);
  const eqCost = sum(reqEq, e => e.cost);
  const rentPart = ownProp ? 0 : listing.deposit + listing.rent + listing.agency;
  const renov = listing && listing.condition === 'da ristrutturare' ? Math.round(Math.min(listing.m2, 400) * 90) : 0;
  return { license: T.license, rentPart, eqCost, renov, total: T.license + rentPart + renov };
}

function openBusiness(o) {
  // o: {type, city, district, listing, propId, name}
  const T = BUSINESS_TYPES[o.type];
  const prop = o.propId ? S.props.find(p => p.id === o.propId) : null;
  const L = o.listing;
  const cost = openingCost(o.type, L, !!prop);
  if (S.cash < cost.total) return { err: 'Liquidità insufficiente.' };
  const b = {
    id: uid('b'), name: o.name || T.name, type: o.type, city: o.city, district: o.district, brand: o.brand || null,
    m2: prop ? prop.m2 : L.m2, rent: prop ? 0 : L.rent, propId: prop ? prop.id : null, deposit: prop ? 0 : L.deposit,
    status: 'setup', opened: S.day, created: S.day,
    hours: T.hours ? [...T.hours] : [8, 17], days: [...T.days], closures: [],
    equip: {}, upg: {}, products: [], inv: {}, restock: {},
    aw: 18, rep: 50, sat: 60, mkBudget: 0, insurance: false, discount: 0,
    hist: [], reviews: [], today: null, license: T.license, wear: 0,
  };
  if (T.mode === 'shop') {
    b.products = T.products.filter(p => !p.lock || hasResearch(p.lock)).map(p => productFromTemplate(p, b));
  } else {
    b.output = Object.keys(T.outputs)[0];
    b.prodTarget = 0;
    b.wholesale = { on: true, price: null, reserve: 0 };
  }
  if (prop) prop.biz = b.id;
  expense(T.license, 0, 'licenze', b.id, 'Licenze di apertura');
  if (!prop) {
    cashMove(-L.deposit, 'cauzioni', b.id, 'Deposito cauzionale');
    expense(L.rent, 0.22, 'affitto', b.id, 'Primo affitto');
    expense(L.agency, 0.22, 'consulenze', b.id, 'Agenzia immobiliare');
  }
  if (cost.renov) { expense(cost.renov, 0.10, 'investimenti', b.id, 'Lavori di sistemazione'); addAsset(cost.renov, 8, 'Lavori di sistemazione', b.id); }
  b.paidRentMonth = monthKey(S.day);
  S.biz.push(b);
  log(`Hai aperto "${b.name}" (${T.name}) a ${CITY[b.city].name}, ${DISTRICT[b.district].name}.`, 'good', b.id);
  unlockAch('prima_attivita');
  return { b };
}

function productFromTemplate(p, b) {
  const prod = { id: uid('p'), tpl: p.id, name: p.n, r: Object.assign({}, p.r), price: p.p, on: true, role: p.role, min: p.min };
  if (b) { const ref = refPrice(b, prod); prod.price = ref >= 10 ? Math.round(ref * 2) / 2 : Math.round(ref * 10) / 10; }
  return prod;
}
function tplOf(b, prod) { return bizType(b).products.find(p => p.id === prod.tpl); }
function refPrice(b, prod) {
  const t = tplOf(b, prod);
  // il prezzo di riferimento cresce con la "ricchezza" della ricetta rispetto all'originale
  const baseCost = recipeCost(t.r), myCost = recipeCost(prod.r);
  const richness = baseCost > 0 ? clamp(myCost / baseCost, 0.5, 2.5) : 1;
  const city = CITY[b.city], d = DISTRICT[b.district];
  return t.p * Math.pow(richness, 0.55) * (0.6 + 0.4 * city.wealth * d.wealth) * S.eco.priceLevel;
}
function recipeCost(r) { let c = 0; for (const m in r) c += r[m] * MATERIALS[m].price * S.eco.priceLevel; return c; }

// ---------- Attrezzature ----------
function equipDef(b, cat) { return bizType(b).equip.find(e => e.cat === cat); }
function equipCost(def, tier) { return Math.round(def.cost * TIER_COST[tier] * S.eco.priceLevel / 10) * 10; }
function buyEquipment(b, cat, tier, leasing) {
  const def = equipDef(b, cat);
  const cost = equipCost(def, tier);
  const cur = b.equip[cat];
  if (cur && cur.tier >= tier && !cur.broken) return { err: 'Hai già un\'attrezzatura di livello pari o superiore.' };
  if (!leasing && S.cash < cost * 1.22) return { err: 'Liquidità insufficiente.' };
  let resale = 0;
  if (cur) {
    const bookV = removeAsset(cur.asset);
    resale = Math.round(cost / TIER_COST[tier] * TIER_COST[cur.tier] * 0.25 * (cur.cond / 100));
    if (resale > 0) income(resale * 1.22, 0.22, 'altri_ricavi', b.id, 'Usato ' + def.n);
    if (bookV > 0) bookOnly('minusvalenze', -bookV, b.id, 'Sostituzione ' + def.n);
  }
  let assetId;
  if (leasing) {
    takeLoan('locale', 'leasing', cost, 48, { label: def.n, biz: b.id, noCash: true });
    S.tax.ivaCredit += hasIva() ? cost * 0.22 : 0;
    assetId = addAsset(cost, 6, def.n, b.id);
  } else {
    expense(cost, 0.22, 'investimenti', b.id, def.n);
    assetId = addAsset(hasIva() ? cost : cost * 1.22, 6, def.n, b.id);
  }
  b.equip[cat] = { tier, cond: 100, bought: S.day, asset: assetId, broken: false };
  checkReady(b);
  return { ok: true, resale };
}
function repairEquipment(b, cat) {
  const e = b.equip[cat]; if (!e) return { err: 'Non presente' };
  const def = equipDef(b, cat);
  const cost = Math.round(equipCost(def, e.tier) * (e.broken ? 0.18 : 0.1) * (1 - e.cond / 150));
  if (S.cash < cost) return { err: 'Liquidità insufficiente.' };
  expense(cost, 0.22, 'manutenzione', b.id, 'Riparazione ' + def.n);
  e.broken = false; e.cond = Math.min(100, Math.max(e.cond, 85));
  return { ok: true, cost };
}
function repairCost(b, cat) {
  const e = b.equip[cat]; const def = equipDef(b, cat);
  return Math.round(equipCost(def, e.tier) * (e.broken ? 0.18 : 0.1) * (1 - e.cond / 150));
}
function missingRequired(b) {
  return bizType(b).equip.filter(e => e.req && (!b.equip[e.cat])).map(e => e.n);
}
function checkReady(b) {
  if (b.status === 'setup' && missingRequired(b).length === 0 && empsOf(b.id).length > 0) {
    b.status = 'open';
    b.opened = S.day;
    log(`"${b.name}" è pronta ad aprire al pubblico!`, 'good', b.id);
  }
}

// ---------- Miglioramenti ----------
function upgradeAllowed(b, u) {
  const T = bizType(b);
  if (u.notIn && b.district === u.notIn) return false;
  if (u.for === 'all') return true;
  if (u.for === 'shop') return T.mode === 'shop';
  if (u.for === 'production') return T.mode === 'production';
  if (Array.isArray(u.for)) return u.for.includes(b.type);
  return T.tags.includes(u.for);
}
function upgradeCost(b, u) { const m2 = Math.min(b.m2, bizType(b).mode === 'production' ? 1200 : 2000); return Math.round((u.cost + (u.m2 || 0) * m2) * S.eco.priceLevel / 10) * 10; }
function buyUpgrade(b, uId) {
  const u = UPGRADE[uId];
  if (b.upg[uId]) return { err: 'Già installato.' };
  const cost = upgradeCost(b, u);
  if (S.cash < cost * 1.22) return { err: 'Liquidità insufficiente.' };
  if (cost > 0) { expense(cost, 0.22, 'investimenti', b.id, u.n); addAsset(hasIva() ? cost : cost * 1.22, uId === 'ristrutturazione' || uId === 'ampliamento' ? 10 : 5, u.n, b.id); }
  b.upg[uId] = S.day;
  if (u.fx.size) {
    b.m2 = Math.round(b.m2 * u.fx.size);
    if (!b.propId) b.rent = Math.round(b.rent * u.fx.size);
    else { const p = S.props.find(x => x.id === b.propId); if (p) { p.m2 = b.m2; p.value = Math.round(p.value * 1.2); } }
  }
  log(`Installato "${u.n}" presso ${b.name}.`, 'good', b.id);
  return { ok: true };
}
function removeUpgrade(b, uId) { delete b.upg[uId]; }

// ---------- Modificatori aggregati ----------
function bizMods(b) {
  const T = bizType(b);
  const m = { demand: 1, speed: 1, phys: 1, quality: 0, sat: 0, shelf: 1, energy: 1, waste: 1, wear: 1, theft: 1, commission: 0, monthly: 0, prodCap: 1, wholesale: 1, heatProof: false, blackout: false, dehors: false, weekend: 1, fastShip: false };
  for (const id in b.upg) {
    const u = UPGRADE[id]; if (!u) continue; const f = u.fx;
    if (f.demand) m.demand *= f.demand;
    if (f.speed) m.speed *= f.speed;
    if (f.quality) m.quality += f.quality;
    if (f.sat) m.sat += f.sat;
    if (f.shelf) m.shelf *= f.shelf;
    if (f.energy) m.energy *= f.energy;
    if (f.waste) m.waste *= f.waste;
    if (f.wear) m.wear *= f.wear;
    if (f.theft) m.theft *= f.theft;
    if (f.commission) m.commission += f.commission;
    if (f.prodCap) m.prodCap *= f.prodCap;
    if (f.wholesale) m.wholesale *= f.wholesale;
    if (f.weekend) m.weekend *= f.weekend;
    if (f.heatProof) m.heatProof = true;
    if (f.blackout) m.blackout = true;
    if (f.dehors) m.dehors = true;
    if (f.fastShip) m.fastShip = true;
    m.monthly += (u.monthly || 0);
  }
  for (const e of T.equip) {
    const own = b.equip[e.cat];
    if (!own) continue;
    const fx = e.fx || TIER_FX[e.kind];
    const factor = own.broken ? (e.kind === 'quality' ? 0 : e.kind === 'prod' ? 0 : 0.6) : 1;
    if (e.kind === 'speed') m.speed *= own.broken ? 0.75 : fx[own.tier];
    else if (e.kind === 'phys') m.phys *= own.broken ? 0.5 : fx[own.tier];
    else if (e.kind === 'quality') m.quality += factor * (e.fx ? e.fx[own.tier] : TIER_FX.quality[own.tier]);
  }
  if (hasResearch('energia')) m.energy *= 0.85;
  if (hasResearch('scorte')) m.waste *= 0.7;
  if (hasResearch('qualita')) m.quality += 4;
  if (hasResearch('automazione_r')) m.prodCap *= 1.2;
  return m;
}

// ---------- Magazzino ----------
function stockOf(b, mat) { return sum(b.inv[mat] || [], l => l.q); }
function stockQuality(b, mat) {
  const lots = b.inv[mat] || []; const q = sum(lots, l => l.q);
  return q > 0 ? sum(lots, l => l.q * l.ql) / q : 0;
}
function addStock(b, mat, qty, quality, unitCost, shelfMult = 1) {
  const M = MATERIALS[mat];
  const exp = M.shelf ? S.day + Math.max(1, Math.round(M.shelf * shelfMult)) : 0;
  const lots = b.inv[mat] || (b.inv[mat] = []);
  const same = lots.find(l => l.exp === exp && Math.abs(l.ql - quality) < 1);
  if (same) { same.c = (same.c * same.q + unitCost * qty) / (same.q + qty); same.q += qty; }
  else lots.push({ q: qty, ql: quality, c: unitCost, exp });
  lots.sort((a, b2) => (a.exp || 1e9) - (b2.exp || 1e9));
}
/** preleva qty (FIFO); ritorna {taken, quality, cost} */
function takeStock(b, mat, qty) {
  const lots = b.inv[mat] || [];
  let need = qty, qsum = 0, csum = 0, taken = 0;
  while (need > 1e-9 && lots.length) {
    const l = lots[0];
    const t = Math.min(l.q, need);
    l.q -= t; need -= t; taken += t; qsum += t * l.ql; csum += t * l.c;
    if (l.q <= 1e-9) lots.shift();
  }
  return { taken, quality: taken ? qsum / taken : 0, cost: csum };
}
function expireStock(b, mods) {
  let waste = 0;
  for (const mat in b.inv) {
    const lots = b.inv[mat];
    for (let i = lots.length - 1; i >= 0; i--) {
      const l = lots[i];
      if (l.exp && l.exp < S.day) {
        // il gestionale/ricerca riducono lo spreco: parte della merce viene rimessa in vendita/usata prima
        const lost = l.q * mods.waste;
        waste += lost * l.c;
        lots.splice(i, 1);
      }
    }
  }
  return waste;
}

// ---------- Fornitori e ordini ----------
function materialPrice(mat, sup) {
  let p = MATERIALS[mat].price * sup.mult * S.eco.priceLevel * effectMult('matPrice', ['global', 'mat:' + mat]);
  if (hasResearch('logistica_r')) p *= 0.96;
  return round2(p * 100) / 100;
}
function internalSuppliers(b, mat) {
  return S.biz.filter(x => x.id !== b.id && bizType(x).mode === 'production' && x.output === mat && x.status === 'open').map(x => {
    const sameCity = x.city === b.city || bizMods(x).fastShip;
    return { id: 'int_' + x.id, internal: x.id, name: 'Interno: ' + x.name, tierName: 'Tua produzione', q: Math.round(stockQuality(x, mat) || 60), days: sameCity ? 1 : 2, rel: 1, stock: stockOf(x, mat), unit: transferPrice(x, mat) * (sameCity ? 1.0 : 1.04) };
  });
}
function transferPrice(prodBiz, mat) {
  const c = prodBiz.unitCost || MATERIALS[mat].price * 0.7;
  return round2(c * 1.05 * 100) / 100;
}
function placeOrder(b, mat, supId, qty, auto) {
  qty = Math.round(qty * 100) / 100;
  if (qty <= 0) return { err: 'Quantità non valida.' };
  if (supId.startsWith('int_')) {
    const src = getBiz(supId.slice(4));
    if (!src) return { err: 'Fornitore interno non disponibile.' };
    const s = internalSuppliers(b, mat).find(x => x.id === supId);
    const avail = stockOf(src, mat) - 0;
    if (avail < qty) return { err: `Scorte insufficienti presso ${src.name} (disponibili ${num1(avail)}).` };
    const t = takeStock(src, mat, qty);
    const value = round2(s.unit * qty);
    // ricavo per il produttore, costo per l'acquirente (nessuna IVA tra attività della stessa impresa)
    bookOnly('interni', value, src.id, MATERIALS[mat].name + ' → ' + b.name); bookOnly('materiali', -value, b.id, MATERIALS[mat].name + ' (da ' + src.name + ')');
    src.today && (src.today.internal = (src.today.internal || 0) + value);
    S.orders.push({ id: uid('o'), biz: b.id, mat, qty, q: t.quality, unit: s.unit, arrive: S.day + s.days, sup: s.name, internal: src.id, auto: !!auto });
    unlockAch('filiera');
    return { ok: true, total: value };
  }
  const sup = suppliersFor(mat).find(x => x.id === supId);
  const unit = materialPrice(mat, sup);
  const total = unit * qty;
  if (!auto && S.cash < total * 1.22) return { err: 'Liquidità insufficiente.' };
  const paid = expense(total, MATERIALS[mat].iva, 'materiali', b.id, MATERIALS[mat].name);
  let days = sup.days;
  const rel = hasResearch('logistica_r') ? Math.min(0.995, sup.rel + 0.03) : sup.rel;
  let late = false;
  if (!chance(rel * effectMult('reliability', ['global']))) { days += rint(1, 3); late = true; }
  S.orders.push({ id: uid('o'), biz: b.id, mat, qty, q: sup.q, unit, arrive: S.day + days, sup: sup.name, auto: !!auto, late, paid: total });
  return { ok: true, total: paid };
}
function processDeliveries() {
  const keep = [];
  for (const o of S.orders) {
    if (o.arrive > S.day) { keep.push(o); continue; }
    const b = getBiz(o.biz);
    if (!b) continue;
    const mods = bizMods(b);
    addStock(b, o.mat, o.qty, o.q, o.unit, mods.shelf);
    if (o.late && !o.auto) log(`Consegna di ${MATERIALS[o.mat].name} arrivata in ritardo presso ${b.name}.`, 'info', b.id);
  }
  S.orders = keep;
}
function incoming(b, mat) { return sum(S.orders.filter(o => o.biz === b.id && o.mat === mat), o => o.qty); }

/** consumo medio giornaliero degli ultimi 14 giorni */
function avgUsage(b, mat) {
  const h = b.hist.slice(-14);
  if (!h.length) return 0;
  return sum(h, x => (x.use && x.use[mat]) || 0) / h.length;
}
function autoRestock(b) {
  for (const mat in b.restock) {
    const r = b.restock[mat];
    if (!r || !r.on) continue;
    const have = stockOf(b, mat) + incoming(b, mat);
    if (have > r.min) continue;
    let qty = Math.max(0, r.target - have);
    const M = MATERIALS[mat];
    if (M.shelf && M.shelf < 15) {
      // per i freschi non ordinare più di quanto si consuma prima della scadenza
      const use = avgUsage(b, mat);
      if (use > 0) qty = Math.min(qty, use * Math.max(1, M.shelf * 0.7));
    }
    if (qty <= 0) continue;
    if (M.unit === 'pz' || M.unit === 'bott' || M.unit === 'kit') qty = Math.ceil(qty);
    let sup = r.sup || (mat + '_std');
    if (sup.startsWith('int_')) {
      const src = getBiz(sup.slice(4));
      if (!src || stockOf(src, mat) < qty) {
        if (src && stockOf(src, mat) > 1) qty = Math.floor(stockOf(src, mat) * 0.9);
        else sup = mat + '_std';
      }
    }
    if (qty > 0) placeOrder(b, mat, sup, qty, true);
  }
}
/** imposta un riordino automatico consigliato su tutti i materiali */
function suggestRestock(b, mat, customers) {
  const T = bizType(b);
  let daily = avgUsage(b, mat);
  if (!daily) {
    if (T.mode === 'shop') {
      const c = customers || estimateCustomers(b);
      for (const p of b.products) if (p.on && p.r[mat]) { const t = tplOf(b, p); daily += c * t.a * p.r[mat] / Math.max(1, b.products.filter(x => x.on && x.tpl === p.tpl).length); }
    } else {
      const o = T.outputs[b.output];
      if (o.in[mat]) daily = o.in[mat] * estimateProduction(b);
    }
  }
  const M = MATERIALS[mat];
  const cover = M.shelf && M.shelf < 10 ? Math.max(1.5, M.shelf * 0.4) : M.shelf && M.shelf < 40 ? 4 : 7;
  return { min: Math.ceil(daily * Math.min(cover * 0.5, 3)), target: Math.ceil(daily * cover) };
}

// ---------- Personale ----------
function empName(e) { return e.first + ' ' + e.last; }
function weeklyHours(e) { return e.hours * e.wdays.filter(Boolean).length; }
function empMonthlyCost(e) {
  const h = weeklyHours(e);
  const base = e.wage * Math.min(h, 40) / 40;
  const extra = e.wage / 40 * Math.max(0, h - 40) * 1.25;
  return base + extra;
}
function hireCandidate(cand, bizId, offer) {
  // offer: {wage, contract, hours, wdays, months}
  const accept = offer.wage >= cand.expected ? 1 : offer.wage >= cand.expected * 0.92 ? 0.55 : offer.wage >= cand.expected * 0.85 ? 0.2 : 0;
  let p = accept;
  if (offer.contract === 'determinato' || offer.contract === 'stagionale') p *= 0.9;
  if (!chance(p)) {
    cand.refused = (cand.refused || 0) + 1;
    return { err: `${cand.first} ha rifiutato l'offerta: si aspettava almeno ${eur(cand.expected)} lordi al mese.` };
  }
  const e = Object.assign({}, cand);
  e.id = uid('e');
  e.biz = bizId;
  e.wage = offer.wage;
  e.contract = offer.contract;
  e.end = offer.contract === 'determinato' || offer.contract === 'stagionale' ? addMonths(S.day, offer.months || 12) : (offer.contract === 'apprendistato' ? addMonths(S.day, 36) : null);
  e.hours = offer.hours || 8;
  e.wdays = offer.wdays || [1, 1, 1, 1, 1, 0, 0];
  e.start = offer.start != null ? +offer.start : (bizId === 'hq' ? 9 : suggestStart(getBiz(bizId), e.role, e.hours));
  e.hired = S.day; e.fatigue = 10; e.exp = 0; e.holidays = 26 * (12 - ymd(S.day).m) / 12; e.tfr = 0;
  e.sickUntil = 0; e.holidayUntil = 0; e.trainUntil = 0; e.monthExtra = 0; e.consec = 0; e.lastRaise = S.day;
  e.city = cand.city;
  delete e.expected; delete e.refused;
  S.emps[e.id] = e;
  for (const c in S.candidates) S.candidates[c] = S.candidates[c].filter(x => x.id !== cand.id);
  const b = getBiz(bizId);
  if (b) checkReady(b);
  log(`Hai assunto ${empName(e)} come ${ROLES[e.role].name}${b ? ' presso ' + b.name : ' in sede'}.`, 'good', bizId);
  unlockAch('primo_dipendente');
  return { ok: true, e };
}
function fireEmployee(e, reason) {
  // liquidazione: TFR + preavviso (1 mese per indeterminato)
  const notice = e.contract === 'indeterminato' ? e.wage : e.contract === 'apprendistato' ? e.wage * 0.5 : 0;
  const tfr = e.tfr || 0;
  const prorata = proRataSalary(e);
  const fbz = e.biz === 'hq' ? null : e.biz, fl = empLbl(e);
  cashMove(-prorata, 'stipendi', fbz, fl);
  cashMove(-prorata * 0.3, 'contributi', fbz, fl);
  if (notice) { cashMove(-notice, 'stipendi', fbz, fl + ' (preavviso)'); cashMove(-notice * 0.3, 'contributi', fbz, fl + ' (preavviso)'); }
  if (tfr) cashMove(-tfr, 'tfr_pagato', null, fl);
  for (const o of Object.values(S.emps)) if (o.biz === e.biz && o.id !== e.id) o.morale = clamp(o.morale - (reason === 'licenziato' ? 4 : 1), 0, 100);
  delete S.emps[e.id];
  return { cost: prorata * 1.3 + notice * 1.3 + tfr };
}
function proRataSalary(e) {
  const t = ymd(S.day);
  const startOfMonth = dayFromYMD(t.y, t.m, 1);
  const from = Math.max(startOfMonth, e.hired);
  const days = S.day - from;
  return Math.max(0, empMonthlyCost(e) * days / t.dim + (e.monthExtra || 0));
}
function empStatus(e) {
  if (e.trainUntil > S.day) return 'In formazione';
  if (e.sickUntil > S.day) return 'In malattia';
  if (e.holidayUntil > S.day) return 'In ferie';
  return 'Attivo';
}
function empEff(e) {
  let eff = 0.45 + e.skill / 100 * 0.75;
  eff *= 0.75 + e.morale / 100 * 0.35;
  eff *= 1 - Math.max(0, e.fatigue - 40) / 150;
  for (const t of e.traits) if (TRAITS[t].eff) eff *= TRAITS[t].eff;
  if (e.contract === 'apprendistato') eff *= 0.9;
  return eff;
}
function isWorking(e, info) {
  if (e.trainUntil > S.day || e.sickUntil > S.day || e.holidayUntil > S.day) return false;
  return !!e.wdays[info.wd];
}
function startTraining(e, courseId) {
  const c = COURSES.find(x => x.id === courseId);
  let cost = c.cost * (hasResearch('formazione') ? 0.7 : 1);
  if (S.cash < cost) return { err: 'Liquidità insufficiente.' };
  if (c.min && e.skill < c.min) return { err: `Serve una competenza di almeno ${c.min}.` };
  if (e.skill >= c.max) return { err: 'Competenza già oltre il livello del corso.' };
  if (e.trainUntil > S.day) return { err: 'Già in formazione.' };
  expense(cost, 0.22, 'formazione', e.biz === 'hq' ? null : e.biz, c.n + ' · ' + e.first + ' ' + e.last);
  e.trainUntil = S.day + c.days;
  e.trainGain = c.skill * (hasResearch('formazione') ? 1.3 : 1);
  e.trainMorale = c.morale || 4;
  return { ok: true };
}
function hqCoverage(role, per) { return hqCount(role) * per; }

// ---------- Funzioni di gestione rapida (usate da interfaccia e consulente) ----------
function bizMaterials(b) {
  const T = bizType(b);
  const set = new Set();
  if (T.mode === 'shop') { for (const p of b.products) for (const m in p.r) set.add(m); }
  else { for (const o in T.outputs) for (const m in T.outputs[o].in) set.add(m); set.add(b.output); }
  for (const m in b.inv) if (stockOf(b, m) > 0) set.add(m);
  return [...set];
}
/** imposta il riordino automatico consigliato su tutti i materiali */
function restockAll(b) {
  for (const m of bizMaterials(b)) {
    if (bizType(b).mode === 'production' && m === b.output) continue;
    const s = suggestRestock(b, m);
    const r = b.restock[m] || {};
    b.restock[m] = { on: true, min: s.min, target: s.target, sup: r.sup || m + '_std' };
  }
}
/** ordina subito le scorte per N giorni */
function orderDays(b, days) {
  let tot = 0, n = 0;
  for (const m of bizMaterials(b)) {
    if (bizType(b).mode === 'production' && m === b.output) continue;
    const s = suggestRestock(b, m);
    const M = MATERIALS[m];
    const cover = M.shelf && M.shelf < 10 ? Math.max(1.5, M.shelf * 0.4) : M.shelf && M.shelf < 40 ? 4 : 7;
    let need = s.target / cover * days - stockOf(b, m) - incoming(b, m);
    if (need <= 0) continue;
    if (['pz', 'bott', 'kit'].includes(M.unit)) need = Math.ceil(need);
    const r = placeOrder(b, m, (b.restock[m] && b.restock[m].sup) || m + '_std', round2(need), false);
    if (r.err) return { err: r.err, n, tot };
    tot += r.total; n++;
  }
  return { n, tot };
}
/** allinea i prezzi al prezzo di riferimento della zona */
function alignPrices(b) {
  for (const p of b.products) { const ref = refPrice(b, p); p.price = ref >= 10 ? Math.round(ref * 2) / 2 : Math.round(ref * 10) / 10; }
}
