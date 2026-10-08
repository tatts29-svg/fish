#!/usr/bin/env python3
# Author: Andrew Fisher. The exact private workbook is required; no financial source data lives in this patch.
import copy, hashlib, json, os, re, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
import baseplan949 as B
SHA='eb4a224fadbe1350d031adf8a1b12760d3dd748a2f0643119ea103d1df9b5b21'

def refresh(data,workbook):
    import openpyxl
    assert hashlib.sha256(Path(workbook).read_bytes()).hexdigest()==SHA,'wrong source workbook'
    before=copy.deepcopy(data); old=before['rental_on_hire']; oldrows={(str(r['rental_contract']),int(r['line'])):r for r in old['rows']}
    new,tabs=B.read_export(workbook)
    added=set(new)-set(oldrows); removed=set(oldrows)-set(new)
    assert added=={('9987005',6),('9961976',42),('9961976',43)},'unexpected additions'
    assert removed=={('9987005',4),('9987005',5),('9968726',10),('9968726',11)},'unexpected absences'
    log=B.apply(data,new,tabs,{},False)
    R=data['rental_on_hire']
    for r in R['rows']:
        k=(str(r['rental_contract']),int(r['line']))
        if k in oldrows: assert r.get('match')==oldrows[k].get('match'),'existing allocation moved'
    # Preserve the source rows as evidence, outside the active array used by every financial calculation.
    R['source_audit949']={'overlappingNumberGroups':len(log['flags']),'note':'The source still repeats some fleet numbers on multiple contract lines. These lines remain unchanged; supplier transfer/off-hire and duplicate-charge evidence must be reconciled before any charge is removed.'}
    R['source_history949']={'source':old.get('source'),'supplied_on':old.get('supplied_on'),'superseded_by_sha256':SHA,'rows':[copy.deepcopy(oldrows[k]) for k in sorted(removed)]}
    R['source']='Baseplan SuperCars.xlsx — latest workbook supplied by Andrew Fisher, 9 Oct 2026. Contract information; recorded site allocations remain authoritative.'
    R['supplied_by']='Andrew Fisher';R['supplied_on']='2026-10-09';R['source_sha256']=SHA
    R['discrepancies949']=[{'ref':'T0109','contract':'9987005','line':6,'contractAsset':B.txt(new[('9987005',6)]['Item'])}]
    # All footer fields are independently read from exact source cells; no customer rate is copied as a supplier cost.
    wb=openpyxl.load_workbook(workbook,data_only=True,read_only=True); evidence=[]
    for sheet,top,expected_code in [('9974042-KINP',11,'ROY002'),('9961265-STPS',27,'PRE808')]:
        ws=wb[sheet];con,branch=sheet.split('-');code=B.txt(ws.cell(top,1).value)
        assert code==expected_code and B.txt(ws.cell(top+3,1).value).lower()=='cost rate','supplier note changed'
        name=B.txt(ws.cell(top+1,2).value);sa=B.txt(ws.cell(top+2,2).value);rate=ws.cell(top+3,2).value
        assert name and sa and isinstance(rate,(int,float)) and rate>0,'invalid supplier note'
        lines=[r['line'] for r in R['rows'] if r['rental_contract']==con and r['supplier_sub_rental']==code]
        assert len(lines)==(1 if code=='ROY002' else 8),'supplier scope changed'
        evidence.append({'contract':con,'contractBranch':branch,'supplierCode':code,'supplierName':name,'salesAnalysisCode':sa,'costRate':rate,'rateCell':'B'+str(top+3),'sheet':sheet,'cells':'A'+str(top)+':B'+str(top+3),'lines':lines,'sourceSha256':SHA,'moneyKind':'Direct costs','category':'Rehire','rateBasis':'Estimated from the linked contract native charge basis; not supplier invoice terms','supplierAliases':['Royal Wolf','United Rentals Australia Pty Ltd'] if code=='ROY002' else ['PremAir','PremAir Hire','Premiair Services Pty Ltd']})
    wb.close();R['supplier_cost_evidence949']=evidence
    # Source assignments may describe contracts; they must not keep active links to absent source lines.
    active={str(r['rental_contract'])+'/'+str(r['line']) for r in R['rows']}
    for v in R['assignments'].values(): v['lines']=[k for k in v.get('lines',[]) if k in active]
    assert {k:v for k,v in data.items() if k not in ('rental_on_hire','plant_lines')}=={k:v for k,v in before.items() if k not in ('rental_on_hire','plant_lines')},'non-source data changed'
    for p,q in zip(data['plant_lines']['lines'],before['plant_lines']['lines']):
        assert {k:v for k,v in p.items() if k!='rental'}=={k:v for k,v in q.items() if k!='rental'},'operational plant data changed'
    return log

