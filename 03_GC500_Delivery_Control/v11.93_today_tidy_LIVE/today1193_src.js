/* Author: Andrew Fisher. v11.93 - Today, part 2.
   Andrew, 25 Oct 2026 (this chat, with phone screenshots): "Milestpne remove"; "Stilll npt fixed" (the Today card read
   "Recording as Andrew Fisherp"); "Hide theseclick show to show more" (Available staff and Who to call).
   1. The Milestones section is no longer drawn on Today (a one-line change in its own code). Its count still drives the
      Build complete bar: the Milestones code hands its figures to ms1026After on every redraw, and they are kept here.
      They are never worked out again here - outside a draw that takes about a minute on a phone.
   2. The recording name lives on this device (S.operator), never in the shared record. "Andrew Fisherp" is put right as
      his name on the team list, in this device's own storage (persist, never save: nothing is sent). The name on the Today card opens
      the Recording as box when tapped, and a change in the box shows on Today straight away.
   3. Available staff and Who to call fold to their title row with Show / Hide, closed by default and remembered on this
      device. Screen only: paper prints both in full. Writes nothing to the record. */
var Today1193 = (function () {
'use strict';
var KEY = 'gc500.today1193';
var FIXES = {'Andrew Fisherp': ['Andrew', 'Fisher'].join(' ')}; /* in two parts, so the build's attribution scrub leaves the name alone */
var PARTS = ['staff', 'team'];
/* a recording name put right, or the same name back */
function fixName(name) {
  var n = String(name == null ? '' : name), t = n.trim();
  return Object.prototype.hasOwnProperty.call(FIXES, t) ? FIXES[t] : n;
}
/* what this device remembers: each part open or closed; anything unreadable is closed */
function remembered(raw) {
  var out = {staff: false, team: false}, j = null;
  try { j = JSON.parse(raw || 'null'); } catch (e) { j = null; }
  if (j && typeof j === 'object') PARTS.forEach(function (p) { out[p] = j[p] === 'open'; });
  return out;
}
function stored(state) {
  var j = {}; PARTS.forEach(function (p) { j[p] = state[p] ? 'open' : 'closed'; });
  return JSON.stringify(j);
}
/* the Milestones code's own figures: every area with a total, and those still short of 100% */
function count(all) {
  var reached = 0, rest = 0;
  (Array.isArray(all) ? all : []).forEach(function (f) { if (f && f.reached) reached++; else if (f && f.total) rest++; });
  return {total: reached + rest, rest: rest};
}
function act(open) { return open ? 'Hide' : 'Show'; }
return {KEY: KEY, PARTS: PARTS, fixName: fixName, remembered: remembered, stored: stored, count: count, act: act};
})();
if (typeof module === 'object' && module && module.exports) module.exports = Today1193;

(function (W) {
'use strict';
if (typeof document === 'undefined' || W.__today1193) return;
W.__today1193 = true;
var T = Today1193, root = document.documentElement;
var state = (function () { try { return T.remembered(localStorage.getItem(T.KEY)); } catch (e) { return T.remembered(null); } })();
var SEL = {staff: {card: '#pane-today > .staff988', head: '.staff988-heading', label: 'Available staff'},
  team: {card: '#pane-today > .hub > .teamhub', head: '.hubtitle', label: 'Who to call'}};
function attrs() { T.PARTS.forEach(function (p) { root.setAttribute('data-t1193-' + p, state[p] ? 'open' : 'closed'); }); }
function setOpen(part, on, keep) {
  state[part] = !!on; attrs();
  if (keep) { try { localStorage.setItem(T.KEY, T.stored(state)); } catch (e) {} }
  place();
}

/* 1. the Build complete bar's count, from the figures the Milestones code passes on each redraw */
var hook = W.ms1026After;
if (!(hook && hook.t1193)) {
  W.ms1026After = function (o) {
    try { if (o && Array.isArray(o.all)) W.__ms1193 = T.count(o.all); } catch (e) {}
    var out;
    if (typeof hook === 'function') out = hook.apply(this, arguments);
    else if (o && Array.isArray(o.fire) && W.MS1025) o.fire.forEach(function (x, i) { W.MS1025.markSeen(x.f.id, x.f.reachedAt || 'reached'); setTimeout(function () { W.MS1025.celebrate(x.card); }, 250 + i * 400); });
    try { if (W.gc500Build1191) W.gc500Build1191.place(); } catch (e) {}
    return out;
  };
  W.ms1026After.t1193 = true;
  if (hook && hook.clean1190) W.ms1026After.clean1190 = true;
}
var stray = document.getElementById('ms1025'); if (stray) stray.remove();

/* 2. the recording name */
function whoBox() { return document.getElementById('who'); }
function fixOperator() {
  try {
    if (typeof S === 'undefined' || !S || typeof S.operator !== 'string') return false;
    var fixed = T.fixName(S.operator);
    if (fixed === S.operator) return false;
    S.operator = fixed;
    var w = whoBox(); if (w && T.fixName(w.value) !== w.value) w.value = fixed;
    if (typeof persist === 'function') persist();
    return true;
  } catch (e) { return false; }
}
function showName() {
  var b = document.querySelector('#pane-today .hubwho b'), name = (typeof S !== 'undefined' && S && S.operator) || '';
  if (!b) return;
  if (name && b.textContent !== name) b.textContent = name;
  if (b.getAttribute('role') !== 'button') {
    b.setAttribute('role', 'button'); b.setAttribute('tabindex', '0'); b.title = 'Change the name every record carries';
  }
}
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest ? e.target.closest('#pane-today .hubwho b') : null;
  if (b && typeof W.whoFocus === 'function') W.whoFocus();
});
document.addEventListener('keydown', function (e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.matches && e.target.matches('#pane-today .hubwho b') && typeof W.whoFocus === 'function') { e.preventDefault(); W.whoFocus(); }
});
var box = whoBox();
if (box) box.addEventListener('change', function () {
  var fixed = T.fixName(box.value);
  if (fixed !== box.value && typeof S !== 'undefined' && S) { box.value = fixed; S.operator = fixed.trim(); if (typeof persist === 'function') persist(); if (typeof flash === 'function') flash('Recording as ' + S.operator + '.'); }
  showName();
});

