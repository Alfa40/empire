'use strict';
/* ============================================================
   EMPIRE - dati statici del gioco
   ============================================================ */

const GAME_VERSION = 1;

// ---------------- Difficoltà ----------------
const DIFFICULTY = {
  facile: { name: 'Facile', cash: 85000, negEvents: 0.6, compAggr: 0.6, rateAdj: -0.8, demand: 1.1, desc: 'Più capitale iniziale, concorrenti meno aggressivi, meno imprevisti negativi.' },
  normale: { name: 'Normale', cash: 60000, negEvents: 1.0, compAggr: 1.0, rateAdj: 0, demand: 1.0, desc: 'Esperienza bilanciata.' },
  difficile: { name: 'Difficile', cash: 42000, negEvents: 1.4, compAggr: 1.4, rateAdj: 1.0, demand: 0.92, desc: 'Poco capitale, concorrenza agguerrita e imprevisti frequenti.' },
};

// ---------------- Forme giuridiche ----------------
const LEGAL_FORMS = {
  forfettario: { name: 'Regime forfettario', desc: 'Imposta sostitutiva del 15% (5% nei primi 5 anni) su una parte dei ricavi. Niente IVA. Valido solo se i ricavi annui restano sotto 85.000 €.', setup: 0, iva: false },
  ditta: { name: 'Ditta individuale', desc: 'IRPEF a scaglioni (23% / 35% / 43%) più contributi INPS del titolare. IVA ordinaria.', setup: 0, iva: true },
  srl: { name: 'S.r.l.', desc: 'IRES 24% + IRAP 3,9% sugli utili. IVA ordinaria. Costo di costituzione/trasformazione 2.500 €.', setup: 2500, iva: true },
  spa: { name: 'S.p.A.', desc: 'Come la S.r.l., ma permette la quotazione in Borsa. Richiede un capitale di 50.000 € e costa 12.000 € di trasformazione.', setup: 12000, iva: true, capital: 50000 },
};

// ---------------- Città e quartieri ----------------
const CITIES = [
  { id: 'milano', name: 'Milano', region: 'nord', size: 1.4, cost: 1.22, wealth: 1.22, tourism: 'arte', rentM2: 23, propM2: 5200 },
  { id: 'roma', name: 'Roma', region: 'centro', size: 1.5, cost: 1.14, wealth: 1.1, tourism: 'arte', rentM2: 20, propM2: 4300 },
  { id: 'napoli', name: 'Napoli', region: 'sud', size: 1.2, cost: 0.9, wealth: 0.86, tourism: 'arte', rentM2: 13, propM2: 2900 },
  { id: 'torino', name: 'Torino', region: 'nord', size: 1.1, cost: 1.0, wealth: 1.0, tourism: 'none', rentM2: 14, propM2: 2400 },
  { id: 'bologna', name: 'Bologna', region: 'nord', size: 1.0, cost: 1.08, wealth: 1.12, tourism: 'none', rentM2: 17, propM2: 3400 },
  { id: 'firenze', name: 'Firenze', region: 'centro', size: 0.95, cost: 1.12, wealth: 1.1, tourism: 'arte', rentM2: 19, propM2: 4100 },
  { id: 'verona', name: 'Verona', region: 'nord', size: 0.85, cost: 1.02, wealth: 1.08, tourism: 'arte', rentM2: 15, propM2: 2800 },
  { id: 'bari', name: 'Bari', region: 'sud', size: 0.9, cost: 0.88, wealth: 0.86, tourism: 'mare', rentM2: 12, propM2: 2200 },
  { id: 'palermo', name: 'Palermo', region: 'sud', size: 1.0, cost: 0.85, wealth: 0.8, tourism: 'mare', rentM2: 11, propM2: 1700 },
  { id: 'rimini', name: 'Rimini', region: 'centro', size: 0.7, cost: 1.0, wealth: 1.0, tourism: 'mare', rentM2: 16, propM2: 3100 },
];
const CITY = Object.fromEntries(CITIES.map(c => [c.id, c]));

const DISTRICTS = [
  { id: 'centro', name: 'Centro storico', foot: 1.45, rent: 1.7, wealth: 1.15, prop: 1.6, desc: 'Molto passaggio e clienti benestanti, affitti alti.' },
  { id: 'semicentro', name: 'Semicentro', foot: 1.1, rent: 1.1, wealth: 1.05, prop: 1.1, desc: 'Buon equilibrio tra passaggio e costi.' },
  { id: 'universita', name: 'Zona universitaria', foot: 1.2, rent: 1.0, wealth: 0.85, prop: 1.0, desc: 'Tanti giovani: bene bar, pizzerie, palestre. Clienti attenti al prezzo. Cala in agosto.' },
  { id: 'periferia', name: 'Periferia residenziale', foot: 0.8, rent: 0.65, wealth: 0.92, prop: 0.7, desc: 'Clientela di quartiere, costi bassi.' },
  { id: 'industriale', name: 'Zona industriale', foot: 0.3, rent: 0.4, wealth: 0.95, prop: 0.45, industrial: true, desc: 'Ideale per la produzione: capannoni economici, pochissimo passaggio.' },
];
const DISTRICT = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));

const TOURISM = {
  mare: [0.6, 0.6, 0.7, 0.85, 1.0, 1.4, 1.9, 2.0, 1.25, 0.8, 0.6, 0.7],
  arte: [0.85, 0.85, 0.95, 1.1, 1.15, 1.1, 1.05, 1.0, 1.1, 1.05, 0.9, 1.05],
  none: [1, 1, 1, 1, 1, 0.95, 0.9, 0.7, 1, 1, 1, 1],
};

// ---------------- Ruoli ----------------
const ROLES = {
  barista: { name: 'Barista', wage: 1550 },
  cameriere: { name: 'Cameriere', wage: 1500 },
  cuoco: { name: 'Cuoco', wage: 1950 },
  pizzaiolo: { name: 'Pizzaiolo', wage: 1850 },
  fornaio: { name: 'Fornaio', wage: 1750 },
  gelatiere: { name: 'Gelatiere', wage: 1650 },
  commesso: { name: 'Commesso', wage: 1480 },
  lavanderia: { name: 'Addetto lavanderia', wage: 1400 },
  parrucchiere: { name: 'Parrucchiere', wage: 1650 },
  istruttore: { name: 'Istruttore', wage: 1650 },
  meccanico: { name: 'Meccanico', wage: 1950 },
  receptionist: { name: 'Receptionist', wage: 1550 },
  pulizie: { name: 'Addetto pulizie', wage: 1350 },
  operaio: { name: 'Operaio', wage: 1700 },
  agricolo: { name: 'Operaio agricolo', wage: 1500 },
  magazziniere: { name: 'Magazziniere', wage: 1550 },
  manager: { name: 'Responsabile', wage: 2700 },
  contabile: { name: 'Contabile', wage: 2300, hq: true },
  hr: { name: 'Responsabile HR', wage: 2600, hq: true },
  marketer: { name: 'Marketing manager', wage: 2700, hq: true },
  areamanager: { name: 'Area manager', wage: 3400, hq: true },
  ricercatore: { name: 'Ricercatore R&S', wage: 2900, hq: true },
};
const HQ_ROLE_DESC = {
  contabile: 'Ogni contabile segue fino a 12 attività: riduce del 75% le parcelle del commercialista e il rischio di sanzioni fiscali.',
  hr: 'Migliora i candidati (+10 competenza media), +4 morale a tutti i dipendenti (fino a 60 dipendenti ciascuno).',
  marketer: 'Aumenta del 30% l\'efficacia di campagne e budget pubblicitari.',
  areamanager: 'Ogni area manager supervisiona 6 attività: +5% efficienza e gestione automatica degli imprevisti minori.',
  ricercatore: 'Ogni ricercatore accelera la ricerca del 35% e riduce il costo dei progetti del 5% (max 5).',
};

