/* =====================================================================================================
   GC500 overlay script — laid over the uploaded page by the service at serve time (server v5.25).

   Two jobs, kept apart:

     1. The motion the stylesheet beside this file cannot do on its own: which pane a person just arrived
        on, the ripple under a press, the tilt and the light on a card under the pointer, the figures rolling
        up to their value, the gloss on the day just chosen.

     2. Four repairs to the page as uploaded, applied at runtime because this layer can see the running page
        and the build cannot be edited from here. Each one is named in REVIEW.md with the line it repairs, and
        each one is also a change the build should carry, so the repair here is a bridge and not the fix.

   It touches no record. It reads nothing from S except the operator's own Motion setting, through the
   page's own motionOff(). Everything is wrapped so a fault here cannot take the page down: if this script
   throws, the page is exactly the page that was uploaded.
   ===================================================================================================== */
(function () {
  'use strict';
  var W = window, D = document;
  var log = function (m) { try { console.warn('[GC500 overlay] ' + m); } catch (e) {} };

  /* the page's own switch, read through the page's own function; a page without it is a page with motion */
  function off() {
    try { if (typeof W.motionOff === 'function') return !!W.motionOff(); } catch (e) {}
    try { return D.documentElement.getAttribute('data-motion') === 'off'
      || (W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
  }
  var fine = false;
  try { fine = !!(W.matchMedia && W.matchMedia('(hover: hover) and (pointer: fine)').matches); } catch (e) {}

  /* ------------------------------------------------------------ 1a. arriving on a tab
     The page's own go() sets .arrive on the pane; this marks it gc-arrive for 900ms after a person changes
     tab or presses something in the pane that redraws it, and the stylesheet staggers what is on it. A
     background sync redraws without a press and so moves nothing. */
  var arriveTimer = null;
  function arrive() {
    try {
      var pane = D.querySelector('main .pane.on'); if (!pane) return;
      D.querySelectorAll('main .pane.gc-arrive').forEach(function (p) { if (p !== pane) p.classList.remove('gc-arrive'); });
      pane.classList.add('gc-arrive');
      clearTimeout(arriveTimer);
      arriveTimer = setTimeout(function () { pane.classList.remove('gc-arrive'); }, 900);
    } catch (e) {}
  }
  function arriveSoon() { setTimeout(arrive, 0); setTimeout(arrive, 60); }
  W.addEventListener('hashchange', arriveSoon);
  W.addEventListener('popstate', arriveSoon);
  D.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('nav.tabs button, .tabmoremenu button, [data-goto], .mmviews .btn, #navBack, .hubcard, .grp[data-disc], .grp[data-go], .grp[data-branch], .tsq, .hl, .sig, [data-day], [data-day-step], [data-view], [data-d], [data-attn], .costcat, .gsc, [data-docjump], .pweek')) arriveSoon();
  }, true);
  D.addEventListener('change', function (e) {
    var t = e.target; if (t && t.id === 'asOf') arriveSoon();
  }, true);

  /* ------------------------------------------------------------ 1b. the press
     A ring of light spreads from under the finger on the thing pressed, and a shaped card brightens its edge.
     The ripple is an element dropped in and taken out again on its own animationend; the host is only given
     a position to hang it from, and never loses its own overflow where its shape depends on it. */
  var RIP = '.btn, .hb, .tsq, .hl, .sig, .costcat, .gsc, .showgo, .shbtn, .tickbtn, .navback, .bopen, .satz, .linkish, .plateb, .mkpick-i';
  var PRESS = '.cut, .kpi, .day, .hubcard, .card.click, .grp, .fig, .doccard, .mk';
  D.addEventListener('pointerdown', function (e) {
    if (off()) return;
    var t = e.target; if (!t || !t.closest) return;
    try {
      var host = t.closest(RIP);
      if (host && !host.disabled) {
        var r = host.getBoundingClientRect();
        if (!host.classList.contains('gc-riphost')) host.classList.add('gc-riphost');
        var rip = D.createElement('i'); rip.className = 'gc-rip'; rip.setAttribute('aria-hidden', 'true');
        rip.style.setProperty('--gc-x', Math.round(e.clientX - r.left) + 'px');
        rip.style.setProperty('--gc-y', Math.round(e.clientY - r.top) + 'px');
        rip.addEventListener('animationend', function () { try { rip.remove(); } catch (x) {} });
        setTimeout(function () { try { rip.remove(); } catch (x) {} }, 900);
        host.appendChild(rip);
      }
      var card = t.closest(PRESS);
      if (card) { card.classList.remove('gc-pressed'); void card.offsetWidth; card.classList.add('gc-pressed');
        setTimeout(function () { card.classList.remove('gc-pressed'); }, 600); }
      /* the day just chosen wears its gloss once the strip has redrawn with it selected */
      var day = t.closest('.day[data-day]');
      if (day) setTimeout(function () { try {
        D.querySelectorAll('.day.gc-just').forEach(function (d) { d.classList.remove('gc-just'); });
        var on = D.querySelector('.daystrip .day.on'); if (on) on.classList.add('gc-just');
      } catch (x) {} }, 80);
    } catch (x) {}
  }, true);

  /* ------------------------------------------------------------ 1c. the tilt and the light on a card
     Fine pointers only. The card leans up to four degrees toward the pointer and a specular light follows it
     across the face; both settle when the pointer leaves. The variables are set on the card and the
     stylesheet does the drawing, so an element that is redrawn under the pointer simply starts again. */
  var TILT = '.cut, .kpi, .hubcard, .day, .grp, .fig, .doccard, .eqc, .tsq, .sig, .costcat, .cgauge, .mcard, .card.click, .dbdel, .attn';
  var MAXD = 4;
  var tilting = null;
  function tiltMove(e) {
    var c = tilting; if (!c) return;
    var r = c.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return;
    var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    px = Math.max(0, Math.min(1, px)); py = Math.max(0, Math.min(1, py));
    /* a very wide card leans less — four degrees across a full-width card is a seesaw */
    var k = Math.min(1, 420 / r.width);
    c.style.setProperty('--gc-ry', ((px - .5) * 2 * MAXD * k).toFixed(2) + 'deg');
    c.style.setProperty('--gc-rx', ((.5 - py) * 2 * MAXD * k).toFixed(2) + 'deg');
    c.style.setProperty('--gc-gx', (px * 100).toFixed(1) + '%');
    c.style.setProperty('--gc-gy', (py * 100).toFixed(1) + '%');
  }
  function tiltEnd() {
    var c = tilting; if (!c) return; tilting = null;
    try {
      c.classList.add('gc-settle');
      c.style.setProperty('--gc-rx', '0deg'); c.style.setProperty('--gc-ry', '0deg');
      setTimeout(function () { c.classList.remove('gc-tilt'); c.classList.remove('gc-settle');
        var s = c.querySelector(':scope > .gc-shine'); if (s) s.remove();
        c.style.removeProperty('--gc-rx'); c.style.removeProperty('--gc-ry'); }, 230);
    } catch (e) {}
    c.removeEventListener('pointermove', tiltMove);
    c.removeEventListener('pointerleave', tiltEnd);
    c.removeEventListener('pointercancel', tiltEnd);
  }
  if (fine) D.addEventListener('pointerover', function (e) {
    if (off()) return;
    var t = e.target; if (!t || !t.closest) return;
    var c = t.closest(TILT); if (!c || c === tilting) return;
    /* a card inside a card: the innermost one answers, so a tile on a hub card does not lean the hub */
    if (tilting) tiltEnd();
    try {
      if (getComputedStyle(c).position === 'static') c.style.position = 'relative';
      tilting = c; c.classList.remove('gc-settle'); c.classList.add('gc-tilt');
      if (!c.querySelector(':scope > .gc-shine')) { var s = D.createElement('i'); s.className = 'gc-shine'; s.setAttribute('aria-hidden', 'true'); c.appendChild(s); }
      c.addEventListener('pointermove', tiltMove);
      c.addEventListener('pointerleave', tiltEnd);
      c.addEventListener('pointercancel', tiltEnd);
      tiltMove(e);
    } catch (x) { tilting = null; }
  }, true);

  /* ------------------------------------------------------------ 1d. the figures roll in
     Each headline figure rolls from 0 to its value over 520ms the first time this device sees it, and again
     when the value changes — the page's rule for the dial (giSweeps) and the lamps, applied to the numbers.
     A repaint of the same value plays nothing. Only a plain integer in the element's FIRST text node is
     rolled; anything with a unit, a decimal, a dollar sign or words beside it is left exactly as drawn. */
  var ROLL = '.kpi .v, .dp b, .dsn .fig .n, .dsn .grp .n, .sig b, .hubbig b, .dfig b, .tsq b, .attn b.racenum, .attnbn, .shbig, .ctwo .ctile > b, .ctile.lead .ctbig, .ctile.whole > div:first-child > b, .pstat b, .crace b, .dbt b.racenum, .dbrn, .eqc b.racenum, .pitboard .pbnum, .lbrief .lbref, .shrow b, .pnfig b';
  var seen = new Map(), busy = new WeakSet();
  function keyOf(el) {
    var pane = el.closest('.pane, #drawer, #showcase'), pid = pane ? (pane.id || 'x') : 'x';
    var label = '';
    try {
      var p = el.parentElement;
      var lab = p && (p.querySelector('.l, .dpl, .k, .ctk, em, small, span:last-child, .attnw') || null);
      label = lab ? String(lab.textContent || '').trim().slice(0, 40) : '';
      if (!label && p && p.parentElement) { var l2 = p.parentElement.querySelector('.l, .dpl, .k, .ctk, .attnk'); label = l2 ? String(l2.textContent || '').trim().slice(0, 40) : ''; }
    } catch (e) {}
    var i = 0; try { var sib = el.parentElement ? el.parentElement.children : []; for (var n = 0; n < sib.length; n++) { if (sib[n] === el) { i = n; break; } } } catch (e) {}
    return pid + '|' + el.className + '|' + label + '|' + i;
  }
  function rollOne(el) {
    if (busy.has(el)) return;
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    var raw = String(node.data || ''), m = raw.match(/^(\s*)(\d{1,3}(?:,\d{3})*|\d{1,6})(\s*)$/);
    if (!m) return;
    var target = parseInt(m[2].replace(/,/g, ''), 10);
    if (!isFinite(target) || target <= 0) return;
    var key = keyOf(el), prev = seen.get(key);
    seen.set(key, target);
    if (prev === target) return;                       /* the same reading, redrawn: it plays nothing */
    if (off()) return;
    var from = (prev === undefined || prev > target) ? 0 : prev;
    var commas = m[2].indexOf(',') >= 0, pre = m[1], post = m[3];
    var fmt = function (v) { var s = String(Math.round(v)); if (commas || s.length > 3) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return pre + s + post; };
    var t0 = W.performance && W.performance.now ? W.performance.now() : Date.now();
    var dur = 520 + Math.min(280, Math.log10(Math.max(2, target)) * 60);
    busy.add(el); el.classList.add('gc-rolling');
    var minw = el.getBoundingClientRect().width; if (minw > 0) el.style.minWidth = Math.ceil(minw) + 'px';
    var step = function (now) {
      if (!el.isConnected || el.firstChild !== node) { busy.delete(el); return; }
      var t = Math.min(1, ((now || Date.now()) - t0) / dur);
      var e = 1 - Math.pow(1 - t, 3);
      node.data = fmt(from + (target - from) * e);
      if (t < 1) W.requestAnimationFrame(step);
      else { node.data = raw; el.classList.remove('gc-rolling'); el.style.minWidth = ''; busy.delete(el); }
    };
    W.requestAnimationFrame(step);
  }
  var scanQueued = false;
  function scan() {
    scanQueued = false;
    try { D.querySelectorAll(ROLL).forEach(rollOne); } catch (e) {}
  }
  function queueScan() { if (scanQueued) return; scanQueued = true; W.requestAnimationFrame(scan); }
  try {
    var mo = new MutationObserver(queueScan);
    ['main', '#drawer', '#showcase'].forEach(function (s) { var el = D.querySelector(s); if (el) mo.observe(el, { childList: true, subtree: true }); });
    queueScan();
  } catch (e) { log('no MutationObserver — figures will not roll'); }

  /* ------------------------------------------------------------ 2. repairs to the page as uploaded (see REVIEW.md)
     R1. Documents: a drawing or plate thumbnail opened its PDF, and then a later line bound every [data-open]
         inside a card to openAsset(), so the thumbnail's own URL was handed to the asset drawer instead. The
         file opens as it was meant to. Capture phase, so it runs before the card's own handler. */
  D.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var img = t.closest('#pane-docs img.thumb[data-open]'); if (!img) return;
    var u = String(img.getAttribute('data-open') || '');
    if (!/^(\/|https?:\/\/)/i.test(u)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    try { W.open(u, '_blank', 'noopener'); } catch (x) {}
  }, true);
  /* R2. The phone's search: picking a result closed the box without telling the magnifier button, which stayed
         aria-expanded="true" for a screen reader. The button follows the body's own class. */
  try {
    new MutationObserver(function () {
      var b = D.getElementById('searchBtn'); if (!b) return;
      var open = D.body.classList.contains('search-open');
      if (b.getAttribute('aria-expanded') !== String(open)) b.setAttribute('aria-expanded', String(open));
    }).observe(D.body, { attributes: true, attributeFilter: ['class'] });
  } catch (e) {}
  /* R3. The showcase honoured the operating system's reduced-motion preference but not the page's own
         Tools → Motion: Off. It now honours both, through the same function every other animation reads. */
  try {
    if (typeof W.showReduced === 'function' && typeof W.motionOff === 'function') {
      var _sr = W.showReduced;
      W.showReduced = function () { try { if (W.motionOff()) return true; } catch (e) {} return _sr(); };
    }
  } catch (e) {}
  /* R4. syncFooter() read the whole record out of localStorage to measure it on every poll — every four
         seconds, up to five megabytes, on a phone. The measurement is kept for twenty seconds between reads.
         Same number, one-fifteenth of the work. */
  try {
    if (typeof W.recordBytes === 'function') {
      var _rb = W.recordBytes, rbAt = 0, rbV = 0;
      W.recordBytes = function () { var n = Date.now(); if (n - rbAt > 20000) { rbV = _rb(); rbAt = n; } return rbV; };
    }
  } catch (e) {}

  arriveSoon();
  try { D.documentElement.setAttribute('data-gc500-overlay', 'on'); } catch (e) {}
})();
