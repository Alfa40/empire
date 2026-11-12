// Bilanciamento: simula N partite di un anno per ogni attività e riassume i risultati.
// node tools/balance.js [N=6] [giorni=365] [tipo1,tipo2,...]
const fs = require('fs'), path = require('path'), vm = require('vm');
const files = ['util', 'calendar', 'data', 'state', 'finance', 'business', 'sim', 'shifts', 'advisor', 'events', 'people'];
const code = files.map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8')).join('\n;\n');
const store = {};
const ctx = { ACT: {}, console, Intl, Math, Date, JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } } };
vm.createContext(ctx);
vm.runInContext(code + `
;globalThis.BT = BUSINESS_TYPES; globalThis.__run = function(type, city, district, days, staffPlan){
  newGame({player:'Test', company:'Test SRL', difficulty:'normale', legal:'ditta'}); S.cash += 1500000;
  const L = rentListings(city, district, type)[1];
  const r = openBusiness({type, city, district, listing:L, name:'Test '+type});
  if (r.err) throw new Error(type + ': ' + r.err);
  const b = r.b, T = BUSINESS_TYPES[type];
  for (const e of T.equip) if (e.req) buyEquipment(b, e.cat, 0, false);
  for (const [role, n, hours] of staffPlan) for (let i=0;i<n;i++){
    const c = makePerson(role, city, 0); c.id = uid('c'); c.city = city;
    const open=[0,1,2,3,4,5,6].filter(j=>b.days[j]); const w=[0,0,0,0,0,0,0]; for(let k=0;k<Math.min(5,open.length);k++) w[open[(k+i*2)%open.length]]=1;
    hireCandidate(c, b.id, {wage: c.expected, contract:'indeterminato', hours: hours||8, wdays: w});
  }
  autoShifts(b);
  const mats = T.mode === 'shop' ? T.materials : Object.keys(T.outputs[b.output].in);
  const restock = () => { for (const m of mats) { const s = suggestRestock(b, m); if (s.target>0) b.restock[m] = {on:true, min:s.min, target:s.target, sup:m+'_std'}; } };
  restock(); for (const m of mats) if (b.restock[m]) placeOrder(b, m, m+'_std', b.restock[m].target, false);
  if (T.mode === 'production') b.wholesale = Object.assign(b.wholesale || {}, {on:true});
  const start = S.cash, cash0 = S.cash;
  const months = []; let lastMk = monthKey(S.day), failed = false;
  for (let d=0; d<days; d++){
    simulateDay();
    while (S.events.length) resolveEvent(S.events[0], S.events[0].auto != null ? S.events[0].auto : S.events[0].opts.length-1, true);
    if (d % 30 === 15) restock();
    const mk = monthKey(S.day);
    if (mk !== lastMk) { months.push(Math.round(monthPL(lastMk, b.id).profit)); lastMk = mk; }
    if (S.over) { failed = true; break; }
  }
  const h = b.hist;
  const pl = periodPL(lastMonthKeys(13), b.id);
  return { months, failed, rev: Math.round(pl.rev), profit: Math.round(pl.profit), lines: pl.lines,
    cust: Math.round(avg(h, x=>x.cust||0)), lost: Math.round(avg(h, x=>x.lost||0)), prod: Math.round(avg(h, x=>x.prod||0)),
    stock: Math.round(inventoryValue(b)), invest: Math.round(cash0 - start), m2: b.m2, rent: L.rent, comps: compsIn(city, district, type).length };
};`, ctx);

const PLANS = {
  bar: [['barista', 3]], panetteria: [['fornaio', 2], ['commesso', 1]], lavanderia: [['lavanderia', 1], ['commesso', 1]],
  ristorante: [['cuoco', 2], ['cameriere', 2]], pizzeria: [['pizzaiolo', 2], ['cameriere', 2]], gelateria: [['gelatiere', 2], ['commesso', 1]],
  minimarket: [['commesso', 3]], abbigliamento: [['commesso', 2]], parrucchiere: [['parrucchiere', 2]],
  palestra: [['istruttore', 2], ['receptionist', 1]], officina: [['meccanico', 2]], hotel: [['receptionist', 2], ['pulizie', 2], ['cameriere', 1]],
  mulino: [['operaio', 1]], torrefazione: [['operaio', 1]], agricola: [['agricolo', 1]], caseificio: [['operaio', 1]], pastificio: [['operaio', 1]],
  forno_industriale: [['fornaio', 1]], laboratorio_tessile: [['operaio', 3]], birrificio: [['operaio', 1]], salumificio: [['operaio', 1]],
};
const N = +(process.argv[2] || 6), days = +(process.argv[3] || 365);
const types = process.argv[4] ? process.argv[4].split(',') : Object.keys(PLANS);
const cities = ['torino', 'milano', 'bologna', 'napoli', 'bari', 'verona'];
const k = x => Math.round(x / 1000);
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
for (const t of types) {
  const prod = ctx.BT[t].mode === 'production';
  const runs = [];
  for (let i = 0; i < N; i++) runs.push(ctx.__run(t, cities[i % cities.length], prod ? 'industriale' : 'semicentro', days, PLANS[t]));
  const P = runs.map(r => r.profit), R = runs.map(r => r.rev);
  const L = {}; for (const r of runs) for (const [kk, v] of Object.entries(r.lines)) L[kk] = (L[kk] || 0) + v / N;
  const pct = kk => Math.round(-100 * (L[kk] || 0) / ((L.vendite || 0) + (L.ingrosso || 0) || 1));
  console.log(t.padEnd(19), 'utile/anno k€ med', String(k(med(P))).padStart(4), 'min', String(k(Math.min(...P))).padStart(4), 'max', String(k(Math.max(...P))).padStart(4),
    '| ricavi', String(k(med(R))).padStart(4), '| marg', String(Math.round(100 * med(P) / Math.max(1, med(R)))).padStart(3) + '%',
    '| mat', pct('materiali') + '% pers', (pct('stipendi') + pct('contributi')) + '% aff', pct('affitto') + '%',
    '| falliti', runs.filter(r => r.failed).length, '| magazz k€', k(med(runs.map(r => r.stock))),
    prod ? '' : '| clienti ' + med(runs.map(r => r.cust)) + ' persi ' + med(runs.map(r => r.lost)));
  if (process.env.V) for (const r of runs) console.log('   ', r.months.map(k).join(' '), 'comps', r.comps);
}
