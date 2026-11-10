// Stress test dei sistemi avanzati: node tools/stress.js [giorni]
const fs = require('fs'), path = require('path'), vm = require('vm');
const files = ['util', 'calendar', 'data', 'state', 'finance', 'business', 'sim', 'shifts', 'advisor', 'events'];
const code = files.map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8')).join('\n;\n');
const store = {};
const ctx = { console, Intl, Math, Date, JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } } };
vm.createContext(ctx);
vm.runInContext(code + `
;globalThis.__stress = function(days){
  newGame({player:'Stress', company:'Stress SpA', difficulty:'normale', legal:'srl'});
  S.cash += 12000000;
  const fails = [];
  const check = (lbl, r) => { if (r && r.err) fails.push(lbl + ': ' + r.err); return r; };
  function setup(type, city, district){
    const L = rentListings(city, district, type)[1];
    const r = check('open '+type, openBusiness({type, city, district, listing:L, name: type+' '+city}));
    if (!r.b) return null;
    const b = r.b, T = BUSINESS_TYPES[type];
    for (const e of T.equip) if (e.req) check('eq', buyEquipment(b, e.cat, 1, false));
    const roles = T.mode === 'shop' ? [...new Set(T.products.map(p=>p.role))].concat(T.front?[T.front]:[]) : [T.role];
    for (const role of roles) for (let i=0;i<2;i++){ const c = makePerson(role, city, 10); c.id=uid('c'); c.city=city; hireCandidate(c, b.id, {wage:c.expected+300, contract:'indeterminato', hours:8, wdays: i? [0,0,1,1,1,1,1] : [1,1,1,1,1,0,0]}); }
    const m = makePerson('manager', city, 10); m.id=uid('c'); m.city=city; hireCandidate(m, b.id, {wage:m.expected+300, contract:'indeterminato', hours:8, wdays:[1,1,1,1,1,0,0]});
    for (const mat of T.materials){ const s = suggestRestock(b, mat, 120); b.restock[mat] = {on:true, min:Math.max(1,s.min), target:Math.max(2,s.target), sup: mat+'_std'}; placeOrder(b, mat, mat+'_std', Math.max(2,s.target), false); }
    for (const u of UPGRADES) if (upgradeAllowed(b,u) && Math.random()<0.4) check('upg', buyUpgrade(b, u.id));
    b.insurance = Math.random()<0.5;
    return b;
  }
  const shops = ['bar','panetteria','lavanderia','ristorante','pizzeria','gelateria','minimarket','abbigliamento','parrucchiere','palestra','officina','hotel'];
  const cities = ['milano','roma','napoli','torino','bologna','firenze','verona','bari','palermo','rimini'];
  let i = 0;
  for (const t of shops) { setup(t, cities[i%10], ['centro','semicentro','universita','periferia'][i%4]); i++; }
  const prods = ['agricola','mulino','torrefazione','caseificio','pastificio','forno_industriale','laboratorio_tessile','birrificio','salumificio'];
  for (const t of prods) setup(t, cities[i++%10], 'industriale');
  // filiera: bar e pizzeria si riforniscono internamente
  const torr = S.biz.find(b=>b.type==='torrefazione'); const bar = S.biz.find(b=>b.type==='bar');
  if (torr && bar) bar.restock.caffe.sup = 'int_' + torr.id;
  const cas = S.biz.find(b=>b.type==='caseificio'); const piz = S.biz.find(b=>b.type==='pizzeria');
  if (cas && piz) piz.restock.mozzarella.sup = 'int_' + cas.id;
  // sede
  for (const r of ['contabile','hr','marketer','areamanager','ricercatore']) { const c = makePerson(r,'milano',20); c.id=uid('c'); c.city='milano'; hireCandidate(c,'hq',{wage:c.expected+200, contract:'indeterminato', hours:8, wdays:[1,1,1,1,1,0,0]}); }
  // marchio
  S.brands.push({id:'br1', name:'Stress', aw:0}); for (const b of S.biz) if (bizType(b).mode==='shop') b.brand='br1';
  // immobili
  S.credit.score = 60; for (const c of ['milano','roma']) { const L = propListings(c)[0]; check('prop', buyProperty(L, 0.6, 20)); }
  if (S.props[0]) { S.props[0].rentOut = true; S.props[0].rentAsk = fairRent(S.props[0]); }
  // borsa
  check('stock', buyStock('ENER', 1000)); check('stock', buyStock('CAFI', 3100000));
  check('loan', takeLoan('nazionale','prestito', 100000, 60));
  S.overdraft.limit = 50000;
  let researched = 0;
  for (let d=0; d<days; d++){
    simulateDay();
    let guard=0;
    while (S.events.length && guard++<20) { const ev=S.events[0]; resolveEvent(ev, ev.auto!=null?ev.auto:(ev.type==='takeover'?0:ev.opts.length-1), true); }
    if (!S.research.active) { const R = RESEARCH.find(r=>!hasResearch(r.id) && (!r.req||r.req.every(hasResearch))); if (R) { const x = startResearch(R.id); if (!x.err) researched++; } }
    if (hasResearch('franchising') && !S.franchise.on && franchiseAvailable()) S.franchise = {on:true, brand:'br1', affiliates:0, fee:600, entry:18000};
    if (d===400 && S.meta.legal!=='spa') { S.meta.legal='spa'; }
    if (d===420 && !S.ipo && ipoRequirements().every(r=>r.ok)) doIPO(0.25);
    if (!isFinite(S.cash) || !isFinite(S.nw)) { fails.push('NaN at day '+d+' '+fmtDate(S.day)); break; }
    if (S.over) { fails.push('FALLITO giorno '+d); break; }
    if (d % 120 === 0) { saveGame(1); loadGame(1); }
  }
  const bs = balanceSheet();
  return { day: fmtDate(S.day), cash: Math.round(S.cash), nw: Math.round(S.nw), biz: S.biz.length, emps: Object.keys(S.emps).length, comps: S.comps.length, research: Object.keys(S.research.done).length, franchise: S.franchise, ipo: S.ipo && {price:S.ipo.price}, loans: S.loans.length, props: S.props.length, ach: Object.keys(S.ach).length, saveKB: Math.round(JSON.stringify(S).length/1024), fails: fails.slice(0,15), lines: Object.fromEntries(Object.entries(periodPL(lastMonthKeys(12)).lines).map(([k,v])=>[k,Math.round(v)])), pl: periodPL(lastMonthKeys(12)).profit|0, bs: Object.fromEntries(Object.entries(bs).map(([k,v])=>[k,Math.round(v)])), perBiz: S.biz.map(b=>[b.type, Math.round(recentDaily(90,b.id).profit), Math.round(inventoryValue(b)), Object.entries(b.inv).map(([m,l])=>m+':'+Math.round(sum(l,x=>x.q))).join(' ')]) };
};`, ctx);
const t0 = Date.now();
const r = ctx.__stress(+(process.argv[2] || 1095));
console.log(JSON.stringify(r, null, 1));
console.log('tempo', (Date.now() - t0) / 1000, 's');