def patch(t,workbook,path='candidate.html'):
    assert 'const Source949 =' not in t,'already patched'
    assert 'explorer-card948-script' in t and 'Ownership944' in t and 'v9.48' in t,'wrong base'
    at=t.index('const DATA = ')+len('const DATA = ');D,n=json.JSONDecoder().raw_decode(t[at:]);old=t[at:at+n]
    refresh(D,workbook)
    t=t[:at]+json.dumps(D,ensure_ascii=False,separators=(',',':'))+t[at+n:]
    def change(a,b,label):
        nonlocal t;t=rep(t,a,b,label,path)
    change('function onhireLine(r){',HERE.joinpath('source949.js').read_text()+'\nfunction onhireLine(r){','source evidence helper')
    change('${contractMoneyWords(r)}`;', '${contractMoneyWords(r)}${Source949.html(r)}`;', 'inline supplier cost evidence')
    change("${r.location ? `<br><span class=\"w\" style=\"font-size:11px;color:var(--mute)\">${esc(r.location)}</span>` : ''}</td>","${r.location ? `<br><span class=\"w\" style=\"font-size:11px;color:var(--mute)\">${esc(r.location)}</span>` : ''}${Source949.html(r)}${String(r.rental_contract)==='9987005'&&r.line===6?Source949.note('T0109'):''}</td>",'contract source notes')
    change('<p class="norate">${esc(ONHIRE.authority)}</p>','${Source949.archive()}\n <p class="norate">${esc(ONHIRE.authority)}</p>','retained previous source evidence')
    change("'+g.units.map(u=>rowHtml925(a,u,model)).join('')+", "'+Source949.note(a.key)+g.units.map(u=>rowHtml925(a,u,model)).join('')+",'equipment source discrepancy')
    # Enrich only matched supplier groups; all original financial values and aggregation functions stay untouched.
    change('subs.forEach(r => { const a = amt(r); push({branch:', 'subs.forEach(r => { const a = amt(r), evidence949=Source949.evidence(r), forecast949=Source949.forRow(r); push({branch:', 'supplier evidence group')
    change("supplier: r.supplier_sub_rental ? `supplier code ${r.supplier_sub_rental}` : 'supplier not on the line',", "supplier: evidence949 ? evidence949.supplierName : r.supplier_sub_rental ? `supplier code ${r.supplier_sub_rental}` : 'supplier not on the line',",'known supplier name')
    change("missing: ['the supplier’s name and the Rehire cost (a quote or invoice)']", "missing: forecast949 ? (forecast949.held?['uncovered cost after partial-period supplier actual']:[]) : ['the supplier’s name and the Rehire cost (a quote or invoice)'], costEvidence949:forecast949, costToCome:forecast949?forecast949.estimate:0",'precise unextended supplier evidence')
    change('<br><span>${esc(g.basis)}</span>${g.notes.length', '<br><span>${esc(g.basis)}</span>${g.costEvidence949?`<br><span class="acc761-w source949-cost">${esc(Source949.words(g.costEvidence949))}</span>`:""}${g.notes.length','supplier formula in existing basis column')
    change("if (k.subhire_lines) gap(`${fmtNum(k.subhire_lines)} sub-hired contract lines — supplier cost`, 'charged to the V8s, cost not on the record', 'Andrew — supplier quotes or invoices');", """const supplier949=Source949.model();
 supplier949.forEach(f=>{push('Rehire — '+f.supplier+' (calculated estimate)',f.costBranch,0,f.estimate,Source949.words(f),'Revenue branch '+f.revenueBranch+' · cost SA '+f.salesAnalysisCode+' · contract '+f.contract+' line '+f.line);if(f.held)gap('Rehire — '+f.supplier+' partial period','A whole-event supplier estimate cannot be allocated to the uncovered period from this source. No overlapping estimate is added.','Supplier invoice reconciliation');});
 if (k.subhire_lines>supplier949.length) gap(`${fmtNum(k.subhire_lines-supplier949.length)} sub-hired contract lines — supplier cost`, 'No linked supplier cost rate on the latest source', 'Supplier cost record');""",'native job-end supplier forecast')
    change("job: r2((qClean ? qk.rehire : rqAll) + fenceGear + n(F.cost)),", "job: r2((qClean ? qk.rehire : rqAll) + fenceGear + n(F.cost) + Source949.model().reduce((sum,f)=>sum+f.estimate,0)),",'forecast P&L same supplier estimates')
    change("missing: 'the SUB lines’ and the sub-hired forklifts’ supplier costs'", "missing: 'Supplier estimates use the linked contract basis; actual supplier invoices and any unpriced hired-in equipment remain unconfirmed', estimate949:Source949.model().reduce((sum,f)=>sum+f.estimate,0)", 'forecast P&L source distinction')
    change("const rowsIn = X.rows.map(r => ({stream: r.stream, kind: streamOf(r.stream), toDate: r.toDate || 0, toCome: r.toCome || 0}));", "const rowsIn = X.rows.map(r => ({stream: r.stream, kind: /^Rehire —/.test(r.stream)?'rehire':streamOf(r.stream), costBranch949:/^Rehire —/.test(r.stream)?r.branch:null, toDate: r.toDate || 0, toCome: r.toCome || 0}));",'finance handover source cost branch')
    change("const costs = rowsIn.map(r => { const sp = splitFor(r.kind, r.toDate, r.toCome), by = {};", "const costs = rowsIn.map(r => { const sp = r.costBranch949?{toDate:{[r.costBranch949]:r.toDate},toCome:{[r.costBranch949]:r.toCome}}:splitFor(r.kind, r.toDate, r.toCome), by = {};",'supplier forecast retains cost SA branch')
    change("const labourRows = fin745Rows(asAt).filter(r => r.month === month);", """Source949.model().forEach(f=>{const amount=Source949.month(f,month);if(amount>0)addCost('Rehire — linked supplier-rate forecast',f.costBranch,amount,Source949.words(f),{id:f.id,status:'forecast',forecastAmount:amount,source:'Baseplan supplier cost note',supplier:f.supplier,contract:f.contract,line:f.line,invoiceStatus:'unverified',paymentStatus:'unknown'});});
 const labourRows = fin745Rows(asAt).filter(r => r.month === month);""",'monthly forecast only without actual journal')
    change('still to come (the fencing programme at Advanced’s rates)', 'still to come (the fencing programme and calculated supplier estimates)', 'cost forecast description')
    change('only the fencing programme has a “still to come”.', 'only fencing Revenue has a “still to come”; supplier cost estimates are shown separately.', 'Revenue and estimated cost distinction')
    change("missing: 'Supplier estimates use the linked contract basis; actual supplier invoices and any unpriced hired-in equipment remain unconfirmed', estimate949:", "missing: 'Job-end Rehire includes calculated supplier estimates from the linked contract quantity and charge basis; these are not invoices. Other unpriced hired-in equipment remains unconfirmed.', estimate949:", 'P&L estimate explanation')
    change("+ ' · v9.48';","+ ' · v9.49';",'release footer')
    return t

if __name__=='__main__':
    assert len(sys.argv) in (2,3),'usage: patch_v949.py HTML [OUTPUT]; BASEPLAN949_XLSX must name private original'
    src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)==3 else src;t=patch(src.read_text(),os.environ['BASEPLAN949_XLSX'],str(out));out.write_text(t)
    print('v9.49: source refreshed; three additions, four archived absences; two separate supplier-rate evidence notes')
