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
    source=open(os.path.join(os.path.dirname(__file__),'roster1006.js')).read()
    return rep(html,'<script id="staff988-script">','<script id="roster1006-script">'+source+'</script>\n<script id="staff988-script">', 'native night-shift projection', 'GC500')
