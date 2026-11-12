/* ============================================================
   EMPIRE - illustrazioni disegnate in SVG, create apposta per il gioco
   (nessuna emoji). Volti dei dipendenti che cambiano espressione
   con il loro stato, macchinari che invecchiano e si rompono.
   ============================================================ */
const OUT = '#2a2633';
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seededPick(h, arr, k) { return arr[(h >>> (k * 3)) % arr.length]; }

// ---------------- VOLTI ----------------
const SKINS = ['#f6d3b8', '#eec29e', '#d9a47c', '#b97f57', '#8d5a3b', '#f3c9a6'];
const HAIRS = ['#2b1d16', '#4a2f1f', '#6b4127', '#a0662f', '#d6b26a', '#1b1b1f', '#7a3320'];
const ROLE_LOOK = {
  barista: { shirt: '#3d6b8f', acc: 'bow' }, cameriere: { shirt: '#f4f1ea', acc: 'bow' },
  cuoco: { shirt: '#ffffff', acc: 'toque' }, pizzaiolo: { shirt: '#ffffff', acc: 'toque', band: '#c8402e' },
  fornaio: { shirt: '#fbf3e3', acc: 'toque' }, gelatiere: { shirt: '#f7d6e4', acc: 'cap', capc: '#e98bb0' },
  commesso: { shirt: '#5a8f6a', acc: 'tag' }, lavanderia: { shirt: '#9cc9e3', acc: 'apron' },
  parrucchiere: { shirt: '#2f2f38', acc: 'comb' }, istruttore: { shirt: '#e2553a', acc: 'band' },
  meccanico: { shirt: '#335c99', acc: 'cap', capc: '#335c99' }, receptionist: { shirt: '#7a5aa6', acc: 'headset' },
  pulizie: { shirt: '#4fa3a0', acc: 'scarf' }, operaio: { shirt: '#4b6a8a', acc: 'helmet', capc: '#f2c230' },
  agricolo: { shirt: '#6f8f3a', acc: 'straw' }, magazziniere: { shirt: '#d27a2c', acc: 'helmet', capc: '#f08a24' },
  manager: { shirt: '#30394d', acc: 'tie', tie: '#c23b3b' }, contabile: { shirt: '#4b5563', acc: 'tie', tie: '#2f6fb3', glasses: true },
  hr: { shirt: '#6d4a7e', acc: 'tie', tie: '#e0a030' }, marketer: { shirt: '#d1495b', acc: 'tie', tie: '#2a2633' },
  areamanager: { shirt: '#1f2a3d', acc: 'tie', tie: '#2f9a5c' }, ricercatore: { shirt: '#ffffff', acc: 'coat', glasses: true },
};

/** stato del viso: ok | felice | stanco | triste | malato | ferie | formazione */
function faceMood(p) {
  if (!p || p.fatigue == null) return 'ok';
  if (p.sickUntil > S.day) return 'malato';
  if (p.holidayUntil > S.day) return 'ferie';
  if (p.trainUntil > S.day) return 'formazione';
  if (p.morale < 40) return 'triste';
  if (p.fatigue > 70) return 'stanco';
  if (p.morale >= 70 && p.fatigue < 50) return 'felice';
  return 'ok';
}
const MOOD_RING = { ok: 'var(--green)', felice: 'var(--green)', stanco: 'var(--red)', triste: 'var(--red)', malato: 'var(--red)', ferie: 'var(--line2)', formazione: 'var(--line2)' };

