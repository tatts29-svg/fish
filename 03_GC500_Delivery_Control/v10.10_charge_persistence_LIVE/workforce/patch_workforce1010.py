# Author: Andrew Fisher. Narrow workforce source projection and presentation.
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="workforce1010-script"' in html: raise RuntimeError('Workforce1010 already applied')
    if 'id="roster1006-script"' not in html or 'function eventStaffingCard833()' not in html: raise RuntimeError('Expected existing workforce and native night confirmation')
    def change(old,new,why):
        nonlocal html
        html=rep(html,old,new,why,'GC500')
    change("const sp = splitHoursFor(h, c.date, (pmap.get(c.person) || {}).type), w = runWorked(c) || 0;", "const sp = Workforce1010.split(h, c.date, (pmap.get(c.person) || {}).type, c.person), w = runWorked(c) || 0;", 'flat quoted supplier forecast in whole-job totals')
    change("sp = h != null ? splitHoursFor(h, iso, P.type) : null;", "sp = h != null ? Workforce1010.split(h, iso, P.type, n) : null;", 'flat supplier rate in daily workforce')
    change("const split = paid != null && Number.isFinite(paid) && paid >= 0 && type ? splitHoursFor(paid, c.date, type) : null;", "const split = paid != null && Number.isFinite(paid) && paid >= 0 && type ? Workforce1010.split(paid, c.date, type, c.person) : null;", 'same flat quoted supplier cost in Finance')
    change("type = /^Fencing crew/i.test(n) ? 'fencing'", "type = /^(?:Fencing crew|Fencing [1-6]$)/i.test(n) ? 'fencing'", 'six generic names are contractor rows')
    change("fencing: 'Fencing — already coded to Installation'", "fencing: 'Fencing contractor'", 'do not claim costs were posted without invoices')
    change("const RUN_TYPE_STORE = {salary: 'Salary', hire: 'External', cna: 'Internal CNA'};", "const RUN_TYPE_STORE = {salary: 'Salary', hire: 'External', cna: 'Internal CNA', fencing: 'External'};", 'native contractor edits retain external classification')
    change("${['', 'cna', 'hire', 'salary'].map(t =>", "${['', 'cna', 'hire', 'salary', 'fencing'].map(t =>", 'keep contractor selection readable')
    change(" <details class=\"sfold\" data-sfold=\"runsheet|rules\"", " ${Workforce1010.sourceCard()}\n <details class=\"sfold\" data-sfold=\"runsheet|rules\"", 'source crew data remains reviewable')
    change("const rows = F.lines.map(L => `<tr data-scope-line=", "const rows = F.lines.map(L => L.key==='fence' ? Workforce1010.scopeRows(L,ro) : `<tr data-scope-line=", 'customer rows named Fencing 1 through 6 with one aggregate charge')
    change("<td><b>${esc(p.name)}</b></td><td>${esc([p.type, p.employer].filter(Boolean).join(' · ') || '—')}", "<td><b>${esc(p.name)}</b>${p.name==='Kyle Gover'&&(eventStaffingModel833().confirmedNights||[]).some(row=>row.name===p.name)?'<br><span class=\"chip\">Night shift · 23–25 Oct</span>':''}</td><td>${esc([p.type, p.employer].filter(Boolean).join(' · ') || '—')}", 'Kyle night confirmation visible in workforce people')
    change("if (SF) miss('the cost of the people on the event labour scope who are not on the tracker — the fence team of six among them — is not on the record', 'event staff not on the tracker');", "if (SF) { const crew=Workforce1010.summary(); if(crew.missing||crew.held)miss('Fencing crew: '+crew.missing+' shifts missing hours; '+crew.held+' shifts held for supplier-cost reconciliation. Quote 27172 is a forecast basis, not an invoice.', 'event fencing cost incomplete'); }", 'cost gaps reflect the six source-backed rows')
    change("gap('The fence team of six on the event labour scope', 'charged to the V8s in the scope; their cost is not on the record', 'Andrew — who supplies them and at what rate');", "{ const crew=Workforce1010.summary(); if(crew.missing||crew.held)gap('Fencing race crew — supplier forecast', crew.missing+' shifts need hours; '+crew.held+' shifts held for supplier-cost reconciliation. Quote 27172: $142/person/hour, minimum 4 h. Team-leader daily charges not allocated.', 'Workforce costs — hours and supplier invoice'); }", 'replace stale missing supplier rate claim')
    change("<p>Advanced event crew cost remains unpriced until its hours and supplier terms are confirmed. Existing installation dockets remain counted in their own dates; their rate is not an agreed event-weekend crew rate.</p>", "<p>Advanced race crew: quote 27172, $142/person/hour, minimum 4 hours. Fencing 1–6 are listed separately in Workforce costs. Recorded shift hours drive the forecast; missing hours stay unpriced. Team-leader daily charges remain unallocated.</p>", 'event crew quote basis stated once')
    return rep(html,'<script id="staff988-script">','<script id="workforce1010-script">\n'+(HERE/'workforce1010.js').read_text()+'\n</script>\n<script id="staff988-script">','one source-backed workforce projection','GC500')
