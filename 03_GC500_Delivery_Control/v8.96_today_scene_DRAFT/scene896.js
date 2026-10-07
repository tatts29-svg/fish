/* Author: Andrew Fisher. v8.96 Today scene. It finishes the staged v8.81 scene on the v8.85 Where we are card:
 * - the forecast for the day shown on Today (the page's own wxfDay and wxKind, and the Today day picker) plays across the plate
 *   behind the five race lights and the whole-job figure; a day with no forecast says so in the page's own words and shows no sky;
 * - each group card carries a faint rendered picture of its equipment, cut from the staged atlas and served as hosted media;
 * - the race-day banner and its clip are parked in a fold at the foot of Today, closed, and nothing plays until Play is pressed;
 * - the sky runs only while the plate is on screen, the page is visible, no dialog or drawer is open, motion is allowed and the
 *   card's Pause is not pressed; reduced motion, Motion off and print hold a still frame. One intersection observer, one mutation
 *   observer, no timers, nothing left behind by a redraw or a change of tab.
 * Presentation only: no record, DATA figure, money or navigation change. The model, the lights and the count-up are v8.85's. */
const Scene896 = (() => {
 'use strict';
 const ATLAS = /*ATLAS896*/{};
 const KINDS = ['sun', 'part', 'cloud', 'fog', 'rain', 'pour', 'storm', 'sleet'];
 /* the WeatherAPI condition codes the page draws (the same list its day cards use); any other code is not a forecast we know */
 const WAPI = new Set([1000, 1003, 1006, 1009, 1030, 1063, 1066, 1069, 1072, 1087, 1114, 1117, 1135, 1147, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1240, 1243, 1246, 1249, 1252, 1255, 1258, 1261, 1264, 1273, 1276, 1279, 1282]);
 let io = null, mo = null, moFrame = 0, visible = false, printing = false, showcaseOpen = false, asked = 0;
 const num = v => typeof v === 'number' && Number.isFinite(v);
 const fn = name => typeof window[name] === 'function'; /* the page's function declarations; its const helpers (todayIso, esc) are read by name */
 const gauge = () => document.querySelector('#pane-today #where885 .w885-gauge');
 const still = () => fn('motionOff') ? !!motionOff() : matchMedia('(prefers-reduced-motion: reduce)').matches;
 /* the card's own Pause (v8.85) settles its figure and lights; the sky follows it */
 const paused = () => { const b = document.getElementById('w885-motion'); return !!b && b.dataset.state === 'paused'; };
 const modal = () => {
  const d = document.getElementById('drawer'); if (d && d.classList.contains('on')) return true;
  if (fn('timeline841ModalOpen')) { try { return !!timeline841ModalOpen(); } catch (e) {} }
  return !!document.querySelector('dialog[open]');
 };
 const inView = node => {
  const r = node.getBoundingClientRect(), m = node.closest('main')?.getBoundingClientRect() || {top: 0, bottom: innerHeight};
  return r.width > 0 && r.height > 0 && r.bottom > Math.max(0, m.top) && r.top < Math.min(innerHeight, m.bottom);
 };
 /* the forecast row the page holds for a day: only that day's own row, with a code the page knows; otherwise there is none */
 function forecast(day) {
  if (!fn('wxfDay') || !fn('wxKind')) return null;
  const f = wxfDay(day);
  if (!f || String(f.date || '').slice(0, 10) !== day || !num(f.code)) return null;
  const known = f.src === 'om' ? (typeof WX_WMO !== 'undefined' && Object.prototype.hasOwnProperty.call(WX_WMO, f.code)) : WAPI.has(Number(f.code));
  if (!known) return null;
  const k = wxKind(f.code, f.src);
  return KINDS.includes(k) ? {f, kind: k} : null;
 }
 /* the weather line: the page's own day line (icon, words, source) when there is a forecast; its own reason when there is none */
 function line(day) {
  const got = forecast(day);
  if (got && fn('wxDayHtml')) {
   const html = wxDayHtml(day, 'line');
   if (html) return {kind: got.kind, html, title: fn('wxWords') ? wxWords(got.f) : ''};
  }
  const why = fn('wxNoneWhy') ? wxNoneWhy(day) : '';
  const past = typeof todayIso === 'function' && day < todayIso();
  return {kind: 'unknown', html: '<strong>' + (past ? 'No forecast' : 'No forecast yet') + '</strong>' + (why ? '<span>' + esc(why) + '</span>' : ''), title: ''};
 }
 const sky = () => '<div class="s896-sky" data-kind="unknown" aria-hidden="true"><i class="s896-yard"></i><i class="s896-glow"></i><i class="s896-shaft"></i>'
  + '<i class="s896-cloud s896-c1"></i><i class="s896-cloud s896-c2"></i><i class="s896-cloud s896-c3"></i><i class="s896-mist"></i><i class="s896-mist s896-mist2"></i>'
  + '<i class="s896-rain s896-r1"></i><i class="s896-rain s896-r2"></i><i class="s896-sleet s896-s1"></i><i class="s896-sleet s896-s2"></i><i class="s896-flash"></i>'
  + '<svg class="s896-bolt" viewBox="0 0 200 400" aria-hidden="true" focusable="false"><path d="M130 4L44 173L98 158L60 276L150 118L103 132L161 4" fill="#e9f8ff"/></svg><i class="s896-shield"></i></div>';
 function weather() {
  const g = gauge(); if (!g) return;
  const day = fn('todayWorkDay841') ? todayWorkDay841() : (typeof todayIso === 'function' ? todayIso() : '');
  const w = line(day), sig = (fn('wxSig') ? wxSig(day) : '') + '|' + day + '|' + w.kind;
  const s = g.querySelector('.s896-sky'); if (s && s.dataset.kind !== w.kind) s.dataset.kind = w.kind;
  if (g.dataset.weather !== w.kind) g.dataset.weather = w.kind;
  const p = g.querySelector('.s896-wx');
  if (p && p.dataset.sig !== sig) {
   p.dataset.sig = sig; p.dataset.kind = w.kind;
   p.innerHTML = '<span class="w885-sr">Weather for ' + esc(fn('fmtDate') ? fmtDate(day) : day) + ': </span>' + w.html;
   if (w.title) p.title = w.title; else p.removeAttribute('title');
  }
 }
 /* the pictures, once: a stylesheet naming each card's picture by its hosted address (the page resolved the media table at load) */
 function atlas() {
  if (document.getElementById('scene896-atlas') || typeof DATA === 'undefined' || !DATA.media) return;
  const rules = [];
  for (const id of Object.keys(ATLAS)) {
   const u = DATA.media[ATLAS[id]]; if (typeof u !== 'string' || !/^[\w./:?=&-]+$/.test(u)) continue;
   if (id === 'yard') rules.push('#pane-today #where885 .s896-yard{background-image:linear-gradient(#07171c8c,#07171c8c),url("' + u + '")}');
   else rules.push('#gc500-work-board840 #tw840-card-' + id + ' .tw846-summary::before{background-image:linear-gradient(#0b1419a6,#0b1419a6),url("' + u + '")}');
  }
  if (!rules.length) return;
  const st = document.createElement('style'); st.id = 'scene896-atlas'; st.textContent = rules.join('\n'); document.head.appendChild(st);
 }
 function basis() {
  const p = document.querySelector('#where885 .w885-basis p');
  if (p && !p.dataset.s896) { p.textContent += ' The equipment pictures behind the group cards and the plate are rendered illustrations, not photographs of this job. The sky on the plate is the forecast for the day shown, from the same source as the Timeline’s day cards; a day with no forecast shows none.'; p.dataset.s896 = '1'; }
 }
 /* Keep the large name above the reading. A native scope line that says exactly the same thing adds no information;
    distinct descriptions stay visible, and the original text remains in the DOM for native redraws and print. */
 function scopes(pane) {
  const clean = s => String(s || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-AU');
  pane.querySelectorAll('.tw848-card').forEach(card => {
   const scope = card.querySelector('.tw840-scope'), title = card.querySelector('.tw846-title');
   if (scope) scope.toggleAttribute('data-s896-duplicate-scope', !!title && !!clean(scope.textContent) && clean(scope.textContent) === clean(title.textContent));
  });
 }
 /* the banner the page draws at the top of Today goes into a fold at the foot, closed unless it was open; the board keeps its own
    wiring (it was wired before the move) and its own clip control; a hidden board stops its own paging and clip */
 function park(pane) {
  const band = pane.querySelector(':scope > .dsnband:not(.s896-park)');
  if (!band) return;
  const d = document.createElement('details'); d.className = 's896-showcase'; d.open = showcaseOpen;
  d.innerHTML = '<summary><span class="s896-showcase-name">Event banner and clip</span><span class="s896-showcase-words">the race-day picture with the pit-lane board, and the clip with sound · nothing plays until Play is pressed</span><span class="s896-showcase-action" aria-hidden="true"><span class="s896-open">Show</span><span class="s896-close">Hide</span></span></summary>';
  while (band.firstChild) d.appendChild(band.firstChild);
  band.appendChild(d); band.classList.add('s896-park'); pane.appendChild(band);
  band.querySelectorAll('video').forEach(v => { v.autoplay = false; v.removeAttribute('autoplay'); try { v.pause(); } catch (e) {} });
  d.addEventListener('toggle', () => {
   showcaseOpen = d.open;
   if (!d.open) d.querySelectorAll('video').forEach(v => { try { v.pause(); } catch (e) {} });
   try { if (typeof BOARD_RUN !== 'undefined' && BOARD_RUN.reconcile) BOARD_RUN.reconcile(); } catch (e) {}
  });
 }
 /* the forecast itself: Today's own draw asks only for the current reading (the banner's), the Timeline asks for the ten-day
    forecast. The plate asks the same way the Timeline does, through the page's own loaders (cached for the hour, shared, one
    fetch at a time), and at most once every ten minutes from here; the answer repaints through wxfPaint, above */
 function ask() {
  if (!fn('wxfLoad') || !fn('wxoLoad') || !fn('wxfPaint') || state.tab !== 'today') return;
  const now = Date.now(); if (now - asked < 600000) return; asked = now;
  try { wxfLoad(wxfPaint); } catch (e) {}
  try { wxoLoad(wxfPaint); } catch (e) {}
 }
 function watch(g) {
  if (!io) io = new IntersectionObserver(entries => { for (const e of entries) if (e.target.isConnected) visible = e.isIntersecting; sync(); }, {threshold: [0, .01]});
  io.disconnect(); visible = inView(g); io.observe(g);
 }
 function sync() {
  const g = gauge(); if (!g) { visible = false; return; }
  g.classList.toggle('s896-run', !still() && !printing && !paused() && visible && !document.hidden && state.tab === 'today' && !modal());
 }
 function mount() {
  const pane = document.getElementById('pane-today'); if (!pane) return;
  park(pane);
  const g = gauge(); if (!g) { if (io) io.disconnect(); visible = false; return; }
  if (!g.querySelector('.s896-sky')) g.insertAdjacentHTML('afterbegin', sky());
  if (!g.querySelector('.s896-wx')) g.insertAdjacentHTML('beforeend', '<p class="s896-wx" data-s896-wx data-kind="unknown"></p>');
  atlas(); basis(); scopes(pane); weather(); watch(g); sync(); ask();
 }
 /* mounted inside the Today redraw, after the Where we are card (v8.85) and its notes (v8.94), before scroll and focus are put back */
 if (fn('renderToday_held')) { const held = renderToday_held; renderToday_held = function (...args) { const r = held.apply(this, args); try { mount(); } catch (err) { console.error('Today scene', err); } return r; }; }
 /* the page repaints its weather plates when a forecast lands; the sky follows in the same call, so nothing polls */
 if (fn('wxfPaint')) { const paint = wxfPaint; wxfPaint = function (...args) { const r = paint.apply(this, args); try { weather(); } catch (err) { console.error('Today scene', err); } return r; }; }
 const resync = () => sync();
 document.addEventListener('visibilitychange', () => { resync(); if (!document.hidden) { try { weather(); } catch (e) {} } });
 document.addEventListener('gc500motionchange', resync);
 try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', resync); } catch (e) {}
 document.addEventListener('click', e => { const t = e.target instanceof Element ? e.target : null; if (t && t.closest('[data-w885-motion]')) resync(); });
 document.addEventListener('toggle', resync, true);
 document.addEventListener('close', resync, true);
 window.addEventListener('beforeprint', () => { printing = true; sync(); });
 window.addEventListener('afterprint', () => { printing = false; sync(); });
 window.addEventListener('pagehide', () => { if (io) io.disconnect(); visible = false; sync(); });
 window.addEventListener('pageshow', () => { const g = gauge(); if (g) { watch(g); sync(); } });
 /* Native dialogs, the drawer, hidden showcase/machine surfaces and inserted PDF overlays use different lifecycles. Watch
    their visibility changes through one filtered observer; number animation and scene class changes never schedule a frame. */
 const modalSelector = 'dialog,[aria-modal],#drawer';
 const hasModal = n => n.nodeType === 1 && (n.matches(modalSelector) || n.querySelector(modalSelector));
 mo = new MutationObserver(records => {
  if (moFrame || !records.some(r => r.type === 'attributes'
   ? r.target.matches(modalSelector) || (r.target === document.documentElement && r.attributeName === 'data-motion')
   : [...r.addedNodes, ...r.removedNodes].some(hasModal))) return;
  moFrame = requestAnimationFrame(() => { moFrame = 0; sync(); });
 });
 mo.observe(document.documentElement, {attributes: true, childList: true, subtree: true,
  attributeFilter: ['open', 'hidden', 'aria-hidden', 'aria-modal', 'class', 'style', 'data-motion']});
 function report() {
  const g = gauge(), s = g && g.querySelector('.s896-sky'), p = g && g.querySelector('.s896-wx');
  const anims = s ? s.getAnimations({subtree: true}) : [];
  return {version: 'v8.96', mounted: !!s, kind: g ? g.dataset.weather : null, skyKind: s ? s.dataset.kind : null, words: p ? p.textContent.replace(/\s+/g, ' ').trim() : '',
   running: !!g && g.classList.contains('s896-run'), visible, printing, paused: paused(), modal: modal(), still: still(),
   animations: anims.length, animating: anims.filter(a => a.playState === 'running').length,
   skies: document.querySelectorAll('.s896-sky').length, lines: document.querySelectorAll('.s896-wx').length,
   parked: !!document.querySelector('#pane-today > .dsnband.s896-park > .s896-showcase > .bhero'), showcaseOpen,
   atlas: !!document.getElementById('scene896-atlas'), observers: {intersection: io ? 1 : 0, mutation: mo ? 1 : 0}, timers: 0};
 }
 /* Today may already be drawn when this script runs */
 try { if (document.querySelector('#pane-today > .dsnband, #pane-today #where885')) mount(); } catch (err) { console.error('Today scene', err); }
 return {mount, weather, sync, report, kinds: KINDS.slice()};
})();
