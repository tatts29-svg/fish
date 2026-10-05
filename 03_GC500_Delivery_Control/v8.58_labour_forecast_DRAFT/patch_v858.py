# Author: Andrew Fisher.
import sys,os,hashlib
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','toolchain'))
from rep import rep as replace
p=sys.argv[1];s=open(p,encoding='utf-8-sig').read()
assert hashlib.sha256(open(p,'rb').read()).hexdigest()=='d08b9e77a495657956000512cd0d411d494bcee4e5559dae0e46a0b20a1f4a0a'
assert 'function labourRevenue858(' not in s
def rep(old,new):
 global s
 s=replace(s,old,new,old[:70],p)
rep('function cj764Model(){',open(os.path.join(os.path.dirname(__file__),'labour858.js')).read()+'\nfunction cj764Model(){')
rep('job: r2((Number(c.total) || 0) + F.revenue + buildingTransport.uncoveredAdditional), noCardRate: F.noCardRate','labourToCome: labourRevenue858().remaining, job: r2((Number(c.total) || 0) + F.revenue + buildingTransport.uncoveredAdditional + labourRevenue858().remaining), noCardRate: F.noCardRate')
rep("what: 'labour ticked per piece, and the event people', now: install, job: install,", "what: 'installation, levelling, steps, demob and event people', now: install, job: r2(install + labourRevenue858().remaining),")
rep('to job end as ticked today: the ticks still to come are charged as the work is done and are not carried here', 'job-end forecast includes the remaining priced installation, levelling, steps and demob; completed charges are included once, and remaining work is not billed or marked complete')
rep("const RUN_TYPE_WORD = {salary: 'Salary', hire: 'Labour hire', cna: 'Coates CNA', '': 'type not set'};", "const RUN_TYPE_WORD = {salary: 'Coates salary', hire: 'Labour hire — already coded to Installation', cna: 'Coates wages', fencing: 'Fencing — already coded to Installation', '': 'Employment group not set'};")
rep('if (c.date <= td) x.to_date += w;', "if (c.date <= td && c.roster_basis !== 'forecast') x.to_date += w;")
rep(" const D = runDay(iso), T = runTotals(), ed = canEdit(), f = fmtDay(iso), wk = runIsWeekend(iso);", " const D = runDay(iso), T = runTotals(), ed = canEdit(), f = fmtDay(iso), wk = runIsWeekend(iso);\n D.rows=D.rows.filter(r=>r.shift||r.meal||r.night||Object.values(r.misc).some(Boolean));")
rep("wages: {toDate: r2(wToDate), toCome: r2(wToCome), unpricedHours: r2(unpH), known: wagesKnown, toCome2: wagesToCome, job: r2(wagesKnown + wagesToCome)}", "wages: {toDate: r2(wToDate), toCome: r2(wToCome + labourAllowance858()), unpricedHours: r2(unpH), known: wagesKnown, toCome2: r2(wagesToCome + labourAllowance858()), allowanceForecast: labourAllowance858(), job: r2(wagesKnown + wagesToCome + labourAllowance858())}")
rep("document.getElementById('pane-costs').insertAdjacentHTML('afterbegin',financeLinks857());", "document.getElementById('pane-costs').insertAdjacentHTML('afterbegin',financeLinks857()+labourAllowanceCard858());")
rep("const P = pmap.get(n) || {person: n}, type = runType(P.type);", "const P = pmap.get(n) || {person: n}, type = /^Fencing crew/i.test(n) ? 'fencing' : /^Night person/i.test(n) ? 'cna' : runType(P.type);")
rep('· v8.57','· v8.58')
open(p,'w',encoding='utf-8-sig').write(s)
