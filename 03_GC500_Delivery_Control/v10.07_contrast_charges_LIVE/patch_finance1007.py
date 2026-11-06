# Author: Andrew Fisher. Shared arrived hire and explicit unpriced work scope.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="finance1007-script"' in html: raise ValueError('Finance v10.07 already applied')
    if 'id="charge1006-script"' not in html: raise ValueError('Wrong finance baseline')
    def change(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,__file__)
    change("const a=assetOf('WC09');if(!a||a._cancelled||a.rest_of)return {amount:0,state:'not required'};","const a=assetOf('WC09');if(!a||a._cancelled||a.rest_of)return {amount:0,actualAmount:0,remainingAmount:0,state:'not required'};",'Non-billable pee scope has explicit zero components')
    change("const l=chargeLines(a).find(r=>r.item==='Pee Panel');if(!l)return {amount:0,state:'not required'};","const l=chargeLines(a).find(r=>r.item==='Pee Panel');if(!l)return {amount:0,actualAmount:0,remainingAmount:0,state:'not required'};",'Missing pee line has explicit zero components')
    change('const quantity=qtyOf(l),arrived=toiletArrival962(a,l.item,todayIso(),quantity||0);','const quantity=qtyOf(l),arrived=receivedChargeQty1006(a,l);','Confirmed received quantity for pee-panel hire')
    change('charge.total = cents(charge.contracts + charge.labour + (charge.race.amount || 0) +charge.fencing + charge.other + charge.servicing + charge.transportArrived1006);','charge.uncontractedHire1007=peeHireForecast979().actualAmount||0;\n charge.total = cents(charge.contracts + charge.labour + (charge.race.amount || 0) +charge.fencing + charge.other + charge.servicing + charge.transportArrived1006 + charge.uncontractedHire1007);','Arrived pee hire included in Costs once')
    change("add('transport', X.charge.transportArrived1006 || null, 'charge');","add('transport', X.charge.transportArrived1006 || null, 'charge');\n add('toilets', X.charge.uncontractedHire1007 || null, 'charge');",'Revenue stream includes arrived pee hire')
    change('const hire = r2(n(c.contracts) - (n(c.delivery) - n(c.transportArrived1006)) - rehireLines + fire)', 'const hire = r2(n(c.contracts) + n(c.uncontractedHire1007) - (n(c.delivery) - n(c.transportArrived1006)) - rehireLines + fire)','Uncontracted rehire does not reduce owned hire ledger')
    change('peeHireForecast979().amount+ FinanceRequest996.model().amount','peeHireForecast979().remainingAmount+ FinanceRequest996.model().amount','P&L 1010 adds only remaining pee hire')
    change('if(pee979.amount>0&&ep979){ep979.revToCome=r2((ep979.revToCome||0)+pee979.amount);ep979.revJob=r2((ep979.revJob||0)+pee979.amount);ep979.uncontractedHire979=pee979;}','if(pee979.amount>0&&ep979){ep979.rev=r2((ep979.rev||0)+pee979.actualAmount);ep979.revToCome=r2((ep979.revToCome||0)+pee979.remainingAmount);ep979.revJob=r2((ep979.revJob||0)+pee979.amount);ep979.uncontractedHire979=pee979;}','Rehire actual and remaining classifications')
    change('+ peeHire979.amount + sourceHire996.amount + generators1004.remaining)', '+ peeHire979.remainingAmount + sourceHire996.amount + generators1004.remaining)','Job total preserves pee hire once')
    change('hireToCome979:peeHire979.amount,sourceHire996','hireToCome979:peeHire979.remainingAmount,sourceHire996','Remaining hire excludes received units')
    change('const pee979=peeHireForecast979();if(pee979.amount>0)revenueForecastRows.push({branch:pee979.branch,amount:pee979.amount});','const pee979=peeHireForecast979();if(pee979.remainingAmount>0)revenueForecastRows.push({branch:pee979.branch,amount:pee979.remainingAmount});','Branch remaining split')
    change('const rows = [], gaps = []; const gap = (what, why, owner) => gaps.push({what, why, owner});','const rows = [], gaps = []; const gap = (what, why, owner) => gaps.push({what, why, owner});\n workPricing1007().forEach(r=>gap(r.ref+" · "+r.item+" · work charges",r.why,r.branch));','Finance explicit unpriced onsite work')
    change('const miss = (l, sh) => { missing.push(l); short.push(sh); };','const miss = (l, sh) => { missing.push(l); short.push(sh); };\n workPricing1007().forEach(r=>miss(r.ref+" · "+r.item+": "+r.why,r.ref+" work scope / rate to confirm"));','Costs explicit unpriced onsite work')
    change("if(!info.lines.length)return '<div><b>'+esc(l.item)+'</b> · No separate work charge on the card</div>';","if(!info.lines.length){const gap=workGap1007(a,l);return '<div data-work-scope1007><b>'+esc(l.item)+'</b> · '+(gap?'Work scope / rate to confirm<details><summary>More info</summary><p>'+esc(gap.why)+'</p></details>':'No separate work charge on the card')+'</div>';} ",'Work card distinguishes missing from no additional charge')
    change(' // Contract export billing is a dated snapshot, never proof of today\'s unpaid balance.'," const pee1007=peeHireForecast979();if(month===evMonth&&pee1007.amount>0)addRev('Rehire Revenue — pee panels event-month billing',pee1007.branch,pee1007.amount,pee1007.basis,{ref:pee1007.ref,item:pee1007.item,source:pee1007.source.sheet+' '+pee1007.source.cells,quantity:pee1007.quantity,arrivedQuantity:pee1007.arrivedQuantity,actualAmount:pee1007.actualAmount,status:pee1007.actualAmount>0?'review':'forecast',forecastAmount:pee1007.remainingAmount});\n // Contract export billing is a dated snapshot, never proof of today's unpaid balance.",'October Finance allocates existing pee-panel hire once')
    source=Path(__file__).with_name('finance1007.js').read_text()
    return rep(html,'</body>\n</html>\n','<script id="finance1007-script">\n'+source+'\n</script>\n</body>\n</html>\n','Finance shared model v10.07',__file__)
