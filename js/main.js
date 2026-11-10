'use strict';
/* ============================================================
   EMPIRE - avvio e gestione degli input
   ============================================================ */

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  // lo sfondo delle finestre chiude solo se toccato direttamente
  if (el.dataset.a === 'bgClose') { if (ev.target === el) ACT.bgClose(el.dataset, el, ev); return; }
  const fn = ACT[el.dataset.a];
  if (!fn) return;
  ev.preventDefault();
  try { fn(el.dataset, el, ev); }
  catch (e) { console.error(e); toast('Errore: ' + e.message, 'err'); }
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-c]');
  if (!el || !el.dataset.c) return;
  const fn = CHG[el.dataset.c];
  if (!fn) return;
  try { fn(el.value, el.dataset, el); }
  catch (e) { console.error(e); toast('Errore: ' + e.message, 'err'); }
});
document.addEventListener('keydown', (ev) => {
  const tag = (ev.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') {
    if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.c) ev.target.blur();
    return;
  }
  if (ev.key === 'Escape' && UI.modal) { closeModal(); return; }
  if (!S || S.over || UI.modal || S.events.length) return;
  const t = tutorialState();
  if ((ev.key === 'n' || ev.key === 'N') && (!t || t.adv)) ACT.adv({ n: 1 });
});
window.addEventListener('beforeunload', () => { if (S && !S.over) saveGame(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S && !S.over) saveGame(); });
if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());

render();

// app installabile e giocabile offline (solo su sito https)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  try { navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
}
