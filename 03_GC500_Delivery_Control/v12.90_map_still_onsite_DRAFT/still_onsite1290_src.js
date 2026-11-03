/* Author: Andrew Fisher. v12.90: read-only collection filter, shared departure truth. */
function stillOnSite1290(){
 'use strict';
 if(window.GC500StillOnSite1290)return;
 const ORANGE='#ff821f', REVIEW='#ffaaa3', N=s=>String(s||'').toUpperCase().replace(/\s+/g,''), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let active=false,ready=false,entries=[],cachedItems=[],byCode=new Map(),signature='',saved=null,panel=null,three=null,bridgeHook=false,disposed=false;
 const key=it=>N(it?.reg?.sourceRequest1017?it.reg.sourceKey1017:it?.code);
 const eligible=r=>!!r?.arrival&&!r.complete&&(Number(r.remaining)>0||!!r.unknown||!!r.issues?.length);
 const wording=r=>r.review?'Review quantity':r.unknown?'Quantity to confirm':String(r.remaining)+' to collect';
 function read(){
  const H=parent.Departure1211;if(typeof H?.all!=='function')return null;
  // A loaded function is not proof that the shared record has finished loading.
  // Ask the existing read-model readiness gate without requesting asset states.
  try{if(parent.gc500MapStatus1009?.([])?.available!==true)return null;}catch(_){return null;}
  let native,boards;try{native=H.all();boards=parent.VmsEquipment1103?.model?.()?.boards||[];}catch(_){return null;}
  if(!Array.isArray(native)||!Array.isArray(boards))return null;
  const rows=native.filter(eligible), out=rows.map(r=>({key:String(r.key),remaining:Number.isFinite(r.remaining)?r.remaining:null,unknown:!!r.unknown,review:!!r.issues?.length,status:r.issues?.length?'review':r.unknown?'unknown':'remaining',label:r.label||'',partial:Number(r.collected)>0,codes:[],items:[],locationReview:false,onlyVms:Array.isArray(r.items)&&r.items.length>0&&r.items.every(i=>N(i.type)==='VMS')}));
  for(const r of out){const matching=ITEMS.filter(it=>key(it)===N(r.key)&&it.cat?.host==='trade');const list=matching.length?matching:ITEMS.filter(it=>N(it.code)===N(r.key));for(const it of list){r.codes.push(it.code);r.items.push(it);}}
  // VMS arrival counts are not collection counts. Only the native physical-board on-site projection is used.
  const adjusted=new Set(),seenBoards=new Set();
  for(const b of boards){
   if(b.on!==true||b.departure1211)continue;
   if(!b.key||seenBoards.has(N(b.key)))continue;seenBoards.add(N(b.key));
   let r=out.find(r=>N(r.key)===N(b.delivery))||out.find(r=>N(r.key)===N(b.key));
   if(!r){r={key:String(b.key),remaining:1,unknown:false,review:false,status:'remaining',label:'VMS board',partial:false,codes:[],items:[],vms:true,onlyVms:true,locationReview:false};out.push(r);}
   // A VMS-only delivery may have an aggregate unloading pin. The physical
   // register's current associations supply board positions; the aggregate pin
   // does not identify which board remains. Mixed deliveries retain other gear.
   if(r.onlyVms&&!adjusted.has(r)){r.codes=[];r.items=[];adjusted.add(r);}
   const positions=Array.isArray(b.positions)?b.positions:[];
   const plan=positions.length===1?parent.VMS1024?.board?.(positions[0].pos):null;
   const position=plan?parent.VMS1024?.position?.(plan):null;
   const authored=position&&Number.isFinite(position.lat)&&Number.isFinite(position.lon)&&position.by&&Number.isFinite(Date.parse(position.at));
   // Several associated positions can be construction/event locations of the
   // same board, not several boards. Never choose first/newest or highlight all.
   // Session/moving boards need an authored current pin rather than an old plan
   // placement. An unresolved position stays in the accessible reference list.
   if(!plan||(plan.moves_to||plan.session)&&!authored){r.locationReview=true;continue;}
   const alias=N(parent.VMS1024.label(plan)),matching=ITEMS.filter(it=>it.location1210?.kind==='vms'&&N(it.code)===alias&&it.places?.length);
   if(matching.length!==1){r.locationReview=true;continue;}
   const it=matching[0];if(!r.codes.includes(it.code)){r.codes.push(it.code);r.items.push(it);}
  }
  for(const r of out){r.mapped=r.items.some(it=>it.places?.length);r.code=r.codes[0]||r.key;}
  return out;
 }
 const row=it=>byCode.get(N(typeof it==='string'?it:it?.code))||null;
 const mappedItems=()=>cachedItems;
 const css=document.createElement('style');css.id='still-onsite1290-style';css.textContent=`
 .app{grid-template-rows:auto minmax(0,1fr)}body.framed header,header{flex-wrap:wrap;row-gap:0;padding-top:5px;padding-bottom:4px;min-height:54px;box-sizing:border-box}
 #still-onsite-bar1290{flex:1 0 100%;display:flex;align-items:center;gap:8px;min-width:0;padding-top:4px;border-top:1px solid #ffffff19;margin-top:4px}
 #still-onsite-bar1290 button{min-height:44px;border:1px solid #b75d25;border-radius:7px;padding:7px 12px;background:#251b14;color:#ffd2ae;font:700 13px Inter,sans-serif;cursor:pointer;white-space:nowrap}
 #still-onsite1290[aria-pressed=true]{background:#ff821f;color:#1b1009;border-color:#ffad68;box-shadow:0 0 0 1px #ff821f44}
 #still-onsite1290:before{content:'';display:inline-block;width:9px;height:9px;border:2px solid currentColor;border-radius:2px;margin-right:7px;vertical-align:-1px}
 body.onsite1290 #vmsicons1211 button b{border-color:#ff821f;color:#ffb16c}body.onsite1290 #vmsicons1211 button svg [stroke]{stroke:#ff821f}#still-onsite1290[aria-pressed=true]:before{background:currentColor}#still-onsite-list1290{margin-left:auto;max-width:55%;overflow:hidden;text-overflow:ellipsis;border-color:#ffffff24!important;background:#171411!important;color:#efebe8!important;font-size:12px!important}
 #still-onsite-panel1290{position:absolute;z-index:60;inset:8px;margin:auto;max-width:650px;max-height:calc(100% - 16px);overflow:auto;box-sizing:border-box;border:2px solid #ff821f;border-radius:10px;background:#142129;color:#f2f5f7;padding:14px;box-shadow:0 10px 40px #0009;font:14px/1.45 Inter,sans-serif}
 #still-onsite-panel1290[hidden]{display:none!important}#still-onsite-panel1290 h2{font-size:19px;margin:0}#still-onsite-panel1290 .onsite-head{display:flex;justify-content:space-between;align-items:center;gap:8px}#still-onsite-panel1290 p{color:#ccd7dd;margin:10px 0}#still-onsite-panel1290 button{min-height:44px;background:#263843;color:white;border:1px solid #52636e;border-radius:6px;padding:8px;cursor:pointer}#still-onsite-panel1290 .onsite-row{display:flex;align-items:center;gap:10px;border-top:1px solid #ffffff20;padding:10px 0}#still-onsite-panel1290 .onsite-row>div{flex:1;min-width:0}#still-onsite-panel1290 strong{color:#ffad68}#still-onsite-panel1290 small{display:block;color:#c9d5dc}#still-onsite-panel1290 .onsite-review strong{color:#ffaaa3}#still-onsite-panel1290 .onsite-summary{font-weight:700}
 @media(max-width:900px){aside{top:var(--onsite-header1290,108px)}#still-onsite-bar1290{gap:5px}#still-onsite-bar1290 button{padding:7px 9px;font-size:12px;min-height:44px}#still-onsite-list1290{font-size:11px!important}#still-onsite-panel1290{inset:5px;padding:12px}}
 `;document.head.appendChild(css);
 const header=document.querySelector('header'),bar=document.createElement('div');bar.id='still-onsite-bar1290';
 bar.innerHTML='<button type="button" id="still-onsite1290" aria-pressed="false" title="Highlight all equipment still to collect">Still on site</button><button type="button" id="still-onsite-list1290" aria-haspopup="dialog">Checking…</button>';header.appendChild(bar);
 const toggle=bar.querySelector('#still-onsite1290'),list=bar.querySelector('#still-onsite-list1290');
 const resize=()=>document.documentElement.style.setProperty('--onsite-header1290',header.getBoundingClientRect().height+'px');const ro=new ResizeObserver(resize);ro.observe(header);resize();
 function summary(){const unmapped=entries.filter(r=>!r.mapped).length,review=entries.filter(r=>r.review||r.unknown||r.locationReview).length;return entries.length+' references'+(unmapped?' · '+unmapped+' unlocated':'')+(review?' · '+review+' to review':'');}
 function controls(){toggle.setAttribute('aria-pressed',String(active));toggle.disabled=!ready&&!active;document.body.classList.toggle('onsite1290',active);list.textContent=ready?entries.length+' references · List':'Checking…';list.setAttribute('aria-label',ready?summary()+'. Open still on site list':'Checking collection record');const legend=document.getElementById('map1256-key');if(legend){legend.textContent=active?'Still on site: orange outlines · red = review. Counts are per reference; a partial group does not identify individual unit positions.':'Left site: green outline · dashed = part collected or catalogue · red = review. Counts apply to each reference.';legend.hidden=false;}if(panel&&!panel.hidden)renderList();}
 function closeList(){if(panel)panel.hidden=true;list.focus();}
 function renderList(){
  panel.innerHTML='<div class="onsite-head"><h2>Still on site</h2><button type="button" data-close>Close</button></div><p class="onsite-summary">'+esc(summary())+'</p><p>Recorded arrivals still to collect. Quantities apply to each reference, including partly collected groups. Positions are those recorded on the plan.</p>'+
   (!ready?'<p>Collection record is not available yet. The list will update when it is ready.</p>':entries.length?entries.map((r,i)=>'<div data-onsite-ref="'+esc(r.key)+'" class="onsite-row '+(r.review||r.unknown?'onsite-review':'')+'"><div><b>'+esc(r.key)+'</b> · <strong>'+esc(wording(r))+'</strong><small>'+(r.locationReview?'Position to confirm — no extra equipment location has been assumed.':!r.mapped?'Location not recorded — shown in this list only.':r.items.length>1?'Assigned plan positions for this reference.':r.partial?'Partly collected group — remaining units are not individually located.':'Recorded plan location.')+'</small></div>'+(r.mapped?'<button type="button" data-locate="'+i+'">Show</button>':'')+'</div>').join(''):'<p>No recorded arrivals remain to collect.</p>')+'<small>Author: Andrew Fisher</small>';
  panel.querySelector('[data-close]').onclick=closeList;
  panel.querySelectorAll('[data-locate]').forEach(b=>b.onclick=()=>{const r=entries[Number(b.dataset.locate)],it=r?.items.find(x=>x.places?.length);if(!it)return;panel.hidden=true;window.GC500Explorer?.find?.(it.code);});
 }
 function showList(){if(!panel){panel=document.createElement('section');panel.id='still-onsite-panel1290';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Equipment still on site');document.getElementById('stage').appendChild(panel);panel.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();closeList();}if(ev.key==='Tab'){const bs=[...panel.querySelectorAll('button')],a=bs[0],z=bs.at(-1);if(ev.shiftKey&&document.activeElement===a){ev.preventDefault();z?.focus();}else if(!ev.shiftKey&&document.activeElement===z){ev.preventDefault();a?.focus();}}});}renderList();panel.hidden=false;panel.querySelector('[data-close]').focus();}
 function fitOnce(){const boxes=mappedItems().flatMap(it=>it.places.map(b=>geoRect(b)));if(!boxes.length)return;const x0=Math.min(...boxes.map(b=>b[0])),y0=Math.min(...boxes.map(b=>b[1])),x1=Math.max(...boxes.map(b=>b[2])),y1=Math.max(...boxes.map(b=>b[3])),m=Math.max(18,Math.max(x1-x0,y1-y0)*.05);window.fitSearch1211?.([x0-m,y0-m,x1+m,y1+m],'Still on site · '+entries.filter(r=>r.mapped).length+' references');}
 const clonePins=ps=>(ps||[]).map(p=>({...p,ll:Array.isArray(p.ll)?p.ll.slice():p.ll}));
 function install3d(){
  const bridge=window.GC500EquipmentBridge1027;
  if(bridge&&!bridgeHook){bridgeHook=true;const cat=bridge.catalogue,snapshot=bridge.snapshot;
   bridge.catalogue=function(){const rows=cat.apply(this,arguments);return active?rows.filter(r=>row(r.ref)):rows;};
   bridge.snapshot=function(){const value=snapshot.apply(this,arguments);if(!active||!value?.available)return value;return {...value,items:value.items.filter(r=>row(r.ref)).map(r=>({...r,quantityLabel:r.ref+' · '+wording(row(r.ref)),completionLabel:r.completionLabel}))};};
  }
  const w=document.getElementById('model3d')?.contentWindow,api=w?.GC500_3D,view=w?.GC500EquipmentView1027;if(!api||!view||three?.api===api)return false;
  const set=api.setPins,groups=api.showGroups;three={w,api,view,pins:[],groups:null};
  api.setPins=function(pins){three.pins=clonePins(pins);return set.call(this,active?clonePins(pins).filter(p=>row(p.k)).map(p=>({...p,c:row(p.k).review?REVIEW:ORANGE,n:(p.n||'')+' · '+wording(row(p.k))})):clonePins(pins));};
  api.showGroups=function(ids){three.groups=ids;return groups.call(this,active?null:ids);};
  three.apply=()=>{set.call(api,active?clonePins(three.pins).filter(p=>row(p.k)).map(p=>({...p,c:row(p.k).review?REVIEW:ORANGE,n:(p.n||'')+' · '+wording(row(p.k))})):clonePins(three.pins));groups.call(api,active?null:three.groups);view.refresh();};
  window.GC500ExplorerRepin?.();return true;
 }
 function update3d(){install3d();three?.apply?.();}
 function refresh(force=false){const next=read();ready=!!next;if(!next){signature='';entries=[];cachedItems=[];byCode.clear();controls();update3d();requestPaint();return;}const sig=JSON.stringify(next.map(r=>[r.key,r.remaining,r.unknown,r.review,r.partial,r.locationReview,r.codes,r.items.map(it=>it.places)]));if(!force&&sig===signature)return;signature=sig;entries=next;cachedItems=[...new Map(entries.flatMap(r=>r.items).filter(it=>it.places?.length).map(it=>[N(it.code),it])).values()];byCode=new Map(entries.flatMap(r=>r.codes.map(c=>[N(c),r])));if(active&&selected&&!row(selected))clearSelection813();controls();update3d();requestPaint();}
 function setActive(on){on=on===true;refresh();if(on===active||on&&!ready)return active;
  if(on){saved={marks:marks.map(m=>({code:m.it.code,c:m.c})),fencing:!!window.GC500FencingMap?.active,fenceRef:window.GC500FencingMap?.selected,category:document.querySelector('#chips [data-cat][aria-pressed=true]')?.dataset.cat||null};active=true;window.GC500FencingMap?.close?.();clearSelection813();window.GC500Explorer?.fencingAdapter?.clearSelection?.();document.querySelectorAll('#chips [data-cat]').forEach(b=>b.setAttribute('aria-pressed','false'));fitOnce();}
  else{active=false;clearSelection813();if(saved){showCategory(saved.category);document.querySelectorAll('#chips [data-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cat===saved.category)));marks=saved.marks.map(m=>({it:ITEMS.find(it=>it.code===m.code),c:m.c})).filter(m=>m.it);if(saved.fencing)window.GC500FencingMap?.open?.(saved.fenceRef);}saved=null;}
  controls();update3d();if(on&&window.GC500Explorer?.is3d?.())three?.api.fly('overhead',500);requestPaint();return active;
 }
 const draw=drawMarks;drawMarks=function(){if(!active)return draw.apply(this,arguments);const prior=marks;marks=mappedItems().map(it=>({it,c:row(it).review?REVIEW:ORANGE}));try{return draw.apply(this,arguments);}finally{marks=prior;}};
 toggle.onclick=()=>setActive(!active);list.onclick=showList;
 // Reuse the native on-screen record refresh; no model work or animation loop on paint.
 const pull=complete897Pull;complete897Pull=function(){const result=pull.apply(this,arguments);refresh();return result;};
 for(const name of ['markAt','itemAt887']){const hit=window[name];window[name]=function(){if(!active)return hit.apply(this,arguments);const prior=marks;marks=mappedItems().map(it=>({it,c:row(it).review?REVIEW:ORANGE}));try{const value=hit.apply(this,arguments);return value?.it&&!row(value.it)?null:value;}finally{marks=prior;}};}
 let watched=null;const watch3d=()=>{const f=document.getElementById('model3d');if(f&&f!==watched){watched=f;f.addEventListener('load',()=>{install3d();if(active)three?.apply?.();});}install3d();};
 const mo=new MutationObserver(watch3d);mo.observe(document.getElementById('stage'),{childList:true});
 const ready3d=window.gc500Explorer3DReady813;if(typeof ready3d==='function')window.gc500Explorer3DReady813=function(){const result=ready3d.apply(this,arguments);watch3d();return result;};
 window.addEventListener('pagehide',e=>{if(!e.persisted){disposed=true;ro.disconnect();mo.disconnect();}});
 window.GC500StillOnSite1290=Object.freeze({setActive,refresh,showList,row,wording,get active(){return active;},get state(){return {active,ready,references:entries.length,mapped:entries.filter(r=>r.mapped).length,unmapped:entries.filter(r=>!r.mapped).length,refs:entries.map(({key,code,codes,status,remaining,unknown,review,locationReview,mapped})=>({key,code,codes:codes.slice(),status,remaining,unknown,review,locationReview,mapped})),three:three?{hooked:true,pins:three.api.state.pins,sourcePins:three.pins.length}:null};}});
 refresh(true);install3d();
}
