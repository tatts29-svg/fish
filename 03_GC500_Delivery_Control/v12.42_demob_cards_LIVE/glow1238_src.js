<style id="glow1238-style">
/* v12.38 - the demob progress lit up: the ring and the line glow, today's point pulses, and five stars light as the demob
   completes (one for every 20%) */
#pane-demob .pg1238{position:relative;display:grid;grid-template-columns:minmax(250px,330px) 1fr;gap:16px;margin:12px 0 4px;padding:16px;border:1px solid #ff8a3a40;border-radius:22px;background:radial-gradient(120% 140% at 0% 0%,#2a1a10 0%,#10161b 55%),#10161b;color:#eef6f8;box-shadow:0 0 0 1px #ff8a3a18,0 18px 40px #0009,0 0 40px #ff8a3a22;overflow:hidden;font-family:Inter,Arial,sans-serif}
#pane-demob .pg1238::before{content:"";position:absolute;inset:-40% -10% auto auto;width:60%;height:120%;background:radial-gradient(closest-side,#18e8ff22,transparent);pointer-events:none;animation:dr1238 9s ease-in-out infinite alternate}
@keyframes dr1238{to{transform:translate(-30%,20%)}}
#pane-demob .pg1238 .lf1238{position:relative;display:grid;gap:12px;align-content:start}
#pane-demob .pg1238 .rt1238{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center}
#pane-demob .pg1238 .rg1238{position:relative;width:118px;height:118px}
#pane-demob .pg1238 .rg1238 svg{width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
#pane-demob .pg1238 .rg1238 .tr{stroke:#ffffff14}
#pane-demob .pg1238 .rg1238 .ar{filter:drop-shadow(0 0 6px #ff8a3a) drop-shadow(0 0 14px #ff8a3a88);animation:rd1238 1.6s cubic-bezier(.2,.8,.2,1) both}
@keyframes rd1238{from{stroke-dashoffset:var(--c)}}
#pane-demob .pg1238 .rg1238 b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:1px;font:900 30px/1 Inter,Arial,sans-serif;text-shadow:0 0 16px #ff8a3aaa}
#pane-demob .pg1238 .rg1238 b small{font-size:14px;color:#ffb37a}
#pane-demob .pg1238 h3{margin:0 0 4px;color:#ffb37a;font:900 12px/1 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}
#pane-demob .pg1238 .st1238 p{margin:3px 0;color:#d6e3e8;font:600 13px/1.3 Inter,Arial,sans-serif}
#pane-demob .pg1238 .st1238 p b{color:#fff;font-weight:900}
#pane-demob .pg1238 .sr1238{display:flex;align-items:center;gap:7px;flex-wrap:nowrap;padding:10px 12px;border-radius:16px;background:#0a1216cc;box-shadow:inset 0 0 0 1px #ffd76a2e}
#pane-demob .pg1238 .sr1238 svg{width:30px;height:30px;overflow:visible}
#pane-demob .pg1238 .sr1238 .s1238 .bg{fill:#26343a}
#pane-demob .pg1238 .sr1238 .s1238 .fg{fill:url(#sg1238)}
#pane-demob .pg1238 .sr1238 .s1238.lit svg{filter:drop-shadow(0 0 6px #ffd24a) drop-shadow(0 0 14px #ffb020aa)}
#pane-demob .pg1238 .sr1238 .s1238.next svg{animation:st1238 1.8s ease-in-out infinite}
@keyframes st1238{0%,100%{filter:drop-shadow(0 0 2px #ffd24a66)}50%{filter:drop-shadow(0 0 10px #ffd24a)}}
#pane-demob .pg1238 .sr1238 .s1238{flex:none;display:inline-grid}
#pane-demob .pg1238 .sr1238 .sw1238{flex:1 1 140px;color:#ffe7a8;font:800 12.5px/1.3 Inter,Arial,sans-serif}
#pane-demob .pg1238 .sr1238 .sw1238 small{display:block;color:#a9b9bf;font-weight:600}
#pane-demob .pg1238 .vd1238{display:inline-block;padding:7px 11px;border-radius:999px;font:900 12px/1 Inter,Arial,sans-serif}
#pane-demob .pg1238 .vd1238.ok{background:#19d27a22;color:#7ff0b4;box-shadow:0 0 14px #19d27a44}
#pane-demob .pg1238 .vd1238.no{background:#ff4d5e1f;color:#ffb0b8;box-shadow:0 0 14px #ff4d5e33}
#pane-demob .pg1238 .ch1238{position:relative;min-width:0}
#pane-demob .pg1238 .ch1238 svg{display:block;width:100%;height:auto;overflow:visible}
#pane-demob .pg1238 .ch1238 .ln{stroke-dasharray:var(--l);animation:ln1238 1.8s cubic-bezier(.2,.8,.2,1) both}
@keyframes ln1238{from{stroke-dashoffset:var(--l)}to{stroke-dashoffset:0}}
#pane-demob .pg1238 .ch1238 .pc{animation:pc1238 3s linear infinite}
@keyframes pc1238{to{stroke-dashoffset:-22}}
#pane-demob .pg1238 .ch1238 .pu{transform-box:fill-box;transform-origin:center;animation:pp1238 2s ease-out infinite}
#pane-demob .pg1238 .ch1238 .pu.b{animation-delay:1s}
@keyframes pp1238{0%{transform:scale(1);opacity:.9}100%{transform:scale(3.4);opacity:0}}
#pane-demob .pg1238 .kl1238{display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;color:#a9b9bf;font:700 11.5px/1 Inter,Arial,sans-serif}
#pane-demob .pg1238 .kl1238 i{display:inline-block;width:18px;height:4px;margin-right:6px;border-radius:2px;background:#ff8a3a;box-shadow:0 0 8px #ff8a3a;vertical-align:middle}
#pane-demob .pg1238 .kl1238 i.pace{background:repeating-linear-gradient(90deg,#9ff6ff 0 5px,transparent 5px 9px);box-shadow:0 0 6px #18e8ff88}
@media (max-width:820px){#pane-demob .pg1238{grid-template-columns:1fr;padding:13px}#pane-demob .pg1238 .rg1238{width:100px;height:100px}}
@media (prefers-reduced-motion:reduce){#pane-demob .pg1238 *,#pane-demob .pg1238::before{animation:none!important}}
@media print{#pane-demob .pg1238{box-shadow:none}}
</style>
<script id="glow1238-script">
/* Author: Andrew Fisher. v12.38 - the demob progress lit up (Andrew, 26 Oct 2026: "the grapgh i want light of even the 5 stars we
   need to go over and beyond"). The same figures as v12.36's demob complete card (DemobProgress996.whole: units off site of the
   demob units, references fully gone, the demob days and the even pace to the last day), drawn with a glowing ring and line,
   today's point pulsing, and five stars that light as the demob completes - one for every 20% off site, the next one glowing as
   it fills. Read only. */
(function (W) {
'use strict';
const D = W.document;
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STAR = 'M12 2.4l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z';
function figures() {
 let M = null, w = null; try { M = demob816(); w = DemobProgress996.whole(M, todayIso()); } catch (x) { return null; }
 if (!w || !w.readings) return null;
 const n = a => (a || []).reduce((t, u) => t + (Number(u.n) || 0), 0);
 let req = 0, col = 0; const byDay = new Map();
 w.readings.forEach(x => { req += n(x.required); col += n(x.collected); (x.events || []).forEach(ev => { const d = String(ev.date || '').slice(0, 10); if (d) byDay.set(d, (byDay.get(d) || 0) + n(ev.items)); }); });
 if (!req) return null;
 const days = (M.days || []).slice(), today = todayIso(), ti = days.indexOf(today), N = days.length || 1;
 const pct = Math.min(100, col / req * 100), left = ti >= 0 ? N - ti : days.filter(d => d >= today).length;
 const pace = ti >= 0 ? (ti + 1) / N * 100 : null, need = left > 0 ? (100 - pct) / left : null;
 const pts = []; let run = 0; [...byDay.keys()].filter(d => d < days[0]).forEach(d => { run += byDay.get(d); });
 days.forEach((d, i) => { if (d > today) return; run += byDay.get(d) || 0; pts.push([i, Math.min(100, run / req * 100)]); });
 return {w, req, col, pct, days, today, ti, N, pace, need, pts};
}
/* the same figures, day by day, for the day cards: how complete the demob was by the end of each day, and what that day moved.
   Units off site before the first demob day count from the start. A day still to come has no figure of its own. */
function daily() {
 const F = figures(); if (!F) return null;
 const byDay = new Map(), n = a => (a || []).reduce((t, u) => t + (Number(u.n) || 0), 0);
 F.w.readings.forEach(x => (x.events || []).forEach(ev => { const d = String(ev.date || '').slice(0, 10); if (d) byDay.set(d, (byDay.get(d) || 0) + n(ev.items)); }));
 let run = 0; [...byDay.keys()].filter(d => d < F.days[0]).forEach(d => { run += byDay.get(d); });
 const out = new Map();
 F.days.forEach(d => { if (d > F.today) { out.set(d, {d, ahead: true, cum: Math.min(100, F.col / F.req * 100), add: 0, units: 0}); return; }
  const was = run; run += byDay.get(d) || 0; out.set(d, {d, ahead: false, today: d === F.today, was: Math.min(100, was / F.req * 100), cum: Math.min(100, run / F.req * 100), add: Math.min(100, run / F.req * 100) - Math.min(100, was / F.req * 100), units: byDay.get(d) || 0, off: run}); });
 return {req: F.req, col: F.col, pct: F.pct, today: F.today, days: out};
}
const fmtEnd = d => { const f = new Date(d + 'T12:00:00Z'); return DOW[f.getUTCDay()] + ' ' + f.getUTCDate() + ' ' + MON[f.getUTCMonth()]; };
function starsHtml(pct) {
 const out = []; let next = -1;
 for (let i = 0; i < 5; i++) { const lo = i * 20, fill = Math.max(0, Math.min(1, (pct - lo) / 20)); if (fill < 1 && next < 0) next = i;
  out.push('<span class="s1238' + (fill >= 1 ? ' lit' : '') + (i === next ? ' next' : '') + '" title="' + (lo + 20) + '% off site"><svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="sc1238_' + i + '"><rect x="0" y="0" width="' + (24 * fill).toFixed(2) + '" height="24"/></clipPath></defs><path class="bg" d="' + STAR + '"/><path class="fg" d="' + STAR + '" clip-path="url(#sc1238_' + i + ')"/></svg></span>'); }
 const lit = Math.floor(pct / 20), nextAt = Math.min(100, (lit + 1) * 20);
 return '<div class="sr1238" role="img" aria-label="' + lit + ' of 5 stars: one for every 20 percent of the demob off site"><svg width="0" height="0" style="position:absolute"><defs><linearGradient id="sg1238" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".5" stop-color="#ffd24a"/><stop offset="1" stop-color="#ff9b00"/></linearGradient></defs></svg>'
  + out.join('') + '<span class="sw1238">' + (lit >= 5 ? 'Five stars · the demob is complete' : lit + ' of 5 stars') + '<small>' + (lit >= 5 ? 'Every unit off site' : 'Next star at ' + nextAt + '% off site · ' + (nextAt - pct).toFixed(1) + '% to go') + '</small></span></div>';
}
function html(F) {
 const {w, req, col, pct, days, today, ti, N, pace, need, pts} = F, shown = pct < 10 ? pct.toFixed(1) : pct >= 99 && pct < 100 ? (Math.floor(pct * 10) / 10).toFixed(1) : Math.round(pct).toString(); /* never 100% while a unit is still on site */
 const W0 = 680, H0 = 250, L = 42, R = 18, T = 16, B = 34, X = i => L + (i + 1) / N * (W0 - L - R), Y = v => T + (1 - v / 100) * (H0 - T - B), X0 = L;
 const grid = [0, 25, 50, 75, 100].map(v => '<line x1="' + L + '" x2="' + (W0 - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="#ffffff14"/><text x="' + (L - 7) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" fill="#8fa8b2" font-size="10.5" font-weight="700" text-anchor="end">' + v + '%</text>').join('');
 const labs = days.map((d, i) => { const f = new Date(d + 'T12:00:00Z'), lab = DOW[f.getUTCDay()].slice(0, 1) + ' ' + f.getUTCDate(), on = d === today;
  return '<text x="' + X(i).toFixed(1) + '" y="' + (H0 - 11) + '" fill="' + (on ? '#ffb37a' : '#8fa8b2') + '" font-size="' + (on ? 11.5 : 10) + '" font-weight="' + (on ? 900 : 700) + '" text-anchor="middle"' + (on ? ' style="filter:drop-shadow(0 0 4px #ff8a3a)"' : '') + '>' + lab + '</text>'; }).join('');
 const paceLen = Math.hypot(X(N - 1) - X0, Y(100) - Y(0));
 const paceLine = '<line class="pc" x1="' + X0 + '" y1="' + Y(0).toFixed(1) + '" x2="' + X(N - 1).toFixed(1) + '" y2="' + Y(100).toFixed(1) + '" stroke="#9ff6ff" stroke-opacity=".75" stroke-width="2" stroke-dasharray="7 4" filter="url(#gp1238)"/>';
 const P = [[X0, Y(0)]].concat(pts.map(p => [X(p[0]), Y(p[1])])), path = pts.length ? 'M' + P.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') : '';
 let len = 0; for (let i = 1; i < P.length; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
 const last = pts[pts.length - 1];
 const area = path ? '<path d="' + path + ' L' + X(last[0]).toFixed(1) + ' ' + Y(0).toFixed(1) + ' Z" fill="url(#ga1238)"/>' : '';
 const line = path ? '<path class="ln" d="' + path + '" fill="none" stroke="url(#gl1238)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" filter="url(#gf1238)" style="--l:' + Math.ceil(len + 2) + '"/>' : '';
 const dot = last ? (() => { const cx = X(last[0]).toFixed(1), cy = Y(last[1]).toFixed(1);
  return '<circle class="pu" cx="' + cx + '" cy="' + cy + '" r="6" fill="none" stroke="#ff8a3a" stroke-width="2"/><circle class="pu b" cx="' + cx + '" cy="' + cy + '" r="6" fill="none" stroke="#ffd24a" stroke-width="2"/><circle cx="' + cx + '" cy="' + cy + '" r="7" fill="#ff8a3a" stroke="#fff" stroke-width="2.5" filter="url(#gf1238)"/>'
   + '<text x="' + (+cx + 12) + '" y="' + (+cy - 10) + '" fill="#fff" font-size="15" font-weight="900" style="filter:drop-shadow(0 0 6px #ff8a3a)">' + shown + '%</text>'; })() : '';
 const todayLine = ti >= 0 ? '<line x1="' + X(ti).toFixed(1) + '" x2="' + X(ti).toFixed(1) + '" y1="' + T + '" y2="' + (H0 - B) + '" stroke="#ffb37a66" stroke-dasharray="2 4"/>' : '';
 const defs = '<defs><linearGradient id="gl1238" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6a13"/><stop offset="1" stop-color="#ffd24a"/></linearGradient>'
  + '<linearGradient id="ga1238" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a3a" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></linearGradient>'
  + '<filter id="gf1238" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
  + '<filter id="gp1238" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
 const svg = '<svg viewBox="0 0 ' + W0 + ' ' + H0 + '" role="img" aria-label="' + e(shown + ' percent of the demob units off site by day ' + (ti + 1) + ' of ' + N + '; the dashed line is the even pace to finish on the last demob day') + '" style="--pl:' + Math.ceil(paceLen) + '">' + defs + grid + todayLine + paceLine + area + line + dot + labs + '</svg>';
 const C = 2 * Math.PI * 50, off = C * (1 - pct / 100);
 const ring = '<div class="rg1238"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="gr1238" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd24a"/><stop offset="1" stop-color="#ff6a13"/></linearGradient></defs><circle class="tr" cx="60" cy="60" r="50" fill="none" stroke-width="12"/><circle class="ar" cx="60" cy="60" r="50" fill="none" stroke="url(#gr1238)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" style="--c:' + C.toFixed(1) + '"/></svg><b>' + shown + '<small>%</small></b></div>';
 const end = days.length ? fmtEnd(days[days.length - 1]) : '', ahead = pace != null && pct >= pace;
 const verdict = pace == null ? '' : '<span class="vd1238 ' + (ahead ? 'ok' : 'no') + '">' + (ahead ? 'On pace to finish by ' + e(end) : 'Even pace is ' + Math.round(pace) + '% by tonight') + '</span>';
 return '<section class="pg1238" aria-labelledby="pgh1238"><div class="lf1238"><div class="rt1238">' + ring + '<div class="st1238"><h3 id="pgh1238">Demob complete</h3>'
  + '<p><b>' + col + ' of ' + req + '</b> units off site</p><p><b>' + w.completed + ' of ' + w.total + '</b> references fully gone</p>'
  + (ti >= 0 ? '<p>Day <b>' + (ti + 1) + ' of ' + N + '</b> · finishes <b>' + e(end) + '</b></p>' : '')
  + (need != null && need > 0 ? '<p><b>' + need.toFixed(1) + '%</b> a day from here finishes on time</p>' : '') + '</div></div>'
  + starsHtml(pct) + verdict + '</div>'
  + '<div class="ch1238">' + svg + '<div class="kl1238"><span><i></i>Off site so far</span><span><i class="pace"></i>Even pace to finish by ' + e(end) + '</span></div></div></section>';
}
function progress() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 const card = pane.querySelector('.dmday816'); if (!card) return;
 const F = figures(), old = card.querySelector('.pg1238'); if (!F) { if (old) old.remove(); return; }
 const sig = [F.col, F.req, F.w.completed, F.w.total, F.today].join('|');
 if (old && old.dataset.sig === sig && old === card.firstElementChild) return;
 const tmp = D.createElement('div'); tmp.innerHTML = html(F); const sec = tmp.firstElementChild; sec.dataset.sig = sig;
 if (old && old.dataset.sig === sig) { if (old !== card.firstElementChild) card.insertBefore(old, card.firstElementChild); return; }
 if (old) old.replaceWith(sec); else card.insertBefore(sec, card.firstElementChild);
 if (sec !== card.firstElementChild) card.insertBefore(sec, card.firstElementChild);
}
if (typeof renderDemob816 === 'function') { const before = renderDemob816; renderDemob816 = function () { const v = before.apply(this, arguments); try { progress(); } catch (x) {} return v; }; Object.assign(renderDemob816, before); }
W.Glow1238 = Object.freeze({figures, daily, progress, starsHtml, release: 'v12.42'});
try { const p = D.getElementById('pane-demob'); if (p && !p.hidden && p.querySelector('.dmday816')) progress(); } catch (x) {}
})(window);
</script>
