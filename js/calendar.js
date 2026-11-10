'use strict';
/* ============================================================
   EMPIRE - calendario italiano, festività, stagioni, meteo
   ============================================================ */

function easterDay(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1, day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayFromYMD(y, month, day);
}

const _yearCache = {};
function yearCalendar(y) {
  if (_yearCache[y]) return _yearCache[y];
  const H = {};
  const add = (m, d, n) => { H[dayFromYMD(y, m, d)] = n; };
  add(0, 1, 'Capodanno'); add(0, 6, 'Epifania'); add(3, 25, 'Festa della Liberazione');
  add(4, 1, 'Festa dei Lavoratori'); add(5, 2, 'Festa della Repubblica'); add(7, 15, 'Ferragosto');
  add(10, 1, 'Ognissanti'); add(11, 8, 'Immacolata Concezione'); add(11, 25, 'Natale'); add(11, 26, 'Santo Stefano');
  const easter = easterDay(y);
  H[easter] = 'Pasqua'; H[easter + 1] = 'Lunedì dell\'Angelo';
  // Black Friday: ultimo venerdì di novembre
  let bf = dayFromYMD(y, 10, 30); while (ymd(bf).wd !== 4) bf--;
  // Festa della mamma: seconda domenica di maggio
  let fm = dayFromYMD(y, 4, 1); while (ymd(fm).wd !== 6) fm++; fm += 7;
  // Saldi estivi: primo sabato di luglio
  let se = dayFromYMD(y, 6, 1); while (ymd(se).wd !== 5) se++;
  const carnevale = easter - 47;
  _yearCache[y] = { H, easter, bf, fm, se, carnevale };
  return _yearCache[y];
}

function seasonOf(m) { return m <= 1 || m === 11 ? 'inverno' : m <= 4 ? 'primavera' : m <= 7 ? 'estate' : 'autunno'; }
const SEASON_NAMES = { inverno: 'Inverno', primavera: 'Primavera', estate: 'Estate', autunno: 'Autunno' };

/** Informazioni complete su un giorno */
function dayInfo(day) {
  const t = ymd(day);
  const C = yearCalendar(t.y);
  const holiday = C.H[day] || null;
  const sp = {};
  if (t.m === 11 && t.d <= 24) sp.natale = true;
  if (t.m === 11 && t.d >= 27) sp.finedanno = true;
  if (day === dayFromYMD(t.y, 11, 31)) sp.sanSilvestro = true;
  if ((t.m === 0 && t.d >= 5) || t.m === 1) sp.saldi = true;
  if (day >= C.se && t.m <= 7 && t.m >= 6) sp.saldi = true;
  if (day >= C.bf && day <= C.bf + 3) sp.blackfriday = true;
  if (t.m === 1 && t.d === 14) sp.sanvalentino = true;
  if (day === C.fm) sp.festamamma = true;
  if (day >= C.easter - 7 && day <= C.easter + 1) sp.pasqua = true;
  if (day >= C.carnevale - 10 && day <= C.carnevale) sp.carnevale = true;
  if (t.m === 9 && t.d >= 29) sp.halloween = true;
  if (t.m === 7 && t.d >= 8 && t.d <= 22) sp.ferragosto = true;
  if (t.m === 8 && t.d <= 20) sp.rientro = true;
  const labels = [];
  if (sp.natale) labels.push('Periodo natalizio');
  if (sp.saldi) labels.push('Saldi');
  if (sp.blackfriday) labels.push('Black Friday');
  if (sp.sanvalentino) labels.push('San Valentino');
  if (sp.festamamma) labels.push('Festa della mamma');
  if (sp.pasqua && !holiday) labels.push('Settimana di Pasqua');
  if (sp.carnevale) labels.push('Carnevale');
  if (sp.halloween) labels.push('Halloween');
  if (sp.ferragosto && !holiday) labels.push('Ponte di Ferragosto');
  return {
    day, y: t.y, m: t.m, d: t.d, wd: t.wd, holiday, isSunday: t.wd === 6,
    isFestivo: !!holiday || t.wd === 6, season: seasonOf(t.m), sp, labels,
    dim: daysInMonth(t.y, t.m), isLastOfMonth: t.d === daysInMonth(t.y, t.m),
    isTradingDay: t.wd < 5 && !holiday,
  };
}

// ---------- Meteo ----------
const WEATHER = {
  sole: { name: 'Soleggiato', icon: '☀️' },
  nuvoloso: { name: 'Nuvoloso', icon: '☁️' },
  pioggia: { name: 'Pioggia', icon: '🌧️' },
  temporale: { name: 'Temporale', icon: '⛈️' },
  neve: { name: 'Neve', icon: '❄️' },
  caldo: { name: 'Caldo afoso', icon: '🔥' },
  nebbia: { name: 'Nebbia', icon: '🌫️' },
};
// temperatura media mensile per macro-regione
const CLIMATE = {
  nord: [2, 4, 9, 13, 18, 22, 25, 24, 20, 14, 8, 3],
  centro: [7, 8, 11, 14, 18, 23, 26, 26, 22, 17, 12, 8],
  sud: [10, 11, 13, 16, 20, 24, 27, 28, 24, 20, 15, 11],
};
function rollWeather(city, m, prev) {
  const base = CLIMATE[city.region][m];
  const temp = Math.round(base + gauss(0, 3) + (prev ? (prev.temp - base) * 0.4 : 0));
  if (prev && chance(0.55)) {
    let type = prev.type;
    if (type === 'caldo' && temp < 29) type = 'sole';
    if (type === 'neve' && temp > 3) type = 'pioggia';
    return { type, temp };
  }
  const s = seasonOf(m);
  const pRain = { inverno: 0.28, primavera: 0.3, estate: 0.12, autunno: 0.33 }[s] * (city.region === 'sud' ? 0.75 : city.region === 'nord' ? 1.15 : 1);
  const r = rnd();
  let type;
  if (r < pRain) type = temp <= 1 && chance(0.6) ? 'neve' : (s === 'estate' || s === 'autunno') && chance(0.3) ? 'temporale' : 'pioggia';
  else if (r < pRain + 0.25) type = (s === 'inverno' || s === 'autunno') && city.region === 'nord' && chance(0.35) ? 'nebbia' : 'nuvoloso';
  else type = temp >= 30 ? 'caldo' : 'sole';
  return { type, temp };
}
