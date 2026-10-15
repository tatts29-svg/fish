/* Author: Andrew Fisher. Milestone banner (v10.26): the v10.25 celebration fired over the area card on the Work
   progress board, which sits a screen or more below the top of the Today tab on a desktop and nearly two on a phone,
   and then marked itself seen - so it was never seen. Now: a banner at the top of the Today tab, there every time an
   area stands at 100%, with Show me (scrolls to the card and bursts over it), the summary and the A4 print; and the
   first-time burst fills the whole screen, fixed to the viewport, only when the Today tab is actually showing - if
   it is not, the moment stays unseen and plays the next time Today draws. Nothing here writes to the record. */
(function () {
'use strict';
const W = window;
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c])); }
function dmy(iso){ try { const d = new Date(iso); if (isNaN(d)) return ''; return d.toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane'}); } catch (e) { return ''; } }
function reduced(){ return !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches); }
/* the Today tab is showing: its pane is laid out and the document is in front */
function todayShowing(){ const p = document.getElementById('pane-today'); return !!p && p.offsetParent !== null && !document.hidden && (typeof state === 'undefined' || !state.tab || state.tab === 'today'); }

/* ------------------------------------------------------------------------------------------------ the banner */
function banner(all, board){
 const old = document.getElementById('ms1026'); if (old) old.remove();
 const pane = document.getElementById('pane-today'); if (!pane) return null;
 const reached = all.filter(f => f.reached); if (!reached.length) return null;
 const html = `<section id="ms1026" class="ms1026" aria-label="Milestones reached">
 <div class="ms1026-head"><span class="ms1026-flag" aria-hidden="true">🏁</span><b>${reached.length} area${reached.length === 1 ? '' : 's'} at 100%</b><span class="w">every reference ticked complete on the record</span></div>
 <ul class="ms1026-list">${reached.map(f => `<li data-ms1026="${esc(f.id)}"><span class="ms1026-pct">100%</span><span class="ms1026-txt"><b>${esc(f.name)}</b><span class="w">${f.complete} of ${f.total} complete${f.reachedAt ? ' · reached ' + esc(dmy(f.reachedAt)) : ''}${f.days != null ? ' · ' + f.days + ' day' + (f.days === 1 ? '' : 's') + ' start to finish' : ''}</span></span><span class="ms1026-acts"><button type="button" class="btn sm" data-ms1026-show="${esc(f.id)}">Show me</button><button type="button" class="btn sm" data-ms1026-sum="${esc(f.slug)}">Summary</button><a class="btn sm" href="#print/milestone/${esc(f.slug)}">Print (A4)</a></span></li>`).join('')}</ul>
 </section>`;
 const before = pane.querySelector('.staff988') || null, after = pane.querySelector('.acts793');
 if (before) before.insertAdjacentHTML('beforebegin', html); else if (after) after.insertAdjacentHTML('afterend', html); else pane.insertAdjacentHTML('afterbegin', html);
 const sec = document.getElementById('ms1026');
 sec.querySelectorAll('[data-ms1026-show]').forEach(b => { b.onclick = e => { e.preventDefault(); e.stopPropagation(); const id = b.dataset.ms1026Show;
  /* the board redraws on every live poll, so the card is looked up again at the moment of the burst */
  const find = () => document.querySelector(`#gc500-work-board840 .tw840-card[data-tw840-area="${CSS.escape(id)}"]`);
  const card = find();
  if (card) { card.scrollIntoView({block: 'center', behavior: reduced() ? 'auto' : 'smooth'}); setTimeout(() => { const c = find(); if (c) { c.classList.add('ms1025-glow'); setTimeout(() => c.classList.remove('ms1025-glow'), 2600); screenBurst(1, c.getBoundingClientRect()); } else screenBurst(1); }, reduced() ? 50 : 600); }
  else screenBurst(1); }; });
 sec.querySelectorAll('[data-ms1026-sum]').forEach(b => { b.onclick = e => { e.preventDefault(); e.stopPropagation(); const det = document.querySelector(`#ms1025 .ms1025-area[data-ms1025="${CSS.escape(b.dataset.ms1026Sum)}"]`);
  if (det) { det.open = true; det.scrollIntoView({block: 'start', behavior: reduced() ? 'auto' : 'smooth'}); } }; });
 return sec;
}

/* ----------------------------------------------------------------------------------------- the screen burst
   A canvas fixed over the whole viewport, pointer-events none, bursts across the upper two thirds of the screen,
   about five seconds, then gone. Reduced motion: the banner glows instead. */
function screenBurst(n, over){
 if (reduced()) { const b = document.getElementById('ms1026'); if (b) { b.classList.add('ms1025-glow'); setTimeout(() => b.classList.remove('ms1025-glow'), 2600); } return true; }
 const old = document.querySelector('canvas.ms1026-screen'); if (old) old.remove();
 const c = document.createElement('canvas'); c.className = 'ms1026-screen'; document.body.appendChild(c);
 const dpr = Math.min(2, W.devicePixelRatio || 1);
 /* over a card: the canvas sits on the part of the card that is on the screen, fixed to the viewport, so a redraw of
    the board under it does not cut the burst short */
 let w = Math.max(200, W.innerWidth || 320), h = Math.max(200, W.innerHeight || 480);
 if (over) { const L = Math.max(0, over.left), T = Math.max(0, over.top), R = Math.min(W.innerWidth, over.right), B = Math.min(W.innerHeight, over.bottom); w = Math.max(120, R - L); h = Math.max(120, B - T); c.style.left = L + 'px'; c.style.top = T + 'px'; c.style.right = 'auto'; c.style.bottom = 'auto'; }
 c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
 const ctx = c.getContext('2d'); if (!ctx) { c.remove(); return false; } ctx.scale(dpr, dpr);
 const colours = ['#ff6a13', '#ffd166', '#ffffff', '#06d6a0', '#118ab2', '#ef476f'];
 const parts = [], start = performance.now(), life = 4800, big = Math.min(w, h) / 420;
 const burst = (x, y, k, delay, c1) => { for (let i = 0; i < k; i++) { const a = Math.random() * Math.PI * 2, v = (2.2 + Math.random() * 4.2) * Math.max(0.8, big); parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.4, r: (2.4 + Math.random() * 3) * Math.max(0.9, big), c: c1 && i % 3 === 0 ? c1 : colours[i % colours.length], born: start + delay, ttl: 1700 + Math.random() * 1300}); } };
 const rounds = Math.max(1, Math.min(3, n || 1));
 for (let r = 0; r < rounds; r++) { const d0 = r * 1500;
  burst(w * 0.5, h * 0.30, 140, d0, '#ff6a13'); burst(w * 0.22, h * 0.26, 100, d0 + 350, '#ffd166'); burst(w * 0.78, h * 0.28, 100, d0 + 650, '#06d6a0'); burst(w * 0.5, h * 0.16, 120, d0 + 1000, '#ffffff'); burst(w * 0.34, h * 0.44, 90, d0 + 1300, '#ef476f'); burst(w * 0.66, h * 0.42, 90, d0 + 1550, '#118ab2'); }
 const tick = now => {
  ctx.clearRect(0, 0, w, h); let alive = false;
  parts.forEach(p => { const age = now - p.born; if (age < 0 || age > p.ttl) return; alive = true; const k = age / 16, k0 = Math.max(0, k - 3); const x = p.x + p.vx * k, y = p.y + p.vy * k + 0.012 * k * k, x0 = p.x + p.vx * k0, y0 = p.y + p.vy * k0 + 0.012 * k0 * k0; const al = 1 - age / p.ttl; ctx.globalAlpha = Math.max(0, al) * 0.55; ctx.strokeStyle = p.c; ctx.lineWidth = p.r * 0.9; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = Math.max(0, al); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, p.r * (0.6 + al * 0.6), 0, Math.PI * 2); ctx.fill(); });
  ctx.globalAlpha = 1;
  if (alive && now - start < life + rounds * 1500 + 1500) requestAnimationFrame(tick); else c.remove();
 };
 requestAnimationFrame(tick);
 return true;
}

