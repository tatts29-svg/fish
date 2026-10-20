/* v8.97 - COMPLETION ON THE MAPS. Andrew, 8 Oct 2026: "Need to come up with a clean way to show completions on maps when we search for
   things example buildings. We still want to show but something to highlight completion keeping in reference to same look as how its
   highlighted." Every result keeps its ring, its reference label and, when picked, its stronger ring and pulse. A result that is complete
   gets one small, static green tick on the lower-right edge of its ring (clear of the label at the upper right) and "✓ Complete" on its
   result row and on its card. Complete is the state the Timeline reads: the record's Complete tick AND the Timeline's Finished stage;
   on site or installed alone is not complete, and a Complete tick the Timeline holds for review shows nothing. The accents are scoped to
   the current search or category results (marks); the optional Done layer (v7.82, v7.90) is untouched, and where it is on its badge
   stands and no second tick is drawn. The tick is decorative: the ring stays the tap target (itemAt887 and markAt are unchanged). */
let COMPLETE897 = new Set(), complete897Sig = '';
(() => { const st = document.createElement('style'); st.textContent = '.ok897{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:0 7px;border-radius:999px;background:rgba(31,174,87,.16);border:1px solid #1fae57;color:#6cf0a4;font:700 10.5px/17px Inter,sans-serif;white-space:nowrap;vertical-align:1px}'
  + '.results button .ok897,.findlist button .ok897{float:right;margin:1px 0 0 8px}.findlist button.dim .ok897{opacity:.8}'
  + '#xcard .xc-t .ok897.card{margin-left:4px;align-self:center;flex:none}';
  document.head.appendChild(st); })();
/* the verified set, from the dashboard that opened this page; an older dashboard makes no claim */
function complete897Keys() {
  let w = null; try { w = window.parent && window.parent !== window ? window.parent : null; } catch (e) { return null; }
  if (!w) return null;
  try {
    if (typeof w.gc500CompleteKeys897 === 'function') { const k = w.gc500CompleteKeys897(); return Array.isArray(k) ? k : null; }
  } catch (e) {}
  return null;
}
function complete897Pull() {
  const raw = complete897Keys();
  /* Completion is a current verified reading. If the host becomes unavailable, remove the claim until it can be read again. */
  const keys = Array.isArray(raw) ? [...new Set(raw.filter(k => typeof k === 'string' && k.trim()).map(norm))].sort() : [];
  const sig = JSON.stringify(keys); if (sig === complete897Sig) return;
  complete897Sig = sig; COMPLETE897 = new Set(keys); complete897Sync();
}
function isComplete897(it) { return !!(it && it.cat && it.cat.host === 'trade' && COMPLETE897.has(it.code)); }
function ok897(it, where) { return isComplete897(it) ? `<em class="ok897${where ? ' ' + where : ''}" title="Complete: recorded complete on the record, and Finished on the Timeline">✓ Complete</em>` : ''; }
/* the rows and the card follow the set without a re-render or a camera move */
function complete897Sync() {
  const put = (host, where) => { if (!host) return; const b = host.querySelector('b'); if (!b) return; const code = norm(b.textContent || ''), it = ITEMS.find(x => x.code === code), on = isComplete897(it), el = host.querySelector('.ok897');
    if (on && !el) b.insertAdjacentHTML('afterend', ok897(it, where)); else if (!on && el) el.remove(); };
  document.querySelectorAll('#results [data-code], #findList [data-code]').forEach(b => put(b, ''));
  const card = $('xcard'); if (card && !card.hidden) {
    if (typeof window.GC500ExplorerRefreshCard897 === 'function') window.GC500ExplorerRefreshCard897();
    else put(card.querySelector('.xc-t'), 'card');
  }
  requestPaint();
}
/* one small static tick on the ring's lower-right edge; a dark rim so it reads on a green ring (toilets) as well as any other colour */
function tick897(ctx, x, y, r, it) {
  if (!isComplete897(it) || (DONE782_ON && DONE782.has(it.code))) return;   /* the Done layer's own badge already marks this unit */
  const k = Math.SQRT1_2, b = 6.5 * dpr, tx = x + r * k, ty = y + r * k;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(15,13,12,.92)'; ctx.beginPath(); ctx.arc(tx, ty, b + 1.6 * dpr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1fae57'; ctx.beginPath(); ctx.arc(tx, ty, b, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.9 * dpr; ctx.beginPath(); ctx.moveTo(tx - b * .46, ty + b * .04); ctx.lineTo(tx - b * .1, ty + b * .4); ctx.lineTo(tx + b * .5, ty - b * .36); ctx.stroke();
  ctx.restore();
}
window.GC500Explorer897 = Object.freeze({keys: () => [...COMPLETE897], isComplete: code => COMPLETE897.has(norm(String(code || ''))), pull: complete897Pull,
  get state() { return {n: COMPLETE897.size, doneLayer: DONE782_ON, ticked: marks.filter(m => isComplete897(m.it) && m.it.places.length && !(DONE782_ON && DONE782.has(m.it.code))).map(m => m.it.code)}; }});
