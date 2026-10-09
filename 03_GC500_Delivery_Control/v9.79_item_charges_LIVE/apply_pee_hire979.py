# Author: Andrew Fisher. Reconcile source-backed missing customer hire forecast once.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply_pee_hire979(s):
 if 'function peeHireForecast979(' in s:raise ValueError('Already applied')
 s=rep(s,'const buildingTransport = buildingTransportModel831();','const buildingTransport = buildingTransportModel831(), peeHire979=peeHireForecast979();','Shared hire forecast',__file__)
 s=rep(s,'noCardRate: F.noCardRate};','hireToCome979:peeHire979.amount,noCardRate: F.noCardRate};','Hire forecast source',__file__)
 old='buildingTransport.uncoveredAdditional + labourRevenue858().remaining + (typeof ArrivalCharges975!==\'undefined\'?cleaningRevenue975().remaining:0))'
 s=rep(s,old,old[:-1]+' + peeHire979.amount)','Job revenue includes uncovered hire',__file__)
 s=rep(s,'job: r2(rehireLines + fence + n(F.revenue))','job: r2(rehireLines + fence + n(F.revenue) + peeHireForecast979().amount)','Rehire ledger forecast',__file__)
 old=' const T = {rev: r2(groups.reduce'
 new=""" const pee979=peeHireForecast979(),ep979=groups.find(g=>g.what==='Toilets — Event Portables');
 if(pee979.amount>0&&ep979){ep979.revToCome=r2((ep979.revToCome||0)+pee979.amount);ep979.revJob=r2((ep979.revJob||0)+pee979.amount);ep979.uncontractedHire979=pee979;}
 const T = {rev: r2(groups.reduce"""
 s=rep(s,old,new,'Existing supplier group includes customer hire forecast once',__file__)
 s=rep(s,'  return Branch978.model({branches:B,','  const pee979=peeHireForecast979();if(pee979.amount>0)revenueForecastRows.push({branch:pee979.branch,amount:pee979.amount});\n  return Branch978.model({branches:B,','Same branch hire forecast',__file__)
 src=(Path(__file__).with_name('pee_hire979.js')).read_text()+'''\nfunction peeHireForecast979(){return heldMemo('peeHireForecast979',()=>{
 const a=assetOf('WC09');if(!a||a._cancelled||a.rest_of)return {amount:0,state:'not required'};
 const l=chargeLines(a).find(r=>r.item==='Pee Panel');if(!l)return {amount:0,state:'not required'};
 const quantity=qtyOf(l),arrived=toiletArrival962(a,l.item,todayIso(),quantity||0);
 return PeeHire979.forecast([{ref:a.key,item:l.item,quantity,arrived}],ONHIRE_ROWS);
});}
const cardBefore979=cardRate;cardRate=function(disc,item,key){return PeeHire979.card(disc,item,cardBefore979.apply(this,arguments));};
'''
 return rep(s,'</body>\n</html>\n','<script id="pee-hire979-script">'+src+'</script>\n</body>\n</html>\n','Pee Panel original card pricing',__file__)
