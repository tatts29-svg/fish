/* Author: Andrew Fisher. One receipt and remaining-delivery projection for Build, Today and supplier sheets. */
(function(){
'use strict';
const S996=Supplier996,base=dpLoads,baseId=ldId,baseOpen=ldIsOpen,baseBasis=dpBasisShort;
function residualDay(d,M){const scope=new Set(M.rows.map(r=>r.ref+'|'+r.item));return {...d,deliveries:(d.deliveries||[]).map(r=>({...r,events:(r.events||[]).filter(e=>!scope.has(r.a.key+'|'+e.item))})).filter(r=>r.events.length)};}
function asNative(L,day){
 const groups=new Map();for(const stop of L.stops){const a=assetOf(stop.ref)||S996.requestAsset(stop.ref);if(!a)continue;if(!groups.has(stop.ref))groups.set(stop.ref,{a:{...a,asset_numbers:[],_bookingNumbers801:[],accessories:[],_supplier996:true},events:[],_supplier996:true});const row=groups.get(stop.ref);row.a._bookingNumbers801.push(...stop.numbers);row.events.push({task_id:'supplier996:'+stop.ref+':'+stop.item+(L.actualReceipt1006?':received':''),date:day,movement:L.actualReceipt1006?'place':'install',item:stop.item,quantity_raw:stop.count,quantity_display:String(stop.count),carrier:'Event Portables',actualReceipt1006:!!L.actualReceipt1006,note:L.actualReceipt1006?'Recorded received':stop.identityPending?'Exact fleet numbers for this load are not allocated.':''});}
 return {kind:'deliveries',rows:[...groups.values()],time:null,timeRaw:'',carrier:'Event Portables',basis:'supplier996',_supplier996:L};
}
function receiptLoads(day){return S996.model().receipts.filter(r=>r.date===day).map((r,i)=>({n:i+1,mode:'received',type:S996.family(r.item)==='single'?'portable':'recorded',panels:0,units:r.count,stops:[r],actualReceipt1006:true,proposed:false,id:'received:'+JSON.stringify([day,r.ref,r.item,r.count]),capacity:'Recorded receipt · truck allocation not supplied'}));}
const daysBefore=programmeDays;
programmeDays=function(){
 const M=S996.model(),days=daysBefore.apply(this,arguments);
 for(const d of days)d.deliveries=residualDay(d,M).deliveries;
 const parts=M.receipts.concat(M.remaining.filter(r=>r.date&&r.date>=todayIso()));
 for(const r of parts){if(!r.date)continue;let d=days.find(d=>d.iso===r.date);if(!d){d={iso:r.date,deliveries:[],removals:[],loads:[],unref:[],notes:[],cancelled:[]};days.push(d);}const a=assetOf(r.ref)||S996.requestAsset(r.ref);if(!a)continue;let row=d.deliveries.find(x=>x.a.key===a.key);if(!row){row={a,events:[]};d.deliveries.push(row);}const count=r.actualReceipt1006?r.count:r.remaining;row.events.push({task_id:'supplier996:'+r.ref+':'+r.item+(r.actualReceipt1006?':received':''),date:r.date,phase:'Build',item:r.item,quantity_raw:count,quantity_display:String(count),movement:'place',carrier:'Event Portables',actualReceipt1006:!!r.actualReceipt1006,supplierRequest996:r.sourceRequest?.id||null});}
 return days.sort((a,b)=>a.iso.localeCompare(b.iso));
};
dpLoads=function(d){if(!d)return base.apply(this,arguments);const M=S996.model(),other=base(residualDay(d,M));return other.concat(receiptLoads(d.iso).map(L=>asNative(L,d.iso)),d.iso>=todayIso()?S996.inboundLoads(d.iso).map(L=>asNative(L,d.iso)):[]);};
ldId=function(d,g){return g._supplier996?d.iso+'|'+g.kind+'|supplier996:'+g._supplier996.id:baseId.apply(this,arguments);};
ldIsOpen=function(d,g){return g._supplier996?state.tlLoad===ldId(d,g):baseOpen.apply(this,arguments);};
dpBasisShort=function(g){return g._supplier996?(g._supplier996.actualReceipt1006?'Received · ':'Proposed load '+g._supplier996.n+' · ')+S996.loadText(g._supplier996):baseBasis.apply(this,arguments);};
const oldReceipt=toiletDeliveryEntry962;
toiletDeliveryEntry962=function(row,day){const events=row?.events||[];if(events.length&&events.every(e=>e.actualReceipt1006&&e.date<=day))return true;return oldReceipt.apply(this,arguments);};
const oldLine=timeline846Line;
timeline846Line=function(d,g){const html=oldLine.apply(this,arguments);return g?._supplier996?.actualReceipt1006?html.replace('<em>Load</em>','<em>Received</em>').replace(/<span class="ld-n"><em>Received<\/em><b>\d+<\/b>/,'<span class="ld-n"><em>Received</em><b>'+g._supplier996.units+'</b>'):html;};
const oldBlock=dayBlock;
dayBlock=function(d){let html=oldBlock.apply(this,arguments);const M=S996.model(),received=M.receipts.filter(r=>r.date===d.iso&&S996.family(r.item)==='single').reduce((n,r)=>n+r.count,0),pending=M.remaining.filter(r=>r.date===d.iso&&S996.family(r.item)==='single').reduce((n,r)=>n+r.remaining,0);if(received||pending){const facts='<div class="supplier996-facts" data-receipts1006><span><b>'+received+'</b> portaloos received</span><span><b>'+pending+'</b> remaining</span><span><b>24</b> daily capacity</span></div>';html=html.replace(/(<div class="dayblock[^>]*>)/,'$1'+facts);}return html;};
Object.assign(S996,{residualDay,asNative,receiptLoads});
})();
