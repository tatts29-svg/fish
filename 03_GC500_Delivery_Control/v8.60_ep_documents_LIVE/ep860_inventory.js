/* Author: Andrew Fisher. Read-only supplier inventory from the same unit identities as Equipment.
 * Supplier plans and quote allocations are context, never evidence of an asset's arrival or identity. */
function epInventory860(){
 const build=()=>{
  const text=v=>String(v==null?'':v).trim(), norm=v=>text(v).toLowerCase().replace(/\s+/g,' ').replace(/ australia$/,''), isEP=v=>norm(v)==='event portables';
  const noKey=v=>text(v).toUpperCase(), rows=[], groups=new Map(), refs=new Map();
  const asAt=todayIso(), assets=allAssets(); assets.forEach(a=>{if(a&&a.key)refs.set(a.key,a);});
  // Keep a supplier unit visible even if its reference is absent from the active schedule.
  if(typeof S!=='undefined')Object.keys(S.units||{}).forEach(k=>{if(!refs.has(k))refs.set(k,null);});
  if(typeof CROW!=='undefined'&&CROW&&typeof CROW.forEach==='function')CROW.forEach((v,k)=>{if(v&&v.units&&!refs.has(k))refs.set(k,null);});
  const explicitQty=v=>v!=null&&text(v)!==''&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
  const scope=a=>(a?chargeLines(a):[]).filter(l=>l&&l.item).map(l=>({item:text(l.item),qty:explicitQty(qtyOf(l))}));
  const description=(a,u,subs)=>{
   if(!a)return 'Event Portables unit';
   const ls=scope(a), itemMap=typeof itemNumbersOf==='function'?itemNumbersOf(a):null;
   const exact=itemMap?Object.keys(itemMap).filter(k=>(itemMap[k]||[]).some(n=>noKey(n)===noKey(u.asset_no)&&noKey(n))):[];
   if(exact.length===1)return exact[0];
   const itemNames=[...new Set(ls.map(l=>l.item))]; if(itemNames.length===1)return itemNames[0];
   const supplied=typeof itemRows==='function'?itemRows(a):[];
   // A mixed reference has a usable type only when every supplied count is explicit,
   // exactly one type was supplied, and its count equals the supplier units recorded.
   if(supplied.length&&supplied.every(r=>explicitQty(r.qty_supplied)!=null)){
    const positive=supplied.filter(r=>Number(r.qty_supplied)>0);
    if(positive.length===1&&Number(positive[0].qty_supplied)===subs.length)return text(positive[0].supplied||positive[0].asked)||'Event Portables unit';
   }
   return itemNames.length?'Type not linked to this fleet number · reference includes '+itemNames.join(' + '):'Event Portables unit';
  };
  const place=a=>{
   if(!a)return{location:'Reference not in active schedule',url:'',locationBasis:'Location unconfirmed',warning:'Check the recorded reference before dispatch.'};
   const w=whereText(a)||{}, d=dest782(a), words=[text(w.main),d&&d.kind==='master'?text(w.also):''].filter(Boolean), location=words.join(' · ')||'Location not confirmed';
   if(!d||!d.ll||!Number.isFinite(d.ll.lat)||!Number.isFinite(d.ll.lon))return{location,url:'',locationBasis:'Location unconfirmed',warning:'Exact location is not recorded.'};
   if(d.kind==='report')return{location,url:'',locationBasis:'Exact location unconfirmed',warning:'Pit lane is the reporting point; it is not a confirmed asset location.'};
   const basis={master:'Master plan reference position',confirmed:'Confirmed reference position',pinned:'Recorded site pin',placed:'Map position — check on site',unverified:'Drawing position — check on site',area:'Area only — exact location unconfirmed',desc:d.approx?'Description position — approximate':'Location from description'};
   const reliable=['master','confirmed','pinned'].includes(d.kind);
   return{location:location+'\n'+d.ll.lat.toFixed(6)+', '+d.ll.lon.toFixed(6),url:navUrl(d.ll),locationBasis:basis[d.kind]||'Reference position — check on site',warning:reliable?'':'Check the precise asset location on site.'};
  };
  const add=row=>{
   if(!row.assetNo){rows.push(row);return;}
   const key=noKey(row.assetNo), list=groups.get(key)||[];list.push(row);groups.set(key,list);
  };
  refs.forEach((a,key)=>{
   const all=subOf(key)||[], subs=all.filter(s=>isEP(s.co)), whole=a&&isEP(subhireCo(key));if(!subs.length&&!whole)return;
   const d=a?deliveryView(a):null, pos=place(a), status=a&&a._cancelled?'Cancelled reference — unit still recorded':d?d.short:'Reference needs review';
   const seen=new Set();subs.forEach((s,i)=>{
    const u=s.u||{}, number=text(s.no||u.asset_no);if(number&&seen.has(noKey(number)))return;if(number)seen.add(noKey(number));
    add({id:number?'ep:number:'+noKey(number):'ep:unnumbered:'+key+':'+i,ref:key,assetNo:number,description:description(a,u,all),...pos,status,qty:1,warning:[pos.warning,a&&a._cancelled?'Do not dispatch against a cancelled reference.':'',!number?'Supplier fleet number has not been recorded.':''].filter(Boolean).join(' '),_on:!!(a&&!a._cancelled&&invOnSite(a,asAt)),_spare:false});
   });
   // Whole-location supplier ownership does not establish a quantity received.
   // Show an unresolved scope only when there are no recorded supplier units.
   if(whole&&!subs.length){const ls=scope(a);rows.push({id:'ep:scope:'+key,ref:key,assetNo:'',description:ls.map(l=>l.item+(l.qty!=null?' ×'+l.qty+' planned':'')).join(' + ')||'Event Portables scope',...pos,status:'Supplier scope — units not individually recorded',qty:null,warning:'Supplier ownership is recorded; fleet numbers and received quantity need confirmation.',_on:false,_spare:false,_scope:true});}
  });
  spareList().filter(s=>isEP(s.co)).forEach(s=>add({id:s.no?'ep:number:'+noKey(s.no):'ep:spare:'+s.id,ref:'Spare — unallocated',assetNo:text(s.no),description:invTypeWord(s.type)||'Event Portables unit',location:text(s.note)||'Spare location not recorded',status:'On site — spare',qty:1,url:'',locationBasis:'Recorded spare location — no exact pin',warning:'No matched reference or exact location pin is recorded.',_on:true,_spare:true}));
  let conflicts=0;
  groups.forEach((list,key)=>{
   const claims=new Map();list.forEach(r=>claims.set(r._spare?JSON.stringify([r.ref,r.location]):r.ref,r));const unique=[...claims.values()];
   if(unique.length===1){rows.push(unique[0]);return;}conflicts++;
   rows.push({id:'ep:number:'+key,ref:unique.map(r=>r.ref).join(' / '),assetNo:unique[0].assetNo,description:[...new Set(unique.map(r=>r.description))].join(' / '),location:unique.map(r=>r.ref+': '+r.location).join(' | '),status:'Location conflict — check record',qty:1,url:'',locationBasis:'More than one recorded location',warning:'This fleet number is recorded at more than one location. Counted once; no location has been chosen.',_on:false,_spare:false,_conflict:true});
  });
  rows.sort((a,b)=>(a._spare-b._spare)||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.assetNo.localeCompare(b.assetNo,undefined,{numeric:true})||a.id.localeCompare(b.id));
  const summary={units:rows.filter(r=>r.qty===1).length,numbered:rows.filter(r=>r.assetNo).length,unnumbered:rows.filter(r=>r.qty===1&&!r.assetNo).length,onSite:rows.filter(r=>r.qty===1&&r._on).length,atReferences:rows.filter(r=>r.qty===1&&r._on&&!r._spare).length,spares:rows.filter(r=>r.qty===1&&r._spare).length,references:new Set(rows.filter(r=>!r._spare&&!r._conflict&&r.ref).map(r=>r.ref)).size,scopeGaps:rows.filter(r=>r._scope).length,locationConflicts:conflicts};
  if(typeof EP819!=='undefined'&&EP819){const q=EP819.quote||{};summary.planning={label:'Supplier plan allocation — not additional inventory',prepared:text(EP819.prepared),quote:text(q.quote),note:'These are quantities in the supplier plan. They are not fleet numbers or proof of arrival; do not add them to the inventory above.',unallocated:(q.rows||[]).filter(r=>Number(r.no_wc_allocation)>0).map(r=>({description:text(r.item),qty:Number(r.no_wc_allocation),status:'No WC allocation in supplier plan',note:text(r.note)}))};}
  return{rows:rows.map(({_on,_spare,_scope,_conflict,...r})=>r),summary,asAt};
 };
 return typeof holdAssets==='function'?holdAssets(build):build();
}
