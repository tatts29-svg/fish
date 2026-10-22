"""Author: Andrew Fisher. v11.22 - fresh water, counted on its own.

Andrew, 22 Oct 2026: "I want a percentage of what was filled of water. ... maybe like a water icon so we know what was done.
When they scan as i said i dont want it to be part of the completions done. But we also want to know how many of each were
filled ... As we want to make sure they check the water too. This is using the same clean qr code."; then "some toilets
might not need filling how you wanna gauge this or do we do check/ refilled to capture both".

The crew card has carried a "Refilled" job on every FWF and accessible unit's Clean & restock code since v10.67, as an
extra: tapped if refilled, never counted in the completion percentage. Nothing added it up, and a unit that needed no water
looked the same as one nobody looked at. This release:

- adds "Water checked" as a second extra beside "Refilled" on the clean code of every FWF and accessible unit (the tracker
  definition: page data and the card bundle's copy). The water percentage is checked-of-all; the refilled count sits beside
  it, by kind. The completion percentage is untouched (extras were never in it);
- the page's servicing panel (Event nights): a water line under the whole-night meter - a drop, the percentage, "Water
  checked · d of w units · refilled r (FWF a, accessible b)" - and a small one on each area's row;
- the crew card template (SVC1067_CARD.html, what "Create / update tracker" publishes): the same line under the progress bars
  (area and everything), a small one on each area's header, the reference's own count on its code's card, and the hint on
  the new job. The crews see it once the tracker is updated from the page's own admin fold, which keeps the printed codes;
- footer v11.21 -> v11.22.

    python3 patch_v1122.py page.html      (in place, on the live v11.21 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()


def card_escape(t):
    """the crew card is a JSON string inside `var SVC1067_CARD=`: double quotes and backslashes escaped, newlines as \\n,
    `<` as \\u003c (checked byte for byte against the live page on an existing function)"""
    return json.dumps(t, ensure_ascii=False)[1:-1].replace('<', '\\u003c')


DATA_EDITS = [  # each appears twice: `var SVC1067_DATA=` (the panel) and SVC1067_CARD.data (what the admin fold publishes)
    ('"tasks":{"pump":"Pump out","clean":"Clean & restock","lockup":"Pump out, clean & lock","refill":"Refilled"}',
     '"tasks":{"pump":"Pump out","clean":"Clean & restock","lockup":"Pump out, clean & lock","check":"Water checked","refill":"Refilled"}'),
    ('"extras":["refill"]', '"extras":["check","refill"]'),
    ('"clean":{"label":"Clean & restock","tasks":["clean","lockup","refill"]}', '"clean":{"label":"Clean & restock","tasks":["clean","lockup","check","refill"]}'),
    ('"fwf":{"night":["pump","clean","refill"],"final":["lockup"]}', '"fwf":{"night":["pump","clean","check","refill"],"final":["lockup"]}'),
    ('"access":{"night":["pump","clean","refill"],"final":["lockup"]}', '"access":{"night":["pump","clean","check","refill"],"final":["lockup"]}'),
]

PANEL_FNS = r"""/* v11.22 - fresh water on its own. Water checked and Refilled are extras: never in the completion percentage, but counted
   here so the manager sees what was checked and what was filled, by kind. Andrew, 22 Oct 2026: "we want to make sure they
   check the water too"; "some toilets might not need filling ... check/ refilled to capture both". */
