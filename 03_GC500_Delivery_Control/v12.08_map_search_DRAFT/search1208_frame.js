/* Author: Andrew Fisher. Read-only complete map matches from existing positions and reviewed drawing symbols. */
function searchFrame1208(){
 'use strict';
 if(window.GC500Search1208)return;
 const catalog=parent.MapSearch1208.catalog;
 const TYPES=[
 ['firstaid','First aid posts','#8add6e','first aid medical medic'],
 ['information','Information booths','#00bfff','information info booth'],
 ['police','Police posts','#8080ff','police'],
 ['photographer','On-track photographer posts','#ffdf7f','photographer photography still camera'],
 ['broadcast','Broadcast camera posts','#ffb3ff','broadcast camera television tv'],
 ['marshal','Marshal posts','#00ff00','marshal marshall mp'],
 ['yellowflag','Yellow flag repeater lights','#f4ee51','yellow flag repeater yfr'],
 ['emergency','Emergency egress points','#00b800','emergency egress exit ep'],
 ['hydrant','Pit lane fire hydrants','#ff4d4d','fire hydrant hydrants fh']
 ];
 const cats=TYPES.map(([key,name,c,aliases])=>({id:'legend1208-'+key,key,name,c,aliases,source1208:true}));
 const n=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const tokens=q=>n(q).split(' ').filter(Boolean);
 const within=(r,x,y)=>r&&x>=r[0]&&x<=r[2]&&y>=r[1]&&y<=r[3];
 function onGround(box){const x=(box[0]+box[2])/2,y=(box[1]+box[3])/2;
  return !!(GEO?.inset&&within(GEO.inset.sheet_region_pts,x,y)||GEO?.main&&within(GEO.main.sheet_region_pts,x,y)&&!(GEO.main.exclude_pts||[]).some(r=>within(r,x,y)));
 }
 function sourceOK(){return !!(P?.meta&&P.meta.sha256===catalog.drawing_sha256&&P.meta.frame_sha256===catalog.frame_sha256);}
 const aliases=cat=>{
  if(cat.source1208)return cat.aliases;
  const name=n(cat.name);
  if(/toilet/.test(name))return 'toilets toilet blocks single toilet amenities wc';
  if(/portable building/.test(name))return 'portable buildings building';
  if(/water.*barrier/.test(name))return 'water filled barriers wfb';
  if(/lighting|light tower/.test(name))return 'lighting towers light tower lt';
  if(/pedestrian bridge/.test(name))return 'pedestrian bridges bridge pb';
  if(cat.id==='egress')return 'vehicle entry exit points eep';
  return name;
 };
 function enrich(){
  if(!Array.isArray(ITEMS)||!Array.isArray(CATS_NOW))return;
  ITEMS=ITEMS.filter(it=>!it.source1208).map(it=>it.cat?.host?it:Object.assign({},it,{places:it.places.filter(onGround)}));CATS_NOW=CATS_NOW.filter(c=>!c.source1208);
  const vehicle=CATS_NOW.find(c=>c.id==='egress');if(vehicle)vehicle.name='Vehicle entry / exit points';
  const turnCat={id:'turn1208',name:'Track turns',c:'#ff6a13',source1208:true,aliases:'turn corner'};
  CATS_NOW.push(turnCat);
  for(const t of parent.Find1176?.turns?.()||[]){const xy=ap(inv(GEO.main.sheet_to_z18px),...parent.MapArea1206.core.merc({lat:t.lat,lon:t.lon}));ITEMS.push({code:t.face||t.label,places:[[xy[0]-1,xy[1]-1,xy[0]+1,xy[1]+1]],reg:{name:t.label},cat:turnCat,names:[],source1208:true,sourceLabel1208:t.label});}
  if(!sourceOK())return;
  for(const cat of cats){
   const entries=(catalog.symbols[cat.key]||[]).filter(x=>onGround(x.box));if(!entries.length)continue;
   CATS_NOW.push(cat);
   entries.forEach((x,i)=>ITEMS.push({code:cat.name.toUpperCase()+' · '+(i+1),places:[x.box.slice()],reg:{name:x.label?cat.name+' · '+x.label:cat.name},cat,names:[],source1208:true,sourceLabel1208:x.label||''}));
   const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.cat=cat.id;b.setAttribute('aria-pressed','false');b.style.setProperty('--c',cat.c);b.innerHTML='<i></i>'+esc(cat.name)+' <small>'+entries.length+'</small>';$('chips').appendChild(b);
  }
 }
 const build0=buildItems;buildItems=function(){const r=build0.apply(this,arguments);enrich();return r;};
 function matches(q){
  const tt=tokens(q),query=n(q);if(!tt.length)return [];
  const stand=/^(?:grand ?stand|stand|s) ?0*(\d{1,2})([a-z]?)$/.exec(query),turn=/^(?:turn|corner|t) ?0*(\d{1,2})$/.exec(query);
  if(stand)return ITEMS.filter(it=>it.code==='S'+stand[1].padStart(2,'0')+stand[2].toUpperCase());
  if(turn)return ITEMS.filter(it=>it.cat.id==='turn1208'&&Number(String(it.sourceLabel1208).replace(/\D/g,''))===Number(turn[1]));
  const phrase=query.replace(/\bposts?\b/g,'').replace(/\s+/g,' ').trim();
  const kinds={ 'first aid':['firstaid'],'medical':['firstaid'],'information':['information'],'information booths':['information'],'info':['information'],'police':['police'],'photographer':['photographer'],'photographers':['photographer'],'photography':['photographer'],'broadcast camera':['broadcast'],'broadcast cameras':['broadcast'],'camera':['photographer','broadcast'],'cameras':['photographer','broadcast'],'marshal':['marshal'],'marshals':['marshal'],'marshall':['marshal'],'marshalls':['marshal'],'mp':['marshal'],'yellow flag repeater lights':['yellowflag'],'yellow flag':['yellowflag'],'yfr':['yellowflag'],'emergency':['emergency'],'emergency egress':['emergency'],'emergency egress points':['emergency'],'emergency exit':['emergency'],'emergency exits':['emergency'],'egress':['emergency'],'ep':['emergency'],'fire hydrants':['hydrant'],'fire hydrant':['hydrant'],'hydrants':['hydrant'],'hydrant':['hydrant'],'fh':['hydrant'],'pit lane fire hydrants':['hydrant'] };
  if(sourceOK()&&kinds[phrase])return ITEMS.filter(it=>kinds[phrase].includes(it.cat.key));
  const hit=hay=>tt.every(t=>t.length<=2?new RegExp('(?:^| )'+t+'(?= |$|[0-9])').test(hay):hay.includes(t)||t.endsWith('s')&&hay.includes(t.slice(0,-1)));
  const items=ITEMS.filter(it=>hit(n([it.code,it.sourceLabel1208,it.cat?.name,aliases(it.cat||{}),it.reg?.name,it.reg?.product,it.reg?.asset_numbers,it.reg?.location,(it.names||[]).join(' ')].join(' '))));
  if(items.length)return items;
  const known=new Set(ITEMS.flatMap(it=>[n(it.code),n(it.sourceLabel1208)]).filter(Boolean)),labels=new Map();
  if(sourceOK())['mp','fh','yfr'].forEach(k=>known.add(k));
  for(const r of P.labels||[]){const key=n(r[0]);if(!hit(key)||known.has(key)||!onGround(r.slice(1)))continue;
   if(!labels.has(key))labels.set(key,{code:'DRAWING · '+r[0],sourceLabel1208:r[0],places:[],reg:{name:r[0]},cat:{id:'drawing1208',name:'Drawing labels',c:'#ff6a13'},names:[],labelOnly1208:true});labels.get(key).places.push(r.slice(1));
  }
  return items.concat([...labels.values()]);
 }
 function results(q){
  const items=matches(q),rows=[];
  for(const it of items){
   const a=it.cat?.host==='trade'&&typeof parent.assetOf==='function'?parent.assetOf(it.code):null;
   if(!it.places.length){rows.push({kind:'map1208',id:it.code,label:it.code,what:it.reg?.name||it.cat.name,none:'No exact position on the master plan yet',a,code1208:it.code});continue;}
   it.places.forEach((b,i)=>{const ll=sheetToLL((b[0]+b[2])/2,(b[1]+b[3])/2);if(!ll)return;
    rows.push({kind:'map1208',id:it.code+':'+i,label:it.sourceLabel1208||it.code,what:it.cat.name+(it.reg?.name&&it.reg.name!==it.cat.name?' · '+it.reg.name:''),lat:ll.lat,lon:ll.lon,tag:it.sourceLabel1208||it.code,how:'Position shown on the master plan; not a surveyed position',a,code1208:it.code,place1208:i});});
  }
  return {items,rows,placed:rows.filter(r=>!r.none).length,unplaced:rows.filter(r=>r.none).length,note:sourceOK()?'':'The drawing changed; the additional symbol index is unavailable until checked.'};
 }
 function fitItems(items,label){
  clearSelection813();highlight=null;marks=items.filter(i=>i.places.length).map(it=>({it,c:it.cat.c}));
  const boxes=marks.flatMap(m=>m.it.places.map(b=>geoRect(b)));
  if(boxes.length){const x0=Math.min(...boxes.map(b=>b[0])),y0=Math.min(...boxes.map(b=>b[1])),x1=Math.max(...boxes.map(b=>b[2])),y1=Math.max(...boxes.map(b=>b[3]));const margin=Math.max(18,Math.max(x1-x0,y1-y0)*.05);gotoRect([x0-margin,y0-margin,x1+margin,y1+margin],label);}
  requestPaint();return boxes.length;
 }
 let activeQuery='',last=null;
 function show(q,fit=true){activeQuery=String(q||'').trim();last=results(q);if(fit)fitItems(last.items,activeQuery+' · '+last.placed+' locations');return {rows:last.rows,placed:last.placed,unplaced:last.unplaced,note:last.note};}
 function select(code,place=0){const it=last?.items.find(i=>i.code===code)||ITEMS.find(i=>i.code===code);if(!it)return false;if(it.labelOnly1208){fitItems([it],it.sourceLabel1208);pickedLocation813();return true;}return selectCode(code,place,true);}
 function row(it){return '<button data-search1208-code="'+esc(it.code)+'"><b>'+esc(it.sourceLabel1208||it.code)+'</b>'+(!it.source1208?ok897(it):'')+'<small>'+esc(it.cat.name)+' · '+esc(it.places.length?it.places.length+' mapped location'+(it.places.length===1?'':'s'):'No exact map position yet')+(it.reg?.name?' · '+esc(it.reg.name):'')+'</small></button>';}
 const oldSearch=search;
 search=function(){if(!P)return;const q=$('q').value.trim();if(window.GC500Explorer?.refresh)window.GC500Explorer.refresh(true);const r=show(q);$('results').classList.toggle('show',!!q);lastSearch=[];
  if(!q){$('results').replaceChildren();return;}
  $('results').innerHTML='<div class="rh">'+r.placed+' mapped location'+(r.placed===1?'':'s')+' · '+r.unplaced+' without an exact position'+(r.note?' · '+esc(r.note):'')+'</div>'+(r.placed?'<button data-search1208-all>Show all '+r.placed+' locations</button>':'')+(last.items.length?last.items.map(row).join(''):'<div class="rh">No indexed location matches. Some symbols appear only in the drawing legend; a location is never guessed.</div>');
 };
 $('q').removeEventListener('input',oldSearch);$('q').addEventListener('input',search);
 const choose0=chooseResult;chooseResult=function(i,labelOnly){if(!labelOnly&&activeQuery){show(activeQuery);pickedLocation813();stage.focus({preventScroll:true});return;}return choose0.apply(this,arguments);};
 const click0=$('results').onclick;$('results').onclick=e=>{const all=e.target.closest('[data-search1208-all]');if(all){show(activeQuery);pickedLocation813();stage.focus({preventScroll:true});return;}const b=e.target.closest('[data-search1208-code]');if(b){select(b.dataset.search1208Code,0);return;}return click0?.(e);};
 buildItems();
 window.GC500Search1208=Object.freeze({version:'v12.08',search:q=>show(q),showAll:()=>show(activeQuery),select,get state(){return {query:activeQuery,placed:last?.placed||0,unplaced:last?.unplaced||0,marked:marks.reduce((a,m)=>a+m.it.places.length,0),sourceOK:sourceOK(),symbolCounts:Object.fromEntries(cats.map(c=>[c.key,ITEMS.filter(i=>i.cat.id===c.id).length]))};}});
 const input=parent.document.querySelector('#f1176q');if(input?.value)input.dispatchEvent(new parent.Event('input',{bubbles:true}));
}