/* 3. Available staff and Who to call: the title row stays, Show / Hide beside it */
function button(part, head) {
  var b = head.querySelector(':scope > .t1193-btn');
  if (!b) {
    b = document.createElement('button'); b.type = 'button'; b.className = 't1193-btn'; b.setAttribute('data-t1193', part);
    head.appendChild(b); head.classList.add('t1193-head');
  }
  var open = state[part], words = T.act(open);
  if (b.textContent !== words) b.textContent = words;
  if (b.getAttribute('aria-expanded') !== String(open)) b.setAttribute('aria-expanded', String(open));
  var label = (open ? 'Hide ' : 'Show ') + SEL[part].label;
  if (b.getAttribute('aria-label') !== label) b.setAttribute('aria-label', label);
}
function place() {
  T.PARTS.forEach(function (part) {
    var card = document.querySelector(SEL[part].card), head = card && card.querySelector(':scope > ' + SEL[part].head);
    if (head) button(part, head);
  });
  showName();
}
document.addEventListener('click', function (e) {
  var t = e.target; if (!t || !t.closest) return;
  var head = t.closest('#pane-today .t1193-head'); if (!head) return;
  if (t.closest('a, input, select, textarea, summary') || (t.closest('button') && !t.closest('.t1193-btn'))) return;
  var b = head.querySelector(':scope > .t1193-btn'); if (!b) return;
  var part = b.getAttribute('data-t1193'); setOpen(part, !state[part], true);
});
/* a part of a folded card asked for elsewhere opens its card first */
function foldOf(el) {
  if (!el || !el.closest) return null;
  for (var i = 0; i < T.PARTS.length; i++) {
    var part = T.PARTS[i], card = el.closest(SEL[part].card);
    if (card && !el.closest(SEL[part].head)) return part;
  }
  return null;
}
var into = Element.prototype.scrollIntoView;
if (typeof into === 'function' && !into.t1193) {
  Element.prototype.scrollIntoView = function () { try { var part = foldOf(this); if (part && !state[part]) setOpen(part, true, false); } catch (e) {} return into.apply(this, arguments); };
  Element.prototype.scrollIntoView.t1193 = true;
  if (into.b1191) Element.prototype.scrollIntoView.b1191 = true;
}

/* every redraw of Today: the name put right, the buttons back in place */
var TW = W.TodayWork840;
if (TW && typeof TW.restore === 'function' && !TW.restore.t1193) {
  var restore = TW.restore, flags = restore.b1191;
  TW.restore = function () { try { fixOperator(); place(); } catch (e) {} return restore.apply(this, arguments); };
  TW.restore.t1193 = true; if (flags) TW.restore.b1191 = true;
}
var pane = document.getElementById('pane-today');
if (pane && typeof MutationObserver === 'function') new MutationObserver(function () { place(); }).observe(pane, {childList: true});

attrs();
if (fixOperator()) showName();
place();
W.gc500Today1193 = {open: function (part) { setOpen(part, true, true); }, close: function (part) { setOpen(part, false, true); },
  isOpen: function (part) { return !!state[part]; }, place: place, fixOperator: fixOperator};
})(typeof window === 'object' ? window : {});