var WATER_KIND1122 = { fwf: 'FWF', access: 'accessible', pan16: '16-pan', block: 'block', sewer: 'block', tank: 'tank' };
function waterStats(M, cfg, st, refs) {
  var o = { w: 0, d: 0, r: 0, kinds: Object.create(null) };
  refs.forEach(function (r) { r.lines.forEach(function (l) {
    var ts = M.S.tasksFor(cfg, l, M.day); if (ts.indexOf('check') < 0 && ts.indexOf('refill') < 0) return;
    var k = o.kinds[l.kind] || (o.kinds[l.kind] = { w: 0, d: 0, r: 0 });
    o.w += l.qty; k.w += l.qty;
    if (st[M.S.jobKey(l.id, 'check', M.day)]) { o.d += l.qty; k.d += l.qty; }
    if (st[M.S.jobKey(l.id, 'refill', M.day)]) { o.r += l.qty; k.r += l.qty; }
  }); });
  o.pct = o.w ? Math.floor(o.d * 100 / o.w) : 0; return o;
}
function waterHtml(M, cfg, st, refs, size) {
  var o = waterStats(M, cfg, st, refs); if (!o.w) return '';
  var kinds = Object.keys(o.kinds).map(function (k) { var x = o.kinds[k]; return esc(WATER_KIND1122[k] || k) + ' ' + x.r; }).join(', ');
  return '<span class="svc1122-water' + (size === 'area' ? ' area' : '') + (o.d >= o.w ? ' full' : '') + '" data-svc1122="' + esc(size) + '" role="group" aria-label="Fresh water checked, ' + o.d + ' of ' + o.w + ' units, ' + o.r + ' refilled, not in the completion percentage">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-3.6 5-7 8.6-7 12.4a7 7 0 0 0 14 0c0-3.8-3.4-7.4-7-12.4z"/></svg><b>' + o.pct + '%</b><span>Water checked · ' + o.d + ' of ' + o.w + ' units · refilled ' + o.r + (size === 'area' ? '' : ' (' + kinds + ')') + '<small>tracked on its own · not in the completion %</small></span></span>';
}
"""
PANEL_CSS = ("/* v11.22 water */ .svc1122-water{display:flex;align-items:center;gap:10px;margin:10px 0 2px;padding:8px 12px;border-radius:10px;background:rgba(56,160,255,.10);border:1px solid rgba(95,180,255,.38);color:#d6e9ff;font-size:13px;line-height:1.3}"
             " .svc1122-water svg{width:22px;height:22px;fill:#5fb4ff;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(95,180,255,.6))}"
             " .svc1122-water b{font-size:20px;font-weight:800;color:#8fd0ff;font-variant-numeric:tabular-nums;min-width:3.2ch;line-height:1}"
             " .svc1122-water>span{display:flex;flex-direction:column;min-width:0} .svc1122-water small{color:#9cb0c2;font-size:11.5px}"
             " .svc1122-water.full{background:rgba(46,240,171,.10);border-color:rgba(125,255,208,.45)} .svc1122-water.full b{color:#7dffd0} .svc1122-water.full svg{fill:#7dffd0}"
             " .svc1122-water.area{margin:0 0 0 auto;padding:3px 8px;font-size:12px;gap:6px;border-radius:8px} .svc1122-water.area b{font-size:15px} .svc1122-water.area svg{width:16px;height:16px} .svc1122-water.area small{display:none} ")

CARD_FNS = """/* v11.22 - fresh water on its own: Water checked and Refilled are extras, never in the completion %, but counted here so
   the crews and the manager can see what was checked and what was filled. Andrew, 22 Oct 2026: "we want to make sure they
   check the water too"; "some toilets might not need filling ... check/ refilled to capture both". */