function face(p, size = 40, moodOverride) {
  const h = hashStr((p.first || '') + (p.last || '') + (p.age || ''));
  const mood = moodOverride || faceMood(p);
  const L = ROLE_LOOK[p.role] || { shirt: '#6b7280' };
  let skin = seededPick(h, SKINS, 1);
  let hair = p.age >= 56 ? '#c9c6c2' : p.age >= 48 && (h & 1) ? '#8d8a86' : seededPick(h, HAIRS, 2);
  const style = (h >>> 9) % 3;
  const fem = !!p.female;
  const bald = !fem && p.age >= 50 && style === 0;
  const glasses = L.glasses || ((h >>> 12) % 7 === 0);
  const beard = !fem && (h >>> 14) % 5 === 0;
  let s = `<circle cx="32" cy="32" r="31" fill="color-mix(in srgb, ${L.shirt} 18%, var(--panel2))"/>`;
  // capelli dietro (lunghi)
  if (fem && style !== 2) s += `<path d="M17 30 Q16 14 32 13 Q48 14 47 30 L48 50 Q40 46 32 46 Q24 46 16 50 Z" fill="${hair}" stroke="${OUT}" stroke-width="1.4"/>`;
  // spalle e collo
  s += `<path d="M9 64 Q11 47 32 46 Q53 47 55 64 Z" fill="${L.shirt}" stroke="${OUT}" stroke-width="1.6"/>`;
  if (L.acc === 'coat') s += `<path d="M32 47 L27 64 M32 47 L37 64" stroke="${OUT}" stroke-width="1.3"/>`;
  if (L.acc === 'apron') s += `<path d="M22 52 Q32 50 42 52 L43 64 L21 64 Z" fill="#ffffff" stroke="${OUT}" stroke-width="1.2"/>`;
  s += `<rect x="27.5" y="39" width="9" height="9" rx="3" fill="${skin}" stroke="${OUT}" stroke-width="1.3"/>`;
  if (L.acc === 'bow') s += `<path d="M27 48 L32 50.5 L27 53 Z M37 48 L32 50.5 L37 53 Z" fill="#2a2633"/>`;
  if (L.acc === 'tie') s += `<path d="M30.5 48 L33.5 48 L35 59 L32 62 L29 59 Z" fill="${L.tie}" stroke="${OUT}" stroke-width="1"/>`;
  if (L.acc === 'tag') s += `<rect x="38" y="52" width="8" height="5" rx="1" fill="#ffffff" stroke="${OUT}" stroke-width="1"/>`;
  if (L.acc === 'comb') s += `<path d="M40 52 L48 52 M41 52 L41 55 M43 52 L43 55 M45 52 L45 55 M47 52 L47 55" stroke="#e0e0e0" stroke-width="1.2"/>`;
  if (L.acc === 'scarf') s += `<path d="M24 47 Q32 52 40 47 L40 50 Q32 55 24 50 Z" fill="#f2c230" stroke="${OUT}" stroke-width="1"/>`;
  // orecchie e testa
  if (mood === 'malato') skin = `color-mix(in srgb, ${skin} 72%, #9bd37a)`;
  s += `<circle cx="19" cy="31" r="3.2" fill="${skin}" stroke="${OUT}" stroke-width="1.3"/><circle cx="45" cy="31" r="3.2" fill="${skin}" stroke="${OUT}" stroke-width="1.3"/>`;
  s += `<ellipse cx="32" cy="29.5" rx="13" ry="14.5" fill="${skin}" stroke="${OUT}" stroke-width="1.6"/>`;
  if (beard) s += `<path d="M20 32 Q21 45 32 45 Q43 45 44 32 Q40 40 32 40 Q24 40 20 32 Z" fill="${hair}" opacity=".9"/>`;
  // capelli sopra
  if (!bald) {
    if (style === 0) s += `<path d="M19 28 Q18 13 32 13 Q46 13 45 28 Q41 19 32 19 Q23 19 19 28 Z" fill="${hair}" stroke="${OUT}" stroke-width="1.4"/>`;
    else if (style === 1) s += `<path d="M19 27 Q19 12 32 13 Q46 12 45 27 Q44 21 38 20 Q36 23 31 20 Q27 23 23 20 Q20 22 19 27 Z" fill="${hair}" stroke="${OUT}" stroke-width="1.4"/>`;
    else s += `<path d="M19 28 Q17 13 32 13 Q47 13 45 28 Q43 18 30 19 Q24 20 19 28 Z" fill="${hair}" stroke="${OUT}" stroke-width="1.4"/>${fem ? `<circle cx="32" cy="11" r="5" fill="${hair}" stroke="${OUT}" stroke-width="1.4"/>` : ''}`;
  } else s += `<path d="M19 29 Q19 24 22 22 M45 29 Q45 24 42 22" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // cappelli di mestiere
  if (L.acc === 'toque') s += `<path d="M21 20 L22 12 Q18 6 25 5 Q28 1 32 4 Q36 1 39 5 Q46 6 42 12 L43 20 Z" fill="#ffffff" stroke="${OUT}" stroke-width="1.5"/>${L.band ? `<rect x="21.5" y="16.5" width="21" height="3.5" fill="${L.band}"/>` : ''}`;
  if (L.acc === 'cap') s += `<path d="M18 22 Q19 11 32 11 Q45 11 46 22 Z" fill="${L.capc}" stroke="${OUT}" stroke-width="1.5"/><path d="M32 21 L52 21 Q50 25 42 24 L32 24 Z" fill="${L.capc}" stroke="${OUT}" stroke-width="1.3"/>`;
  if (L.acc === 'helmet') s += `<path d="M17 23 Q17 9 32 9 Q47 9 47 23 Z" fill="${L.capc}" stroke="${OUT}" stroke-width="1.5"/><rect x="15" y="21.5" width="34" height="3" rx="1.5" fill="${L.capc}" stroke="${OUT}" stroke-width="1.2"/><path d="M32 9 L32 22" stroke="${OUT}" stroke-width="1" opacity=".5"/>`;
  if (L.acc === 'straw') s += `<ellipse cx="32" cy="20" rx="20" ry="4" fill="#e7c66b" stroke="${OUT}" stroke-width="1.4"/><path d="M22 20 Q22 9 32 9 Q42 9 42 20 Z" fill="#e7c66b" stroke="${OUT}" stroke-width="1.4"/><rect x="22" y="16" width="20" height="2.5" fill="#b5412f"/>`;
  if (L.acc === 'band') s += `<rect x="18.5" y="19" width="27" height="3.5" rx="1.5" fill="#ffffff" stroke="${OUT}" stroke-width="1"/>`;
  if (L.acc === 'headset') s += `<path d="M18 30 Q18 13 32 13 Q46 13 46 30" stroke="${OUT}" stroke-width="2" fill="none"/><path d="M20 34 Q22 40 28 40" stroke="${OUT}" stroke-width="1.5" fill="none"/><circle cx="28.5" cy="40" r="1.4" fill="${OUT}"/>`;
  // sopracciglia
  const browSad = mood === 'triste' || mood === 'malato';
  const browTired = mood === 'stanco';
  s += browSad ? `<path d="M23 23 L28 21.5 M41 23 L36 21.5" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>`
    : browTired ? `<path d="M23 23 L28 23.5 M41 23 L36 23.5" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M23 22.5 Q25.5 21 28 22.5 M36 22.5 Q38.5 21 41 22.5" stroke="${OUT}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  // occhi
  if (mood === 'felice' || mood === 'ferie') s += `<path d="M24.5 29 Q26.5 26.5 28.5 29 M35.5 29 Q37.5 26.5 39.5 29" stroke="${OUT}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  else if (mood === 'malato') s += `<path d="M24.5 28 Q26.5 30 28.5 28 M35.5 28 Q37.5 30 39.5 28" stroke="${OUT}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  else if (mood === 'stanco') s += `<circle cx="26.5" cy="28.5" r="2" fill="${OUT}"/><circle cx="37.5" cy="28.5" r="2" fill="${OUT}"/><path d="M23.8 27.8 L29.2 27.8 L29.2 26 L23.8 26 Z M34.8 27.8 L40.2 27.8 L40.2 26 L34.8 26 Z" fill="${skin}"/><path d="M24 28 L29 28 M35 28 L40 28" stroke="${OUT}" stroke-width="1.4"/><path d="M24.5 31.5 Q26.5 32.8 28.5 31.5 M35.5 31.5 Q37.5 32.8 39.5 31.5" stroke="#8b6f9e" stroke-width="1.1" fill="none"/>`;
  else s += `<circle cx="26.5" cy="28" r="2" fill="${OUT}"/><circle cx="37.5" cy="28" r="2" fill="${OUT}"/><circle cx="27.2" cy="27.3" r=".6" fill="#fff"/><circle cx="38.2" cy="27.3" r=".6" fill="#fff"/>`;
  if (glasses && mood !== 'ferie') s += `<circle cx="26.5" cy="28.5" r="4" fill="none" stroke="${OUT}" stroke-width="1.3"/><circle cx="37.5" cy="28.5" r="4" fill="none" stroke="${OUT}" stroke-width="1.3"/><path d="M30.5 28.5 L33.5 28.5" stroke="${OUT}" stroke-width="1.3"/>`;
  if (mood === 'ferie') s += `<path d="M21.5 26 L31 26 L30 31 Q26.5 33 23 31 Z M33 26 L42.5 26 L41 31 Q37.5 33 34 31 Z" fill="#1f2937" stroke="${OUT}" stroke-width="1"/><path d="M31 27 L33 27" stroke="${OUT}" stroke-width="1.4"/>`;
  // guance
  if (mood === 'felice') s += `<ellipse cx="23" cy="34" rx="2.4" ry="1.4" fill="#f08a8a" opacity=".55"/><ellipse cx="41" cy="34" rx="2.4" ry="1.4" fill="#f08a8a" opacity=".55"/>`;
  // bocca
  if (mood === 'felice' || mood === 'ferie') s += `<path d="M26.5 35.5 Q32 41.5 37.5 35.5 Z" fill="#8a3a3a" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/>`;
  else if (mood === 'triste') s += `<path d="M27 39 Q32 34.5 37 39" stroke="${OUT}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  else if (mood === 'stanco') s += `<path d="M28 37.5 L36 37.5" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>`;
  else if (mood === 'malato') s += `<ellipse cx="32" cy="37.5" rx="2" ry="1.6" fill="#8a3a3a" stroke="${OUT}" stroke-width="1.2"/><path d="M33 37 L44 33" stroke="#e8edf2" stroke-width="2.2" stroke-linecap="round"/><path d="M33 37 L44 33" stroke="${OUT}" stroke-width=".7" stroke-linecap="round" opacity=".6"/><circle cx="44" cy="33" r="1.4" fill="#d83a3a"/>`;
  else s += `<path d="M27.5 36 Q32 39.5 36.5 36" stroke="${OUT}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  // segni extra
  if (mood === 'triste' && p.morale < 25) s += `<path d="M39.5 32 Q41.5 35.5 39.5 36.5 Q37.5 35.5 39.5 32 Z" fill="#5aa9e6" stroke="${OUT}" stroke-width=".8"/>`;
  if (mood === 'stanco') s += `<path d="M47 9 L52 9 L47 14 L52 14 M53 3 L57 3 L53 7 L57 7" stroke="var(--muted)" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (mood === 'malato') s += `<path d="M46 17 Q48 21 46 22.5 Q44 21 46 17 Z" fill="#5aa9e6" stroke="${OUT}" stroke-width=".8"/>`;
  if (mood === 'formazione') s += `<path d="M20 15 L32 9 L44 15 L32 20 Z" fill="#2a2633"/><path d="M42 15 L42 22" stroke="#e0a030" stroke-width="1.5"/>`;
  return `<svg class="face" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(p.first || '')}: ${mood}"><g>${s}</g><circle cx="32" cy="32" r="31" fill="none" stroke="${MOOD_RING[mood]}" stroke-width="2.5"/></svg>`;
}

