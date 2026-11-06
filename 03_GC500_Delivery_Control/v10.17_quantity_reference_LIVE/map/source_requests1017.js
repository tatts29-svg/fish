/* Author: Andrew Fisher. Supplier source requests retain quantities without claiming receipt. */
function sourceRequestFields1017(row){
 if(!row||row._supplier996MapRequest!==true)return {};
 return {sourceRequest1017:true,sourceKey1017:String(row.key||''),requestItem1017:String(row.item||''),
  requestQuantity1017:typeof row.quantity==='number'&&Number.isFinite(row.quantity)&&row.quantity>=0?row.quantity:null,
  requestDate1017:String(row.requestDate||''),planState1017:String(row.planState1017||'unavailable'),
  plannedDeliveries1017:(row.plannedDeliveries1017||[]).filter(p=>p&&typeof p.date==='string'&&Number.isFinite(p.quantity)&&p.quantity>0).map(p=>({date:p.date,quantity:p.quantity}))};
}
function sourceRequestStatus1017(it){
 const r=it&&it.reg;if(!r||r.sourceRequest1017!==true)return null;
 const quantity={items:[{item:r.requestItem1017,quantity:r.requestQuantity1017,completed:null,installed:null}]};
 return Object.assign(statusModel1009({state:'unknown',label:'No delivery record',quantity},true),
  {label:'Source request',detail:'Source schedule only; no delivery record'});
}
function sourceRequestCard1017(it){
 const r=it&&it.reg;if(!r||r.sourceRequest1017!==true)return '';
 const status=sourceRequestStatus1017(it),quantity=status.quantity1010.all.join(' · ');
 const date=d=>/^\d{4}-\d{2}-\d{2}$/.test(d)?d.slice(8)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(d.slice(5,7))-1]+' '+d.slice(0,4):d;
 const plan=(r.plannedDeliveries1017||[]).map(p=>'<div class="xc-s">Planned delivery · '+esc(p.quantity+' × '+r.requestItem1017)+' · '+esc(date(p.date)||'date to confirm')+'</div>').join('')||'<div class="xc-s">'+(r.planState1017==='none'?'No outstanding supplier delivery allocation.':'Planned delivery date to confirm.')+'</div>';
 return '<div class="xc-s">'+esc(r.ownership||'SUB-HIRED')+'</div>'+
  plan+
  (r.location?'<div class="xc-s">'+esc(r.location)+'</div>':'')+
  '<div class="xc-s">No delivery record. No exact position on the master plan yet.</div>'+
  '<details class="xc-s map-source1017"><summary>More info</summary><div>Source schedule request'+(quantity?' · '+esc(quantity):'')+(r.requestDate1017?' · originally requested '+esc(date(r.requestDate1017)):'')+'</div>'+
  (r.drawing?'<div>'+esc(r.drawing)+'</div>':'')+'</details>';
}
