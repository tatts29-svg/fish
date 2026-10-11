"""Author: Andrew Fisher. One shared 24-per-day outstanding portaloo plan."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA = 'bfb7767a4036d7103940ed932365d687fe15a76921c6670d1ea78c6732b93dc8'
def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v9.99; refuses repeat application')
    text = rep(text, 'function remainingDates(row){', (HERE / 'plan1000.js').read_text()+(HERE / 'daily1000.js').read_text()+'\nfunction remainingDates(row){', 'Shared daily capacity planner', 'v10.00')
    text = rep(text, "const remaining=rows.flatMap(r=>remainingDates(r).map(p=>({...r,...p}))).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.item.localeCompare(b.item));", "const remaining=plannedRemaining1000(rows,context.asAt);", 'Capacity plan feeds every remaining delivery projection', 'v10.00')
    text = rep(text, 'const api={family,remainingDates,project,pack,requests:', 'const api={dailyPlan1000,plannedRemaining1000,remainingIn1000,remainingText1000,family,remainingDates,project,pack,requests:', 'Expose one shared planner and reference display', 'v10.00')
    text = rep(text, '<div class="ctile plan"><p class="ctk">In</p><b>${eff.in ? esc(dayWords816(eff.in)) : \'—\'}</b><span>${esc(inWhy)}</span></div>', '<div class="ctile plan">${window.Supplier996?.remainingIn1000(key)||`<p class="ctk">In</p><b>${eff.in ? esc(dayWords816(eff.in)) : \'—\'}</b><span>${esc(inWhy)}</span>`}</div>', 'Reference dates show all remaining delivery portions', 'v10.00')
    text = rep(text, "<summary>Remaining deliveries · '+M.summary.remaining+' items</summary>", "<summary>Remaining deliveries · '+M.summary.remaining+' items · maximum 24 portaloos per day</summary>", 'Show daily limit once in the delivery section', 'v10.00')
    text = rep(text, "L.capacity+' | Proposed grouping - not a transport booking'", "L.capacity+(kind==='remaining'?' | Maximum 24 portaloos per day':'')+' | Proposed grouping - not a transport booking'", 'Daily limit on remaining run sheets', 'v10.00')
    text = rep(text, "if (!isIn) return eff ? eff.out : null;", "if (!isIn) return eff ? eff.out : null;\n const supplierDays=(events||[]).filter(e=>String(e.task_id||'').startsWith('supplier996:')).map(e=>e.date).filter(Boolean).sort();if(supplierDays.length)return supplierDays[0];", 'Daily cards use their supplier portion date', 'v10.00')
    text = rep(text, "esc(epDay819(r.date))+' · requested · no receipt recorded", "esc(S996.remainingText1000(a.key)||epDay819(r.date))+' · requested · no receipt recorded", 'Source requests follow the current remaining plan', 'v10.00')
    text = rep(text, "if (dIn) due = 'Due ' + day(dIn)", "if(window.Supplier996?.remainingText1000(key))due='Remaining in '+Supplier996.remainingText1000(key);else if (dIn) due = 'Due ' + day(dIn)", 'Map due label follows the remaining plan', 'v10.00')
    text = rep(text, "const e = effectiveDates(a); return e.in ? fmtDate(e.in)", "const e = effectiveDates(a), planned=window.Supplier996?.remainingText1000(a.key); return planned || (e.in ? fmtDate(e.in)", 'Reference email draft uses remaining portions', 'v10.00')
    text = rep(text, ": 'no scheduled date'; })()}${d.eta", ": 'no scheduled date'); })()}${d.eta", 'Close current date expression', 'v10.00')
    text = rep(text, "S996.pdf=pdf;\n})();", "S996.pdf=pdf;\n})();\n"+(HERE/'portrait1000.js').read_text(), 'One portrait page for each remaining delivery day', 'v10.00')
    return rep(text, "+ ' · v9.99'", "+ ' · v10.00'", 'Release footer', 'v10.00')
if __name__ == '__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
