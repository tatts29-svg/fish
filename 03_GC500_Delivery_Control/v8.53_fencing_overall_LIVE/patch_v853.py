#!/usr/bin/env python3
"""Author: Andrew Fisher. Add a scoped fencing work-metres instrument."""
from pathlib import Path
import hashlib,sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
BASE='7a07fac2b357c9c19ea9ff26fd1b863d2f7395c2d505098579ea5ed72c705873'
def build(raw):
    if hashlib.sha256(raw).hexdigest()!=BASE:raise ValueError('Changed base or repeated patch')
    s=raw.decode('utf-8')
    def swap(old,new,label):
        nonlocal s
        s=rep(s,old,new,label,'v8.53')
    swap('var TodayWork840 = (() => {', (ROOT/'fencing_overall853_src.js').read_text()+'\nvar TodayWork840 = (() => {','Read-only overall model')
    swap('let areas = [], fencing = null, groupDetails = null, workSummary = null,', 'let areas = [], fencing = null, groupDetails = null, overallFencing = null, workSummary = null,','Scoped instrument state')
    swap('  function groupSummary848(area) {',(ROOT/'fencing_overall853_ui.js').read_text()+'\n  function groupSummary848(area) {','Native instrument helpers')
    swap("const body = fence ? '<div class=\"tw846-fence-title\">' + title + '<p>Recorded and left by work type</p></div>'+ compactFencing847() + renderFenceComponents849(renderedDay, 'today') :",'const body = fence ? overallFencingCard853(area, title) :','Whole work metres headline')
    swap("const expanded = (fence ? fencingRows() :", "const expanded = (fence ? fencingRows() + renderFenceComponents849(renderedDay, 'today') :",'Keep one complete type table and source readings in View details')
    swap("+ (fence ? ' hidden' : '') + ' aria-pressed=", "+ ' aria-pressed=",'Enable native selected-visible animation')
    swap("const compact = fence ? '<span class=\"tw848-closed-basis\">' + (count ? format(count) + ' work types' : 'Loading work types') + ' · totals, recorded and left</span>' :", "const compact = fence ? '<span class=\"tw848-closed-counts\"><span><strong>' + overallRange853(overallFencing?.pct,'%') + '</strong> work metres recorded</span></span><span class=\"tw848-closed-basis\">' + (count ? format(count) + ' work types' : 'Loading work types') + (overallFencing?.provisional ? ' · provisional programme' : '') + '</span>' :",'Useful closed group reading')
    swap('workSummary = todayWorkSummary848(asOf, areas, groupDetails, fencing);','workSummary = todayWorkSummary848(asOf, areas, groupDetails, fencing);\n    overallFencing = fenceOverall853(asOf, workSummary, fencing);','Read authoritative existing model once')
    swap('  function detailHtml(area, mode) {','  function detailHtml(area, mode) {\n    if (area.id === \'fencing\') return overallFencingDetail853(mode);','Dedicated all-work detail route')
    swap('</head>\n<body>','<style id="fencing-overall853">\n'+(ROOT/'fencing_overall853.css').read_text()+'\n</style>\n</head>\n<body>','Scoped instrument layout')
    swap('<meta name="gc500-release" content="v8.52">','<meta name="gc500-release" content="v8.53">','Release metadata')
    swap("+ ' · v8.52'; /* v8.19 - the footer names the release once */","+ ' · v8.53'; /* v8.19 - the footer names the release once */",'Release footer')
    return s.encode('utf-8')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_bytes(build(p.read_bytes()))
