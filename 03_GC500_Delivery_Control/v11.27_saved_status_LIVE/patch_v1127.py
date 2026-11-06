"""Author: Andrew Fisher. v11.27 - Save & close opens a status page instead of closing the card.

Andrew, 22 Oct 2026: "When they save it. It cutrently closes it. Can it go to a status conpletion page for them or show whats
been done and what still needs to be done".

On the live v11.26 card, Save & close showed a short "Saved" card and, once every tap had reached the service, tried to close
the window after 1.2 s. v11.27: the window is never closed. Save & close shows a status page: Saved (or Saving / Kept on this
phone, as before) with this reference done-stamped or the jobs it still needs; what was done at this reference, every job
on every line with its time; the area, its percentage and what is still to go there with the missing-job icons, and the
three nearest references still to go (by the pins on the record, in metres, with their missing jobs); everything's
percentage; Back to the reference; Show every area (which also brings the Not done yet card). The sticky header keeps the
three job rings for the area. Footer v11.26 -> v11.27. Nothing else changes.

    python3 patch_v1127.py page.html      (in place, on the live v11.26 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain')); sys.path.insert(0, str(HERE.parent / 'v11.26_live_and_clear_LIVE'))
from rep import rep
import patch_v1126 as V26
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
E = V26.E

SAVED_OLD = """function savedView(day, st) {
  var a = AREA_OF[curRef], as = groupStats(a.refs, day, st), os = groupStats(ALL_REFS, day, st), n = waiting();
  var head = n ? (netDown || !navigator.onLine ? 'Kept on this phone' : 'Saving…') : 'Saved';
  var msg = n ? n + ' tap' + (n === 1 ? '' : 's') + (netDown || !navigator.onLine ? ' will send when there is signal. They also go the next time any code is scanned with signal.' : ' still sending. Keep this page open a moment.')
    : 'Everything from ' + curRef + ' is on the service.';
  return '<section class="card saved' + (n ? ' wait' : '') + '" role="status"><h2>' + esc(head) + (n ? '' : ' ' + TICK) + '</h2><p>' + esc(msg) + '</p>' +
    '<p class="savedpct">' + esc(areaLabel(a)) + ' <b' + (as.w > 0 && as.d >= as.w ? ' class="full"' : '') + '>' + as.pct + '%</b>' + (as.finished ? ' · area finished ' + hm(as.finished) : ' · ' + Math.max(0, as.w - as.d) + ' to go') + '<br>Everything <b' + (os.w > 0 && os.d >= os.w ? ' class="full"' : '') + '>' + os.pct + '%</b>' + (os.w > os.d ? ' · ' + (os.w - os.d) + ' to go' : '') + '</p>' +
    (n ? '' : '<p>You can close this page and scan the next code.</p>') +
    '<div class="bacts"><button class="bbtn" type="button" data-unsave="1">Back to ' + esc(curRef) + '</button></div></section>';
}"""
SAVED_NEW = """/* v11.27 - Save & close opens a status page, never closes the card (Andrew, 22 Oct 2026: "Can it go to a status conpletion page
   for them or show whats been done and what still needs to be done"). */
