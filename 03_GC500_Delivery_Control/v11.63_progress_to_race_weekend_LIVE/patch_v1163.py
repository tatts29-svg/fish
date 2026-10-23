"""Author: Andrew Fisher. v11.63 - progress to race weekend.

Andrew, 23 Oct 2026: "Just with the progress we are doing progress of up to race weekend. Not after friday 23/10/2026. Or
things will look like they are not complete if that makes sense." Then: "We need to get this perfect." and "I need everything
talking. Everything updated."

What this patch does to the page:
  1. One cut-off, Fri 23 Oct 2026, for every progress reading: the Today board's day and its builders, the category index,
     the fencing card, Where we are (plates as at race weekend, over what is booked by race weekend; WB19 and WB20, booked to
     come in on 26 Oct and 2 Nov, named and not counted), Delivery pace and the Today report, the milestones and their banner
     and print, the Showcase progress scenes, the progress email, the Coates Way adherence rows, the Questions fencing gap
     and the tab dot. After the Friday they stay where race weekend left them; demob, costs, servicing, prestarts, the
     weather and the Timeline keep the real day.
  2. Fencing reads one figure: the four crowd-control reviews made stale by the scrim corrections of 23 Oct read again
     (36560, 36568, 36603, 36611: category unchanged), the fourteen event-week crowd-control dockets confirmed as recorded,
     36627 and 36629 confirmed split exactly as recorded.
  3. The evidence catalogue reads the papers: the 24481 overlap read again (36614 now carries the sheet's 85 m of scrim), the
     relocations on service notes 24482, 24483, 24484 and 24490 (147.5 m) and the removals on fourteen collection forms
     (350 mesh panels, 875 m) added on the catalogue's own rules.
  4. Footer v11.62 -> v11.63. progress1163.js holds the cut-off, the wrappers and the split rule; data_v1163.json the review
     rows and evidence operations, read from the record on 23 Oct 2026 (make_data.py).

    python3 patch_v1163.py page.html      (in place, on the live v11.62 page)
"""
import hashlib, json, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
MP = "typeof rwMergeP1163 === 'function' ? rwMergeP1163(progressAsOf(todayIso())) : progressAsOf(todayIso())"


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.63 requires the live v11.62 page ' + BASE_SHA256)
    cur = re.search(r"\+' · v11\.(\d+)'; /\* v8\.19 release922", text)
    if not cur or cur.group(1) != '62': raise ValueError('v11.63: the footer is not v11.62 where v8.19 put it')
    text = rep(text, cur.group(0), "+' · v11.63'; /* v8.19 release922", 'release footer', 'page')

    def R(old, new, what):
        nonlocal text
        text = rep(text, old, new, what, 'page')

    # the tab dot: overdue as at race weekend
    R("const late = progressAsOf(todayIso()).all.overdue;", "const late = (" + MP + ").all.overdue; /* v11.63 - progress to race weekend */", 'attention')
    # Questions: the fencing gap measured to the end of yesterday, never past race weekend
    R("const y = qYesterday(td), ft = fenceCcbDisplayTypes847(progressAsOf(y))",
      "const y = typeof rwDay1163 === 'function' ? rwDay1163(qYesterday(td)) : qYesterday(td), ft = fenceCcbDisplayTypes847(progressAsOf(y))", 'questions fencing gap')
    # Coates Way: the programme comparison, the reds, the pillars and the targets
    R("return {confirmation, asOf:todayIso(), rows:fenceCcbDisplayTypes847(progressAsOf(todayIso()))};",
      "const rw1163 = typeof rwDay1163 === 'function' ? rwDay1163(todayIso()) : todayIso(); return {confirmation, asOf:rw1163, rows:fenceCcbDisplayTypes847(progressAsOf(rw1163))};", 'fencingReview994')
    R("const P = progressAsOf(todayIso()); /* Aggregate", "const P = " + MP + "; /* v11.63 */ /* Aggregate", 'cwReds')
    R("function cwPillars(){\n const P = progressAsOf(todayIso()), all = P.all;", "function cwPillars(){\n const P = " + MP + ", all = P.all; /* v11.63 */", 'cwPillars P')
    R("rows: [['Due by today', `${fmtNum(all.due)} · ", "rows: [[P.rw1163 ? 'Due by race weekend' : 'Due by today', `${fmtNum(all.due)} · ", 'cwPillars due label')
    R("['On site now', `${fmtNum(all.onsite)} of ${fmtNum(all.due)} due by today`],",
      "['On site now', `${fmtNum(all.onsite)} of ${fmtNum(all.due)} due by ${P.rw1163 ? 'race weekend' : 'today'}`],", 'cwPillars on site label')
    R(" const P = progressAsOf(todayIso());\n const all = P.all;\n const bdAll = allBreakdowns()", " const P = " + MP + "; /* v11.63 */\n const all = P.all;\n const bdAll = allBreakdowns()", 'cwTargets P')
    R("of: 'references due by today on site'}},", "of: P.rw1163 ? 'references due by race weekend on site' : 'references due by today on site'}},", 'cwTargets label')
    # the Progress tab's detail: the build side as at race weekend, the demob side on the day
    R("const asOf = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso();\n const P = progressAsOf(asOf);\n state.list = P.all.overdue_keys.concat(P.all.norecord_keys);",
      "const asOf = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso();\n const P = typeof rwMergeP1163 === 'function' ? rwMergeP1163(progressAsOf(asOf)) : progressAsOf(asOf); /* v11.63 */\n state.list = P.all.overdue_keys.concat(P.all.norecord_keys);", 'renderProgress P')
    R("<h3>Build — everything due in by ${esc(fmtDate(asOf).slice(0, 10))}</h3>",
      "<h3>Build — everything due in by ${esc(fmtDate(P.rw1163 ? P.rw1163.day : asOf).slice(0, 10))}${P.rw1163 ? ' · race weekend' : ''}</h3>", 'renderProgress build heading')
    # Where we are: the plates' heading
    R("return `<h3 class=\"sec\">By group <span>what is on site over the total on the job, as at ${esc(fmtDay(asOf).dm)}</span></h3>",
      "return `<h3 class=\"sec\">By group <span>what is on site over the total ${X.rw1163 ? 'booked by race weekend' : 'on the job'}, as at ${esc(fmtDay(asOf).dm)}</span></h3>", 'dsnGroups heading')
    # the Showcase equipment scene's words
    R("${fine('Whole job, including work not due yet. On site is a light somebody set, or the rental system having it on hire.')}",
      "${fine(C.rw1163 ? 'Everything booked on site by race weekend, ' + fmtDate(C.rw1163.day) + '. ' + (typeof rwLaterWords1163 === 'function' && rwLaterWords1163(C.rw1163) ? rwLaterWords1163(C.rw1163) + ' ' : '') + 'On site is a light somebody set, or the rental system having it on hire.' : 'Whole job, including work not due yet. On site is a light somebody set, or the rental system having it on hire.')}", 'showScene equipment words')
    # Where we are card: say race weekend, not "As of"
    R("const notes=[m.day!==today?'As of '+fmtDate(m.day):'',",
      "const notes=[m.day!==today?(m.day===window.PROGRESS_TO1163&&today>m.day?'Progress to race weekend · '+fmtDate(m.day):'As of '+fmtDate(m.day)):'',", 'where885 note')
    # the weather on that card stays on the real day
    R("const day = fn('todayWorkDay841') ? todayWorkDay841() : (typeof todayIso === 'function' ? todayIso() : '');",
      "const day = fn('todayWorkDayReal1163') ? todayWorkDayReal1163() : fn('todayWorkDay841') ? todayWorkDay841() : (typeof todayIso === 'function' ? todayIso() : ''); /* v11.63 - weather on the real day */", 'weather day')
    # the progress email
    R("`HOW FAR THROUGH: ${Math.round(C.pct)}% of the job is on site — ${C.word.toUpperCase()}`,",
      "`HOW FAR THROUGH: ${Math.round(C.pct)}% of ${C.rw1163 ? 'everything booked by race weekend, ' + fmtDate(C.rw1163.day) + ',' : 'the job'} is on site — ${C.word.toUpperCase()}`, ...(C.rw1163 && typeof rwLaterWords1163 === 'function' && rwLaterWords1163(C.rw1163) ? [rwLaterWords1163(C.rw1163)] : []),", 'progress email')
    R("s + r.asked, 0))} on the job · ${rows.reduce((s, r) => s + r.nums.filter(x => !isMiscRow(x)).length, 0)} asset numbers on hire",
      "s + r.asked, 0))} ${X.rw1163 ? 'booked by race weekend' : 'on the job'} · ${rows.reduce((s, r) => s + r.nums.filter(x => !isMiscRow(x)).length, 0)} asset numbers on hire", 'progress email on site')
    # a receipt the record holds with no time stamp (the built-in receipts) stood by race weekend: it counts at the cut-off as it does today
    R("const receiptCurrent = receiptQty != null && (receiptDay ? receiptDay <= day : !receiptStamp && day >= todayIso());",
      "const receiptCurrent = receiptQty != null && (receiptDay ? receiptDay <= day : !receiptStamp && (day >= todayIso() || day === window.PROGRESS_TO1163)); /* v11.63 */", 'unstamped receipt at race weekend')
    # a VMS board moved off a reference and later replaced: at the race-weekend cut-off the current identities stand, as they did on the day
    R("const active=currentSnapshot(day)?gcModel925(a,{loading:false}).rows.filter(r=>r.physical&&r.item===item).length:0;",
      "const active=(currentSnapshot(day)||day===root.PROGRESS_TO1163)?gcModel925(a,{loading:false}).rows.filter(r=>r.physical&&r.item===item).length:0; /* v11.63 */", 'VMS replacement at race weekend')
    # the Today report gauge's spoken words
    R("<title id=\"wgt\">${esc(M.k2 === 'WHOLE JOB' ? 'Whole job' : 'Delivery against plan')}",
      "<title id=\"wgt\">${esc(M.k2 === 'WHOLE JOB' ? 'Whole job' : M.k2 === 'TO RACE WEEKEND' ? 'Booked by race weekend' : 'Delivery against plan')}", 'wip gauge title')
    R("id=\"wgsay\">${esc(M.k2 === 'WHOLE JOB' ? 'Whole job' : 'Delivery against plan')}",
      "id=\"wgsay\">${esc(M.k2 === 'WHOLE JOB' ? 'Whole job' : M.k2 === 'TO RACE WEEKEND' ? 'Booked by race weekend' : 'Delivery against plan')}", 'wip gauge words')
    # the milestones, their banner and the A4 print
    R("const asOf = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso();\n const old = document.getElementById('ms1025');",
      "const asOf0 = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso(), asOf = typeof rwDay1163 === 'function' ? rwDay1163(asOf0) : asOf0; /* v11.63 */\n const old = document.getElementById('ms1025');", 'milestones after')
    R("const asOf = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso();\n const list = which === 'all' ? reachedAreas(asOf)",
      "const asOf0 = /^\\d{4}-\\d{2}-\\d{2}$/.test(state.asOf || '') ? state.asOf : todayIso(), asOf = typeof rwDay1163 === 'function' ? rwDay1163(asOf0) : asOf0; /* v11.63 */\n const list = which === 'all' ? reachedAreas(asOf)", 'milestones print')

    data = json.loads((HERE / 'data_v1163.json').read_text(encoding='utf-8'))
    blob = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('Andrew Fisher', '\\u0041ndrew Fisher')  # the page's convention: the build's attribution scrub leaves the record's author alone
    if '</script' in blob.lower() or '<!--' in blob: raise ValueError('v11.63: data would break the script element')
    block = (HERE / 'progress1163.js').read_text(encoding='utf-8').strip()
    text = rep(text, '<script id="steady1143-script">', '<script id="progress1163-script">\nwindow.DATA1163 = ' + blob + ';\n' + block + '\n</script>\n<script id="steady1143-script">', 'progress block before steady1143', 'page')
    for needle, n in [("+' · v11.63'; /* v8.19 release922", 1), ('<script id="progress1163-script">', 1), ('rwMergeP1163(progressAsOf(todayIso()))', 4), ('rwDay1163(asOf0)', 2), ('/* v11.63', 10)]:
        if text.count(needle) != n: raise ValueError('v11.63 did not land cleanly: ' + needle[:60] + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = patch(p.read_text(encoding='utf-8')); p.write_text(t, encoding='utf-8')
    print('patch_v1163 applied: progress to race weekend (Fri 23 Oct 2026); 18 crowd-control reviews; 18 evidence operations; footer v11.62 -> v11.63')