// ---------------- Materiali ----------------
// price = prezzo base IVA esclusa per unità, shelf = giorni di conservazione (0 = non deperibile)
const MATERIALS = {
  caffe: { name: 'Caffè in grani', unit: 'kg', price: 16, shelf: 240, iva: 0.10, cat: 'alimentari' },
  caffe_verde: { name: 'Caffè verde', unit: 'kg', price: 6.5, shelf: 400, iva: 0.10, cat: 'agricolo' },
  latte: { name: 'Latte', unit: 'l', price: 1.1, shelf: 6, iva: 0.04, cat: 'alimentari' },
  panna: { name: 'Panna', unit: 'l', price: 4, shelf: 10, iva: 0.04, cat: 'alimentari' },
  zucchero: { name: 'Zucchero', unit: 'kg', price: 1.1, shelf: 0, iva: 0.10, cat: 'alimentari' },
  cacao: { name: 'Cacao e cioccolato', unit: 'kg', price: 9, shelf: 365, iva: 0.10, cat: 'alimentari' },
  cornetti: { name: 'Cornetti surgelati', unit: 'pz', price: 0.38, shelf: 120, iva: 0.10, cat: 'alimentari' },
  bibite: { name: 'Bibite e acqua', unit: 'pz', price: 0.5, shelf: 365, iva: 0.22, cat: 'bevande' },
  alcolici: { name: 'Liquori e aperitivi', unit: 'l', price: 9, shelf: 0, iva: 0.22, cat: 'bevande' },
  birra: { name: 'Birra', unit: 'l', price: 2.2, shelf: 180, iva: 0.22, cat: 'bevande' },
  vino: { name: 'Vino', unit: 'bott', price: 4.5, shelf: 0, iva: 0.22, cat: 'bevande' },
  farina: { name: 'Farina', unit: 'kg', price: 0.75, shelf: 180, iva: 0.04, cat: 'alimentari' },
  grano: { name: 'Grano', unit: 'kg', price: 0.32, shelf: 365, iva: 0.04, cat: 'agricolo' },
  lievito: { name: 'Lievito', unit: 'kg', price: 4, shelf: 40, iva: 0.04, cat: 'alimentari' },
  burro: { name: 'Burro', unit: 'kg', price: 8.5, shelf: 45, iva: 0.04, cat: 'alimentari' },
  uova: { name: 'Uova', unit: 'pz', price: 0.26, shelf: 25, iva: 0.10, cat: 'alimentari' },
  pane: { name: 'Pane fresco', unit: 'pz', price: 0.35, shelf: 2, iva: 0.04, cat: 'alimentari' },
  salumi: { name: 'Salumi', unit: 'kg', price: 21, shelf: 25, iva: 0.10, cat: 'alimentari' },
  formaggi: { name: 'Formaggi', unit: 'kg', price: 14, shelf: 40, iva: 0.04, cat: 'alimentari' },
  mozzarella: { name: 'Mozzarella', unit: 'kg', price: 9.5, shelf: 8, iva: 0.04, cat: 'alimentari' },
  passata: { name: 'Passata di pomodoro', unit: 'kg', price: 1.6, shelf: 365, iva: 0.04, cat: 'alimentari' },
  carne: { name: 'Carne', unit: 'kg', price: 13, shelf: 5, iva: 0.10, cat: 'alimentari' },
  pesce: { name: 'Pesce fresco', unit: 'kg', price: 17, shelf: 3, iva: 0.10, cat: 'alimentari' },
  verdure: { name: 'Verdure', unit: 'kg', price: 2, shelf: 7, iva: 0.04, cat: 'agricolo' },
  frutta: { name: 'Frutta', unit: 'kg', price: 2.3, shelf: 8, iva: 0.04, cat: 'agricolo' },
  pasta: { name: 'Pasta secca', unit: 'kg', price: 1.7, shelf: 720, iva: 0.04, cat: 'alimentari' },
  olio: { name: 'Olio d\'oliva', unit: 'l', price: 8, shelf: 540, iva: 0.04, cat: 'alimentari' },
  confezionati: { name: 'Alimentari confezionati', unit: 'pz', price: 1.4, shelf: 365, iva: 0.10, cat: 'alimentari' },
  detersivi: { name: 'Detersivi', unit: 'l', price: 3, shelf: 0, iva: 0.22, cat: 'pulizia' },
  solventi: { name: 'Solventi per lavaggio a secco', unit: 'l', price: 6, shelf: 0, iva: 0.22, cat: 'pulizia' },
  imballaggi: { name: 'Imballaggi e grucce', unit: 'pz', price: 0.08, shelf: 0, iva: 0.22, cat: 'altro' },
  maglieria: { name: 'Maglieria e t-shirt', unit: 'pz', price: 8, shelf: 0, iva: 0.22, cat: 'moda' },
  pantaloni: { name: 'Pantaloni e jeans', unit: 'pz', price: 17, shelf: 0, iva: 0.22, cat: 'moda' },
  capispalla: { name: 'Giacche e cappotti', unit: 'pz', price: 42, shelf: 0, iva: 0.22, cat: 'moda' },
  accessori: { name: 'Accessori moda', unit: 'pz', price: 5, shelf: 0, iva: 0.22, cat: 'moda' },
  tessuto: { name: 'Tessuto', unit: 'm', price: 3, shelf: 0, iva: 0.22, cat: 'moda' },
  prodotti_capelli: { name: 'Prodotti per capelli', unit: 'pz', price: 7, shelf: 0, iva: 0.22, cat: 'altro' },
  integratori: { name: 'Integratori e barrette', unit: 'pz', price: 1.4, shelf: 365, iva: 0.10, cat: 'alimentari' },
  ricambi: { name: 'Ricambi auto', unit: 'pz', price: 38, shelf: 0, iva: 0.22, cat: 'auto' },
  olio_motore: { name: 'Olio motore', unit: 'l', price: 7, shelf: 0, iva: 0.22, cat: 'auto' },
  pneumatici: { name: 'Pneumatici', unit: 'pz', price: 55, shelf: 0, iva: 0.22, cat: 'auto' },
  biancheria: { name: 'Biancheria e kit cortesia', unit: 'kit', price: 1.6, shelf: 0, iva: 0.22, cat: 'altro' },
  malto: { name: 'Malto d\'orzo', unit: 'kg', price: 1.2, shelf: 365, iva: 0.10, cat: 'agricolo' },
  luppolo: { name: 'Luppolo', unit: 'kg', price: 25, shelf: 365, iva: 0.10, cat: 'agricolo' },
  fertilizzanti: { name: 'Sementi e fertilizzanti', unit: 'kg', price: 0.9, shelf: 0, iva: 0.04, cat: 'agricolo' },
  mangime: { name: 'Mangime', unit: 'kg', price: 0.38, shelf: 180, iva: 0.04, cat: 'agricolo' },
};

const SUPPLIER_TIERS = [
  { id: 'eco', name: 'Economico', mult: 0.84, q: 38, days: 2, rel: 0.88 },
  { id: 'std', name: 'Standard', mult: 1.0, q: 60, days: 1, rel: 0.96 },
  { id: 'pre', name: 'Premium', mult: 1.32, q: 86, days: 2, rel: 0.985 },
];
const SUPPLIER_NAMES = {
  alimentari: ['Alimentari Rossi', 'Food Service Italia', 'Gastronomia Bianchi', 'DistriFood', 'Delizie del Borgo', 'Sapori Antichi'],
  bevande: ['Bevande Nord', 'DrinkItalia', 'Cantine Riunite Ingrosso', 'Beverage Point', 'Hydra Distribuzione', 'Enoteca Ingrosso'],
  pulizia: ['Pulito Facile', 'ChemService', 'Igiene Pro', 'Splendor Forniture', 'Detergo', 'Brillo Ingrosso'],
  moda: ['Tessili Lombardi', 'Moda Ingrosso', 'Pronto Moda Prato', 'Fashion Supply', 'Atelier Forniture', 'Stile Italiano Ingrosso'],
  auto: ['AutoRicambi Italia', 'MotorParts', 'Ricambi Veloci', 'Officina Supply', 'GommaPiù', 'TecnoAuto'],
  agricolo: ['Consorzio Agrario', 'AgriCoop', 'Campi Verdi', 'Terra Madre Forniture', 'Raccolti del Sud', 'Agricola Padana'],
  altro: ['Forniture Generali', 'Emporio Professionale', 'Ingrosso Centrale', 'Mega Forniture', 'ProService', 'Universo Forniture'],
};
function suppliersFor(matId) {
  const m = MATERIALS[matId];
  const names = SUPPLIER_NAMES[m.cat];
  let h = 0; for (const ch of matId) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return SUPPLIER_TIERS.map((t, i) => ({ id: matId + '_' + t.id, tier: t.id, tierName: t.name, name: names[(h + i * 2) % names.length], mult: t.mult, q: t.q, days: t.days, rel: t.rel }));
}

// ---------------- Profili orari ----------------
function prof(map) { const a = new Array(24).fill(0); for (const k in map) a[+k] = map[k]; return a; }
const HOURLY = {
  bar: prof({ 6: 4, 7: 9, 8: 10, 9: 7, 10: 5, 11: 5, 12: 7, 13: 6, 14: 4, 15: 3, 16: 4, 17: 5, 18: 7, 19: 6, 20: 3, 21: 2, 22: 1 }),
  forno: prof({ 6: 4, 7: 9, 8: 10, 9: 8, 10: 6, 11: 6, 12: 6, 13: 3, 14: 2, 15: 2, 16: 4, 17: 6, 18: 5, 19: 3, 20: 1 }),
  pasti: prof({ 11: 1, 12: 6, 13: 8, 14: 4, 15: 1, 18: 1, 19: 5, 20: 9, 21: 8, 22: 4, 23: 1 }),
  cena: prof({ 12: 3, 13: 4, 14: 2, 18: 2, 19: 6, 20: 10, 21: 9, 22: 5, 23: 2 }),
  gelato: prof({ 10: 1, 11: 2, 12: 3, 13: 3, 14: 3, 15: 5, 16: 7, 17: 8, 18: 7, 19: 6, 20: 7, 21: 8, 22: 7, 23: 4 }),
  negozio: prof({ 8: 2, 9: 4, 10: 6, 11: 6, 12: 5, 13: 3, 14: 3, 15: 4, 16: 6, 17: 7, 18: 7, 19: 5, 20: 2 }),
  servizio: prof({ 7: 2, 8: 4, 9: 6, 10: 6, 11: 6, 12: 5, 13: 3, 14: 4, 15: 6, 16: 6, 17: 6, 18: 5, 19: 3, 20: 1 }),
  palestra: prof({ 6: 2, 7: 5, 8: 4, 9: 3, 10: 3, 11: 3, 12: 5, 13: 5, 14: 3, 15: 3, 16: 4, 17: 7, 18: 9, 19: 9, 20: 7, 21: 4, 22: 1 }),
  officina: prof({ 7: 2, 8: 6, 9: 6, 10: 6, 11: 6, 12: 5, 13: 2, 14: 5, 15: 5, 16: 5, 17: 5, 18: 2 }),
  sempre: new Array(24).fill(1),
};

// ---------------- Attrezzature: tier ----------------
const TIER_NAMES = ['Base', 'Professionale', 'Top di gamma'];
const TIER_COST = [1, 2.2, 4];
const TIER_FX = { speed: [1, 1.12, 1.25], phys: [1, 1.2, 1.4], quality: [4, 9, 15], prod: [1, 1.8, 3] };

