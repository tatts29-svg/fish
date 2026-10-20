// Author: Andrew Fisher. Native planned scope correction explicitly requested: six additional FWF.
'use strict';
const source=`
const clone=x=>JSON.parse(JSON.stringify(x)),canonical=x=>fencePaperCanonical898(x);
function capture(){return holdAssets(()=>{
 const a=assetOf('WC09'),s=Supplier996.model(),money=moneySummary(),pl=pl770Model();
 return clone({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
  items:toiletRows962(a,deliveryOf('WC09'),chargeLines(a),todayIso()),
  units:gcModel925(a).rows.filter(u=>u.physical).map(u=>({item:u.item,owner:u.owner,no:u.assetNo})),
  charges:arrivedChargeRows975(a),receipts:s.receipts.filter(r=>r.ref==='WC09').map(r=>({item:r.item,date:r.date,count:r.count})),
  remaining:s.remaining.filter(r=>r.ref==='WC09'),supplierPending:s.remaining.map(r=>({date:r.date,ref:r.ref,item:r.item,qty:r.remaining})),supplierRows:s.rows.length,finder:finderIndex().length,
  programme:programmeDays().flatMap(d=>dpLoads(d).filter(g=>g._supplier996&&!g._supplier996.actualReceipt1006).flatMap(g=>g._supplier996.stops.map(r=>({date:d.iso,ref:r.ref,item:r.item,qty:r.count??r.remaining})))),
  map:gc500MapStatus1009(['WC09']),inventory:inventory().list.filter(r=>r.refs.WC09).map(r=>({item:r.item,...r.refs.WC09})),
  today:todayWorkMetrics840().find(r=>r.id==='toilets'),financial:{money,pl,branches:branchFinancial978(pl752Rows(),money)},
  rates:[S.rates,S.lineRates,S.accRates,ONHIRE_ROWS],version:SYNC.backend.readVersion821()});
 });}
function preflight(spec){
 if(canonical(spec)!==canonical({ref:'WC09',from:4,to:10}))throw Error('Only authorised WC09 four-to-ten update is permitted');
 const a=assetOf(spec.ref),items=toiletRows962(a,deliveryOf(spec.ref),chargeLines(a),todayIso());
 if(canonical(items.rows.map(r=>[r.item,r.quantity,r.arrived,r.done]))!==canonical([['FWF',4,4,4],['Pee Panel',6,6,6],['Toilet Block 6m',2,2,2]]))throw Error('Existing WC09 scope changed; review before editing');
 const assets=gcModel925(a).rows.filter(u=>u.physical&&u.item==='FWF').map(u=>u.assetNo).sort();
 if(canonical(assets)!==canonical(['0085','0450','0551','0585']))throw Error('Existing WC09 identities changed');
}
`;
const prepare=new Function('return function(spec){'+source+'preflight(spec);const record=capture();return {spec,before:record.docs,record};}')();
const apply=new Function('return function(plan){'+source+`
 preflight(plan.spec);
 if(canonical(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))!==canonical(plan.before))throw Error('Record changed before native staging');
 if(!setQty(plan.spec.ref,String(plan.spec.to)))throw Error('Native quantity control refused the value');
 const record=capture();return clone({before:plan.before,after:record.docs,record,queue:SYNC.queue});
}`)();
const read=new Function('return function(){'+source+'return capture();}')();
const canon=x=>JSON.stringify((function sort(v){return Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v})(x));
function verify(staged,plan){
 const same=(a,b)=>canon(a)===canon(b),checks={},r=staged.record,b=plan.record,changed=[];
 for(const c of new Set([...Object.keys(plan.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(plan.before[c]||{}),...Object.keys(staged.after[c]||{})]))if(!same(plan.before[c]?.[id]??null,staged.after[c]?.[id]??null))changed.push(c+'/'+id);
 const only=new Set(['qtys/WC09','stamps/qtys~2f~WC09','by/qtys~2f~WC09']);
 checks['exact quantity and audit documents only']=changed.length===3&&changed.every(k=>only.has(k));
 checks['ten planned four received four installed']=same(r.items.rows.map(x=>[x.item,x.quantity,x.arrived,x.done]),[['FWF',10,4,4],['Pee Panel',6,6,6],['Toilet Block 6m',2,2,2]]);
 checks['only six FWF outstanding']=r.remaining.length===1&&r.remaining[0].item==='FWF'&&r.remaining[0].remaining===6;
 checks['original receipts and dates retained']=same(r.receipts,b.receipts);
 checks['identities and suppliers retained']=same(r.units,b.units)&&r.supplierRows===b.supplierRows&&r.finder===b.finder;
 const actual=rows=>rows.map(x=>({ref:x.ref,item:x.item,arrived:x.arrived,total:x.total,charges:x.charges.map(c=>({key:c.key,rate:c.rate,qty:c.qty,value:c.value,completedQty:c.completedQty}))}));
 checks['existing actual charges retained']=same(actual(r.charges),actual(b.charges));
 checks['all actual monetary totals retained']=Math.round(r.financial.money.charge.total*100)===Math.round(b.financial.money.charge.total*100);
 checks['rates unchanged']=same(r.rates,b.rates);
 checks['P&L and branch totals reconcile']=Object.values(r.financial.pl.checks).every(Boolean)&&Object.values(r.financial.branches.checks).every(Boolean);
 const sums=rows=>{const m={};for(const x of rows){const k=[x.date,x.ref,x.item].join('|');m[k]=(m[k]||0)+x.qty;}return m;};
 checks['every pending Build run matches supplier']=same(sums(r.programme),sums(r.supplierPending));
 const days={};for(const x of r.programme.filter(x=>x.item==='FWF'))days[x.date]=(days[x.date]||0)+x.qty;
 checks['24 FWF per day maximum']=Object.values(days).every(n=>n<=24);
 const map=r.map.states[0];checks['map reflects quantity and incomplete scope']=map.state==='partial'&&same(map.quantity.items.map(x=>[x.item,x.quantity,x.installed]),[['FWF',10,4],['Pee Panel',6,6],['Toilet Block 6m',2,2]]);
 checks['Inventory agrees']=r.inventory.find(x=>x.item==='FWF').asked===10&&r.inventory.find(x=>x.item==='FWF').on===4;
 checks['Today adds six planned only']=r.today.total===b.today.total+6&&r.today.done===b.today.done&&Math.abs(r.today.pct-r.today.done/r.today.total*100)<1e-9;
 const q=staged.after.qtys.WC09;checks['receipt baseline and value travel atomically']=q.v===10&&q.scope1017.items[0].received===4&&q.scope1017.items[0].installed===4;
 checks['named audit author']=staged.after.by['qtys~2f~WC09'].v==='Andrew Fisher via Codex';
 return {pass:Object.values(checks).every(Boolean),checks,changed};
}
module.exports={prepare,apply,read,verify};
