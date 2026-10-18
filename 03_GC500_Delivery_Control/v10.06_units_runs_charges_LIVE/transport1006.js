/* Author: Andrew Fisher. Complete delivery/pickup charges for received equipment.
 * Existing contract charges count once; only uncovered card Revenue is split.
 * Carrier Direct costs, invoices and physical pickup records are unchanged. */
(function(root){'use strict';
 const cents=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
 function project(model,received){
  const coverage=new Map();
  for(const t of model.rows||[])for(const c of t.coverage||[]){if(!coverage.has(c.id))coverage.set(c.id,{amount:c.amount,quantity:0});coverage.get(c.id).quantity+=Number(c.quantity)||0;}
  const rows=(model.rows||[]).map(t=>{
   const n=Number(received[t.buildingId]),quantity=Number(t.quantity),arrived=Number.isFinite(n)&&n>0&&quantity>0?Math.min(quantity,n):0,ratio=quantity>0?arrived/quantity:0;
   const eligible=!['held','excluded','included'].includes(t.state),actualAdditional=eligible?cents((Number(t.additional)||0)*ratio):0;
   let actualCovered=0;
   if(eligible)for(const c of t.coverage||[]){const all=coverage.get(c.id);if(all&&Number.isFinite(all.amount)&&all.quantity>0)actualCovered+=all.amount*(Number(c.quantity)||0)/all.quantity*ratio;}
   return {...t,receivedQuantity1006:arrived,receivedRatio1006:ratio,actualAdditional1006:actualAdditional,remainingAdditional1006:cents((Number(t.additional)||0)-actualAdditional),actualCovered1006:cents(actualCovered)};
  });
  const byBranch=(model.byBranch||[]).map(b=>({...b,actualAdditional1006:cents(rows.filter(r=>r.branch===b.branch).reduce((n,r)=>n+r.actualAdditional1006,0)),remainingAdditional1006:cents(rows.filter(r=>r.branch===b.branch).reduce((n,r)=>n+r.remainingAdditional1006,0))}));
  return {...model,rows,byBranch,actualAdditional1006:cents(rows.reduce((n,r)=>n+r.actualAdditional1006,0)),remainingAdditional1006:cents(rows.reduce((n,r)=>n+r.remainingAdditional1006,0))};
 }
 function itemRows(model,ref,item){return (model.rows||[]).filter(r=>r.ref===ref&&String(r.item).trim().toLowerCase()===String(item).trim().toLowerCase()).map(r=>({...r,quantity:r.receivedQuantity1006,additional:r.actualAdditional1006,coveredQuantity:(Number(r.coveredQuantity)||0)*r.receivedRatio1006,uncoveredQuantity:(Number(r.uncoveredQuantity)||0)*r.receivedRatio1006,coverage:(r.coverage||[]).map(c=>({...c,quantity:c.quantity*r.receivedRatio1006}))}));}
 const api={project,itemRows,cents};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.OnsiteTransport1006=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined'){
 const transportBefore1006=buildingTransportModel831;
 buildingTransportModel831=function(){return heldMemo('transport1006',()=>{
  const original=transportBefore1006(),received={},assets=new Map(allAssets().map(a=>[a.key,a]));
  for(const row of original.rows){if(Object.prototype.hasOwnProperty.call(received,row.buildingId))continue;const a=assets.get(row.ref);if(!a||a._cancelled||a.rest_of||movedAway(a.key)){received[row.buildingId]=0;continue;}const l=chargeLines(a).find(l=>l.item===row.item);received[row.buildingId]=l?receivedChargeQty1006(a,l):0;}
  return OnsiteTransport1006.project(original,received);
 });};
 const branchBefore1006=pl752Rows;
 pl752Rows=function(){const rows=branchBefore1006.apply(this,arguments).map(b=>({...b}));for(const part of buildingTransportModel831().byBranch){if(!part.actualAdditional1006)continue;let b=rows.find(b=>b.code===part.branch);if(!b){b={code:part.branch,lines:0,contract:0,card:0,cardLines:0,none:0,decided:0,transport:0,rehire:0,subLines:0,suppliers:[],rehireLines:0,rehireUnits:0,rehireCharge:0,rehireCoatesNos:0,rehireUnrated:0,plantLines:0,plantCharge:0,plantUnrated:0,plantWhat:[],total:0};rows.push(b);}b.transport=OnsiteTransport1006.cents(b.transport+part.actualAdditional1006);b.total=OnsiteTransport1006.cents(b.total+part.actualAdditional1006);b.transportArrived1006=part.actualAdditional1006;}return rows.sort((a,b)=>b.total-a.total);};
 window.onsiteTransportRows1006=function(a,item){return holdAssets(()=>OnsiteTransport1006.itemRows(buildingTransportModel831(),a.key,item));};
 transportRowsHtml977=function(a,item){return holdAssets(()=>{
  const rows=onsiteTransportRows1006(a,item);
  if(!rows.length)return '<tr data-transport-item977-empty><td colspan="4">Transport · rate / allocation pending</td></tr>';
  return rows.map(r=>{
   const included=r.quantity>0&&!['held','excluded'].includes(r.state),label=r.leg==='delivery'?'Delivery':'Pickup';
   const total=r.state==='held'?'Rate / allocation pending':r.state==='included'?'Included':r.state==='excluded'?'Not applicable':money(OnsiteTransport1006.cents(r.actualCovered1006+r.actualAdditional1006));
   const basis=[r.rateSource,...r.reasons,...r.coverage.map(c=>'Contract '+c.id+' · '+fmtNum(c.quantity)+' received units'+(c.sharedCharge?' · allocated share':'')+(c.basis?' · '+c.basis:''))].filter(Boolean);
   return '<tr data-transport-item977="'+esc(r.id)+'" data-transport-included1006="'+included+'"><td>'+label+'<small style="display:block;font-size:10px">Transport · received scope</small></td><td>'+esc(r.state==='included'?'Included':r.state==='excluded'?'—':r.coveredQuantity?'Contract / card':r.rate==null?'Rate pending':chargeRateDisplay977(r.rate))+'</td><td>'+esc(fmtNum(r.quantity))+'</td><td>'+esc(total)+'</td></tr>'+(basis.length?'<tr data-transport-item977-source><td colspan="4"><details class="units925-edit"><summary>'+label+' · more info</summary>'+basis.map(s=>'<p>'+esc(s)+'</p>').join('')+'</details></td></tr>':'');
  }).join('');
 });};
}