// ---------------- Tipi di attività ----------------
// Prodotti: n=nome, r=ricetta {materiale: quantità}, p=prezzo di riferimento IVA inclusa, min=minuti di lavoro,
// role=ruolo che lo prepara, a=quantità media acquistata per cliente, eq=attrezzatura richiesta, lock=ricerca necessaria
const BUSINESS_TYPES = {
  bar: {
    name: 'Bar / Caffetteria', sector: 'Ristorazione', mode: 'shop', tutorial: true, tags: ['food', 'shop', 'seated'],
    desc: 'Caffè, colazioni, aperitivi. Margini alti sui prodotti, tanti clienti, molte ore di apertura.',
    size: 60, license: 2200, baseDemand: 640, capPerHour: 42, hours: [6, 20], hourly: 'bar', days: [1, 1, 1, 1, 1, 1, 1],
    wk: [1, 1, 1, 1, 1.05, 1.1, 0.85], mon: [0.95, 0.95, 1, 1, 1.02, 1.03, 1.02, 0.95, 1, 1, 0.98, 1.02],
    weather: { pioggia: 0.92, temporale: 0.85, neve: 0.8, caldo: 0.95, sole: 1.04, nebbia: 0.96 }, tourism: 0.5, holiday: 0.9,
    sp: { natale: 1.06, finedanno: 1.05, ferragosto: 0.85 },
    roles: ['barista', 'cameriere', 'pulizie', 'manager'], front: null, el: 1.3, iva: 0.10, energy: 15, ecoSens: 0.6,
    products: [
      { id: 'espresso', n: 'Caffè espresso', r: { caffe: 0.008, zucchero: 0.006 }, p: 1.3, min: 0.8, role: 'barista', a: 0.6 },
      { id: 'cappuccino', n: 'Cappuccino', r: { caffe: 0.008, latte: 0.14, zucchero: 0.006 }, p: 1.7, min: 1.2, role: 'barista', a: 0.28 },
      { id: 'cornetto', n: 'Cornetto', r: { cornetti: 1 }, p: 1.4, min: 0.4, role: 'barista', a: 0.3 },
      { id: 'bibita', n: 'Bibita / acqua', r: { bibite: 1 }, p: 2.5, min: 0.3, role: 'barista', a: 0.14 },
      { id: 'spremuta', n: 'Spremuta d\'arancia', r: { frutta: 0.35 }, p: 3.5, min: 2, role: 'barista', a: 0.05 },
      { id: 'panino', n: 'Panino / tramezzino', r: { pane: 1, salumi: 0.05, formaggi: 0.03 }, p: 4.5, min: 2, role: 'barista', a: 0.12 },
      { id: 'aperitivo', n: 'Aperitivo (spritz)', r: { alcolici: 0.06, vino: 0.06, bibite: 0.3 }, p: 6.5, min: 2, role: 'barista', a: 0.06 },
      { id: 'birra_media', n: 'Birra media', r: { birra: 0.4 }, p: 5, min: 0.6, role: 'barista', a: 0.05 },
      { id: 'specialty', n: 'Caffè specialty', r: { caffe: 0.012 }, p: 2.6, min: 3, role: 'barista', a: 0.06, lock: 'caffe_specialty' },
      { id: 'brunch', n: 'Brunch completo', r: { pane: 2, uova: 2, salumi: 0.05, frutta: 0.15, latte: 0.1 }, p: 14, min: 8, role: 'barista', a: 0.03, lock: 'brunch' },
    ],
    equip: [
      { cat: 'macchina_caffe', n: 'Macchina espresso', kind: 'speed', req: true, cost: 4200, en: 6 },
      { cat: 'frigo', n: 'Banco frigo e vetrina', kind: 'quality', req: true, cost: 2600, en: 5 },
      { cat: 'arredo', n: 'Tavoli e sedute', kind: 'phys', req: true, cost: 3500, en: 0 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'lavastoviglie', n: 'Lavatazzine', kind: 'speed', req: false, cost: 1300, en: 3, fx: [1.05, 1.08, 1.12] },
    ],
  },
  panetteria: {
    name: 'Panetteria / Forno', sector: 'Ristorazione', mode: 'shop', tutorial: true, tags: ['food', 'shop'],
    desc: 'Produci pane, focacce e dolci e li vendi al banco. Si lavora presto e le materie prime sono economiche.',
    size: 70, license: 2000, baseDemand: 560, capPerHour: 40, hours: [7, 19], hourly: 'forno', days: [1, 1, 1, 1, 1, 1, 0],
    wk: [1, 0.95, 0.95, 1, 1.05, 1.25, 0.9], mon: [1, 1, 1, 1, 1, 0.95, 0.9, 0.85, 1, 1, 1, 1.05],
    weather: { pioggia: 0.95, temporale: 0.9, neve: 0.85, caldo: 0.92, sole: 1.0, nebbia: 1 }, tourism: 0.2, holiday: 0.8,
    sp: { natale: 1.3, pasqua: 1.3, carnevale: 1.15, ferragosto: 0.8 },
    roles: ['fornaio', 'commesso', 'pulizie', 'manager'], front: 'commesso', frontMin: 0.9, prep: ['fornaio'], el: 1.2, iva: 0.04, energy: 30, ecoSens: 0.3,
    products: [
      { id: 'pane', n: 'Pane comune (500 g)', r: { farina: 0.33, lievito: 0.005 }, p: 2.0, min: 1.1, role: 'fornaio', a: 0.75 },
      { id: 'focaccia', n: 'Focaccia', r: { farina: 0.14, olio: 0.02 }, p: 1.8, min: 0.9, role: 'fornaio', a: 0.35 },
      { id: 'cornetto_art', n: 'Cornetto artigianale', r: { farina: 0.05, burro: 0.022, uova: 0.3, zucchero: 0.01 }, p: 1.3, min: 1.4, role: 'fornaio', a: 0.3, iva: 0.10 },
      { id: 'pizza_taglio', n: 'Pizza al taglio', r: { farina: 0.11, passata: 0.06, mozzarella: 0.05, olio: 0.01 }, p: 2.5, min: 1.2, role: 'fornaio', a: 0.25, iva: 0.10 },
      { id: 'biscotti', n: 'Biscotti (250 g)', r: { farina: 0.12, burro: 0.05, zucchero: 0.05, uova: 0.5 }, p: 4.5, min: 2.5, role: 'fornaio', a: 0.1, iva: 0.10 },
      { id: 'crostata', n: 'Crostata intera', r: { farina: 0.3, burro: 0.12, uova: 2, zucchero: 0.15, frutta: 0.2 }, p: 15, min: 14, role: 'fornaio', a: 0.04, iva: 0.10 },
      { id: 'pane_madre', n: 'Pane a lievito madre', r: { farina: 0.36 }, p: 4.2, min: 2.5, role: 'fornaio', a: 0.15, lock: 'lievito_madre' },
    ],
    equip: [
      { cat: 'forno', n: 'Forno da panificazione', kind: 'speed', req: true, cost: 7500, en: 14 },
      { cat: 'impastatrice', n: 'Impastatrice', kind: 'speed', req: true, cost: 2400, en: 3, fx: [1, 1.07, 1.14] },
      { cat: 'vetrina', n: 'Banco vetrina', kind: 'quality', req: true, cost: 2200, en: 3 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'cella_lievitazione', n: 'Cella di lievitazione', kind: 'quality', req: false, cost: 3000, en: 3 },
    ],
  },
  lavanderia: {
    name: 'Lavanderia', sector: 'Servizi', mode: 'shop', tutorial: true, tags: ['shop', 'service'],
    desc: 'Lavaggio, stiratura e lavaggio a secco. Pochi materiali, conta il lavoro del personale e la capacità delle macchine.',
    size: 55, license: 1500, baseDemand: 175, capPerHour: 12, hours: [8, 19], hourly: 'servizio', days: [1, 1, 1, 1, 1, 1, 0],
    wk: [1.2, 1, 1, 1, 1.05, 1.1, 0.3], mon: [1.05, 1, 1, 1.1, 1.05, 0.95, 0.9, 0.7, 1.05, 1.05, 1.05, 1.05],
    weather: { pioggia: 1.05, temporale: 1, neve: 0.9, caldo: 1, sole: 1, nebbia: 1 }, tourism: 0.1, holiday: 0.15,
    sp: { natale: 1.1, rientro: 1.1 },
    roles: ['lavanderia', 'commesso', 'pulizie', 'manager'], front: 'commesso', frontMin: 1.5, el: 1.0, iva: 0.22, energy: 26, ecoSens: 0.4,
    products: [
      { id: 'lavaggio', n: 'Lavaggio capo', r: { detersivi: 0.05, imballaggi: 1 }, p: 4.5, min: 2.4, role: 'lavanderia', a: 1.6 },
      { id: 'stiratura', n: 'Stiratura camicia', r: { imballaggi: 1 }, p: 3, min: 3, role: 'lavanderia', a: 1.2 },
      { id: 'secco', n: 'Lavaggio a secco (abito)', r: { solventi: 0.2, imballaggi: 1 }, p: 12, min: 6, role: 'lavanderia', a: 0.35, eq: 'lavasecco' },
      { id: 'piumone', n: 'Piumone / tende', r: { detersivi: 0.3 }, p: 20, min: 9, role: 'lavanderia', a: 0.1, mon: [1.3, 1.2, 1.2, 1.5, 1.3, 0.8, 0.6, 0.5, 0.8, 1.4, 1.5, 1.2] },
      { id: 'self', n: 'Self-service (gettone)', r: { detersivi: 0.1 }, p: 5, min: 0.5, role: 'lavanderia', a: 0.3, eq: 'self_service' },
    ],
    equip: [
      { cat: 'lavatrici', n: 'Lavatrici industriali', kind: 'phys', req: true, cost: 6500, en: 10 },
      { cat: 'stireria', n: 'Banco da stiro professionale', kind: 'speed', req: true, cost: 2400, en: 4 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'lavasecco', n: 'Macchina per lavaggio a secco', kind: 'quality', req: false, cost: 9000, en: 8 },
      { cat: 'self_service', n: 'Area self-service a gettoni', kind: 'phys', req: false, cost: 7000, en: 6, fx: [1.1, 1.2, 1.3] },
    ],
  },
  ristorante: {
    name: 'Ristorante / Trattoria', sector: 'Ristorazione', mode: 'shop', tags: ['food', 'shop', 'seated'],
    desc: 'Pranzi e cene servite al tavolo. Scontrino medio alto, serve una brigata di cucina e sala.',
    size: 120, license: 3500, baseDemand: 160, capPerHour: 14, hours: [12, 23], hourly: 'pasti', days: [0, 1, 1, 1, 1, 1, 1],
    wk: [0.7, 0.8, 0.85, 0.95, 1.2, 1.45, 1.3], mon: [0.85, 0.9, 0.95, 1.05, 1.05, 1.05, 1.0, 0.9, 1.0, 1.0, 0.95, 1.15],
    weather: { pioggia: 0.92, temporale: 0.85, neve: 0.8, caldo: 0.95, sole: 1.03, nebbia: 0.95 }, tourism: 0.7, holiday: 1.4,
    sp: { sanvalentino: 1.8, natale: 1.2, festamamma: 1.4, sanSilvestro: 1.6, pasqua: 1.2 },
    roles: ['cuoco', 'cameriere', 'pulizie', 'manager'], front: 'cameriere', frontMin: 4, el: 1.15, iva: 0.10, energy: 40, ecoSens: 1.0,
    products: [
      { id: 'antipasto', n: 'Antipasto misto', r: { salumi: 0.06, formaggi: 0.04, verdure: 0.05 }, p: 11, min: 2.5, role: 'cuoco', a: 0.4 },
      { id: 'primo', n: 'Primo piatto', r: { pasta: 0.1, passata: 0.08, olio: 0.01, formaggi: 0.01 }, p: 12, min: 3.5, role: 'cuoco', a: 0.75 },
      { id: 'secondo_carne', n: 'Secondo di carne', r: { carne: 0.22, verdure: 0.1, olio: 0.02 }, p: 18, min: 5, role: 'cuoco', a: 0.45 },
      { id: 'secondo_pesce', n: 'Secondo di pesce', r: { pesce: 0.22, verdure: 0.1, olio: 0.02 }, p: 22, min: 6, role: 'cuoco', a: 0.25 },
      { id: 'dolce', n: 'Dolce della casa', r: { farina: 0.03, uova: 0.5, zucchero: 0.03, panna: 0.05 }, p: 6, min: 1.5, role: 'cuoco', a: 0.35 },
      { id: 'vino_bott', n: 'Bottiglia di vino', r: { vino: 1 }, p: 18, min: 1, role: 'cameriere', a: 0.22 },
      { id: 'acqua', n: 'Acqua / bibita', r: { bibite: 1 }, p: 2.5, min: 0.3, role: 'cameriere', a: 0.8 },
      { id: 'caffe_r', n: 'Caffè', r: { caffe: 0.008 }, p: 1.6, min: 0.8, role: 'cameriere', a: 0.5 },
      { id: 'degustazione', n: 'Menù degustazione', r: { carne: 0.15, pesce: 0.15, pasta: 0.08, formaggi: 0.05, verdure: 0.1 }, p: 55, min: 15, role: 'cuoco', a: 0.08, lock: 'menu_degustazione' },
    ],
    equip: [
      { cat: 'cucina', n: 'Cucina professionale', kind: 'speed', req: true, cost: 14000, en: 18 },
      { cat: 'frigo', n: 'Frigoriferi e abbattitore', kind: 'quality', req: true, cost: 5000, en: 8 },
      { cat: 'sala', n: 'Arredo sala', kind: 'phys', req: true, cost: 9000, en: 0 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'cantina', n: 'Cantina vini climatizzata', kind: 'quality', req: false, cost: 4000, en: 3 },
    ],
  },
  pizzeria: {
    name: 'Pizzeria', sector: 'Ristorazione', mode: 'shop', tags: ['food', 'shop', 'seated'],
    desc: 'Pizza al tavolo e da asporto. Materie prime economiche e tanti coperti nel fine settimana.',
    size: 100, license: 3000, baseDemand: 300, capPerHour: 18, hours: [18, 24], hourly: 'cena', days: [0, 1, 1, 1, 1, 1, 1],
    wk: [0.7, 0.75, 0.8, 0.95, 1.3, 1.6, 1.2], mon: [0.9, 0.9, 0.95, 1.0, 1.05, 1.05, 1.0, 0.9, 1.0, 1.0, 0.95, 1.05],
    weather: { pioggia: 0.95, temporale: 0.9, neve: 0.85, caldo: 0.97, sole: 1.03, nebbia: 0.97 }, tourism: 0.5, holiday: 1.2,
    sp: { sanvalentino: 1.2, sanSilvestro: 0.8 },
    roles: ['pizzaiolo', 'cameriere', 'pulizie', 'manager'], front: 'cameriere', frontMin: 3, el: 1.3, iva: 0.10, energy: 30, ecoSens: 0.6,
    products: [
      { id: 'margherita', n: 'Pizza margherita', r: { farina: 0.22, passata: 0.08, mozzarella: 0.12, olio: 0.01 }, p: 7, min: 2.5, role: 'pizzaiolo', a: 0.5 },
      { id: 'farcita', n: 'Pizza farcita', r: { farina: 0.22, passata: 0.08, mozzarella: 0.12, salumi: 0.06, verdure: 0.05 }, p: 9.5, min: 3, role: 'pizzaiolo', a: 0.45 },
      { id: 'calzone', n: 'Calzone', r: { farina: 0.25, mozzarella: 0.12, salumi: 0.05 }, p: 9, min: 3, role: 'pizzaiolo', a: 0.08 },
      { id: 'birra_p', n: 'Birra', r: { birra: 0.4 }, p: 5, min: 0.5, role: 'cameriere', a: 0.45 },
      { id: 'bibita_p', n: 'Bibita', r: { bibite: 1 }, p: 3, min: 0.3, role: 'cameriere', a: 0.4 },
      { id: 'tiramisu', n: 'Tiramisù', r: { uova: 1, zucchero: 0.03, caffe: 0.005, formaggi: 0.06 }, p: 5, min: 1.5, role: 'pizzaiolo', a: 0.15 },
      { id: 'gourmet', n: 'Pizza gourmet', r: { farina: 0.24, mozzarella: 0.1, salumi: 0.06, formaggi: 0.05, olio: 0.02 }, p: 15, min: 4, role: 'pizzaiolo', a: 0.12, lock: 'pizza_gourmet' },
    ],
    equip: [
      { cat: 'forno', n: 'Forno per pizza', kind: 'speed', req: true, cost: 6500, en: 14 },
      { cat: 'banco', n: 'Banco frigo pizzeria', kind: 'quality', req: true, cost: 3000, en: 5 },
      { cat: 'sala', n: 'Arredo sala', kind: 'phys', req: true, cost: 7000, en: 0 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'impastatrice', n: 'Impastatrice a spirale', kind: 'speed', req: false, cost: 2000, en: 2, fx: [1.05, 1.1, 1.15] },
    ],
  },
  gelateria: {
    name: 'Gelateria', sector: 'Ristorazione', mode: 'shop', tags: ['food', 'shop'],
    desc: 'Gelato artigianale: fortissima stagionalità, d\'estate si lavora tantissimo.',
    size: 50, license: 2000, baseDemand: 330, capPerHour: 45, hours: [11, 23], hourly: 'gelato', days: [1, 1, 1, 1, 1, 1, 1],
    wk: [0.85, 0.85, 0.9, 0.95, 1.1, 1.35, 1.4], mon: [0.25, 0.3, 0.5, 0.8, 1.2, 1.65, 1.95, 1.85, 1.2, 0.7, 0.35, 0.45],
    weather: { pioggia: 0.6, temporale: 0.5, neve: 0.5, caldo: 1.45, sole: 1.12, nebbia: 0.8 }, tourism: 0.8, holiday: 1.3,
    sp: { ferragosto: 1.2 },
    roles: ['gelatiere', 'commesso', 'pulizie', 'manager'], front: 'commesso', frontMin: 0.8, prep: ['gelatiere'], el: 1.25, iva: 0.10, energy: 24, ecoSens: 0.5,
    products: [
      { id: 'cono', n: 'Cono / coppetta', r: { latte: 0.1, panna: 0.03, zucchero: 0.03, frutta: 0.03, cacao: 0.005 }, p: 3, min: 0.8, role: 'gelatiere', a: 0.85 },
      { id: 'vaschetta', n: 'Vaschetta 500 g', r: { latte: 0.3, panna: 0.1, zucchero: 0.1, frutta: 0.1, cacao: 0.02 }, p: 10, min: 2.5, role: 'gelatiere', a: 0.12 },
      { id: 'frappe', n: 'Frappè / frullato', r: { latte: 0.25, frutta: 0.1, zucchero: 0.02 }, p: 4.5, min: 2, role: 'gelatiere', a: 0.08 },
      { id: 'granita', n: 'Granita', r: { frutta: 0.15, zucchero: 0.05 }, p: 3.5, min: 1, role: 'gelatiere', a: 0.08, mon: [0.2, 0.2, 0.4, 0.7, 1, 1.5, 2, 2, 1.2, 0.5, 0.2, 0.2] },
      { id: 'crepe', n: 'Crêpe', r: { farina: 0.05, uova: 0.5, latte: 0.1, cacao: 0.02 }, p: 5, min: 3, role: 'gelatiere', a: 0.06, mon: [2, 2, 1.6, 1.2, 0.8, 0.5, 0.4, 0.4, 0.8, 1.4, 2, 2.2] },
      { id: 'vegano', n: 'Gelato vegano', r: { frutta: 0.12, zucchero: 0.03 }, p: 3.5, min: 1, role: 'gelatiere', a: 0.12, lock: 'gelato_vegano' },
    ],
    equip: [
      { cat: 'mantecatore', n: 'Mantecatore', kind: 'speed', req: true, cost: 9000, en: 10 },
      { cat: 'vetrina', n: 'Vetrina gelato', kind: 'phys', req: true, cost: 6000, en: 8 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'abbattitore', n: 'Abbattitore di temperatura', kind: 'quality', req: false, cost: 3500, en: 4 },
    ],
  },
  minimarket: {
    name: 'Alimentari / Minimarket', sector: 'Commercio', mode: 'shop', tags: ['shop', 'retail'],
    desc: 'Rivendita di prodotti alimentari e per la casa. Margini bassi, volumi alti, attenzione alle scorte.',
    size: 150, license: 2500, baseDemand: 620, capPerHour: 40, hours: [8, 20], hourly: 'negozio', days: [1, 1, 1, 1, 1, 1, 0],
    wk: [1, 0.95, 0.95, 1, 1.1, 1.3, 0.6], mon: [1, 0.97, 1, 1, 1, 1, 0.98, 0.85, 1, 1, 1, 1.1],
    weather: { pioggia: 0.97, temporale: 0.95, neve: 0.9, caldo: 0.97, sole: 1, nebbia: 1 }, tourism: 0.3, holiday: 0.5,
    sp: { natale: 1.25, pasqua: 1.1, finedanno: 1.15 },
    roles: ['commesso', 'magazziniere', 'pulizie', 'manager'], front: 'commesso', frontMin: 1.5, el: 1.5, iva: 0.10, energy: 30, ecoSens: 0.2,
    products: [
      { id: 'confezionati', n: 'Prodotti confezionati', r: { confezionati: 1 }, p: 2.3, min: 0.15, role: 'commesso', a: 2.2 },
      { id: 'ortofrutta', n: 'Frutta e verdura (kg)', r: { verdure: 0.5, frutta: 0.5 }, p: 2.9, min: 0.3, role: 'commesso', a: 0.7 },
      { id: 'latte_v', n: 'Latte e latticini', r: { latte: 1 }, p: 1.7, min: 0.1, role: 'commesso', a: 0.5 },
      { id: 'pane_v', n: 'Pane', r: { pane: 1 }, p: 0.7, min: 0.1, role: 'commesso', a: 0.45 },
      { id: 'pasta_v', n: 'Pasta (500 g)', r: { pasta: 0.5 }, p: 1.3, min: 0.1, role: 'commesso', a: 0.45 },
      { id: 'bevande_v', n: 'Bevande', r: { bibite: 1 }, p: 1.0, min: 0.1, role: 'commesso', a: 0.7 },
      { id: 'casa_v', n: 'Detersivi e casa', r: { detersivi: 1 }, p: 4.8, min: 0.15, role: 'commesso', a: 0.18 },
      { id: 'banco', n: 'Salumi e formaggi al banco', r: { salumi: 0.15, formaggi: 0.1 }, p: 5.8, min: 1.5, role: 'commesso', a: 0.22 },
      { id: 'gastronomia', n: 'Piatti pronti di gastronomia', r: { pasta: 0.1, carne: 0.08, verdure: 0.1 }, p: 7.5, min: 3, role: 'commesso', a: 0.1, lock: 'gastronomia' },
    ],
    equip: [
      { cat: 'scaffali', n: 'Scaffalature', kind: 'phys', req: true, cost: 5000, en: 0 },
      { cat: 'frigo', n: 'Banchi frigo', kind: 'quality', req: true, cost: 6500, en: 12 },
      { cat: 'cassa', n: 'Casse e lettori', kind: 'speed', req: true, cost: 1500, en: 1, fx: [1, 1.1, 1.22] },
      { cat: 'muletto', n: 'Transpallet e magazzino', kind: 'speed', req: false, cost: 2000, en: 1, fx: [1.03, 1.06, 1.1] },
    ],
  },
  abbigliamento: {
    name: 'Negozio di abbigliamento', sector: 'Commercio', mode: 'shop', tags: ['shop', 'retail'],
    desc: 'Moda e accessori. Margini alti, forti picchi durante saldi, Black Friday e Natale.',
    size: 90, license: 1800, baseDemand: 100, capPerHour: 20, hours: [10, 20], hourly: 'negozio', days: [0, 1, 1, 1, 1, 1, 1],
    wk: [0.75, 0.85, 0.9, 0.95, 1.1, 1.7, 1.0], mon: [1, 0.85, 0.95, 1, 1, 0.95, 1, 0.75, 1.05, 1.0, 1.0, 1.25],
    weather: { pioggia: 0.85, temporale: 0.8, neve: 0.8, caldo: 0.9, sole: 1.05, nebbia: 0.95 }, tourism: 0.5, holiday: 0.7,
    sp: { saldi: 1.55, blackfriday: 1.7, natale: 1.45, festamamma: 1.15 },
    roles: ['commesso', 'magazziniere', 'pulizie', 'manager'], front: 'commesso', frontMin: 4, el: 1.55, iva: 0.22, energy: 18, ecoSens: 1.1,
    products: [
      { id: 'maglia', n: 'T-shirt e maglie', r: { maglieria: 1 }, p: 25, min: 1, role: 'commesso', a: 0.3 },
      { id: 'jeans', n: 'Pantaloni e jeans', r: { pantaloni: 1 }, p: 55, min: 2, role: 'commesso', a: 0.14 },
      { id: 'giacca', n: 'Giacche e cappotti', r: { capispalla: 1 }, p: 140, min: 3, role: 'commesso', a: 0.05, mon: [1.6, 1.3, 1, 0.7, 0.4, 0.2, 0.2, 0.3, 0.9, 1.5, 1.8, 1.8] },
      { id: 'accessori', n: 'Accessori', r: { accessori: 1 }, p: 15, min: 0.5, role: 'commesso', a: 0.16 },
      { id: 'linea_propria', n: 'Linea a marchio proprio', r: { maglieria: 1, accessori: 0.2 }, p: 45, min: 1.5, role: 'commesso', a: 0.15, lock: 'linea_propria' },
    ],
    equip: [
      { cat: 'espositori', n: 'Espositori e arredo', kind: 'phys', req: true, cost: 6000, en: 0 },
      { cat: 'camerini', n: 'Camerini', kind: 'speed', req: true, cost: 2500, en: 0, fx: [1, 1.08, 1.16] },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'vetrine', n: 'Illuminazione e vetrine', kind: 'quality', req: false, cost: 3000, en: 4 },
    ],
  },
  parrucchiere: {
    name: 'Parrucchiere / Barbiere', sector: 'Servizi', mode: 'shop', tags: ['shop', 'service'],
    desc: 'Servizi alla persona: pochi materiali, conta la bravura del personale e il numero di postazioni.',
    size: 50, license: 1500, baseDemand: 95, capPerHour: 5, hours: [9, 19], hourly: 'servizio', days: [0, 1, 1, 1, 1, 1, 0],
    wk: [0.4, 1, 1, 1.1, 1.3, 1.5, 0.1], mon: [0.85, 0.9, 1, 1.05, 1.05, 1.1, 1.05, 0.75, 1.05, 1, 1, 1.25],
    weather: { pioggia: 0.95, temporale: 0.9, neve: 0.85, caldo: 1, sole: 1, nebbia: 1 }, tourism: 0.05, holiday: 0.1,
    sp: { natale: 1.3, pasqua: 1.15 },
    roles: ['parrucchiere', 'receptionist', 'pulizie', 'manager'], front: null, el: 1.05, iva: 0.22, energy: 12, ecoSens: 0.5,
    products: [
      { id: 'taglio_uomo', n: 'Taglio uomo', r: { prodotti_capelli: 0.03 }, p: 18, min: 25, role: 'parrucchiere', a: 0.45 },
      { id: 'piega', n: 'Taglio e piega donna', r: { prodotti_capelli: 0.08 }, p: 38, min: 50, role: 'parrucchiere', a: 0.35 },
      { id: 'colore', n: 'Colore', r: { prodotti_capelli: 0.5 }, p: 55, min: 80, role: 'parrucchiere', a: 0.15 },
      { id: 'barba', n: 'Barba', r: { prodotti_capelli: 0.02 }, p: 12, min: 15, role: 'parrucchiere', a: 0.2 },
      { id: 'trattamento', n: 'Trattamento capelli', r: { prodotti_capelli: 0.3 }, p: 28, min: 30, role: 'parrucchiere', a: 0.1 },
      { id: 'cheratina', n: 'Trattamento alla cheratina', r: { prodotti_capelli: 0.8 }, p: 120, min: 120, role: 'parrucchiere', a: 0.03, lock: 'trattamenti_premium' },
    ],
    equip: [
      { cat: 'postazioni', n: 'Postazioni di lavoro', kind: 'phys', req: true, cost: 4500, en: 2 },
      { cat: 'lavatesta', n: 'Lavatesta', kind: 'speed', req: true, cost: 2200, en: 3 },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
      { cat: 'arredo_salone', n: 'Arredo e immagine del salone', kind: 'quality', req: false, cost: 3500, en: 0 },
    ],
  },
  palestra: {
    name: 'Palestra', sector: 'Servizi', mode: 'shop', tags: ['shop', 'service'],
    desc: 'Sala pesi e corsi. Grandi spazi, picchi a gennaio e settembre, calo estivo.',
    size: 350, license: 3000, baseDemand: 230, capPerHour: 30, hours: [7, 22], hourly: 'palestra', days: [1, 1, 1, 1, 1, 1, 0],
    wk: [1.25, 1.15, 1.1, 1.05, 0.9, 0.6, 0.4], mon: [1.4, 1.3, 1.15, 1.05, 1.0, 0.85, 0.7, 0.5, 1.25, 1.15, 1.05, 0.8],
    weather: { pioggia: 1.03, temporale: 1, neve: 0.85, caldo: 0.85, sole: 0.97, nebbia: 1 }, tourism: 0.05, holiday: 0.4,
    sp: {},
    roles: ['istruttore', 'receptionist', 'pulizie', 'manager'], front: 'receptionist', frontMin: 0.6, el: 1.1, iva: 0.22, energy: 45, ecoSens: 0.8,
    products: [
      { id: 'ingresso', n: 'Ingresso sala (quota giornaliera)', r: {}, p: 7, min: 2.5, role: 'istruttore', a: 0.85 },
      { id: 'corso', n: 'Lezione di gruppo', r: {}, p: 10, min: 3, role: 'istruttore', a: 0.3 },
      { id: 'personal', n: 'Personal training', r: {}, p: 40, min: 60, role: 'istruttore', a: 0.025 },
      { id: 'barretta', n: 'Integratori / barrette', r: { integratori: 1 }, p: 3.5, min: 0.3, role: 'receptionist', a: 0.15 },
      { id: 'premium', n: 'Pacchetto premium (sauna + corsi)', r: { biancheria: 1 }, p: 18, min: 3, role: 'istruttore', a: 0.08, lock: 'benessere' },
    ],
    equip: [
      { cat: 'cardio', n: 'Macchine cardio', kind: 'phys', req: true, cost: 15000, en: 8 },
      { cat: 'pesi', n: 'Pesi e isotoniche', kind: 'quality', req: true, cost: 12000, en: 0 },
      { cat: 'spogliatoi', n: 'Spogliatoi e docce', kind: 'quality', req: true, cost: 8000, en: 10 },
      { cat: 'sala_corsi', n: 'Sala corsi attrezzata', kind: 'phys', req: false, cost: 6000, en: 3, fx: [1.15, 1.25, 1.35] },
      { cat: 'reception', n: 'Reception e tornelli', kind: 'speed', req: false, cost: 2500, en: 1, fx: [1.05, 1.1, 1.15] },
    ],
  },
  officina: {
    name: 'Officina meccanica', sector: 'Servizi', mode: 'shop', tags: ['shop', 'service'],
    desc: 'Tagliandi, gomme e riparazioni. Scontrino alto, servono meccanici esperti e attrezzature costose.',
    size: 220, license: 2500, baseDemand: 48, capPerHour: 1.6, hours: [8, 18], hourly: 'officina', days: [1, 1, 1, 1, 1, 1, 0],
    wk: [1.15, 1.05, 1, 1, 1, 0.6, 0], mon: [0.9, 0.9, 1, 1.15, 1.05, 1, 1.05, 0.7, 1.05, 1.1, 1.2, 0.95],
    weather: { pioggia: 1, temporale: 1, neve: 1.1, caldo: 1, sole: 1, nebbia: 1 }, tourism: 0, holiday: 0,
    sp: {},
    roles: ['meccanico', 'receptionist', 'magazziniere', 'manager'], front: null, el: 0.9, iva: 0.22, energy: 25, ecoSens: 0.7,
    products: [
      { id: 'tagliando', n: 'Tagliando', r: { olio_motore: 4, ricambi: 0.5 }, p: 175, min: 70, role: 'meccanico', a: 0.4 },
      { id: 'gomme', n: 'Cambio pneumatici (4)', r: { pneumatici: 4 }, p: 330, min: 45, role: 'meccanico', a: 0.15, eq: 'smontagomme', mon: [0.5, 0.4, 0.8, 2, 1.5, 0.5, 0.4, 0.3, 0.6, 1.4, 2.4, 1.2] },
      { id: 'freni', n: 'Riparazione freni', r: { ricambi: 2 }, p: 230, min: 90, role: 'meccanico', a: 0.15 },
      { id: 'diagnosi', n: 'Diagnosi elettronica', r: {}, p: 50, min: 30, role: 'meccanico', a: 0.25, eq: 'diagnosi' },
      { id: 'revisione', n: 'Revisione', r: {}, p: 80, min: 40, role: 'meccanico', a: 0.2 },
      { id: 'elettriche', n: 'Assistenza auto elettriche', r: { ricambi: 1 }, p: 160, min: 60, role: 'meccanico', a: 0.08, lock: 'auto_elettriche', eq: 'diagnosi' },
    ],
    equip: [
      { cat: 'ponti', n: 'Ponti sollevatori', kind: 'phys', req: true, cost: 9000, en: 5 },
      { cat: 'attrezzi', n: 'Attrezzatura da officina', kind: 'speed', req: true, cost: 5000, en: 2 },
      { cat: 'diagnosi', n: 'Strumenti di diagnosi', kind: 'quality', req: false, cost: 4500, en: 1 },
      { cat: 'smontagomme', n: 'Smontagomme ed equilibratrice', kind: 'speed', req: false, cost: 4000, en: 2, fx: [1.02, 1.05, 1.08] },
      { cat: 'cassa', n: 'Registratore di cassa telematico', kind: 'speed', req: true, cost: 650, en: 0, fx: [1, 1.03, 1.06] },
    ],
  },
  hotel: {
    name: 'Hotel / B&B', sector: 'Servizi', mode: 'shop', capMode: 'day', roomM2: 32, rentFactor: 0.5, tags: ['shop', 'service', 'food'],
    desc: 'Camere e colazioni. Dipende moltissimo dal turismo: rende al massimo nelle città d\'arte e di mare.',
    size: 650, license: 5000, baseDemand: 60, capPerHour: 0, hours: [0, 24], hourly: 'sempre', days: [1, 1, 1, 1, 1, 1, 1],
    wk: [0.85, 0.85, 0.9, 0.95, 1.2, 1.35, 0.9], mon: [0.7, 0.75, 0.9, 1.05, 1.05, 1.1, 1.15, 1.1, 1.1, 1, 0.8, 0.95],
    weather: { pioggia: 0.98, temporale: 0.97, neve: 0.95, caldo: 1, sole: 1.02, nebbia: 1 }, tourism: 1.0, holiday: 1.3,
    sp: { finedanno: 1.3, pasqua: 1.25, ferragosto: 1.1 },
    roles: ['receptionist', 'pulizie', 'cameriere', 'cuoco', 'manager'], front: 'receptionist', frontMin: 6, el: 1.1, iva: 0.10, energy: 70, ecoSens: 0.9,
    products: [
      { id: 'camera', n: 'Camera (per notte)', r: { biancheria: 2 }, p: 95, min: 35, role: 'pulizie', a: 1 },
      { id: 'colazione', n: 'Colazione', r: { caffe: 0.01, latte: 0.2, cornetti: 1, frutta: 0.1 }, p: 10, min: 4, role: 'cameriere', a: 0.7, eq: 'cucina' },
      { id: 'cena_h', n: 'Cena in hotel', r: { carne: 0.18, pasta: 0.1, verdure: 0.1, vino: 0.2 }, p: 30, min: 14, role: 'cuoco', a: 0.15, eq: 'cucina' },
      { id: 'spa', n: 'Pacchetto benessere', r: { biancheria: 1 }, p: 45, min: 20, role: 'receptionist', a: 0.1, lock: 'benessere', eq: 'spa' },
    ],
    equip: [
      { cat: 'camere', n: 'Arredo camere', kind: 'quality', req: true, cost: 35000, en: 0 },
      { cat: 'reception', n: 'Reception e gestionale prenotazioni', kind: 'speed', req: true, cost: 4000, en: 2 },
      { cat: 'cucina', n: 'Cucina per colazioni', kind: 'speed', req: false, cost: 9000, en: 10, fx: [1, 1.1, 1.2] },
      { cat: 'lavanderia_h', n: 'Lavanderia interna', kind: 'speed', req: false, cost: 7000, en: 8, fx: [1.06, 1.1, 1.15] },
      { cat: 'spa', n: 'Centro benessere', kind: 'quality', req: false, cost: 40000, en: 25 },
    ],
  },

  // ===================== PRODUZIONE =====================
  agricola: {
    name: 'Azienda agricola', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Coltivi grano, frutta e verdura o allevi bovini da latte. Materie prime per tutta la filiera.',
    size: 20000, rentFactor: 0.012, propFactor: 0.006, license: 1500, role: 'agricolo', days: [1, 1, 1, 1, 1, 1, 0], energy: 18, iva: 0.04,
    outputs: {
      grano: { in: { fertilizzanti: 0.12 }, perHour: 260, mon: [0.2, 0.2, 0.4, 0.6, 0.9, 2.2, 2.4, 1.6, 1, 0.8, 0.5, 0.2] },
      verdure: { in: { fertilizzanti: 0.15 }, perHour: 55, mon: [0.5, 0.5, 0.8, 1.1, 1.3, 1.4, 1.4, 1.3, 1.2, 1, 0.7, 0.5] },
      frutta: { in: { fertilizzanti: 0.1 }, perHour: 50, mon: [0.4, 0.3, 0.4, 0.7, 1.1, 1.5, 1.6, 1.6, 1.4, 1.1, 0.7, 0.5] },
      latte: { in: { mangime: 1.1 }, perHour: 85, eq: 'stalla' },
    },
    roles: ['agricolo', 'magazziniere', 'manager'],
    equip: [
      { cat: 'trattore', n: 'Trattori e macchine agricole', kind: 'prod', req: true, cost: 28000, en: 8, val: 2600 },
      { cat: 'irrigazione', n: 'Impianto di irrigazione', kind: 'quality', req: false, cost: 9000, en: 4 },
      { cat: 'stalla', n: 'Stalla e mungitrici', kind: 'prod', req: false, cost: 35000, en: 6, val: 1300, only: 'latte' },
    ],
  },
  mulino: {
    name: 'Mulino', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Trasforma il grano in farina per panetterie, pizzerie e pastifici.',
    size: 400, license: 2500, role: 'operaio', days: [1, 1, 1, 1, 1, 0, 0], energy: 27, iva: 0.04,
    outputs: { farina: { in: { grano: 1.3 }, perHour: 150 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'macina', n: 'Macine e laminatoi', kind: 'prod', req: true, cost: 30000, en: 13, val: 1100 },
      { cat: 'setacci', n: 'Setacciatura e pulitura', kind: 'quality', req: false, cost: 8000, en: 5 },
    ],
  },
  torrefazione: {
    name: 'Torrefazione', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Tosta il caffè verde e rifornisce i bar, tuoi e degli altri.',
    size: 300, license: 2500, role: 'operaio', days: [1, 1, 1, 1, 1, 0, 0], energy: 20, iva: 0.10,
    outputs: { caffe: { in: { caffe_verde: 1.2 }, perHour: 14 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'tostatrice', n: 'Tostatrice', kind: 'prod', req: true, cost: 38000, en: 10, val: 100 },
      { cat: 'confezionatrice', n: 'Confezionatrice', kind: 'quality', req: false, cost: 9000, en: 4 },
    ],
  },
  caseificio: {
    name: 'Caseificio', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Trasforma il latte in mozzarella e formaggi.',
    size: 350, license: 3000, role: 'operaio', days: [1, 1, 1, 1, 1, 1, 0], energy: 23, iva: 0.04,
    outputs: { mozzarella: { in: { latte: 5.5 }, perHour: 16 }, formaggi: { in: { latte: 8 }, perHour: 11 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'caldaie', n: 'Caldaie e filatrici', kind: 'prod', req: true, cost: 32000, en: 11, val: 130 },
      { cat: 'celle', n: 'Celle di stagionatura', kind: 'quality', req: false, cost: 10000, en: 8 },
    ],
  },
  pastificio: {
    name: 'Pastificio', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Produce pasta secca da farina per ristoranti e supermercati.',
    size: 450, license: 2500, role: 'operaio', days: [1, 1, 1, 1, 1, 0, 0], energy: 25, iva: 0.04,
    outputs: { pasta: { in: { farina: 1.05 }, perHour: 45 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'linea_pasta', n: 'Linea di trafilatura', kind: 'prod', req: true, cost: 34000, en: 11, val: 330 },
      { cat: 'essiccatoio', n: 'Essiccatoio lento', kind: 'quality', req: false, cost: 9000, en: 6 },
    ],
  },
  forno_industriale: {
    name: 'Forno industriale', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Pane e cornetti in grandi quantità per bar, minimarket e hotel.',
    size: 400, license: 2500, role: 'fornaio', days: [1, 1, 1, 1, 1, 1, 0], energy: 32, iva: 0.04,
    outputs: { pane: { in: { farina: 0.3, lievito: 0.004 }, perHour: 380 }, cornetti: { in: { farina: 0.04, burro: 0.02, zucchero: 0.01 }, perHour: 330 } },
    roles: ['fornaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'linea_forno', n: 'Linea di cottura a tunnel', kind: 'prod', req: true, cost: 36000, en: 15, val: 3000 },
      { cat: 'surgelazione', n: 'Abbattitore e surgelazione', kind: 'quality', req: false, cost: 12000, en: 10 },
    ],
  },
  laboratorio_tessile: {
    name: 'Laboratorio tessile', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Confeziona capi di abbigliamento a partire dal tessuto.',
    size: 300, license: 2000, role: 'operaio', days: [1, 1, 1, 1, 1, 0, 0], energy: 14, iva: 0.22,
    outputs: { maglieria: { in: { tessuto: 1.3 }, perHour: 9 }, pantaloni: { in: { tessuto: 1.6 }, perHour: 6 }, capispalla: { in: { tessuto: 2.6 }, perHour: 2.6 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'macchine_cucire', n: 'Macchine da cucire industriali', kind: 'prod', req: true, cost: 18000, en: 3, val: 150 },
      { cat: 'taglio', n: 'Sistema di taglio CAD', kind: 'quality', req: false, cost: 14000, en: 4 },
    ],
  },
  birrificio: {
    name: 'Birrificio', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Birra artigianale per bar e pizzerie.',
    size: 350, license: 4000, role: 'operaio', days: [1, 1, 1, 1, 1, 0, 0], energy: 23, iva: 0.22,
    outputs: { birra: { in: { malto: 0.25, luppolo: 0.005 }, perHour: 45 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'impianto', n: 'Impianto di cotta e fermentatori', kind: 'prod', req: true, cost: 42000, en: 13, val: 330 },
      { cat: 'imbottigliatrice', n: 'Imbottigliatrice', kind: 'quality', req: false, cost: 10000, en: 4 },
    ],
  },
  salumificio: {
    name: 'Salumificio', sector: 'Produzione', mode: 'production', tags: ['production'],
    desc: 'Lavora la carne per produrre salumi.',
    size: 400, license: 3500, role: 'operaio', days: [1, 1, 1, 1, 1, 0, 0], energy: 25, iva: 0.10,
    outputs: { salumi: { in: { carne: 1.2 }, perHour: 14 } },
    roles: ['operaio', 'magazziniere', 'manager'],
    equip: [
      { cat: 'linea_salumi', n: 'Linea di lavorazione carni', kind: 'prod', req: true, cost: 36000, en: 11, val: 95 },
      { cat: 'stagionatura', n: 'Celle di stagionatura', kind: 'quality', req: false, cost: 12000, en: 10 },
    ],
  },
};
const TYPE_ICON = { bar: '☕', panetteria: '🥖', lavanderia: '🧺', ristorante: '🍝', pizzeria: '🍕', gelateria: '🍦', minimarket: '🛒', abbigliamento: '👕', parrucchiere: '✂️', palestra: '💪', officina: '🔧', hotel: '🛏️', agricola: '🌽', mulino: '🌾', torrefazione: '🫘', caseificio: '🧀', pastificio: '🍜', forno_industriale: '🍞', laboratorio_tessile: '🧵', birrificio: '🍺', salumificio: '🥓' };
for (const [id, t] of Object.entries(BUSINESS_TYPES)) {
  t.id = id;
  t.icon = TYPE_ICON[id] || '🏪';
  if (t.mode === 'shop') {
    const mats = new Set();
    for (const p of t.products) for (const m in p.r) mats.add(m);
    t.materials = [...mats];
  } else {
    const mats = new Set();
    for (const o in t.outputs) for (const m in t.outputs[o].in) mats.add(m);
    t.materials = [...mats];
  }
}

