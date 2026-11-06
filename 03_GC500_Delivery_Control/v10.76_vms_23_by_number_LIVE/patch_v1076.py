"""Author: Andrew Fisher. v10.76 - VMS boards counted by VMS number: 23 boards, what has turned up.

Andrew, 19 Oct 2026: "i want this simple forget the T numbers for these ... each with a VMS number whats turned up", then
"Our qty needs to now be 23 vms05 was removed and no longer needed" and "so the build qty needs to show this". The VMS count
is now the boards on the VMS register (VMS01-04 and VMS06-VMS24 = 23; 1211404, once VMS05, is VMS09), not the deliveries'
booked quantities: a board has turned up when the register puts it on a delivery that is on site, is complete when that
delivery's Complete tick covers it, and is otherwise still to come by its contract line's date. Andrew's 23 is the
confirmed VMS requirement (so the area is no longer "provisional"). Today's Work progress board, milestone, group card,
type readings and the Equipment VMS row all read 23. Read only: no record, contract line, rate or charge changes.
Footer v10.75 -> v10.76.

    python3 patch_v1076.py page.html      (in place, on the live v10.75 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

HELPER = r'''
/* v10.76 - VMS BOARDS COUNTED BY VMS NUMBER. Andrew Fisher, 18-19 Oct 2026: "each with a VMS number - whats turned up", "forget the
   T numbers", "Our qty needs to now be 23 vms05 was removed and no longer needed". The VMS count is the boards on this register
   (VMS01-04, VMS06-VMS24; 1211404, once VMS05, is VMS09). A board has turned up when the register puts it on a delivery that is on
   site (or ticked complete) by the day, and is complete when that delivery's Complete tick covers it. A board on no delivery is still
   to come, due by its contract line's start date. Read only: no record, contract line, rate or charge changes. */
function vmsCount1076(day, rows){
 day = day || todayIso();
 const boards = typeof vms913Boards === 'function' ? vms913Boards() : [];
 if (!boards.length) return null;
 const soon = addDays(day, PROG_NEXT_DAYS), by = new Map();
 const c = {total: boards.length, on: 0, done: 0, due: 0, overdue: 0, norecord: 0, next: 0, nextNotOn: 0, toCome: []};
 boards.forEach(b => { const t = vms913OnOf(b).on; if (t) { by.set(t, (by.get(t) || []).concat([b])); return; }
  const due = /^\d{4}-\d{2}-\d{2}/.test(String(b.start || '')) ? String(b.start).slice(0, 10) : null;
  if (due && due <= day) { c.due++; c.norecord++; } else if (due && due <= soon) { c.next++; c.nextNotOn++; }
  c.toCome.push({key: b.key, name: b.name, due, contract: b.contract, line: b.line, on: null}); });
 by.forEach((list, t) => {
  const a = typeof assetOf === 'function' ? assetOf(t) : null, n = list.length;
  const st = a && !a._cancelled ? assetStatusAsOf(a, day) : null, d = st ? st.d || {} : {}, ph = st ? st.inPhase : null;
  const here = !!(st && d.recorded && (d.state === 'on site' || d.done));
  const row = (rows || []).find(r => r && r.key === t);
  if (here) c.on += n; else list.forEach(b => c.toCome.push({key: b.key, name: b.name, due: st && st.in || null, contract: b.contract, line: b.line, on: t}));
  c.done += !here ? 0 : row ? (row.complete ? n : Math.min(n, Number(row.done) || 0)) : (d.done ? n : 0);
  if (['complete', 'on site', 'overdue', 'no record'].includes(ph)) c.due += n;
  if (ph === 'overdue') c.overdue += n;
  if (ph === 'no record') c.norecord += n;
  if (ph === 'next') { c.next += n; if (!here) c.nextNotOn += n; }
 });
 c.left = Math.max(0, c.total - c.done);
 c.toCome.sort((x, y) => String(x.name).localeCompare(String(y.name)));
 return c;
}'''

BIND = r'''<script id="vms1076-bind-script">
/* Author: Andrew Fisher. v10.76 - the VMS group and type readings on Today count boards by VMS number (vmsCount1076), the same
   count as the Work progress board. Bound before Scope960, so its scope reading sees this count; the schedule, BOQ and iEDM notes
   bound earlier keep their own source readings. Read only. */
(function(){
'use strict';
const groups0=todayGroupDetails841;
todayGroupDetails841=function(...args){const r=groups0.apply(this,args);try{const v=r&&r.vms,g=v&&v.health&&v.health.ready&&Array.isArray(v.groups)?v.groups.find(x=>x&&x.name==='VMS boards'):null;
 const c=g&&vmsCount1076(r.asOf,Array.isArray(args[1])?(args[1].find(a=>a&&a.id==='vms')||{}).rows:null);
 if(c){Object.assign(g.summary,{total:c.total,onSite:c.on,due:c.due,overdue:c.overdue,next:c.nextNotOn,noRecord:c.norecord});
  if(g.types.length===1){const t=g.types[0];t.total=c.total;t.onSite=c.on;if(t.completionKnown)t.complete=c.done;t.remaining=t.quantityKnown&&t.completionKnown?c.left:null;t.register1076=c;}}
}catch(err){console.error('VMS by number',err);}return r;};
const types0=todayTypeMetrics843;
todayTypeMetrics843=function(...args){const r=types0.apply(this,args);try{const list=r&&r.health&&r.health.ready&&r.byCard?r.byCard.vms:null,it=list&&list.length===1?list[0]:null;
 const c=it&&it.unitKnown?((it.sourceType||{}).register1076||vmsCount1076(r.asOf,null)):null;
 if(c){it.total=c.total;it.knownTotal=c.total;it.done=c.done;it.onSite=c.on;it.left=c.left;it.quantityKnown=true;it.pct=ProgressPercent1012.ratio(c.done,c.total);}
}catch(err){console.error('VMS by number',err);}return r;};
})();
</script>
'''

edits = [
 # 1. the helper, beside the VMS register
 ("function vms913BoardsOn(a){ const tid = vms913TidOf(a); return tid ? vms913Boards().filter(b => vms913OnOf(b).on === tid) : null; }",
  "function vms913BoardsOn(a){ const tid = vms913TidOf(a); return tid ? vms913Boards().filter(b => vms913OnOf(b).on === tid) : null; }" + HELPER),
 # 2. the Work progress board: the VMS area's totals are formed from the register
 ("    area.totalRefs = area.rows.length;\n",
  "    area.totalRefs = area.rows.length;\n"
  "    /* v10.76 - VMS boards by VMS number: the register's boards, those on a delivery on site, those its Complete tick covers */\n"
  "    const vms1076 = def.id === 'vms' && typeof vmsCount1076 === 'function' ? vmsCount1076(day, area.rows) : null;\n"
  "    if (vms1076) { knownTotal = vms1076.total; done = vms1076.done; unknown = false; area.onSite1076 = vms1076.on; area.toCome1076 = vms1076.toCome;\n"
  "      area.notes.push('Counted by VMS number on the VMS register: ' + vms1076.total + ' boards · ' + vms1076.on + ' turned up · ' + (vms1076.total - vms1076.on) + ' still to come'\n"
  "        + (vms1076.toCome.length ? ' (' + vms1076.toCome.map(b => b.name + (b.due ? ' due ' + vms913Day(b.due) : '')).join(', ') + ')' : '') + '.'); }\n"),
 # 3. the group card on Today (dsnGroups): headline, gauge, by type, due and coming lines
 (" const asked = placed.reduce((s, r) => s + r.asked, 0);\n const onUnits = placed.reduce((s, r) => s + r.unitsOn, 0);",
  " const V1076 = g.disc === 'Variable message signs' && typeof vmsCount1076 === 'function' ? vmsCount1076(asOf) : null; /* v10.76 - VMS by VMS number */\n"
  " const asked = V1076 ? V1076.total : placed.reduce((s, r) => s + r.asked, 0);\n const onUnits = V1076 ? V1076.on : placed.reduce((s, r) => s + r.unitsOn, 0);"),
 (" const types = [...byType.entries()].sort((a, b) => b[1].asked - a[1].asked || a[0].localeCompare(b[0]));",
  " const types = [...byType.entries()].sort((a, b) => b[1].asked - a[1].asked || a[0].localeCompare(b[0]));\n"
  " if (V1076 && types.length === 1) types[0] = [types[0][0], {asked: V1076.total, on: V1076.on, noqty: 0}];"),
 (" const due = cnt(placed.filter(r => r.due)), over = cnt(placed.filter(r => r.overdue)), norec = cnt(placed.filter(r => r.norecord)), next = cnt(placed.filter(r => r.next));",
  " const due = V1076 ? V1076.due : cnt(placed.filter(r => r.due)), over = V1076 ? V1076.overdue : cnt(placed.filter(r => r.overdue)), norec = V1076 ? V1076.norecord : cnt(placed.filter(r => r.norecord)), next = V1076 ? V1076.next : cnt(placed.filter(r => r.next));"),
 ("${cell(cnt(placed.filter(r => r.next && !r.on)))}",
  "${cell(V1076 ? V1076.nextNotOn : cnt(placed.filter(r => r.next && !r.on)))}"),
 # 4. the group and type readings (drawer), bound before Scope960
 ('<script id="scope960-bind-script">', BIND + '<script id="scope960-bind-script">'),
 # 5. the milestone summary: when every reference is ticked but boards are still to come, say how many boards are to go
 ("`not there yet — ${f.total - f.complete} to go`",
  "`not there yet — ${(f.total - f.complete) || (f.units && f.units.left ? f.units.left + (f.unit ? ' ' + f.unit : '') : 0)} to go`"),
 ("' — ' + (f.total - f.complete) + ' to go'",
  "' — ' + ((f.total - f.complete) || (f.units && f.units.left ? f.units.left + (f.unit ? ' ' + f.unit : '') : 0)) + ' to go'"),
]
edits.append(("function currentEvidence(){return evidence(typeof QHIST==='undefined'?[]:QHIST,typeof DATA==='undefined'?{}:DATA.schedule_review875,typeof DATA==='undefined'?{}:DATA.schedule_review950||DATA.schedule_review6);}",
  "function currentEvidence(){const e=evidence(typeof QHIST==='undefined'?[]:QHIST,typeof DATA==='undefined'?{}:DATA.schedule_review875,typeof DATA==='undefined'?{}:DATA.schedule_review950||DATA.schedule_review6);"
  "/* v10.76 - Andrew Fisher, 19 Oct 2026: \"Our qty needs to now be 23 vms05 was removed and no longer needed\" */return Object.assign(e,{requirement:23,confirmedOn:'19 Oct 2026'});}"))

EXTRA = [
 # 6. the Equipment tab's by-type row for VMS: ordered and still to come by VMS number (on site, numbers and sub-hire unchanged)
 (" const list = [...rows.values()].filter(r => r.asked || r.on || r.spares)",
  " /* v10.76 - VMS boards by VMS number: the VMS row's ordered count is the VMS register's boards, still to come what has not turned up */\n"
  " const vmsRow1076 = typeof vmsCount1076 === 'function' ? vmsCount1076(td) : null;\n"
  " if (vmsRow1076) rows.forEach(r => { if (String(r.item) === 'VMS') { r.asked = vmsRow1076.total; r.remaining1017 = Math.max(0, vmsRow1076.total - vmsRow1076.on); } });\n"
  " const list = [...rows.values()].filter(r => r.asked || r.on || r.spares)"),
]

def main():
    path = sys.argv[1]; s = open(path, encoding='utf-8').read()
    if 'function vmsCount1076' in s: sys.exit('patch_v1076 refuses a repeat')
    if "+ ' · v10.75'" not in s or '(v10.75: Coates boards too)' not in s: sys.exit('patch_v1076 needs the live v10.75 page')
    for old, new in edits + EXTRA: s = rep(s, old, new, 'v10.76 VMS by number', path)
    s = rep(s, "+ ' · v10.75'", "+ ' · v10.76'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(s)
    print('patch_v1076 applied: VMS boards counted by VMS number (23); footer v10.75 -> v10.76')

if __name__ == '__main__':
    main()
