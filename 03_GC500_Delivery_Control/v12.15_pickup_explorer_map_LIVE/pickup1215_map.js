/* Author: Andrew Fisher. Pickup maps use the active Explorer layers and orientation. */
 function pickupTarget1213(s,map){
  const pts=(map?.points||[]).filter(p=>p.length===2&&p.every(Number.isFinite));
  const p=pts.slice().sort((a,b)=>Math.hypot(...a)-Math.hypot(...b))[0]||[0,0],w=s.F.world(p),N=512*2**18;
  const ll={lat:Math.atan(Math.sinh(Math.PI*(1-2*w[1]/N)))*180/Math.PI,lon:w[0]/N*360-180};
  return {point:p,ll,label:pts.length?'Mapped position for '+map.code:'Selected spot; reference footprint crosses this area',basis:pts.length>1?'Nearest mapped occurrence in this selected area; individual unit position not established.':pts.length?'Recorded map reference; individual unit position not established.':'No separate reference point inside the square; destination is the selected spot.'};
 }
 const pickupMaps1215=new WeakMap();
 function pickupView1215(){return {mode,opacity,bright,insetOn,legendOn,rotation:camera.rot,label:mode==='satellite'?'Satellite only':mode==='hybrid'?'Satellite + plan':'Original plan'};}
 const pickupViewKey1215=()=>JSON.stringify(pickupView1215());
 function pickupFrame1215(s){
  const main=ap(inv(GEO.main.sheet_to_z18px),...s.F.centre),useInset=!geoOn()&&GEO.inset&&(!C.rect(GEO.main.sheet_region_pts,main)||(GEO.main.exclude_pts||[]).some(r=>C.rect(r,main))),R=useInset?GEO.inset:GEO.main,I=inv(R.sheet_to_z18px),centre=ap(I,...s.F.centre),rotation=camera.rot;
  const worldToSheet=p=>ap(I,...s.F.world(p)),turn=sheetToDevice(1,0,0,centre[0],centre[1],rotation),square=[[-25,-25],[25,-25],[25,25],[-25,25]],bb=C.bounds(square.map(p=>{const q=applyM(turn,...worldToSheet(p));return [q.x,q.y];}));
  const scale=(EDGE-360)/Math.max(bb[2]-bb[0],bb[3]-bb[1]),EX=sheetToDevice(scale,EDGE,EDGE,centre[0],centre[1],rotation),EI=invertM(EX),bounds=C.bounds([[0,0],[EDGE,0],[EDGE,EDGE],[0,EDGE]].map(p=>{const q=applyM(EI,...p);return [q.x,q.y];}));
  return {EX,scale,v:{x:bounds[0],y:bounds[1],w:bounds[2]-bounds[0],h:bounds[3]-bounds[1],scale},at:p=>{const q=applyM(EX,...worldToSheet(p));return [q.x,q.y];},square,view:pickupView1215(),token:pickupViewKey1215()};
 }
 async function pickupBase1215(s){
  const F=pickupFrame1215(s),{v,EX}=F,cv=document.createElement('canvas');cv.width=cv.height=EDGE;const g=cv.getContext('2d');
  const fresh=()=>{if(F.token!==pickupViewKey1215())throw new Error('Map view changed. Prepare the pickup pack again.');};
  if(!['original','hybrid','satellite'].includes(F.view.mode))throw new Error('Use a 2D Map Explorer view to prepare the pickup map.');
  if(F.view.mode!=='satellite')await ensureScene();fresh();
  if(F.view.mode==='original'&&UNDER.length){if(OFFSCREEN_OK&&!underWorkerFailed)await underlayJob();if(!underComp)await Promise.all(UNDER.map(u=>underPatch(u).p));}fresh();
  g.fillStyle=F.view.mode==='original'?'#fff':'#17120f';g.fillRect(0,0,EDGE,EDGE);
  // The same underlay, vector worker, satellite tiles and registration used by Explorer's PNG export.
  if(F.view.mode==='original'){
   g.save();g.setTransform(...EX);
   if(UNDER.length&&PYR){
    if(underComp){const b=underComp.bbox;if(underComp[1])g.drawImage(underComp[1],b[0],b[1],b[2]-b[0],b[3]-b[1]);else{const T=underComp.tiles1,sx=(b[2]-b[0])/T.pw,sy=(b[3]-b[1])/T.ph;for(const q of T.tiles)g.drawImage(q.bm,b[0]+q.x*sx,b[1]+q.y*sy,q.w*sx,q.h*sy);}}
    for(const u of UNDER){if(underComp&&underComp.files.has(u.file))continue;const im=underImgs.get(u.file),bm=im&&(im.bm[1]||im.bm[2]||im.bm[4]);if(bm)g.drawImage(bm,...[u.bbox[0],u.bbox[1],u.bbox[2]-u.bbox[0],u.bbox[3]-u.bbox[1]]);}
   }else if(preview||overview)g.drawImage(preview||overview,0,0,SHEET_W,SHEET_H);
   g.restore();
  }else{
   const keep=new Set(keepWanted),jobs=[];
   try{
    for(const R of regionsForTiles(v)){
     const {z}=tileZoomFor({...v,scale:F.scale/dpr},R.M),f=2**(z-18),M=mul([[f,0,0],[0,f,0],[0,0,1]],R.M),I=inv(M),[x0,y0,x1,y1]=R.rect;
     const xs=[Math.max(v.x,x0),Math.min(v.x+v.w,x1)],ys=[Math.max(v.y,y0),Math.min(v.y+v.h,y1)];if(xs[1]<=xs[0]||ys[1]<=ys[0])continue;
     const corners=xs.flatMap(x=>ys.map(y=>ap(M,x,y))),tx0=Math.floor(Math.min(...corners.map(p=>p[0]))/TILE),tx1=Math.floor(Math.max(...corners.map(p=>p[0]))/TILE),ty0=Math.floor(Math.min(...corners.map(p=>p[1]))/TILE),ty1=Math.floor(Math.max(...corners.map(p=>p[1]))/TILE);
     if((tx1-tx0+1)*(ty1-ty0+1)>120)throw new Error('This map needs too many imagery tiles. Zoom closer and prepare it again.');
     const needed=[];for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const key=tileKey(z,tx,ty);keepWanted.add(key);if(!tiles.get(key)?.bm)requestTile(z,tx,ty,0,'keep');needed.push([tx,ty]);}
     jobs.push({R,z,I,tx0,ty0,nx:tx1-tx0+1,ny:ty1-ty0+1,needed});
    }
    if(!jobs.length)throw new Error('Satellite imagery is unavailable for this area.');
    const started=performance.now();while(jobs.some(j=>j.needed.some(([x,y])=>!tiles.get(tileKey(j.z,x,y))?.bm))&&performance.now()-started<20000){fresh();await new Promise(r=>setTimeout(r,120));}
    fresh();if(jobs.some(j=>j.needed.some(([x,y])=>!tiles.get(tileKey(j.z,x,y))?.bm)))throw new Error('Some satellite tiles did not load. Retry when the imagery is ready.');
    for(const j of jobs){const {R,I,tx0,ty0,nx,ny}=j,key='pickup1215-'+crypto.randomUUID(),mz=mosaicFor(key,j.z,tx0,ty0,nx,ny);
     try{for(const [x,y] of j.needed)mz.put(x-tx0,y-ty0,tiles.get(tileKey(j.z,x,y)),null,null);
      g.save();g.setTransform(...EX);g.beginPath();g.rect(R.rect[0],R.rect[1],R.rect[2]-R.rect[0],R.rect[3]-R.rect[1]);for(const h of R.holes)g.rect(h[0],h[1],h[2]-h[0],h[3]-h[1]);g.clip('evenodd');g.transform(I[0][0],I[1][0],I[0][1],I[1][1],I[0][2],I[1][2]);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(mz.canvas,0,0,nx*TILE,ny*TILE,tx0*TILE,ty0*TILE,nx*TILE,ny*TILE);g.setTransform(...EX);if(F.view.bright!==1){g.fillStyle=F.view.bright<1?'rgba(0,0,0,'+(1-F.view.bright)+')':'rgba(255,255,255,'+((F.view.bright-1)*.8)+')';g.fillRect(R.rect[0],R.rect[1],R.rect[2]-R.rect[0],R.rect[3]-R.rect[1]);}g.restore();
     }finally{mz.canvas.width=mz.canvas.height=0;mosaics.delete(key);}
    }
   }finally{for(const j of jobs)for(const [x,y] of j.needed){const k=tileKey(j.z,x,y);if(!keep.has(k))keepWanted.delete(k);}}
  }
  if(F.view.mode!=='satellite'){
   const {svg}=await svgFromWorker(v,Math.min(8192,Math.ceil(v.w*F.scale)),Math.min(8192,Math.ceil(v.h*F.scale)),false,F.view.mode),loaded=await loadSvg(svg).promise;
   try{fresh();g.save();g.setTransform(...EX);g.globalAlpha=F.view.mode==='hybrid'?F.view.opacity:1;g.drawImage(loaded.img,v.x,v.y,v.w,v.h);g.restore();}finally{URL.revokeObjectURL(loaded.url);}
  }
  drawGate6Revision1021(g,EX,EDGE/900);
  if(window.GC500FencingMap)window.GC500FencingMap.exportLayer(g,{width:EDGE,height:EDGE,dpr:EDGE/900,project:(p,r)=>{const q=geoOn()&&r==='inset'?ap(TIN,...p):p,d=applyM(EX,...q);return [d.x,d.y];}});
  // Read the same reference and equipment symbols as Explorer; fit labels to the print canvas, never the live canvas.
  await document.fonts.ready;g.setTransform(1,0,0,1,0,0);g.font='800 76px GC500MapUnits1147,Inter,sans-serif';g.textAlign='left';g.textBaseline='middle';
  for(const m of marks)for(const b of m.it.places){const p=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),q=applyM(EX,p.x,p.y);if(q.x<0||q.y<0||q.x>EDGE||q.y>EDGE)continue;
   const label=fitReference1010(m.it,mapStatus1009(m.it),1200,t=>g.measureText(t).width),w=Math.min(1250,g.measureText(label).width+50),x=Math.max(12,Math.min(EDGE-w-12,q.x+40)),y=Math.max(70,Math.min(EDGE-170,q.y-90));g.fillStyle='#101c23';g.strokeStyle=m.c;g.lineWidth=5;g.beginPath();g.roundRect(x,y-55,w,110,16);g.fill();g.stroke();g.fillStyle='#fff';g.fillText(label,x+25,y);
  }
  g.textBaseline='alphabetic';
  fresh();return {...F,canvas:cv,credit:F.view.mode==='original'?'Drawing © iEDM D001 rev 03':(SOURCE==='google'?'Google · '+gCopy:'© Mapbox © OpenStreetMap © Maxar')+(F.view.mode==='hybrid'?' · Drawing © iEDM D001 rev 03':'')};
 }
 async function pickupPicture1213(s,focus=null){
  let task=pickupMaps1215.get(s);if(!task){task=pickupBase1215(s);pickupMaps1215.set(s,task);task.catch(()=>pickupMaps1215.delete(s));}
  const base=await task;if(base.token!==pickupViewKey1215())throw new Error('Map view changed. Prepare the pickup pack again.');
  await document.fonts.ready;const cv=document.createElement('canvas');cv.width=EDGE;cv.height=EDGE+BAND;const g=cv.getContext('2d');g.drawImage(base.canvas,0,0);
  const trace=points=>{g.beginPath();points.forEach((p,i)=>i?g.lineTo(...base.at(p)):g.moveTo(...base.at(p)));g.closePath();};
  trace(base.square);g.strokeStyle='#fff';g.lineWidth=16;g.stroke();g.setLineDash([28,20]);g.strokeStyle='#e95700';g.lineWidth=8;g.stroke();g.setLineDash([]);
  for(const r of focus?[focus]:s.rows){const t=pickupTarget1213(s,r),p=base.at(t.point);g.beginPath();g.arc(...p,34,0,Math.PI*2);g.fillStyle='#e95700';g.strokeStyle='#fff';g.lineWidth=10;g.fill();g.stroke();
   const label='PICKUP '+r.code;g.font='800 95px Inter,sans-serif';const w=g.measureText(label).width+48,x=Math.max(12,Math.min(EDGE-w-12,p[0]+52)),y=Math.max(115,Math.min(EDGE-200,p[1]-52));g.fillStyle='#132c3e';g.fillRect(x,y-100,w,135);g.fillStyle='#fff';g.fillText(label,x+24,y);
  }
  g.fillStyle='#132c3ef0';g.fillRect(0,EDGE-100,EDGE,100);g.fillStyle='#fff';g.font='500 48px Inter,sans-serif';g.fillText(base.credit,35,EDGE-35);
  g.fillStyle='#102332';g.fillRect(0,EDGE,EDGE,BAND);g.fillStyle='#fff';g.font='800 64px Inter,sans-serif';g.fillText('MAP EXPLORER · '+base.view.label+' · 50 m × 50 m',50,EDGE+85);
  g.font='500 42px Inter,sans-serif';g.fillText('Same map style and orientation as Explorer · Orange dots: pickup destinations',50,EDGE+155);g.fillText('Door and loading directions are in the written details.',50,EDGE+215);g.fillText('Author: Andrew Fisher · Map registration, not a survey',50,EDGE+275);
  const blob=await new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('Pickup map export failed.')),'image/png'));cv.width=cv.height=1;
  return {blob,target:pickupTarget1213(s,focus),view:base.view,viewToken:base.token};
 }
