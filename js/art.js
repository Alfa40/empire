/* ============================================================
   EMPIRE - illustrazioni SVG disegnate apposta per il gioco (nessuna emoji).
   Stile semi-realistico: sfumature metalliche, vetri, ombre e luci.
   Vettoriali, quindi nitidi a qualsiasi dimensione.
   - face(p)        volto del dipendente, cambia con lo stato
   - machine(def)   macchinario, si consuma, arrugginisce, si rompe
   - material(id)   materia prima / merce in magazzino
   ============================================================ */
const OUT = '#1d1b22';
const SK = `stroke="${OUT}" stroke-opacity=".55" stroke-width=".9" stroke-linejoin="round"`;
const U = id => `url(#a-${id})`;
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seededPick(h, arr, k) { return arr[(h >>> (k * 3)) % arr.length]; }

// ---------- sfumature condivise (una volta sola nella pagina) ----------
(function artDefs() {
  const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="a-${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx = .5, cy = .5, r = .5) => `<radialGradient id="a-${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
  const tiers = [
    ['#fdfefe', '#dfe4e8', '#b5bec6', '#8f9aa4', '#7d8892', '#56606a'],   // acciaio
    ['#e4eef8', '#a9c3dd', '#6f93b8', '#4c6f94', '#3f5f82', '#253b54'],   // professionale: anodizzato blu
    ['#fff6dc', '#f0d38f', '#d5a64e', '#a87a2b', '#9a6b22', '#5f4112'],   // top: champagne
  ];
  let d = '';
  tiers.forEach((t, i) => {
    d += lin('t' + i, [[0, t[0]], [.18, t[1]], [.62, t[2]], [1, t[3]]]);
    d += lin('t' + i + 'd', [[0, t[3]], [1, t[5]]]);
    d += lin('t' + i + 'h', [[0, t[2]], [.25, t[0]], [.5, t[1]], [.8, t[2]], [1, t[3]]], 1, 0);
  });
  d += lin('blk', [[0, '#5a5e68'], [.5, '#2c2f36'], [1, '#15161a']]);
  d += lin('blkh', [[0, '#202227'], [.3, '#4d515b'], [.6, '#26282e'], [1, '#121316']], 1, 0);
  d += lin('gls', [[0, '#f2fbff', .9], [.45, '#bfdcec', .55], [.55, '#e9f6fc', .75], [1, '#9cc4da', .6]], 1, 1);
  d += lin('wood', [[0, '#e2b07a'], [.5, '#c48a4f'], [1, '#93602f']]);
  d += lin('woodh', [[0, '#9b6635'], [.3, '#d8a46c'], [.7, '#b9804a'], [1, '#8a5a2c']], 1, 0);
  d += lin('scr', [[0, '#1e3a52'], [1, '#0d1a26']]);
  d += lin('red', [[0, '#f0726b'], [.5, '#d23f37'], [1, '#97231d']]);
  d += lin('grn', [[0, '#8fd17a'], [.5, '#4e9e3a'], [1, '#2f6b22']]);
  d += lin('ylw', [[0, '#ffe07a'], [.5, '#f2b52a'], [1, '#c2810e']]);
  d += lin('org', [[0, '#ffb46b'], [.5, '#ef7d22'], [1, '#b2520c']]);
  d += lin('blu', [[0, '#8cc4f2'], [.5, '#3c88cf'], [1, '#1f5591']]);
  d += lin('wht', [[0, '#ffffff'], [1, '#d9dee3']]);
  d += lin('lth', [[0, '#5c5f6a'], [.5, '#33353d'], [1, '#1c1d22']]);
  d += lin('hl', [[0, '#ffffff', .75], [1, '#ffffff', 0]]);
  d += lin('cloth', [[0, '#ffffff', .22], [.55, '#ffffff', 0], [1, '#000000', .28]]);
  d += lin('hair', [[0, '#ffffff', .35], [.4, '#ffffff', 0], [1, '#000000', .25]]);
  d += lin('bag', [[0, '#e9d3a8'], [.5, '#cfae74'], [1, '#a5834a']]);
  d += lin('card', [[0, '#e3c08a'], [1, '#b78b4e']]);
  d += lin('bg', [[0, '#ffffff', .55], [1, '#ffffff', 0]]);
  d += rad('fire', [[0, '#fff7c2'], [.45, '#ffb43a'], [1, '#d8401a']], .5, .8, .7);
  d += rad('shd', [[0, '#000000', .42], [1, '#000000', 0]]);
  d += rad('skin', [[0, '#ffffff', .28], [.45, '#ffffff', 0], [.8, '#5a2e1a', .08], [1, '#5a2e1a', .32]], .4, .32, .75);
  d += rad('rust', [[0, '#8a3d12', .95], [.6, '#b5651d', .7], [1, '#b5651d', 0]]);
  d += rad('smk', [[0, '#3c3a40', .92], [.7, '#6b6870', .6], [1, '#8b8890', 0]]);
  d += rad('glow', [[0, '#ffffff', .9], [1, '#ffffff', 0]]);
  d += rad('iris', [[0, '#000000'], [.35, '#000000'], [.4, 'currentColor'], [1, '#000000', .7]]);
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  el.innerHTML = `<svg width="0" height="0" focusable="false"><defs>${d}</defs></svg>`;
  (document.body || document.documentElement).appendChild(el);
})();

const shadow = (cx = 32, w = 25, y = 58) => `<ellipse cx="${cx}" cy="${y}" rx="${w}" ry="3.4" fill="${U('shd')}"/>`;
const shine = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${U('hl')}" opacity=".7"/>`;

// =================== VOLTI ===================
const SKINS = ['#f7d7c0', '#efc4a2', '#ddaa82', '#c08660', '#93603f', '#6e4429'];
const HAIRS = ['#2a1c15', '#4b2f1e', '#6d4428', '#a26a33', '#d8b46e', '#161618', '#7c3420'];
const IRIS = ['#5b3a1e', '#3f6b8a', '#4d6b3a', '#6b4a2a', '#2f2f35'];
const ROLE_LOOK = {
  barista: { shirt: '#2f5f86', acc: 'bow' }, cameriere: { shirt: '#f4f1ea', acc: 'bow', vest: '#2a2633' },
  cuoco: { shirt: '#ffffff', acc: 'toque' }, pizzaiolo: { shirt: '#ffffff', acc: 'toque', band: '#c8402e' },
  fornaio: { shirt: '#fbf3e3', acc: 'toque' }, gelatiere: { shirt: '#f7d6e4', acc: 'cap', capc: '#e98bb0' },
  commesso: { shirt: '#4f8a60', acc: 'tag' }, lavanderia: { shirt: '#8fc0de', acc: 'apron' },
  parrucchiere: { shirt: '#2b2b33', acc: 'comb' }, istruttore: { shirt: '#e2553a', acc: 'band' },
  meccanico: { shirt: '#2f5592', acc: 'cap', capc: '#2f5592' }, receptionist: { shirt: '#6f50a0', acc: 'headset' },
  pulizie: { shirt: '#3f9692', acc: 'scarf' }, operaio: { shirt: '#44607e', acc: 'helmet', capc: '#f2c230' },
  agricolo: { shirt: '#647f34', acc: 'straw' }, magazziniere: { shirt: '#c96f22', acc: 'helmet', capc: '#f08a24' },
  manager: { shirt: '#2b3446', acc: 'tie', tie: '#b83333' }, contabile: { shirt: '#454e5c', acc: 'tie', tie: '#2f6fb3', glasses: true },
  hr: { shirt: '#644474', acc: 'tie', tie: '#d39a2a' }, marketer: { shirt: '#c8434f', acc: 'tie', tie: '#2a2633' },
  areamanager: { shirt: '#1d2739', acc: 'tie', tie: '#2f9a5c' }, ricercatore: { shirt: '#ffffff', acc: 'coat', glasses: true },
};
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
const MOOD_WORD = { ok: 'tranquillo', felice: 'contento', stanco: 'stanco', triste: 'scontento', malato: 'malato', ferie: 'in ferie', formazione: 'a un corso' };

function face(p, size = 40, moodOverride) {
  const h = hashStr((p.first || '') + (p.last || '') + (p.age || ''));
  const mood = moodOverride || faceMood(p);
  const L = ROLE_LOOK[p.role] || { shirt: '#6b7280' };
  const skin0 = seededPick(h, SKINS, 1);
  const skin = mood === 'malato' ? `color-mix(in srgb, ${skin0} 70%, #b7d99a)` : skin0;
  const hair = p.age >= 56 ? '#cfccc8' : p.age >= 48 && (h & 1) ? '#8f8b86' : seededPick(h, HAIRS, 2);
  const iris = seededPick(h, IRIS, 5);
  const style = (h >>> 9) % 3, fem = !!p.female;
  const bald = !fem && p.age >= 50 && style === 0;
  const glasses = L.glasses || ((h >>> 12) % 7 === 0);
  const beard = !fem && (h >>> 14) % 5 === 0;
  const lip = fem ? '#c25b5b' : `color-mix(in srgb, ${skin0} 65%, #8a3a3a)`;
  const sk = `stroke="${OUT}" stroke-opacity=".45" stroke-width=".8"`;
  let s = `<circle cx="32" cy="32" r="32" fill="color-mix(in srgb, ${L.shirt} 22%, var(--panel2))"/><circle cx="32" cy="20" r="26" fill="${U('bg')}"/>`;
  if (fem && style !== 2) s += `<path d="M17.5 30 Q16 13 32 12.5 Q48 13 46.5 30 L48 51 Q40 47 32 47 Q24 47 16 51 Z" fill="${hair}"/><path d="M17.5 30 Q16 13 32 12.5 Q48 13 46.5 30 L48 51 Q40 47 32 47 Q24 47 16 51 Z" fill="${U('hair')}"/>`;
  // busto
  s += `<path d="M7 64 Q9 48 24 46 L40 46 Q55 48 57 64 Z" fill="${L.shirt}" ${sk}/>`;
  if (L.vest) s += `<path d="M14 64 Q15 52 25 48 L29 64 Z M50 64 Q49 52 39 48 L35 64 Z" fill="${L.vest}"/>`;
  if (L.acc === 'coat') s += `<path d="M24 46 L30 64 M40 46 L34 64" stroke="${OUT}" stroke-opacity=".35" stroke-width="1"/><path d="M26 47 L32 54 L38 47" fill="#cfe0ee"/>`;
  if (L.acc === 'apron') s += `<path d="M21 53 Q32 51 43 53 L44 64 L20 64 Z" fill="#f7f7f5" ${sk}/>`;
  s += `<path d="M7 64 Q9 48 24 46 L40 46 Q55 48 57 64 Z" fill="${U('cloth')}"/>`;
  // collo
  s += `<path d="M26.5 37 L37.5 37 L38 47 Q32 50 26 47 Z" fill="${skin}"/><path d="M26.5 40 Q32 44 37.5 40 L37.5 43 Q32 46 26.5 43 Z" fill="#3a1f12" opacity=".18"/>`;
  if (L.acc === 'bow') s += `<path d="M26.5 48.5 L32 51 L26.5 53.5 Z M37.5 48.5 L32 51 L37.5 53.5 Z" fill="#1d1b22"/><circle cx="32" cy="51" r="1.3" fill="#1d1b22"/>`;
  if (L.acc === 'tie') s += `<path d="M28 46.5 L32 49.5 L36 46.5" fill="#f2f2f2"/><path d="M30.6 49 L33.4 49 L35 60 L32 63.5 L29 60 Z" fill="${L.tie}"/><path d="M30.6 49 L33.4 49 L35 60 L32 63.5 L29 60 Z" fill="${U('cloth')}"/>`;
  if (L.acc === 'tag') s += `<rect x="38" y="53" width="9" height="5" rx="1" fill="#fff" ${sk}/><path d="M39.5 55.5 L45 55.5" stroke="#4f8a60" stroke-width="1"/>`;
  if (L.acc === 'comb') s += `<rect x="39" y="51" width="10" height="2.2" rx="1" fill="#d8d8d8"/><path d="M40 53 L40 56 M42 53 L42 56 M44 53 L44 56 M46 53 L46 56 M48 53 L48 56" stroke="#c4c4c4" stroke-width=".9"/>`;
  if (L.acc === 'scarf') s += `<path d="M23.5 46 Q32 52 40.5 46 L41 50 Q32 56 23 50 Z" fill="#f2c230"/>`;
  // orecchie e testa
  s += `<ellipse cx="18.8" cy="30.5" rx="3" ry="4" fill="${skin}" ${sk}/><ellipse cx="45.2" cy="30.5" rx="3" ry="4" fill="${skin}" ${sk}/><path d="M18.5 29 Q20 30.5 18.8 32.5 M45.5 29 Q44 30.5 45.2 32.5" stroke="#5a2e1a" stroke-opacity=".35" stroke-width=".8" fill="none"/>`;
  const head = 'M19 27 Q19 14 32 14 Q45 14 45 27 L45 31 Q44.5 41 38 44.5 Q32 47.5 26 44.5 Q19.5 41 19 31 Z';
  s += `<path d="${head}" fill="${skin}" ${sk}/><path d="${head}" fill="${U('skin')}"/>`;
  if (beard) s += `<path d="M19.5 31 Q20 41 26 44.5 Q32 47.8 38 44.5 Q44 41 44.5 31 Q42 38 37 38.5 Q32 37 27 38.5 Q22 38 19.5 31 Z" fill="${hair}" opacity=".92"/>`;
  // capelli
  if (!bald) {
    const top = style === 0 ? 'M18.5 29 Q17.5 12 32 12 Q46.5 12 45.5 29 Q44 20 38 19 Q32 22 26 19 Q20 20 18.5 29 Z'
      : style === 1 ? 'M18.5 28 Q18 11.5 32 12 Q46 11.5 45.5 28 Q44.5 21 39 19.5 Q37 22.5 31.5 20.5 Q26.5 23 22.5 20.5 Q19.5 22 18.5 28 Z'
      : 'M18.5 29 Q16.5 12 32 12 Q47.5 12 45.5 29 Q43 18 30 19.5 Q23.5 20.5 18.5 29 Z';
    s += `<path d="${top}" fill="${hair}" ${sk}/><path d="${top}" fill="${U('hair')}"/>`;
    if (style === 2 && fem) s += `<circle cx="32" cy="10" r="5" fill="${hair}" ${sk}/><circle cx="32" cy="10" r="5" fill="${U('hair')}"/>`;
  } else s += `<path d="M19 30 Q19 23 22 21 M45 30 Q45 23 42 21" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="29" cy="17.5" rx="5" ry="2" fill="#fff" opacity=".25"/>`;
  // copricapi
  if (L.acc === 'toque') s += `<path d="M20.5 21 L21.5 12 Q17 6 24.5 4.5 Q28 0.5 32 3.5 Q36 0.5 39.5 4.5 Q47 6 42.5 12 L43.5 21 Z" fill="${U('wht')}" ${sk}/><path d="M26 6 Q27 12 26.5 20 M32 4 L32 20 M38 6 Q37 12 37.5 20" stroke="#c9ced4" stroke-width=".8" fill="none"/>${L.band ? `<rect x="21" y="17.5" width="22" height="3.5" fill="${L.band}"/>` : ''}`;
  if (L.acc === 'cap') s += `<path d="M18 23 Q18.5 10.5 32 10.5 Q45.5 10.5 46 23 Z" fill="${L.capc}" ${sk}/><path d="M18 23 Q18.5 10.5 32 10.5 Q45.5 10.5 46 23 Z" fill="${U('cloth')}"/><path d="M33 21.5 L52 21.5 Q51 25.5 43 25 L33 25 Z" fill="${L.capc}" ${sk}/><circle cx="32" cy="11" r="1.3" fill="${L.capc}" ${sk}/>`;
  if (L.acc === 'helmet') s += `<path d="M16.5 24 Q16.5 8.5 32 8.5 Q47.5 8.5 47.5 24 Z" fill="${L.capc}" ${sk}/><path d="M16.5 24 Q16.5 8.5 32 8.5 Q47.5 8.5 47.5 24 Z" fill="${U('cloth')}"/><path d="M29.5 9 L29.5 23 M34.5 9 L34.5 23" stroke="#000" stroke-opacity=".12" stroke-width="2"/><rect x="14.5" y="22.5" width="35" height="3" rx="1.5" fill="${L.capc}" ${sk}/><ellipse cx="25" cy="13" rx="4" ry="2" fill="#fff" opacity=".45"/>`;
  if (L.acc === 'straw') s += `<ellipse cx="32" cy="20.5" rx="21" ry="4.5" fill="#e3c06a" ${sk}/><path d="M22 20.5 Q22 8.5 32 8.5 Q42 8.5 42 20.5 Z" fill="#e8c873" ${sk}/><rect x="22" y="16.5" width="20" height="2.6" fill="#a83c2c"/><path d="M14 21 Q32 26 50 21" stroke="#b8963f" stroke-width=".8" fill="none"/>`;
  if (L.acc === 'band') s += `<rect x="18.5" y="19.5" width="27" height="3.6" rx="1.6" fill="#ffffff" ${sk}/><path d="M18.5 21.3 L45.5 21.3" stroke="#e2553a" stroke-width="1"/>`;
  if (L.acc === 'headset') s += `<path d="M17.5 30 Q17.5 12 32 12 Q46.5 12 46.5 30" stroke="#2b2b33" stroke-width="2.2" fill="none"/><rect x="15.5" y="27" width="4.5" height="7" rx="2" fill="#2b2b33"/><path d="M18 34 Q20 40.5 27.5 40.5" stroke="#2b2b33" stroke-width="1.3" fill="none"/><circle cx="28" cy="40.5" r="1.5" fill="#2b2b33"/>`;
  // sopracciglia (colore dei capelli)
  const bc = bald ? '#5a4a40' : hair;
  s += mood === 'triste' || mood === 'malato'
    ? `<path d="M22.5 24.5 Q25.5 23.5 28.5 22 L28.5 23.4 Q25.5 25 22.7 25.8 Z M41.5 24.5 Q38.5 23.5 35.5 22 L35.5 23.4 Q38.5 25 41.3 25.8 Z" fill="${bc}"/>`
    : mood === 'stanco' ? `<path d="M22.5 24.2 L28.5 24.8 L28.5 26 L22.5 25.4 Z M41.5 24.2 L35.5 24.8 L35.5 26 L41.5 25.4 Z" fill="${bc}"/>`
    : `<path d="M22.3 24.5 Q25.5 21.8 28.8 23.6 L28.6 24.8 Q25.5 23.3 22.6 25.6 Z M41.7 24.5 Q38.5 21.8 35.2 23.6 L35.4 24.8 Q38.5 23.3 41.4 25.6 Z" fill="${bc}"/>`;
  // occhi
  const eye = (cx, open = 1) => `<path d="M${cx - 3.4} 29 Q${cx} ${29 - 3 * open} ${cx + 3.4} 29 Q${cx} ${29 + 2.2 * open} ${cx - 3.4} 29 Z" fill="#fbfbfb"/>
      <circle cx="${cx}" cy="${29 - .2}" r="${1.9 * Math.min(1, open + .2)}" fill="${iris}"/><circle cx="${cx}" cy="${29 - .2}" r="${.95 * Math.min(1, open + .2)}" fill="#111"/><circle cx="${cx + .7}" cy="${28.2}" r=".55" fill="#fff"/>
      <path d="M${cx - 3.6} 29 Q${cx} ${29 - 3.2 * open} ${cx + 3.6} 29" stroke="#2a1a14" stroke-width="${fem ? 1.3 : 1}" fill="none" stroke-linecap="round"/>`;
  if (mood === 'felice' || mood === 'ferie') s += `<path d="M22.6 29.6 Q25.6 26 28.6 29.6 M35.4 29.6 Q38.4 26 41.4 29.6" stroke="#2a1a14" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  else if (mood === 'malato') s += `<path d="M22.6 28.8 Q25.6 30.6 28.6 28.8 M35.4 28.8 Q38.4 30.6 41.4 28.8" stroke="#2a1a14" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  else if (mood === 'stanco') s += eye(25.6, .45) + eye(38.4, .45) + `<path d="M22.8 31.6 Q25.6 33.4 28.4 31.6 M35.6 31.6 Q38.4 33.4 41.2 31.6" stroke="#7b5a8e" stroke-width="1.2" fill="none" opacity=".75"/>`;
  else s += eye(25.6) + eye(38.4);
  if (glasses && mood !== 'ferie') s += `<rect x="21" y="25.6" width="9.4" height="7" rx="2.6" fill="#cfe6f5" fill-opacity=".18" stroke="#2a2633" stroke-width="1.1"/><rect x="33.6" y="25.6" width="9.4" height="7" rx="2.6" fill="#cfe6f5" fill-opacity=".18" stroke="#2a2633" stroke-width="1.1"/><path d="M30.4 28.4 Q32 27.4 33.6 28.4" stroke="#2a2633" stroke-width="1.1" fill="none"/>`;
  if (mood === 'ferie') s += `<path d="M20.8 26 L30.6 26 L29.8 31.4 Q25.6 33.6 21.8 31.4 Z M33.4 26 L43.2 26 L42.2 31.4 Q38.4 33.6 34.2 31.4 Z" fill="${U('blk')}"/><path d="M22.5 27 L25.5 27 M35 27 L38 27" stroke="#fff" stroke-opacity=".55" stroke-width="1"/><path d="M30.6 27 L33.4 27" stroke="#1d1b22" stroke-width="1.3"/>`;
  // naso
  s += `<path d="M32 30 Q31 34.5 30 35.6 Q32 36.8 34 35.6" stroke="#5a2e1a" stroke-opacity=".45" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  if (mood === 'malato') s += `<ellipse cx="32" cy="35.4" rx="2" ry="1.3" fill="#e06a6a" opacity=".55"/>`;
  // guance
  if (mood === 'felice' || mood === 'ok') s += `<ellipse cx="22.8" cy="35" rx="2.8" ry="1.6" fill="#ec7f7f" opacity="${mood === 'felice' ? .45 : .2}"/><ellipse cx="41.2" cy="35" rx="2.8" ry="1.6" fill="#ec7f7f" opacity="${mood === 'felice' ? .45 : .2}"/>`;
  // bocca
  if (mood === 'felice' || mood === 'ferie') s += `<path d="M26.6 38.2 Q32 44 37.4 38.2 Q32 39.6 26.6 38.2 Z" fill="#7e2f2f"/><path d="M27.6 38.6 Q32 39.8 36.4 38.6 L36 40 Q32 40.8 28 40 Z" fill="#fff"/><path d="M26.6 38.2 Q32 44 37.4 38.2" stroke="${lip}" stroke-width="1" fill="none"/>`;
  else if (mood === 'triste') s += `<path d="M27.5 41.4 Q32 37.6 36.5 41.4 Q32 39.8 27.5 41.4 Z" fill="${lip}" stroke="${lip}" stroke-width="1.1" stroke-linejoin="round"/>`;
  else if (mood === 'stanco') s += `<path d="M28.5 40 Q32 40.6 35.5 40" stroke="${lip}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  else if (mood === 'malato') s += `<ellipse cx="31.5" cy="40" rx="1.8" ry="1.4" fill="#6e2a2a"/><path d="M32.5 40 L44 36" stroke="#eef2f5" stroke-width="2" stroke-linecap="round"/><path d="M32.5 40 L44 36" stroke="#aab4bd" stroke-width=".5"/><path d="M41 37 L44 36" stroke="#d83a3a" stroke-width="2" stroke-linecap="round"/>`;
  else s += `<path d="M27.8 39 Q32 41.8 36.2 39 Q32 40.2 27.8 39 Z" fill="${lip}" stroke="${lip}" stroke-width="1" stroke-linejoin="round"/>`;
  // segni
  if (mood === 'triste' && p.morale < 25) s += `<path d="M40.5 31.6 Q42.6 35.4 40.5 36.4 Q38.4 35.4 40.5 31.6 Z" fill="#7cc0f0" stroke="#3d86c4" stroke-width=".6"/><ellipse cx="40" cy="34.4" rx=".5" ry=".8" fill="#fff" opacity=".8"/>`;
  if (mood === 'stanco') s += `<g fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M48 10 L52.5 10 L48 14.5 L52.5 14.5"/><path d="M54 3.5 L57.5 3.5 L54 7 L57.5 7"/></g>`;
  if (mood === 'malato') s += `<path d="M45.6 18 Q47.8 22 45.6 23.4 Q43.4 22 45.6 18 Z" fill="#7cc0f0" stroke="#3d86c4" stroke-width=".6"/>`;
  if (mood === 'formazione') s += `<path d="M19 15 L32 9 L45 15 L32 20.5 Z" fill="${U('blk')}"/><path d="M25 17.5 L25 21 Q32 24 39 21 L39 17.5" fill="#26282e"/><path d="M43 15 L43 22.5" stroke="#e0a030" stroke-width="1.4"/><circle cx="43" cy="23" r="1.2" fill="#e0a030"/>`;
  return `<svg class="face" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(p.first || '')}: ${MOOD_WORD[mood]}"><defs><clipPath id="fc${h}"><circle cx="32" cy="32" r="31"/></clipPath></defs><g clip-path="url(#fc${h})">${s}</g><circle cx="32" cy="32" r="31" fill="none" stroke="${MOOD_RING[mood]}" stroke-width="2.4"/></svg>`;
}

// =================== MACCHINARI ===================
const EQ_SHAPE = {
  macchina_caffe: 'espresso',
  frigo: 'fridge', banco: 'fridge', vetrina: 'fridge', abbattitore: 'chiller', surgelazione: 'chiller', cella_lievitazione: 'cell', celle: 'cell', stagionatura: 'curing', cantina: 'wine',
  forno: 'oven', linea_forno: 'tunnel', tostatrice: 'roaster', essiccatoio: 'cell', caldaie: 'tank', cucina: 'stove',
  impastatrice: 'mixer', mantecatore: 'gelato', macina: 'mill', setacci: 'mill', linea_pasta: 'line',
  arredo: 'table', sala: 'table', camere: 'bed', sala_corsi: 'bench', postazioni: 'chair', arredo_salone: 'chair', lavatesta: 'sink',
  cassa: 'register', reception: 'desk',
  lavastoviglie: 'dishwasher', lavatrici: 'washer', lavanderia_h: 'washer', lavasecco: 'washer', self_service: 'washer', stireria: 'iron',
  scaffali: 'shelf', espositori: 'rack', vetrine: 'shelf', camerini: 'curtain', spogliatoi: 'locker',
  attrezzi: 'tools', diagnosi: 'screen', smontagomme: 'tyre', ponti: 'lift', taglio: 'screen', macchine_cucire: 'sewing',
  trattore: 'tractor', muletto: 'forklift', cardio: 'treadmill', pesi: 'weights', spa: 'spa',
  impianto: 'tank', imbottigliatrice: 'line', confezionatrice: 'line', linea_salumi: 'line', stalla: 'barn', irrigazione: 'sprinkler',
};
function eqDraw(shape, t, ac) {
  const A = U('t' + t), D = U('t' + t + 'd'), H = U('t' + t + 'h');
  const HS = ['#aeb8c1', '#6f93b8', '#d5a64e'][t], DS = ['#6f7a84', '#3f5f82', '#8a6020'][t];
  switch (shape) {
    case 'espresso': return shadow() +
      `<rect x="9" y="17" width="46" height="34" rx="3" fill="${A}" ${SK}/>` +
      `<rect x="9" y="12" width="46" height="6" rx="1.5" fill="${H}" ${SK}/>` +
      `<rect x="13" y="8.5" width="6" height="4" rx="1" fill="#f5f5f2" ${SK}/><rect x="21" y="8.5" width="6" height="4" rx="1" fill="#f5f5f2" ${SK}/><rect x="37" y="8.5" width="6" height="4" rx="1" fill="#f5f5f2" ${SK}/>` +
      `<rect x="13" y="21" width="38" height="9" rx="1.5" fill="${D}" ${SK}/>` +
      `<circle cx="32" cy="25.5" r="3.4" fill="#fdfdfd" ${SK}/><path d="M32 25.5 L34 23.6" stroke="#d23f37" stroke-width=".9"/><circle cx="32" cy="25.5" r=".6" fill="#222"/>` +
      `<circle cx="18" cy="25.5" r="1.3" fill="${ac}"/><circle cx="46" cy="25.5" r="1.3" fill="#7bd36a"/>` +
      `<rect x="16" y="30" width="9" height="4" rx="1" fill="${U('blkh')}"/><rect x="39" y="30" width="9" height="4" rx="1" fill="${U('blkh')}"/>` +
      `<path d="M14 33 L21 33" stroke="#2c2f36" stroke-width="2.4" stroke-linecap="round"/><path d="M43 33 L50 33" stroke="#2c2f36" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M18 39 L24 39 L23.3 44.5 Q21 45.6 18.7 44.5 Z M40 39 L46 39 L45.3 44.5 Q43 45.6 40.7 44.5 Z" fill="${U('wht')}" ${SK}/><path d="M24 40.5 Q26 41 24 43" stroke="#cfd4d8" stroke-width=".9" fill="none"/>` +
      `<path d="M21 36 L21 38.5 M43 36 L43 38.5" stroke="#5a3418" stroke-width="1.2"/>` +
      `<path d="M54 22 Q58 22 58 28 L58 40" stroke="${HS}" stroke-width="1.6" fill="none"/>` +
      `<rect x="11" y="46" width="42" height="3.5" rx="1" fill="${U('blkh')}"/><path d="M14 47.7 L50 47.7" stroke="#6b6f78" stroke-width=".5" stroke-dasharray="1 1"/>` + shine(11, 18, 3, 30);
    case 'fridge': return shadow() +
      `<rect x="5" y="31" width="54" height="22" rx="2" fill="${A}" ${SK}/><rect x="5" y="49" width="54" height="5" rx="1.5" fill="${U('blk')}"/>` +
      `<path d="M7 31 L7 22 Q8 13 20 12 L57 12 L57 31 Z" fill="${U('gls')}" ${SK}/>` +
      `<rect x="9" y="25.5" width="46" height="1.4" fill="${H}"/>` +
      `<g>${[13, 21, 29, 37, 45].map((x, i) => `<ellipse cx="${x + 3}" cy="23.6" rx="3.4" ry="2" fill="${['#d79b4f', '#e9c27b', '#b5653a', '#f0d39a', '#c97e45'][i]}" ${SK}/><ellipse cx="${x + 2}" cy="23" rx="1.4" ry=".6" fill="#fff" opacity=".45"/>`).join('')}</g>` +
      `<g>${[11, 20, 29, 38, 47].map((x, i) => `<rect x="${x}" y="27.4" width="7" height="3.6" rx="1.2" fill="${['#f4e1c1', '#e5867a', '#9bc77a', '#f2d06b', '#e9a3c0'][i]}" ${SK}/>`).join('')}</g>` +
      `<path d="M12 14 L22 30 M17 13 L26 27" stroke="#fff" stroke-opacity=".65" stroke-width="1.4"/>` +
      `<rect x="9" y="35" width="46" height="10" rx="1" fill="${D}" opacity=".55"/><rect x="45" y="37" width="8" height="4.5" rx=".8" fill="${U('scr')}"/><path d="M46.5 39.3 L51.5 39.3" stroke="#6fd0ff" stroke-width="1.4"/>` + shine(7, 32, 46, 2);
    case 'chiller': return shadow(32, 20) +
      `<rect x="13" y="7" width="38" height="47" rx="2.5" fill="${A}" ${SK}/><rect x="16" y="15" width="32" height="35" rx="1.5" fill="${H}" ${SK}/>` +
      `<rect x="16" y="9.5" width="32" height="4" rx="1" fill="${U('scr')}"/><path d="M18 11.5 L26 11.5" stroke="#6fd0ff" stroke-width="1.3"/><circle cx="44" cy="11.5" r="1" fill="${ac}"/>` +
      `<rect x="43" y="26" width="2.5" height="13" rx="1.2" fill="${U('blk')}"/>` +
      `<g stroke="#9fd8f5" stroke-width="1" stroke-linecap="round"><path d="M25 30 L25 38 M21 34 L29 34 M22.2 31.2 L27.8 36.8 M27.8 31.2 L22.2 36.8"/></g>` + shine(16, 15, 3, 34);
    case 'cell': return shadow(32, 22) +
      `<rect x="10" y="6" width="44" height="48" rx="2.5" fill="${A}" ${SK}/><rect x="13.5" y="9.5" width="37" height="41" rx="1.5" fill="${H}" ${SK}/>` +
      `<rect x="19" y="14" width="18" height="12" rx="1.5" fill="${U('gls')}" ${SK}/><path d="M21 16 L27 22" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>` +
      `<rect x="44" y="23" width="3" height="17" rx="1.5" fill="${U('blk')}"/><rect x="14" y="16" width="2" height="5" fill="${D}"/><rect x="14" y="38" width="2" height="5" fill="${D}"/>` +
      `<rect x="39" y="12" width="9" height="5" rx="1" fill="${U('scr')}"/><path d="M40.5 14.5 L46 14.5" stroke="#ffb46b" stroke-width="1.3"/>` + shine(13.5, 9.5, 3, 40);
    case 'curing': return shadow(32, 22) +
      `<rect x="9" y="6" width="46" height="48" rx="2.5" fill="${A}" ${SK}/><rect x="13" y="10" width="38" height="40" rx="1.5" fill="${U('gls')}" ${SK}/>` +
      `<path d="M14 15 L50 15" stroke="${DS}" stroke-width="1.6"/>` +
      `${[18, 25, 32, 39, 46].map((x, i) => `<path d="M${x} 15 L${x} 18" stroke="#8a6a4a" stroke-width=".7"/><rect x="${x - 2.4}" y="18" width="4.8" height="${18 + (i % 2) * 6}" rx="2.4" fill="${i % 2 ? '#a3422e' : '#c4683f'}" ${SK}/><path d="M${x - 1} 21 L${x - 1} ${30 + (i % 2) * 5}" stroke="#fff" stroke-opacity=".35" stroke-width=".9"/>`).join('')}` +
      `<path d="M15 12 L25 30" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>`;
    case 'wine': return shadow(32, 22) +
      `<rect x="9" y="5" width="46" height="50" rx="2.5" fill="${U('blk')}" ${SK}/><rect x="12.5" y="8.5" width="39" height="43" rx="1.5" fill="${U('gls')}" ${SK}/>` +
      `${[0, 1, 2, 3].map(r => `<path d="M13 ${18 + r * 10} L51 ${18 + r * 10}" stroke="#b07a42" stroke-width="1.6"/>${[0, 1, 2, 3, 4, 5].map(k => `<circle cx="${16.5 + k * 6.2}" cy="${15 + r * 10}" r="2.6" fill="${(k + r) % 3 ? '#4a1420' : '#2e4a24'}" ${SK}/><circle cx="${16 + k * 6.2}" cy="${14.4 + r * 10}" r=".7" fill="#fff" opacity=".5"/>`).join('')}`).join('')}` +
      `<path d="M15 10 L24 28" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>`;
    case 'oven': return shadow() +
      `<rect x="7" y="13" width="50" height="38" rx="3" fill="${A}" ${SK}/>` +
      `<rect x="7" y="13" width="50" height="5" rx="1.5" fill="${H}"/>` +
      `${[0, 1].map(k => `<rect x="11" y="${20 + k * 14}" width="34" height="11" rx="1.5" fill="#24150e" ${SK}/><rect x="12.5" y="${21.5 + k * 14}" width="31" height="8" rx="1" fill="${U('fire')}" opacity=".9"/><path d="M15 ${28 + k * 14} Q20 ${25 + k * 14} 26 ${28 + k * 14} Q32 ${25 + k * 14} 41 ${28 + k * 14}" stroke="#7a3b16" stroke-width="1.6" fill="none"/><rect x="11" y="${19 + k * 14}" width="34" height="1.6" rx=".8" fill="${U('blkh')}"/>`).join('')}` +
      `<rect x="47" y="20" width="7" height="25" rx="1" fill="${D}"/>${[24, 31, 38].map(y => `<circle cx="50.5" cy="${y}" r="2" fill="${U('blk')}"/><path d="M50.5 ${y} L50.5 ${y - 1.6}" stroke="#fff" stroke-width=".7"/>`).join('')}` +
      `<path d="M10 51 L10 56 M54 51 L54 56" stroke="${DS}" stroke-width="2.4"/>` + shine(7.5, 14, 2.5, 34);
    case 'tunnel': return shadow(32, 28) +
      `<rect x="3" y="35" width="58" height="5" rx="2" fill="${U('blkh')}"/><path d="M5 37.5 L59 37.5" stroke="#777" stroke-width=".5" stroke-dasharray="2 1.2"/>` +
      `<path d="M12 35 L12 20 Q12 14 18 14 L46 14 Q52 14 52 20 L52 35 Z" fill="${A}" ${SK}/><rect x="15" y="24" width="34" height="11" fill="${U('fire')}" opacity=".85"/>` +
      `${[6, 10, 54, 58].map(x => `<ellipse cx="${x}" cy="33.5" rx="2.4" ry="1.4" fill="#d9a35a" ${SK}/>`).join('')}<rect x="28" y="9" width="8" height="5" fill="${D}"/>` +
      `<rect x="38" y="17" width="10" height="5" rx="1" fill="${U('scr')}"/><path d="M39.5 19.5 L46 19.5" stroke="#ffb46b" stroke-width="1.2"/>` +
      `<path d="M6 40 L6 55 M58 40 L58 55 M32 40 L32 55" stroke="${DS}" stroke-width="2.2"/>` + shine(13, 15, 2.5, 18);
    case 'roaster': return shadow() +
      `<rect x="10" y="38" width="44" height="15" rx="2" fill="${A}" ${SK}/>` +
      `<circle cx="26" cy="28" r="13" fill="${H}" ${SK}/><circle cx="26" cy="28" r="8" fill="${U('blk')}" ${SK}/><circle cx="26" cy="28" r="5.5" fill="#5a3418"/>${[[24, 26], [27, 29], [25, 30], [28, 26]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.3" ry=".9" fill="#7a4a22"/>`).join('')}` +
      `<path d="M38 10 L44 10 L44 24 L38 30 Z" fill="${A}" ${SK}/><rect x="40" y="4" width="3" height="7" fill="${D}"/>` +
      `<ellipse cx="46" cy="46" rx="7" ry="3" fill="${D}"/><ellipse cx="46" cy="45.5" rx="5.5" ry="2" fill="#6b3d1a"/>` + shine(17, 18, 3, 16);
    case 'stove': return shadow(32, 27) +
      `<rect x="6" y="25" width="52" height="28" rx="2" fill="${A}" ${SK}/><rect x="6" y="21" width="52" height="5" rx="1.5" fill="${U('blkh')}"/>` +
      `${[12, 20].map(x => `<circle cx="${x}" cy="23.5" r="1.6" fill="${D}"/>`).join('')}` +
      `<rect x="11" y="31" width="42" height="17" rx="1.5" fill="${H}" ${SK}/><rect x="15" y="34" width="34" height="8" rx="1" fill="${U('gls')}" opacity=".7"/><rect x="15" y="29" width="34" height="1.6" rx=".8" fill="${U('blk')}"/>` +
      `<path d="M12 13 L12 20 Q12 21 14 21 L26 21 Q28 21 28 20 L28 13 Z" fill="${H}" ${SK}/><ellipse cx="20" cy="13" rx="8" ry="1.6" fill="${D}"/>` +
      `<path d="M34 16 L34 20 Q34 21 36 21 L50 21 Q52 21 52 20 L52 16 Z" fill="${U('red')}" ${SK}/><path d="M52 18 L58 17" stroke="#2c2f36" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M17 10 Q15 7 17 4 M22 10 Q20 7 22 4" stroke="var(--muted)" stroke-width="1.1" fill="none" opacity=".8"/>` +
      `<path d="M15 21 L16 19.5 L17 21 M23 21 L24 19.5 L25 21 M38 21 L39 19.5 L40 21 M46 21 L47 19.5 L48 21" stroke="#4aa3ff" stroke-width=".9" fill="none"/>`;
    case 'mixer': return shadow(30, 22) +
      `<rect x="10" y="48" width="40" height="6" rx="2" fill="${D}" ${SK}/>` +
      `<path d="M38 50 L38 16 Q38 10 32 10 L18 10 Q14 10 14 14 L14 21 L34 21 L34 50 Z" fill="${A}" ${SK}/>` +
      `<path d="M8 28 L40 28 L37 47 Q24 50 11 47 Z" fill="${H}" ${SK}/><ellipse cx="24" cy="28" rx="16" ry="3" fill="${D}"/><ellipse cx="24" cy="28.6" rx="13.5" ry="2.2" fill="#f1dfb8"/>` +
      `<path d="M24 21 Q20 25 24 28 Q27 30 23 33" stroke="${DS}" stroke-width="2.2" fill="none"/>` +
      `<rect x="40" y="18" width="10" height="16" rx="1.5" fill="${U('blkh')}"/><circle cx="45" cy="23" r="1.6" fill="#7bd36a"/><circle cx="45" cy="29" r="1.6" fill="${U('red')}"/>` + shine(15, 11, 2.5, 9);
    case 'gelato': return shadow() +
      `<rect x="12" y="20" width="40" height="34" rx="2.5" fill="${A}" ${SK}/><rect x="16" y="9" width="32" height="12" rx="2" fill="${H}" ${SK}/>` +
      `<ellipse cx="32" cy="9" rx="10" ry="2" fill="${D}"/><circle cx="32" cy="34" r="8" fill="${D}" ${SK}/><circle cx="32" cy="34" r="6" fill="${U('gls')}"/><path d="M27.5 35 Q32 31 36.5 35 Q32 38 27.5 35 Z" fill="#f7cfe0"/>` +
      `<path d="M28 42 L36 42 L35 48 L29 48 Z" fill="${D}"/><rect x="18" y="23" width="9" height="4" rx="1" fill="${U('scr')}"/><circle cx="44" cy="25" r="1.6" fill="${ac}"/>` + shine(13, 21, 2.5, 30);
    case 'mill': return shadow() +
      `<path d="M18 6 L46 6 L40 20 L24 20 Z" fill="${H}" ${SK}/><ellipse cx="32" cy="6" rx="14" ry="2.4" fill="${D}"/><ellipse cx="32" cy="6.3" rx="11" ry="1.6" fill="#e5c98f"/>` +
      `<rect x="15" y="20" width="34" height="22" rx="2" fill="${A}" ${SK}/>` +
      `<circle cx="25" cy="31" r="6.5" fill="${D}" ${SK}/><circle cx="39" cy="31" r="6.5" fill="${D}" ${SK}/>${[25, 39].map(x => `<path d="M${x - 5} 31 L${x + 5} 31 M${x} 26 L${x} 36 M${x - 3.5} 27.5 L${x + 3.5} 34.5 M${x + 3.5} 27.5 L${x - 3.5} 34.5" stroke="${HS}" stroke-width=".9"/>`).join('')}` +
      `<path d="M22 42 L42 42 L38 50 L26 50 Z" fill="${A}" ${SK}/><path d="M29 50 L35 50 L34 55 L30 55 Z" fill="#f4ecdc"/>` + shine(16, 21, 2.5, 19);
    case 'line': return shadow(32, 29) +
      `<rect x="2" y="36" width="60" height="5" rx="2.5" fill="${U('blkh')}"/>${[6, 14, 22, 30, 38, 46, 54].map(x => `<circle cx="${x + 2}" cy="38.5" r="1.6" fill="${H}"/>`).join('')}` +
      `<rect x="19" y="11" width="26" height="20" rx="2" fill="${A}" ${SK}/><rect x="22" y="14" width="20" height="9" rx="1" fill="${U('gls')}" ${SK}/><rect x="30" y="31" width="4" height="5" fill="${D}"/>` +
      `<rect x="38" y="25" width="5" height="3.5" rx=".8" fill="${U('scr')}"/><circle cx="24" cy="27" r="1.4" fill="${ac}"/>` +
      `${[5, 11, 49, 55].map(x => `<rect x="${x}" y="27" width="5" height="9" rx="1.5" fill="${x < 30 ? '#cfe8f5' : U('card')}" ${SK}/>${x < 30 ? `<rect x="${x + 1.4}" y="25" width="2.2" height="2.5" fill="${U('red')}"/>` : ''}`).join('')}` +
      `<path d="M6 41 L5 56 M58 41 L59 56 M32 41 L32 56" stroke="${DS}" stroke-width="2.2"/>` + shine(20, 12, 2.5, 18);
    case 'table': return shadow(32, 27) +
      `<path d="M7 24 L7 52 M7 38 L16 38 L16 52" stroke="${HS}" stroke-width="2" fill="none"/><path d="M7 24 Q7 21 10 21 Q14 22 14 30 L14 37" stroke="${HS}" stroke-width="2" fill="none"/>` +
      `<path d="M57 24 L57 52 M57 38 L48 38 L48 52" stroke="${HS}" stroke-width="2" fill="none"/><path d="M57 24 Q57 21 54 21 Q50 22 50 30 L50 37" stroke="${HS}" stroke-width="2" fill="none"/>` +
      `<ellipse cx="11.5" cy="37.5" rx="5.5" ry="1.8" fill="${U('wood')}" ${SK}/><ellipse cx="52.5" cy="37.5" rx="5.5" ry="1.8" fill="${U('wood')}" ${SK}/>` +
      `<path d="M32 33 L32 52" stroke="${HS}" stroke-width="3"/><ellipse cx="32" cy="53" rx="8" ry="1.8" fill="${D}"/>` +
      `<ellipse cx="32" cy="30" rx="19" ry="5.5" fill="${U('woodh')}" ${SK}/><ellipse cx="32" cy="29.2" rx="17" ry="4.2" fill="${U('wood')}"/><path d="M20 28 Q32 26 44 28" stroke="#fff" stroke-opacity=".35" stroke-width="1" fill="none"/>` +
      `<path d="M28 24 L28 28.5 Q30 29.5 32 28.5 L32 24 Z" fill="#fff" ${SK}/><ellipse cx="30" cy="24" rx="2" ry=".6" fill="#6b3d1a"/><path d="M36 22 L36 28.6 M34.5 22 L37.5 22" stroke="#6fa04a" stroke-width="1.2"/><circle cx="36" cy="21" r="1.6" fill="${ac}"/>`;
    case 'bench': return shadow(32, 27) +
      `<rect x="6" y="14" width="52" height="16" rx="1.5" fill="#f7f9fa" ${SK}/><path d="M10 19 L30 19 M10 23 L24 23" stroke="#5b6b7a" stroke-width="1"/>` +
      `<rect x="6" y="34" width="52" height="4" rx="1" fill="${U('wood')}" ${SK}/><path d="M10 38 L10 54 M54 38 L54 54" stroke="${HS}" stroke-width="2.2"/>` +
      `${[16, 32, 48].map(x => `<rect x="${x - 4}" y="40" width="8" height="5" rx="1.5" fill="${U('blu')}" ${SK}/><path d="M${x - 3} 45 L${x - 3} 53 M${x + 3} 45 L${x + 3} 53" stroke="${DS}" stroke-width="1.3"/>`).join('')}`;
    case 'chair': return shadow(32, 18) +
      `<path d="M20 9 Q20 5 24 5 L40 5 Q44 5 44 9 L44 28 L20 28 Z" fill="${U('lth')}" ${SK}/><path d="M24 8 L24 26 M32 8 L32 26 M40 8 L40 26" stroke="#000" stroke-opacity=".25" stroke-width=".8"/>` +
      `<rect x="16" y="27" width="32" height="9" rx="4" fill="${U('lth')}" ${SK}/>` +
      `<path d="M13 22 L20 22 L20 32 L13 32 Z M44 22 L51 22 L51 32 L44 32 Z" fill="${H}" ${SK}/>` +
      `<rect x="29.5" y="36" width="5" height="12" fill="${H}"/><ellipse cx="32" cy="52" rx="12" ry="3" fill="${A}" ${SK}/><rect x="26" y="44" width="12" height="2.5" rx="1" fill="${D}"/>` + shine(22, 6, 2.5, 20);
    case 'sink': return shadow(32, 20) +
      `<path d="M12 22 Q12 14 22 14 L42 14 Q52 14 52 22 L50 34 L14 34 Z" fill="${U('wht')}" ${SK}/><ellipse cx="32" cy="20" rx="15" ry="4" fill="#d9e2e8"/>` +
      `<path d="M40 14 L40 8 Q40 6 37 6 L32 6" stroke="${HS}" stroke-width="2.2" fill="none"/>` +
      `<path d="M16 33 L16 42 L48 42 L48 33" fill="${U('lth')}"/><rect x="12" y="40" width="40" height="7" rx="3" fill="${U('lth')}" ${SK}/><rect x="28" y="47" width="8" height="5" fill="${H}"/><ellipse cx="32" cy="54" rx="11" ry="2.4" fill="${A}"/>`;
    case 'bed': return shadow(32, 28) +
      `<rect x="5" y="14" width="9" height="40" rx="2" fill="${U('woodh')}" ${SK}/>` +
      `<rect x="10" y="33" width="49" height="12" rx="2" fill="${U('wht')}" ${SK}/>` +
      `<path d="M28 31 L59 31 Q60 31 60 33 L60 44 Q44 47 28 44 Z" fill="${ac}"/><path d="M28 31 L59 31 Q60 31 60 33 L60 44 Q44 47 28 44 Z" fill="${U('cloth')}"/>` +
      `<rect x="14" y="25" width="15" height="9" rx="4" fill="${U('wht')}" ${SK}/><path d="M17 28 Q21 30 26 28" stroke="#c9ced4" stroke-width=".8" fill="none"/>` +
      `<path d="M12 45 L12 54 M57 45 L57 54" stroke="#b07a42" stroke-width="2.6"/>`;
    case 'register': return shadow() +
      `<path d="M12 33 L52 33 L55 49 L9 49 Z" fill="${U('blk')}" ${SK}/><rect x="7" y="49" width="50" height="6" rx="1.5" fill="${A}" ${SK}/><rect x="28" y="51" width="8" height="1.6" rx=".8" fill="${D}"/>` +
      `<rect x="19" y="9" width="26" height="18" rx="2" fill="${U('blk')}" ${SK}/><rect x="21" y="11" width="22" height="14" rx="1" fill="${U('scr')}"/>` +
      `<rect x="23" y="13" width="8" height="4" rx=".6" fill="#3c88cf"/><rect x="33" y="13" width="8" height="4" rx=".6" fill="#4e9e3a"/><rect x="23" y="19" width="18" height="1.2" fill="#6fd0ff" opacity=".7"/><rect x="23" y="21.5" width="12" height="1.2" fill="#6fd0ff" opacity=".5"/>` +
      `<path d="M30 27 L29 33 L35 33 L34 27 Z" fill="${H}"/>` +
      `${[0, 1, 2].map(r => [0, 1, 2, 3, 4].map(k => `<rect x="${15 + k * 7 - r * .5}" y="${36 + r * 4}" width="5" height="2.6" rx=".6" fill="${k === 4 && r === 2 ? '#4e9e3a' : '#5b5f69'}"/>`).join('')).join('')}` +
      `<rect x="47" y="23" width="9" height="10" rx="1" fill="${A}" ${SK}/><path d="M48.5 23 L48.5 15 L54.5 15 L54.5 23" fill="#fff" ${SK}/><path d="M50 17 L53 17 M50 19 L53 19" stroke="#aaa" stroke-width=".6"/>` + shine(20, 10, 2, 16);
    case 'desk': return shadow(32, 28) +
      `<path d="M4 30 L60 30 L58 54 L6 54 Z" fill="${U('woodh')}" ${SK}/><rect x="3" y="27" width="58" height="4" rx="1.5" fill="${A}" ${SK}/>` +
      `<rect x="10" y="10" width="20" height="14" rx="1.5" fill="${U('blk')}" ${SK}/><rect x="11.5" y="11.5" width="17" height="11" fill="${U('scr')}"/><path d="M13 14 L22 14 M13 17 L26 17 M13 20 L19 20" stroke="#6fd0ff" stroke-width=".9"/><path d="M20 24 L20 27" stroke="${DS}" stroke-width="2"/>` +
      `<rect x="36" y="19" width="12" height="8" rx="1" fill="#fff" ${SK}/><path d="M38 21.5 L46 21.5 M38 24 L44 24" stroke="#999" stroke-width=".7"/>` +
      `<circle cx="53" cy="23" r="3.4" fill="${U('ylw')}" ${SK}/><path d="M53 19.6 L53 17" stroke="${DS}" stroke-width="1"/>` +
      `<path d="M10 38 L54 38" stroke="#000" stroke-opacity=".18" stroke-width="1.2"/>`;
    case 'dishwasher': case 'washer': return shadow(32, 22) +
      `<rect x="11" y="6" width="42" height="49" rx="3" fill="${A}" ${SK}/><rect x="11" y="6" width="42" height="10" rx="3" fill="${H}"/><path d="M11 16 L53 16" stroke="${OUT}" stroke-opacity=".3"/>` +
      `<rect x="31" y="8.5" width="14" height="5" rx="1" fill="${U('scr')}"/><path d="M33 11 L40 11" stroke="#7bd36a" stroke-width="1.3"/><circle cx="17" cy="11" r="2.2" fill="${U('blk')}"/><circle cx="24" cy="11" r="1.3" fill="${ac}"/>` +
      (shape === 'washer'
        ? `<circle cx="32" cy="35" r="14" fill="${H}" ${SK}/><circle cx="32" cy="35" r="11" fill="${U('blk')}"/><circle cx="32" cy="35" r="9.5" fill="#bfe3f5"/><path d="M22.5 37 Q27 33 32 37 Q37 41 41.5 37 L41.5 40 Q32 48 22.5 40 Z" fill="#5aa9e6" opacity=".75"/><path d="M26 39 Q30 35 34 40" stroke="#e98bb0" stroke-width="2.2" fill="none"/><path d="M26 28 Q29 26 32 26.5" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"/>`
        : `<rect x="15" y="20" width="34" height="30" rx="1.5" fill="${H}" ${SK}/><rect x="15" y="20" width="34" height="3" rx="1" fill="${U('blkh')}"/><path d="M19 30 L45 30 M19 36 L45 36 M19 42 L45 42" stroke="${DS}" stroke-width=".8" opacity=".6"/>`) + shine(12, 17, 2.5, 36);
    case 'iron': return shadow(32, 26) +
      `<path d="M4 36 L46 31 Q60 32 60 37 Q58 41 46 41 L4 41 Z" fill="${U('blu')}" ${SK}/><path d="M6 37 L46 33" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>` +
      `<path d="M16 41 L12 56 M44 41 L48 56 M16 41 L48 56" stroke="${HS}" stroke-width="2"/>` +
      `<path d="M20 31 Q21 20 34 19 L44 19 Q47 25 46 31 Z" fill="${A}" ${SK}/><path d="M20 31 L46 31" stroke="${DS}" stroke-width="1.6"/>` +
      `<path d="M27 19 Q28 12 37 12 L41 12 L42 19" fill="none" stroke="#2c2f36" stroke-width="2.6"/>` +
      `<path d="M24 16 Q21 12 24 8 M30 14 Q27 10 30 6" stroke="var(--muted)" stroke-width="1.1" fill="none" opacity=".75"/>`;
    case 'shelf': return shadow(32, 24) +
      `<rect x="8" y="5" width="48" height="51" rx="1.5" fill="${D}" ${SK}/><rect x="11" y="8" width="42" height="46" fill="${U('t' + t + 'h')}" opacity=".55"/>` +
      `${[0, 1, 2].map(r => { const y = 9 + r * 15; return `<rect x="10" y="${y + 13}" width="44" height="2" fill="${A}"/>` +
        `<rect x="13" y="${y + 3}" width="7" height="10" rx=".8" fill="${U('red')}" ${SK}/><rect x="21" y="${y + 5}" width="9" height="8" rx=".8" fill="${U('blu')}" ${SK}/><rect x="31" y="${y + 1}" width="6" height="12" rx="1.5" fill="${U('grn')}" ${SK}/><rect x="38" y="${y + 4}" width="7" height="9" rx=".8" fill="${U('ylw')}" ${SK}/><rect x="46" y="${y + 6}" width="6" height="7" rx=".8" fill="${U('org')}" ${SK}/>` +
        `<path d="M14 ${y + 4} L14 ${y + 12} M22 ${y + 6} L22 ${y + 12} M32 ${y + 2.5} L32 ${y + 12}" stroke="#fff" stroke-opacity=".45" stroke-width=".9"/>`; }).join('')}`;
    case 'rack': return shadow(32, 26) +
      `<path d="M8 12 L56 12" stroke="${HS}" stroke-width="2.4"/><path d="M10 12 L10 54 M54 12 L54 54" stroke="${HS}" stroke-width="2"/><path d="M5 54 L15 54 M49 54 L59 54" stroke="${DS}" stroke-width="2.4"/>` +
      `${[15, 22, 29, 36, 43].map((x, i) => `<path d="M${x + 2} 12 L${x + 2} 15" stroke="#888" stroke-width=".7"/><path d="M${x - 1.5} 16 L${x + 2} 14.5 L${x + 5.5} 16 L${x + 5} ${36 + (i % 2) * 6} L${x - 1} ${36 + (i % 2) * 6} Z" fill="${['#c8434f', '#3c88cf', '#e9c27b', '#4e9e3a', '#7a5aa6'][i]}" ${SK}/><path d="M${x - 1.5} 16 L${x + 5.5} 16 L${x + 5} ${36 + (i % 2) * 6} L${x - 1} ${36 + (i % 2) * 6} Z" fill="${U('cloth')}"/>`).join('')}`;
    case 'curtain': return shadow(32, 24) +
      `<path d="M8 6 L56 6" stroke="${HS}" stroke-width="2.6"/>` +
      `<path d="M10 7 Q13 30 10 54 L22 54 Q19 30 22 7 Z M22 7 Q25 30 22 54 L34 54 Q31 30 34 7 Z" fill="${ac}"/><path d="M10 7 Q13 30 10 54 L34 54 Q31 30 34 7 Z" fill="${U('cloth')}"/>` +
      `<rect x="36" y="10" width="18" height="40" rx="2" fill="${U('gls')}" ${SK}/><path d="M39 14 L46 26" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/><rect x="36" y="50" width="18" height="4" fill="${U('wood')}"/>`;
    case 'locker': return shadow(32, 24) +
      `${[0, 1, 2].map(k => `<rect x="${9 + k * 15.5}" y="6" width="15" height="49" rx="1" fill="${A}" ${SK}/><path d="M${12 + k * 15.5} 10 L${21 + k * 15.5} 10 M${12 + k * 15.5} 12.5 L${21 + k * 15.5} 12.5 M${12 + k * 15.5} 15 L${21 + k * 15.5} 15" stroke="${DS}" stroke-width="1"/><rect x="${19.5 + k * 15.5}" y="27" width="2" height="7" rx="1" fill="${U('blk')}"/>`).join('')}` + shine(10, 7, 2, 46);
    case 'tools': return shadow(32, 28) +
      `<rect x="5" y="6" width="54" height="28" rx="1.5" fill="#d8dcdf" ${SK}/>${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => `<circle cx="${8 + k * 4.8}" cy="${9 + r * 6.5}" r=".55" fill="#9aa2a9"/>`).join('')).join('')}` +
      `<path d="M12 10 L12 26" stroke="${HS}" stroke-width="2.4"/><path d="M9.5 10 Q12 6.5 14.5 10 Q12 12 9.5 10 Z" fill="${H}" ${SK}/>` +
      `<path d="M21 9 L21 18" stroke="#b07a42" stroke-width="2.6"/><rect x="17" y="18" width="8" height="4.5" rx="1" fill="${U('blk')}"/>` +
      `<path d="M31 9 L31 21" stroke="${HS}" stroke-width="1.6"/><rect x="29" y="21" width="4" height="8" rx="1.5" fill="${U('red')}"/>` +
      `<path d="M39 10 L46 27 M46 10 L39 27" stroke="${HS}" stroke-width="1.8"/><circle cx="42.5" cy="18.5" r="1.4" fill="${D}"/><circle cx="52" cy="17" r="4" fill="none" stroke="#ef7d22" stroke-width="2"/>` +
      `<rect x="5" y="36" width="54" height="18" rx="2" fill="${U('red')}" ${SK}/>${[40, 46].map(y => `<path d="M8 ${y + 1} L56 ${y + 1}" stroke="#000" stroke-opacity=".25"/><rect x="27" y="${y - 1}" width="10" height="1.8" rx=".9" fill="${H}"/>`).join('')}` + shine(6, 37, 52, 2);
    case 'screen': return shadow(32, 20) +
      `<rect x="7" y="6" width="50" height="33" rx="2.5" fill="${U('blk')}" ${SK}/><rect x="10" y="9" width="44" height="26" rx="1" fill="${U('scr')}"/>` +
      `<path d="M13 29 L19 23 L24 26 L31 17 L37 22 L43 14 L51 19" stroke="#7bd36a" stroke-width="1.6" fill="none"/><path d="M13 31 L51 31" stroke="#6fd0ff" stroke-opacity=".4" stroke-width=".8"/>` +
      `<rect x="13" y="11" width="10" height="3" rx=".6" fill="#3c88cf"/><path d="M12 10 L22 30" stroke="#fff" stroke-opacity=".1" stroke-width="5"/>` +
      `<rect x="29" y="39" width="6" height="7" fill="${H}"/><rect x="18" y="46" width="28" height="5" rx="1.5" fill="${A}" ${SK}/><path d="M20 51 L18 56 M44 51 L46 56" stroke="${DS}" stroke-width="2"/>`;
    case 'tyre': return shadow(30, 22) +
      `<rect x="34" y="12" width="20" height="42" rx="2" fill="${A}" ${SK}/><rect x="37" y="16" width="14" height="6" rx="1" fill="${U('scr')}"/><path d="M39 19 L48 19" stroke="#7bd36a" stroke-width="1.2"/>` +
      `<circle cx="22" cy="36" r="15" fill="${U('blk')}" ${SK}/><circle cx="22" cy="36" r="15" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2.4" stroke-dasharray="2 2"/><circle cx="22" cy="36" r="8.5" fill="${H}" ${SK}/>${[0, 72, 144, 216, 288].map(a => `<path d="M22 36 L${22 + 7 * Math.cos(a * Math.PI / 180)} ${36 + 7 * Math.sin(a * Math.PI / 180)}" stroke="${DS}" stroke-width="2"/>`).join('')}<circle cx="22" cy="36" r="2.2" fill="${D}"/>`;
    case 'lift': return shadow(32, 29) +
      `<rect x="5" y="6" width="7" height="50" rx="1" fill="${A}" ${SK}/><rect x="52" y="6" width="7" height="50" rx="1" fill="${A}" ${SK}/><rect x="3" y="4" width="11" height="3" fill="${D}"/><rect x="50" y="4" width="11" height="3" fill="${D}"/>` +
      `<rect x="12" y="34" width="40" height="3" fill="${U('ylw')}" ${SK}/>` +
      `<path d="M13 30 L15 22 Q17 18 23 17 L38 17 Q44 18 47 22 L51 26 Q53 27 52 30 Z" fill="${U('red')}" ${SK}/><path d="M22 18.5 L24 24 L37 24 L37 18.5 Z M39 18.5 L39 24 L46 24 Q44 20 39 18.5 Z" fill="${U('gls')}"/>` +
      `<circle cx="22" cy="31" r="4.4" fill="${U('blk')}"/><circle cx="22" cy="31" r="1.8" fill="${H}"/><circle cx="43" cy="31" r="4.4" fill="${U('blk')}"/><circle cx="43" cy="31" r="1.8" fill="${H}"/>` +
      `<rect x="2" y="55" width="60" height="3" rx="1" fill="${D}"/>`;
    case 'sewing': return shadow(32, 28) +
      `<rect x="4" y="40" width="56" height="5" rx="1" fill="${U('woodh')}" ${SK}/><path d="M9 45 L9 56 M55 45 L55 56" stroke="#2c2f36" stroke-width="2.4"/>` +
      `<path d="M12 40 L12 22 Q12 13 21 13 L47 13 Q53 13 53 19 L53 28 L46 28 L46 21 L21 21 L21 40 Z" fill="${A}" ${SK}/><rect x="12" y="36" width="44" height="4" rx="1" fill="${H}" ${SK}/>` +
      `<path d="M49 28 L49 36" stroke="${DS}" stroke-width="1.2"/><rect x="47" y="26" width="4" height="3" fill="${D}"/>` +
      `<circle cx="16.5" cy="27" r="4.5" fill="${H}" ${SK}/><circle cx="16.5" cy="27" r="1.4" fill="${D}"/><rect x="28" y="9" width="4" height="4" rx="1" fill="${ac}"/>` +
      `<path d="M30 36 Q40 33 58 38" stroke="#e98bb0" stroke-width="2" fill="none"/><path d="M26 39 L60 39" stroke="#f0d6a0" stroke-width="2"/>` + shine(13, 14, 2.5, 22);
    case 'tractor': return shadow(32, 28) +
      `<path d="M8 26 L36 26 L38 40 L8 40 Z" fill="${U('grn')}" ${SK}/><path d="M36 30 L56 33 L56 42 L36 42 Z" fill="${U('grn')}" ${SK}/><path d="M38 34 L55 36" stroke="#fff" stroke-opacity=".3" stroke-width="1"/>` +
      `<rect x="13" y="8" width="20" height="19" rx="2" fill="${U('gls')}" ${SK}/><path d="M13 8 L33 8" stroke="#2c2f36" stroke-width="2.4"/><path d="M16 11 L24 22" stroke="#fff" stroke-opacity=".7" stroke-width="1.3"/>` +
      `<path d="M48 33 L48 22" stroke="#2c2f36" stroke-width="2.4"/>` +
      `<circle cx="18" cy="44" r="12" fill="${U('blk')}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="17" y="31.4" width="2" height="3" fill="#15161a" transform="rotate(${a} 18 44)"/>`).join('')}<circle cx="18" cy="44" r="5.5" fill="${U('ylw')}" ${SK}/><circle cx="18" cy="44" r="1.6" fill="#333"/>` +
      `<circle cx="49" cy="48" r="7" fill="${U('blk')}"/><circle cx="49" cy="48" r="3.4" fill="${U('ylw')}" ${SK}/>`;
    case 'forklift': return shadow(32, 28) +
      `<path d="M8 28 L34 28 L36 46 L8 46 Z" fill="${U('ylw')}" ${SK}/><path d="M8 28 L34 28" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><rect x="4" y="32" width="6" height="12" rx="1" fill="${U('blk')}"/>` +
      `<path d="M13 28 L16 9 L33 9 L35 28" fill="none" stroke="#2c2f36" stroke-width="2.2"/><rect x="18" y="20" width="10" height="8" rx="1.5" fill="${U('lth')}"/>` +
      `<rect x="38" y="5" width="4" height="46" fill="${H}" ${SK}/><path d="M42 47 L60 47" stroke="${DS}" stroke-width="2.6"/>` +
      `<rect x="44" y="35" width="15" height="2" fill="${U('wood')}"/><rect x="44" y="27" width="15" height="8" rx="1" fill="${U('card')}" ${SK}/><path d="M44 31 L59 31" stroke="#8a6a3a" stroke-width=".7"/>` +
      `<circle cx="16" cy="48" r="6" fill="${U('blk')}"/><circle cx="16" cy="48" r="2.4" fill="${H}"/><circle cx="32" cy="48" r="6" fill="${U('blk')}"/><circle cx="32" cy="48" r="2.4" fill="${H}"/>`;
    case 'treadmill': return shadow(32, 28) +
      `<path d="M5 47 L49 41 L57 46 L13 53 Z" fill="${U('blk')}" ${SK}/><path d="M9 47.5 L50 42" stroke="#555" stroke-width="2.4"/>` +
      `<path d="M47 42 L42 14" stroke="${HS}" stroke-width="3"/><path d="M42 20 L28 23" stroke="${HS}" stroke-width="2.2" stroke-linecap="round"/>` +
      `<rect x="32" y="6" width="22" height="11" rx="2" fill="${A}" ${SK}/><rect x="35" y="8.5" width="16" height="6" rx="1" fill="${U('scr')}"/><path d="M37 11.5 L41 11.5 M43 11.5 L49 11.5" stroke="#7bd36a" stroke-width="1.2"/>`;
    case 'weights': return shadow(32, 28) +
      `<rect x="6" y="30" width="52" height="3" fill="${H}" ${SK}/><path d="M10 33 L8 55 M54 33 L56 55" stroke="${DS}" stroke-width="2.4"/><rect x="6" y="46" width="52" height="3" fill="${H}" ${SK}/>` +
      `${[14, 26, 38, 50].map((x, i) => `<rect x="${x - 6}" y="${25 - i}" width="12" height="2.4" rx="1.2" fill="${H}"/><rect x="${x - 6}" y="${22 - i * 1.2}" width="3.4" height="${8 + i * 1.2}" rx="1.2" fill="${U('blk')}"/><rect x="${x + 2.6}" y="${22 - i * 1.2}" width="3.4" height="${8 + i * 1.2}" rx="1.2" fill="${U('blk')}"/>`).join('')}` +
      `${[18, 32, 46].map(x => `<circle cx="${x}" cy="40" r="5" fill="${U('blk')}" ${SK}/><circle cx="${x}" cy="40" r="1.6" fill="${H}"/>`).join('')}`;
    case 'spa': return shadow(32, 28) +
      `<ellipse cx="32" cy="38" rx="27" ry="12" fill="${A}" ${SK}/><ellipse cx="32" cy="35" rx="23" ry="8.5" fill="#6cc6e8"/><ellipse cx="32" cy="35" rx="23" ry="8.5" fill="${U('gls')}" opacity=".5"/>` +
      `${[[22, 34], [33, 37], [41, 33], [28, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#fff" opacity=".85"/>`).join('')}` +
      `<path d="M22 22 Q20 18 22 14 M32 22 Q30 17 32 12 M42 22 Q40 18 42 14" stroke="var(--muted)" stroke-width="1.2" fill="none" opacity=".7"/>`;
    case 'tank': return shadow(32, 28) +
      `${[[6, 14, 22], [26, 8, 26], [46, 16, 14]].map(([x, y, w], i) => `<rect x="${x}" y="${y}" width="${i === 2 ? 13 : 18}" height="${50 - y}" rx="${i === 2 ? 6.5 : 9}" fill="${A}" ${SK}/><path d="M${x + 3} ${y + 6} L${x + 3} ${46}" stroke="#fff" stroke-opacity=".6" stroke-width="1.6"/>`).join('')}` +
      `<path d="M24 26 L26 26 M24 40 L26 40 M44 30 L46 30" stroke="${DS}" stroke-width="3"/>` +
      `<circle cx="35" cy="22" r="3.4" fill="#fff" ${SK}/><path d="M35 22 L37 20.5" stroke="#d23f37" stroke-width=".8"/><rect x="31" y="36" width="8" height="6" rx="1" fill="${U('scr')}"/><path d="M32.5 39 L37.5 39" stroke="#ffb46b" stroke-width="1"/>` +
      `<rect x="2" y="50" width="60" height="5" rx="1" fill="${D}"/>`;
    case 'barn': return shadow(32, 28) +
      `<path d="M6 28 L32 9 L58 28 L58 55 L6 55 Z" fill="${U('red')}" ${SK}/><path d="M4 29 L32 8 L60 29" stroke="#f7f1ea" stroke-width="2.6" fill="none"/>` +
      `<rect x="22" y="33" width="20" height="22" fill="${U('woodh')}" ${SK}/><path d="M22 33 L42 55 M42 33 L22 55" stroke="#f7f1ea" stroke-width="1.6"/><rect x="22" y="33" width="20" height="22" fill="none" stroke="#f7f1ea" stroke-width="1.6"/>` +
      `<rect x="28" y="19" width="8" height="8" fill="${U('gls')}" ${SK}/><rect x="46" y="40" width="9" height="9" rx="1" fill="${H}" ${SK}/><circle cx="50.5" cy="44.5" r="2.4" fill="#fff" ${SK}/>`;
    case 'sprinkler': return shadow(32, 28) +
      `<path d="M4 52 Q32 46 60 52 L60 58 L4 58 Z" fill="${U('grn')}"/>` +
      `<path d="M8 47 L56 47" stroke="${HS}" stroke-width="3"/>${[14, 32, 50].map(x => `<rect x="${x - 1.5}" y="36" width="3" height="11" fill="${H}" ${SK}/><circle cx="${x}" cy="35" r="2.6" fill="${D}"/><path d="M${x} 33 Q${x - 8} 22 ${x - 12} 30 M${x} 33 Q${x + 8} 22 ${x + 12} 30 M${x} 32 L${x} 22" stroke="#6cc6e8" stroke-width="1.2" fill="none" stroke-dasharray="1.5 1.5"/>`).join('')}`;
    default: return shadow() + `<rect x="10" y="12" width="44" height="40" rx="3" fill="${A}" ${SK}/><circle cx="32" cy="32" r="10" fill="${D}" ${SK}/><circle cx="32" cy="32" r="4" fill="${ac}"/>` + shine(11, 13, 2.5, 36);
  }
}

/** macchinario: own = {tier, cond, broken} oppure null se non lo possiedi */
function machine(def, own, size = 44) {
  const shape = EQ_SHAPE[def.cat] || 'box';
  const tier = own ? own.tier : 0;
  const ac = ['#3c88cf', '#ef7d22', '#2f9a5c'][tier];
  let s = eqDraw(shape, tier, ac), over = '', ring = 'var(--line2)';
  if (!own) {
    s = `<g opacity=".3" style="filter:grayscale(1)">${s}</g>`;
    over = `<circle cx="51" cy="51" r="9" fill="var(--panel)" stroke="var(--line2)" stroke-width="1.6"/><path d="M51 46.5 L51 55.5 M46.5 51 L55.5 51" stroke="var(--muted)" stroke-width="2.2" stroke-linecap="round"/>`;
  } else if (own.broken) {
    s = `<g transform="rotate(-5 32 44)" style="filter:saturate(.45) brightness(.85)">${s}</g>`;
    over = `<circle cx="16" cy="11" r="8" fill="${U('smk')}"/><circle cx="25" cy="7" r="6.5" fill="${U('smk')}"/><circle cx="20" cy="17" r="5.5" fill="${U('smk')}"/>
      <path d="M38 16 L32 29 L38 29 L31 43" stroke="#ffd34a" stroke-width="2.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M38 16 L32 29 L38 29 L31 43" stroke="#fff" stroke-width=".9" fill="none" stroke-linejoin="round"/>
      <path d="M44 56 L60 56 L52 42 Z" fill="${U('ylw')}" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/><path d="M52 46.5 L52 51 M52 53 L52 53.4" stroke="${OUT}" stroke-width="1.8" stroke-linecap="round"/>`;
    ring = 'var(--red)';
  } else {
    const k = own.cond;
    if (k < 80) over += `<g fill="#7a6650" opacity=".45">${[[17, 40, 1.3], [44, 22, 1.1], [38, 46, 1.5], [24, 18, 1], [50, 38, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><path d="M14 23 L21 27 M40 40 L45 37" stroke="#fff" stroke-opacity=".6" stroke-width=".7"/>`;
    if (k < 55) over += `${[[13, 45, 5], [46, 15, 4], [33, 48, 4.5], [50, 34, 3.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${U('rust')}"/>`).join('')}<path d="M40 27 L46 31 M41 30 L45 33" stroke="#4d3a28" stroke-width=".8" opacity=".7"/>`;
    if (k < 35) over += `<path d="M22 14 L26 22 L22.5 27 L27 35 L25 40" stroke="${OUT}" stroke-width="1.3" fill="none" stroke-linejoin="round"/><path d="M50 9 Q52 5 50 1.5 M55 10 Q57 6 55 2.5" stroke="#8b8890" stroke-width="1.4" fill="none"/>`;
    if (k >= 95) over += `<path d="M53 4 L54.6 9 L59.5 10.5 L54.6 12 L53 17 L51.4 12 L46.5 10.5 L51.4 9 Z" fill="#fffbe0" stroke="#e0b040" stroke-width=".8"/><circle cx="53" cy="10.5" r="5" fill="${U('glow')}" opacity=".6"/>`;
    ring = k < 50 ? 'var(--red)' : 'var(--green)';
    if (tier > 0) over += `<g transform="translate(3.5 53)">${[...Array(tier)].map((_, i) => `<path transform="translate(${i * 9} 0)" d="M4 0 L5.2 2.6 L8 3 L6 5 L6.5 8 L4 6.6 L1.5 8 L2 5 L0 3 L2.8 2.6 Z" fill="${U('ylw')}" stroke="${OUT}" stroke-width=".7"/>`).join('')}</g>`;
  }
  return `<svg class="mach" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc(def.n)}"><rect x="1" y="1" width="62" height="62" rx="13" fill="var(--panel2)"/><rect x="1" y="1" width="62" height="40" rx="13" fill="${U('bg')}" opacity=".5"/>${s}${over}<rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="${ring}" stroke-width="2.2"/></svg>`;
}
function machineWord(own) { return !own ? 'da comprare' : own.broken ? 'rotta' : own.cond >= 95 ? 'nuova' : own.cond >= 80 ? 'buona' : own.cond >= 55 ? 'un po\' usata' : own.cond >= 35 ? 'consumata' : 'quasi da buttare'; }