// ---------------- MACCHINARI ----------------
const EQ_SHAPE = {
  macchina_caffe: 'espresso',
  frigo: 'fridge', banco: 'fridge', vetrina: 'fridge', abbattitore: 'fridge', surgelazione: 'fridge', cella_lievitazione: 'cell', celle: 'cell', stagionatura: 'cell', cantina: 'cell',
  forno: 'oven', linea_forno: 'oven', tostatrice: 'oven', essiccatoio: 'cell', caldaie: 'tank', cucina: 'stove',
  impastatrice: 'mixer', mantecatore: 'mixer', macina: 'mixer', setacci: 'mixer', linea_pasta: 'line',
  arredo: 'table', sala: 'table', camere: 'bed', sala_corsi: 'table', postazioni: 'chair', arredo_salone: 'chair', lavatesta: 'chair',
  cassa: 'register', reception: 'register',
  lavastoviglie: 'washer', lavatrici: 'washer', lavanderia_h: 'washer', lavasecco: 'washer', self_service: 'washer', stireria: 'iron',
  scaffali: 'shelf', espositori: 'shelf', vetrine: 'shelf', camerini: 'shelf', spogliatoi: 'shelf',
  attrezzi: 'tools', diagnosi: 'screen', smontagomme: 'tools', ponti: 'lift', taglio: 'screen', macchine_cucire: 'sewing',
  trattore: 'tractor', muletto: 'forklift', cardio: 'treadmill', pesi: 'weights', spa: 'tank',
  impianto: 'tank', imbottigliatrice: 'line', confezionatrice: 'line', linea_salumi: 'line', stalla: 'barn', irrigazione: 'tank',
};
const TIER_C = [{ b: '#c9d2d8', d: '#8a97a1', a: '#5aa9e6' }, { b: '#a9c8e6', d: '#5f86ad', a: '#f08a5d' }, { b: '#f1d48a', d: '#b98a2a', a: '#2f9a5c' }];

