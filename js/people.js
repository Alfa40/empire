'use strict';
/* ============================================================
   EMPIRE - persone: regole di lavoro italiane (semplificate),
   benessere, malattia, carriera e clima di squadra
   ============================================================ */

const LAW = { maxWeek: 48, contractWeek: 40, sickEmployerDays: 3, inpsShare: 0.5, promoSkill: 65 };

function workDays(e) { return e.wdays.filter(Boolean).length; }
/** violazioni delle regole sull'orario: [] se tutto in regola */
function lawIssues(e) {
  const out = [];
  if (e.biz !== 'hq' && workDays(e) >= 7) out.push('nessun giorno di riposo');
  if (weeklyHours(e) > LAW.maxWeek) out.push('oltre ' + LAW.maxWeek + ' ore a settimana');
  return out;
}
/** clima di squadra 0-100: morale medio, stanchezza, responsabile presente */
function bizClimate(b) {
  const E = empsOf(b.id); if (!E.length) return null;
  let c = avg(E, e => e.morale) - Math.max(0, avg(E, e => e.fatigue) - 50) * 0.3;
  if (E.some(e => e.role === 'manager')) c += 4;
  if (E.some(e => e.traits.includes('leader'))) c += 3;
  if (E.some(e => lawIssues(e).length)) c -= 5;
  return clamp(Math.round(c), 0, 100);
}
function climateWord(c) { return c >= 70 ? 'ottimo' : c >= 55 ? 'buono' : c >= 40 ? 'teso' : 'pessimo'; }

/** effetti giornalieri su una persona (chiamato dopo il resto della giornata) */
function peopleDay(e) {
  // malattia: i primi 3 giorni li paga l'impresa, dal 4° l'INPS copre metà della paga
  if (e.sickUntil > S.day) { e.sickDays = (e.sickDays || 0) + 1; if (e.sickDays > LAW.sickEmployerDays) e.monthExtra = (e.monthExtra || 0) - e.wage / 26 * LAW.inpsShare; }
  else e.sickDays = 0;
  // esaurimento: troppo stanco per troppi giorni di fila
  if (e.fatigue >= 92) e.burn = (e.burn || 0) + 1; else e.burn = 0;
  if (e.burn >= 4 && e.sickUntil <= S.day && e.holidayUntil <= S.day) {
    const d = rint(5, 10); e.sickUntil = S.day + d; e.burn = 0;
    log(`${empName(e)} è in malattia per esaurimento (${d} giorni): era troppo stanco da giorni.`, 'bad', e.biz === 'hq' ? null : e.biz);
  }
}
/** quanto pesano clima, riposo e carriera sul morale (si somma all'obiettivo di morale) */
function peopleMoraleAdj(e, b) {
  let t = 0;
  if (b) { const c = bizClimate(b); if (c != null) t += (c - 60) * 0.12; }
  if (lawIssues(e).length) t -= 6;
  const yrs = (S.day - (e.lastRaise || e.hired)) / 365;
  if (yrs > 1) t -= Math.min(8, (yrs - 1) * 4 + 2) * (e.traits.includes('ambizioso') ? 1.5 : 1);
  return t;
}
/** inizio mese: possibile controllo dell'Ispettorato del lavoro */
function labourInspection() {
  const bad = Object.values(S.emps).filter(e => lawIssues(e).length);
  if (!bad.length || !chance(Math.min(0.35, 0.05 * bad.length))) return;
  let tot = 0;
  for (const e of bad) { const f = Math.round(rint(800, 1600) * S.eco.priceLevel); tot += f; cashMove(-f, 'imposte_varie', e.biz === 'hq' ? null : e.biz, 'Sanzione Ispettorato del lavoro · ' + e.first + ' ' + e.last); }
  log(`Controllo dell'Ispettorato del lavoro: orari fuori legge per ${plural(bad.length, 'dipendente', 'dipendenti')}. Multa di ${eur(tot)}.`, 'bad');
}

