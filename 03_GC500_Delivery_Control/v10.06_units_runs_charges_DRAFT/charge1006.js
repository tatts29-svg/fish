/* Author: Andrew Fisher. Arrival includes the complete applicable customer charge;
 * physical work, invoices and supplier Direct costs remain separate records. */
(function(root){'use strict';
 const automatic=new Set(['install','levelling','demob','cleaning']);
 const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
 function project({ordered,received,lines,recorded,relocation}){
  const arrived=Number.isFinite(received)?Math.max(0,received):0,rows=[];
  for(const line of lines||[]){
   if(line.money!=='rate'||relocation&&line.key==='demob')continue;
   const written=recorded?.[line.key],manual=written===null?null:Number.isFinite(written)?Math.max(0,written):0,auto=automatic.has(line.key);
   const qty=manual===null&&!(auto&&arrived>0)?null:auto?Math.max(arrived,manual||0):manual;
   const planned=auto?ordered:line.key==='steps'?manual:ordered;
   const forecastQty=Number.isFinite(planned)&&qty!==null?Math.max(planned,qty):null;
   rows.push({...line,qty,recordedQty:manual,automatic:auto&&arrived>0,remainingQty:forecastQty==null?null:Math.max(0,forecastQty-qty),forecastQty,value:qty==null||!Number.isFinite(line.rate)?null:cents(line.rate*qty),forecastValue:forecastQty==null||!Number.isFinite(line.rate)?null:cents(line.rate*forecastQty)});
  }
  return {arrived,ordered,rows,total:rows.some(r=>r.qty===null||r.qty>0&&r.value==null)?null:cents(rows.reduce((n,r)=>n+(r.value||0),0))};
 }
 const api={project,automatic,cents};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.OnsiteCharges1006=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined'){
 const manualMoney1006=labourMoney914base;
 function received1006(a,l){
  const td=todayIso(),on=invOnSite(a,td),r=on?itemRows(a).find(i=>i.asked===l.item):null;
  const q=r&&r.qty_supplied!=null&&String(r.qty_supplied).trim()!==''&&Number.isFinite(Number(r.qty_supplied))?Number(r.qty_supplied):null;
  return CurrentStock996.received(a,l.item,td,toiletArrival962(a,l.item,td,on?(q!=null?q+restArrived(a,l.item):qtyOf(l)||0):0));
 }
 function recorded1006(a,l,m){
  const out={},add=(x,n)=>{n=x.chargeQty975??n;if(!Number.isFinite(n)){out[x.key]=null;return;}if(out[x.key]!==null)out[x.key]=(out[x.key]||0)+Math.max(0,n);};
  if(m.perBuilding){const units=(m.units||[]).map(x=>x.unit),rest=labourRestN(a,l.item,units);for(const row of m.units||[])for(const x of row.ticked||[])add(x,row.unit===LAB_REST?rest:1);}
  else for(const x of m.ticked||[])add(x,x.fire914?x.n:m.qty??qtyOf(l));
  return out;
 }
 function charge1006(a,l){return heldMemo('charge1006/'+a.key+'/'+l.discipline+'/'+l.item,()=>{
  const manual=manualMoney1006(a.key,l,a.key,a),info=labourLinesFor(a.key,l.discipline,l.item,a.key,undefined,a);
  return OnsiteCharges1006.project({ordered:qtyOf(l),received:received1006(a,l),lines:info.lines,recorded:recorded1006(a,l,manual),relocation:!!a.relocation});
 });}
 window.charge1006=charge1006;
 window.receivedChargeQty1006=received1006;
 labourMoney914base=function(ref,l,key,asset){
  const a=asset||assetOf(ref);if(!a||a._cancelled||a.rest_of||movedAway(ref))return manualMoney1006.apply(this,arguments);
  const p=charge1006(a,l),info=labourLinesFor(ref,l.discipline,l.item,key,undefined,a);
  const ticked=p.rows.filter(r=>r.qty===null||r.qty>0).map(r=>({...r,ticked:true,chargeQty975:r.qty,recordedQty1006:r.recordedQty,automaticCharge1006:r.automatic}));
  return {total:p.total,ticked,info,blocked:p.total==null,why:p.total==null?'Charge rate or quantity to confirm':null,qty:qtyOf(l),units:[],perBuilding:false,chargeInclusion1006:true};
 };
 labourPlan=function(){
  if(RENDER_MEMO.has('labourPlan'))return RENDER_MEMO.get('labourPlan');
  const slots=[],seen=new Set();
  for(const a of FinanceRequest996.assets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key))){
   const branch=branchOf(a.key)?.code||'',fire=fire914Of(a);
   if(fire?.host)slots.push({ref:a.key,branch,item:fire.host.item,disc:fire.host.discipline,line:'Fire extinguisher',key:'fire_ext',unit:null,rate:fire.rate,qty:fire.n,value:fire.amount,state:'charged',by:fire.last.by,at:fire.last.at,fire914:true});
   for(const l of chargeLines(a)){
    const identity=JSON.stringify([a.key,l.discipline,l.item]);if(seen.has(identity))continue;seen.add(identity);
    for(const r of charge1006(a,l).rows){
     if(fire?.host&&r.key==='fire_ext')continue;
     const common={ref:a.key,branch,item:l.item,disc:l.discipline,line:r.name,key:r.key,unit:null,rate:r.rate,by:r.by,at:r.at,chargeInclusion1006:true,recordedQty1006:r.recordedQty};
     if(r.qty===null||r.qty>0)slots.push({...common,qty:r.qty,value:r.value,state:'charged',automaticCharge1006:r.automatic});
     if(r.qty!==null&&(r.remainingQty==null||r.remainingQty>0))slots.push({...common,qty:r.remainingQty,value:r.forecastValue==null||r.value==null?null:OnsiteCharges1006.cents(r.forecastValue-r.value),state:'tocome'});
    }
   }
  }
  const zero=()=>({charged:0,expected:0,tocome:0,later:0,n:{charged:0,expected:0,tocome:0,later:0},unpriced:0});
  const add=(o,s)=>{if(s.fire914&&s.value==null){o.toConfirm=(o.toConfirm||0)+(s.qty||0);return;}if(s.value==null){o.unpriced++;return;}o[s.state]+=s.value;o.n[s.state]++;};
  const all=zero(),byLine=new Map(),byBranch=new Map();
  for(const s of slots){add(all,s);if(!byLine.has(s.line))byLine.set(s.line,zero());add(byLine.get(s.line),s);if(!byBranch.has(s.branch))byBranch.set(s.branch,zero());add(byBranch.get(s.branch),s);}
  for(const o of [all,...byLine.values(),...byBranch.values()])for(const k of ['charged','expected','tocome','later'])o[k]=OnsiteCharges1006.cents(o[k]);
  const result={slots,all,byLine,byBranch,chargeInclusion1006:true};RENDER_MEMO.set('labourPlan',result);return result;
 };
 labourRevenue858=function(){return heldMemo('labourRevenue858',()=>holdAssets(()=>{
  const keys=new Set(['install','steps','levelling','demob']),sums={install:0,steps:0,levelling:0,demob:0},missing=[];
  for(const s of labourPlan().slots.filter(s=>keys.has(s.key))){if(s.value==null)missing.push(JSON.stringify([s.ref,s.disc,s.item,s.key]));else sums[s.key]+=s.value;}
  for(const key of keys)sums[key]=OnsiteCharges1006.cents(sums[key]);
  const recorded=pl760Ticks().install.amount,priced=OnsiteCharges1006.cents(Object.values(sums).reduce((n,v)=>n+v,0)),job=Math.max(priced,recorded);
  return {sums,priced,recorded,job,remaining:OnsiteCharges1006.cents(job-recorded),missing:[...new Set(missing)]};
 }));};
 arrivedChargeRows975=function(a){return holdAssets(()=>chargeLines(a).flatMap(l=>{
  const p=charge1006(a,l);if(!(p.arrived>0))return [];
  const charges=p.rows.filter(r=>ArrivalCharges975.keys.has(r.key)).map(r=>{const qty=r.qty==null?null:Math.min(p.arrived,r.qty);return {key:r.key,name:r.name,rate:r.rate,qty,value:qty==null||!Number.isFinite(r.rate)?null:OnsiteCharges1006.cents(r.rate*qty),orderedQty:r.forecastQty,orderedValue:r.forecastValue,completedQty:Math.min(qty,r.recordedQty),automaticCharge1006:r.automatic};});
  return [{ref:a.key,item:l.item,arrived:p.arrived,ordered:l.quantity,charges,total:charges.some(c=>c.value==null)?null:OnsiteCharges1006.cents(charges.reduce((n,c)=>n+c.value,0))}];
 }));};
 // A charge tick includes a price. It never declares a future clean or demob complete.
 const oldTicks1006=labourTicksHtml;
 labourTicksHtml=function(a){
  if(!a||a._cancelled||a.rest_of||movedAway(a.key))return oldTicks1006.apply(this,arguments);
  return chargeLines(a).map(l=>{
   const p=charge1006(a,l),info=labourLinesFor(a.key,l.discipline,l.item,a.key,undefined,a),units=labourUnits(a,l.item);
   if(!info.lines.length)return '<div><b>'+esc(l.item)+'</b> · No separate work charge on the card</div>';
   const auto=p.rows.filter(r=>OnsiteCharges1006.automatic.has(r.key)).map(r=>'<label class="labtick" title="Charge included for received equipment; physical work status is recorded separately"><input type="checkbox" data-charge-auto1006="'+esc(r.key)+'" disabled'+(r.qty>0&&r.value!=null?' checked':'')+'>'+esc(r.name)+' <span class="w">'+esc(Number.isFinite(r.rate)?chargeRateDisplay977(r.rate):'Rate to confirm')+' · '+(r.qty==null?'Quantity to confirm':'× '+r.qty)+(r.qty>0&&r.value!=null?' · Included':r.qty===0?' · Awaiting arrival':' · To confirm')+'</span></label>').join('');
   const manual=info.lines.filter(r=>!OnsiteCharges1006.automatic.has(r.key)).map(r=>(units.length?units:[null]).map(unit=>{
    if(r.key==='steps')return '<div>'+(unit?'<b>'+esc(unit===LAB_REST?'Unnumbered remainder':unit)+'</b>':'')+Stairs975.controls(a,l,unit)+'</div>';
    const tick=labourTicked(a.key,l.discipline,l.item,r.key,unit,a);
    return '<label class="labtick"><input type="checkbox" data-lab="'+esc(labourKey(a.key,l.discipline,l.item,r.key,unit))+'"'+(tick?' checked':'')+(r.key==='fire_ext'&&fire914Qty(a.key)?' disabled':'')+'>'+esc(r.name)+(unit?' · '+esc(unit):'')+' <span class="w">'+esc(money(r.rate))+'</span></label>';
   }).join('')).join('');
   return '<div data-charge1006-ref="'+esc(a.key)+'"><b>'+esc(l.item)+'</b> · '+p.arrived+' received<div class="labticks">'+auto+manual+'</div><small>Charges included · '+esc(p.total==null?'Total to confirm':money(p.total)+' ex GST')+'</small></div>';
  }).join('');
 };
 const oldArrivedHtml1006=arrivedChargesHtml975;
 arrivedChargesHtml975=function(a){const html=oldArrivedHtml1006.apply(this,arguments),template=document.createElement('template');template.innerHTML=html;
  const rows=arrivedChargeRows975(a),details=[...template.content.querySelectorAll('[data-charges952] > details')];
  const mark=(cell,key,included)=>{const tick=document.createElement('input');tick.type='checkbox';tick.disabled=true;if(included)tick.setAttribute('checked','');tick.dataset.chargeIncluded1006=key;tick.setAttribute('aria-label',key+' charge '+(included?'included':'not selected'));cell.prepend(tick);};
  details.forEach((d,i)=>{const row=rows[i];if(!row)return;
   const card=cardRate(a.discipline,row.item,a.key),hire=ItemCharges979.project(a.key,row.item,ItemIdentity979.select(a.key,row.item,ONHIRE_ROWS,gcModel925(a).rows),contractCharge,card.labour_per_piece,[]);let hireIndex=0;
   const transport=typeof onsiteTransportRows1006==='function'?onsiteTransportRows1006(a,row.item):TransportItem977.rows(cj764Model().buildingTransport?.rows,a.key,row.item);
   for(const tr of d.querySelectorAll('tbody>tr')){const cell=tr.firstElementChild,c=row.charges.find(c=>cell?.textContent===c.name);if(c){mark(cell,c.key,c.qty>0&&c.value!=null);continue;}
    if(tr.hasAttribute('data-item979')&&tr.children.length===4){const name=cell.textContent;if(name.startsWith('Hire')){const line=hire.lines[hireIndex++],fallback=peeHireForecast979();mark(cell,'Hire',line?!line.ownUse&&(line.included||line.amount!=null):fallback.ref===a.key&&fallback.item===row.item&&fallback.amount>0);}else if(hire.included.some(x=>x.name===name))mark(cell,name,true);}
    const transportId=tr.getAttribute('data-transport-item977');if(transportId&&!tr.querySelector('input[type=checkbox]')){const line=transport.find(x=>x.id===transportId);if(line)mark(cell,line.leg==='delivery'?'Delivery':'Pickup',!['held','excluded'].includes(line.state)&&row.arrived>0);}
   }
  });
  return template.innerHTML;
 };
 // Stairs are opt-in, with earlier exclusions retained until the user adds them.
 Stairs975.controls=function(a,l,unit){
  const max=Stairs975.pieceQty(a,l,unit);if(max<1)return '';
  const excluded=Stairs975.quantity(a,l,unit),selected=labourTicked(a.key,l.discipline,l.item,'steps',unit,a),qty=selected?Math.max(0,max-excluded):0;
  const data=' data-stairs1006-ref="'+esc(a.key)+'" data-stairs1006-disc="'+esc(l.discipline)+'" data-stairs1006-item="'+esc(l.item)+'" data-stairs1006-unit="'+esc(unit||'')+'"';
  return '<span class="stairs975"'+data+' style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><label class="labtick"><input type="checkbox" data-stairs1006-select'+(qty>0?' checked':'')+(canEdit()?'':' disabled')+'>Stairs · '+(qty?'Selected × '+qty:'Not selected')+'</label>'+(max>1&&canEdit()?'<label class="w">Qty <input type="number" min="0" max="'+max+'" step="1" value="'+qty+'" data-stairs1006-qty aria-label="'+esc(a.key+' '+l.item+' stairs quantity')+'" style="width:5em"></label>':'')+(excluded?' <span class="w">Excluded × '+excluded+'</span>':'')+'</span>';
 };
 document.addEventListener('change',e=>{const field=e.target.closest?.('[data-stairs1006-qty]');if(!field)return;e.stopPropagation();const d=field.closest('.stairs975').dataset,a=assetOf(d.stairs1006Ref),l=a&&chargeLines(a).find(l=>l.discipline===d.stairs1006Disc&&l.item===d.stairs1006Item);if(!l)return;const q=Number(field.value),max=Stairs975.pieceQty(a,l,d.stairs1006Unit);if(!Number.isSafeInteger(q)||q<0||q>max){flash('Choose a stairs quantity from 0 to '+max+'.');return;}Stairs975.save(a.key,l.discipline,l.item,d.stairs1006Unit,max-q);setLabour(a.key,l.discipline,l.item,'steps',q>0,d.stairs1006Unit||undefined);});
 document.addEventListener('change',e=>{const box=e.target.closest?.('[data-stairs1006-select]');if(!box)return;e.stopPropagation();const d=box.closest('.stairs975').dataset,a=assetOf(d.stairs1006Ref),l=a&&chargeLines(a).find(l=>l.discipline===d.stairs1006Disc&&l.item===d.stairs1006Item);if(!l)return;
  if(box.checked){const max=Stairs975.pieceQty(a,l,d.stairs1006Unit),excluded=Stairs975.quantity(a,l,d.stairs1006Unit);if(max===1&&excluded)Stairs975.save(a.key,l.discipline,l.item,d.stairs1006Unit,0);else if(max>1&&(excluded===0||excluded===max))Stairs975.save(a.key,l.discipline,l.item,d.stairs1006Unit,max-1);}
  setLabour(a.key,l.discipline,l.item,'steps',box.checked,d.stairs1006Unit||undefined);
 });
 // Keep the existing presentation; correct only the meaning of its financial headings.
 for(const entry of LAB_STATES){if(entry[0]==='charged'){entry[1]='Included';entry[2]='Customer charges included; physical work is recorded separately';}if(entry[0]==='tocome'){entry[1]='Remaining forecast';entry[2]='Charges for equipment still to arrive';}}
}
