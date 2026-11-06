/* Author: Andrew Fisher. Confirmed physical receipts, separate from identities and proposed runs. */
function supplierUnits1006(typed,scope={}){
 const number=u=>String(u.assetNo||'').trim().replace(/\s+/g,'').toUpperCase();
 const epByNumber=new Map(typed.filter(u=>u.owner==='event-portables').map(u=>[number(u),u])),seen=new Set();
 const confirmedAlias=(u,ep,n)=>scope.wholeEventPortables===true||scope.ref==='WC72'&&n==='0699'&&u.owner==='coates'&&u.source==='native'&&u.sourceKey==='["WC72","coates","asset","0699"]'&&ep?.metadata?.uuid==='95b46656-2eda-4238-9679-dea0af3decd1'&&ep.metadata.active===true;
 return typed.filter(u=>{const n=number(u),ep=epByNumber.get(n);if(n&&u.owner!=='event-portables'&&ep&&confirmedAlias(u,ep,n))return false;const id=n?u.owner+'|'+n:u.id;if(seen.has(id))return false;seen.add(id);return true;});
}
function receiptEvidence1006(a,item,d){
 const stamps=typeof S==='undefined'?{}:S.stamps||{},state=typeof S==='undefined'?{}:S;
 const supplied=(state.supplied?.[a.key]?.items||[]).filter(x=>x.asked===item),source=supplied.length===1?supplied[0]:null;
 const history=typeof histOf==='function'?histOf(a.key,'history'):(d.history||[]),on=history.filter(h=>h.state==='on site'&&h.at).map(h=>h.at);
 if(d.recorded&&d.state==='on site'&&d.where!=='rental'&&d.set_at)on.push(d.set_at);
 // Saved native receipt from v9.98 / shared record 5320. This retains a partial receipt after its cumulative field is edited.
 const baseline=a.key==='WC69'&&same(item,'FWF')&&on.includes('2026-10-11T20:50:00.898Z')?[{at:'2026-10-11T20:50:01.330Z',quantity:6,basis:'Recorded item receipt · shared record 5320'}]:[];
 return {itemOnly:new Set(chargeLines(a).map(l=>l.item).filter(Boolean)).size===1,on:[...new Set(on)].sort(),supplied:source?integer(source.qty_supplied):null,suppliedAt:stamps['supplied/'+a.key+'/'+item]||'',baseline};
}
function receiptDateIssue1006(row,asAt){
 const evidence=row.receiptEvidence1006||{},toDay=at=>{const n=Date.parse(at);return Number.isFinite(n)?new Date(n+36000000).toISOString().slice(0,10):'';};
 const onDays=[...new Set((evidence.on||[]).map(toDay).filter(d=>d&&d<=asAt))],suppliedDay=toDay(evidence.suppliedAt);
 return evidence.itemOnly&&!(evidence.baseline||[]).length&&evidence.supplied!=null&&suppliedDay&&suppliedDay<=asAt&&onDays.length>1&&onDays.some(d=>d<suppliedDay)?'Delivered quantity is recorded; earlier partial receipt quantities are unavailable, so delivery-day totals need review.':'';
}
function receiptParts1006(row,asAt){
 const evidence=row.receiptEvidence1006||{},toDay=at=>{const n=Date.parse(at);return Number.isFinite(n)?new Date(n+36000000).toISOString().slice(0,10):'';};
 const total=integer(row.received);if(!total||total<0||receiptDateIssue1006(row,asAt))return [];
 const out=[],add=(at,count,basis)=>{const day=toDay(at);if(!day||day>asAt||count<=0)return;out.push({date:day,count,basis,at});};
 let used=0;
 for(const old of (evidence.baseline||[]).slice().sort((a,b)=>a.at.localeCompare(b.at))){const n=Math.min(total-used,Math.max(0,integer(old.quantity)||0));add(old.at,n,old.basis);if(out.length)used=out.reduce((n,p)=>n+p.count,0);}
 const suppliedDay=toDay(evidence.suppliedAt),ons=(evidence.on||[]).filter(at=>toDay(at)&&toDay(at)<=asAt).sort();
 if(used<total){
  if(evidence.supplied!==null&&evidence.supplied!==undefined&&suppliedDay&&suppliedDay<=asAt&&Number(evidence.supplied)>=total)add(evidence.suppliedAt,total-used,'Dated item receipt');
  else if(ons.length){const later=used?ons.filter(at=>toDay(at)>out[out.length-1].date):ons;if(later.length)add(later[0],total-used,'Recorded on site');}
 }
 const byDate=new Map();for(const part of out){if(!byDate.has(part.date))byDate.set(part.date,{...part});else byDate.get(part.date).count+=part.count;}
 return [...byDate.values()].map(part=>({...row,receipts1006:undefined,receiptEvidence1006:undefined,...part,receivedToday:part.count,actualReceipt1006:true,remaining:0,numbers:row.received===part.count&&row.numbers.length===part.count?row.numbers:[],recordedNumbers:(row.numbers||[]).slice()}));
}
function receivedCapacity1006(rows){
 const out={};for(const row of rows)if(family(row.item)==='single')for(const part of row.receipts1006||[])out[part.date]=(out[part.date]||0)+part.count;return out;
}
