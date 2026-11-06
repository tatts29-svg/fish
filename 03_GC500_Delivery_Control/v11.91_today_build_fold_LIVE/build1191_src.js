/* Author: Andrew Fisher. v11.91 - Today: the finished build folds away.
   Andrew, 24 Oct 2026: "We need to start cleaning this up and making all pages mpre ogranjsed now"; on the plan, "Yes, Today first".
   On a phone Today ran to about 15,300 px, and 13,330 px of it was the finished build. Those four parts - the Where we are plate
   (#where885), the Work progress board (#gc500-work-board840), Milestones (#ms1025) and the embedded Where we are view
   (#pane-progress: By group, On site, Trade by trade) - fold behind one "Build complete" bar, closed by default and remembered on
   this device. Nothing is moved, deleted or redrawn: a screen-only rule hides them, so paper prints as before. The fold opens by
   itself for the Today jump buttons that lead into it, for a link to Where we are (go('progress')) and for anything that scrolls
   to a part inside it. The bar goes in before Today puts the scroll back after a redraw, so the page does not jump. Writes
   nothing to the record. */
var Build1191 = (function () {
'use strict';
var PARTS = ['where885', 'gc500-work-board840', 'ms1025', 'pane-progress'];
var KEY = 'gc500.build1191';
/* the Milestones section's own count: every area with a total, and those still short of 100% */
function facts(total, rest) {
  var areas = Math.max(0, total | 0), short = Math.max(0, Math.min(areas, rest | 0));
  return {areas: areas, reached: areas - short, done: areas > 0 && short === 0};
}
function words(F, open) {
  return {title: F.done ? 'Build complete' : 'Build progress',
    sub: (F.areas ? F.reached + ' of ' + F.areas + ' areas at 100% · ' : '') + 'Where we are, Work progress, Milestones and By group',
    act: open ? 'Hide' : 'Show'};
}
return {PARTS: PARTS, KEY: KEY, facts: facts, words: words};
})();
if (typeof module === 'object' && module && module.exports) module.exports = Build1191;

(function (W) {
'use strict';
if (typeof document === 'undefined' || W.__build1191) return;
W.__build1191 = true;
var B = Build1191, root = document.documentElement;
function isOpen() { return root.getAttribute('data-build1191') === 'open'; }
function remembered() { try { return localStorage.getItem(B.KEY) === 'open'; } catch (e) { return false; } }
function pane() { return document.getElementById('pane-today'); }
function firstPart(T) {
  for (var i = 0; i < 3; i++) { var el = document.getElementById(B.PARTS[i]); if (el && el.parentElement === T) return el; }
  return null;
}
function setText(el, t) { if (el && el.textContent !== t) el.textContent = t; }
function paint() {
  var bar = document.getElementById('build1191'); if (!bar) return;
  var ms = document.getElementById('ms1025');
  var F = B.facts(ms ? ms.querySelectorAll('.ms1025-area').length : 0, ms ? ms.querySelectorAll('.ms1025-rest .ms1025-area').length : 0);
  var w = B.words(F, isOpen()), btn = bar.querySelector('.b1191-btn');
  setText(bar.querySelector('.b1191-title'), w.title); setText(bar.querySelector('.b1191-sub'), w.sub); setText(bar.querySelector('.b1191-act'), w.act);
  if (btn.getAttribute('aria-expanded') !== String(isOpen())) btn.setAttribute('aria-expanded', String(isOpen()));
}
function place() {
  var T = pane(); if (!T) return;
  var at = firstPart(T), bar = document.getElementById('build1191');
  if (!at) { if (bar && bar.parentElement === T) bar.remove(); return; }
  if (!bar) {
    bar = document.createElement('section'); bar.id = 'build1191'; bar.className = 'card build1191'; bar.setAttribute('aria-label', 'The finished build');
    bar.innerHTML = '<button type="button" class="b1191-btn" aria-expanded="false"><span class="b1191-txt"><b class="b1191-title"></b><span class="b1191-sub"></span></span><span class="b1191-act"></span></button>';
    bar.querySelector('.b1191-btn').addEventListener('click', function () { setOpen(!isOpen(), true); });
  }
  if (bar.parentElement !== T || bar.nextElementSibling !== at) at.before(bar);
  paint();
}
function setOpen(on, keep) {
  root.setAttribute('data-build1191', on ? 'open' : 'closed');
  if (keep) { try { localStorage.setItem(B.KEY, on ? 'open' : 'closed'); } catch (e) {} }
  paint();
}
/* a part inside the fold: one of the four, or anything in them, while they sit on Today */
function inFold(el) {
  var T = pane(); if (!T || !el || !T.contains(el)) return false;
  for (var x = el; x && x !== T; x = x.parentElement) if (x.parentElement === T && B.PARTS.indexOf(x.id) >= 0) return true;
  return false;
}
setOpen(remembered(), false);

/* Today's own redraw: the bar is in place before the scroll is put back */
var TW = W.TodayWork840;
if (TW && typeof TW.restore === 'function' && !TW.restore.b1191) {
  var restore = TW.restore;
  TW.restore = function () { try { place(); } catch (e) {} return restore.apply(this, arguments); };
  TW.restore.b1191 = true;
}
/* any other change to Today's top level */
if (pane() && typeof MutationObserver === 'function') new MutationObserver(function () { place(); }).observe(pane(), {childList: true});
/* the jump buttons under the Today heading that lead into the fold open it first (capture: before their own handler measures) */
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('.jump95 .jb95') : null;
  if (b && !isOpen() && !/^(Today|Site contacts)$/.test(b.textContent.trim())) setOpen(true, false);
}, true);
/* a link, bookmark or card asking for Where we are opens Today at By group: open the fold for it */
if (typeof W.go === 'function' && !W.go.b1191) {
  var go = W.go;
  W.go = function (tab) { if (tab === 'progress' && !isOpen()) setOpen(true, false); return go.apply(this, arguments); };
  W.go.b1191 = true;
}
/* anything else that scrolls to a part inside the fold */
var into = Element.prototype.scrollIntoView;
if (typeof into === 'function' && !into.b1191) {
  Element.prototype.scrollIntoView = function () { try { if (!isOpen() && inFold(this)) setOpen(true, false); } catch (e) {} return into.apply(this, arguments); };
  Element.prototype.scrollIntoView.b1191 = true;
}
W.gc500Build1191 = {open: function () { setOpen(true, true); }, close: function () { setOpen(false, true); }, isOpen: isOpen, place: place};
place();
})(typeof window === 'object' ? window : {});
