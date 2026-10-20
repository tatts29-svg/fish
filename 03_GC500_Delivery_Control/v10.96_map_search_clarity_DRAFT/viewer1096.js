/* Author: Andrew Fisher. Keep native camera, sources and statuses; make finding immediate. */
(function () {
 'use strict';
 if (window.MapExplorer1096) return;
 const engine=window.MapSearch1096, input=$('q'), results=$('results');
 let index=[],labels=[],lastItems=null,lastLabels=null,pageSize=40,active=-1;
 const stats={searches:0,lastSearchMs:0,indexBuilds:0,sceneWarm:false};
 function rebuild() {
  if(lastItems===ITEMS && lastLabels===P.labels)return;
  lastItems=ITEMS;lastLabels=P.labels;stats.indexBuilds++;
  const metadata=new Map();
  for(const row of [...(HOST?.items||[]),...(HOST?.unplaced||[]),...(HOST?.placed||[])]) if(row.search1096)metadata.set(engine.compact(row.key),row.search1096);
  for(const layer of HOST?.layers||[])for(const row of layer.marks||[])if(row.search1096)metadata.set(engine.compact(row.face||row.name),row.search1096);
  index=ITEMS.map((item,order)=>{
   const extra=metadata.get(engine.compact(item.code))||{},reg=item.reg||{};
   return engine.prepare({item,order,priority:item.cat?.host==='trade'?0:1,code:item.code,description:reg.name||reg.product||'',category:item.cat?.name||'',
    location:reg.location||'',identifiers:[...(extra.identifiers||[]),...String(reg.asset_numbers||'').split(/[,;|]/)].filter(Boolean),
    terms:[...(extra.terms||[]),...(item.names||[]),reg.ownership,reg.note].filter(Boolean),regos:extra.regos||[]});
  });
  labels=(P.labels||[]).map((row,i)=>engine.prepare({code:row[0],label:row,i}));
 }
 function buttons(){return [...results.querySelectorAll('button[data-map1096]')];}
 function highlightResult(next){
  const rows=buttons();active=Math.max(-1,Math.min(rows.length-1,next));
  rows.forEach((b,i)=>{b.classList.toggle('map1096-active',i===active);b.setAttribute('aria-selected',String(i===active));});
  if(active>=0){input.setAttribute('aria-activedescendant',rows[active].id);rows[active].scrollIntoView({block:'nearest'});}
  else input.removeAttribute('aria-activedescendant');
 }
 function searchFast() {
  if(!P)return;const start=performance.now();rebuild();
  const value=input.value.trim();results.classList.toggle('show',!!value);input.setAttribute('aria-expanded',String(!!value));
  active=-1;input.removeAttribute('aria-activedescendant');
  if(!value){results.replaceChildren();highlight=null;requestPaint();return;}
  const found=engine.query(index,value),codes=new Set(found.map(row=>engine.compact(row.code)));
  const other=engine.query(labels,value).filter(row=>!codes.has(engine.compact(row.code)));
  const combined=found.map(row=>({row,kind:'item'})).concat(other.map(row=>({row,kind:'label'}))),visible=combined.slice(0,pageSize);
  const fragment=document.createDocumentFragment(),count=document.createElement('div');count.className='rh';count.setAttribute('role','status');
  count.textContent=combined.length ? `${combined.length} match${combined.length===1?'':'es'}${combined.length>visible.length?` · showing ${visible.length}`:''}` : 'No matching reference, asset, rego, description or drawing label.';
  fragment.append(count);
  visible.forEach(({row,kind},i)=>{
   const b=document.createElement('button');b.type='button';b.dataset.map1096=String(i);b.id='map1096-result-'+i;b.setAttribute('role','option');b.setAttribute('aria-selected','false');
   const detail=kind==='item' ? [row.description,row.category,row.location,row.regos.length?'Rego '+row.regos.join(', '):'',row.item.reg?.asset_numbers?'Asset '+row.item.reg.asset_numbers:'',row.item.places.length?'Go to recorded map location':'No verified map position'].filter(Boolean).join(' · ') : locationName(row.label)+' · drawing label';
   b.innerHTML='<b>'+esc(row.code)+'</b>'+(kind==='item'?ok897(row.item):'')+'<small>'+esc(detail)+'</small>';
   b.onclick=()=>jump(row,kind);fragment.append(b);
  });
  if(combined.length>pageSize){const more=document.createElement('button');more.type='button';more.textContent='Show more matches';more.onclick=()=>{pageSize+=40;searchFast();};fragment.append(more);}
  results.replaceChildren(fragment);stats.searches++;stats.lastSearchMs=performance.now()-start;
 }
 // Search selection goes directly to the native destination. Pan/pinch behaviour is unchanged.
 function immediate(action){
  const native=glideCamera887;
  glideCamera887=to=>{stopCameraMotion813();camera=to;clampCamera();prefetchView(currentView());changeView(false);};
  try{return action();}finally{glideCamera887=native;}
 }
 function jump(row,kind) {
  warmScene();
  if(kind==='item') immediate(()=>selectCode(row.code,0,true));
  else {
   lastSearch=[{r:row.label,i:row.i}];
   immediate(()=>chooseResult(0,true));
  }
  if(kind==='label'||row.item.places.length)input.setAttribute('aria-expanded','false');
 }
 input.removeEventListener('input',search);
 search=searchFast;
 input.addEventListener('input',()=>{pageSize=40;searchFast();});
 // Capture prevents the older Enter handler choosing an unrelated first native result.
 input.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(['ArrowDown','ArrowUp','Enter','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}
  if(e.key==='ArrowDown')highlightResult(active+1);
  if(e.key==='ArrowUp')highlightResult(active<0?buttons().length-1:active-1);
  if(e.key==='Enter')buttons()[active<0?0:active]?.click();
  if(e.key==='Escape'){input.value='';searchFast();panel813(false);stage.focus();}
 },true);
 results.onclick=null;
 input.placeholder='Reference, description, asset or rego';
 input.setAttribute('aria-label','Find a reference, description, asset number or registration');
 input.setAttribute('role','combobox');input.setAttribute('aria-controls','results');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-expanded','false');
 results.setAttribute('role','listbox');results.setAttribute('aria-label','Map search results');
 const nativeRefresh=GC500Explorer.refresh;
 GC500Explorer.refresh=function(){
  const value=nativeRefresh.apply(this,arguments);
  if(lastItems!==ITEMS){rebuild();if(input.value.trim())searchFast();}
  return value;
 };
 // Preload the native vector worker once while the map is visible, rather than waiting for a deep zoom.
 let warming=false,warmTimer=0;
 function warmScene(){
  const c=navigator.connection;
  if(warming||sceneReady||!shown887()||under3d()||c?.saveData||/(^|-)2g$/.test(c?.effectiveType||''))return;
  warming=true;
  ensureScene().then(()=>{stats.sceneWarm=true;}).catch(()=>{}).finally(()=>{warming=false;});
 }
 function scheduleWarm(){clearTimeout(warmTimer);if(shown887())warmTimer=setTimeout(warmScene,350);}
 input.addEventListener('focus',warmScene);
 window.addEventListener('gc500viewchange1018',scheduleWarm);
 document.addEventListener('visibilitychange',scheduleWarm);
 const nativeShown=setHostShown887;
 setHostShown887=function(on){const r=nativeShown.apply(this,arguments);if(on!==false)scheduleWarm();else clearTimeout(warmTimer);return r;};
 // A selected status label must remain next to the point even at 64,000% zoom.
 const nativeLabel=label1009;
 label1009=function(ctx,it,c,r,selected,colour){return nativeLabel(ctx,it,c,Math.min(r,30*dpr),selected,colour);};
 GC500Explorer.refresh(true);rebuild();scheduleWarm();requestPaint();
 window.MapExplorer1096={stats,search:searchFast,rebuild,warmScene,immediate};
})();
