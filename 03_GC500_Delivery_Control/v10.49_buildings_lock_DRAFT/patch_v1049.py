"""Author: Andrew Fisher. v10.49 - lock and unlock the buildings position (Andrew, 16 Oct 2026: "all buildings are in, I
want this all locked in so we know where we are at" / "need to unlock also").

Costs gets a Buildings card. "Lock buildings" takes a snapshot of every building on site with every charge it carries
on the record (hire, install, steps, levelling, cleaning, fire extinguisher, demob, delivery and pick-up legs) and
keeps it in the shared record with the person and time. While locked:
- a tick, complete, light, levelled or steps change on a building is refused with a plain message;
- the card shows the locked total and anything that differs from the lock since (a rate, a contract line or a
  change made before the lock was read), building by building.
"Unlock" (edit link only, after a confirm) opens them again; the last lock and who unlocked stay on the card.
The lock lives in the record's runRules map under one key (buildingsLock1049) as a JSON string, through the page's own
stampIt/save. Nothing else in the record changes.

Also (Andrew, 16 Oct 2026: "Accessible treat it as a FWF"): accessible toilets get the event-night FWF servicing,
FWF Pump out & Clean & Restock $72.87 a unit, Friday, Saturday and Sunday night (WC01, WC31, WC51, WC86: 4 units,
$291.48 a night, $874.44 for the three nights). Footer v10.48 -> v10.49.

    python3 patch_v1049.py path/to/page.html   (on the live v10.48 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

ANCHOR = "/* v10.44 - names-everywhere-1044: whatever routine drew it, an agent name never stays on the page. */"
NEW = r'''/* v10.49 - buildings-lock-1049: lock and unlock the buildings position (Andrew, 16 Oct 2026). */
(function(W){
 const KEY = 'buildingsLock1049', DISC = 'Portable buildings';
 const r2 = v => Math.round((Number(v) + Number.EPSILON) * 100) / 100;
 const e = s => { try { return esc(String(s == null ? '' : s)); } catch (x) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); } };
 const nm = s => { try { return noAgent1030(String(s || '')); } catch (x) { return String(s || ''); } };
 const $m = v => '$' + r2(v).toLocaleString('en-AU', {minimumFractionDigits: 2, maximumFractionDigits: 2});
 const when = iso => { try { return new Date(iso).toLocaleString('en-AU', {timeZone: 'Australia/Brisbane', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false}).replace(',', ''); } catch (x) { return iso; } };
 const LBL = {hire: 'Hire', install: 'Install', steps: 'Steps', levelling: 'Levelling', cleaning: 'Cleaning', fire_ext: 'Fire extinguisher', demob: 'Demob', delivery: 'Delivery', pickup: 'Pick-up'};
 function state1049(){ try { const v = (S.runRules || {})[KEY]; return v ? JSON.parse(v) : null; } catch (x) { return null; } }
 function lockedNow1049(){ const s = state1049(); return !!(s && s.locked); }
 function isBuilding(key){ try { const a = (typeof assetOf === 'function' ? assetOf(key) : null) || allAssets().find(x => x.key === key); return !!a && a.discipline === DISC; } catch (x) { return false; } }
 /* every building on site and every charge the record gives it - the same reading as the 16 Oct breakdown */
 function snap1049(){
  return holdAssets(() => {
   let T = {}; try { T = buildingTransportModel831() || {}; } catch (x) {}
   const src = typeof Source949 !== 'undefined' ? Source949.model() : [], refs = {}; let total = 0;
   allAssets().filter(a => a.discipline === DISC && !a._cancelled && !movedAway(a.key) && (deliveryOf(a.key) || {}).state === 'on site').forEach(a => {
    const l = (chargeLines(a) || [])[0] || {}, item = l.item, c = {};
    try { const card = cardRate(a.discipline, item, a.key); const ic = ItemCharges979.project(a.key, item, ItemIdentity979.select(a.key, item, ONHIRE_ROWS, gcModel925(a).rows), generatorDisplayCharge1004, card.labour_per_piece, src); if (Number(ic.amount)) c.hire = r2(ic.amount); } catch (x) {}
    const info = item ? labourLinesFor(a.key, a.discipline, item, a.key, undefined, a) : {lines: []};
    (info.lines || []).forEach(x => { const on = !!x.ticked || !!labourTicked(a.key, a.discipline, item, x.key, undefined, a) || !!((S.labour || {})[labourKey(a.key, a.discipline, item, x.key)]); if (on && x.rate) c[x.key] = r2(x.rate); });
    (T.rows || []).filter(r => r.ref === a.key && (r.leg === 'delivery' || r.leg === 'pickup') && r.tick1033 === 'on').forEach(r => { c[r.leg] = r2(r.actualAdditional1006 || 0); });
    const t = r2(Object.values(c).reduce((n, v) => n + v, 0)); refs[a.key] = {c, t}; total += t;
   });
   return {refs, total: r2(total), n: Object.keys(refs).length};
  });
 }
 function drift1049(lock, now){
  const out = [], keys = new Set([...Object.keys(lock.refs || {}), ...Object.keys(now.refs || {})]);
  [...keys].sort().forEach(k => { const a = (lock.refs || {})[k], b = (now.refs || {})[k];
   if (!a) { out.push({ref: k, what: 'on site since the lock', d: b.t}); return; }
   if (!b) { out.push({ref: k, what: 'no longer on site / charged', d: -a.t}); return; }
   const ls = new Set([...Object.keys(a.c), ...Object.keys(b.c)]);
   ls.forEach(x => { const p = a.c[x] || 0, q = b.c[x] || 0; if (Math.abs(p - q) > 0.004) out.push({ref: k, what: (LBL[x] || x) + (p && q ? ' ' + $m(p) + ' → ' + $m(q) : p ? ' taken off' : ' added'), d: r2(q - p)}); });
  });
  return out;
 }
 function lock1049(){
  if (!mayWrite('locking the buildings')) return false; const who = whoAmI(); if (!who) return false;
  const s = snap1049(), prev = state1049();
  const v = {v: 1, locked: true, at: new Date().toISOString(), by: who, total: s.total, n: s.n, refs: s.refs,
   last_unlock: prev && !prev.locked ? {at: prev.unlocked_at, by: prev.unlocked_by} : null};
  S.runRules = S.runRules || {}; S.runRules[KEY] = JSON.stringify(v); stampIt('runRules', KEY, who); save();
  try { render(); } catch (x) {} flash('Buildings locked: ' + s.n + ' buildings, ' + $m(s.total) + '.'); return true;
 }
 function unlock1049(){
  if (!mayWrite('unlocking the buildings')) return false; const who = whoAmI(); if (!who) return false;
  const s = state1049(); if (!s || !s.locked) return false;
  const v = Object.assign({}, s, {locked: false, unlocked_at: new Date().toISOString(), unlocked_by: who});
  S.runRules[KEY] = JSON.stringify(v); stampIt('runRules', KEY, who); save();
  try { render(); } catch (x) {} flash('Buildings unlocked. Lock them again when you are done.'); return true;
 }
 function card1049(){
  const s = state1049(), now = snap1049();
  if (s && s.locked) {
   const d = drift1049(s, now), net = r2(d.reduce((n, x) => n + x.d, 0));
   return '<section class="card lock1049 on" id="lock1049" data-lock1049="locked"><div class="lock1049-top"><span class="lock1049-ic" aria-hidden="true">🔒</span><div><h3>Buildings · locked</h3>' +
    '<p class="lock1049-sub">Locked ' + e(when(s.at)) + ' by ' + e(nm(s.by)) + ' · ' + s.n + ' buildings</p></div><div class="lock1049-total">' + e($m(s.total)) + '</div></div>' +
    (d.length ? '<p class="lock1049-drift warn"><b>' + d.length + ' change' + (d.length === 1 ? '' : 's') + ' since the lock</b> · now ' + e($m(now.total)) + ' (' + (net >= 0 ? '+' : '−') + e($m(Math.abs(net))) + ')</p><details class="lock1049-more"><summary>What changed</summary><ul>' + d.map(x => '<li><b>' + e(x.ref) + '</b> · ' + e(x.what) + ' <span class="lock1049-d">' + (x.d >= 0 ? '+' : '−') + e($m(Math.abs(x.d))) + '</span></li>').join('') + '</ul></details>'
     : '<p class="lock1049-drift ok">✓ No change since the lock</p>') +
    '<p class="lock1049-note">While locked, ticks, complete, lights, levelling and steps on buildings cannot be changed.</p>' +
    '<button type="button" class="btn lock1049-btn" data-lock1049-act="unlock">Unlock buildings</button></section>';
  }
  return '<section class="card lock1049" id="lock1049" data-lock1049="open"><div class="lock1049-top"><span class="lock1049-ic" aria-hidden="true">🔓</span><div><h3>Buildings · not locked</h3>' +
   '<p class="lock1049-sub">' + now.n + ' buildings on site' + (s && s.unlocked_at ? ' · last locked ' + e(when(s.at)) + ' by ' + e(nm(s.by)) + ', unlocked ' + e(when(s.unlocked_at)) + ' by ' + e(nm(s.unlocked_by)) : '') + '</p></div><div class="lock1049-total">' + e($m(now.total)) + '</div></div>' +
   '<p class="lock1049-note">Lock the buildings to hold every charge where it is; any change after that shows here.</p>' +
   '<button type="button" class="btn lock1049-btn" data-lock1049-act="lock">Lock buildings</button></section>';
 }
 W.lock1049 = lock1049; W.unlock1049 = unlock1049; W.snap1049 = snap1049; W.state1049 = state1049; W.drift1049 = drift1049; W.card1049 = card1049;
 /* the guard: while locked, building changes are refused with a plain message */
 const refuse = () => { const s = state1049(); flash('Buildings are locked' + (s ? ' (' + when(s.at) + ', ' + nm(s.by) + ')' : '') + '. Unlock them on Costs to change this.'); return false; };
 const guard = (name, pick) => { if (typeof W[name] !== 'function' && typeof eval('typeof ' + name) === 'undefined') return; let before; try { before = eval(name); } catch (x) { return; } if (typeof before !== 'function' || before.lock1049) return;
  const g = function(){ try { if (lockedNow1049() && pick.apply(null, arguments)) return refuse(); } catch (x) {} return before.apply(this, arguments); };
  g.lock1049 = true; W[name] = g; try { eval(name + ' = g'); } catch (x) {} };
 guard('setLabour', ref => isBuilding(ref));
 guard('setLabourAll', disc => disc === DISC);
 guard('setDone', key => isBuilding(key));
 guard('setLight', key => isBuilding(key));
 guard('setLevelled', key => isBuilding(key));
 guard('setSteps', key => isBuilding(key));
 /* the card at the top of Costs */
 const beforeCosts = renderCosts;
 const rc = function(){ const r = beforeCosts.apply(this, arguments);
  try { const pane = document.getElementById('pane-costs'); if (pane && !pane.querySelector('#lock1049')) { const h = pane.querySelector('.panehead') || pane.querySelector('h2'); const html = card1049(); if (h) h.insertAdjacentHTML('afterend', html); else pane.insertAdjacentHTML('afterbegin', html); } } catch (x) {}
  return r; };
 rc.lock1049 = true; W.renderCosts = rc; try { renderCosts = rc; } catch (x) {}
 document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-lock1049-act]'); if (!b) return; ev.preventDefault();
  if (b.dataset.lock1049Act === 'lock') lock1049();
  else if (b.dataset.lock1049Act === 'unlock' && window.confirm('Unlock the buildings? Ticks and charges on buildings can be changed again until they are locked.')) unlock1049(); });
 if (!document.getElementById('lock1049-style')) { const st = document.createElement('style'); st.id = 'lock1049-style';
  st.textContent = '.lock1049{margin:10px 0;padding:12px 14px;border-left:4px solid #8a94a3}.lock1049.on{border-left-color:#2e9b52}' +
   '.lock1049-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.lock1049-top h3{margin:0}.lock1049-ic{font-size:1.5em}' +
   '.lock1049-sub,.lock1049-note{color:var(--mute,#667);margin:2px 0;font-size:.9em}.lock1049-total{margin-left:auto;font-size:1.5em;font-weight:800}' +
   '.lock1049-drift{margin:8px 0 4px;font-weight:600}.lock1049-drift.ok{color:#17602f}.lock1049-drift.warn{color:#8e1c12}' +
   '.lock1049-more ul{margin:6px 0;padding-left:18px}.lock1049-d{color:var(--mute,#667)}.lock1049-btn{margin-top:8px}' +
   'body.viewonly .lock1049-btn{display:none}' +
   '@media (prefers-color-scheme:dark){.lock1049-drift.ok{color:#9fe0b2}.lock1049-drift.warn{color:#f4aaa2}}';
  document.head.appendChild(st); }
})(window);
''' + ANCHOR

REPLACEMENTS = [
    ('buildings lock and unlock', ANCHOR, NEW),
    ('accessible toilets serviced as FWF', r"const n = {fwf: q(/^FWF(\s*Trailer)?$/i), /* v10.42 - fwf-trailers-1042 */",
     r"const n = {fwf: q(/^(FWF(\s*Trailer)?|Accessible\s*Toilet)$/i), /* v10.42 - fwf-trailers-1042; v10.49 - accessible toilets serviced as FWF (Andrew, 16 Oct 2026) */"),
    ('Release footer', "+ ' · v10.48'", "+ ' · v10.49'"),
]


def main():
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    page = Path(a[0]); html = page.read_text(encoding='utf-8')
    if 'buildings-lock-1049' in html: sys.exit('patch_v1049 refuses a repeat')
    if "+ ' · v10.48'" not in html: sys.exit('patch_v1049: not the v10.48 line - wrong base')
    for what, old, new in REPLACEMENTS: html = rep(html, old, new, what, str(page))
    page.write_text(html, encoding='utf-8')
    print('patch_v1049 applied: buildings lock and unlock on Costs; footer v10.48 -> v10.49')


if __name__ == '__main__':
    main()
