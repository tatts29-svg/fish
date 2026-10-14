"""Author: Andrew Fisher. Shared event boundary; exact guarded source hooks only."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep

def apply(html):
    if 'const EventConfig1013 = ' in html:
        raise ValueError('Event configuration v10.13 is already installed')
    if 'FinancialScopes1011' not in html or 'ProgressPercent1012' not in html:
        raise ValueError('Event configuration requires the reviewed v10.12 base')
    def change(old, new, label):
        nonlocal html
        html = rep(html, old, new, label, 'v10.13 event configuration')
    change('const Source949 = (() => {', (HERE/'event_config1013.js').read_text()+'\nconst Source949 = (() => {', 'validated event boundary')
    # Invalidate existing render/financial scopes when configuration changes in place.
    change('function holdAssets(fn){\n', "function holdAssets(fn){\nif(window.EventConfig1013)window.EventConfig1013.current();\n", 'configuration freshness on financial entry')
    change('function heldMemo(k, f){ if (!ASSETS_HELD)', 'function heldMemo(k, f){ if(window.EventConfig1013)window.EventConfig1013.current(); if (!ASSETS_HELD)', 'configuration freshness within held reads')
    change('const EVENT_DAYS = (CB && CB.event_days) || [];','const EVENT_DAYS = EventConfig1013.days;', 'dynamic shared event-day readers')
    change("const eventFrom='2026-10-23',offhire='2026-10-25',invoiceMonth='2026-10';", 'const config=()=>EventConfig1013.current();', 'generator configuration boundary')
    change('function windowOf(start){const a=day(start),fri=day(eventFrom),sun=day(offhire);if(a==null)', 'function windowOf(start){const c=config(),offhire=c.offhire,a=day(start),fri=day(c.eventFrom),sun=day(offhire);if(a==null||fri==null||sun==null)', 'generator date validation')
    change('function rate(input,row,env){\n const qty=', "function rate(input,row,env){\n const c=config(),eventCount=c.dayCount;if(!c.eventValid)return {dailyRate:null,standdownRate:null,rateSource:EventConfig1013.issue(),filled:null,rateState:'configuration pending'};\n const qty=", 'generator rate divisor configuration')
    change("dailyRate:daily?row.rate_1:row.rate_1/3,standdownRate:daily?row.rate_1/2:row.rate_1/6,rateSource:'Contract '+row.rental_contract+' line '+row.line+(daily?' · daily rate':' · whole-event Rate 1 ÷ 3 race days')", "dailyRate:daily?row.rate_1:row.rate_1/eventCount,standdownRate:daily?row.rate_1/2:row.rate_1/(eventCount*2),rateSource:'Contract '+row.rental_contract+' line '+row.line+(daily?' · daily rate':' · whole-event Rate 1 ÷ '+eventCount+' race days')", 'whole-event rate day count')
    change("dailyRate:typed/3,standdownRate:typed/6,rateSource:'Costs override · whole-event equivalent ÷ 3 race days'", "dailyRate:typed/eventCount,standdownRate:typed/(eventCount*2),rateSource:'Costs override · whole-event equivalent ÷ '+eventCount+' race days'", 'typed event equivalent day count')
    change("+' · published Standby Rate before 23 Oct'", "+' · published Standby Rate before '+EventConfig1013.short(c.eventFrom)", 'card date explanation')
    change('function project(inputs,env){\n const rows=', 'function project(inputs,env){\n const c=config(),{eventFrom,offhire,invoiceMonth}=c;\n const rows=', 'generator snapshot configuration')
    change('const priced=known(price.dailyRate)&&known(slice.qty)&&known(w.equivalentDays)&&linked;', 'const priced=c.invoiceValid&&known(price.dailyRate)&&known(slice.qty)&&known(w.equivalentDays)&&linked;', 'missing allocation holds charge')
    change("const problems=issues.slice();if(!known(price.dailyRate))", "const problems=issues.slice();if(!c.eventValid||!c.invoiceValid)problems.push(EventConfig1013.issue());if(!known(price.dailyRate))", 'explicit configuration issue')
    change("+' race days at 100% · no hire after 25 Oct · October invoice allocation'", "+' race days at 100% · no hire after '+EventConfig1013.short(offhire)+' · '+EventConfig1013.invoiceWords()", 'generator calculation explanation')
    change("+(start||'not recorded')+' to '+offhire+' · '", "+(start||'not recorded')+' to '+(offhire||'date to confirm')+' · '", 'unknown date wording')
    change('const api={eventFrom,offhire,invoiceMonth,cardRates,windowOf,rate,project,key,cents};', 'const api={get eventFrom(){return config().eventFrom;},get offhire(){return config().offhire;},get invoiceMonth(){return config().invoiceMonth;},cardRates,windowOf,rate,project,key,cents};', 'live generator metadata getters')
    change("r.kind==='generator'?' · 3-day event equivalent'", "r.kind==='generator'?(EventConfig1013.current().eventValid?' · '+EventConfig1013.current().dayCount+'-day event equivalent':' · event dates to confirm')", 'pricing input unit caption')
    change("to:'2026-10-25',firm:!!same", "to:GeneratorFinance1004.offhire,firm:!!same", 'charge span uses configured offhire')
    change("why:'Published card standdown rate from confirmed delivery before 23 Oct, full daily rate on 23–25 Oct, no hire after 25 Oct. Andrew, 12 Oct 2026.'", "why:EventConfig1013.current().invoiceValid?'Published card standdown rate from confirmed delivery before '+EventConfig1013.short(GeneratorFinance1004.eventFrom)+', full daily rate on '+EventConfig1013.range()+', no hire after '+EventConfig1013.short(GeneratorFinance1004.offhire)+'. Andrew, 12 Oct 2026.':EventConfig1013.issue()", 'generator charge basis dates')
    change('<p class="fin745-eyebrow">HIRE REVENUE · 2026 · AUD EX GST</p>', '<p class="fin745-eyebrow">HIRE REVENUE · '+"'+esc(M.eventFrom?M.eventFrom.slice(0,4):'Year to confirm')+'"+' · AUD EX GST</p>', 'generator current event year')
    change("  (missing?'<p class=\"generator1004-unpriced\">'", "  (EventConfig1013.issue()?'<p class=\"generator1004-unpriced\">'+esc(EventConfig1013.issue())+'. Charges remain unpriced pending confirmation.</p>':'')+\n  (missing?'<p class=\"generator1004-unpriced\">'", 'visible configuration hold')
    change("fact('Before 23 Oct','Published standdown rate from delivery')+fact('23–25 Oct','100% daily rate')+fact('After 25 Oct','No hire charge')", "fact('Before '+EventConfig1013.short(M.eventFrom),'Published standdown rate from delivery')+fact(EventConfig1013.range(),'100% daily rate')+fact('After '+EventConfig1013.short(M.offhire),'No hire charge')", 'generator view date labels')
    change('generators at the published standdown rate from delivery before 23 Oct and 100% over 23–25 Oct, and other equipment over the three race days;', 'generators at the published standdown rate from delivery before ${esc(EventConfig1013.short(GeneratorFinance1004.eventFrom))} and 100% over ${esc(EventConfig1013.range())}, and other equipment over the ${EventConfig1013.current().dayCount || "unconfirmed"} race days;', 'pricing charging basis prose')
    change('Delivery to 22 Oct: published standdown rate. 23–25 Oct: 100%. Off hire 25 Oct; no hire after Sunday.', 'Delivery to ${esc(EventConfig1013.short(EventConfig1013.previous(GeneratorFinance1004.eventFrom)))}: published standdown rate. ${esc(EventConfig1013.range())}: 100%. Off hire ${esc(EventConfig1013.short(GeneratorFinance1004.offhire))}; no hire after that date.', 'pricing generator row dates')
    change("if(ch.generator1004){if(month!==GeneratorFinance1004.invoiceMonth)return;", "if(ch.generator1004){if(!GeneratorFinance1004.invoiceMonth)return unallocated(out.unallocatedRevenue,'Generator Hire Revenue',generatorBranch1004(r)||'no branch',null,EventConfig1013.issue(),{source:'generator shared model',contract:r.rental_contract,line:r.line});if(month!==GeneratorFinance1004.invoiceMonth)return;", 'missing invoice month remains unallocated')
    change("+' Revenue — generator October invoice allocation'", "+' Revenue — generator '+EventConfig1013.invoiceWords()", 'monthly generator allocation description')
    start=html.index('function generatorHtml1004(){')
    end=html.index('function generatorBind1004(){', start)
    before=html[start:end]
    after=before.replace(' const quantity=v=>', ' const aggregate=v=>amount(EventConfig1013.current().invoiceValid?v:null);\n const quantity=v=>')
    for field in ['actual','standdownActual','remaining','standdownRemaining','forecast','standdown','race']:
        old='amount(M.'+field+')'
        if after.count(old)!=1: raise ValueError('Generator aggregate display anchor changed: '+field)
        after=after.replace(old,'aggregate(M.'+field+')')
    if html.count(before)!=1: raise ValueError('Generator renderer must occur exactly once')
    html=html[:start]+after+html[end:]
    # Supplier whole-event coverage follows the same event dates; actual source dates remain intact.
    change("const daily=charge.how==='per day',units=daily?charge.days:1;", "const daily=charge.how==='per day',units=daily?charge.days:1,event=EventConfig1013.current(),configurationIssue=!daily&&(!event.eventValid||!event.invoiceValid)?EventConfig1013.issue():null;", 'supplier date boundary')
    change("else if(start<='2026-10-23'&&end>'2026-10-25')whole=true;", "else if(event.eventValid&&start<=event.eventFrom&&end>event.offhire)whole=true;", 'supplier coverage event window')
    change('estimate=cents(e.costRate*quantity*remaining);', 'estimate=configurationIssue?null:cents(e.costRate*quantity*remaining);', 'supplier estimate configuration hold')
    change('held:partialEvent&&!whole,basis:daily?', 'held:!!configurationIssue||partialEvent&&!whole,...(configurationIssue?{configurationIssue}:{}),basis:daily?', 'supplier pending state')
    change("const words=f=>!f?'':`Estimated Direct costs:", "const words=f=>!f?'':f.configurationIssue?'Supplier estimate pending: '+f.configurationIssue+'. '+f.supplier+' ('+f.supplierCode+'); linked source '+f.source.sheet+'!'+f.source.rateCell+'.':`Estimated Direct costs:", 'supplier pending explanation')
    change("const month=(f,m)=>f.daily?cents(f.uncoveredDays.filter(d=>d.slice(0,7)===m).length*f.rate*f.quantity):m==='2026-10'?f.estimate:0;", "const month=(f,m)=>f.daily?cents(f.uncoveredDays.filter(d=>d.slice(0,7)===m).length*f.rate*f.quantity):!EventConfig1013.current().invoiceValid?null:m===EventConfig1013.current().invoiceMonth?f.estimate:0;", 'supplier forecast invoice month')
    change("Source949.model().forEach(f=>{const amount=Source949.month(f,month);if(amount>0)", "Source949.model().forEach(f=>{const amount=Source949.month(f,month);if(amount==null)return unallocated(out.unallocatedCosts,'Rehire — linked supplier-rate forecast',f.costBranch,null,Source949.words(f),{id:f.id,source:'Baseplan supplier cost note',contract:f.contract,line:f.line});if(amount>0)", 'held supplier allocation visibility')
    change("if(c.held)words.push(`${c.held} forecast${c.held===1?'':'s'} held for supplier-period reconciliation`);", "if(c.held)words.push(`${c.held} forecast${c.held===1?'':'s'} held for ${EventConfig1013.issue()?'event-date or supplier-period reconciliation':'supplier-period reconciliation'}`);", 'supplier summary explains configuration holds')
    change("if(f.held)gap('Rehire — '+f.supplier+' partial period','A whole-event supplier estimate cannot be allocated to the uncovered period from this source. No overlapping estimate is added.','Supplier invoice reconciliation');", "if(f.held)gap('Rehire — '+f.supplier+(f.configurationIssue?' event configuration':' partial period'),f.configurationIssue||'A whole-event supplier estimate cannot be allocated to the uncovered period from this source. No overlapping estimate is added.',f.configurationIssue?'Event dates and invoice allocation':'Supplier invoice reconciliation');", 'forecast pending reason stays accurate')
    # Workforce source quote and original roster documents are preserved.
    start=html.index("const GROUP='Fencing crew ×6',GROUP_ID='W-P-fencing-crew-6';")
    end=html.index("})(typeof window!=='undefined'?window:globalThis);", start)
    before=html[start:end]
    after=before.replace("const DATES=['2026-10-23','2026-10-24','2026-10-25'];", 'const DATES=EventConfig1013.days;')
    if before==after: raise ValueError('Workforce event-date anchor missing')
    change(before, after, 'workforce shared event-day membership')
    # Demob keeps its planning rules and source/native movements, deriving only the available window.
    change("const DM816 = {start: '2026-10-26', end: '2026-11-13',", 'const DM816 = {get start(){return EventConfig1013.current().demobStart;}, get end(){return EventConfig1013.current().demobEnd;},', 'demob window getters')
    old='''function days816(){
\tif (DM816.days) return DM816.days;
\tconst out = []; let iso = DM816.start, guard = 0;
\twhile (iso <= DM816.end && guard++ < 60) { const dt = new Date(iso + 'T12:00:00Z'), w = dt.getUTCDay();'''
    new='''function days816(){
\tconst c=EventConfig1013.current(),key=EventConfig1013.signature(DATA);
\tif (DM816.days && DM816.daysKey1013===key) return DM816.days;
\tDM816.daysKey1013=key;
\tif(!c.demobValid)return (DM816.days=[]);
\tconst out = []; let iso = c.demobStart, guard = 0;
\twhile (iso <= c.demobEnd && guard++ < 367) { const dt = new Date(iso + 'T12:00:00Z'), w = dt.getUTCDay();'''
    change(old,new,'demob cache derives from current window and holidays')
    change('function demob816(){\n', 'function demob816(){\n\tEventConfig1013.current();\n', 'demob memo configuration freshness')
    change('const fill = (Q, days) => {\n', 'const fill = (Q, days) => {\n\t\tif(!days.length)return;\n', 'missing demob dates never produce undefined assignments')
    change("const M = {refs, byKey, days: D, day, counts, outside, planned};", "const M = {refs, byKey, days: D, day, counts, outside, planned,...(!D.length?{configurationIssue:EventConfig1013.current().demobIssues.join('; ')||'No working days in the demobilisation window'}:{})};", 'demob unresolved window state')
    change("const hireEnd = M && M.contractEnd === DM816.end && M.src !== 'contract' ? ' · hire ends 13 Nov' : '';", "const hireEnd = M && M.contractEnd === DM816.end && M.src !== 'contract' ? ' · hire ends '+EventConfig1013.short(DM816.end) : '';", 'demob hire-end caption')
    change('<span class="chip ref">Mon 26 Oct – Fri 13 Nov</span>', '<span class="chip ref">${DM816.start&&DM816.end?esc(dayWords816(DM816.start)+" – "+dayWords816(DM816.end)):"Dates to confirm"}</span>', 'demob heading date window')
    change('<div class="dmhead816"><div class="pstat"><b>15</b><span>working days</span><em>From the Monday after the race to Fri 13 Nov.', '<div class="dmhead816"><div class="pstat"><b>${M.days.length}</b><span>working days</span><em>${M.configurationIssue?esc(M.configurationIssue)+".":"From "+esc(dayWords816(DM816.start))+" to "+esc(dayWords816(DM816.end))+"."}', 'demob working days and pending explanation')
    change('<span>off-hire before 13 Nov</span>', '<span>off-hire before ${esc(EventConfig1013.short(DM816.end))}</span>', 'demob contract cutoff caption')
    change('${dayHtml816(M, Dy)}</div>', '${Dy?dayHtml816(M, Dy):\'<p class="norate">Demobilisation dates need confirmation. Recorded movements are retained; no proposed dates have been assigned.</p>\'}</div>', 'empty demob window renders pending safely')
    return html
