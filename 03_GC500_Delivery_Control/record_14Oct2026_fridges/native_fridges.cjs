/* Author: Andrew Fisher. Authorised fridge placements through native page controls. */
'use strict';
const source=`
const spec={day:'2026-10-14',from:'P46',to:'P54',move:'1328957',replacement:'1272751',arrival:'T0265',numbers:['1318501','1260164','1283996','1311992'],container:{ref:'T0266',number:'920584',item:'6.0m Refrigerator Cont',owner:'United Rentals (Royal Wolf)',day:'2026-10-13'}};
const clone=x=>JSON.parse(JSON.stringify(x));
function capture(){return holdAssets(()=>{
 const billing=onsiteComplete979(),money=moneySummary(),pnl=pl770Model(),contract=contractFigures(ONHIRE_ROWS);
 return clone({today:todayIso(),containerArrivalDays:['2026-10-13','2026-10-14'].filter(day=>arrivalsOn(day).some(r=>r.a.key==='T0266')),containerPrevious:deliveryAsOf('T0266','2026-10-13'),docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),
 refs:['P46','P54','T0265','T0266'].map(ref=>{const a=assetOf(ref),t=assetTotal(a);return {ref,accessories:a.accessories,takenOff:a._accessoriesTakenOff,accessoriesSubtotal:t.accessories,accessoriesKnown:t.accessories_known,units:gcModel925(a,{loading:false}).rows,lines:chargeLines(a).map(l=>({item:l.item,discipline:l.discipline,quantity:qtyOf(l)})),delivery:deliveryOf(ref),dates:effectiveDates(a),bill:billing.rows.filter(r=>r.ref===ref),branch:branchOf(ref)?.code};}),
 physical:allAssets().filter(a=>!a._cancelled&&!movedAway(a.key)).flatMap(a=>(a.accessories||[]).filter(x=>x.asset_no).map(x=>({ref:a.key,asset:x.asset_no,type:x.type}))),
 financial:{onsiteKnown:billing.known,onsiteBranches:billing.byBranch,money:money.charge,pnl:{revNow:pnl.revNow,revJob:pnl.revJob,direct:pnl.direct,directJob:pnl.directJob,rev:pnl.rev},contract:{charge:contract.charge,lines:contract.lines,charge_lines:contract.charge_lines}},
 supplier:Supplier996.model().summary,
 daily:dpLoads(programmeDays().find(d=>d.iso===spec.day)).filter(l=>l.rows?.some(r=>r.a.key===spec.arrival))
 });
});}
function preflight(){
 if(todayIso()!==spec.day)throw Error('Wrong AEST arrival date');
 const from=assetOf(spec.from),to=assetOf(spec.to),task=assetOf(spec.arrival);
 const source=(from.accessories||[]).filter(x=>x.type==='Fridge'&&x.asset_no===spec.move);
 if(source.length!==1||source[0].qty!==1||!source[0]._added)throw Error('Source fridge changed');
 if((to.accessories||[]).some(x=>x.type==='Fridge'))throw Error('Destination already has a fridge');
 if(chargeLines(task).length!==1||chargeLines(task)[0].item!=='Fridge'||qtyOf(chargeLines(task)[0])!==4)throw Error('T0265 scope changed');
 if(gcModel925(task,{loading:false}).rows.some(u=>u.physical))throw Error('T0265 has already identified units');
 const container=assetOf(spec.container.ref),cl=chargeLines(container);
 if(cl.length!==1||cl[0].item!==spec.container.item||qtyOf(cl[0])!==1||gcModel925(container,{loading:false}).rows.some(u=>u.physical))throw Error('T0266 scope or identity changed');
 const numbers=new Set([spec.move,spec.replacement,...spec.numbers,spec.container.number]);
 for(const a of allAssets()){
  if(a._cancelled||movedAway(a.key))continue;
  for(const x of a.accessories||[])if(numbers.has(String(x.asset_no))&&!(a.key===spec.from&&x.asset_no===spec.move))throw Error('Existing accessory number '+x.asset_no+' at '+a.key);
  for(const u of gcModel925(a,{loading:false}).rows)if(u.physical&&numbers.has(u.assetNo))throw Error('Existing identified number '+u.assetNo+' at '+a.key);
 }
 return source[0];
}
function attach(ref,number,description){
 openAsset(ref);
 const type=document.getElementById('accType'),qty=document.getElementById('accQty'),no=document.getElementById('accNo'),desc=document.getElementById('accDesc'),save=document.getElementById('accAdd');
 if(!type||!qty||!no||!desc||!save||save.disabled)throw Error('Native accessory form unavailable');
 type.value='Fridge';if(type.value!=='Fridge')throw Error('Fridge type not offered');qty.value='1';no.value=number;desc.value=description;
 save.click();
 const matches=assetOf(ref).accessories.filter(x=>x.asset_no===number&&x.type==='Fridge');if(matches.length!==1)throw Error('Native attachment did not save');
 return matches[0];
}
`;
const prepare=new Function('return function(){'+source+'const fridge=preflight(),record=capture();return {before:record.docs,expected:record,fridge,spec};}')();
const apply=new Function('return function(plan){'+source+`
 const fridge=preflight(),before=capture();if(fencePaperCanonical898(before.docs)!==fencePaperCanonical898(plan.before))throw Error('Concurrent record change');
 openAsset(spec.from);
 const remove=[...document.querySelectorAll('#drawer [data-accoff]')].find(b=>b.dataset.accoff===fridge._accId);if(!remove)throw Error('Native take-off control unavailable');remove.click();
 if(assetOf(spec.from).accessories.some(x=>x.asset_no===spec.move))throw Error('Source fridge remained active');
 const moved=attach(spec.to,spec.move,'Moved from P46 on 14 Oct 2026; same fridge, not an additional hire.'),replacement=attach(spec.from,spec.replacement,'Replacement fridge confirmed on site by Andrew Fisher, 14 Oct 2026.');
 const actions=[];
 for(const no of spec.numbers){const r=unit925Save(spec.arrival,{item:'Fridge',owner:'coates',assetNo:no,label:'Fridge',branch:'',note:'Arrived and complete, confirmed by Andrew Fisher on 14 Oct 2026.',sourceKey:''},'','null','');if(!r.ok||r.kept===false)throw Error(r.reason);actions.push({asset:no,key:r.key,ref:spec.arrival,owner:'coates',item:'Fridge'});}
 if(setSupplied(spec.arrival,'Fridge',{supplied:'Fridge',qty_supplied:4})===false||!setDate(spec.arrival,spec.day,'in')||!setDone(spec.arrival,true))throw Error('T0265 receipt/completion failed');
 const c=spec.container,cu=unit925Save(c.ref,{item:c.item,owner:c.owner,assetNo:c.number,label:'Refrigerated container',branch:'',note:'Arrived 13 Oct 2026, exact time not supplied. Confirmed complete by Andrew Fisher on 14 Oct. Supplier corroborated by Baseplan SuperCars (2), contract 9974042 line 2 / ROY002.',sourceKey:''},'','null','');
 if(!cu.ok||cu.kept===false)throw Error(cu.reason);
 actions.push({asset:c.number,key:cu.key,ref:c.ref,owner:S.loads[cu.key].owner,item:c.item});
 if(setSupplied(c.ref,c.item,{supplied:c.item,qty_supplied:1})===false||!setDate(c.ref,c.day,'in')||!setDone(c.ref,true))throw Error('T0266 receipt/completion failed');
 setDeliveryNote(c.ref,'Arrived 13 Oct 2026; exact arrival time not supplied. Asset 920584, subhired from United Rentals (Royal Wolf). Arrival date confirmed by Andrew Fisher on 14 Oct; the date-boundary timestamp represents the day only.');
 // Import the current native snapshot with only the user-confirmed historical arrival corrected.
 // The validated legacy schema requires a full ISO stamp; midnight represents a known day, not an observed time.
 const records=clone(S),d=records.delivery[c.ref],recordedAt=d.set_at,effectiveAt='2026-10-12T14:00:00.000Z';
 if(d.state!=='on site'||d.history.filter(h=>h.state==='on site').length!==1)throw Error('Unexpected container arrival history');
 d.set_at=effectiveAt;d.recorded_at=recordedAt;d.date_only=true;d.effective_date=c.day;
 d.history=d.history.map(h=>h.state==='on site'?{...h,at:effectiveAt,recorded_at:recordedAt,date_only:true,effective_date:c.day,note:'Arrival date confirmed; exact time not supplied.'}:h);
 const historicalProblems=validateRecords({delivery:{[c.ref]:clone(d)}}).filter(x=>!x.startsWith('note: '));if(historicalProblems.length)throw Error('Invalid historical arrival: '+historicalProblems.join('; '));
 if(!applyImport({records},'replace','Andrew Fisher: T0266 actual arrival 13 Oct 2026'))throw Error('Native historical-arrival correction failed');
 const after=capture();return {before:before.docs,after:after.docs,record:after,queue:clone(SYNC.queue),actions,moved,replacement,removedId:'acc/'+spec.from+'/'+fridge._accId};
}`)();
function verify(staged,plan){
 const canonical=v=>JSON.stringify((function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;})(v));
 const same=(a,b)=>canonical(a)===canonical(b),cents=x=>Math.round(Number(x)*100),record=staged.record;
 const ref=k=>record.refs.find(x=>x.ref===k),old=k=>plan.expected.refs.find(x=>x.ref===k),checks={};
 checks['one moved fridge only P54']=same(record.physical.filter(x=>x.asset==='1328957').map(x=>x.ref),['P54']);
 checks['one replacement fridge only P46']=same(record.physical.filter(x=>x.asset==='1272751').map(x=>x.ref),['P46']);
 checks['source history retained']=ref('P46').takenOff.some(x=>x.asset_no==='1328957'&&x.added_at===plan.fridge.added_at);
 for(const k of ['P46','P54']){
  checks[k+' other contents unchanged']=same(ref(k).accessories.filter(x=>x.type!=='Fridge'),old(k).accessories.filter(x=>x.type!=='Fridge'));
  checks[k+' building status and dates unchanged']=same(ref(k).delivery,old(k).delivery)&&same(ref(k).dates,old(k).dates);
 }
 checks['P46 one flat fridge charge retained']=cents(ref('P46').accessoriesSubtotal)===cents(old('P46').accessoriesSubtotal);
 checks['P54 exactly one flat fridge charge']=cents(ref('P54').accessoriesSubtotal)-cents(old('P54').accessoriesSubtotal)===4684;
 const task=ref('T0265'),units=task.units.filter(u=>u.physical);
 checks['four exact T0265 identities']=same(units.map(u=>u.assetNo).sort(),plan.spec.numbers.slice().sort())&&units.every(u=>u.owner==='coates'&&u.item==='Fridge');
 checks['T0265 existing four-fridge scope']=same(task.lines,old('T0265').lines)&&task.accessories.length===0;
 checks['T0265 dated complete']=task.delivery.done===true&&task.delivery.state==='on site'&&task.dates.in===plan.spec.day;
 checks['T0265 unknown offhire preserved']=task.dates.out===old('T0265').dates.out;
 checks['T0265 on today Build']=record.daily.some(l=>l.rows.some(r=>r.a.key==='T0265'));
 const container=ref('T0266'),cUnits=container.units.filter(u=>u.physical),c=plan.spec.container;
 checks['one exact subhired container']=cUnits.length===1&&cUnits[0].assetNo===c.number&&cUnits[0].owner==='other:united-rentals-royal-wolf';
 checks['container existing single scope']=same(container.lines,old('T0266').lines)&&container.accessories.length===0;
 checks['container complete and onsite']=container.delivery.done===true&&container.delivery.state==='on site';
 checks['container arrived yesterday once']=same(record.containerArrivalDays,[c.day])&&record.containerPrevious.state==='on site'&&container.dates.in===c.day;
 checks['container unknown time explicit']=staged.after.delivery.T0266.date_only===true&&staged.after.delivery.T0266.effective_date===c.day&&staged.after.delivery.T0266.recorded_at!==staged.after.delivery.T0266.set_at;
 checks['container unknown offhire unchanged']=container.dates.out===old('T0266').dates.out;
 checks['supplier receipts unchanged']=same(record.supplier,plan.expected.supplier);
 checks['source contract financials unchanged']=same(record.financial.contract,plan.expected.financial.contract);
 checks['direct costs unchanged']=same(record.financial.pnl.direct,plan.expected.financial.pnl.direct)&&same(record.financial.pnl.directJob,plan.expected.financial.pnl.directJob);
 const actionKeys=new Set(staged.actions.map(a=>a.key)),allowedTombs=new Set([staged.removedId,'back/acc/P54/'+staged.moved._accId,'back/acc/P46/'+staged.replacement._accId]);
 for(const coll of new Set([...Object.keys(staged.before),...Object.keys(staged.after)]))for(const id of new Set([...Object.keys(staged.before[coll]||{}),...Object.keys(staged.after[coll]||{})])){
  const a=staged.before[coll]?.[id],b=staged.after[coll]?.[id];if(same(a,b))continue;const k=b?._k||a?._k||id;
  const allowed=coll==='accessories'?['P46','P54'].includes(k):
   coll==='loads'?staged.actions.some(a=>a.key===k&&b.ref===a.ref&&b.owner===a.owner&&b.item===a.item):
   ['delivery','supplied'].includes(coll)?['T0265','T0266'].includes(k):
   coll==='deleted'?allowedTombs.has(k):
   ['stamps','by'].includes(coll)?[...actionKeys].some(key=>k==='loads/'+key)||['supplied/T0265/Fridge','supplied/T0266/6.0m Refrigerator Cont','dnote/T0266'].includes(k)||[...allowedTombs].some(t=>k==='deleted/'+t):false;
  checks['targeted '+coll+'/'+id]=allowed;
 }
 return {author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks,financialBefore:plan.expected.financial,financialAfter:record.financial};
}
const read=new Function('return function(){'+source+'return capture();}')();
module.exports={prepare,apply,verify,read};
