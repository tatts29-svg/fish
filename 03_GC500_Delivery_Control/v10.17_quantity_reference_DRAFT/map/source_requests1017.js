/* Author: Andrew Fisher. Supplier source requests retain quantities without claiming receipt. */
function sourceRequestFields1017(row){
 if(!row||row._supplier996MapRequest!==true)return {};
 return {sourceRequest1017:true,sourceKey1017:String(row.key||''),requestItem1017:String(row.item||''),
  requestQuantity1017:typeof row.quantity==='number'&&Number.isFinite(row.quantity)&&row.quantity>=0?row.quantity:null,
  requestDate1017:String(row.requestDate||'')};
}
function sourceRequestStatus1017(it){
 const r=it&&it.reg;if(!r||r.sourceRequest1017!==true)return null;
 const quantity={items:[{item:r.requestItem1017,quantity:r.requestQuantity1017,completed:null,installed:null}]};
 return Object.assign(statusModel1009({state:'unknown',label:'No delivery record',quantity},true),
  {label:'Source request',detail:'Source schedule only; no delivery record'});
}
function sourceRequestCard1017(it){
 const r=it&&it.reg;if(!r||r.sourceRequest1017!==true)return '';
 const status=sourceRequestStatus1017(it),quantity=status.quantity1010.all.join(' · '),d=r.requestDate1017;
 const date=/^\d{4}-\d{2}-\d{2}$/.test(d)?d.slice(8)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(d.slice(5,7))-1]+' '+d.slice(0,4):d;
 return '<div class="xc-s">'+esc(r.ownership||'SUB-HIRED')+'</div>'+
  '<div class="xc-s">Source schedule request'+(quantity?' · '+esc(quantity):'')+(date?' · requested '+esc(date):'')+'</div>'+
  (r.location?'<div class="xc-s">'+esc(r.location)+'</div>':'')+
  (r.drawing?'<div class="xc-s">'+esc(r.drawing)+'</div>':'')+
  '<div class="xc-s">No delivery record. No exact position on the master plan yet.</div>';
}
