/* Author: Andrew Fisher. v10.67 read-only servicing progress. v10.84 (Andrew, 20 Oct 2026: "this will need its own area and
   tab on GC500"): it lives on its own Servicing tab, no longer above the Event nights run sheet. */
(function (W) {
'use strict';
var D = SVC1067_DATA, host, picker, content, list = [], selected = '', model = null, status = '', busy = false, timer = 0;
var note, open = {}, pickedDay = '', clockAt = 0, clockNow = 0, lastSignature = '', observer, admin;
function editable() { return typeof capability === 'function' && capability() === 'edit' && typeof SYNC !== 'undefined' && !SYNC.readonly && SYNC.claims !== 'view' && SYNC.level === 'edit' && SYNC.backend && typeof SYNC.backend.ticks === 'function'; }
function visible() { var pane = document.getElementById('pane-servicing'); return !!(pane && pane.classList.contains('on') && !document.hidden); }
function timeNow() { return clockNow + Math.max(0, performance.now() - clockAt); }
var reader = SvcAdminReader.create(function (q) { if (!editable()) throw new Error('The edit link is no longer connected.'); return SYNC.backend.ticks(q); });
function configMatches(t, real) {
  if (!t || !Array.isArray(t.lines) || !Array.isArray(t.days)) return false;
  var want = []; D.areas.forEach(function (a) { a.refs.forEach(function (r) { r.lines.forEach(function (l) { want.push([l.id, r.ref, l.kind, l.qty].join('|')); }); }); });
  var got = t.lines.map(function (l) { return [l.id, l.ref, l.kind, l.qty].join('|'); });
  var days = function (ds) { return ds.map(function (d) { return d.id + ':' + d.plan; }).sort().join('|'); };
  if (want.sort().join('\n') !== got.sort().join('\n') || (real && days(D.days) !== days(t.days))) return false;
  if (!t.days.length || t.days.length > 7 || !t.days.every(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d.id) && Object.keys(D.plans).every(function (k) { return D.plans[k][d.plan]; }); })) return false;
  return Object.keys(D.plans).every(function (kind) { return t.plans && t.plans[kind] && Object.keys(D.plans[kind]).every(function (p) { return Array.isArray(t.plans[kind][p]) && D.plans[kind][p].join('|') === t.plans[kind][p].join('|'); }); });
}
function clearPrivate() { if(admin){admin.clear();admin=null;} list = []; selected = ''; model = null; reader.clear(); if (host) { host.hidden = true; host.style.display = 'none'; picker.innerHTML = ''; content.innerHTML = ''; } lastSignature = ''; }
function mount() {
  var pane = document.getElementById('pane-servicing'); if (!pane) return false;
  if (!host) {
    host = document.createElement('section'); host.id = 'svc1067-host'; host.className = 'card'; host.hidden = true;
    host.innerHTML = '<div class="svc1067-select"></div><div id="svc1067" aria-live="polite"></div>';
    picker = host.firstChild; content = host.lastChild;
    host.addEventListener('change', function (e) {
      if (!e.target.matches('[data-svc-tracker]')) return;
      if (e.target.value === '') return;
      var entry = list[Number(e.target.value)]; if (!entry) return;
      selected = entry.token; model = null; open = {}; pickedDay = ''; reader.clear(selected); lastSignature = ''; poll();
    });
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-svc-day]'); if (!b || !model) return;
      pickedDay = b.getAttribute('data-svc-day'); draw(true);
      var fresh = host.querySelector('[data-svc-day="' + pickedDay + '"]'); if (fresh) fresh.focus({preventScroll:true});
    });
    host.addEventListener('toggle', function (e) { if (e.target.matches('details[data-svc-area]')) open[e.target.getAttribute('data-svc-area')] = e.target.open; }, true);
  }
  if (!note) { note = document.createElement('section'); note.className = 'card'; note.id = 'svc1084-note';
    note.innerHTML = '<h3>Servicing</h3><p>Servicing progress, the audit list and making the crew QR codes are on the edit link. Open the page with the edit link to see them.</p>'; }
  if (!note.isConnected || note.parentNode !== pane) pane.appendChild(note);
  if (!host.isConnected || host.parentNode !== pane) pane.appendChild(host);
  if (!observer) { observer = new MutationObserver(wake); observer.observe(pane, {attributes:true, attributeFilter:['class']}); }
  return true;
}
function draw(force) {
  if (!mount()) return;
  note.hidden = editable();
  if (!editable()) { clearPrivate(); return; }
  if(!admin)admin=SvcTrackerAdmin1067.mount(host,{data:SVC1067_CARD.data,template:SVC1067_CARD.html,editable:editable,changed:function(t){selected=t;model=null;reader.clear(t);lastSignature='';poll();}});
  host.hidden = !visible(); host.style.display = visible() ? '' : 'none';
  if (!visible()) return;
  var pickHtml = '<label>Servicing tracker <select data-svc-tracker data-ro><option value="">Select a tracker</option>' + list.map(function (t, i) {
    var real = t.load === 'servicing-tracker:GC500-2026';
    return '<option value="' + i + '"' + (t.token === selected ? ' selected' : '') + '>' + SvcPanel.esc((real ? 'Event tracker' : 'TEST / other tracker') + (t.expired ? ' · expired' : '') + (t.card_withdrawn ? ' · withdrawn' : '') + ' · ' + (t.title || 'Untitled')) + '</option>';
  }).join('') + '</select></label>';
  if (picker.innerHTML !== pickHtml && document.activeElement !== picker.querySelector('select')) picker.innerHTML = pickHtml;
  var html;
  if (!model) html = '<h3>Servicing tracker</h3><p role="status">' + SvcPanel.esc(status || (list.length ? 'Select the event tracker to see its verified progress.' : 'No servicing tracker has been published yet.')) + '</p>';
  else {
    var now = timeNow(), data = model.D, day = pickedDay || SvcState.autoDay(data, now), meta = model.meta;
    var flag = meta.load !== 'servicing-tracker:GC500-2026' ? '<p class="svc-ex"><b>TEST / other tracker</b> · practice progress is separate from the event tracker.</p>' : '';
    if (meta.card_withdrawn || meta.expired || !meta.key_kept) flag += '<p class="svc-ex">' + (meta.card_withdrawn ? 'This tracker was withdrawn.' : meta.expired ? 'This tracker has expired.' : 'The completion codes need administrator attention.') + ' Recorded progress is shown for review.</p>';
    html = flag + SvcPanel.svcPanelHtml({D:data, S:SvcState, events:model.events, now:now, lastRead:clockNow, day:day, open:open, example:false,
      readStatus: status || 'Read-only progress · last verified ' + SvcState.hm(clockNow) + ' AEST · checks every 20 s while Servicing is open.'}).replace(/svc1063/g, 'svc1067');
  }
  if (force || html !== lastSignature) { content.innerHTML = html; lastSignature = html; }
}
async function poll() {
  clearTimeout(timer); timer = 0;
  if (!mount() || !editable()) { clearPrivate(); schedule(); return; }
  if (!visible() || busy) { draw(); schedule(); return; }
  busy = true;
  try {
    if (SYNC.status !== 'live') throw new Error('The shared service is not connected.');
    var listing = await SYNC.backend.ticks({});
    if (!editable() || !visible()) return;
    list = (listing.trackers || []).filter(function (t) { return typeof t.load === 'string' && t.load.indexOf('servicing-tracker:') === 0; });
    if (selected && !list.some(function (t) { return t.token === selected; })) { selected = ''; model = null; reader.clear(); }
    if (!selected) { var real = list.filter(function (t) { return t.load === 'servicing-tracker:GC500-2026' && t.tracker && !t.card_withdrawn && !t.expired; }); if (real.length === 1) selected = real[0].token; }
    if (selected) {
      var reading = selected, snap = await reader.read(reading);
      if (!editable() || !visible() || reading !== selected) return;
      if (!configMatches(snap.meta.tracker, snap.meta.load === 'servicing-tracker:GC500-2026')) { model = null; throw new Error('This tracker uses a different reference list. Update the page before reading its percentages.'); }
      var at = Date.parse(snap.meta.now); if (!Number.isFinite(at)) throw new Error('Waiting for a readable service clock.');
      snap.D = D;
      if (snap.meta.load !== 'servicing-tracker:GC500-2026') {
        snap.D = Object.assign({}, D, {days:snap.meta.tracker.days.map(function (d) {
          var dt = new Date(d.id + 'T12:00:00Z');
          return {id:d.id, plan:d.plan, label:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dt.getUTCDay()] + ' ' + dt.getUTCDate(), ifNeeded:false};
        })});
      }
      if (pickedDay && !snap.D.days.some(function (d) { return d.id === pickedDay; })) pickedDay = '';
      model = snap; clockNow = at; clockAt = performance.now(); status = '';
    } else status = list.length ? '' : 'No servicing tracker has been published yet.';
  } catch (e) { status = (model ? 'Showing the last verified progress. ' : '') + String(e.message || 'The tracker could not be read.'); }
  finally { busy = false; draw(); schedule(); }
}
function schedule() { clearTimeout(timer); timer = setTimeout(poll, 20000); }
function wake() { draw(); if (editable() && visible() && !busy) poll(); }
/* REST permission changes already call applyCapability; clear private state in that same turn. */
if (typeof W.applyCapability === 'function') {
  var applyAccess = W.applyCapability, hadAccess = editable();
  W.applyCapability = function () {
    var result = applyAccess.apply(this, arguments), hasAccess = editable();
    if (!hasAccess) clearPrivate();
    else if (!hadAccess) wake();
    hadAccess = hasAccess;
    return result;
  };
}
W.addEventListener('hashchange', wake);
document.addEventListener('visibilitychange', wake);
W.addEventListener('pagehide', function () { clearTimeout(timer); });
W.addEventListener('pageshow', wake);
W.renderServicing1084 = wake;
mount(); wake(); schedule();
})(window);