function eqDraw(shape, c) {
  const st = `stroke="${OUT}" stroke-width="1.6" stroke-linejoin="round"`;
  switch (shape) {
    case 'espresso': return `<rect x="12" y="16" width="40" height="30" rx="4" fill="${c.b}" ${st}/><rect x="12" y="12" width="40" height="7" rx="2" fill="${c.d}" ${st}/><rect x="20" y="24" width="8" height="5" rx="1" fill="${c.d}" ${st}/><rect x="36" y="24" width="8" height="5" rx="1" fill="${c.d}" ${st}/><path d="M24 29 L24 33 M40 29 L40 33" ${st}/><path d="M20 38 L28 38 L27 44 L21 44 Z M36 38 L44 38 L43 44 L37 44 Z" fill="#fff" ${st}/><rect x="8" y="46" width="48" height="5" rx="2" fill="${c.d}" ${st}/><circle cx="32" cy="22" r="2" fill="${c.a}"/>`;
    case 'fridge': return `<rect x="8" y="22" width="48" height="30" rx="3" fill="${c.b}" ${st}/><path d="M10 22 Q32 8 54 22 Z" fill="#cfeaf7" fill-opacity=".8" ${st}/><rect x="12" y="26" width="40" height="12" rx="2" fill="#dff3fb" ${st}/><circle cx="19" cy="32" r="3" fill="#f08a5d"/><circle cx="27" cy="32" r="3" fill="#f2c230"/><circle cx="35" cy="32" r="3" fill="#9bd37a"/><circle cx="43" cy="32" r="3" fill="#e98bb0"/><rect x="12" y="42" width="40" height="6" rx="1" fill="${c.d}" ${st}/><path d="M48 14 L48 9 M45.5 11.5 L50.5 11.5 M46 10 L50 13 M50 10 L46 13" stroke="${c.a}" stroke-width="1.4"/>`;
    case 'cell': return `<rect x="14" y="8" width="36" height="46" rx="3" fill="${c.b}" ${st}/><rect x="18" y="12" width="28" height="38" rx="2" fill="${c.d}" fill-opacity=".35" ${st}/><path d="M44 26 L44 36" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/><rect x="22" y="15" width="12" height="5" rx="1" fill="#1f2937"/><path d="M24 17.5 L32 17.5" stroke="${c.a}" stroke-width="1.6"/>`;
    case 'oven': return `<rect x="8" y="14" width="48" height="38" rx="5" fill="${c.b}" ${st}/><path d="M14 26 Q32 14 50 26 L50 44 L14 44 Z" fill="#3a2a22" ${st}/><path d="M20 42 Q24 34 28 42 M30 42 Q34 32 38 42 M40 42 Q43 36 46 42" fill="#f2a53a" stroke="#e0602a" stroke-width="1.2"/><rect x="26" y="8" width="12" height="7" fill="${c.d}" ${st}/><circle cx="18" cy="48" r="1.8" fill="${c.a}"/><circle cx="46" cy="48" r="1.8" fill="${c.a}"/>`;
    case 'stove': return `<rect x="8" y="24" width="48" height="28" rx="3" fill="${c.b}" ${st}/><rect x="8" y="18" width="48" height="7" rx="2" fill="${c.d}" ${st}/><rect x="14" y="30" width="36" height="16" rx="2" fill="#2f2b36" ${st}/><path d="M14 12 Q14 18 22 18 L22 12 Z" fill="#9aa7b0" ${st}/><rect x="30" y="8" width="16" height="10" rx="2" fill="#7c8a96" ${st}/><path d="M33 6 Q35 3 33 1 M40 6 Q42 3 40 1" stroke="var(--muted)" stroke-width="1.3" fill="none"/><circle cx="16" cy="21.5" r="1.6" fill="${c.a}"/><circle cx="22" cy="21.5" r="1.6" fill="${c.a}"/>`;
    case 'mixer': return `<rect x="22" y="6" width="22" height="14" rx="4" fill="${c.b}" ${st}/><rect x="38" y="14" width="8" height="34" rx="3" fill="${c.b}" ${st}/><path d="M14 30 L40 30 L37 48 L17 48 Z" fill="${c.d}" ${st}/><path d="M28 20 Q24 26 28 30 Q32 34 27 40" stroke="${OUT}" stroke-width="2" fill="none"/><path d="M17 33 Q27 37 37 33" fill="#f3e3c3" stroke="${OUT}" stroke-width="1"/><rect x="10" y="48" width="44" height="6" rx="2" fill="${c.d}" ${st}/><circle cx="30" cy="12" r="2" fill="${c.a}"/>`;
    case 'line': return `<rect x="4" y="34" width="56" height="8" rx="4" fill="${c.d}" ${st}/><circle cx="10" cy="38" r="2.5" fill="${c.b}" ${st}/><circle cx="32" cy="38" r="2.5" fill="${c.b}" ${st}/><circle cx="54" cy="38" r="2.5" fill="${c.b}" ${st}/><rect x="20" y="12" width="24" height="18" rx="3" fill="${c.b}" ${st}/><path d="M28 30 L28 34 M36 30 L36 34" ${st}/><rect x="8" y="26" width="8" height="8" rx="1" fill="#e7c66b" ${st}/><rect x="48" y="26" width="8" height="8" rx="1" fill="#e7c66b" ${st}/><path d="M10 42 L8 54 M54 42 L56 54 M32 42 L32 54" ${st}/><circle cx="32" cy="20" r="3" fill="${c.a}"/>`;
    case 'table': return `<ellipse cx="32" cy="30" rx="20" ry="6" fill="${c.b}" ${st}/><path d="M32 36 L32 52 M24 54 L40 54" ${st} stroke-width="2.6"/><path d="M6 26 L6 50 M6 38 L14 38 L14 50 M6 26 Q10 24 12 30" fill="none" ${st} stroke-width="2.2"/><path d="M58 26 L58 50 M58 38 L50 38 L50 50 M58 26 Q54 24 52 30" fill="none" ${st} stroke-width="2.2"/><path d="M27 27 L37 27" stroke="${c.a}" stroke-width="2"/>`;
    case 'chair': return `<rect x="18" y="8" width="28" height="22" rx="7" fill="${c.a}" ${st}/><rect x="14" y="28" width="36" height="10" rx="4" fill="${c.a}" ${st}/><rect x="10" y="22" width="6" height="14" rx="2" fill="${c.d}" ${st}/><rect x="48" y="22" width="6" height="14" rx="2" fill="${c.d}" ${st}/><path d="M32 38 L32 50 M20 54 L44 54 M32 50 L22 54 M32 50 L42 54" ${st} stroke-width="2.4" fill="none"/><rect x="26" y="40" width="12" height="4" rx="1" fill="${c.b}" ${st}/>`;
    case 'bed': return `<rect x="6" y="30" width="52" height="14" rx="3" fill="${c.b}" ${st}/><rect x="6" y="16" width="8" height="34" rx="2" fill="${c.d}" ${st}/><rect x="16" y="24" width="12" height="7" rx="3" fill="#ffffff" ${st}/><path d="M28 30 L58 30 L58 40 Q43 44 28 40 Z" fill="${c.a}" ${st}/><path d="M56 44 L56 50" ${st} stroke-width="2.4"/>`;
    case 'register': return `<path d="M14 30 L50 30 L54 50 L10 50 Z" fill="${c.b}" ${st}/><rect x="20" y="12" width="24" height="14" rx="2" fill="#1f2937" ${st}/><path d="M24 19 L40 19" stroke="#9bd37a" stroke-width="2"/><path d="M30 26 L30 30 M34 26 L34 30" ${st}/>${[0, 1, 2].map(r => [0, 1, 2, 3].map(k => `<rect x="${17 + k * 8}" y="${34 + r * 5}" width="5" height="3" rx=".8" fill="${c.d}"/>`).join('')).join('')}<rect x="8" y="50" width="48" height="5" rx="2" fill="${c.d}" ${st}/><rect x="44" y="40" width="6" height="7" fill="#fff" ${st}/>`;
    case 'washer': return `<rect x="12" y="8" width="40" height="48" rx="4" fill="${c.b}" ${st}/><path d="M12 18 L52 18" ${st}/><circle cx="20" cy="13" r="2" fill="${c.a}"/><rect x="34" y="11" width="13" height="4" rx="1" fill="#1f2937"/><circle cx="32" cy="36" r="13" fill="${c.d}" ${st}/><circle cx="32" cy="36" r="9" fill="#bfe3f5" ${st}/><path d="M24 38 Q28 34 32 38 Q36 42 40 38" stroke="#5aa9e6" stroke-width="1.8" fill="none"/>`;
    case 'iron': return `<path d="M6 34 L46 30 Q58 32 58 38 L6 40 Z" fill="${c.b}" ${st}/><path d="M18 40 L14 54 M42 39 L46 54" ${st} stroke-width="2.4"/><path d="M22 28 Q24 16 38 16 L44 16 Q46 22 46 28 Z" fill="${c.a}" ${st}/><path d="M28 16 Q30 10 38 10 L40 16" fill="none" ${st} stroke-width="2.2"/><path d="M26 12 Q24 8 26 4" stroke="var(--muted)" stroke-width="1.3" fill="none"/>`;
    case 'shelf': return `<rect x="10" y="6" width="44" height="50" rx="2" fill="${c.d}" ${st}/><rect x="13" y="9" width="38" height="44" fill="${c.b}"/>${[0, 1, 2].map(r => `<path d="M13 ${23 + r * 14} L51 ${23 + r * 14}" ${st}/><rect x="16" y="${13 + r * 14}" width="6" height="10" fill="#f08a5d" ${st} stroke-width="1"/><rect x="24" y="${15 + r * 14}" width="8" height="8" fill="#5aa9e6" ${st} stroke-width="1"/><rect x="34" y="${12 + r * 14}" width="5" height="11" fill="#9bd37a" ${st} stroke-width="1"/><rect x="41" y="${16 + r * 14}" width="7" height="7" fill="#f2c230" ${st} stroke-width="1"/>`).join('')}`;
    case 'tools': return `<rect x="6" y="34" width="52" height="8" rx="2" fill="${c.d}" ${st}/><path d="M10 42 L10 56 M54 42 L54 56" ${st} stroke-width="2.6"/><rect x="10" y="8" width="44" height="24" rx="2" fill="${c.b}" ${st}/><path d="M18 12 L18 28 M16 12 L20 12" ${st} stroke-width="2"/><path d="M28 12 L28 22 Q24 26 28 28 Q32 26 28 22" ${st} fill="${c.a}"/><path d="M38 12 L44 28 M44 12 L38 28" ${st} stroke-width="2"/><circle cx="50" cy="20" r="3" fill="none" ${st}/>`;
    case 'screen': return `<rect x="8" y="8" width="48" height="32" rx="3" fill="${c.b}" ${st}/><rect x="12" y="12" width="40" height="24" rx="1" fill="#1f2937"/><path d="M15 30 L22 22 L28 27 L36 17 L42 23 L49 15" stroke="#9bd37a" stroke-width="2" fill="none"/><path d="M28 40 L26 50 M36 40 L38 50 M20 52 L44 52" ${st} stroke-width="2.4"/><circle cx="50" cy="38" r="1" fill="${c.a}"/>`;
    case 'lift': return `<rect x="8" y="6" width="8" height="50" fill="${c.b}" ${st}/><rect x="48" y="6" width="8" height="50" fill="${c.b}" ${st}/><rect x="16" y="26" width="32" height="5" fill="${c.d}" ${st}/><path d="M18 26 Q20 16 28 16 L40 16 Q46 18 46 26 Z" fill="${c.a}" ${st}/><circle cx="23" cy="26" r="4" fill="#2a2633"/><circle cx="41" cy="26" r="4" fill="#2a2633"/><rect x="4" y="54" width="56" height="4" fill="${c.d}" ${st}/>`;
    case 'sewing': return `<rect x="8" y="40" width="48" height="10" rx="2" fill="${c.d}" ${st}/><path d="M14 40 L14 20 Q14 12 22 12 L48 12 Q52 12 52 18 L52 26 L46 26 L46 20 L22 20 L22 40 Z" fill="${c.b}" ${st}/><path d="M48 26 L48 36" ${st} stroke-width="1.4"/><circle cx="20" cy="30" r="4" fill="${c.a}" ${st}/><path d="M38 40 Q42 34 50 36" stroke="#e98bb0" stroke-width="1.6" fill="none"/>`;
    case 'tractor': return `<rect x="10" y="24" width="30" height="16" rx="3" fill="${c.a}" ${st}/><rect x="28" y="10" width="16" height="18" rx="2" fill="#bfe3f5" ${st}/><path d="M40 28 L54 32 L54 40 L40 40 Z" fill="${c.a}" ${st}/><path d="M50 32 L50 22" ${st} stroke-width="2.4"/><circle cx="20" cy="44" r="11" fill="#2a2633" ${st}/><circle cx="20" cy="44" r="4" fill="${c.b}"/><circle cx="48" cy="48" r="7" fill="#2a2633" ${st}/><circle cx="48" cy="48" r="2.5" fill="${c.b}"/>`;
    case 'forklift': return `<rect x="12" y="24" width="26" height="20" rx="3" fill="${c.a}" ${st}/><path d="M16 24 L18 8 L34 8 L36 24" fill="none" ${st} stroke-width="2"/><rect x="38" y="6" width="5" height="42" fill="${c.d}" ${st}/><path d="M43 44 L58 44" ${st} stroke-width="3"/><rect x="46" y="34" width="12" height="10" fill="#e7c66b" ${st}/><circle cx="18" cy="48" r="6" fill="#2a2633" ${st}/><circle cx="34" cy="48" r="6" fill="#2a2633" ${st}/>`;
    case 'treadmill': return `<path d="M6 48 L50 42 L56 48 L10 54 Z" fill="${c.d}" ${st}/><path d="M44 42 L40 14" ${st} stroke-width="3"/><rect x="30" y="8" width="20" height="10" rx="2" fill="${c.b}" ${st}/><path d="M33 13 L47 13" stroke="${c.a}" stroke-width="2"/><path d="M34 22 L22 24" ${st} stroke-width="2.4"/>`;
    case 'weights': return `<path d="M10 32 L54 32" ${st} stroke-width="3"/><rect x="12" y="20" width="7" height="24" rx="2" fill="${c.d}" ${st}/><rect x="20" y="24" width="5" height="16" rx="1.5" fill="${c.a}" ${st}/><rect x="45" y="20" width="7" height="24" rx="2" fill="${c.d}" ${st}/><rect x="39" y="24" width="5" height="16" rx="1.5" fill="${c.a}" ${st}/><rect x="8" y="50" width="48" height="5" rx="2" fill="${c.b}" ${st}/>`;
    case 'tank': return `<rect x="10" y="16" width="20" height="36" rx="10" fill="${c.b}" ${st}/><rect x="34" y="10" width="22" height="42" rx="11" fill="${c.b}" ${st}/><path d="M30 26 L34 26 M30 40 L34 40" ${st} stroke-width="2.4"/><circle cx="20" cy="30" r="4" fill="#fff" ${st}/><path d="M20 30 L22 28" ${st}/><rect x="40" y="26" width="10" height="14" rx="2" fill="${c.a}" fill-opacity=".6" ${st}/><path d="M8 54 L58 54" ${st} stroke-width="2.4"/>`;
    case 'barn': return `<path d="M8 28 L32 10 L56 28 L56 54 L8 54 Z" fill="#c8402e" ${st}/><rect x="24" y="34" width="16" height="20" fill="${c.b}" ${st}/><path d="M24 34 L40 54 M40 34 L24 54" ${st}/><rect x="28" y="20" width="8" height="7" fill="#fff" ${st}/>`;
    default: return `<rect x="12" y="14" width="40" height="38" rx="4" fill="${c.b}" ${st}/><circle cx="32" cy="33" r="9" fill="${c.d}" ${st}/><circle cx="32" cy="33" r="3" fill="${c.a}"/>`;
  }
}

