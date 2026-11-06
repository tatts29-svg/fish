<script id="demobqty1235-script">
/* Author: Andrew Fisher. v12.35 - a reference that has left in full keeps its quantity on the Demob tab.
   Found recording EQ0002 (the 61 ft knuckle boom, 1300290) on 26 Oct 2026: for an added reference the Demob plan counts the
   quantity from its supplied row, which follows the complete tick, and every departure takes the complete tick off. So a
   departed added reference read "Nothing to collect" on the pick-up list and "Departure record needs review" in its departure
   reading, though its departure is on the record. units816 (used only by the Demob plan) now keeps the quantity the
   reference's own departure recorded, when it has left in full and nothing else is counted. A reference on site, and every
   reference whose quantity still counts, is untouched. Read only. */
(function (W) {
  'use strict';
  if (typeof units816 !== 'function') return;
  const before = units816, at = v => Number.isFinite(Date.parse(v)) ? Date.parse(v) : null;
  const evt = t => { try { return EVT816.test(String(t).trim()); } catch (e) { return false; } };
  const tank = t => { try { return TANK816.test(t); } catch (e) { return false; } };
  /* what the reference's own departures recorded since it last arrived, when the last of them took the whole reference */
  function left(key) {
    const d = deliveryOf(key); if (!d || (d.state !== 'in transit' && d.state !== 'not on site')) return null;
    const h = (d.history || []).filter(x => x && at(x.at) !== null).slice().sort((x, y) => at(x.at) - at(y.at));
    const arrived = h.filter(x => !x.collection996 && x.state === 'on site').pop(); if (!arrived) return null;
    const cs = h.filter(x => { const c = x.collection996; return c && c.version === 1 && c.kind === 'collection' && c.arrivalAt === arrived.at && at(x.at) > at(arrived.at); });
    if (!cs.length || cs[cs.length - 1].collection996.complete !== true) return null;
    const m = new Map();
    cs.forEach(x => (x.collection996.items || []).forEach(i => { const ty = String(i.type || '').trim(), n = Number(i.n); if (ty && n > 0) m.set(ty, (m.get(ty) || 0) + n); }));
    return m.size ? [...m].map(([type, n]) => ({type, n, unknown: false, evt: evt(type), tank: tank(type), left1235: true})) : null;
  }
  units816 = function (a) {
    const u = before.apply(this, arguments);
    try {
      if (!a || !a.key || u.some(x => x.unknown) || u.reduce((s, x) => s + (Number(x.n) || 0), 0) > 0) return u;
      return left(a.key) || u;
    } catch (e) { return u; }
  };
  Object.assign(units816, before);
  try { if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map) RENDER_MEMO.delete('demob816'); } catch (e) {}
  W.DemobQty1235 = Object.freeze({left});
})(window);
</script>
