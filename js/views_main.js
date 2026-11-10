'use strict';
/* ============================================================
   EMPIRE - schermate: avvio, home, attività, apertura
   ============================================================ */
const VIEWS = {};

// ===================== AVVIO =====================
function viewStart() {
  const meta = getMeta();
  let body = '';
  if (UI.start.mode === 'new') body = startNewForm(meta);
  else {
    const last = meta.lastSlot && slotInfo(meta.lastSlot);
    body = `<div class="panel"><div class="row" style="justify-content:center">
        ${last && !last.corrupt ? btn(`▶ Continua · ${esc(last.company)}`, 'loadSlot', { s: meta.lastSlot }, 'pri big') : ''}
        ${btn('+ Nuova partita', 'startMode', { m: 'new' }, last ? 'big' : 'pri big')}</div></div>
      ${sec('Partite salvate', 'salvataggi', savesPanel(false))}`;
  }
  return `<div class="start"><div class="title"><h1>EMPIRE</h1><p class="muted">Costruisci il tuo impero, un giorno alla volta.</p></div>${body}<div class="row" style="justify-content:center">${themeButtons()}</div><div class="row" style="justify-content:center">${topPadPicker()}</div></div>`;
}
function topPadPicker() {
  const v = getMeta().topPad || 0;
  return `<div class="row mt"><small class="muted">Spazio in alto</small><span class="seg">${[0, 16, 28, 40, 52].map(x => btn(x ? '+' + x : 'Auto', 'setTopPad', { v: x }, 'sm ' + (v === x ? 'on' : ''))).join('')}</span></div>`;
}
ACT.setTopPad = (d) => { setMeta({ topPad: +d.v }); render(); };
function themeButtons() {
  const m = getMeta();
  return `<span class="seg">${[['auto', 'Auto'], ['light', 'Chiaro'], ['dark', 'Scuro']].map(([k, l]) => btn(l, 'setTheme', { t: k }, 'sm ' + (m.theme === k ? 'on' : ''))).join('')}</span>
    <span class="seg">${btn('A−', 'setFont', { d: -1 }, 'sm')}${btn('A+', 'setFont', { d: 1 }, 'sm')}</span>`;
}
function savesPanel(inGame) {
  const rows = [];
  for (let s = 1; s <= SLOTS; s++) {
    const i = slotInfo(s);
    const cur = S && S.meta.slot === s;
    rows.push(`<div class="slot"><div><b>Slot ${s}</b> ${cur ? badge('in uso', 'b') : ''}<br><small>${i ? (i.corrupt ? 'Danneggiato' : `${esc(i.company)} · ${fmtDateShort(i.day)} · ${eur0(i.nw)}${i.over ? ' · fallita' : ''}`) : 'Vuoto'}</small></div>
      <div class="row">${i && !i.corrupt ? btn('Carica', 'loadSlot', { s }, 'sm') : ''}${inGame && S && !S.over ? btn('Salva', 'saveSlot', { s }, 'sm') : ''}${i ? btn('⇩ Esporta', 'exportSlot', { s }, 'sm') : ''}${btn('⇧ Importa', 'importSlot', { s }, 'sm')}${i ? btn('✕', 'delSlot', { s }, 'sm danger', false, 'Elimina') : ''}</div></div>`);
  }
  return rows.join('') + '<input type="file" id="importFile" accept=".json,application/json" hidden>';
}
function startNewForm(meta) {
  const forced = !meta.tutorialDone;
  let freeSlot = 1; for (let s = 1; s <= SLOTS; s++) if (!slotInfo(s)) { freeSlot = s; break; }
  const d = UI.start.diff || 'normale', lg = UI.start.legal || 'ditta';
  return `<div class="panel"><div class="ph"><h2>Nuova partita</h2></div>
    <div class="grid g2">
      <label class="field"><span>Il tuo nome</span><input id="ng_player" value="${esc(UI.start.player || '')}" placeholder="Mario Rossi" maxlength="40"></label>
      <label class="field"><span>Impresa</span><input id="ng_company" value="${esc(UI.start.company || '')}" placeholder="Rossi Group" maxlength="40"></label>
    </div>
    <h4>Difficoltà</h4>
    <div class="cards">${Object.entries(DIFFICULTY).map(([k, v]) => `<button class="card ${d === k ? 'on' : ''}" data-a="ngDiff" data-v="${k}"><h4>${v.name}</h4><div class="kv">Capitale <b>${eur0(v.cash)}</b></div></button>`).join('')}</div>
    <h4>Forma giuridica ${hb('forma')}</h4>
    <div class="cards">${['forfettario', 'ditta', 'srl'].map(k => `<button class="card ${lg === k ? 'on' : ''}" data-a="ngLegal" data-v="${k}"><h4>${LEGAL_FORMS[k].name}</h4>${LEGAL_FORMS[k].setup ? `<div class="kv">Costo <b>${eur0(LEGAL_FORMS[k].setup)}</b></div>` : ''}</button>`).join('')}</div>
    <div class="grid g2 mt">
      <label class="field"><span>Slot</span><select id="ng_slot">${Array.from({ length: SLOTS }, (_, i) => { const s = i + 1; const inf = slotInfo(s); return `<option value="${s}"${s === freeSlot ? ' selected' : ''}>Slot ${s}${inf ? ' · sovrascrive ' + esc(inf.company || '') : ''}</option>`; }).join('')}</select></label>
      <label class="field"><span>Tutorial</span><label class="row"><input type="checkbox" id="ng_tut" ${forced || UI.start.tut !== false ? 'checked' : ''} ${forced ? 'disabled' : ''}> ${forced ? 'Obbligatorio' : 'Mostra'}</label></label>
    </div>
    <div class="row" style="justify-content:flex-end">${btn('Indietro', 'startMode', { m: 'menu' })}${btn('Inizia ▶', 'startNew', {}, 'pri big')}</div></div>`;
}
function readStartForm() {
  const p = $('#ng_player'), c = $('#ng_company'), t = $('#ng_tut');
  if (p) UI.start.player = p.value; if (c) UI.start.company = c.value; if (t && !t.disabled) UI.start.tut = t.checked;
}
ACT.startMode = (d) => { UI.start.mode = d.m; render(); };
ACT.ngDiff = (d) => { readStartForm(); UI.start.diff = d.v; render(); };
ACT.ngLegal = (d) => { readStartForm(); UI.start.legal = d.v; render(); };
ACT.startNew = () => {
  readStartForm();
  const meta = getMeta();
  const slot = +$('#ng_slot').value;
  const tut = !meta.tutorialDone || UI.start.tut !== false;
  newGame({ player: (UI.start.player || '').trim() || 'Imprenditore', company: (UI.start.company || '').trim() || 'La mia impresa', difficulty: UI.start.diff || 'normale', legal: UI.start.legal || 'ditta', slot, tutorial: tut });
  saveGame(slot);
  UI.view = 'dash'; UI.modal = null; UI.start.mode = 'menu';
  render();
};
ACT.loadSlot = (d) => { if (loadGame(+d.s)) { UI.view = 'dash'; UI.modal = null; UI.biz = null; render(); toast('Partita caricata', 'ok'); } else toast('Impossibile caricare', 'err'); };
ACT.saveSlot = (d) => { if (saveGame(+d.s)) { toast(`Salvato nello slot ${d.s}`, 'ok'); render(); } else toast('Spazio esaurito', 'err'); };
ACT.delSlot = (d) => confirmBox('Eliminare?', `Slot ${d.s}`, 'delSlotOk', { s: d.s }, 'Elimina', true);
ACT.delSlotOk = (d) => { deleteSlot(+d.s); UI.modal = S ? { kind: 'saves' } : null; render(); };
ACT.exportSlot = (d) => {
  const raw = storageGet(SAVE_PREFIX + d.s); if (!raw) return;
  const inf = slotInfo(+d.s);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  a.download = `empire-${(inf && inf.company ? inf.company : 'partita').replace(/[^a-z0-9]+/gi, '_')}-${fmtDateShort(inf ? inf.day : 0).replace(/\//g, '-')}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};
ACT.importSlot = (d) => {
  const inp = $('#importFile'); if (!inp) return;
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { try { importSave(rd.result, +d.s); UI.view = 'dash'; UI.modal = null; render(); toast('Importata', 'ok'); } catch (e) { toast('File non valido', 'err'); } };
    rd.readAsText(f);
  };
  inp.click();
};
ACT.setTheme = (d) => { setMeta({ theme: d.t }); render(); };
ACT.setFont = (d) => { const m = getMeta(); setMeta({ font: clamp((m.font || 16) + +d.d, 13, 22) }); render(); };
ACT.quitMenu = () => { if (S && !S.over) saveGame(); S = null; UI.modal = null; UI.start.mode = 'menu'; render(); };

// ===================== HOME =====================
VIEWS.dash = () => {
  let h = '';
  h += bizTiles();
  const dl = deadlines(30).filter(x => x.v);
  if (dl.length) h += sec('Scadenze', 'scadenze', table(['Data', 'Voce', ['€', 'n']], dl.slice(0, 6).map(x => tr([fmtDateShort(x.d).slice(0, 5), esc(x.t), [eur0(x.v), 'n']]))), '', { closed: true, sum: `${fmtDateShort(dl[0].d).slice(0, 5)} · ${esc(dl[0].t)}` });
  return h;
};
function advSum(red, yel) { return (red ? `<span class="badge r">${red}</span> ` : '') + (yel ? `<span class="badge y">${yel}</span>` : '') || '<span class="pos">✓</span>'; }
/** riquadri colorati delle attività */
function bizTiles(withNew = true) {
  const tiles = S.biz.map(b => {
    const T = bizType(b);
    const r30 = recentDaily(30, b.id);
    const st = b.status === 'setup' ? 'bad' : bizStatus(b);
    return `<button class="tile big st-${st}" data-a="bizSheet" data-id="${b.id}"><span class="ic">${T.icon}</span><b>${esc(b.name)}</b><span class="m">${b.status === 'setup' ? 'da completare' : `<span class="${cls(r30.profit)}">${eur0(r30.profit)}</span> · 30 gg`}</span></button>`;
  });
  if (withNew) tiles.push(`<button class="tile big st-new" data-a="openWizard"${tutorialHl('openWizard') ? ' style="outline:3px dashed var(--yellow)"' : ''}><span class="ic">${S.biz.length ? '➕' : '🚀'}</span><b>${S.biz.length ? 'Nuova' : 'Apri la prima attività'}</b><span class="m">attività</span></button>`);
  return `<div class="tiles">${tiles.join('')}</div>`;
}
function logList(items) {
  if (!items.length) return '<p class="muted">—</p>';
  return `<ul class="list-log">${items.map(l => `<li class="${l.type}"><span class="d">${fmtDateShort(l.day).slice(0, 5)}</span><span class="t">${esc(l.text)}</span></li>`).join('')}</ul>`;
}

// ---------- menu rapido di un'attività ----------
ACT.bizSheet = (d) => openModal('bizSheet', { id: d.id });
MODALS.bizSheet = (m) => {
  const b = getBiz(m.id); if (!b) return '';
  const adv = adviseBiz(b);
  void adv;
  return sheet(`${bizType(b).icon} ${esc(b.name)}`, `<p class="summary">${bizSummary(b)}</p>${bizHubTiles(b, true)}`, '');
};

// ===================== ELENCO ATTIVITÀ =====================
VIEWS.bizlist = () => {
  const by = {};
  for (const b of S.biz) { const k = bizType(b).sector; (by[k] = by[k] || []).push(b); }
  void by;
  return `<div class="head"><h1>Attività</h1></div>${bizTiles()}`;
};

// ===================== APERTURA =====================
ACT.openWizard = () => { UI.wiz = { step: 1, type: null, city: S.biz[0] ? S.biz[0].city : 'milano', district: 'semicentro', listing: null, prop: null, name: '', brand: '' }; openModal('wizard'); };
ACT.wizType = (d) => { UI.wiz.type = d.v; UI.wiz.step = 2; if (!districtAllowed(d.v, UI.wiz.district)) UI.wiz.district = 'periferia'; render(); };
ACT.wizStep = (d) => { UI.wiz.step = +d.s; render(); };
ACT.wizCity = (d) => { UI.wiz.city = d.v; UI.wiz.listing = null; UI.wiz.prop = null; render(); };
ACT.wizDistrict = (d) => { UI.wiz.district = d.v; UI.wiz.listing = null; UI.wiz.prop = null; UI.wiz.step = 3; render(); };
function wizDefaultName() { return BUSINESS_TYPES[UI.wiz.type].name.split(' / ')[0] + ' ' + S.meta.company.split(' ')[0]; }
ACT.wizListing = (d) => { UI.wiz.listing = d.v; UI.wiz.prop = null; UI.wiz.step = 4; if (!UI.wiz.name) UI.wiz.name = wizDefaultName(); render(); };
ACT.wizProp = (d) => { UI.wiz.prop = d.v; UI.wiz.listing = null; UI.wiz.step = 4; if (!UI.wiz.name) UI.wiz.name = wizDefaultName(); render(); };
CHG.wizName = (v) => { UI.wiz.name = v; };
CHG.wizBrand = (v) => { UI.wiz.brand = v; };
ACT.wizConfirm = () => {
  const w = UI.wiz;
  const nameEl = $('#wiz_name'); if (nameEl) w.name = nameEl.value.trim();
  const L = w.listing ? rentListings(w.city, w.district, w.type).find(x => x.id === w.listing) : null;
  const r = openBusiness({ type: w.type, city: w.city, district: w.district, listing: L, propId: w.prop, name: w.name || BUSINESS_TYPES[w.type].name, brand: w.brand || null });
  if (r.err) { toast(r.err, 'err'); return; }
  UI.modal = null; UI.view = 'biz'; UI.biz = r.b.id; UI.tab = 'attrezzature';
  tutorialEvent('opened');
  commit(`${r.b.name} aperta`);
};
MODALS.wizard = () => {
  const w = UI.wiz, tut = tutorialState();
  const steps = ['Tipo', 'Zona', 'Locale', 'Conferma'];
  const stepper = `<div class="tabs">${steps.map((s, i) => `<button data-a="wizStep" data-s="${i + 1}" class="${w.step === i + 1 ? 'on' : ''}"${(i > 0 && !w.type) || (i > 2 && !w.listing && !w.prop) ? ' disabled' : ''}>${i + 1}. ${s}</button>`).join('')}</div>`;
  let body = '', help = 'tipo';
  if (w.step === 1) {
    const sectors = {};
    for (const T of Object.values(BUSINESS_TYPES)) (sectors[T.sector] = sectors[T.sector] || []).push(T);
    body = Object.entries(sectors).map(([sname, list]) => `<h4>${sname}</h4><div class="cards">${list.map(T => {
      const eqc = sum(T.equip.filter(e => e.req), e => e.cost) * S.eco.priceLevel * 1.22;
      return `<button class="card ${w.type === T.id ? 'on' : ''}" data-a="wizType" data-v="${T.id}"${tut && !T.tutorial ? ' disabled' : ''}><span class="cico">${T.icon}</span><h4>${esc(T.name)}</h4><div class="kv">Avvio ≈ <b>${eur0(T.license + eqc)}</b></div><div class="kv">Superficie <b>${num(T.size)} m²</b></div></button>`;
    }).join('')}</div>`).join('');
  } else if (w.step === 2) {
    help = 'quartiere';
    const T = BUSINESS_TYPES[w.type], c = CITY[w.city];
    body = `<div class="seg mb">${CITIES.map(x => btn(esc(x.name), 'wizCity', { v: x.id }, 'sm ' + (w.city === x.id ? 'on' : ''))).join('')}</div>
      <div class="row mb"><small>Grandezza <b>${num2(c.size)}</b> · Costi <b>${num2(c.cost)}</b> · Ricchezza <b>${num2(c.wealth)}</b> · ${c.tourism === 'mare' ? 'Mare' : c.tourism === 'arte' ? 'Città d\'arte' : 'Poco turismo'}</small>${hb('citta')}</div>
      <div class="cards">${DISTRICTS.map(d => {
        const ok = districtAllowed(w.type, d.id);
        const comps = T.mode === 'shop' ? compsIn(w.city, d.id, w.type).length : null;
        const rentM2 = c.rentM2 * d.rent * S.market.index[w.city] * (T.rentFactor || (T.mode === 'production' ? 0.55 : 1));
        return `<button class="card ${w.district === d.id ? 'on' : ''}" data-a="wizDistrict" data-v="${d.id}"${ok ? '' : ' disabled'}><h4>${esc(d.name)}</h4>
          ${T.mode === 'shop' ? `<div class="kv">Passaggio <b>${bar(d.foot, 1.5)}</b></div><div class="kv">Concorrenti <b>${comps}</b></div>` : ''}
          <div class="kv">Affitto <b>${eur2(rentM2)}/m²</b></div></button>`;
      }).join('')}</div>`;
  } else if (w.step === 3) {
    help = 'locale';
    const list = rentListings(w.city, w.district, w.type);
    const T = BUSINESS_TYPES[w.type];
    body = `<div class="cards">${list.map(L => `<button class="card ${w.listing === L.id ? 'on' : ''}" data-a="wizListing" data-v="${L.id}"><h4>${num(L.m2)} m² ${L.condition === 'da ristrutturare' ? badge('da sistemare', 'y') : L.condition === 'ottimo' ? badge('ottimo', 'g') : ''}</h4><div class="kv">Affitto <b>${eur0(L.rent)}/mese</b></div><div class="kv">Apertura <b>${eur0(openingCost(w.type, L, false).total)}</b></div></button>`).join('')}</div>`;
    const own = S.props.filter(p => p.city === w.city && !p.biz && p.district === w.district && (T.mode === 'production' ? p.kind === 'industriale' || w.type === 'agricola' : p.kind === 'commerciale'));
    if (own.length) body += `<h4>Tuoi immobili</h4><div class="cards">${own.map(p => `<button class="card ${w.prop === p.id ? 'on' : ''}" data-a="wizProp" data-v="${p.id}"><h4>${num(p.m2)} m² ${badge('tuo', 'b')}</h4><div class="kv">Affitto <b>0 €</b></div></button>`).join('')}</div>`;
  } else {
    const T = BUSINESS_TYPES[w.type];
    const L = w.listing ? rentListings(w.city, w.district, w.type).find(x => x.id === w.listing) : null;
    const p = w.prop ? S.props.find(x => x.id === w.prop) : null;
    const oc = openingCost(w.type, L || { m2: p ? p.m2 : T.size, condition: 'buono' }, !!p);
    const eqc = sum(T.equip.filter(e => e.req), e => equipCost(e, 0)) * 1.22;
    const now = oc.total + (L ? L.agency * 0.22 : 0) + oc.renov * 0.1;
    body = `<label class="field"><span>Nome</span><input id="wiz_name" value="${esc(w.name)}" data-c="wizName" maxlength="40"></label>
      ${S.brands.length ? `<label class="field"><span>Marchio ${hb('marchio')}</span>${select('wizBrand', [['', '—'], ...S.brands.map(b => [b.id, b.name])], w.brand)}</label>` : ''}
      ${table(['Voce', ['€', 'n']], [
        tr(['Licenze', [eur0(oc.license), 'n']]),
        L ? tr(['Cauzione', [eur0(L.deposit), 'n']]) : '', L ? tr(['1° affitto', [eur0(L.rent), 'n']]) : '', L ? tr(['Agenzia', [eur0(L.agency * 1.22), 'n']]) : '',
        oc.renov ? tr(['Lavori', [eur0(oc.renov * 1.1), 'n']]) : '',
        tr(['Subito', [`<b>${eur0(now)}</b>`, 'n']], 'tot'), tr(['Poi attrezzature', [eur0(eqc), 'n']], 'sub'), tr(['Cassa', [eur0(S.cash), 'n']], 'sub')])}
      ${S.cash < now + eqc ? '<div class="note r">Liquidità scarsa</div>' : ''}`;
  }
  const foot = (w.step > 1 ? btn('◀', 'wizStep', { s: w.step - 1 }) : '') + (w.step === 4 ? btn('Apri ✓', 'wizConfirm', {}, 'pri big') : '');
  return sheet('Nuova attività', stepper + body, foot, { wide: true, help });
};
