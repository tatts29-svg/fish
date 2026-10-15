/* Author: Andrew Fisher. The seven symbols, v10.33 (Andrew, 16 Oct 2026: "a clean symbol, and delivery, and a symbol to be
   ticked and unticked. Goes in order: delivery, install, level, steps, clean, demob, pick up. If applicable.")
   One row of symbols on every reference, on the Equipment list, the day cards and the drawer's Complete it island, each
   a tick: Delivery · Install · Level · Steps · Clean · Demob · Pick up, only the ones the thing carries. Install, level,
   steps, clean and demob are the card's labour lines on the reference (every unit of every item that carries the line,
   through setLabour, so the Pricing tab and the P&L follow). Level and steps also set the record's own levelled and
   steps ticks. Delivery and pick up are the transport legs: a tick makes the leg's card charge actual; a tick taken off
   leaves it out. Nothing here invents a rate; a tick Andrew takes off stays off. */
(function (W) {
 'use strict';
 const SYMS = [
  {k: 'delivery', word: 'Delivery', title: 'Delivery — the delivery leg charged at the card', cls: 'dlv'},
  {k: 'install', word: 'Install', title: 'Install — the card\'s installation labour', cls: 'ins'},
  {k: 'levelling', word: 'Level', title: 'Level — positioned and levelled, and the card\'s levelling labour', cls: 'lvl'},
  {k: 'steps', word: 'Steps', title: 'Steps — steps installed, and the card\'s steps labour', cls: 'stp'},
  {k: 'cleaning', word: 'Clean', title: 'Clean — the card\'s cleaning labour', cls: 'cln'},
  {k: 'demob', word: 'Demob', title: 'Demob — the card\'s demobilisation labour', cls: 'dmb'},
  {k: 'pickup', word: 'Pick up', title: 'Pick up — the pick-up leg charged at the card', cls: 'pku'}
 ];
 const LAB = new Set(['install', 'levelling', 'steps', 'cleaning', 'demob']);
 const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
 const G = {
  delivery: '<path d="M2 6h10v8H2zM12 9h4l3 3v2h-7zM5 17a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM15 17a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z"/><path d="M7 10h3M7 10l1.5-1.5M7 10l1.5 1.5" stroke-width="1.6"/>',
  install: '<path d="M4 16l6-6M9 4l7 7M12 4l4 4M3 17l2 0 0-2z"/>',
  cleaning: '<path d="M14 3l-6 8M8 11c-2 1-3 3-3 6h7c0-3-1-5-4-6zM6 14h6"/>',
  demob: '<path d="M4 8h12v9H4zM10 3v8M7 8l3 3 3-3"/>',
  pickup: '<path d="M2 6h10v8H2zM12 9h4l3 3v2h-7zM5 17a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM15 17a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z"/><path d="M5 10h3M8 10l-1.5-1.5M8 10l-1.5 1.5" stroke-width="1.6"/>'
 };
 function glyph(k, n){ if (k === 'levelling' && typeof levelGlyph === 'function') return levelGlyph(n); if (k === 'steps' && typeof stepsGlyph === 'function') return stepsGlyph(n); return '<svg class="sym1033-g" width="' + n + '" height="' + n + '" viewBox="0 0 20 20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (G[k] || '') + '</svg>'; }
 function lineKey(ref, disc, item, line, unit){ return labourKey(ref, disc, item, line, unit); }
 /* every (item, unit) on the reference that carries this labour line */
 function carriers(a, line){
  const out = [];
  for (const l of chargeLines(a) || []) {
   const info = labourLinesFor(a.key, l.discipline, l.item, a.key, undefined, a);
   if (!(info.lines || []).some(L => L.key === line)) continue;
   const units = labourUnits(a, l.item);
   (units.length ? units : [null]).forEach(u => out.push({disc: l.discipline, item: l.item, unit: u, rate: (info.lines.find(L => L.key === line) || {}).rate}));
  }
  return out;
 }
 function legKey(a, leg){ const l = (chargeLines(a) || [])[0]; return l ? lineKey(a.key, l.discipline, l.item, leg) : null; }
 function legApplies(a){ try { const T = W.buildingTransportModel831(); return (T.rows || []).some(r => r.ref === a.key && !['held', 'excluded', 'included'].includes(r.state)); } catch (e) { return false; } }
 function legState(a, leg){
  const k = legKey(a, leg); const on = !!(k && ((typeof S !== 'undefined' && S.labour) || {})[k]); const stamp = k && ((typeof S !== 'undefined' && S.stamps) || {})['labour/' + k];
  let charge = null, arrived = false; try { const T = W.buildingTransportModel831(); const rows = (T.rows || []).filter(r => r.ref === a.key && r.leg === leg); charge = rows.length ? rows.reduce((n, r) => n + (Number(r.additional) || 0), 0) : null; arrived = rows.some(r => r.receivedRatio1006 > 0); } catch (e) {}
  return {applies: legApplies(a), on: on, off: !!stamp && !on, arrived, charge, key: k};
 }
 function state(ref){
  const a = assetOf(ref); if (!a) return null; const d = deliveryOf(ref); const out = {};
  for (const s of SYMS) {
   if (LAB.has(s.k)) {
    const cs = carriers(a, s.k); const on = cs.filter(c => labourTicked(ref, c.disc, c.item, s.k, c.unit || undefined, a)).length;
    const recTick = s.k === 'levelling' ? !!d.levelled : s.k === 'steps' ? !!d.steps : null;
    const applies = cs.length > 0; /* the thing carries the line on the card (an FWF: install and demob only) */
    out[s.k] = {applies, of: cs.length, on: on, all: cs.length ? on === cs.length : !!recTick, part: on > 0 && on < cs.length, record: recTick, money: cs.reduce((n, c) => n + (c.rate || 0), 0)};
   } else out[s.k] = Object.assign({}, legState(a, s.k));
  }
  return out;
 }
 function btn(ref, s, st, small){
  if (!st || !st.applies) return '';
  const on = LAB.has(s.k) ? st.all : st.on, part = LAB.has(s.k) ? st.part : false;
  const words = LAB.has(s.k) ? (st.of ? st.on + ' of ' + st.of + (st.money ? ' · ' + money(st.money) : '') : (on ? 'ticked' : 'not ticked')) : (st.charge != null ? money(st.charge) + ' at the card' : 'no card rate') + (st.off ? ' · left out' : st.arrived && !st.on ? ' · arrived, not ticked' : '');
  return '<button type="button" class="tickbtn sym1033 ' + s.cls + (small ? ' sm' : '') + (on ? ' on' : part ? ' part' : '') + (st.off ? ' offed' : '') + '" data-sym1033="' + s.k + '" data-symref="' + esc(ref) + '" aria-pressed="' + (on ? 'true' : 'false') + '" title="' + esc(s.title + ' · ' + words) + '" aria-label="' + esc((on ? 'Un-tick ' : 'Tick ') + s.word + ' for ' + ref) + '">' + glyph(s.k, small ? 15 : 19) + '</button>';
 }
 function row(ref, small){ const st = state(ref); if (!st) return ''; return SYMS.map(s => btn(ref, s, st[s.k], small)).join(''); }
 /* the island rows in the drawer: one per symbol that applies, after the existing lamp and tick rows */
 function islandRows(ref){
  const st = state(ref); if (!st) return '';
  return SYMS.map(s => { const x = st[s.k]; if (!x || !x.applies) return ''; const on = LAB.has(s.k) ? x.all : x.on; const words = LAB.has(s.k) ? (x.of ? x.on + ' of ' + x.of + ' ticked' + (x.money ? ' · ' + money(x.money) : '') : (on ? 'ticked' : 'not ticked')) : (x.charge != null ? money(x.charge) + ' at the card' : 'no card rate') + (x.off ? ' · left out' : ''); return '<button type="button" class="hl sym1033-row' + (on ? '' : ' off816') + '" data-sym1033="' + s.k + '" data-symref="' + esc(ref) + '" aria-pressed="' + on + '"><span class="tick sm ' + s.cls + '" aria-hidden="true">' + glyph(s.k, 11) + '</span><b>' + (on ? '✓' : x.part ? '½' : '–') + '</b> ' + esc(s.word.toLowerCase()) + ' <span class="w">' + esc(words) + '</span></button>'; }).join('');
 }
 function toggle(ref, k){
  if (typeof mayWrite === 'function' && !mayWrite('a tick')) return false;
  const a = assetOf(ref); if (!a) return false; const st = state(ref)[k]; if (!st || !st.applies) return false;
  if (LAB.has(k)) {
   const on = !st.all; const cs = carriers(a, k);
   cs.forEach(c => setLabour(ref, c.disc, c.item, k, on, c.unit || undefined));
   if (k === 'levelling' && typeof needsLevel === 'function' && needsLevel(a) && !!deliveryOf(ref).levelled !== on) setLevelled(ref, on);
   if (k === 'steps' && typeof needsLevel === 'function' && needsLevel(a) && !!deliveryOf(ref).steps !== on) setSteps(ref, on);
   if (!cs.length && k !== 'levelling' && k !== 'steps') return false;
  } else {
   const l = (chargeLines(a) || [])[0]; if (!l) return false;
   setLabour(ref, l.discipline, l.item, k, !st.on);
  }
  if (typeof render === 'function') render();
  if (typeof W.openAsset === 'function' && document.getElementById('drawer') && document.getElementById('drawer').classList.contains('on')) { try { W.openAsset(ref); } catch (e) {} }
  return true;
 }
 document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sym1033]'); if (!b || !W.isRef || !isRef(b.dataset.symref)) return; e.stopPropagation(); e.preventDefault(); toggle(b.dataset.symref, b.dataset.sym1033); }, true);
 /* the transport legs follow the ticks: a delivery or pick-up tick makes the leg's card charge actual; a tick taken off leaves it out */
 if (typeof buildingTransportModel831 === 'function') {
  const before = buildingTransportModel831;
  buildingTransportModel831 = function () { return heldMemo('transport1033', () => {
   const M = before(); const cents = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
   const rows = (M.rows || []).map(r => {
    if (['held', 'excluded', 'included'].includes(r.state) || (r.leg !== 'delivery' && r.leg !== 'pickup')) return r;
    const a = assetOf(r.ref); if (!a) return r; const k = legKey(a, r.leg); if (!k) return r;
    const on = !!((typeof S !== 'undefined' && S.labour) || {})[k], off = !on && !!((typeof S !== 'undefined' && S.stamps) || {})['labour/' + k];
    if (on) return Object.assign({}, r, {actualAdditional1006: cents(r.additional || 0), remainingAdditional1006: 0, receivedRatio1006: 1, tick1033: 'on'});
    if (off) return Object.assign({}, r, {actualAdditional1006: 0, remainingAdditional1006: 0, tick1033: 'off', reasons: (r.reasons || []).concat(['Tick taken off: ' + r.leg + ' leg not charged'])});
    return r;
   });
   const byBranch = (M.byBranch || []).map(b => Object.assign({}, b, {actualAdditional1006: cents(rows.filter(r => r.branch === b.branch).reduce((n, r) => n + (r.actualAdditional1006 || 0), 0)), remainingAdditional1006: cents(rows.filter(r => r.branch === b.branch).reduce((n, r) => n + (r.remainingAdditional1006 || 0), 0))}));
   return Object.assign({}, M, {rows, byBranch, actualAdditional1006: cents(rows.reduce((n, r) => n + (r.actualAdditional1006 || 0), 0)), remainingAdditional1006: cents(rows.reduce((n, r) => n + (r.remainingAdditional1006 || 0), 0))});
  }); };
 }
 /* the drawer: the island gets the symbol rows after its own rows */
 function island(ref){ const dr = document.getElementById('drawer'); if (!dr || !dr.classList.contains('on')) return; const box = dr.querySelector('.cmp816 .hublights'); if (!box || box.querySelector('.sym1033-row')) return; const html = islandRows(ref); if (!html) return; const wrap = document.createElement('div'); wrap.className = 'sym1033-island'; wrap.innerHTML = html; box.appendChild(wrap); }
 if (typeof W.openAsset === 'function') { const orig = W.openAsset; W.openAsset = function (key, opts) { const r = orig.apply(this, arguments); try { island(key); requestAnimationFrame(() => island(key)); setTimeout(() => island(key), 500); } catch (e) {} return r; }; }
 W.sym1033Row = row; W.sym1033State = state; W.sym1033Toggle = toggle; W.sym1033Island = islandRows;
 /* the page drew before this script arrived: draw once more so the rows carry the symbols */
 if (typeof render === 'function' && document.querySelector('.pane.on')) setTimeout(() => { try { render(); } catch (e) {} }, 0);
})(window);