/* --------------------------------------------------------------------- called by v10.25's after() in place of its burst
   fire: the areas this browser has not yet seen at their current 100% moment; all: every area's facts; board: the card board */
let retry = null;
function boardIsToday(){ const a = typeof state !== 'undefined' && state ? state.asOf : ''; return !/^\d{4}-\d{2}-\d{2}$/.test(a || '') || (typeof todayIso === 'function' && a === todayIso()); }
/* the unseen 100% moments right now, read again from the record so a tick between the draw and the play counts */
function unseenNow(){ if (!W.MS1025 || !boardIsToday()) return []; const s = MS1025.seen(); return MS1025.allFacts().filter(f => f.reached && s[f.id] !== (f.reachedAt || 'reached')).map(f => ({f})); }
function play(fire){
 fire.forEach(({f}) => MS1025.markSeen(f.id, f.reachedAt || 'reached'));
 const sec = document.getElementById('ms1026');
 if (sec) { sec.classList.add('ms1026-new'); sec.classList.add('ms1025-glow'); setTimeout(() => sec.classList.remove('ms1025-glow'), 2600); }
 setTimeout(() => screenBurst(fire.length), 300);
}
/* Today drew while it was not in front (the page opens on another tab, the startup screen is still up, the window is
   in the background): look every half second for up to two minutes, and play the moment the tab is showing */
function armRetry(){
 if (retry) clearInterval(retry); let n = 0;
 retry = setInterval(() => { n++; if (!todayShowing()) { if (n > 240) { clearInterval(retry); retry = null; } return; } clearInterval(retry); retry = null; const fire = unseenNow(); if (fire.length) play(fire); }, 500);
}
function ms1026After(o){
 const all = (o && o.all) || [], board = o && o.board, fire = (o && o.fire) || [];
 banner(all, board);
 if (!fire.length || !W.MS1025) return;
 if (!todayShowing()) { armRetry(); return; } /* stays unseen until the Today tab is in front */
 play(fire);
}
W.ms1026After = ms1026After;
W.MS1026 = {banner, screenBurst, todayShowing, unseenNow};
})();
