<script id="departed1232-script">
/* Author: Andrew Fisher. v12.32 - the departed stamp. Andrew, 26 Oct 2026: "we create a departed stamp some how please"; "Need to
   update everywhere"; "I want asset numbers and known size and dimensions please".
   A reference whose departure record (Departure1211, read through Departed1229's one-scan-per-change snapshot) has every unit
   gone wears a DEPARTED ink stamp with the date and time it left:
     - on the Demob pick-up list, in its status cell (beside the green light);
     - at the top of its drawer, with what left (units, asset numbers), when and who recorded it;
     - and everywhere the page puts a reference's state into words (search, the finder, unit lines, the driver card, the light's
       title), it reads "Departed" with the time instead of "In transit". Only the words change: the light, its colour, the
       counts and every rule that reads the state are untouched.
   Read only. */
(function (W) {
  'use strict';
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ok = v => Number.isFinite(Date.parse(v));
  /* a Queensland day and time from a stored stamp */
  function parts(v) {
    if (!ok(v)) return null;
    const d = new Date(Date.parse(v) + 10 * 3600e3);
    return {dow: DOW[d.getUTCDay()], day: d.getUTCDate() + ' ' + MON[d.getUTCMonth()], year: d.getUTCFullYear(), time: String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0')};
  }
  /* the stamp: DEPARTED, the day, the time, and who recorded it */
  function html(o) {
    const p = parts(o && o.at), big = !!(o && o.big);
    const when = p ? p.dow + ' ' + p.day + (big ? ' ' + p.year : '') + ' · ' + p.time : o && o.date ? o.date + ' · time not recorded' : 'time not recorded';
    return '<span class="stamp1232' + (big ? ' big' : '') + '" role="img" aria-label="' + e('Departed ' + when) + '"><b>Departed</b><em>' + e(when) + '</em>' + (o && o.by ? '<small>' + e('recorded by ' + o.by) + '</small>' : '') + '</span>';
  }
  /* what the departure record says left, unit by unit */
  function left(key) {
    let st = null; try { st = W.Departure1211 ? W.Departure1211.status(key) : null; } catch (x) { st = null; }
    if (!st || !st.complete) return null;
    const ev = Array.isArray(st.events) ? st.events : [], last = ev[ev.length - 1] || {};
    const items = [].concat(...ev.map(c => (c.items || []).map(i => { const nos = [].concat(...(i.physicalUnits || []).map(u => u && u.number ? [String(u.number)] : []));
      return (i.n != null ? i.n + ' × ' : '') + (i.type || '') + (nos.length ? ' · ' + nos.join(', ') : ''); })));
    return {at: ok(last.departedAt1211) ? last.departedAt1211 : null, date: last.date || null, by: last.by || '', items};
  }
  /* the drawer: the big stamp under its title, with what left */
  function drawer(a) {
    const dr = document.getElementById('drawer'); if (!dr || !a || !a.key) return;
    const had = dr.querySelector('.dst1232'); if (had) had.remove();
    const g = left(a.key); if (!g) return;
    const box = document.createElement('div'); box.className = 'dst1232';
    box.innerHTML = html({at: g.at, date: g.date, by: g.by, big: true}) + (g.items.length ? '<div class="dsi1232"><b>Left site</b>' + g.items.map(x => '<span>' + e(x) + '</span>').join('') + '</div>' : '');
    const title = dr.querySelector('#drawerTitle'), head = title && (title.closest('header, .dh, .dhead, .drawer-head') || title.parentElement);
    if (head && head.parentNode) head.parentNode.insertBefore(box, head.nextSibling); else dr.prepend(box);
  }
  if (typeof drawerTidy === 'function') { const before = drawerTidy; drawerTidy = function (a) { const v = before.apply(this, arguments); try { drawer(a); } catch (x) {} return v; }; Object.assign(drawerTidy, before); }
  /* everywhere the state is put into words: a reference that has left in full says Departed with the time */
  if (typeof deliveryView === 'function') { const before = deliveryView; deliveryView = function (a) {
    const v = before.apply(this, arguments);
    try { if (!v || (v.semantic !== 'in transit' && v.semantic !== 'not on site')) return v;
      const key = a && a.key ? a.key : a, d = W.Departed1229 ? W.Departed1229.ref(key) : null;
      if (!d || !d.complete) return v;
      const t = d.short || '';
      return Object.assign({}, v, {short: 'Departed' + (t ? ' ' + t : ''), label: 'Departed' + (t ? ' · ' + t : ''), said: 'Departed - left site' + (t ? ' ' + t : ''), departed1232: true});
    } catch (x) { return v; } }; Object.assign(deliveryView, before); }
  W.Stamp1232 = Object.freeze({html, left, drawer});
})(window);
</script>
<style id="departed1232-style">
/* the stamp: double-ruled ink, a slight tilt, the letters spaced like a rubber stamp */
.stamp1232{position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:3px;padding:7px 14px 6px;border:3px double #0f7a43;border-radius:9px;color:#0f7a43;background:radial-gradient(circle at 20% 30%,#0f7a430d 0 2px,transparent 3px) 0 0/9px 9px,#f1fbf5;transform:rotate(-4deg);box-shadow:inset 0 0 0 1px #0f7a4326;text-align:center;line-height:1;white-space:nowrap}
.stamp1232 b{font:italic 900 19px/1 'Barlow Condensed','Arial Narrow',Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;padding-left:.2em}
.stamp1232 em{font:800 11.5px/1.1 Inter,Arial,sans-serif;font-style:normal;letter-spacing:.06em;text-transform:uppercase;font-variant-numeric:tabular-nums}
.stamp1232 small{font:600 9.5px/1.1 Inter,Arial,sans-serif;letter-spacing:.02em;color:#2f6f4c}
.stamp1232.big{padding:10px 22px 9px;border-width:4px;transform:rotate(-5deg)}
.stamp1232.big b{font-size:34px}
.stamp1232.big em{font-size:14px}
.stamp1232.big small{font-size:11px}
#pane-demob td.st1231 .stamp1232{margin:4px 0 2px 6px}
.dst1232{display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;margin:10px 16px 6px;padding:14px 16px;border-radius:12px;background:linear-gradient(120deg,#effaf3,#e3f6ec);border:1px solid #b9e6cc}
.dsi1232{display:flex;flex-direction:column;gap:3px;font:600 12.5px/1.35 Inter,Arial,sans-serif;color:#1f3a2c}
.dsi1232 b{font:800 10.5px/1.2 Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#0f7a43}
#pane-demob .sp1231 .fx1231.none{color:#8a979f;font-style:italic}
@media print{.stamp1232{box-shadow:none}}
</style>