var WATER_KIND = { fwf: 'FWF', access: 'accessible' };
function waterStats(refs, day, st) {
  var o = { w: 0, d: 0, r: 0, kinds: {} };
  refs.forEach(function (r) { r.lines.forEach(function (l) {
    var ts = tasksFor(l, day); if (ts.indexOf('check') < 0 && ts.indexOf('refill') < 0) return;
    var k = o.kinds[l.kind] || (o.kinds[l.kind] = { w: 0, d: 0, r: 0 });
    o.w += l.qty; k.w += l.qty;
    if (st[jobKey(l.id, 'check', day)]) { o.d += l.qty; k.d += l.qty; }
    if (st[jobKey(l.id, 'refill', day)]) { o.r += l.qty; k.r += l.qty; }
  }); });
  o.pct = o.w ? Math.floor(o.d * 100 / o.w) : 0; return o;
}
var DROP = '<svg class="drop" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-3.6 5-7 8.6-7 12.4a7 7 0 0 0 14 0c0-3.8-3.4-7.4-7-12.4z"/></svg>';
function waterHtml(refs, day, st, where) {
  var o = waterStats(refs, day, st); if (!o.w) return '';
  var small = where === 'small', tag = small ? 'span' : 'div';
  var kinds = Object.keys(o.kinds).map(function (k) { var x = o.kinds[k]; return (WATER_KIND[k] || k) + ' ' + x.r; }).join(', ');
  return '<' + tag + ' class="water' + (o.d >= o.w ? ' full' : '') + (small ? ' small' : '') + '" role="group" aria-label="Fresh water checked, ' + o.d + ' of ' + o.w + ' units, ' + o.r + ' refilled, not counted in the percentage">' + DROP + '<b>' + o.pct + '%</b><span>Water checked · ' + o.d + ' of ' + o.w + ' · refilled ' + o.r + (small || where === 'ref' ? '' : ' (' + kinds + ')') + '<small>not in the completion %</small></span></' + tag + '>';
}
"""
CARD_CSS = (".water{display:flex;align-items:center;gap:10px;margin:8px 0 0;padding:8px 12px;border-radius:12px;background:rgba(56,160,255,.12);border:1px solid rgba(95,180,255,.45);color:#d6e9ff;font-size:13.5px;line-height:1.25}"
            ".water .drop{width:26px;height:26px;fill:#5fb4ff;flex-shrink:0;filter:drop-shadow(0 0 8px rgba(95,180,255,.7))}"
            ".water b{font-family:var(--display);font-size:26px;font-weight:800;color:#8fd0ff;font-variant-numeric:tabular-nums;line-height:1;min-width:3.2ch;text-shadow:0 0 10px rgba(95,180,255,.5)}"
            ".water>span{display:flex;flex-direction:column;min-width:0;text-align:left}.water small{color:var(--mute);font-size:11.5px;font-weight:400}"
            ".water.full{background:rgba(46,240,171,.12);border-color:rgba(125,255,208,.5)}.water.full b{color:var(--done2)}.water.full .drop{fill:var(--done2)}"
            ".water.small{padding:3px 8px;gap:6px;font-size:12px;margin:4px 0 0;border-radius:8px;width:fit-content}.water.small b{font-size:16px}.water.small .drop{width:16px;height:16px}.water.small small{display:none}\n")


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.22 requires the live v11.21 page ' + BASE_SHA256)
    if 'svc1122-water' in text: raise ValueError('v11.22 already applied')
    # the tracker definition: a Water checked extra on the clean code for FWF and accessible units
    for old, new in DATA_EDITS:
        if text.count(old) != 2: raise ValueError('tracker definition anchor is not exactly twice on the page: ' + old[:60])
        text = text.replace(old, new)
    text = rep(text, '"version":"tracker-data 21 Oct 2026; confirmed servicing-only trailer addition; existing site records retained"',
               '"version":"tracker-data 22 Oct 2026; Water checked added as an extra on the clean code (Andrew, 22 Oct); 21 Oct trailer addition and site records retained"', 'tracker data version', 'page')
    # the page's servicing panel
    text = rep(text, 'function svcPanelHtml(M) {', PANEL_FNS + 'function svcPanelHtml(M) {', 'panel: water functions', 'page')
    text = rep(text, "tasksHtml(M, cfg, st, all) + '<div class=\"svc-areas\">'", "tasksHtml(M, cfg, st, all) + waterHtml(M, cfg, st, all, 'overall') + '<div class=\"svc-areas\">'", 'panel: overall water line', 'page')
    text = rep(text, "<span class=\"svc1107-hint\">references and times</span>'+", "<span class=\"svc1107-hint\">references and times</span>'+waterHtml(M,cfg,st,a.refs,'area')+", 'panel: area water line', 'page')
    text = rep(text, '<style id="svc1102-style">', '<style id="svc1102-style">' + PANEL_CSS, 'panel: water style', 'page')
    # the crew card template, inside its JSON string
    E = card_escape
    text = rep(text, E('function compactHtml(day, os, st) {'), E(CARD_FNS + 'function compactHtml(day, os, st) {'), 'card: water functions', 'page')
    text = rep(text, E("bars = progHtml(areaLabel(a), groupStats(a.refs, day, st), 'area') + progHtml('Everything', os, 'all');"),
               E("bars = progHtml(areaLabel(a), groupStats(a.refs, day, st), 'area') + waterHtml(a.refs, day, st, 'area') + progHtml('Everything', os, 'all') + waterHtml(ALL_REFS, day, st, 'all');"), 'card: water under the bars (tick mode)', 'page')
    text = rep(text, E("} else bars = progHtml('Everything · ' + longDay(day), os, 'all');"), E("} else bars = progHtml('Everything · ' + longDay(day), os, 'all') + waterHtml(ALL_REFS, day, st, 'all');"), 'card: water under the bar (view mode)', 'page')
    text = rep(text, E("'<span class=\"ameta\">' + (s.finished ? '<span class=\"fin\">Area finished ' + hm(s.finished) + '</span>' : '') +"),
               E("'<span class=\"ameta\">' + waterHtml(a.refs, day, st, 'small') + (s.finished ? '<span class=\"fin\">Area finished ' + hm(s.finished) + '</span>' : '') +"), 'card: water on each area header', 'page')
    text = rep(text, E("'<div class=\"count\">' + n + ' unit' + (n === 1 ? '' : 's') + ' at ' + esc(r.ref) + (r.lines.length > 1 ? ' · ' + r.lines.length + ' completion lines' : '') + '</div>' +"),
               E("'<div class=\"count\">' + n + ' unit' + (n === 1 ? '' : 's') + ' at ' + esc(r.ref) + (r.lines.length > 1 ? ' · ' + r.lines.length + ' completion lines' : '') + '</div>' + waterHtml([r], day, st, 'ref') +"), 'card: the reference\'s own water count', 'page')
    text = rep(text, E("extra ? 'Tap if refilled · not counted in %' : 'Tap to complete'"), E("extra ? (task === 'check' ? 'Tap when the water is checked · not counted in %' : 'Tap if refilled · not counted in %') : 'Tap to complete'"), 'card: the Water checked hint', 'page')
    text = rep(text, E('</style>'), E(CARD_CSS + '</style>'), 'card: water style', 'page')
    text = rep(text, "+' · v11.21'; /* v8.19 release922", "+' · v11.22'; /* v8.19 release922", 'release footer', 'page')
    # the card must still be a valid JSON string that parses to a template with one script and the data placeholder
    i = text.find('var SVC1067_CARD='); j = text.find('\n', i); card = json.loads(text[i + len('var SVC1067_CARD='):j].rstrip(';'))
    if card['html'].count('<script') != 1 or '/*SVC1067_DATA*/null' not in card['html'] or 'function waterHtml' not in card['html']: raise ValueError('the crew card template did not take the water tally')
    if card['data']['tasks'].get('check') != 'Water checked' or card['data']['extras'] != ['check', 'refill']: raise ValueError('the card bundle data did not take the Water checked job')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1122 applied: Water checked extra; water tally on the servicing panel and the crew card template; footer v11.21 -> v11.22')
