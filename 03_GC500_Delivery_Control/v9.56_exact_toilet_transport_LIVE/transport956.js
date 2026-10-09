/* Author: Andrew Fisher. Exact source matches for two planned tank-mounted block pickups. */
const transport956Matches=Object.freeze([
 Object.freeze({ref:'WC05',task:'T0225',qty:1,name:'Event Operations Compound Toilet - Combo Block (Tanked)',cell:'L27'}),
 Object.freeze({ref:'WC60',task:'T0203',qty:2,name:'Toilets (Tank Mounted)',cell:'L27:L29'})
]);
function transport956Demand(r,context,env){
 const current=env.demand(r,context);
 if(current.known||r.src!=='planned'||r.leg!=='demob'||r.movement!=='remove'||r.item!=='Toilet Block 6m'||!r.a||r.a.key!==r.key||r.cancelled||r.off||r.rest_of)return current;
 const raw=r.e&&r.e.quantity_raw!=null?r.e.quantity_raw:r.qty,qty=/^\d+$/.test(String(raw).trim())?Number(raw):null;
 const match=transport956Matches.find(m=>m.ref===r.key&&m.task===r.task&&m.qty===qty&&m.name===String(r.a.name||'').trim());
 if(!match)return current;
 const source=env.lines(r.a),found=source.filter(l=>l.item===r.item);
 if(found.length!==1||found[0].qty!==match.qty||found[0].transport_cost!=null)return current;
 // Original 2026 card: Transport A3 says each way, ex GST; all three tank-mounted variants have the same L-column cost.
 const rate=328.9742068338,lines=source.map(l=>l===found[0]?Object.assign({},l,{transport_cost:rate}):l),answer=env.matched(r,context,lines);
 if(!answer.known)return answer;
 return Object.assign({},answer,{reason:answer.reason+' — tank-mounted block matched to 2026 Transport '+match.cell+' (cost, each way; forecast only)',source956:{sha256:'60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6',sheet:'Transport ',cells:match.cell,ref:match.ref,task:match.task}});
}
function transport956NativeDemand(r,context){
 const demand=(row,rows,lines)=>finance928LoadDemands([Object.assign({},row,{leg:transport953Leg(row)})],lines,rows.map(x=>Object.assign({},x,{leg:transport953Leg(x)})))[0];
 return transport956Demand(r,context,{demand:(row,rows)=>demand(row,rows,assetTotal(row.a).lines||[]),lines:a=>assetTotal(a).lines||[],matched:demand});
}

function transport956ResidualCards(cards){
 const existing=cards.filter(r=>!r.forecast.source956);
 // Adding the two source matches must not move the existing rounding residual into their new demob costs.
 return cards.some(r=>r.forecast.source956)&&existing.length?existing:cards;
}
