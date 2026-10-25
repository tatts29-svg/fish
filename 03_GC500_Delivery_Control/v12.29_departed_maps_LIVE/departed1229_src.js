<script id="departed1229-script">
/* Author: Andrew Fisher. v12.29 - a departed icon on the main maps. Andrew, 26 Oct 2026: "we want a departed icon now too on
   the main maps too please". The Map explorer marks LEFT SITE (v12.11). The satellite map of VMS boards, generators and gates
   (the Map tab, and the board map on the VMS tab) and the drawing sheets' reference pills now carry the same departure: a ↗ on
   a green disc, read from the page's own departure record (Departure1211: typed collection quantities with the actual time).
   One read per record change, of the references whose delivery history holds a collection entry; nothing else is scanned
   twice. Read only. */
(function (W) {
'use strict';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let memo = null;
/* the departure stamp "26/10/2026, 07:40:00 AEST" as "26 Oct 07:40" */
function short(last){ const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})/.exec(String(last || '')); return m ? Number(m[1]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[4].padStart(2, '0') + ':' + m[5] : ''; }
/* the references with a collection entry in their delivery history, the local copy or the committed one (as histOf_ reads) */
function scan(){
 const keys = new Set(), ids = [];
 const look = (k, hist) => { (Array.isArray(hist) ? hist : []).forEach(h => { const c = h && h.collection996; if (c && c.kind === 'collection') { keys.add(k); ids.push(k + ':' + c.id); } }); };
 const D = (typeof S === 'object' && S && S.delivery) || {};
 Object.keys(D).forEach(k => look(k, D[k] && D[k].history));
 try { if (typeof CROW === 'object' && CROW && typeof CROW.forEach === 'function') CROW.forEach((v, k) => look(k, v && v.delivery && v.delivery.history)); } catch (e) {}
 return {keys: [...keys], sig: (typeof todayIso === 'function' ? todayIso() : '') + '|' + ids.sort().join(',')};
}
function describe(d){
 const when = short(d.last);
 return {complete: !!d.complete, collected: d.collected, remaining: d.remaining, label: d.label, last: d.last, short: when,
  tag: d.complete ? 'LEFT SITE' : d.collected + ' LEFT',
  words: (d.complete ? 'Left site' : d.collected + ' left, ' + d.remaining + ' still to leave') + (when ? ' ' + when : '')};
}
function snapshot(){
 const s = scan();
 if (memo && memo.sig === s.sig) return memo;
 const refs = new Map(), boards = new Map();
 if (s.keys.length && W.Departure1211) {
  const held = f => (typeof holdAssets === 'function' ? holdAssets(f) : f());
  try { held(() => s.keys.forEach(k => { const d = W.Departure1211.status(k); if (d && d.collected && !(d.issues || []).length) refs.set(k, describe(d)); })); } catch (e) {}
  try { const VE = W.VmsEquipment1103; if (VE && typeof VE.model === 'function') held(() => (VE.model().boards || []).forEach(b => { if (!b || !b.departure1211) return;
    const when = short(b.departure1211.at), v = {complete: true, collected: 1, remaining: 0, label: 'Left site', last: b.departure1211.at, short: when, tag: 'LEFT SITE', words: 'Left site' + (when ? ' ' + when : '')};
    (b.positions || []).forEach(p => { if (p && p.pos != null) boards.set(String(p.pos), v); }); })); } catch (e) {}
 }
 memo = {sig: s.sig, refs, boards};
 return memo;
}
function ref(key){ return snapshot().refs.get(String(key)) || null; }
function board(pos){ return snapshot().boards.get(String(pos)) || null; }
/* a pill naming several references: any of them gone, all of them gone in full, and the words for each (one snapshot a draw) */
function keysIn(snap, list){
 const L = (list || []).map(k => [k, snap && snap.refs.get(String(k))]).filter(x => x[1]); if (!L.length) return null;
 return {any: true, all: L.length === (list || []).length && L.every(x => x[1].complete), words: L.map(x => x[0] + ' ' + x[1].words).join('; ')};
}
function keys(list){ return keysIn(snapshot(), list); }
/* the satellite map's icon: a green disc with the arrow, at (cx, cy), radius r, in the map's units (u = one css px) */
function badge(cx, cy, r, u){
 return `<g class="dep1229-badge" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#075239" stroke="#b5ffe0" stroke-width="${1.6 * u}"/><text x="${cx}" y="${cy + r * 0.42}" text-anchor="middle" font-size="${r * 1.3}" font-weight="800" fill="#ffffff">↗</text></g>`;
}
function rowHtml(d){ return d ? ' <span class="dep1229-row"><b>↗ ' + esc(d.tag === 'LEFT SITE' ? 'Left site' : d.tag.toLowerCase()) + '</b>' + (d.short ? ' · ' + esc(d.short) : '') + '</span>' : ''; }
/* the Map explorer's card (gc500PlanCard, the Timeline's own reading): once the last units go the light reads in transit, and the
   card said "In transit ... Still to come: On site → At location". A reference that has left now says so, with the time */
const card0 = W.gc500PlanCard;
if (typeof card0 === 'function') W.gc500PlanCard = function (key) {
 const base = card0.apply(this, arguments);
 try { const d = base && ref(key);
  if (d) { base.lines = [{k: d.complete ? 'Left site' : d.collected + ' left', text: String(d.last || ''), done: true}].concat(Array.isArray(base.lines) ? base.lines : []);
   base.left = d.complete ? 'Left site ' + d.short + ' · nothing still to come on site' : d.collected + ' left ' + d.short + ' · ' + d.remaining + ' still to leave';
   if (d.complete) { base.status = 'Left site · ' + d.short; base.statusColour = '#7fffc1'; if (base.stage) base.stage = Object.assign({}, base.stage, {label: 'Left site'}); } } } catch (e) {}
 return base;
};
W.Departed1229 = Object.freeze({snapshot, ref, board, keys, keysIn, short, describe, badge, rowHtml});
})(window);
</script>
<style id="departed1229-style">
/* v12.29 - the departed icon: a ↗ on a green disc, the Map explorer's own departure colours */
.mk .leftx1229{position:absolute;left:-6px;bottom:-7px;width:14px;height:14px;border-radius:50%;background:#075239;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;line-height:1;font-style:normal;box-shadow:0 0 0 1.5px #b5ffe0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.mk.mkleft1229:not(.off){opacity:.82;border-style:dashed}
.s1141-pin.s1141-left.gone .s1141-num{opacity:.6}
.dep1229-row{display:inline-block;margin-left:4px;padding:0 6px;border-radius:9px;background:#e4f7ec;color:#08643f;border:1px solid #168958;font-size:.86em;white-space:nowrap}
.dep1229-key{margin:6px 0 2px;font-size:.92em;color:#08643f}
.dep1229-key b{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-right:4px;border-radius:50%;background:#075239;color:#fff;box-shadow:0 0 0 1.5px #b5ffe0;font-size:12px;vertical-align:-3px}
</style>
