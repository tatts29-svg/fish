"""Author: Andrew Fisher. Wire reviewed unallocated building forecast into existing totals."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'toolchain'))
from rep import rep as checked_rep

def rep(html,old,new):
    return checked_rep(html,old,new,"Pricing forecast 1010",__file__)

def apply(html):
    source=Path(__file__).with_name('pricing1010.js').read_text()
    projection=source.split('// SOURCE_ROWS1010_START',1)[1].split('// SOURCE_ROWS1010_END',1)[0].strip()
    html=rep(html,'const ONHIRE_ROWS = ONHIRE ? ONHIRE.rows : [];','const ONHIRE_ROWS = ONHIRE ? ('+projection+')(ONHIRE.rows) : [];')
    html=rep(html,"job: r2(hire + generatorModel1004().hireRemaining)","job: r2(hire + generatorModel1004().hireRemaining + pricingForecast1010().total)")
    html=rep(html,"+ generators1004.remaining),generators1004,hireToCome979", "+ generators1004.remaining + pricingForecast1010().total),allocationForecast1010:pricingForecast1010(),generators1004,hireToCome979")
    html=rep(html,"revenueForecastRows.push(...generatorForecastRows1004());","revenueForecastRows.push(...generatorForecastRows1004(),...pricingForecast1010().rows);")
    html=rep(html," const ch = contractCharge(r);\n if(ch.generator1004)"," const ch = contractCharge(r);\n if(ch.allocation1010&&ch.allocation1010.state!=='current-scope-confirmed'){const a=ch.allocation1010;if(a.state==='forecast-allocation-hold'&&month===evMonth&&a.remainingAmount>0)addRev('Hire Revenue — approved building forecast',a.branch,a.remainingAmount,a.reason,{source:'current approved scope / original contract rate',ref:a.ref,contract:a.contract,line:a.line,status:'forecast',forecastAmount:a.remainingAmount,allocationPending:true});return;}\n if(ch.generator1004)")
    html=rep(html," const br = r.branch_code || 'no branch', what = String(r.what || r.description || 'Contract line')", " const br = generatorBranch1004(r) || 'no branch', what = String(r.what || r.description || 'Contract line')")
    html=rep(html,"b.rehireUnits += Number(r.quantity) || 0;", "b.rehireUnits += Number(contractBillingQuantity1010(r)) || 0;")
    html=rep(html,"units = rs => rs.reduce((s, r) => s + (Number(r.quantity) || 0), 0)", "units = rs => rs.reduce((s, r) => s + (Number(contractBillingQuantity1010(r)) || 0), 0)")
    html=rep(html,"description: r.what || r.description, qty: r.quantity, kind: r.kind,", "description: r.what || r.description, qty: contractBillingQuantity1010(r), sourceQuantity1010:r.quantity, kind: r.kind,")
    for old,new in [
        ("supplier:RH.co,lines:ep.length", "supplier:RH.co,revenueLines1010:ep.map(r=>r.rental_contract+'|'+r.line),lines:ep.length"),
        ("supplier:finance928ContractOwner(rs[0]).owner,lines:rs.length", "supplier:finance928ContractOwner(rs[0]).owner,revenueLines1010:rs.map(r=>r.rental_contract+'|'+r.line),lines:rs.length"),
        ("subs.forEach(r => { const a = amt(r), evidence949=Source949.evidence(r), forecast949=Source949.forRow(r); push({branch: r.branch_code", "subs.forEach(r => { const a = amt(r), evidence949=Source949.evidence(r), forecast949=Source949.forRow(r); push({revenueLines1010:[r.rental_contract+'|'+r.line],branch: r.branch_code"),
        ("if (forks.length) push({branch: 'NVAC'", "if (forks.length) push({revenueLines1010:forks.map(r=>r.rental_contract+'|'+r.line),branch: 'NVAC'"),
        ("take(r => r.subhired_machine && finance928ContractOwner(r).rehire).forEach(r => { const a = amt(r); push({branch: r.branch_code", "take(r => r.subhired_machine && finance928ContractOwner(r).rehire).forEach(r => { const a = amt(r); push({revenueLines1010:[r.rental_contract+'|'+r.line],branch: r.branch_code"),
    ]:html=rep(html,old,new)
    html=rep(html," const byBranch = {}; groups.forEach(g => { const b = byBranch[g.branch] = byBranch[g.branch] || {branch: g.branch, groups: 0, revJob: 0,costJob: 0, costMissing: 0, forecastMissing:0}; b.groups++; b.revJob = r2(b.revJob + (g.revJob || 0)); b.costJob = r2(b.costJob + (g.costJob || 0));if (g.cost == null) b.costMissing++; if(g.costJob==null)b.forecastMissing++; });", " const byBranch = rehireBranches1010(groups);")
    html=rep(html,'const row = g => `<tr><td><span class="chip ref mono">${esc(g.branch)}</span></td><td><b>${esc(g.what)}</b>', 'const row = g => `<tr><td>${(g.revenueBranches1010?.length?g.revenueBranches1010:[{branch:g.branch,amount:g.revJob}]).map(b=>`<span class="chip ref mono">${esc(b.branch)}</span>${g.revenueBranches1010?.length>1?`<br><small>${esc(money(b.amount))}</small>`:""}`).join("<br>")}</td><td><b>${esc(g.what)}</b>')
    html=rep(html,'Rehire Revenue and related supplier costs — by Revenue branch, to job end','Rehire Revenue and supplier costs — by branch, to job end')
    html=rep(html,'By Revenue branch, with related supplier costs to job end:','Revenue and related supplier costs, with branch allocations shown separately:')
    html=rep(html,'This recovery comparison groups supplier costs with their related Revenue branch. Finance allocates Direct costs to the documented cost branch; differences are identified in the rows below.','Customer Revenue follows its recorded allocation. Supplier costs retain their documented cost branch; different allocations are shown below.')
    return html
