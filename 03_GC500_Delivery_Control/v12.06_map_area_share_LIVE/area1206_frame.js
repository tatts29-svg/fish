/* Author: Andrew Fisher. Runs inside the existing explorer; never changes the camera, filters or record. */
function areaFrame1206(){
 'use strict';
 const H=parent.MapArea1206,C=H.core,EDGE=3840,BAND=320;
 let current=null,serial=0,running=false,prepared=null,previewUrl='',card=null,lastError='';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const norm=s=>String(s||'').toUpperCase().replace(/[\s_.-]+/g,' ').trim();
 const fraction=p=>[p[0]*SHEET_W,p[1]*SHEET_H];
 const region=p=>GEO.inset&&C.rect(GEO.inset.sheet_region_pts,p)?GEO.inset:GEO.main;
 const valid=p=>C.rect(region(p).sheet_region_pts,p);
 const world=p=>ap(region(p).sheet_to_z18px,p[0],p[1]);
 const local=(p,F)=>F.local(world(p));
 const fromLL=ll=>C.merc(ll);
 function shapeFor(it,shape){
  if(!shape||!shape.placed||shape.cancelled||/Andrew.s pin/.test(it.placedHow||''))return null;
  // A moved marker must never inherit doors at its old master-plan position.
  const centres=(it.places||[]).map(b=>[(b[0]+b[2])/2,(b[1]+b[3])/2]);
  const polys=shape.components.filter(c=>!c.drawn_as&&c.poly?.length).map(c=>c.poly.map(fraction));
  const near=centres.some(p=>polys.some(poly=>C.contains(poly,p)||poly.some((a,i)=>{
   const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/n)):0;
   return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)<=6;
  })));
  return near?shape:null;
 }
 function snapshot(pin){
  if(!pin||!GEO?.main)return null;
  const F=C.frame(pin.ll),rows=new Map(),model=parent.MasterShapes926;
  for(const it of ITEMS){
   if(!it?.code||!Array.isArray(it.places))continue;
   const code=String(it.reg?.sourceRequest1017?it.reg.sourceKey1017:it.code),key=norm(code);
   const centres=it.places.map(b=>[(b[0]+b[2])/2,(b[1]+b[3])/2]).filter(valid).map(p=>local(p,F));
   const sh=shapeFor(it,model?.shape(code)),parts=[];
   for(const part of sh?.components||[]){
    if(part.drawn_as||!part.poly?.length)continue;
    const raw=part.poly.map(fraction);if(!raw.some(valid))continue;
    const poly=raw.map(p=>local(p,F)),closed=part.geometry==='polygon';
    if(!C.intersects(poly,closed))continue;
    const doors=[];
    // Catalogue footprints have no surveyed door position. Only the plan's own doors are drawn.
    const sourceDoors=[...(part.doors||[])];
    if(!sourceDoors.length&&part.kind==='toilet')for(const mark of part.marks||[]){if(mark.type!=='chevron')continue;const d=C.edgeDoor(raw,mark.edge_index);if(d)sourceDoors.push({mid:[d.mid[0]/SHEET_W,d.mid[1]/SHEET_H],outward:d.out,swing:{leaves:mark.lines||[]}});}
    if(part.source==='master'&&!part.standard)for(const d of sourceDoors){
     if(!d.mid||!d.outward)continue;
     const p=fraction(d.mid),end=[p[0]+d.outward[0],p[1]+d.outward[1]],mid=local(p,F),out=local(end,F);
     if(!C.inside(mid))continue;
     const n=Math.hypot(out[0]-mid[0],out[1]-mid[1]);if(!n)continue;
     doors.push({mid,out:[(out[0]-mid[0])/n,(out[1]-mid[1])/n],faces:C.direction(mid,out),arcs:(d.swing?.arcs||[]).filter(Array.isArray).map(l=>l.filter(Array.isArray).map(p=>local(fraction(p),F))),leaves:(d.swing?.leaves||[]).filter(Array.isArray).map(l=>l.filter(Array.isArray).map(p=>local(fraction(p),F)))});
    }
    parts.push({poly,closed,doors,standard:!!part.standard,kind:part.kind});
   }
   const points=centres.filter(C.inside);if(!points.length&&!parts.length)continue;
   const status=typeof mapStatus1009==='function'?mapStatus1009(it):null;
   const kinds=parent.MapUnits1147.kinds(it,status),symbols=kinds.map(k=>parent.MapUnits1147.data.symbols[k]||parent.MapUnits1147.data.symbols.unknown);
   const name=String(it.reg?.name||it.reg?.type||it.names?.[0]||it.cat?.name||code);
   const descriptions=status?.quantity1010?.all?.length?[...status.quantity1010.all]:[name];
   const row=rows.get(key)||{code,name,descriptions,symbols,points:[],parts:[],loading:H.metadata(code).loading,how:sh?'Master-plan position':'Mapped position; footprint and door position not established'};
   row.points.push(...points);row.parts.push(...parts);rows.set(key,row);
  }
  // Gates, stands and other located map features use the same sources as Find it on the map.
  const extras=[...(parent.Gates1156?.gates?.()||[]).map(g=>({code:g.face||g.id,name:g.label||('Gate '+g.num),lat:g.lat,lon:g.lon,kind:'gate'})),...(parent.Find1176?.stands?.()||[]).map(s=>({code:s.face,name:s.label,lat:s.lat,lon:s.lon,kind:'stand'}))];
  for(const m of Object.values(parent.SatMap1141?.maps||{}))for(const e of m.items||[])if(['vms','spot','turn'].includes(e.kind))extras.push({code:e.label||e.id,name:e.name||e.label,lat:e.lat,lon:e.lon,kind:e.kind});
  for(const e of extras){if(!Number.isFinite(e.lat)||!Number.isFinite(e.lon)||!e.code)continue;const p=F.local(fromLL(e));if(!C.inside(p)||rows.has(norm(e.code)))continue;
   rows.set(norm(e.code),{code:e.code,name:e.name,descriptions:[e.name||e.code],symbols:[{glyph:'',label:e.kind}],points:[p],parts:[],loading:[],how:'Existing mapped position'});
  }
  const list=[...rows.values()].sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));list.forEach((r,i)=>r.n=i+1);
  return {pin:{ll:{...pin.ll},at:pin.at||new Date()},F,rows:list};
 }
 const doorWords=r=>{const faces=[...new Set(r.parts.flatMap(p=>p.doors.map(d=>d.faces)))];return faces.length?'Plan doors face '+faces.join(' / '):r.loading.length||r.symbols.some(s=>/toilet|building|block|accessible|trailer|container/i.test(s.label||''))?'Door position/direction not recorded in this area':'';};
 const loadingWords=r=>r.loading.map(l=>(l.asset?l.asset+' · ':'')+l.item+': '+({driver:'door to driver side',passenger:'door to passenger side',na:'door side not applicable'}[l.side]||'door side not recorded'));
 function words(s){
  if(!s)return '';
  const ll=s.pin.ll,lines=['GC500 · 50 m × 50 m area','Captured '+when(new Date(s.pin.at)),'Centre: '+ll.lat.toFixed(6)+', '+ll.lon.toFixed(6),'North up · 25 m each side of the selected spot',s.rows.length+' mapped entries (including footprints crossing the boundary).'];
  for(const r of s.rows){lines.push('\n'+r.n+'. '+r.code+' — '+r.descriptions.join('; '));if(doorWords(r))lines.push(doorWords(r));if(r.loading.length)lines.push('Recorded truck loading: '+loadingWords(r).join('; '));}
  if(!s.rows.length)lines.push('No mapped entries found. Unmapped items cannot be located from this selection.');
  lines.push('\nhttps://maps.google.com/?q='+ll.lat.toFixed(6)+','+ll.lon.toFixed(6),'Master-plan registration, not a survey. Reference quantities describe the reference; individual units without a plotted position cannot be assigned inside the square. Drawing features without mapped IDs remain visible in the picture.','Author: Andrew Fisher');
  return lines.join('\n');
 }
 const point=(p,edge=EDGE)=>[(p[0]+25)*edge/50,(p[1]+25)*edge/50];
 function path(g,pts,close){g.beginPath();pts.forEach((p,i)=>{const q=point(p);i?g.lineTo(...q):g.moveTo(...q);});if(close)g.closePath();}
 async function plan(g,s){
  await ensureScene();
  const outM=[[EDGE/50*s.F.mpp,0,EDGE/2-EDGE/50*s.F.mpp*s.F.centre[0]],[0,EDGE/50*s.F.mpp,EDGE/2-EDGE/50*s.F.mpp*s.F.centre[1]],[0,0,1]];
  let regions=0;
  for(const R of [GEO.main,GEO.inset].filter(Boolean)){
   const M=mul(outM,R.sheet_to_z18px),I=inv(M),bb=C.bounds([[0,0],[EDGE,0],[EDGE,EDGE],[0,EDGE]].map(p=>ap(I,...p))),r=R.sheet_region_pts;
   const b=[Math.max(bb[0],r[0]),Math.max(bb[1],r[1]),Math.min(bb[2],r[2]),Math.min(bb[3],r[3])];if(b[2]<=b[0]||b[3]<=b[1])continue;
   const scale=Math.hypot(M[0][0],M[1][0]),v={x:b[0],y:b[1],w:b[2]-b[0],h:b[3]-b[1],scale};
   const {svg}=await svgFromWorker(v,Math.min(8192,Math.ceil(v.w*scale)),Math.min(8192,Math.ceil(v.h*scale)),false,'original');
   const loader=loadSvg(svg);let loaded;
   try{loaded=await loader.promise;g.save();
    if(R===GEO.inset){const main=GEO.main.sheet_region_pts,MM=mul(outM,GEO.main.sheet_to_z18px);g.beginPath();g.rect(0,0,EDGE,EDGE);[[main[0],main[1]],[main[2],main[1]],[main[2],main[3]],[main[0],main[3]]].forEach((p,i)=>{const q=ap(MM,...p);i?g.lineTo(...q):g.moveTo(...q);});g.closePath();g.clip('evenodd');}
    g.setTransform(M[0][0],M[1][0],M[0][1],M[1][1],M[0][2],M[1][2]);g.beginPath();g.rect(...[r[0],r[1],r[2]-r[0],r[3]-r[1]]);
    for(const h of R.exclude_pts||[])g.rect(h[0],h[1],h[2]-h[0],h[3]-h[1]);g.clip('evenodd');g.drawImage(loaded.img,v.x,v.y,v.w,v.h);g.restore();regions++;
   }finally{if(loaded)URL.revokeObjectURL(loaded.url);}
  }
  return regions;
 }
 async function picture(s){
  const cv=document.createElement('canvas');cv.width=EDGE;cv.height=EDGE+BAND;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,EDGE,EDGE);
  const regions=await plan(g,s);
  if(!regions)throw new Error('This square is outside the registered master plan. Copy the coordinates instead.');
  if(document.fonts?.ready)await document.fonts.ready;
  g.save();g.beginPath();g.rect(0,0,EDGE,EDGE);g.clip();
  for(const r of s.rows){
   for(const part of r.parts){path(g,part.poly,part.closed);g.fillStyle='#ff6a131b';g.strokeStyle='#17475c';g.lineWidth=5;g.setLineDash(part.standard?[18,12]:[]);if(part.closed)g.fill();g.stroke();g.setLineDash([]);
    for(const d of part.doors){for(const l of d.arcs.concat(d.leaves)){if(l.length<2)continue;path(g,l,false);g.strokeStyle='#fff';g.lineWidth=14;g.stroke();g.strokeStyle='#006ad4';g.lineWidth=7;g.stroke();}
     const [x,y]=point(d.mid),len=72,dx=d.out[0]*len,dy=d.out[1]*len;g.beginPath();g.moveTo(x,y);g.lineTo(x+dx,y+dy);g.lineTo(x+dx*.65-dy*.22,y+dy*.65+dx*.22);g.moveTo(x+dx,y+dy);g.lineTo(x+dx*.65+dy*.22,y+dy*.65-dx*.22);g.strokeStyle='#fff';g.lineWidth=18;g.stroke();g.strokeStyle='#006ad4';g.lineWidth=9;g.stroke();
    }
   }
  }
  const occupied=[];
  for(const r of s.rows){const anchors=r.points.length?r.points:r.parts.flatMap(p=>p.poly.filter(C.inside));const p=anchors[0]||[Math.max(-24,Math.min(24,r.parts[0].poly[0][0])),Math.max(-24,Math.min(24,r.parts[0].poly[0][1]))];const [x,y]=point(p),label=r.n+' · '+r.code+' '+r.symbols.map(s=>s.glyph||'').join(' ');g.font='800 48px GC500MapUnits1147,Inter,sans-serif';const w=g.measureText(label).width+30,h=70;let bx=Math.max(6,Math.min(EDGE-w-6,x+20)),by=Math.max(80,Math.min(EDGE-h-100,y-95));
   for(let n=0;n<14&&occupied.some(b=>bx<b.x+b.w&&bx+w>b.x&&by<b.y+b.h&&by+h>b.y);n++)by=Math.max(6,Math.min(EDGE-h-6,by+78));
   occupied.push({x:bx,y:by,w,h});g.strokeStyle='#17475c';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(bx+Math.min(w/2,40),by+h/2);g.stroke();g.fillStyle='#132c3eef';g.beginPath();g.roundRect(bx,by,w,h,12);g.fill();g.fillStyle='#fff';g.textBaseline='middle';g.fillText(label,bx+15,by+h/2);
  }
  // The central cross marks the chosen spot without hiding a door or unit underneath it.
  g.strokeStyle='#fff';g.lineWidth=15;g.beginPath();g.moveTo(EDGE/2-35,EDGE/2);g.lineTo(EDGE/2+35,EDGE/2);g.moveTo(EDGE/2,EDGE/2-35);g.lineTo(EDGE/2,EDGE/2+35);g.stroke();g.strokeStyle='#e45300';g.lineWidth=7;g.stroke();
  g.strokeStyle='#e45300';g.lineWidth=12;g.strokeRect(6,6,EDGE-12,EDGE-12);g.restore();
  g.fillStyle='#102332';g.fillRect(0,EDGE,EDGE,BAND);g.fillStyle='#fff';g.font='800 65px Inter,sans-serif';g.fillText('50 m × 50 m · NORTH ↑',50,EDGE+90);g.font='500 43px Inter,sans-serif';g.fillText('Centre '+s.pin.ll.lat.toFixed(6)+', '+s.pin.ll.lon.toFixed(6)+' · '+s.rows.length+' mapped entries · full list in message',50,EDGE+165);
  g.font='500 35px Inter,sans-serif';g.fillText('Blue arrows: plan door direction · Drawing © iEDM D001 rev 03 · image registration, not survey',50,EDGE+225);g.fillText('Author: Andrew Fisher · Captured '+when(new Date(s.pin.at)),50,EDGE+280);
  return await new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(b):reject(new Error('The map picture could not be made.')),'image/png'));
 }
 function render(){
  if(!card||!current)return;let box=card.querySelector('[data-area1206]');if(!box){box=document.createElement('div');box.dataset.area1206='';card.querySelector('.sp-note').after(box);}
  box.innerHTML='<b>50 m × 50 m · north up</b><details><summary>'+current.rows.length+' mapped entries · equipment and doors</summary><ul>'+current.rows.map(r=>'<li><b>'+r.n+'. '+esc(r.code)+' <span class="area1206-icon">'+r.symbols.map(s=>esc(s.glyph||'')).join(' ')+'</span></b> · '+esc(r.descriptions.join('; '))+'<small>'+esc(doorWords(r))+(r.loading.length?'<br>Truck loading: '+esc(loadingWords(r).join('; ')):'')+'</small></li>').join('')+'</ul><p>Includes mapped footprints crossing the boundary. Reference quantities are not a count of individually positioned units.</p></details><div role="status" data-area1206-status>'+esc(running?'Preparing the detailed map…':lastError||'Map and item list ready')+'</div>'+(previewUrl?'<details><summary>Preview map</summary><a href="'+previewUrl+'" target="_blank" rel="noopener"><img alt="50 metre square with equipment symbols and door arrows" src="'+previewUrl+'"></a></details>':'');
  const button=card.querySelector('[data-sp="share"]');button.textContent='Share 50 m area';button.disabled=!prepared||running;
 }
 async function prepare(){
  if(running)return;running=true;render();
  while(current){const n=serial,s=current;try{const blob=await picture(s);if(n!==serial)continue;prepared={blob,text:words(s),name:'GC500-50m-area-'+s.pin.ll.lat.toFixed(6)+'_'+s.pin.ll.lon.toFixed(6)+'.png'};previewUrl=URL.createObjectURL(blob);lastError='';break;}catch(e){if(n!==serial)continue;lastError='Map unavailable: '+String(e.message||e)+'. Copy still includes the area list.';break;}}
  running=false;render();
 }
 const boundary=document.createElementNS('http://www.w3.org/2000/svg','svg');boundary.id='area1206-boundary';boundary.setAttribute('aria-hidden','true');boundary.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8';stage.appendChild(boundary);
 function outline(){
  if(!current){boundary.replaceChildren();return;}
  const F=current.F,mainPoint=ap(inv(GEO.main.sheet_to_z18px),...F.centre),useInset=!geoOn()&&GEO.inset&&(!C.rect(GEO.main.sheet_region_pts,mainPoint)||(GEO.main.exclude_pts||[]).some(r=>C.rect(r,mainPoint))),I=inv((useInset?GEO.inset:GEO.main).sheet_to_z18px),M=sheetToDevice(currentView().scale,sw,sh);
  const pts=[[-25,-25],[25,-25],[25,25],[-25,25]].map(p=>{const q=ap(I,...F.world(p)),z=applyM(M,...q);return z.x+','+z.y;}).join(' ');boundary.setAttribute('viewBox','0 0 '+sw+' '+sh);
  boundary.innerHTML='<polygon points="'+pts+'" fill="#ff6a1314" stroke="white" stroke-width="4"/><polygon points="'+pts+'" fill="none" stroke="#e45300" stroke-width="2" stroke-dasharray="8 5"/>';
 }
 const draw0=drawMarks;drawMarks=function(){const r=draw0.apply(this,arguments);outline();return r;};
 function update(pin,c){
  serial++;current=snapshot(pin);prepared=null;lastError='';card=c||card;if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl='';}outline();if(!current)return;render();void prepare();
 }
 function download(file){const a=document.createElement('a'),url=URL.createObjectURL(file);a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 async function share(){
  if(!prepared||running)return 'pending';const p=prepared,file=new File([p.blob],p.name,{type:'image/png'});
  try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:'GC500 · 50 m × 50 m area',text:p.text,files:[file]});toast('Share menu closed. Delivery is handled by the app you chose.');return 'files';}
   if(navigator.share){await navigator.share({title:'GC500 · 50 m × 50 m area',text:p.text});download(file);toast('Share menu closed; the map picture was saved separately.');return 'text';}
  }catch(e){if(e.name==='AbortError'){toast('Share cancelled. Nothing was sent.');return 'aborted';}}
  download(file);let copied=false;try{await navigator.clipboard.writeText(p.text);copied=true;}catch(_){}
  toast(copied?'Area map saved and full item list copied. Paste both into your message.':'Area map saved. Use Copy for the item list.');return copied?'copied':'saved';
 }
 const css=document.createElement('style');css.textContent='#spot1117{max-height:calc(100% - 20px);overflow:auto}#spot1117 [data-area1206]{margin-top:8px;font-size:13px}#spot1117 [data-area1206] details{margin-top:6px}#spot1117 [data-area1206] summary{cursor:pointer;min-height:30px}#spot1117 [data-area1206] ul{padding-left:18px;max-height:180px;overflow:auto}#spot1117 [data-area1206] li{margin-bottom:9px}#spot1117 [data-area1206] small{display:block;color:#c8c6c2;margin-top:3px}#spot1117 .area1206-icon{font-family:GC500MapUnits1147,Inter,sans-serif}#spot1117 [data-area1206] img{display:block;width:100%;height:auto}#spot1117 [data-area1206-status]{color:#ffb172;margin-top:6px}#spot1117 button:disabled{opacity:.55;cursor:wait}';document.head.appendChild(css);
 return Object.freeze({version:'v12.06',update,snapshot,picture,words:()=>words(current),share,doorWords,get state(){return {ready:!!prepared&&!running,preparing:running,error:lastError,entries:current?.rows.length||0,rows:current?.rows||[],width:EDGE,height:EDGE+BAND};}});
}