// domanda all'ingrosso giornaliera (unità al prezzo di riferimento) per ogni prodotto industriale
const WHOLESALE_DEMAND = {
  grano: 2400, verdure: 450, frutta: 450, latte: 900, farina: 1400, caffe: 65, mozzarella: 200, formaggi: 140,
  pasta: 600, pane: 3200, cornetti: 2600, maglieria: 120, pantaloni: 75, capispalla: 26, birra: 450, salumi: 110,
};

// ---------------- Miglioramenti ----------------
// for: 'all' | 'shop' | 'production' | tag | [tipi]
const UPGRADES = [
  { id: 'insegna', n: 'Insegna luminosa', d: '+4% clienti.', cost: 1800, for: 'shop', fx: { demand: 1.04 } },
  { id: 'ristrutturazione', n: 'Ristrutturazione del locale', d: '+5 qualità percepita, +5 soddisfazione.', cost: 0, m2: 160, for: 'shop', fx: { quality: 5, sat: 5 } },
  { id: 'ampliamento', n: 'Ampliamento (+30% superficie)', d: 'Aumenta la capacità del 30%. Aumenta anche l\'affitto (se in affitto) e le utenze.', cost: 2500, m2: 380, for: 'all', fx: { size: 1.3 } },
  { id: 'dehors', n: 'Dehors e tavoli all\'aperto', d: 'Da aprile a settembre +30% capacità e +6% clienti. Canone suolo pubblico 140 €/mese.', cost: 4000, monthly: 140, for: ['bar', 'ristorante', 'pizzeria', 'gelateria'], fx: { dehors: true } },
  { id: 'pos', n: 'POS e cassa veloce', d: '+4% velocità del personale.', cost: 900, monthly: 15, for: 'shop', fx: { speed: 1.04 } },
  { id: 'cella', n: 'Cella frigorifera', d: 'Le merci deperibili durano il 60% in più.', cost: 4200, for: 'food', fx: { shelf: 1.6 } },
  { id: 'fotovoltaico', n: 'Impianto fotovoltaico', d: '-35% costi energetici.', cost: 4000, m2: 40, for: 'all', fx: { energy: 0.65 } },
  { id: 'sito', n: 'Sito web e prenotazioni online', d: '+5% clienti. Hosting 30 €/mese.', cost: 1500, monthly: 30, for: 'shop', fx: { demand: 1.05 } },
  { id: 'delivery', n: 'Consegna a domicilio (app)', d: '+14% clienti, ma l\'app trattiene il 6% dell\'incasso totale. 150 €/mese.', cost: 800, monthly: 150, for: ['bar', 'ristorante', 'pizzeria', 'gelateria', 'minimarket', 'panetteria'], fx: { demand: 1.14, commission: 0.06 } },
  { id: 'clima', n: 'Climatizzazione', d: 'Annulla il calo di clienti con il caldo afoso, +3 soddisfazione.', cost: 5500, for: 'shop', fx: { heatProof: true, sat: 3 } },
  { id: 'wifi', n: 'Wi-Fi gratuito', d: '+3% clienti. 30 €/mese.', cost: 300, monthly: 30, for: ['bar', 'gelateria', 'hotel', 'palestra', 'lavanderia'], fx: { demand: 1.03 } },
  { id: 'fedelta', n: 'Programma fedeltà', d: '+5% clienti, +2 soddisfazione. 60 €/mese.', cost: 1200, monthly: 60, for: 'shop', fx: { demand: 1.05, sat: 2 } },
  { id: 'allarme', n: 'Allarme e videosorveglianza', d: 'Riduce dell\'80% furti e rapine. 40 €/mese.', cost: 2200, monthly: 40, for: 'all', fx: { theft: 0.2 } },
  { id: 'gestionale', n: 'Software gestionale', d: '-30% sprechi, +2% velocità, riordini automatici più precisi. 60 €/mese.', cost: 1800, monthly: 60, for: 'all', fx: { waste: 0.7, speed: 1.02 } },
  { id: 'manutenzione', n: 'Contratto di manutenzione', d: 'Le attrezzature si usurano la metà e si guastano molto meno. 180 €/mese.', cost: 0, monthly: 180, for: 'all', fx: { wear: 0.5 } },
  { id: 'generatore', n: 'Gruppo elettrogeno', d: 'Protegge dai blackout.', cost: 2600, for: 'all', fx: { blackout: true } },
  { id: 'giochi', n: 'Area bimbi', d: '+8% clienti nel weekend.', cost: 2500, for: ['ristorante', 'pizzeria', 'gelateria'], fx: { weekend: 1.08 } },
  { id: 'parcheggio', n: 'Parcheggio clienti', d: '+6% clienti (non disponibile in centro storico).', cost: 9000, for: 'shop', fx: { demand: 1.06 }, notIn: 'centro' },
  { id: 'insonorizzazione', n: 'Insonorizzazione', d: '+4 soddisfazione.', cost: 3500, for: ['ristorante', 'pizzeria', 'palestra', 'hotel'], fx: { sat: 4 } },
  { id: 'automazione', n: 'Linea automatizzata', d: '+35% capacità produttiva delle macchine e +20% produttività del personale.', cost: 26000, for: 'production', fx: { prodCap: 1.35, speed: 1.2 } },
  { id: 'magazzino_auto', n: 'Magazzino automatico', d: '-30% sprechi, +5% produttività.', cost: 12000, for: 'production', fx: { waste: 0.7, speed: 1.05 } },
  { id: 'certificazione', n: 'Certificazione qualità / BIO', d: '+6 qualità, prezzo all\'ingrosso accettato +10%. 100 €/mese.', cost: 6000, monthly: 100, for: 'production', fx: { quality: 6, wholesale: 1.1 } },
  { id: 'logistica', n: 'Furgone per consegne', d: 'Consegne interne alle tue attività in 1 giorno anche verso altre città.', cost: 22000, monthly: 250, for: 'production', fx: { fastShip: true } },
];
const UPGRADE = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

