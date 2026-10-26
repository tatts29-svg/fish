"""Author: Andrew Fisher. Explicit event-crew actuals; aggregate hours, one cost and one customer scope."""
import os
import re
import sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

HERE = Path(__file__).resolve().parent

def patch(text, path='page.html'):
    if 'id="eventcrew1237-script"' in text:
        raise ValueError('v12.37 is already present')
    if 'id="racecrew1227-script"' not in text or 'supplierBaseNotes1014' not in text:
        raise ValueError('The current supplier and race-crew source is required')
    footer = re.findall(r"\+' · v12\.(?:35|36)'; /\* v8\.19 release922", text)
    if len(footer) != 1:
        raise ValueError('Expected the coordinated v12.35 or v12.36 base footer once')
    def change(old, new, what):
        nonlocal text
        # The pinned native text is normally literal. Check its full-page uniqueness
        # first, then run the shared helper on that exact span; keep surrounding
        # whitespace intact instead of swallowing a preceding keyword separator.
        if text.count(old) == 1:
            a = text.index(old)
            text = text[:a] + rep(old, old, new, what, path) + text[a + len(old):]
        else:
            text = rep(text, old, new, what, path)
    def section(start, end, changes, what):
        nonlocal text
        if text.count(start) != 1:
            raise ValueError(what + ': section start is not unique')
        a = text.index(start); b = text.index(end, a)
        old = text[a:b]; new = old
        for find, replacement in changes:
            new = rep(new, find, replacement, what, path)
        change(old, new, what)

    change('<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */', '<script id="eventcrew1237-script">\n' + (HERE / 'eventcrew1237_src.js').read_text().rstrip() + '\n</script>\n<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */', 'shared aggregate event evidence before initial render')
    change("for(const n of supplierBaseNotes1014())add(n,'green'", "for(const n of EventCrew1237.noteSources())add(n,'green'", 'supplier identity lookup independent of pricing recursion')
    change("const supplierBaseDocket1014=costDocket,supplierBaseNotes1014=serviceNoteRows,supplierBaseDerived1014=fenceDerived;", "const supplierBaseDocket1014=costDocket,supplierBaseNotes1014=serviceNoteRows,supplierBaseDerived1014=fenceDerived,supplierBaseCostLines1237=docketCostLines;", 'retain independent source docket ledger for supplier branch')
    change("branch:pl760FencingBranch(allCosts(supplierBaseDocket1014))", "branch:pl760FencingBranch(supplierBaseCostLines1237(supplierBaseDocket1014).map(c=>Object.assign(gradeCost(c),{_where:'record'})))", 'supplier branch lookup cannot enter current customer billing')
    section('function localServiceNotes(){', '\nfunction nextNoteId()', [
        ("const cost = h > 0 && pr.value != null ? Math.round(h * pr.value * 100) / 100 : null;", "const actualRate1237 = EventCrew1237.price(n, pr);\n const cost = EventCrew1237.cost(n, h > 0 && actualRate1237.value != null ? Math.round(h * actualRate1237.value * 100) / 100 : null);"),
        ('cost_rate: pr.value, cost_rate_source: pr.source,', 'cost_rate: actualRate1237.value, cost_rate_source: actualRate1237.source,')
    ], 'price native note before retained supplier aliases')
    section('function recordServiceNote(f){', '\n/* a hire agreement:', [
        ("if (!f.date) { flash('A date is needed - it is what puts the note in a week.'); return null; }", "if (!fencePaperDay898(f.date)) { flash('A valid date is needed - it is what puts the note in a week.'); return null; }"),
        ("if (!(h > 0)) {", "if (!(h > 0) || !Number.isFinite(h)) {"),
        ('const w = weekOf(f.date);', "const allocation1237 = EventCrew1237.capture(f, who);\n if (allocation1237.errors.length) { flash(allocation1237.errors.join(' ')); return null; }\n const w = weekOf(f.date);"),
        ("recorded_by: who, recorded_on: todayIso(), at: new Date().toISOString()};", "recorded_by: who, recorded_on: todayIso(), at: new Date().toISOString(), ...(allocation1237.value ? {event_allocation: allocation1237.value} : {})};"),
        ("const pr = fenceCostFor('labour');", "const pr = EventCrew1237.price(n, fenceCostFor('labour'));\n const amount1237 = EventCrew1237.cost(n, pr.value != null ? Math.round(n.labour_hours * pr.value * 100) / 100 : null);"),
        ("(pr.value != null ? ', ' + money(Math.round(n.labour_hours * pr.value * 100) / 100) + ' paid to Advanced' : ', no labour rate yet')", "(amount1237 != null ? ', ' + money(amount1237) + ' paid to Advanced' : ', no labour rate yet')")
    ], 'validated native event allocation capture')
    change('<div class="chdrow"><button type="button" class="btn primary" id="snSave"${dis}>', '<label><input id="snEventCrew" type="checkbox"${dis}> This is the existing event crew — total person-hours for this date</label>\n <div class="f"><label for="snEventConfirm">Scope confirmation, if linked</label><input id="snEventConfirm" maxlength="300" placeholder="Who confirmed this is the existing event crew"${dis}></div>\n <div class="hint">Linked crew hours replace that date’s event-scope total and supplier forecast. No individual shift hours are inferred.</div>\n <div class="chdrow"><button type="button" class="btn primary" id="snSave"${dis}>', 'native explicit scope control')
    change("const n = recordServiceNote({note_no: v('snNo'), date: v('snDate'), location: v('snWhere'), labour_hours: v('snHours'), crew_note: v('snCrew'), metres: v('snMetres'), note: v('snNote'), signed_by: v('snSigned')});", "const f1237 = {note_no: v('snNo'), date: v('snDate'), location: v('snWhere'), labour_hours: v('snHours'), crew_note: v('snCrew'), metres: v('snMetres'), note: v('snNote'), signed_by: v('snSigned')};\n if (pane.querySelector('#snEventCrew')?.checked) f1237.event_allocation = EventCrew1237.makeAllocation(f1237, EventCrew1237.environment(), {by: whoAmI(), on: todayIso(), text: v('snEventConfirm')});\n const n = recordServiceNote(f1237);", 'capture explicit metadata with note')
    change("The hours are paid to Advanced at their Labour rate and the hours they bill are charged to the V8s at the labour rate. Metres moved are kept on the note for the record; they are not a second charge.", "Ordinary notes use the supplier and customer labour rates. A confirmed existing-event-crew note uses the linked supplier basis and replaces that date’s customer event-scope hours once. Metres moved remain source information, not a second charge.", 'native form explains both ordinary and linked pricing')
    change("${esc(n.crew_note || '')}${n.note ?", "${esc(n.crew_note || '')}${EventCrew1237.noteWords(n) ? '<br><span class=\"w\" data-event-note1237=\"' + esc(n.id) + '\">' + esc(EventCrew1237.noteWords(n)) + '</span>' : ''}${n.note ?", 'visible note scope and held review')
    change('amount: green.rate != null ? green.amount : null, lines: green.notes', 'amount: green.priced ? green.amount : null, lines: green.notes', 'readiness retains known mixed-rate supplier cost')
    section('function greenBookCard(){', '\nfunction blueBookCard(){', [
        ('<span class="chip">charged at the labour rate</span>', '<span class="chip">recorded supplier labour</span>'),
        ("<b title=\"${esc(PL_INSTALL)}\">Installation — external contractors</b>, what Coates pays Advanced for their crew — ${esc(hoursTxt(T.hours))} h at their Labour rate${T.rate != null ? ` of ${esc(money(T.rate))} an hour ${T.rate_source === 'typed' ? `(typed on this tab by ${esc(T.rate_by || 'unnamed')})` : '(their own cost sheet)'}` : ' — none on file yet'}\n = <b>${T.rate != null ? esc(money(T.amount)) : '—'}</b> ex GST. It is charged to the V8s inside the fencing installation rates and never on a line of its own.</p>", "<b title=\"${esc(PL_INSTALL)}\">Installation — external contractors</b>, what Coates pays Advanced: <b>${esc(supplierGreenText1014(T))}</b> ex GST. Linked existing-crew notes are charged through the event scope; ordinary notes are charged at the customer labour rate. Supplier invoices and payment still need matching.</p>"),
        ("${T.rate != null ? esc(money(T.amount)) : '—'}", "${T.priced ? esc(money(T.amount)) : '—'}")
    ], 'green-book mixed rates and correct customer ownership')
    change("Advanced's labour and truck hours on the green book at their Labour rate(the hours they bill are charged to the V8s at the labour rate, a fencing line)", "Advanced's labour and truck hours on the green book at their supplier rates (ordinary notes are customer fencing charges; explicitly linked existing-crew notes are charged once through the event scope)", 'Costs explanation follows actual charge ownership')
    section('function fencePrivateRow(d){', '\nfunction fencePrivateApply(){', [
        ("const book=d.book||'red',paper=fencePrivatePaperState(d),no=d.docket_no||d.id,review=fenceReviewContext836(d);", "const book=d.book||'red',paper=fencePrivatePaperState(d),no=d.docket_no||d.id,review=fenceReviewContext836(d);\n const eventInfo1237=book==='green'?EventCrew1237.status(d):null;"),
        ("}.The hours Advanced bill are charged to the V8s at the labour rate.</p>", "}.${eventInfo1237?.status==='valid'?' Customer Revenue is included once in the existing event scope.':' Ordinary note hours are charged to the V8s at the customer labour rate.'}</p>"),
        ('<div class="fp-row-foot"><div class="fp-paperlinks">', '${eventInfo1237?.status===\'review\'?\'<p class="fp-alert" data-event-review1237>\'+esc(EventCrew1237.noteWords(d))+\'</p>\':\'\'}<div class="fp-row-foot"><div class="fp-paperlinks">'),
        ('<div class="fp-evidence-body">${fenceReviewDetails836', '<div class="fp-evidence-body">${eventInfo1237?\'<p data-event-allocation1237>\'+esc(EventCrew1237.noteWords(d))+\'</p>\':\'\'}${fenceReviewDetails836')
    ], 'current fencing card exposes linked basis and held review')

    section('function scopeFigures(){', '\n/* a change to the scope,', [
        ('return {lines, times, people, hours, at: cents(at)', 'return EventCrew1237.applyScope({lines, times, people, hours, at: cents(at)'),
        ("provisional: /to be updated/i.test(SCOPE.access_plan.as_written || '')};", "provisional: /to be updated/i.test(SCOPE.access_plan.as_written || '')});")
    ], 'customer event total from signed aggregate')
    section('function billed() {', '\nvar ', [
        ("serviceNoteRows().filter(function (n) { return n && n.usable !== false && n.cost != null; })", "serviceNoteRows().filter(function (n) { return n && n.usable !== false && n.cost != null && EventCrew1237.status(n)?.status !== 'valid'; })")
    ], 'one customer owner for linked event work')

    change("const source = {id: String(c.id), person: c.person, type, date: c.date, start:", "const source = {...(EventCrew1237.covered(c) ? {eventAllocation1237: EventCrew1237.covered(c).allocation} : {}), id: String(c.id), person: c.person, type, date: c.date, start:", 'Finance evidence fingerprint includes coverage')
    change("return {id: String(c.id), person: c.person, type, date: c.date, month:", "return {...(EventCrew1237.covered(c) ? {coveredByEventNote: EventCrew1237.covered(c).id} : {}), id: String(c.id), person: c.person, type, date: c.date, month:", 'preserve covered Finance source rows')
    change("const rows = fin745Rows(asOf).filter(r => !month || r.month === month);", "const sourceRows1237 = fin745Rows(asOf).filter(r => !month || r.month === month), rows = sourceRows1237.filter(EventCrew1237.active);", 'active Finance summary rows')
    change("const out = {rows, confirmedHours: 0,", "const out = {rows, sourceRows: sourceRows1237, coveredRows: sourceRows1237.filter(r => !EventCrew1237.active(r)), confirmedHours: 0,", 'Finance source history remains available')
    section('function acc762LabourReview(rows){', '\n/* v7.63 -', [('rows.forEach(r => {', 'rows.filter(EventCrew1237.active).forEach(r => {')], 'monthly review active population')
    change("const labourRows = fin745Rows(asAt).filter(r => r.month === month);", "const labourRows = fin745Rows(asAt).filter(r => r.month === month && EventCrew1237.active(r));", 'monthly cost candidates exclude replaced forecast')
    change("const rows = fin745Rows(todayIso()), months = {}, all = workforce(), peopleByKey = new Map();", "const rows = fin745Rows(todayIso()).filter(EventCrew1237.active), months = {}, all = workforce(), peopleByKey = new Map();", 'Finance workforce active population')
    change("if (!row) return {ok: false, error: 'This source shift is missing or is no longer usable.'};", "if (!row) return {ok: false, error: 'This source shift is missing or is no longer usable.'};\n if (!EventCrew1237.active(row) && (p.confirmed || p.actualCost != null || p.allocation === 'allocated')) return {ok: false, error: 'This planned shift is covered by an aggregate event-crew note. Review that supplier evidence; do not create a second individual actual.'};", 'Finance native review prevents double actual')
    change("else { if (r.month !== p.workMonth) issues.push(id + ': source is outside the work month.');", "else { if (!EventCrew1237.active(r) && p.status !== 'void' && p.type !== 'reversal') issues.push(id + ': covered by an aggregate event-crew note; do not journal the planned shift again.');\n if (r.month !== p.workMonth) issues.push(id + ': source is outside the work month.');", 'Finance journal native source guard')
    change("'Service-note dates at supplier labour rates; included within customer fencing rates; invoice/payment matching outstanding'", "(EventCrew1237.status(n)?.status === 'valid' ? 'Recorded event-crew work at the linked supplier rate; customer Revenue is in the event scope; invoice/payment unverified' : 'Service-note dates at supplier labour rates; invoice/payment matching outstanding')", 'dated green-book Finance basis')

    change("L.filter(c => c.kind === 'labour' && c.usable && c.person && rosterIncludes858(c)).forEach(c =>", "L.filter(c => c.kind === 'labour' && c.usable && c.person && rosterIncludes858(c) && EventCrew1237.active(c)).forEach(c =>", 'running totals exclude source forecast')
    section('function runDay(iso){', '\n/* the whole job, person by person:', [
        ('const h = shift ? runHours(shift) : null, worked = shift ? runWorked(shift) : null,', 'const covered1237 = EventCrew1237.covered(shift), h = shift && !covered1237 ? runHours(shift) : null, worked = shift && !covered1237 ? runWorked(shift) : null,'),
        ('return {name: n, P, type, rate, shift, hours:', 'return {name: n, P, type, rate, shift, coveredByEventNote: covered1237?.id || null, hours:')
    ], 'keep source shifts and independent expenses without duplicate labour')
    section('function runTotals(){', '\n/* the writes -', [
        ('const rows = [...per.values()].map(x =>', "const recorded1237 = EventCrew1237.model();\n if (recorded1237.days.length) per.set('__event_crew_aggregate__', {name:'Event crew — signed notes (aggregate)',type:'fencing',rate:null,worked:recorded1237.hours,hours:recorded1237.hours,to_date:recorded1237.hours,ordinary:recorded1237.hours,at_1_5:0,at_2:0,pay:recorded1237.amount,pay_hours_unrated:0,meals:0,nights:0,accommodation:0,rm:0,cons:0,stat:0,aggregate1237:true});\n const rows = [...per.values()].map(x =>")
    ], 'running totals include aggregate recorded work once')
    change("const tot = k => D.rows.reduce((s, r) => s + (r[k] == null ? 0 : Number(r[k])), 0);", "const recordedDay1237 = EventCrew1237.model().byDate[iso];\n const tot = k => D.rows.reduce((s, r) => s + (r[k] == null ? 0 : Number(r[k])), 0) + (recordedDay1237 ? ['worked','hours'].includes(k) ? recordedDay1237.hours : ['pay','total'].includes(k) ? recordedDay1237.amount : 0 : 0);", 'daily aggregate hours and cost once')
    change("const sumSplit = k => D.rows.reduce((s, r) => s + (r.split ? r.split[k] : 0), 0);", "const sumSplit = k => D.rows.reduce((s, r) => s + (r.split ? r.split[k] : 0), 0) + (recordedDay1237 && k === 'ordinary' ? recordedDay1237.hours : 0);", 'flat quoted aggregate hours without overtime inference')
    change('<td><b>${n}</b>${eventStaffingRole833', '<td><b>${n}</b>${r.coveredByEventNote ? \'<br><span class="w">Original plan · covered by signed crew total below</span>\' : \'\'}${eventStaffingRole833', 'source row clearly identified')
    change("const shifts = L.filter(c => c.kind === 'labour' && c.usable);", "const shifts = L.filter(c => c.kind === 'labour' && c.usable && EventCrew1237.active(c));", 'tracker active hours')
    change("rw.hours = r2(rw.hours); rw.unpriced_hours", "rw.recorded_crew1237 = EventCrew1237.model(); rw.hours = r2(rw.hours + rw.recorded_crew1237.hours); rw.unpriced_hours", 'tracker recorded aggregate hours')
    change("T.lines.filter(c => c.kind === 'labour' && c.usable && EVENT_DAYS.includes(c.date)).forEach(s =>", "T.lines.filter(c => c.kind === 'labour' && c.usable && EVENT_DAYS.includes(c.date) && EventCrew1237.active(c)).forEach(s =>", 'customer role hours exclude covered source')
    change("return missingHours(ourCosts(),{date:fin745Date", "return missingHours(ourCosts().filter(EventCrew1237.active),{date:fin745Date", 'missing roster hours respect aggregate evidence')
    change("const rows=ourCosts().filter(isShift),missing=", "const rows=ourCosts().filter(isShift).filter(EventCrew1237.active),missing=", 'workforce gaps active rows')
    change("const additional = finance.filter(r => dates.has(r.date)", "const additional = finance.filter(r => (typeof EventCrew1237 === 'undefined' || EventCrew1237.active(r)) && dates.has(r.date)", 'staffing additional records active rows')
    change("...(typeof serviceNoteRows==='function'?serviceNoteRows():[])", "...(typeof serviceNoteRows==='function'?serviceNoteRows().filter(n=>!Object.prototype.hasOwnProperty.call(n,'event_allocation')):[])", 'explicit allocations never trigger broad same-date hold')

    section('<script id="racecrew1227-script">', '</script>', [
        ('fin745Rows(day).filter(isCrew)', 'fin745Rows(day).filter(isCrew).filter(EventCrew1237.active)'),
        ("o.job=r2(o.known+o.toCome);o.people=people.size;o.days=[...days].sort();", "o.job=r2(o.known+o.toCome);o.people=people.size;o.days=[...days].sort();\n const linked1237=EventCrew1237.model();o.recordedHours=linked1237.hours;o.recordedCost=linked1237.amount;o.recordedDays=linked1237.days;o.crewTotal=r2(o.job+linked1237.amount);o.allocationIssues=linked1237.issues;"),
        ("if(!m||!m.shifts)return '';", "if(!m)return '';\n if(!m.shifts)return m.recordedHours ? 'event crew: '+fmtNum(m.recordedHours)+' total person-hours recorded on signed notes, '+money(m.recordedCost)+' at the linked supplier rate, included in the green book; invoice/payment unverified'+(how==='charge'&&m.charge?' · customer event scope: '+fmtNum(m.charge.hours)+' h at '+money(m.charge.rate)+' = '+money(m.charge.amount):'') : '';"),
        ("if(m.plannedShifts)s+='; Advanced’s race-day dockets are not on the record yet';", "if(m.recordedHours)s+='; '+fmtNum(m.recordedHours)+' total person-hours recorded on signed notes, '+money(m.recordedCost)+' included once in the green book; invoice/payment unverified';\n if(m.plannedShifts)s+='; remaining planned dates await their signed crew totals';")
    ], 'race crew residual forecast and recorded evidence')
    change("— ${money(RC1227.toCome)}; Advanced bills from signed daily event dockets, and none for the race days are on the record yet", "— ${money(RC1227.toCome)}; these remaining planned dates await their signed daily event-crew totals", 'remove obsolete whole-event missing statement')
    change("crewJob1227 = RC1227 ? RC1227.job : 0, crewNow1227 = RC1227 ? RC1227.known : 0", "crewJob1227 = RC1227 ? r2(RC1227.job + (RC1227.recordedCost || 0)) : 0, crewNow1227 = RC1227 ? r2(RC1227.known + (RC1227.recordedCost || 0)) : 0", 'whole-job labour comparison includes recorded crew cost once')
    change("${RC1227 && RC1227.shifts ? row('Race weekend — the Advanced race crew (Fencing 1–6)', m(RC1227.known), m(RC1227.toCome), m(RC1227.job),", "${RC1227 && (RC1227.shifts || RC1227.recordedHours) ? row('Race weekend — the Advanced race crew', m(crewNow1227), m(RC1227.toCome), m(crewJob1227),", 'whole-job comparison distinguishes recorded crew and remaining forecast')

    change("D.rows=D.rows.filter(r=>(r.shift&&rosterIncludes858(r.shift))||r.meal||r.night||Object.values(r.misc).some(Boolean));", "D.rows=D.rows.filter(r=>((r.shift&&rosterIncludes858(r.shift))||r.meal||r.night||Object.values(r.misc).some(Boolean)));", 'running sheet active rows with separate evidence history')
    change('${Workforce1010.sourceCard()}', '${EventCrew1237.dayHtml(iso)}\n${Workforce1010.sourceCard()}', 'running sheet aggregate and retained source history')
    change('api.scopeRows=function(line,ro){\n return scopePeople(line)', 'api.scopeRows=function(line,ro){\n if(line.days.some(d=>d.aggregate1237))return EventCrew1237.scopeHtml(line,ro);\n return scopePeople(line)', 'aggregate scope presentation without individual invention')
    change("hours:index<day.people?day.per:0", "hours:day.aggregate1237?null:index<day.people?day.per:0,aggregate1237:!!day.aggregate1237", 'individual rows retain unknown actual split')
    change("hours:line.days.reduce((sum,day)=>sum+(index<day.people?day.per:0),0)", "hours:line.days.some(day=>day.aggregate1237)?null:line.days.reduce((sum,day)=>sum+(index<day.people?day.per:0),0)", 'do not divide signed crew totals between people')
    change(footer[0], "+' · v12.37'; /* v8.19 release922", 'release footer')
    return text

if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text(), str(target)))
    print('v12.37 explicit aggregate event-crew reconciliation applied')
