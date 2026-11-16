"""Author: Andrew Fisher. v13.09 - every finished demob day carries its completed stamp.

Andrew, 16 Nov 2026: "I have noticed on days in demob its nissing day completed stamped please look over and fix these bugs".
On the live v13.08 page only Thu 5 Nov and Fri 13 Nov of the fifteen demob days carried the stamp. A Demob day card was stamped
only when every pick-up planned for that day had been collected by the end of that same day and every planned truck load could be
matched to it. Most days' plans moved (things went a day or more earlier or later), and WB20 (29 Oct) and WB19 (6 Nov) sit on truck
loads although they were never on site (v13.06), so thirteen finished days could never be stamped even with the demob 100% done.

DemobProgress996's day() now also gives closed1309: the day is past, it had something planned, nothing on it has an unknown
quantity, and every reference planned for it and on each of its truck loads has since been collected (read on the record as it
stands now), leaving out runs the record holds as not on site with nothing collected (WB19, WB20) and references with nothing to
collect. The day card's stamp shows when the old rule or this one holds; its label says which ("All planned collections for this day
evidenced complete." / "Day completed. Every pick-up planned for this day has been collected."). Nothing else reads the day's
complete flag. The day's percentage, its "collected / planned" load count and every other figure keep reading the day as it closed,
so a day whose plan moved still shows that honestly. Footer -> v13.09. No record, map, money, P&L or machine change.

    python3 patch_v1309.py page.html      (in place, on the live v13.08 dashboard page)
"""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

path = sys.argv[1]
t = Path(path).read_text(encoding='utf-8')
if 'closed1309' in t: sys.exit('v13.09 is already on this page')
if "+' · v13.08'; /* v8.19 release922" not in t or 'scope1306(' not in t: sys.exit('this is not the v13.08 page')

t = rep(t,
        "const planned=list(loads),completedLoads=planned.filter(completeLoad).length,dayComplete=refs.length>0&&!unknown.length"
        "&&refs.every(r=>byKey.get(r.key)?.complete)&&planned.every(completeLoad);\n"
        "  return {date,past,future,today:date===today,whole:w,refs,unknown,loads:planned.length,completedLoads,complete:past&&dayComplete,",
        "const planned=list(loads),completedLoads=planned.filter(completeLoad).length,dayComplete=refs.length>0&&!unknown.length"
        "&&refs.every(r=>byKey.get(r.key)?.complete)&&planned.every(completeLoad);\n"
        "  /* v13.09 - a finished day is closed once everything planned for it has been collected, read on the record as it stands now:\n"
        "     its references and every reference on its truck loads, leaving out runs that were never on site (WB19, WB20) and references\n"
        "     with nothing to collect. Its percentage and load count still read the day as it closed. */\n"
        "  const offSite1309=new Set(list(w.notOnSite1306)),nothing1309=new Set(list(w.zero).map(r=>r.key)),scoped1309=new Map(w.refs.map(r=>[r.key,r])),"
        "doneNow1309=new Map(),isDone1309=r=>{if(!r||!r.key)return false;if(!doneNow1309.has(r.key)){let v=false;try{v=!!evidence(r,env.record(r.key),today).complete;}"
        "catch(x){v=false;}doneNow1309.set(r.key,v);}return doneNow1309.get(r.key);},rowKeys1309=L=>(L?.toilet?.rows||L?.rows||L?.stops?.map(x=>({r:x.r}))||[])"
        ".map(x=>x?.r?.key).filter(Boolean),closed1309=past&&(refs.length>0||planned.length>0)&&!unknown.length&&refs.every(isDone1309)"
        "&&planned.every(L=>rowKeys1309(L).every(k=>offSite1309.has(k)||nothing1309.has(k)||isDone1309(scoped1309.get(k))));\n"
        "  return {date,past,future,today:date===today,whole:w,refs,unknown,loads:planned.length,completedLoads,complete:past&&dayComplete,closed1309,",
        'day() gives closed1309', path)

t = rep(t,
        "(d.complete?'<span class=\"bc984-stamp\" role=\"img\" aria-label=\"All planned collections for this day evidenced complete.\"></span>':'')+",
        "(d.complete||d.closed1309?'<span class=\"bc984-stamp\" role=\"img\" aria-label=\"'+(d.complete?'All planned collections for this day evidenced complete.'"
        ":'Day completed. Every pick-up planned for this day has been collected.')+'\"></span>':'')+",
        'the day card stamps a closed day', path)

t = rep(t, "+' · v13.08'; /* v8.19 release922", "+' · v13.09'; /* v8.19 release922", 'footer v13.09', path)

Path(path).write_text(t, encoding='utf-8')
print('v13.09 applied')
