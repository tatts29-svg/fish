/* Author: Andrew Fisher. Customer forecast charges; completion and supplier costs remain independent. */
(function(root){
'use strict';
const keys=new Set(['install','levelling','steps','cleaning','demob']);
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
function cleanForecast(slots,recorded){
 const groups=new Map();
 for(const s of slots||[]){if(s.key!=='cleaning')continue;const k=JSON.stringify([s.ref,s.disc,s.item,s.key]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s);}
 let priced=0;const missing=[];
 for(const [k,g] of groups){if(g.some(s=>!Number.isFinite(s.rate)||!Number.isFinite(s.qty))){missing.push(k);continue;}priced+=cents(g[0].rate*g.reduce((n,s)=>n+s.qty,0));}
 priced=cents(priced);recorded=cents(Number(recorded)||0);const job=Math.max(priced,recorded);
 return {priced,recorded,job,remaining:cents(job-recorded),missing};
}
function rows(asset,lines,slots,arrivals,exclusions){
 const out=[];
 for(const l of lines||[]){const arrived=Number(arrivals[l.item]||0);if(!(arrived>0))continue;
 const selected=(slots||[]).filter(s=>s.ref===asset.key&&s.disc===l.discipline&&s.item===l.item&&keys.has(s.key));
 const grouped=new Map();for(const s of selected){if(!grouped.has(s.key))grouped.set(s.key,[]);grouped.get(s.key).push(s);}
 const charges=[];
 for(const [key,g] of grouped){const qty=g.reduce((n,s)=>n+(Number(s.qty)||0),0),rate=g[0].rate;
 const ex=exclusions&&exclusions[l.item],excluded=typeof ex==='object'?ex.arrived:ex||0;
 const n=key==='steps'&&excluded===null?null:key==='steps'?Math.min(qty,Math.max(0,arrived-Number(excluded))):Math.min(arrived,qty),value=n!=null&&Number.isFinite(rate)?cents(rate*n):null;
 charges.push({key,name:g[0].line,rate,qty:n,value,orderedQty:qty,orderedValue:g.some(s=>s.value==null)?null:cents(g.reduce((n,s)=>n+s.value,0)),completedQty:Math.min(n,g.filter(s=>s.state==='charged').reduce((n,s)=>n+(Number(s.qty)||0),0))});}
 out.push({ref:asset.key,item:l.item,arrived,ordered:l.quantity,charges,total:charges.some(c=>c.value==null)?null:cents(charges.reduce((n,c)=>n+c.value,0))});
 }
 return out;
}
const api={keys,cents,cleanForecast,rows};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ArrivalCharges975=api;
})(typeof window!=='undefined'?window:null);
/* Shared live-model inputs use the Inventory's receipt rules, including confirmed partial toilet arrivals. */
function arrivedChargeRows975(a){
 return holdAssets(()=>{
 const slots=labourPlan().slots,td=todayIso(),on=invOnSite(a,td),irs=on?itemRows(a):[],arrivals={},exclusions={};
 for(const l of chargeLines(a)){const ir=irs.find(i=>i.asked===l.item),q=ir&&ir.qty_supplied!=null&&String(ir.qty_supplied).trim()!==''&&Number.isFinite(Number(ir.qty_supplied))?Number(ir.qty_supplied):null;
 arrivals[l.item]=toiletArrival962(a,l.item,td,on?(q!=null?q+restArrived(a,l.item):qtyOf(l)||0):0);
 const excluded=typeof Stairs975!=='undefined'?Stairs975.quantity(a,l):0,units=labourUnits(a,l.item);
 exclusions[l.item]=excluded&&units.length&&arrivals[l.item]<qtyOf(l)?{arrived:null,total:excluded}:excluded;}
 return ArrivalCharges975.rows(a,chargeLines(a),slots,arrivals,exclusions);
 });
}
function cleaningRevenue975(){return heldMemo('cleaningRevenue975',()=>holdAssets(()=>ArrivalCharges975.cleanForecast(labourPlan().slots,pl760Ticks().cleaning.amount)));}
function stairsChargeQty975(a,l,unit,n){return Math.max(0,n-(typeof Stairs975!=='undefined'?Stairs975.quantity(a,l,unit):0));}
function applyStairsMoney975(a,l,m){
 if(!m||!a||typeof Stairs975==='undefined'||!Stairs975.quantity(a,l))return m;
 const out=Object.assign({},m),parts=[];
 const project=(lines,unit,n)=>(lines||[]).flatMap(x=>{if(x.fire914)return [x];const count=x.key==='steps'?stairsChargeQty975(a,l,unit,n):n;if(!(count>0))return [];const line=Object.assign({},x,{chargeQty975:count});parts.push({key:x.key,rate:x.rate||0,n:count});return [line];});
 if(m.perBuilding){const us=(m.units||[]).map(p=>p.unit),rest=labourRestN(a,l.item,us);out.units=(m.units||[]).map(p=>Object.assign({},p,{ticked:project(p.ticked,p.unit,p.unit===LAB_REST?rest:1)}));out.ticked=out.units.flatMap(p=>p.ticked).concat((m.ticked||[]).filter(x=>x.fire914));}
 else out.ticked=project(m.ticked,null,m.qty||qtyOf(l)||0);
 if(m.total!=null)out.total=labourCents865(parts)+(m.fire914&&m.fire914.amount||0);
 out.stairsExcluded975=Stairs975.quantity(a,l);return out;
}
function arrivedChargesHtml975(a){
 if(!a||a._cancelled||a.rest_of)return '';
 const rows=arrivedChargeRows975(a);if(!rows.length)return '';
 const esc975=esc,price=v=>v==null?'Rate to confirm':money(v);
 return '<section class="notice charges952" data-charges952="'+esc975(a.key)+'"><b>Customer charges · arrived equipment</b><p>Forecast · AUD ex GST</p>'+rows.map(r=>'<details class="units925-edit"><summary>'+esc975(r.item)+' × '+r.arrived+' · '+esc975(r.total==null?'Allocation to confirm':price(r.total))+'</summary><div style="overflow-x:auto"><table><thead><tr><th>Charge</th><th>Rate</th><th>Qty</th><th>Forecast</th></tr></thead><tbody>'+r.charges.map(c=>'<tr><td>'+esc975(c.name)+'</td><td>'+esc975(price(c.rate))+'</td><td>'+(c.qty==null?'Allocation to confirm':c.qty)+'</td><td>'+esc975(c.qty==null?'Stairs allocation to confirm':price(c.value))+'</td></tr>').join('')+'</tbody></table></div><p>Ordered quantity '+esc975(String(r.ordered))+' · '+Math.max(0,Number(r.ordered||0)-r.arrived)+' still to arrive</p>'+(()=>{const l=chargeLines(a).find(l=>l.item===r.item);if(!l||!r.charges.some(c=>c.key==='steps')||typeof Stairs975==='undefined')return '';const us=labourUnits(a,l.item);return (us.length?us:[null]).map(u=>'<div>'+ (u?'<b>'+esc975(u===LAB_REST?'Unnumbered remainder':u)+'</b>':'')+Stairs975.controls(a,l,u)+'</div>').join('');})()+'</details>').join('')+'</section>';
}
