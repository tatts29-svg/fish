/* Author: Andrew Fisher. Arrived scope valued as a complete customer package; not an invoice or task completion. */
(function(root){'use strict';
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
function project(items,transport){
 const coverage=new Map(),usedHire=new Map(),rows=[],holds=[];
 for(const t of transport||[])for(const c of t.coverage||[]){if(!coverage.has(c.id))coverage.set(c.id,{amount:c.amount,quantity:0});coverage.get(c.id).quantity+=Number(c.quantity)||0;}
 for(const i of items||[]){if(!(i.arrived>0))continue;let hire=0,work=0,cartage=0,unallocated=i.arrived;const pending=[];
 for(const l of i.hire||[]){if(!Number.isFinite(l.amount)||!(l.quantity>0)){pending.push('Hire');continue;}const remaining=Math.max(0,l.quantity-(usedHire.get(l.id)||0)),q=Math.min(unallocated,remaining);unallocated-=q;hire+=l.amount*q/l.quantity;usedHire.set(l.id,(usedHire.get(l.id)||0)+q);}
 if(i.hire?.length&&unallocated>0)pending.push('Hire quantity');
 if(!i.hire?.length){if(Number.isFinite(i.fallbackHire))hire=i.fallbackHire;else pending.push('Hire');}
 for(const c of i.work||[]){if(Number.isFinite(c.value))work+=c.value;else pending.push(c.name||c.key);}
 for(const t of (transport||[]).filter(t=>t.ref===i.ref&&t.item===i.item)){
 if(t.state==='held'){pending.push(t.leg==='pickup'?'Pickup':'Delivery');continue;}if(['included','excluded'].includes(t.state))continue;
 const ratio=t.quantity>0?Math.min(1,i.arrived/t.quantity):0;cartage+=(Number(t.additional)||0)*ratio;
 for(const c of t.coverage||[]){const all=coverage.get(c.id);if(!all||!Number.isFinite(all.amount)||!(all.quantity>0)){pending.push(t.leg==='pickup'?'Pickup':'Delivery');continue;}cartage+=all.amount*(Number(c.quantity)||0)/all.quantity*ratio;}
 }
 const row={ref:i.ref,item:i.item,branch:i.branch,arrived:i.arrived,hire:cents(hire),work:cents(work),transport:cents(cartage),total:cents(cents(hire)+cents(work)+cents(cartage)),pending:[...new Set(pending)]};rows.push(row);holds.push(...row.pending.map(charge=>({ref:i.ref,item:i.item,charge})));
 }
 const branches=new Map();for(const r of rows){if(!branches.has(r.branch))branches.set(r.branch,{branch:r.branch,hire:0,work:0,transport:0,total:0,holds:0});const b=branches.get(r.branch);for(const k of ['hire','work','transport','total'])b[k]+=r[k];b.holds+=r.pending.length;}
 const byBranch=[...branches.values()].map(b=>({...b,hire:cents(b.hire),work:cents(b.work),transport:cents(b.transport),total:cents(b.total)}));return {rows,byBranch,holds,known:cents(rows.reduce((n,r)=>n+r.total,0)),total:holds.length?null:cents(rows.reduce((n,r)=>n+r.total,0)),complete:holds.length===0};
}
const api={project};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.OnsiteComplete979=api;
})(typeof window!=='undefined'?window:null);
function onsiteComplete979(){return heldMemo('onsiteComplete979',()=>holdAssets(()=>{
 const items=[];for(const a of allAssets()){if(a._cancelled||a.rest_of)continue;const projected=assetTotal(a).lines||[];for(const r of arrivedChargeRows975(a)){
 const card=cardRate(a.discipline,r.item,a.key),hire=ItemCharges979.project(a.key,r.item,ItemIdentity979.select(a.key,r.item,ONHIRE_ROWS,gcModel925(a).rows),contractCharge,card.labour_per_piece,[]),fallback=projected.find(l=>l.item===r.item),fallbackHire=fallback&&Number.isFinite(fallback.total)&&fallback.qty>0?fallback.total*Math.min(1,r.arrived/fallback.qty):null;
 items.push({ref:a.key,item:r.item,branch:branchOf(a.key).code,arrived:r.arrived,hire:hire.lines,work:r.charges,fallbackHire});}
 if(invOnSite(a,todayIso())){const seenAccessory=new Set();for(const x of a.accessories||[]){const number=String(x.asset_no||'').trim();if(number&&seenAccessory.has(number))continue;if(number)seenAccessory.add(number);
 const matches=number?ItemIdentity979.select(a.key,x.type,ONHIRE_ROWS,[{physical:true,item:x.type,owner:'Coates',assetNo:number}]).filter(l=>l.asset_no_is_plant_number&&String(l.asset_no)===number):[],existing=new Set(items.flatMap(i=>i.hire||[]).map(l=>l.id)),hire=matches.map(l=>({id:l.rental_contract+'|'+l.line,quantity:Number(l.quantity),amount:contractCharge(l).amount})).filter(l=>!existing.has(l.id));if(matches.length&&!hire.length)continue;
 const q=Number(x.qty)||1,rate=accRateFor(x.type),amount=lineMoney(rate,q,chargeSpanOf(a).days);items.push({ref:a.key,item:'Accessory · '+x.type,branch:branchOf(a.key).code,arrived:q,hire,work:[],fallbackHire:Number.isFinite(amount)?amount:null});}}}
 const model=OnsiteComplete979.project(items,cj764Model().buildingTransport.rows),waiver=pl770Model().rev.find(r=>String(r.code)==='1015');
 if(model.rows.some(r=>r.hire>0)&&waiver&&waiver.now==null&&waiver.job==null){model.holds.push({ref:'Job',item:'Damage waiver',charge:'Rate / scope'});model.total=null;model.complete=false;}
 return model;
}));}
function onsiteCompleteHtml979(){const m=onsiteComplete979(),price=n=>esc(money(n));return '<section class="notice nofold nosfold" data-onsite979><b>Actual onsite equipment · complete billing value'+(m.complete?'':' · priced subtotal')+'</b><small style="display:block">AUD ex GST · charges to V8 Supercars</small><h3>'+price(m.known)+'</h3><div class="branch978-desktop tblwrap"><table class="pl-tbl"><thead><tr><th>Branch</th><th>Hire</th><th>Work</th><th>Delivery / pickup</th><th>Total</th></tr></thead><tbody>'+m.byBranch.map(r=>'<tr><td>'+esc(r.branch)+'</td>'+[r.hire,r.work,r.transport,r.total].map(n=>'<td class="num">'+price(n)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><div class="branch978-mobile">'+m.byBranch.map(r=>'<article class="card nosfold"><b>'+esc(r.branch)+'</b><dl><dt>Hire</dt><dd>'+price(r.hire)+'</dd><dt>Work</dt><dd>'+price(r.work)+'</dd><dt>Delivery / pickup</dt><dd>'+price(r.transport)+'</dd><dt>Priced total</dt><dd>'+price(r.total)+'</dd></dl></article>').join('')+'</div><span class="chip '+(m.complete?'ok':'warn')+'">'+(m.complete?'All applicable rates linked':m.holds.length+' rate / allocation holds')+'</span><details><summary>More info</summary><p>Arrived equipment only. Includes applicable hire and complete install, levelling, stairs, cleaning, demob, delivery and pickup charges. Invoices and physical work status remain separate.</p>'+m.holds.map(r=>'<p>'+esc(r.ref+' · '+r.item+' · '+r.charge)+'</p>').join('')+'</details></section>';}

function onsiteItemSummary979(ref,item){const r=onsiteComplete979().rows.find(r=>r.ref===ref&&r.item===item);return r?money(r.total)+(r.pending.length?' · '+r.pending.length+' holds':''):'Allocation pending';}