// ---------------- Ricerca e sviluppo ----------------
const RESEARCH = [
  { id: 'caffe_specialty', n: 'Caffè specialty', d: 'Sblocca il "Caffè specialty" nei bar.', cost: 6000, days: 20 },
  { id: 'brunch', n: 'Format brunch', d: 'Sblocca il "Brunch completo" nei bar.', cost: 9000, days: 25 },
  { id: 'lievito_madre', n: 'Lievito madre', d: 'Sblocca il "Pane a lievito madre" nelle panetterie.', cost: 7000, days: 25 },
  { id: 'pizza_gourmet', n: 'Pizza gourmet', d: 'Sblocca la "Pizza gourmet" nelle pizzerie.', cost: 9000, days: 25 },
  { id: 'gelato_vegano', n: 'Gelato vegano', d: 'Sblocca il "Gelato vegano" nelle gelaterie.', cost: 6000, days: 20 },
  { id: 'menu_degustazione', n: 'Alta cucina', d: 'Sblocca il "Menù degustazione" nei ristoranti.', cost: 15000, days: 35 },
  { id: 'gastronomia', n: 'Gastronomia pronta', d: 'Sblocca i "Piatti pronti" nei minimarket.', cost: 8000, days: 25 },
  { id: 'linea_propria', n: 'Linea moda a marchio proprio', d: 'Sblocca la "Linea a marchio proprio" nei negozi di abbigliamento.', cost: 18000, days: 40 },
  { id: 'trattamenti_premium', n: 'Trattamenti premium', d: 'Sblocca il "Trattamento alla cheratina" dai parrucchieri.', cost: 7000, days: 20 },
  { id: 'benessere', n: 'Benessere e spa', d: 'Sblocca pacchetti benessere in palestre e hotel.', cost: 16000, days: 35 },
  { id: 'auto_elettriche', n: 'Auto elettriche', d: 'Sblocca l\'assistenza alle auto elettriche nelle officine.', cost: 20000, days: 45 },
  { id: 'energia', n: 'Efficienza energetica', d: '-15% costi energetici in tutte le attività.', cost: 15000, days: 40 },
  { id: 'logistica_r', n: 'Logistica ottimizzata', d: '-4% prezzo dei materiali e consegne più affidabili.', cost: 22000, days: 45 },
  { id: 'scorte', n: 'Gestione scorte avanzata', d: '-30% sprechi di merce scaduta.', cost: 12000, days: 30 },
  { id: 'qualita', n: 'Sistema qualità totale', d: '+4 qualità a tutti i prodotti.', cost: 25000, days: 50, req: ['scorte'] },
  { id: 'formazione', n: 'Accademia interna', d: 'Corsi di formazione -30% e crescita delle competenze +30%.', cost: 18000, days: 40 },
  { id: 'welfare', n: 'Welfare aziendale', d: '+5 morale a tutti i dipendenti.', cost: 20000, days: 40, req: ['formazione'] },
  { id: 'digital', n: 'Marketing digitale', d: '+25% efficacia delle campagne pubblicitarie.', cost: 14000, days: 30 },
  { id: 'automazione_r', n: 'Industria 4.0', d: '+20% capacità di tutte le linee produttive.', cost: 40000, days: 60 },
  { id: 'export', n: 'Rete export', d: '+40% domanda all\'ingrosso per i tuoi prodotti industriali.', cost: 50000, days: 60, req: ['logistica_r'] },
  { id: 'finanza', n: 'Ufficio finanza', d: '-0,5 punti sui tassi dei nuovi prestiti.', cost: 30000, days: 45 },
  { id: 'franchising', n: 'Modello di franchising', d: 'Permette di vendere il tuo marchio in franchising (richiede un marchio con almeno 5 attività).', cost: 60000, days: 75, req: ['digital'] },
];
const RESEARCH_BY = Object.fromEntries(RESEARCH.map(r => [r.id, r]));

