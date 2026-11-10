// Test headless della simulazione: node tools/simtest.js [tipo] [città] [quartiere] [giorni]
const fs = require('fs'), path = require('path'), vm = require('vm');
const files = ['util', 'calendar', 'data', 'state', 'finance', 'business', 'sim', 'shifts', 'advisor', 'events'];
let code = files.map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8')).join('\n;\n');
const store = {};
const ctx = { console, Intl, Math, Date, JSON, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } } };
vm.createContext(ctx);
code += `
;globalThis.__run = function(type, city, district, days, staffPlan){
  newGame({player:'Test', company:'Test SRL', difficulty:'normale', legal:'ditta'}); S.cash += (globalThis.EXTRA||0);
  const L = rentListings(city, district, type)[1];
  const r = openBusiness({type, city, district, listing:L, name:'Test '+type});
  if (r.err) throw new Error(r.err);
  const b = r.b;
  for (const e of BUSINESS_TYPES[type].equip) if (e.req) { const x = buyEquipment(b, e.cat, 0, false); if (x.err) throw new Error(x.err); }
  const T = BUSINESS_TYPES[type];
  for (const [role, n, hours] of staffPlan) {
    for (let i=0;i<n;i++){
      const c = makePerson(role, city, 0); c.id = uid('c'); c.city = city;
      const res = hireCandidate(c, b.id, {wage: c.expected, contract:'indeterminato', hours: hours||8, wdays: (()=>{const open=[0,1,2,3,4,5,6].filter(j=>b.days[j]); const w=[0,0,0,0,0,0,0]; for(let k=0;k<Math.min(5,open.length);k++) w[open[(k+i*2)%open.length]]=1; return w;})()});
      if (res.err) { c.expected = 0; }
    }
  }
  autoShifts(b);
  // assicura che tutti i giorni di apertura siano coperti
  for (const m of T.materials) { const s = suggestRestock(b, m); if (s.target>0){ b.restock[m] = {on:true, min:s.min, target:s.target, sup:m+'_std'}; placeOrder(b, m, m+'_std', s.target, false);} }
  const startCash = S.cash;
  const out = [];
  let lastMk = monthKey(S.day);
  for (let d=0; d<days; d++){
    simulateDay();
    while (S.events.length) resolveEvent(S.events[0], S.events[0].auto != null ? S.events[0].auto : S.events[0].opts.length-1, true);
    // ricalibra riordino ogni 30 giorni
    if (d % 30 === 15) for (const m of T.materials) { const s = suggestRestock(b, m); if (s.target>0) b.restock[m] = {on:true, min:s.min, target:s.target, sup:m+'_std'}; }
    const mk = monthKey(S.day);
    if (mk !== lastMk) { const pl = monthPL(lastMk, b.id); const h = b.hist.slice(-30); out.push({m: monthLabel(lastMk), rev: Math.round(pl.rev), profit: Math.round(pl.profit), cust: Math.round(avg(h, x=>x.cust)), lost: Math.round(avg(h, x=>x.lost)), sat: Math.round(b.sat), rep: Math.round(b.rep), q: Math.round(avg(h,x=>x.q)), cash: Math.round(S.cash), emps: empsOf(b.id).length, morale: Math.round(avg(empsOf(b.id), e=>e.morale)) }); lastMk = mk; }
    if (S.over) { out.push({m:'FALLITO'}); break; }
  }
  return {out, startCash, nw: Math.round(netWorth()), lines: periodPL(lastMonthKeys(13), b.id).lines};
};`;
vm.runInContext(code, ctx);
const [type = 'bar', city = 'torino', district = 'semicentro', days = 365] = process.argv.slice(2);
const plans = {
  bar: [['barista', 3]], panetteria: [['fornaio', 2], ['commesso', 1]], lavanderia: [['lavanderia', 1], ['commesso', 1]],
  ristorante: [['cuoco', 2], ['cameriere', 2]], pizzeria: [['pizzaiolo', 1], ['cameriere', 2]], gelateria: [['gelatiere', 1], ['commesso', 2]],
  minimarket: [['commesso', 3]], abbigliamento: [['commesso', 2]], parrucchiere: [['parrucchiere', 2]],
  palestra: [['istruttore', 2], ['receptionist', 1]], officina: [['meccanico', 2]], hotel: [['receptionist', 2], ['pulizie', 2], ['cameriere', 1]],
  mulino: [['operaio', 1]], torrefazione: [['operaio', 1]], agricola: [['agricolo', 1]], caseificio: [['operaio', 1]], pastificio: [['operaio', 1]],
  forno_industriale: [['fornaio', 1]], laboratorio_tessile: [['operaio', 3]], birrificio: [['operaio', 1]], salumificio: [['operaio', 1]],
};
ctx.EXTRA = +(process.env.EXTRA||0);
const r = ctx.__run(type, city, district, +days, plans[type]);
console.table(r.out);
console.log('Patrimonio netto finale', r.nw);
console.log(Object.fromEntries(Object.entries(r.lines).map(([k, v]) => [k, Math.round(v)])));
