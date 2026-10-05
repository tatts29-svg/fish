/* Author: Andrew Fisher. Supplier run-sheet print requests use exact displayed native inbound references. */
function supplierPrint841Snapshot(load){
 const inbound=new Set();
 try{programmeDays().forEach(day=>(dpLoads(day)||[]).forEach(group=>{if(group&&group.kind==='deliveries')(group.rows||[]).forEach(row=>{const key=row&&row.a&&row.a.key;if(key)inbound.add(key);});}));}catch(e){return Object.freeze([]);}
 const refs=new Set();
 (load.stops||[]).forEach(stop=>(stop.drops||[]).forEach(drop=>{const key=drop&&drop.ref;if(typeof key!=='string'||!key||!inbound.has(key))return;const a=assetOf(key);if(a&&!a._cancelled&&!deliveryOf(key).moved)refs.add(key);}));
 return Object.freeze([...refs]);
}
function supplierPrint841Prepare(load,wrap){
 const request={token:timeline841PrintStart(),date:load.date,refs:supplierPrint841Snapshot(load),printing:false,afterprint:false,naturallyClosed:false,closed:false};
 supplierPrint841DismissNative();
 request.loads=Object.freeze([Object.freeze({kind:'deliveries',rows:Object.freeze(request.refs.map(key=>Object.freeze({a:Object.freeze({key})})))})]);
 wrap.__supplierPrint841=request;return request;
}
function supplierPrint841Dismiss(){
 if(document.body.classList.contains('ep819-printing'))ep819Close();
}
function supplierPrint841DismissNative(){
 const bar=document.getElementById('dpbar');if(bar)bar.remove();
 if(typeof DPBAR!=='undefined'){DPBAR.done=null;DPBAR.kind=null;DPBAR.iso=null;}
 document.querySelectorAll('#dayPage').forEach(e=>e.remove());
 document.querySelectorAll('.printask').forEach(e=>e.remove());
 const wrap=document.getElementById('dayprint');if(wrap){wrap.__timeline841print=null;wrap.classList.remove('dpwrap','ps7wrap');wrap.innerHTML='';}
 document.body.classList.remove('printing-day','pdf7-make','dpbar-on');document.body.style.removeProperty('--dpbar-height798');
}
function supplierPrint841Current(wrap,request){
 return !!request&&!request.closed&&timeline841PrintCurrent(request.token)&&document.getElementById('ep819print')===wrap&&wrap.__supplierPrint841===request&&epOpen819();
}
function supplierPrint841Close(){
 const wrap=document.getElementById('ep819print'),request=wrap&&wrap.__supplierPrint841;if(!request)return;
 if(request.printing&&request.afterprint&&timeline841PrintCurrent(request.token))request.naturallyClosed=true;
 else{request.closed=true;if(timeline841PrintCurrent(request.token))timeline841PrintStart();}
 wrap.__supplierPrint841=null;
}
function supplierPrint841After(wrap,request){
 if(!supplierPrint841Current(wrap,request))return;
 EPP819.after=null;request.afterprint=true;ep819Close();
}
function supplierPrint841Go(wrap,request){
 request=request||(wrap&&wrap.__supplierPrint841);if(!supplierPrint841Current(wrap,request)||request.printing)return [];
 if(EPP819.timer){clearTimeout(EPP819.timer);EPP819.timer=0;}
 request.printing=true;
 const valid=()=>timeline841PrintCurrent(request.token)&&!request.closed&&(supplierPrint841Current(wrap,request)||(request.printing&&request.afterprint&&request.naturallyClosed));
 try{return timeline841Printed(request.date,'drv',request.loads,[0],{},()=>window.print(),valid);}
 finally{request.printing=false;if(request.naturallyClosed){request.closed=true;if(timeline841PrintCurrent(request.token))timeline841PrintStart();}}
}
