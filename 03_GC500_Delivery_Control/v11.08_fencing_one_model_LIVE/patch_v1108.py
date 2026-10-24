"""Author: Andrew Fisher. v11.08 - one fencing model on every fencing display.

Andrew, 21-22 Oct 2026: "Fencing is still not complete its not 100% yet"; "We need fencing correct we need this fixed.
You have all the dockets. You have all the maps and schedule".

Two models were live. The Build index (todayWorkSummary848 with the 1047/1104 installed-scope rules) is the right one:
on every docket the mesh-panel count x 2.5 m equals the CLEAN metres, scrimmed dockets included (88 of 89), so a
"braced for scrim" quantity is the same fence with scrim on it, not extra fence. Fence standing = every usable dated
docket's clean line (11,345 m) against the programme's clean + braced metres plus the signed-complete Phillip Park
allowance (12,617 m) = 89.9%; scrim fitted 1,725 of 4,394.5 m on its own row; vehicle gates from docket wheels (2 per
gate), 108 of 135; crowd-control barriers with their classification range; removals from collections and service
notes. The other model (fenceMetres over fenceTypes) added clean and braced raw: 13,302.5 of 12,359.5 m = 100% on
Today's "9 types" card, the Showcase fence scene, the milestone and the copy text. fenceMetres() now reads the Build
index rows, memoised for 30 s per day, so every consumer agrees. The one reviewed service note whose snapshot had
gone stale (24481: metres corrected 185 -> 65 by the financial association, same 65 m relocation + 120 m scrim) is
re-snapshotted so the relocation row reads again. Footer v11.07 -> v11.08. Dockets, programme, rates and money untouched.

    python3 patch_v1108.py page.html      (in place, on the live v11.07 page)
"""
import hashlib, json, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = 'dc6418352db789ea41fdc78242191e98394ba03399f4fdcb5da3e0ab99d30d3d'

NEW_FENCE_METRES = r"""function fenceMetres(P){
 /* v11.08 (Andrew, 22 Oct 2026: "We need fencing correct"): ONE model. The rows are the Build index's reviewed
    fencing rows (todayWorkSummary848 + the installed-scope rules): fence standing is every usable dated docket's clean
    line (a scrimmed docket's panels x 2.5 m = its clean metres, so braced fence is the same fence), scrim fitted on
    its own row, gates from docket wheels, CCB with its review range. Memoised 30 s per day. */
 var day = (P && P.asOf) || todayIso(), now = Date.now(), c = fenceMetres.cache1108, rows;
 if (c && c.day === day && now - c.at < 30000) rows = c.rows;
 else {
  var s = typeof todayWorkSummary848 === 'function' ? todayWorkSummary848(day) : null;
  rows = s && Array.isArray(s.fencingRows) ? s.fencingRows : [];
  /* a read before the shared records are ready is never cached: the next render reads again */
  if (s && s.health && s.health.ready && rows.length) fenceMetres.cache1108 = {day: day, at: now, rows: rows};
 }
 var num = function(v){ return typeof v === 'number' && isFinite(v); };
 var by = function(id){ return rows.find(function(r){ return r && r.id === id; }) || {}; };
 var order = ['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','flat_feet','relocation','removal'];
 var types = order.map(by).filter(function(r){ return r.id && (num(r.total) || num(r.done) || r.recordedRange); }).map(function(r){
  var done = num(r.done) ? r.done : (r.recordedRange && num(r.recordedRange.min) ? r.recordedRange.min : 0);
  return {key: r.id, type: r.label || r.id, name: r.label || r.id, unit: r.unit || 'm', total: num(r.total) ? r.total : 0,
   planned: r.plan && num(r.plan.planned) ? r.plan.planned : null, done: done, left: num(r.left) ? r.left : (num(r.total) ? Math.max(0, r.total - done) : null),
   range: r.recordedRange || null, pending: !!r.evidencePending, metres: (r.unit || 'm') === 'm'}; });
 var fence = by('clean'), scrim = by('scrim');
 var done = num(fence.done) ? fence.done : 0, total = num(fence.total) ? fence.total : 0;
 return {done: done, total: total, left: Math.max(0, total - done), planned: fence.plan && num(fence.plan.planned) ? fence.plan.planned : 0,
  clean: num(fence.total) ? fence.total : 0, scrim: num(scrim.total) ? scrim.total : 0, scrimDone: num(scrim.done) ? scrim.done : 0,
  docketed: null, types: types, rows: rows, model: 'build-index-848'}; }"""