// =================== MATERIALI ===================
const MAT_SHAPE = {
  caffe: ['sack', '#6b3d1a'], caffe_verde: ['sack', '#7f9a4a'], farina: ['sack', '#f4ecdc'], grano: ['sack', '#d9b25a'], zucchero: ['sack', '#ffffff'], malto: ['sack', '#c8914a'],
  fertilizzanti: ['sack', '#5f8a3a'], mangime: ['sack', '#b8954a'], lievito: ['block', '#e8d7a8'], burro: ['block', '#f6dc7a'],
  latte: ['carton', '#3c88cf'], panna: ['carton', '#e9a3c0'], cacao: ['choco', '#5a3418'], cornetti: ['croissant'], pane: ['bread'],
  bibite: ['bottle', '#e04b3c'], alcolici: ['bottle', '#e0a030'], birra: ['bottle', '#7a5a1a'], vino: ['bottle', '#5a1424'], olio: ['bottle', '#a7b03a'], olio_motore: ['jug', '#e0a030'],
  uova: ['eggs'], salumi: ['salami'], formaggi: ['cheese'], mozzarella: ['mozza'], passata: ['jar', '#c8302a'], carne: ['steak'], pesce: ['fish'],
  verdure: ['veg'], luppolo: ['veg2'], frutta: ['fruit'], pasta: ['pasta'], confezionati: ['box', '#3c88cf'], imballaggi: ['box', '#c8a06a'], ricambi: ['box', '#c8434f'], integratori: ['box', '#7a5aa6'],
  detersivi: ['jug', '#3cb6c8'], solventi: ['jug', '#8a8f99'], prodotti_capelli: ['tube', '#e98bb0'],
  maglieria: ['tshirt', '#3c88cf'], pantaloni: ['jeans'], capispalla: ['jacket', '#8a5a2c'], accessori: ['handbag', '#c8434f'], tessuto: ['roll', '#7a5aa6'],
  pneumatici: ['tyre'], biancheria: ['towels'],
};
function matDraw(k, c) {
  switch (k) {
    case 'sack': return shadow(32, 18) + `<path d="M16 20 Q14 14 20 12 L44 12 Q50 14 48 20 L51 50 Q50 55 44 55 L20 55 Q14 55 13 50 Z" fill="${U('bag')}" ${SK}/><path d="M18 12 Q24 6 32 10 Q40 6 46 12 Q40 14 32 13 Q24 14 18 12 Z" fill="${U('bag')}" ${SK}/><path d="M20 15 Q32 18 44 15" stroke="#7a5a2a" stroke-width="1.4" fill="none"/>` +
      `<ellipse cx="32" cy="12" rx="10" ry="2.4" fill="${c}" ${SK}/>${c === '#6b3d1a' || c === '#7f9a4a' ? [[28, 11.5], [33, 12], [37, 11.4], [30, 12.6]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="1" fill="${c}" stroke="#000" stroke-opacity=".35" stroke-width=".5"/>`).join('') : ''}` +
      `<rect x="21" y="28" width="22" height="14" rx="1.5" fill="#fff" fill-opacity=".85" ${SK}/><path d="M24 33 L40 33 M24 37 L35 37" stroke="${c === '#ffffff' || c === '#f4ecdc' ? '#a5834a' : c}" stroke-width="1.6"/><path d="M17 22 Q16 38 18 52" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none"/>`;
    case 'block': return shadow(32, 20) + `<path d="M12 30 L40 22 L54 28 L26 37 Z" fill="${c}" ${SK}/><path d="M12 30 L26 37 L26 50 L12 43 Z" fill="${c}" ${SK}/><path d="M12 30 L26 37 L26 50 L12 43 Z" fill="#000" opacity=".1"/><path d="M26 37 L54 28 L54 41 L26 50 Z" fill="${c}" ${SK}/><path d="M26 37 L54 28 L54 41 L26 50 Z" fill="#000" opacity=".2"/><path d="M30 41 L50 35" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M18 30 L40 24" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>`;
    case 'carton': return shadow(32, 15) + `<path d="M20 20 L44 20 L44 55 L20 55 Z" fill="${U('wht')}" ${SK}/><path d="M20 20 L26 10 L38 10 L44 20 Z" fill="#f0f2f4" ${SK}/><path d="M26 10 L32 20 L38 10" fill="none" ${SK}/><rect x="29" y="5" width="6" height="5" rx="1" fill="${c}" ${SK}/>` +
      `<rect x="20" y="30" width="24" height="15" fill="${c}"/><path d="M22 40 Q26 36 32 39 Q38 42 42 38" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M23 22 L23 52" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>`;
    case 'choco': return shadow(32, 22) + `<rect x="10" y="20" width="44" height="28" rx="2" fill="#4a2a12" ${SK}/>${[0, 1].map(r => [0, 1, 2, 3].map(q => `<rect x="${12.5 + q * 10.5}" y="${22.5 + r * 12.5}" width="9" height="11" rx="1" fill="#6b3d1a"/><path d="M${13 + q * 10.5} ${23 + r * 12.5} L${21 + q * 10.5} ${23 + r * 12.5}" stroke="#a06a3a" stroke-width=".9"/>`).join('')).join('')}<path d="M36 20 L54 20 L54 48 L46 48 Z" fill="#c8434f" ${SK}/><path d="M38 22 L52 22" stroke="#fff" stroke-opacity=".5"/>`;
    case 'croissant': return shadow(32, 22) + `<path d="M8 42 Q10 30 18 26 L22 40 Z" fill="#c97e3a" ${SK}/><path d="M56 42 Q54 30 46 26 L42 40 Z" fill="#c97e3a" ${SK}/><path d="M17 24 Q24 16 32 16 Q40 16 47 24 L42 44 Q32 48 22 44 Z" fill="#e2a24f" ${SK}/>` +
      `<path d="M25 20 L28 44 M32 16 L32 46 M39 20 L36 44" stroke="#9a5a22" stroke-width="1.1" fill="none"/><path d="M20 25 Q26 20 31 19" stroke="#fff3c9" stroke-width="1.8" fill="none" opacity=".8"/>`;
    case 'bread': return shadow(32, 25) + `<path d="M7 40 Q7 22 32 22 Q57 22 57 40 Q57 48 32 48 Q7 48 7 40 Z" fill="#c9843e" ${SK}/><path d="M7 40 Q7 22 32 22 Q57 22 57 40" fill="#dd9f55"/>${[18, 28, 38, 48].map(x => `<path d="M${x - 4} 32 Q${x} 26 ${x + 4} 30" stroke="#f6dcae" stroke-width="2.2" fill="none" stroke-linecap="round"/>`).join('')}<path d="M12 33 Q20 25 30 24.5" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" fill="none"/>`;
    case 'bottle': return shadow(32, 14) + `<path d="M28 6 L36 6 L36 14 Q36 20 41 24 Q43 26 43 30 L43 53 Q43 56 40 56 L24 56 Q21 56 21 53 L21 30 Q21 26 23 24 Q28 20 28 14 Z" fill="${c}" ${SK}/><rect x="27.5" y="4" width="9" height="5" rx="1" fill="${U('t0d')}"/>` +
      `<rect x="21" y="32" width="22" height="13" fill="${U('wht')}"/><path d="M25 37 L39 37 M25 40.5 L35 40.5" stroke="${c}" stroke-width="1.4"/><path d="M25 26 Q24 40 25 53" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" fill="none"/>`;
    case 'jug': return shadow(32, 18) + `<path d="M16 22 L16 52 Q16 56 20 56 L46 56 Q50 56 50 52 L50 24 L42 16 L28 16 Z" fill="${c}" ${SK}/><rect x="22" y="9" width="8" height="8" rx="1" fill="${U('blk')}"/><path d="M36 17 Q50 16 48 30" stroke="${c}" stroke-width="4" fill="none"/><path d="M36 17 Q50 16 48 30" stroke="#000" stroke-opacity=".25" stroke-width="4" fill="none"/>` +
      `<rect x="20" y="30" width="26" height="16" rx="1.5" fill="${U('wht')}"/><path d="M24 36 L42 36 M24 40 L36 40" stroke="${c}" stroke-width="1.4"/><path d="M19 24 L19 52" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
    case 'tube': return shadow(32, 16) + `<path d="M22 12 L42 12 L40 50 Q32 54 24 50 Z" fill="${c}" ${SK}/><rect x="24" y="50" width="16" height="6" rx="1.5" fill="${U('t0')}" ${SK}/><path d="M22 12 L42 12 L42 9 L22 9 Z" fill="${c}" ${SK}/><path d="M26 15 L27 47" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><circle cx="33" cy="30" r="4" fill="#fff" opacity=".8"/>` +
      `<rect x="44" y="20" width="10" height="34" rx="3" fill="${U('blu')}" ${SK}/><rect x="46.5" y="14" width="5" height="6" fill="${U('blk')}"/>`;
    case 'eggs': return shadow(32, 26) + `<path d="M6 38 L58 38 L54 50 L10 50 Z" fill="${U('card')}" ${SK}/>${[13, 23, 33, 43, 51].map((x, i) => `<ellipse cx="${x + (i === 4 ? -1 : 0)}" cy="32" rx="4.6" ry="6.2" fill="${i % 2 ? '#f6ead6' : '#e8c79a'}" ${SK}/><ellipse cx="${x - 1.4}" cy="29.5" rx="1.2" ry="2" fill="#fff" opacity=".7"/>`).join('')}<path d="M10 44 L54 44" stroke="#8a6a3a" stroke-opacity=".5"/>`;
    case 'salami': return shadow(32, 24) + `<path d="M10 40 Q8 26 20 22 L44 18 Q56 18 56 28 Q56 38 44 40 L22 44 Q12 46 10 40 Z" fill="#a3422e" ${SK}/><ellipse cx="50" cy="29" rx="6" ry="10" fill="#c4683f" ${SK}/>${[[48, 25], [52, 30], [49, 33], [51, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#f4d9cc"/>`).join('')}<path d="M18 26 L42 22" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>${[20, 28, 36].map(x => `<path d="M${x} 21 Q${x + 2} 32 ${x} 43" stroke="#f0e6d8" stroke-width=".9" fill="none"/>`).join('')}<path d="M10 40 Q4 42 6 46" stroke="#d8c8a8" stroke-width="1.2" fill="none"/>`;
    case 'cheese': return shadow(32, 24) + `<path d="M8 36 L48 18 L56 30 L56 46 L8 46 Z" fill="#f2c94c" ${SK}/><path d="M8 36 L48 18 L56 30 L16 36 Z" fill="#ffe08a"/><path d="M8 36 L56 30" ${SK}/>${[[22, 40, 2.6], [36, 42, 2], [46, 37, 2.8], [30, 31, 1.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9a62e"/>`).join('')}<path d="M56 30 L56 46" stroke="#c8902a" stroke-width="2"/>`;
    case 'mozza': return shadow(32, 22) + `<ellipse cx="32" cy="46" rx="22" ry="6" fill="${U('t0')}" ${SK}/><circle cx="26" cy="36" r="11" fill="#fbfbf7" ${SK}/><circle cx="40" cy="38" r="9" fill="#f6f6f0" ${SK}/><ellipse cx="22" cy="31" rx="3.6" ry="2.4" fill="#fff"/><ellipse cx="37" cy="34" rx="2.6" ry="1.8" fill="#fff"/><path d="M44 30 Q48 26 50 30" stroke="#6fa04a" stroke-width="2.4" fill="none"/>`;
    case 'jar': return shadow(32, 16) + `<rect x="18" y="16" width="28" height="40" rx="5" fill="${c}" ${SK}/><rect x="17" y="9" width="30" height="8" rx="1.5" fill="${U('t1')}" ${SK}/><rect x="18" y="28" width="28" height="15" fill="${U('wht')}"/><circle cx="32" cy="35.5" r="4.6" fill="${c}"/><path d="M32 31 L32 29 M30 30.5 L34 30.5" stroke="#4e9e3a" stroke-width="1.2"/><path d="M21 19 L21 53" stroke="#fff" stroke-opacity=".45" stroke-width="2.4"/>`;
    case 'steak': return shadow(32, 24) + `<path d="M10 34 Q8 20 24 18 Q36 16 46 22 Q58 28 54 40 Q50 50 32 48 Q12 48 10 34 Z" fill="#b8333a" ${SK}/><path d="M14 33 Q14 24 25 22 Q36 20 44 26 Q52 32 49 39 Q46 45 32 44 Q16 44 14 33 Z" fill="#d24a50"/><path d="M18 30 Q28 34 36 28 M24 38 Q34 40 44 34" stroke="#f3d2d0" stroke-width="1.4" fill="none"/><circle cx="40" cy="31" r="3.4" fill="#f3e6e0" ${SK}/>`;
    case 'fish': return shadow(32, 26) + `<path d="M8 33 Q22 18 42 26 L54 18 L52 33 L54 48 L42 40 Q22 48 8 33 Z" fill="${U('t1')}" ${SK}/><path d="M10 33 Q24 26 42 30" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" fill="none"/><circle cx="16" cy="31" r="2.2" fill="#fff" ${SK}/><circle cx="16.4" cy="31" r="1.1" fill="#111"/><path d="M24 26 Q27 33 24 40 M30 25 Q33 33 30 41" stroke="#3f5f82" stroke-width=".9" fill="none"/>`;
    case 'veg': return shadow(32, 24) + `<path d="M14 54 Q8 40 20 34 Q30 30 30 42 Q30 54 14 54 Z" fill="#c8302a" ${SK}/><path d="M18 34 L22 30 L24 34" stroke="#4e9e3a" stroke-width="1.6" fill="none"/><ellipse cx="16" cy="40" rx="2" ry="3" fill="#fff" opacity=".4"/>` +
      `<path d="M36 52 L44 22 L50 52 Q43 56 36 52 Z" fill="${U('org')}" ${SK}/><path d="M44 22 Q38 10 42 6 M44 22 Q46 10 52 8 M44 22 Q44 12 46 4" stroke="#4e9e3a" stroke-width="2" fill="none"/><path d="M40 34 L45 33 M38 42 L47 41" stroke="#b2520c" stroke-width=".8"/>` +
      `<circle cx="28" cy="22" r="8" fill="${U('grn')}" ${SK}/><circle cx="24" cy="20" r="4" fill="#8fd17a" opacity=".6"/>`;
    case 'veg2': return shadow(32, 22) + `${[[22, 26], [36, 22], [30, 38], [44, 36], [18, 42]].map(([x, y]) => `<path d="M${x} ${y - 8} Q${x + 6} ${y} ${x} ${y + 8} Q${x - 6} ${y} ${x} ${y - 8} Z" fill="${U('grn')}" ${SK}/>${[-4, 0, 4].map(o => `<path d="M${x - 4} ${y + o} Q${x} ${y + o - 2} ${x + 4} ${y + o}" stroke="#2f6b22" stroke-width=".6" fill="none"/>`).join('')}`).join('')}<path d="M24 10 Q34 6 46 12" stroke="#6b4a22" stroke-width="1.4" fill="none"/>`;
    case 'fruit': return shadow(32, 24) + `<circle cx="22" cy="38" r="12" fill="${U('red')}" ${SK}/><path d="M22 26 Q24 20 27 18" stroke="#6b3d1a" stroke-width="1.6" fill="none"/><path d="M24 24 Q32 20 34 26 Q28 28 24 24 Z" fill="${U('grn')}"/><ellipse cx="17" cy="33" rx="3" ry="4.4" fill="#fff" opacity=".4"/>` +
      `<circle cx="42" cy="40" r="11" fill="${U('org')}" ${SK}/><circle cx="42" cy="30" r="1" fill="#4e9e3a"/><ellipse cx="38" cy="36" rx="2.4" ry="3.4" fill="#fff" opacity=".35"/>`;
    case 'pasta': return shadow(32, 18) + `<rect x="16" y="12" width="32" height="42" rx="2" fill="${U('blu')}" ${SK}/><rect x="20" y="22" width="24" height="18" rx="9" fill="#f6efe0" ${SK}/>${[[25, 27], [31, 33], [37, 28], [28, 35], [35, 35]].map(([x, y]) => `<rect x="${x - 3}" y="${y - 1.4}" width="6" height="2.8" rx="1.2" fill="#e8b84a" transform="rotate(-30 ${x} ${y})" ${SK}/>`).join('')}<path d="M20 46 L44 46 M24 50 L40 50" stroke="#fff" stroke-width="1.4"/><path d="M19 14 L19 52" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`;
    case 'box': return shadow(32, 22) + `<path d="M10 24 L32 16 L54 24 L32 32 Z" fill="${U('card')}" ${SK}/><path d="M10 24 L32 32 L32 56 L10 48 Z" fill="${U('card')}" ${SK}/><path d="M32 32 L54 24 L54 48 L32 56 Z" fill="${U('card')}" ${SK}/><path d="M32 32 L54 24 L54 48 L32 56 Z" fill="#000" opacity=".15"/>` +
      `<path d="M21 20 L43 28 L43 36" stroke="#e8d0a0" stroke-width="3" fill="none"/><rect x="14" y="36" width="12" height="8" rx="1" fill="${c}" transform="skewY(20) translate(0 -5)"/>`;
    case 'tshirt': return shadow(32, 22) + `<path d="M20 10 L26 8 Q32 13 38 8 L44 10 L56 20 L50 28 L46 25 L46 54 L18 54 L18 25 L14 28 L8 20 Z" fill="${c}" ${SK}/><path d="M20 10 L26 8 Q32 13 38 8 L44 10 L56 20 L50 28 L46 25 L46 54 L18 54 L18 25 L14 28 L8 20 Z" fill="${U('cloth')}"/><path d="M26 8 Q32 14 38 8" stroke="#000" stroke-opacity=".3" stroke-width="1.2" fill="none"/><path d="M24 30 Q32 33 40 30" stroke="#000" stroke-opacity=".12" stroke-width="2" fill="none"/>`;
    case 'jeans': return shadow(32, 20) + `<path d="M17 8 L47 8 L50 56 L37 56 L32 22 L27 56 L14 56 Z" fill="${U('blu')}" ${SK}/><rect x="17" y="8" width="30" height="5" fill="#2a5a90"/><path d="M32 13 L32 22" stroke="#e0a030" stroke-width=".9"/><path d="M20 13 Q22 19 28 18 M44 13 Q42 19 36 18" stroke="#e0a030" stroke-width=".8" fill="none"/><path d="M19 22 L17 54 M45 22 L47 54" stroke="#fff" stroke-opacity=".35" stroke-width="1.6"/>`;
    case 'jacket': return shadow(32, 24) + `<path d="M22 8 L32 14 L42 8 L52 14 L58 50 L48 52 L46 30 L46 56 L18 56 L18 30 L16 52 L6 50 L12 14 Z" fill="${c}" ${SK}/><path d="M22 8 L32 14 L42 8 L52 14 L58 50 L48 52 L46 30 L46 56 L18 56 L18 30 L16 52 L6 50 L12 14 Z" fill="${U('cloth')}"/><path d="M32 14 L32 56" stroke="#000" stroke-opacity=".35" stroke-width="1"/><path d="M22 8 L28 24 L32 14 M42 8 L36 24 L32 14" fill="#5a3a1a" ${SK}/>${[30, 38, 46].map(y => `<circle cx="34.5" cy="${y}" r="1.2" fill="#e0c080"/>`).join('')}`;
    case 'handbag': return shadow(32, 22) + `<path d="M22 24 Q22 10 32 10 Q42 10 42 24" stroke="#8a6020" stroke-width="3" fill="none"/><path d="M10 24 L54 24 L50 54 L14 54 Z" fill="${c}" ${SK}/><path d="M10 24 L54 24 L50 54 L14 54 Z" fill="${U('cloth')}"/><path d="M12 32 L52 32" stroke="#000" stroke-opacity=".25"/><rect x="28" y="29" width="8" height="6" rx="1" fill="${U('t2')}" ${SK}/>`;
    case 'roll': return shadow(32, 26) + `<path d="M10 22 L46 22 L46 48 L10 48 Z" fill="${c}"/><path d="M10 22 L46 22 L46 48 L10 48 Z" fill="${U('cloth')}"/><ellipse cx="46" cy="35" rx="6" ry="13" fill="${c}" ${SK}/><ellipse cx="46" cy="35" rx="2.4" ry="5" fill="${U('card')}"/><ellipse cx="10" cy="35" rx="6" ry="13" fill="${c}" ${SK}/><path d="M46 48 Q52 54 58 52 L58 46" fill="${c}" ${SK}/>${[28, 34, 40].map(y => `<path d="M12 ${y - 6} L44 ${y - 6}" stroke="#fff" stroke-opacity=".25" stroke-width="1"/>`).join('')}`;
    case 'tyre': return shadow(32, 22) + `<ellipse cx="32" cy="34" rx="20" ry="20" fill="${U('blk')}" ${SK}/>${[...Array(16)].map((_, i) => `<rect x="31" y="14" width="2" height="4" fill="#0f1013" transform="rotate(${i * 22.5} 32 34)"/>`).join('')}<circle cx="32" cy="34" r="11" fill="${U('t0')}" ${SK}/><circle cx="32" cy="34" r="4" fill="${U('t0d')}"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="${32 + 7 * Math.cos(a * Math.PI / 180)}" cy="${34 + 7 * Math.sin(a * Math.PI / 180)}" r="1.1" fill="#555"/>`).join('')}<path d="M18 26 Q22 18 30 15" stroke="#fff" stroke-opacity=".3" stroke-width="2" fill="none"/>`;
    case 'towels': return shadow(32, 22) + `${[0, 1, 2].map(i => `<rect x="12" y="${40 - i * 11}" width="40" height="11" rx="4" fill="${['#f6f6f2', '#9cc9e3', '#f6f6f2'][i]}" ${SK}/><path d="M14 ${44 - i * 11} L50 ${44 - i * 11}" stroke="#000" stroke-opacity=".1"/>`).join('')}<rect x="22" y="12" width="20" height="7" rx="3" fill="${U('ylw')}" ${SK}/><circle cx="44" cy="14" r="3.4" fill="${U('wht')}" ${SK}/>`;
    default: return matDraw('box', c || '#999');
  }
}
/** immagine di un materiale; st = 'ok' | 'low' | 'out' */
function material(id, size = 40, st = 'ok') {
  const [k, c] = MAT_SHAPE[id] || ['box', '#999'];
  const ring = st === 'ok' ? 'var(--green)' : st === 'out' || st === 'low' ? 'var(--red)' : 'var(--line2)';
  let s = matDraw(k, c);
  if (st === 'out') s = `<g opacity=".35" style="filter:grayscale(1)">${s}</g>`;
  return `<svg class="mat" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${esc((MATERIALS[id] || {}).name || id)}"><rect x="1" y="1" width="62" height="62" rx="13" fill="var(--panel2)"/><rect x="1" y="1" width="62" height="40" rx="13" fill="${U('bg')}" opacity=".5"/>${s}<rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="${ring}" stroke-width="2.2"/></svg>`;
}

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
