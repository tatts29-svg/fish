/* v7.31 - EVERY COUNT NAMES ITS LOCATIONS (see patch_v731.py). Andrew Fisher, 29 Sep 2026: "When you say we are missing
   inventory I need to be able to click what reference is missing it."
   - Inventory: every count is a button; pressed, it lists the locations behind it (what is on site, numbered, sub-hired,
     not numbered, still to come or short) and each location opens on the Change form, ready to fix.
   - Questions: a location at the start of a detail row opens the same way. */
const INV_COLS = {total: 'on site', on: 'at locations', coates: 'Coates numbered', sub: 'sub-hired', nonum: 'with no number yet', togo: 'still to come', spare: 'spare', asked: 'ordered'};
/* open a location on the Change form, on its own due-in day, scrolled to the form */
function fixRef(key){
 const a = assetOf(key); if (!a) { flash(String(key) + ' is not a reference on this job.'); return; }
 CHG.key = a.key; CHG.type = chTypeOf(a); CHG.clash = null; INV.swap = null;
 const d = effectiveDates(a).in; if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) { if (CHG.day !== d) CHG.said = null; CHG.day = d; }
 if (state.tab === 'change') render(); else go('change');
 setTimeout(() => { const f = $('#pane-change\x20.chside\x20.card'); if (f) { try { f.scrollIntoView({block: 'start', behavior: 'smooth'}); } catch (e) { f.scrollIntoView(); } } }, 60);
}
document.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('[data-fixref]') : null; if (!b) return; e.preventDefault(); e.stopPropagation(); fixRef(b.dataset.fixref); }, true);
/* a Questions detail row that starts with a location: the location is a button */
function qRowHtml(r){
 const s = String(r || ''), m = s.match(/^([A-Z][A-Z0-9-]{0,9})(?=[\s:·,]|$)/);
 if (!m || !isRef(m[1])) return esc(s);
 return `<button type="button" class="linkish qref" data-fixref="${esc(m[1])}" title="Open ${esc(m[1])} to fix it">${esc(m[1])}</button>${esc(s.slice(m[1].length))}`;
}
/* one count in the inventory table, as a button when there is something behind it */
function invCell(r, col, n, inner){
 if (!n) return inner != null ? inner : '<span class="norate">0</span>';
 const on = INV.drill && INV.drill.t === r.type && INV.drill.col === col;
 return `<button type="button" class="invn${on ? ' on' : ''}" data-invdrill="${esc(r.type + '|' + col)}" aria-pressed="${on}" title="Which locations - ${esc(r.item)} ${esc(INV_COLS[col] || col)}">${inner != null ? inner : n}</button>`;
}
/* the list under the table: which locations make up the count that was pressed */
function invDrillHtml(I){
 const D = INV.drill; if (!D) return '';
 const r = I.list.find(x => x.type === D.t); if (!r) { INV.drill = null; return ''; }
 const refs = Object.values(r.refs || {}), td = I.td;
 const due = k => { const a = assetOf(k), d = a ? effectiveDates(a).in : null; return d || ''; };
 const pick = {
  total: refs.filter(x => x.on > 0).map(x => [x, `${x.on} on site`]),
  on: refs.filter(x => x.on > 0).map(x => [x, `${x.on} of ${x.asked} on site`]),
  coates: refs.filter(x => x.coates > 0).map(x => [x, `${x.coates} Coates: ${invCoatesNums(assetOf(x.key)).join(', ')}`]),
  sub: refs.filter(x => x.sub > 0).map(x => [x, Object.entries(x.cos).map(([c, n]) => c + ' ' + n).join(', ')]),
  nonum: refs.filter(x => x.nonum > 0).map(x => { const c = locNums(assetOf(x.key)); return [x, `${x.nonum} with no number${c ? ' (' + c.n + ' of ' + c.q + ' numbered)' : ''}`]; }),
  togo: refs.filter(x => x.asked - x.on > 0).sort((p, q) => String(due(p.key)).localeCompare(String(due(q.key)))).map(x => [x, x.onsite ? `short ${x.asked - x.on} - ${x.on} of ${x.asked} here` : `${x.asked} not on site yet${due(x.key) ? ' · due in ' + chShort(due(x.key)) : ''}`]),
  asked: refs.map(x => [x, `${x.asked} ordered${x.on ? ', ' + x.on + ' on site' : ''}`])
 }[D.col] || [];
 const spares = (D.col === 'spare' || D.col === 'total') ? I.spares.filter(s => s.type === r.type) : [];
 const n = D.col === 'spare' ? spares.length : pick.reduce((s, [x, w]) => s + (D.col === 'togo' ? x.asked - x.on : D.col === 'total' || D.col === 'on' ? x.on : D.col === 'asked' ? x.asked : x[D.col] || 0), 0) + (D.col === 'total' ? spares.length : 0);
 const list = pick.sort((p, q) => D.col === 'togo' ? 0 : p[0].key.localeCompare(q[0].key, undefined, {numeric: true})).map(([x, w]) => `<li><button type="button" class="invref" data-fixref="${esc(x.key)}" title="Open ${esc(x.key)} on the form">${refPlate(x.key, 18)}<span>${esc(w)}${(() => { const a = assetOf(x.key); return a && a.name ? `<span class="w"> · ${esc(a.name)}</span>` : ''; })()}</span><b class="invgo">Open ›</b></button></li>`).join('');
 const spl = spares.map(s => `<li class="invspr"><span><b>Spare</b> · ${esc(s.co)}${s.no ? ' <b class="mono">' + esc(s.no) + '</b>' : ' (no number)'}${s.note ? ' · ' + esc(s.note) : ''}</span></li>`).join('');
 return `<div class="notice info invdrill" id="invDrill"><div class="invdrillh"><b>${esc(r.item)} - ${esc(INV_COLS[D.col] || D.col)}: ${n}${pick.length ? ' at ' + pick.length + ' location' + (pick.length === 1 ? '' : 's') : ''}</b><button type="button" class="chnumx" data-invdrill-x aria-label="Close the list">×</button></div>
 ${list || spl ? `<ul class="invdrl">${list}${spl}</ul>` : '<p class="norate">Nothing behind this count.</p>'}
 <div class="hint">Press a location to open it on the form - add its numbers, what turned up, a swap, or cancel it.</div></div>`;
}