// ---------------- Marketing ----------------
const CAMPAIGNS = [
  { id: 'volantini', n: 'Volantinaggio di quartiere', cost: 250, days: 10, scope: 'biz', aw: 6, d: 'Una singola attività.' },
  { id: 'social', n: 'Campagna social sponsorizzata', cost: 700, days: 20, scope: 'biz', aw: 11, d: 'Una singola attività.' },
  { id: 'giornale', n: 'Inserzione su giornale locale', cost: 1500, days: 14, scope: 'city', aw: 7, d: 'Tutte le tue attività in una città.' },
  { id: 'radio', n: 'Spot radio locale', cost: 3800, days: 21, scope: 'city', aw: 12, d: 'Tutte le tue attività in una città.' },
  { id: 'affissioni', n: 'Cartellonistica', cost: 5500, days: 30, scope: 'city', aw: 13, d: 'Tutte le tue attività in una città.' },
  { id: 'sponsor', n: 'Sponsorizzazione evento cittadino', cost: 9000, days: 10, scope: 'city', aw: 16, d: 'Tutte le tue attività in una città.' },
  { id: 'web_naz', n: 'Campagna web nazionale', cost: 15000, days: 30, scope: 'brand', aw: 10, d: 'Tutte le attività di un marchio, in ogni città.' },
  { id: 'tv', n: 'Spot TV nazionale', cost: 60000, days: 30, scope: 'brand', aw: 22, d: 'Tutte le attività di un marchio, in ogni città.' },
];
const CAMPAIGN = Object.fromEntries(CAMPAIGNS.map(c => [c.id, c]));

