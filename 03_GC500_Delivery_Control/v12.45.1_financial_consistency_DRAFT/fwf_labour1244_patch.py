"""Author: Andrew Fisher. Apply the approved combined FWF amount consistently."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def patch(text,rep,path):
    anchor='/* the labour ticked per piece, by kind and by branch - the same arithmetic as labourMoney, tick by tick */'
    text=rep(text,anchor,(ROOT/'fwf_labour1244.js').read_text()+'\n'+anchor,'FWF shared projection',path)
    start=text.index('function pl760Ticks(){')
    end=text.index('/* the By branch table of the P&L:',start)
    original=text[start:end]
    part=rep(original,' const mk = () => ({ticks: 0, amount: 0, unknown: 0});',' const fwf1244ByBranch = {};\n const mk = () => ({ticks: 0, amount: 0, unknown: 0});','FWF observed totals',path)
    before='by.forEach(k => { const amt = lab.total == null || k.unk ? null : Math.round(k.rate * k.n * 100) / 100;'
    after=before+" if(l.item==='FWF'&&k.grp==='install'&&amt!=null)fwf1244ByBranch[br]=Math.round(((fwf1244ByBranch[br]||0)+amt)*100)/100;"
    part=rep(part,before,after,'FWF existing branch amounts',path)
    part=rep(part,' return out;',' return FwfLabour1244.ticks(out,fwf1244ByBranch,ONHIRE_ROWS);','FWF shared ticks',path)
    text=rep(text,original,part,'FWF tick integration',path)
    text=rep(text,' let fwf12416 = 0; let labour = standalone1228.total, labourTicks',' let labour = standalone1228.total, labourTicks','remove duplicate FWF accumulator',path)
    text=rep(text,"{ labour += l.labour.total; if (l.item === 'FWF') fwf12416 += l.labour.total; }",'{ labour += l.labour.total; }','remove duplicate FWF line sum',path)
    old=" /* v12.42.16: FWF install & demob at Baseplan's $16,762.40 (9968955/146 + 9994954/23; Andrew, 28 Oct 2026) */ if (fwf12416 > 0) labour += 16762.40 - fwf12416;"
    new=" /* Existing v12.42.16 combined FWF approval, shared with the tick and branch models. */ {const a=pl760Ticks().fwf1244;if(a?.applied)labour+=a.delta;}"
    text=rep(text,old,new,'share FWF headline adjustment',path)
    start=text.index(' labourPlan=function(){')
    end=text.index(' labourRevenue858=function(){',start)
    original=text[start:end]
    before='  for(const a of FinanceRequest996.assets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key))){'
    after="  for(const a of FinanceRequest996.assets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key)&&!(typeof NotChargedHere1152!=='undefined'&&NotChargedHere1152.has(a.key)))){"
    part=rep(original,before,after,'apply existing financial holds before fire slots',path)
    text=rep(text,original,part,'held references stay out of financial labour plan',path)
    old="  const result={slots,all,byLine,byBranch,chargeInclusion1006:true};RENDER_MEMO.set('labourPlan',result);return result;"
    new="  const result=FwfLabour1244.plan({slots,all,byLine,byBranch,chargeInclusion1006:true},pl760Ticks().fwf1244);RENDER_MEMO.set('labourPlan',result);return result;"
    text=rep(text,old,new,'share FWF plan adjustment without physical ticks',path)
    old="  const recorded=pl760Ticks().install.amount,priced=OnsiteCharges1006.cents(Object.values(sums).reduce((n,v)=>n+v,0)),job=Math.max(priced,recorded);\n  return {sums,priced,recorded,job,remaining:OnsiteCharges1006.cents(job-recorded),missing:[...new Set(missing)]};"
    new="  return FwfLabour1244.revenue(sums,missing,pl760Ticks());"
    text=rep(text,old,new,'share FWF labour revenue adjustment',path)
    old=' const movedCharged = r2(per.charged - slotCharged);'
    new=' const movedCharged = r2(per.charged - slotCharged - (TK.fwf1244?.applied ? TK.fwf1244.delta : 0));'
    text=rep(text,old,new,'do not label approved FWF adjustment as moved physical ticks',path)
    old=' if (demob.movedSplitUnknown) demob.complete = false;'
    new=" demob.approvedCombinedSplitUnknown1244=!!(TK.fwf1244?.applied&&TK.fwf1244.delta);\n if (demob.movedSplitUnknown||demob.approvedCombinedSplitUnknown1244) demob.complete = false;"
    text=rep(text,old,new,'demob-only detail remains partial without an approved split',path)
    old='return `<div class="labplan">'
    new="return `<div class=\"labplan\">${P.fwf1244?.applied ? '<p class=\"norate\"><b>FWF install and demob:</b> the approved combined amount replaces the card total. The adjustment is shown separately below; its installation/demob split is not supplied. Physical work records are unchanged.</p>' : ''}"
    text=rep(text,old,new,'show combined FWF basis in financial labour plan',path)
    old=' · accommodation and travel are not labour ·job-end forecast includes'
    new="${TK.fwf1244?.applied ? ' · FWF uses the approved combined install and demob amount; no separate split is supplied' : ''} · accommodation and travel are not labour ·job-end forecast includes"
    text=rep(text,old,new,'explain combined FWF basis in ledger installation',path)
    return text
