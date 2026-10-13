# Author: Andrew Fisher. Native roster facts are authoritative over old event assumptions.
import os,sys
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep

def apply(html):
    if 'id="roster1006-script"' in html:
        raise RuntimeError('Roster v10.06 already applied')
    if 'function eventStaffingCard833()' not in html or 'id="staff988-script"' not in html:
        raise RuntimeError('Expected existing roster functions')
    html=rep(html,'    <ul>${uncertain}${placeholders}${m.additional.length ?',
        '    <ul>${uncertain}${(m.confirmedNights||[]).map(r=>`<li>${esc(r.name)} — night shift · ${esc(r.dates.map(fmtDate).join(", "))}${r.hoursKnown ? "" : " · hours not recorded"}.</li>`).join("")}${placeholders}${m.additional.length ?', 'show confirmed night shifts', 'GC500')
    html=rep(html,"const jobValue = job.rows.length && job.unpricedCount === job.rows.length ? 'Not priced' : fin745MoneyText(job.expectedCost);", "const jobValue = (job.rows.length && job.unpricedCount === job.rows.length) || (!job.rows.length && job.missingHoursCount) ? 'Not priced' : fin745MoneyText(job.expectedCost);", 'unknown hours do not imply a zero labour outlook', 'GC500')
    html=rep(html,"'PARTIAL — ' + fin745Hours(job.unpricedHours) + ' paid/allocation hours unpriced'", "'PARTIAL — ' + (job.missingHoursCount ? job.missingHoursCount + ' labour records missing hours' : '') + (job.missingHoursCount && job.unpricedHours ? ' · ' : '') + (job.unpricedHours ? fin745Hours(job.unpricedHours) + ' paid/allocation hours unpriced' : '')", 'show missing hours in Finance completeness', 'GC500')
    html=rep(html,"(P.wages.unpricedHours ? '<button class=\"chip warn\" data-jump765=\"finance745\">' + esc(fmtNum(P.wages.unpricedHours)) + ' labour hours unpriced</button>' : '') + '</div>';", "(P.wages.unpricedHours ? '<button class=\"chip warn\" data-jump765=\"finance745\">' + esc(fmtNum(P.wages.unpricedHours)) + ' labour hours unpriced</button>' : '') + (P.wages.missingHoursCount ? '<a class=\"chip warn\" href=\"#runsheet\" data-missinghours1006>' + esc(P.wages.missingHoursCount) + ' labour records missing hours</a>' : '') + '</div>';", 'visible missing shift hours on the P&L', 'GC500')
    source=open(os.path.join(os.path.dirname(__file__),'roster1006.js')).read()
    return rep(html,'<script id="staff988-script">','<script id="roster1006-script">'+source+'</script>\n<script id="staff988-script">', 'native night-shift projection', 'GC500')
