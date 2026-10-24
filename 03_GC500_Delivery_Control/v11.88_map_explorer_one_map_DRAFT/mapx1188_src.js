/* Author: Andrew Fisher. v11.88 - Map explorer, one map at a time.
   Andrew, 24 Oct 2026: "can we look at map explorer it look very over corwed very confising we need to make this simple and
   easy we showing 2 maps why easy simple maybe drop down selection".
   The tab stacked two whole maps: the site plan (the explorer: master plan, satellite and 3D) and, under it, the satellite map
   of VMS boards, generators, grandstands, turns and gates, followed by its long list. Now one "Show map" drop-down at the top
   picks which one shows; the other is folded away, not removed. The choice is kept on this device. Anything that points at a
   place opens the right map by itself: a gate, stand or turn ringed on the satellite (gate1156Zoom) shows the satellite map;
   "show on the plan", the finder's plan markers and a reference opened from another tab show the site plan.
   Also folded, never deleted: the long note under "Highlight area" (one tap, "What the outlines mean") and the satellite map's
   long list ("Show the list"). Every component is kept as it was built: nothing redrawn or restyled, no record touched. */
(function (W) {
'use strict';
if (typeof document === 'undefined' || W.Map1188) return;
var KEY = 'gc500.map1188';
var OPTIONS = [['plan', 'Site plan & equipment'], ['sat', 'VMS, generators & gates']];
var HINT = {plan: 'The master plan with every reference. Plan, Sat + plan, Satellite and 3D are on the map itself.',
  sat: 'Every VMS board, generator, grandstand, turn and gate on satellite.'};
function stored() { try { var v = localStorage.getItem(KEY); return v === 'plan' || v === 'sat' ? v : ''; } catch (e) { return ''; } }
var view = stored() || 'plan', timer = 0;
function pane() { return document.getElementById('pane-map'); }
function sat(p) { return p ? p.querySelector('.s1141-map[data-s1141="map"]') : null; }

function set(v, by) {
  if (v !== 'plan' && v !== 'sat') return;
  var was = view; view = v;
  if (by === 'user') { try { localStorage.setItem(KEY, v); } catch (e) {} }
  decorate();
  /* the satellite map sizes itself from its own width: give it a fresh measure once it shows again */
  if (was !== v && v === 'sat') setTimeout(function () { try { W.dispatchEvent(new Event('resize')); } catch (e) {} }, 40);
}

function decorate() {
  var p = pane(); if (!p) return;
  var exp = p.querySelector('#expcard');
  var card = p.querySelector('.map1188');
  if (!exp) {                              /* another drawing is open in the tab: nothing to choose between */
    if (p.hasAttribute('data-map1188')) p.removeAttribute('data-map1188');
    if (card) card.remove();
    return;
  }
  if (p.getAttribute('data-map1188') !== view) p.setAttribute('data-map1188', view);
  if (!exp.__map1188obs) { exp.__map1188obs = new MutationObserver(soon); exp.__map1188obs.observe(exp, {childList: true}); }   /* the area bar arrives after the plan loads */
  if (!card) {
    card = document.createElement('section'); card.className = 'card map1188'; card.setAttribute('aria-label', 'Which map');
    card.innerHTML = '<label class="map1188-pick"><span>Show map</span><select data-ro>' +
      OPTIONS.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select></label><p class="map1188-hint"></p>';
    card.querySelector('select').addEventListener('change', function (e) { set(e.target.value, 'user'); });
  }
  if (card.nextElementSibling !== exp) exp.insertAdjacentElement('beforebegin', card);
  var pick = card.querySelector('select');
  if (pick.value !== view && document.activeElement !== pick) pick.value = view;
  var hint = card.querySelector('.map1188-hint');
  if (hint.textContent !== HINT[view]) hint.textContent = HINT[view];

  var ctl = exp.querySelector('#map1147-controls'), note = ctl && ctl.querySelector(':scope > small');
  if (note && !ctl.querySelector('.map1188-why')) {
    var why = document.createElement('button');
    why.type = 'button'; why.className = 'map1188-why'; why.setAttribute('data-ro', ''); why.setAttribute('aria-expanded', 'false');
    why.textContent = 'What the outlines mean';
    why.addEventListener('click', function () { var on = ctl.classList.toggle('map1188-open'); why.setAttribute('aria-expanded', String(on)); why.textContent = on ? 'Hide the note' : 'What the outlines mean'; });
    note.insertAdjacentElement('beforebegin', why);
  }

  var s = sat(p), list = s && s.querySelector('.s1141-list');
  if (list) {
    var n = list.querySelectorAll('li').length, t = s.querySelector('.map1188-list');
    if (!t) {
      t = document.createElement('button');
      t.type = 'button'; t.className = 'btn sm map1188-list'; t.setAttribute('data-ro', ''); t.setAttribute('aria-expanded', 'false');
      t.addEventListener('click', function () {
        var on = s.classList.toggle('map1188-listopen'); t.setAttribute('aria-expanded', String(on));
        t.textContent = (on ? 'Hide the list' : 'Show the list') + ' (' + list.querySelectorAll('li').length + ')';
      });
      list.insertAdjacentElement('beforebegin', t);
    }
    var words = (s.classList.contains('map1188-listopen') ? 'Hide the list' : 'Show the list') + ' (' + n + ')';
    if (t.textContent !== words) t.textContent = words;
  }
}
function soon() { if (timer) return; timer = setTimeout(function () { timer = 0; try { decorate(); } catch (e) {} }, 60); }

/* the tab redraws itself (and the finder and the satellite map put their cards back): watch the pane, as they do */
function watch() {
  var p = pane(); if (!p || p.__map1188obs) return;
  p.__map1188obs = new MutationObserver(soon);
  p.__map1188obs.observe(p, {childList: true});
}
function wrap(name, fn) {
  var f = W[name]; if (typeof f !== 'function' || f.__map1188) return false;
  var g = function () {
    var before = null; try { before = fn.before ? fn.before.apply(this, arguments) : null; } catch (e) {}
    var out = f.apply(this, arguments);
    try { fn.after(arguments, before); } catch (e) {}
    return out;
  };
  g.__map1188 = true; W[name] = g; return true;
}
/* which map a call means */
['mapLocate', 'expFind', 'expOpen2d', 'expOpen3d', 'showOnMap'].forEach(function (name) {
  var f = W[name]; if (typeof f !== 'function' || f.__map1188) return;
  var g = function () { try { set('plan', 'code'); } catch (e) {} return f.apply(this, arguments); };
  g.__map1188 = true; W[name] = g;
});
(function () {
  var f = W.gate1156Zoom; if (typeof f !== 'function' || f.__map1188) return;
  var g = function () { try { set('sat', 'code'); } catch (e) {} return f.apply(this, arguments); };
  g.__map1188 = true; W.gate1156Zoom = g;
})();
/* a reference or a drawing asked for from elsewhere (state.sheet / state.sel set, then go('map')) is on the site plan */
function seen() { try { return typeof state === 'object' && state ? {sheet: state.sheet, sel: state.sel || null, found: state.found ? state.found.at || 1 : null} : null; } catch (e) { return null; } }
var last = seen();
wrap('go', {after: function (args) {
  if (args[0] !== 'map') return;
  var now = seen();
  if (last && now && (now.sheet !== last.sheet || (now.sel && now.sel !== last.sel) || (now.found && now.found !== last.found))) set('plan', 'code');
  last = now; watch(); soon();
}});
wrap('renderMap', {after: function () { watch(); soon(); }});

watch(); decorate();
W.Map1188 = {get view() { return view; }, set: function (v) { set(v, 'user'); }, decorate: decorate};
})(typeof window === 'object' ? window : {});