// ---------------- Formazione ----------------
const COURSES = [
  { id: 'base', n: 'Corso base', cost: 350, days: 3, skill: 8, max: 60 },
  { id: 'avanzato', n: 'Corso avanzato', cost: 1100, days: 6, skill: 14, min: 35, max: 85 },
  { id: 'master', n: 'Masterclass', cost: 3000, days: 10, skill: 18, min: 60, max: 100 },
  { id: 'sicurezza', n: 'Corso sicurezza e HACCP', cost: 200, days: 1, skill: 2, max: 100, morale: 3 },
];

// ---------------- Banche ----------------
const BANKS = [
  { id: 'locale', n: 'Banca di Credito Locale', spread: 0.8, mult: 1.0, minScore: 22, d: 'Conosce il territorio: concede credito anche a chi parte da zero, ma con tassi più alti.' },
  { id: 'nazionale', n: 'Banca Nazionale Italiana', spread: 0.0, mult: 1.6, minScore: 45, d: 'Importi elevati a tassi nella media. Vuole un buon rating.' },
  { id: 'online', n: 'FinDigit Banca Online', spread: -0.4, mult: 0.7, minScore: 55, d: 'Tassi bassi e zero burocrazia, ma importi contenuti e solo a clienti affidabili.' },
];

// ---------------- Borsa ----------------
const STOCKS = [
  { tk: 'CAFI', n: 'Caffè Italia Group', sector: 'Ristorazione', types: ['bar'], price: 8.4, shares: 6e6, vol: 0.017, beta: 1.0, div: 0.028 },
  { tk: 'FORN', n: 'Forneria Nazionale', sector: 'Alimentare', types: ['panetteria', 'forno_industriale'], price: 11.2, shares: 5e6, vol: 0.015, beta: 0.8, div: 0.03 },
  { tk: 'GUST', n: 'Gusto & Tavola', sector: 'Ristorazione', types: ['ristorante', 'pizzeria'], price: 14.6, shares: 7e6, vol: 0.019, beta: 1.1, div: 0.022 },
  { tk: 'MODA', n: 'Moda Italiana', sector: 'Moda', types: ['abbigliamento'], price: 21.3, shares: 6e6, vol: 0.022, beta: 1.3, div: 0.018 },
  { tk: 'SPES', n: 'SpesaFacile', sector: 'Distribuzione', types: ['minimarket'], price: 6.9, shares: 12e6, vol: 0.012, beta: 0.6, div: 0.035 },
  { tk: 'FITN', n: 'FitLife', sector: 'Servizi', types: ['palestra', 'parrucchiere'], price: 9.8, shares: 4e6, vol: 0.024, beta: 1.2, div: 0.01 },
  { tk: 'HOTL', n: 'Ospitalità Italiana', sector: 'Turismo', types: ['hotel'], price: 17.5, shares: 8e6, vol: 0.02, beta: 1.2, div: 0.025 },
  { tk: 'BNIT', n: 'Banca Italiana Unita', sector: 'Banche', price: 12.1, shares: 900e6, vol: 0.019, beta: 1.3, div: 0.06 },
  { tk: 'ENER', n: 'Energia Nazionale', sector: 'Energia', price: 7.3, shares: 1000e6, vol: 0.013, beta: 0.7, div: 0.055 },
  { tk: 'TDIG', n: 'Tecnologie Digitali', sector: 'Tecnologia', price: 34.2, shares: 150e6, vol: 0.028, beta: 1.6, div: 0.0 },
  { tk: 'AUTI', n: 'Automotive Italia', sector: 'Industria', price: 15.6, shares: 300e6, vol: 0.022, beta: 1.3, div: 0.03 },
  { tk: 'TELC', n: 'TeleRete', sector: 'Telecomunicazioni', price: 2.8, shares: 2000e6, vol: 0.016, beta: 0.8, div: 0.045 },
  { tk: 'FARM', n: 'Farmaceutica del Nord', sector: 'Salute', price: 48.0, shares: 120e6, vol: 0.014, beta: 0.6, div: 0.025 },
  { tk: 'COST', n: 'Costruzioni Generali', sector: 'Costruzioni', price: 9.4, shares: 200e6, vol: 0.021, beta: 1.4, div: 0.02 },
  { tk: 'LUSS', n: 'Lusso & Stile', sector: 'Lusso', price: 62.0, shares: 80e6, vol: 0.019, beta: 1.1, div: 0.015 },
  { tk: 'BTP', n: 'ETF Titoli di Stato', sector: 'Obbligazioni', price: 100, shares: 1e9, vol: 0.003, beta: 0.1, div: 0.035 },
];