def patch(text):
    if BASE_SHA256 and hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.08 requires the live v11.07 page ' + BASE_SHA256)
    # 1. fenceMetres reads the Build index rows
    start = text.index('function fenceMetres(P){'); end = text.index('function dsnHeadline(asOf, X){', start)
    old = text[start:end]
    if "ft.reduce((s, t) => s + t.done, 0)" not in old: raise ValueError('fenceMetres is not the raw-sum version')
    text = text[:start] + NEW_FENCE_METRES + '\n' + text[end:]
    # 2. Today's "9 types" card: one model, no additive headline, left-to-do by type
    text = rep(text,
        "const F = fenceMetres(P), ft = fenceCcbDisplayTypes847(P), fd = fenceDerived(), gaps = fenceGapsOf(ft);",
        "const F = fenceMetres(P), ft = F.types, fd = fenceDerived(), gaps = [];   /* v11.08: the Build index's rows; no second model */",
        'Today fencing card reads the one model', 'page')
    text = rep(text,
        "<div class=\"n\">${esc(fmtNum(F.done))}<small> of ${esc(fmtNum(F.total))} m of fence work on dockets</small></div>  ${gauge(F.done, F.total, F.planned ? `${esc(fmtNum(F.planned))} m planned by this day` : 'nothing planned by this day', null)}",
        "<div class=\"n\">${esc(fmtNum(F.done))}<small> of ${esc(fmtNum(F.total))} m of fence standing</small></div>  ${gauge(F.done, F.total, (F.planned ? `${esc(fmtNum(F.planned))} m planned by this day` : 'nothing planned by this day') + ` · scrim fitted ${esc(fmtNum(F.scrimDone))} of ${esc(fmtNum(F.scrim))} m`, null)}",
        'Today fencing headline: fence standing and scrim fitted', 'page')
    text = rep(text,
        "<thead><tr><th>Type</th><th>done</th><th>planned by day</th><th>programme</th></tr></thead><tbody>${  ft.map(t => `<tr class=\"${t.planned != null && t.done < t.planned ? 'behind' : ''}\"><td title=\"${esc(t.type)}\">${esc(t.name)} <i>${esc(t.unit)}</i></td><td>${esc(fmtNum(Math.round(t.done * 100) / 100))}</td><td>${t.planned == null ? '—' : esc(fmtNum(Math.round(t.planned * 100) / 100))}</td><td>${esc(fmtNum(t.total))}</td></tr>`).join('')}</tbody></table>",
        "<thead><tr><th>Type</th><th>done</th><th>left</th><th>programme</th></tr></thead><tbody>${  ft.map(t => `<tr class=\"${t.pending ? 'pend' : t.left > 0 ? 'behind' : ''}\"><td title=\"${esc(t.type)}\">${esc(t.name)} <i>${esc(t.unit)}</i></td><td>${t.pending ? 'review' : t.range ? esc(fmtNum(t.range.min) + '–' + fmtNum(t.range.max)) : esc(fmtNum(Math.round(t.done * 100) / 100))}</td><td>${t.pending || t.left == null ? '—' : esc(fmtNum(Math.round(t.left * 100) / 100))}</td><td>${t.total ? esc(fmtNum(t.total)) : '—'}</td></tr>`).join('')}</tbody></table>",
        'Today fencing table: done, left, programme per type', 'page')
    # 3. the copy text
    text = rep(text,
        "`FENCING: ${fmtNum(F.done)} of ${fmtNum(F.total)}m of fence work on dockets${F.planned ?",
        "`FENCING: ${fmtNum(F.done)} of ${fmtNum(F.total)}m of fence standing (every docket's clean line; scrim fitted ${fmtNum(F.scrimDone)} of ${fmtNum(F.scrim)} m)${F.planned ?",
        'copy text: fence standing', 'page')
    text = rep(text,
        "${(() => {const g = fenceGapsOf(fenceCcbDisplayTypes847(P)); return g.length ?' · programme/docket differences by type: ' + g.map(fenceGapWords).join(', ') : ''; })()}",
        "${(() => {const g = (F.types || []).filter(t => t.left > 0 && !t.pending); return g.length ? ' · left by type: ' + g.map(t => `${t.name} ${fmtNum(t.left)} ${t.unit}`).join(', ') : ''; })()}",
        'copy text: left by type from the one model', 'page')
    # 4. Showcase "Where the fence is up to": the gates and barriers come from the same rows
    text = rep(text,
        "const units = fenceTypes(progressAsOf(asOf)).filter(x => !/Temporary Fence/.test(x.type) && (x.done || x.total));",
        "const units = (F.types || []).filter(x => !x.metres && (x.done || x.total));   /* v11.08: the same rows as the metres */",
        'Showcase units from the one model', 'page')
    text = rep(text, "const rows = (F.types || []).filter(x => x.total > 0 || x.done > 0) .sort((a, b) => (b.total || 0) - (a.total || 0));",
        "const rows = (F.types || []).filter(x => x.metres && (x.total > 0 || x.done > 0)) .sort((a, b) => (b.total || 0) - (a.total || 0));",
        'Showcase metre rows only', 'page')
    # 5. the stale review snapshot for service note 24481 (metres 185 -> 65 after the financial association; same facts)
    old_expected = '"expected":{"id":"N-AF-0007","note_no":"24481","date":"2026-10-15","week":"Week 1","usable":true,"location":"S.0.8 B.O.H.","note":"Includes relocation of S.0.8 C.2 to S.0.8 B.O.H. 65 m. Also includes 120 m scrim. Hire agreement doct num 36614.","crew_note":"1 hr x 4 men","labour_hours":4,"metres":185}'
    new_expected = '"expected":{"id":"N-AF-0007","note_no":"24481","date":"2026-10-15","week":"Week 1","usable":true,"location":"S.0.8 B.O.H.","note":"Includes relocation of S08 CZ to S08 BOH: 65 m. Also includes 120 m scrim, a separate activity. Hire agreement docket number 36614. Labour: 1 hr x 4 men = 4 person-hours. Original source-zone glyph resembles C.Z./C.2.; normalised as construction zone. The earlier metres value 185 combined relocation and scrim; the Metres moved field now retains only the written 65 m relocation.","crew_note":"1 hr x 4 men","labour_hours":4,"metres":65}'
    n = text.count(old_expected)
    if n != 2: raise ValueError('expected the 24481 review snapshot twice (scrim_existing and relocation), found ' + str(n))
    text = text.replace(old_expected, new_expected)
    return rep(text, "+' · v11.07'; /* v8.19 release922", "+' · v11.08'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
