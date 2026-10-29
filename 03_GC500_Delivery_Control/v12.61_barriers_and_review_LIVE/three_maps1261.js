<script id="threemaps1261-script">
/* Author: Andrew Fisher. v12.61 - three maps on every Build card: close up, wider area, and the master plan drawing.
   Andrew, 29 Oct 2026: "In build can we show 3 maps 1 to include the drawing location". The v12.47 strip drew one
   wide picture; it now composes the page's own close-up and wider-area pictures (Find it on the map, v11.76) and the
   Demob cards' master plan piece (v12.36, the equipment's icon in a neon ring on the drawing) into one picture, under
   the same lifecycle, caps and cache as before. A reference with no spot on the drawing says so on the third panel. */
(function (W, D) {
'use strict';
const PANEL_W = 336, PANEL_H = 242, GAP = 6;
function load(src, revoke) {
  return new Promise((ok, no) => {
    const im = new Image(); im.decoding = 'async';
    const done = () => { if (revoke) try { URL.revokeObjectURL(src); } catch (e) {} };
    im.onload = () => { done(); ok(im); }; im.onerror = () => { done(); no(new Error('a map picture would not load')); };
    im.src = src;
  });
}
function panel(c, im, x, label) {
  const w = PANEL_W, h = PANEL_H;
  if (im) { const s = Math.max(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s; c.save(); c.beginPath(); c.rect(x, 0, w, h); c.clip(); c.drawImage(im, x + (w - dw) / 2, 0, dw, dh); c.restore(); }
  else { c.fillStyle = '#213e4b'; c.fillRect(x, 0, w, h); }
  c.save(); c.font = '700 20px Inter,"Segoe UI",sans-serif'; const tw = c.measureText(label).width + 20;
  c.fillStyle = 'rgba(16,28,35,.86)'; c.fillRect(x + 8, h - 38, tw, 30); c.fillStyle = '#ffd7b5'; c.textBaseline = 'middle'; c.fillText(label, x + 18, h - 23); c.restore();
}
async function drawing(key) {
  try {
    const M = W.DemobMap1236; if (!M || typeof M.spot !== 'function' || typeof M.draw !== 'function') return null;
    const s = M.spot(key); if (!s) return null;
    const url = await M.draw(key + '|' + s.fx + ',' + s.fy + (s.exact ? '' : ',a'));
    return url ? await load(url, true) : null;
  } catch (e) { return null; }
}
W.composeMaps1261 = async function (L, key, isCurrent) {
  const F = W.Find1176; if (!F || !Array.isArray(F.VIEWS)) throw new Error('Find it on the map is unavailable');
  const close = F.VIEWS.find(v => v.key === 'close'), wide = F.VIEWS.find(v => v.key === 'wide');
  if (!close || !wide) throw new Error('Native map views unavailable');
  const [a, b, d] = await Promise.all([
    F.picture(L, close).then(p => load(p.dataUrl)).catch(() => null),
    F.picture(L, wide).then(p => load(p.dataUrl)).catch(() => null),
    drawing(key)]);
  if (!isCurrent()) return null;
  if (!a && !b && !d) throw new Error('No map picture could be drawn');
  const canvas = D.createElement('canvas'); canvas.width = PANEL_W * 3 + GAP * 2; canvas.height = PANEL_H;
  const c = canvas.getContext('2d'); if (!c) throw new Error('Canvas unavailable');
  c.fillStyle = '#102630'; c.fillRect(0, 0, canvas.width, canvas.height);
  panel(c, a, 0, 'Close up'); panel(c, b, PANEL_W + GAP, 'Wider area'); panel(c, d, (PANEL_W + GAP) * 2, d ? 'On the drawing' : 'Not on the drawing');
  const url = canvas.toDataURL('image/jpeg', .8); canvas.width = canvas.height = 0; return url;
};
})(window, document);
</script>