// ---------------- Nomi ----------------
const NAMES_M = ['Marco', 'Luca', 'Giuseppe', 'Francesco', 'Alessandro', 'Andrea', 'Matteo', 'Lorenzo', 'Davide', 'Simone', 'Federico', 'Riccardo', 'Stefano', 'Paolo', 'Giovanni', 'Antonio', 'Roberto', 'Fabio', 'Daniele', 'Emanuele', 'Nicola', 'Salvatore', 'Michele', 'Gabriele', 'Tommaso', 'Pietro', 'Vincenzo', 'Claudio', 'Massimo', 'Enrico', 'Samuele', 'Diego', 'Filippo', 'Alberto', 'Mario'];
const NAMES_F = ['Giulia', 'Francesca', 'Chiara', 'Sara', 'Martina', 'Valentina', 'Alessia', 'Elena', 'Federica', 'Silvia', 'Laura', 'Anna', 'Paola', 'Roberta', 'Elisa', 'Marta', 'Ilaria', 'Giorgia', 'Beatrice', 'Camilla', 'Sofia', 'Aurora', 'Alice', 'Noemi', 'Serena', 'Monica', 'Barbara', 'Cristina', 'Daniela', 'Veronica', 'Rita', 'Lucia', 'Simona', 'Irene', 'Carla'];
const SURNAMES = ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', 'D\'Angelo', 'Marchetti', 'Parisi', 'Villa', 'Conte', 'Ferraro', 'Ferri', 'Fabbri', 'Bianco', 'Marini', 'Grasso', 'Valentini', 'Messina', 'Sala', 'De Angelis', 'Gatti', 'Pellegrini', 'Palumbo', 'Sanna', 'Farina', 'Rizzi', 'Monti'];
const TRAITS = {
  affidabile: { n: 'Affidabile', d: 'Si ammala meno e non si assenta.', sick: 0.5 },
  veloce: { n: 'Veloce', d: '+10% produttività.', eff: 1.1 },
  preciso: { n: 'Preciso', d: '+5 qualità del lavoro.', q: 5 },
  simpatico: { n: 'Simpatico', d: '+4 soddisfazione dei clienti.', sat: 4 },
  ambizioso: { n: 'Ambizioso', d: 'Impara in fretta ma chiede aumenti più spesso.', learn: 1.5, raise: 2 },
  leale: { n: 'Leale', d: 'Difficilmente si dimette.', quit: 0.3 },
  pigro: { n: 'Pigro', d: '-10% produttività.', eff: 0.9 },
  lunatico: { n: 'Lunatico', d: 'Il morale oscilla molto.', moodSwing: 2 },
  resistente: { n: 'Resistente', d: 'Si stanca la metà.', fatigue: 0.5 },
  leader: { n: 'Leader', d: '+3 morale ai colleghi della stessa attività.', team: 3 },
};
const COMPETITOR_NAMES = {
  bar: ['Bar Centrale', 'Caffè Aurora', 'Bar Stella', 'Caffè del Corso', 'Bar Sport', 'Caffetteria Italia', 'Bar Roma', 'Caffè Garibaldi', 'Bar Duomo', 'Caffè Liberty', 'Bar Gioia', 'Caffè Nero'],
  panetteria: ['Forno Antico', 'Panificio Bianchi', 'Il Fornaio', 'Forno del Borgo', 'Pane & Co.', 'Panetteria Moderna', 'Forno San Marco', 'Bontà del Forno'],
  lavanderia: ['Lavasecco Rapido', 'Lavanderia Bolle Blu', 'Puliti & Profumati', 'Lavanderia Express', 'Il Bucato', 'Lavanderia Candida'],
  ristorante: ['Trattoria da Mario', 'Osteria del Ponte', 'Ristorante La Pergola', 'Trattoria Il Cortile', 'Ristorante Belvedere', 'Osteria dei Sapori', 'La Locanda'],
  pizzeria: ['Pizzeria Vesuvio', 'Pizzeria Da Gennaro', 'Pizza Napoli', 'Pizzeria Il Forno', 'Pizzeria Bella Italia', 'Pizzeria Margherita', 'Pizzeria Totò'],
  gelateria: ['Gelateria Polare', 'Gelateria Dolce Vita', 'Il Gelato Artigiano', 'Gelateria Cremeria', 'Gelateria Fragola', 'Gelateria Cioccolato'],
  minimarket: ['Market Sì', 'Alimentari Da Franco', 'Minimarket Sole', 'SuperSotto Casa', 'Spesa Più', 'Bottega Alimentare'],
  abbigliamento: ['Boutique Eleganza', 'Moda Giovane', 'Stile Urbano', 'Atelier Chic', 'Jeans Point', 'Outlet Moda'],
  parrucchiere: ['Salone Bellezza', 'Barberia Classica', 'Hair Studio', 'Acconciature Lucia', 'Il Barbiere', 'Taglio & Stile'],
  palestra: ['FitClub', 'Palestra Olimpia', 'Gym Power', 'Centro Fitness Vita', 'Body Studio', 'Palestra Titan'],
  officina: ['Autofficina Rossi', 'Garage Moderno', 'Officina Turbo', 'AutoService', 'Officina Pistone', 'Car Doctor'],
  hotel: ['Hotel Centrale', 'Albergo Bellavista', 'B&B La Corte', 'Hotel Excelsior', 'Residenza Storica', 'Hotel Miramonti'],
};
