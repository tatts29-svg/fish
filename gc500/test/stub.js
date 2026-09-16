/* GC500 stand-in — what the test uploads in place of the real app script.

   It defines the handful of globals the overlay looks for, and draws a Today pane, a Register pane and a
   Documents pane with the page's own classes, so every effect in the overlay has something to land on and
   every repair has the fault it repairs. The Documents pane deliberately reproduces the double binding the
   live page has (img.thumb[data-open] bound to window.open, then every [data-open] in the card bound to
   openAsset), so the repair can be seen to win. Nothing here is the real app. */
'use strict';
var MOTION_MQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
function motionPref(){ try { return localStorage.getItem('gc500.motion') === 'off' ? 'off' : 'subtle'; } catch (e) { return 'subtle'; } }
function motionOff(){ return motionPref() === 'off' || !!(MOTION_MQ && MOTION_MQ.matches); }
function motionApply(){ document.documentElement.setAttribute('data-motion', motionOff() ? 'off' : 'subtle'); }
function showReduced(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
var STORE = 'gc500.test';
function recordBytes(){ window.__rbCalls = (window.__rbCalls || 0) + 1; try { var s = localStorage.getItem(STORE); return s ? s.length * 2 : 0; } catch (e) { return 0; } }
function openAsset(key){ window.__openedAsset = key; }
function $(s, r){ return (r || document).querySelector(s); }
var state = { tab: 'today' };
var TABS = [['today', 'Today'], ['progress', 'Where we are'], ['map', 'Map'], ['docs', 'Documents'], ['register', 'Register'], ['timeline', 'Timeline']];

function renderTabs(){
  $('#tabs').innerHTML = TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (state.tab === t[0]) + '">' + t[1] + '</button>'; }).join('');
  document.querySelectorAll('#tabs button').forEach(function (b) { b.onclick = function () { location.hash = '#' + b.dataset.tab; }; });
}
function kpi(v, l, q, cls){ return '<div class="kpi' + (cls ? ' ' + cls : '') + '"><div class="v">' + v + '</div><div class="l">' + l + '</div>' + (q ? '<div class="q">' + q + '</div>' : '') + '</div>'; }
function renderToday(){
  $('#pane-today').innerHTML =
    '<div class="tstrip card"><div class="tsday"><div class="tsdow">Wed<br>16 Sep 2026</div></div><div class="tsq-row">' +
    '<button type="button" class="tsq"><b>16</b><span>Due in</span><em>today</em></button>' +
    '<button type="button" class="tsq"><b>4</b><span>Due out</span><em>today</em></button>' +
    '<button type="button" class="tsq gap"><b>3</b><span>No record</span><em>due today</em></button>' +
    '<button type="button" class="tsq"><b>9</b><span>On site</span><em>recorded</em></button></div></div>' +
    '<div class="kpis">' + kpi('146', 'On site', 'of 193 references') + kpi('27', 'In transit', 'recorded on the way') + kpi('12', 'Recorded not on site', 'somebody looked', 'alert') + kpi('8', 'No delivery record', 'nobody has said') + '</div>' +
    '<div class="hub">' +
    '<div class="card hubcard" tabindex="0"><div class="hubtitle"><h3>Today</h3><span class="chip ok">on track</span></div><div class="hubbig"><b>16</b><span class="w">due in</span></div><div class="hubgo">Open the day ↗</div></div>' +
    '<div class="card hubcard alert" tabindex="0"><div class="hubtitle"><h3>Needs a look</h3><span class="chip crit">3 gaps</span></div><ul class="hublist"><li><span class="tm">08:00</span><span class="w">P09 · toilet block</span></li><li><span class="tm">09:30</span><span class="w">WC12 · toilets</span></li></ul><div class="hubgo">Open ↗</div></div>' +
    '<div class="card"><h3>The day</h3><p class="sub">what the record says</p><div class="prog"><div class="track"><i style="width:62%"></i></div><span>62% recorded</span></div>' +
    '<div class="hubwho"><button class="btn primary">Print the day</button><button class="btn">Email this day</button><button class="btn ghost">Copy link</button></div></div>' +
    '</div>' +
    '<div class="daystrip" role="group">' + [14, 15, 16, 17, 18].map(function (d, i) {
      return '<button type="button" class="day' + (d === 16 ? ' on today' : '') + '" data-day="2026-09-' + d + '" aria-pressed="' + (d === 16) + '"><span class="dface"><span class="dhead"><span class="dow">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i] + '</span></span>' +
        '<span class="dnum"><span class="dd">' + d + '</span><span class="dmy"><b>Sep</b><em>2026</em></span></span><span class="dwk"><i aria-hidden="true"></i>BUILD WEEK 2</span>' +
        '<span class="dpan"><span class="dfig"><span class="din"><b>' + (10 + i) + '</b><em>Due in</em></span><span class="dout"><b>' + i + '</b><em>Due out</em></span></span><span class="lights"><i class="g" style="flex:6"></i><i class="a" style="flex:2"></i><i class="n" style="flex:2"></i></span></span>' +
        '<span class="dfoot"><span class="dsel">' + (d === 16 ? 'Selected' : '') + '</span><span class="dslash">//</span></span></span></button>';
    }).join('') + '</div>' +
    '<div class="dsn"><h3 class="sec">By group</h3><div class="groups">' +
    '<div class="grp part" role="button" tabindex="0" data-disc="Toilets"><div class="k">Toilets &amp; amenities<span>70 toilet units</span></div><div class="n">31<small> of 70 toilet units on site</small></div><div class="gp"><i style="width:44.3%"></i></div><div class="gl"><span>31 on site</span><span><b>44%</b></span></div></div>' +
    '<div class="grp full" role="button" tabindex="0" data-disc="Generators"><div class="k">Generators<span>12 generators</span></div><div class="n">12<small> of 12 on site</small></div><div class="gp full"><i style="width:100%"></i></div><div class="gl"><span>all on site</span><span><b>100%</b></span></div></div>' +
    '</div></div>';
  document.querySelectorAll('.day').forEach(function (b) { b.onclick = function () { document.querySelectorAll('.day').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); x.querySelector('.dsel').textContent = ''; }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); b.querySelector('.dsel').textContent = 'Selected'; }; });
}
function renderRegister(){
  $('#pane-register').innerHTML = '<div class="kpis">' + kpi('193', 'References') + kpi('58', 'With no asset number') + '</div>' +
    '<div class="card"><h3>The register</h3><div class="tblwrap"><table><thead><tr><th>Ref</th><th>What</th><th>Light</th></tr></thead><tbody>' +
    '<tr class="click"><td><span class="rplate">P01</span></td><td>Toilet block</td><td><span class="tl green"><i></i>On site</span></td></tr>' +
    '<tr class="click done"><td><span class="rplate">P03</span></td><td>Lunchroom 4.8x3</td><td><span class="tl amber"><i></i>In transit</span></td></tr>' +
    '</tbody></table></div></div>';
}
function renderDocs(){
  $('#pane-docs').innerHTML = '<div class="hubhead"><div><h2>Documents</h2></div><div class="acts"><button class="btn" id="docsPrintList">Print this list</button></div></div>' +
    '<div class="docgrid"><div class="cut doccard map" data-doc="d022"><span class="face"><span class="dockind">Drawing</span><span class="slash doc">//</span>' +
    '<div class="docbody"><div class="doccover"><img class="thumb" src="data:image/svg+xml;utf8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22141%22 height=%22100%22%3E%3Crect width=%22141%22 height=%22100%22 fill=%22%23eee%22/%3E%3C/svg%3E" alt="" data-open="/f/' + location.pathname.split('/')[2] + '/D022.pdf"></div>' +
    '<div class="docmain"><h4>D022 — Compound layout</h4><div class="docpills"><span class="pill good"><i class="pipdot"></i>Available</span><span class="pill plan">Drawing source</span></div>' +
    '<div class="acts"><a class="btn primary" href="#" onclick="return false">Open PDF</a><button type="button" class="linkish" data-open="P09">P09</button></div></div></div></span></div></div>';
  var pane = $('#pane-docs');
  /* the live page's own two bindings, in the live page's own order — the second overrides the first */
  pane.querySelectorAll('img.thumb[data-open]').forEach(function (i) { i.onclick = function () { window.open(i.dataset.open, '_blank', 'noopener'); }; });
  pane.querySelectorAll('.doccard [data-open]').forEach(function (b) { b.onclick = function () { openAsset(b.dataset.open); }; });
}
function render(){
  document.querySelectorAll('.pane').forEach(function (p) { p.classList.remove('on'); p.classList.remove('arrive'); });
  var pane = $('#pane-' + state.tab) || $('#pane-today');
  pane.classList.add('on'); void pane.offsetWidth; pane.classList.add('arrive');
  if (state.tab === 'today') renderToday(); else if (state.tab === 'register') renderRegister(); else if (state.tab === 'docs') renderDocs(); else pane.innerHTML = '<div class="card"><h3>' + state.tab + '</h3><p class="sub">stand-in</p></div>';
  renderTabs();
}
function route(){ var h = (location.hash || '#today').replace(/^#/, ''); state.tab = TABS.some(function (t) { return t[0] === h; }) ? h : 'today'; render(); }
window.addEventListener('hashchange', route);
$('#bOrg').textContent = 'Coates Industrial Solutions';
$('#bSub').textContent = '23–25 Oct 2026 · Surfers Paradise';
$('#footL').textContent = 'stand-in page for the overlay test';
$('#footR').textContent = 'Records saved in this browser only';
$('#recstrip').innerHTML = '<i class="rsdot" aria-hidden="true"></i><span class="rsw"><b>Shared record</b><em>last confirmed 09:41</em></span>';
$('#recstrip').className = 'recstrip shared';
(function tick(){ var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
  $('#tpodNum').innerHTML = p(d.getHours()) + '<span class="sep">:</span>' + p(d.getMinutes()) + '<span class="sep">:</span><span class="sec">' + p(d.getSeconds()) + '</span>';
  var sec = $('#tpodSec'); if (sec.children.length !== 12) sec.innerHTML = Array.from({ length: 12 }, function () { return '<i></i>'; }).join('');
  var lit = Math.floor(d.getSeconds() / 5) + 1; Array.prototype.forEach.call(sec.children, function (el, i) { el.classList.toggle('on', i < lit); });
  setTimeout(tick, 1000 - (Date.now() % 1000) + 5); })();
motionApply(); route();