function distM(a, b) { var R = 6371000, k = Math.PI / 180, dLat = (b[0] - a[0]) * k, dLon = (b[1] - a[1]) * k, s = Math.sin(dLat / 2), t = Math.sin(dLon / 2), h = s * s + Math.cos(a[0] * k) * Math.cos(b[0] * k) * t * t; return 2 * R * Math.asin(Math.sqrt(h)); }
function nearestLeft(r, day, st, n) {
  if (!r.pin) return [];
  var out = [];
  ALL_REFS.forEach(function (o) { if (o === r || !o.pin || refStats(o, day, st).done || !missingTasks(o, day, st).length) return; out.push({ r: o, m: distM(r.pin, o.pin) }); });
  out.sort(function (x, y) { return x.m - y.m; });
  return out.slice(0, n || 3);
}
function savedView(day, st) {
  var r = REFS[curRef], a = AREA_OF[curRef], rs = refStats(r, day, st), as = groupStats(a.refs, day, st), os = groupStats(ALL_REFS, day, st), n = waiting();
  var head = n ? (netDown || !navigator.onLine ? 'Kept on this phone' : 'Saving…') : 'Saved';
  var msg = n ? n + ' tap' + (n === 1 ? '' : 's') + (netDown || !navigator.onLine ? ' will send when there is signal. They also go the next time any code is scanned with signal.' : ' still sending. Keep this page open a moment.')
    : 'Everything from ' + curRef + ' is on the service.';
  var miss = missingTasks(r, day, st);
  var h = '<section class="card saved' + (n ? ' wait' : '') + '" role="status"><h2>' + esc(head) + (n ? '' : ' ' + TICK) + '</h2><p>' + esc(msg) + '</p>' +
    '<p class="saved-ref">' + (rs.done ? '<span class="stamp">' + esc(curRef) + ' done</span>' + (rs.last ? ' <span class="stamp-at">' + hm(rs.last) + '</span>' : '') : '<b>' + esc(curRef) + '</b> still needs ' + esc(miss.map(function (t) { return TASKS[t] || t; }).join(', ')) + ' ' + missingIconsHtml(r, day, st)) + '</p>' +
    '<p class="savedpct">' + esc(areaLabel(a)) + ' <b' + (as.w > 0 && as.d >= as.w ? ' class="full"' : '') + '>' + as.pct + '%</b>' + (as.finished ? ' · area finished ' + hm(as.finished) : ' · ' + Math.max(0, as.w - as.d) + ' to go') + '<br>Everything <b' + (os.w > 0 && os.d >= os.w ? ' class="full"' : '') + '>' + os.pct + '%</b>' + (os.w > os.d ? ' · ' + (os.w - os.d) + ' to go' : '') + '</p>' +
    '<div class="bacts"><button class="bbtn" type="button" data-unsave="1">Back to ' + esc(curRef) + '</button></div></section>';
  h += '<section class="card status-ref" aria-labelledby="srh"><h3 id="srh">' + esc(curRef) + ' · what was done</h3><div class="rows">' + orowHtml(r, day, st) + '</div></section>';
  var near = nearestLeft(r, day, st, 3);
  h += '<section class="card status-area" aria-labelledby="sah"><h3 id="sah">' + esc(areaLabel(a)) + ' · ' + (as.finished ? 'finished ' + hm(as.finished) : Math.max(0, as.w - as.d) + ' job' + (as.w - as.d === 1 ? '' : 's') + ' to go') + '</h3>' + leftHtml(a, day, st) +
    (near.length ? '<div class="nearest"><h4>Nearest still to go</h4><div class="near-list">' + near.map(function (x) { var oa = AREA_OF[x.r.ref]; return '<span class="near-ref"><b>' + esc(x.r.ref) + '</b><small>' + (x.m < 5 ? 'same spot' : Math.round(x.m) + ' m') + (oa !== a ? ' · ' + (oa.n ? 'Area ' + oa.n : esc(oa.name)) : '') + '</small>' + missingIconsHtml(x.r, day, st) + '</span>'; }).join('') + '</div></div>' : (os.w > os.d ? '' : '<p class="nd-all">Every job on every reference is done.</p>')) + '</section>';
  h += '<button class="showall" type="button" data-showall="1" aria-expanded="' + showAll + '">' + (showAll ? 'Hide the other areas' : 'Show every area (view only)') + '</button>';
  if (showAll) h += notDoneHtml(day, st) + areasHtml(day, st, curRef);
  return h;
}
window.SvcSaved1127 = function (ref, dayId) { var was = curRef; curRef = ref; try { return savedView(dayId || shownDay(), jobStates(allEvents(), now())); } finally { curRef = was; } };"""
TRYCLOSE_OLD = "function tryClose() { if (closeTried) return; closeTried = true; setTimeout(function () { try { if (closing && !waiting()) window.close(); } catch (e) {} }, 1200); }"
TRYCLOSE_NEW = "function tryClose() { closeTried = true; }   /* v11.27 - the card stays open on the status page; it never closes itself */"
CSS_ADD = (".saved-ref{font-size:15px;margin:8px 0}.saved-ref b{font-size:18px}.saved-ref .nd-i{vertical-align:-3px}.saved-ref .stamp{font-size:20px;padding:3px 10px}"
           ".status-ref h3,.status-area h3{margin:0;padding:12px 14px 8px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}.status-ref .rows{border-top:1px solid var(--line)}.status-ref .orow{border-bottom:0}"
           ".status-area{padding:0 14px 12px}.status-area h3{padding-left:0;padding-right:0}.status-area .left-list{border-top:0;padding-top:0}"
           ".nearest{margin-top:10px;border-top:1px solid var(--line);padding-top:10px}.nearest h4{margin:0 0 8px;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mute)}.near-list{display:flex;flex-wrap:wrap;gap:8px}"
           ".near-ref{display:inline-flex;align-items:center;gap:7px;padding:6px 11px;border-radius:12px;background:#2a1a0d;border:1px solid #7a4418;color:var(--hivis2);font-variant-numeric:tabular-nums}.near-ref b{font-family:var(--display);font-weight:800;font-size:19px;line-height:1}.near-ref small{color:var(--mute);font-weight:600;font-size:12px}\n")
CARD_CSS = V26.CARD_CSS + CSS_ADD


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.27 requires the live v11.26 page ' + BASE_SHA256)
    if 'SvcSaved1127' in text: raise ValueError('v11.27 already applied')
    text = rep(text, E(SAVED_OLD), E(SAVED_NEW), 'card: the status page after Save & close', 'page')
    text = rep(text, E(TRYCLOSE_OLD), E(TRYCLOSE_NEW), 'card: never close the window', 'page')
    text = rep(text, E(V26.CARD_CSS), E(CARD_CSS), 'card: style', 'page')
    text = rep(text, "+' · v11.26'; /* v8.19 release922", "+' · v11.27'; /* v8.19 release922", 'release footer', 'page')
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    h = card['html']
    if 'window.close()' in h: raise ValueError('the crew card still closes its window')
    for needle in ['function nearestLeft', 'function savedView', 'window.SvcSaved1127', 'class="card status-ref"', 'class="card status-area"']:
        if h.count(needle) != 1: raise ValueError('the crew card template did not take v11.27 cleanly: ' + needle + ' x' + str(h.count(needle)))
    if h.count('<script') != 1 or '/*SVC1067_DATA*/null' not in h: raise ValueError('the crew card template lost its shape')
    if card['data']['tasks'].get('refill') != 'Water checked / refilled' or card['data']['extras'] != []: raise ValueError('the card bundle data changed')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1127 applied: Save & close opens the status page, the card never closes itself; footer v11.26 -> v11.27')