// ---------- carriera ----------
function canPromote(e) {
  if (e.biz === 'hq' || e.role === 'manager' || e.role === 'areamanager') return { ok: false, why: '' };
  const b = getBiz(e.biz);
  if (!b || !bizType(b).roles.includes('manager')) return { ok: false, why: '' };
  if (e.skill < LAW.promoSkill) return { ok: false, why: `Per diventare responsabile serve competenza ${LAW.promoSkill} (ora ${Math.round(e.skill)}).` };
  if (empsOf(b.id).some(x => x.role === 'manager')) return { ok: false, why: 'C\'è già un responsabile in questa attività.' };
  return { ok: true, wage: Math.max(Math.round(e.wage * 1.15 / 10) * 10, marketWage('manager', e.city, e.skill)) };
}
ACT.empPromote = (d) => {
  const e = S.emps[d.e]; if (!e) return;
  const p = canPromote(e); if (!p.ok) { toast(p.why || 'Non disponibile', 'err'); return; }
  const old = ROLES[e.role].name;
  e.role = 'manager'; e.wage = p.wage; e.lastRaise = S.day; e.morale = clamp(e.morale + 15, 0, 100);
  log(`${empName(e)} promosso da ${old} a Responsabile (${eur0(p.wage)}).`, 'good', e.biz);
  commit('Promosso');
};

// ---------- schede ----------
/** benessere di una persona: le regole spiegate sui suoi numeri */
function wellbeingBox(e) {
  const wd = workDays(e), wh = weeklyHours(e);
  const row = (l, v, bad, k) => `<div class="kvl"><span>${l}${k ? ' ' + hb(k) : ''}</span><b class="${bad ? 'neg' : ''}">${v}</b></div>`;
  const sick = e.sickUntil > S.day;
  return `<h4>Benessere</h4>`
    + row('Giorni di lavoro', `${wd}/7${wd >= 7 ? ' · serve 1 giorno di riposo' : ''}`, wd >= 7 && e.biz !== 'hq', 'riposo')
    + row('Ore a settimana', `${wh} h${wh > LAW.maxWeek ? ' · oltre il limite di legge (48)' : wh > LAW.contractWeek ? ' · straordinari +25%' : ''}`, wh > LAW.maxWeek, 'riposo')
    + row('Giorni di fila', String(e.consec || 0), (e.consec || 0) > 6)
    + (sick ? row('Malattia', `fino al ${fmtDateShort(e.sickUntil).slice(0, 5)} · ${(e.sickDays || 0) > LAW.sickEmployerDays ? 'paga l\'INPS metà' : 'paghi tu (primi 3 giorni)'}`, true, 'malattia') : '')
    + row('Ferie da fare', Math.floor(e.holidays) + ' giorni' + (e.holidays > 30 ? ' · mandalo in ferie' : ''), e.holidays > 30);
}
function careerBox(e) {
  const p = canPromote(e), yrs = (S.day - e.hired) / 365, lr = Math.round((S.day - (e.lastRaise || e.hired)) / 30.4);
  return `<h4>Carriera ${hb('carriera')}</h4><div class="kvl"><span>In azienda da</span><b>${yrs >= 1 ? num1(yrs) + ' anni' : Math.max(0, Math.round(yrs * 12)) + ' mesi'}</b></div>
    <div class="kvl"><span>Ultimo aumento</span><b class="${lr > 12 ? 'neg' : ''}">${lr ? lr + ' mesi fa' : 'questo mese'}</b></div>
    ${p.ok ? btn(`⬆️ Promuovi a Responsabile · ${eur0(p.wage)}`, 'empPromote', { e: e.id }, 'ok') : p.why ? `<small class="muted">${esc(p.why)}</small>` : ''}`;
}
/** clima di squadra in cima al personale di un'attività */
function climateBox(b) {
  const c = bizClimate(b); if (c == null) return '';
  const E = empsOf(b.id);
  const tired = E.filter(e => e.fatigue > 70).length, law = E.filter(e => lawIssues(e).length).length, sad = E.filter(e => e.morale < 40).length;
  const why = [];
  if (tired) why.push(plural(tired, 'persona stanca', 'persone stanche'));
  if (sad) why.push(plural(sad, 'persona scontenta', 'persone scontente'));
  if (law) why.push(plural(law, 'orario fuori legge', 'orari fuori legge'));
  if (!E.some(e => e.role === 'manager')) why.push('nessun responsabile');
  return `<div class="climate ${c < 40 ? 'bad' : ''}"><div class="row between"><b>🤝 Clima di squadra ${hb('clima')}</b><b>${c}/100 · ${climateWord(c)}</b></div>${bar(c, 100, c >= 55 ? 'g' : c >= 40 ? 'y' : 'r')}${why.length ? `<small>${why.join(', ')}</small>` : ''}</div>`;
}