/** disegno del macchinario: own = {tier, cond, broken} oppure null se non lo possiedi */
function machine(def, own, size = 44) {
  const shape = EQ_SHAPE[def.cat] || 'box';
  const tier = own ? own.tier : 0;
  const c = TIER_C[tier] || TIER_C[0];
  let s = eqDraw(shape, c);
  let over = '', bg = 'var(--panel2)', ring = 'var(--line2)';
  if (!own) {
    s = `<g opacity=".28" style="filter:grayscale(1)">${s}</g>`;
    over = `<circle cx="50" cy="50" r="9" fill="var(--panel)" stroke="var(--line2)" stroke-width="1.6"/><path d="M50 45.5 L50 54.5 M45.5 50 L54.5 50" stroke="var(--muted)" stroke-width="2.2" stroke-linecap="round"/>`;
  } else {
    const k = own.cond;
    if (own.broken) {
      s = `<g transform="rotate(-6 32 40)">${s}</g><rect x="0" y="0" width="64" height="64" fill="#2a2633" opacity=".22"/>`;
      over = `<circle cx="14" cy="10" r="6" fill="#6b6870" opacity=".85"/><circle cx="22" cy="7" r="5" fill="#8b8890" opacity=".8"/><circle cx="18" cy="15" r="4" fill="#57545c" opacity=".85"/>
        <path d="M37 18 L31 30 L37 30 L30 44" stroke="#f2c230" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M44 46 L58 46 L51 34 Z" fill="#f2c230" stroke="${OUT}" stroke-width="1.4" stroke-linejoin="round"/><path d="M51 38.5 L51 42.2 M51 43.8 L51 44.2" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>`;
      ring = 'var(--red)';
    } else {
      if (k < 80) over += `<circle cx="18" cy="40" r="1.6" fill="#8a7357" opacity=".5"/><circle cx="44" cy="22" r="1.3" fill="#8a7357" opacity=".5"/><circle cx="38" cy="46" r="1.8" fill="#8a7357" opacity=".45"/><path d="M14 22 L20 26" stroke="#8a7357" stroke-width="1" opacity=".55"/>`;
      if (k < 55) over += `<path d="M10 44 Q14 40 18 44 Q16 48 11 47 Z" fill="#b5651d" opacity=".65"/><path d="M44 14 Q49 12 50 17 Q46 19 44 14 Z" fill="#b5651d" opacity=".6"/><path d="M30 46 Q34 44 36 48 Q32 50 30 46 Z" fill="#b5651d" opacity=".55"/><path d="M40 28 L46 32 M41 31 L45 34" stroke="#6b5a48" stroke-width="1" opacity=".7"/>`;
      if (k < 35) over += `<path d="M22 16 L26 24 L22 28 L27 36" stroke="${OUT}" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M48 8 Q50 4 48 1 M53 9 Q55 5 53 2" stroke="#8b8890" stroke-width="1.6" fill="none"/>`;
      if (k >= 95) over += `<path d="M52 6 L53.5 10.5 L58 12 L53.5 13.5 L52 18 L50.5 13.5 L46 12 L50.5 10.5 Z" fill="#fff6c2" stroke="#d9a640" stroke-width="1"/>`;
      ring = k < 50 ? 'var(--red)' : 'var(--green)';
      if (tier > 0) over += `<g transform="translate(4 52)">${[...Array(tier)].map((_, i) => `<path transform="translate(${i * 9} 0)" d="M4 0 L5.2 2.6 L8 3 L6 5 L6.5 8 L4 6.6 L1.5 8 L2 5 L0 3 L2.8 2.6 Z" fill="#f2c230" stroke="${OUT}" stroke-width=".8"/>`).join('')}</g>`;
    }
  }
  return `<svg class="mach" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(def.n)}"><rect x="1" y="1" width="62" height="62" rx="14" fill="${bg}" stroke="${ring}" stroke-width="2.5"/><g transform="translate(3.2 3.2) scale(.9)">${s}</g>${over}</svg>`;
}
function machineWord(own) { return !own ? 'da comprare' : own.broken ? 'rotta' : own.cond >= 95 ? 'nuova' : own.cond >= 80 ? 'buona' : own.cond >= 55 ? 'un po\' usata' : own.cond >= 35 ? 'consumata' : 'quasi da buttare'; }
const MOOD_WORD = { ok: 'tranquillo', felice: 'contento', stanco: 'stanco', triste: 'scontento', malato: 'malato', ferie: 'in ferie', formazione: 'a un corso' };

function moodHint(e) {
  const m = faceMood(e);
  if (m === 'malato') return 'A casa fino al ' + fmtDateShort(e.sickUntil) + '. Paga l\'INPS dal 4° giorno.';
  if (m === 'ferie') return 'Torna il ' + fmtDateShort(e.holidayUntil) + '.';
  if (m === 'formazione') return 'Sta imparando: tornerà più bravo.';
  if (m === 'stanco') return 'Troppe ore o troppi giorni di fila: dagli riposo.';
  if (m === 'triste') return lawIssues(e)[0] || (e.wage < marketWage(e.role, e.city, e.skill) * 0.95 ? 'Si sente pagato poco.' : 'Qualcosa non va: guarda turni e paga.');
  if (m === 'felice') return 'Lavora volentieri e rende di più.';
  return '';
}
