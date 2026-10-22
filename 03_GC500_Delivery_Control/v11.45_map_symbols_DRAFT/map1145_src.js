/* Author: Andrew Fisher. Map explorer symbols and separate servicing-area highlights.
   Display only. Shared register/status supplies kinds; existing servicing geometry supplies areas. */
(function(W){
'use strict';
const DATA1145=__SYMBOLS1145__;
const COLORS=['#e6534b','#2187c7','#42945a','#8958bd','#b84b87','#806052','#d77d26','#248d97','#939339','#515da7','#32816e','#576b7b','#6c7281','#ba6944'];
function kind(value){
 const s=String(value||'').toLowerCase();
 if(/waste.*tank|sewer.*tank|holding.*tank|effluent.*tank/.test(s))return 'tank';
 if(/pee[ -]?panel|urinal/.test(s))return 'pee';
 if(/accessible|disabled|\baccess\b/.test(s))return 'accessible';
 if(/16[ -]?pan|pan16/.test(s))return 'pan16';
 if(/toilet.*trailer|trailer.*toilet/.test(s))return 'trailer';
 if(/toilet.*block|ablution|\bblock\b/.test(s))return 'block';
 if(/sewer/.test(s))return 'sewer';
 if(/toilet|\bfwf\b|pump_only/.test(s))return 'toilet';
 if(/generator|kva\b/.test(s))return 'generator';
 if(/light.*tower|tower.*light/.test(s))return 'light';
 if(/\bvms\b|message.*sign/.test(s))return 'vms';
 if(/barrier|\btl[123]\b/.test(s))return 'barrier';
 if(/forklift|scissor|boom|tyne|fork extension|access & plant/.test(s))return 'plant';
 if(/building|ticket.*box|container|office|site.*shed/.test(s))return 'building';
 return 'unknown';
}
function kinds(it,status){
 const rows=status?.quantity1010?.items||[];
 let out=rows.map(r=>kind([r.kind,r.type,r.item,r.label,r.description].filter(Boolean).join(' ')));
 if(!out.length||out.every(k=>k==='unknown'))out=[kind([it?.reg?.type,it?.reg?.name,it?.reg?.description,it?.cat?.name].filter(Boolean).join(' '))];
 return [...new Set(out)];
}
let areaMemo=null,areaD=null,areaG=null;
function areas(){
 if(typeof SVC1067_DATA==='undefined'||typeof SVC1099_MAP_DATA==='undefined'||typeof SvcMap1099==='undefined')return [];
 const D=SVC1067_DATA,G=SVC1099_MAP_DATA;
 if(areaMemo&&areaD===D&&areaG===G)return areaMemo;
 const sx=G.px[0]/(G.rect[2]-G.rect[0]),sy=G.px[1]/(G.rect[3]-G.rect[1]);
 areaMemo=D.areas.map((a,i)=>{
  const points=[];
  a.refs.forEach(r=>Object.values(G.refs[r.ref]?.lines||{}).forEach(l=>{
   const p=l.point;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=G.rect[0]&&p.x<=G.rect[2]&&p.y>=G.rect[1]&&p.y<=G.rect[3])points.push({x:(p.x-G.rect[0])*sx,y:(p.y-G.rect[1])*sy});
  }));
  const polygons=SvcMap1099.clusters(points,185).map(p=>SvcMap1099.envelope(p,22,G.px[0],G.px[1]).map(q=>({x:q.x/sx+G.rect[0],y:q.y/sy+G.rect[1]})));
  const located=a.refs.some(r=>{const g=G.refs[r.ref];return Array.isArray(g?.pin)||Object.values(g?.lines||{}).some(l=>Array.isArray(l.pin));});
  return {id:String(a.n),name:a.name,color:COLORS[i%COLORS.length],polygons,locationNote:located?'outside this drawing':'location not recorded'};
 });areaD=D;areaG=G;return areaMemo;
}
function frameMain(){
 'use strict';
 if(window.MapUnits1145)return;
 const H=parent.MapUnits1145;if(!H)return;
 let ready=false,filter='',paints=0,shown=[],lastAreas=[];
 const family='GC500MapUnits1145';
 // Already embedded application bytes: no font URL or extra request is needed.
 const face=new FontFace(family,Uint8Array.from(atob(H.data.font),c=>c.charCodeAt(0)));
 face.load().then(font=>{document.fonts.add(font);ready=true;requestPaint();}).catch(()=>{ready=false;});
 function reference(it,status){
  const ref=String(it?.reg?.sourceRequest1017?it.reg.sourceKey1017:it?.code||'');
  return ref+(ready?' '+H.kinds(it,status).map(k=>H.data.symbols[k].glyph).join(''):'');
 }
 window.referenceQuantity1010=reference;
 window.fitReference1010=function(it,status){return reference(it,status);};
 const areaCanvas=document.createElement('canvas');areaCanvas.id='areas1145';areaCanvas.setAttribute('aria-hidden','true');areaCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
 document.getElementById('marks').before(areaCanvas);
 const ctx=areaCanvas.getContext('2d');
 const css=document.createElement('style');css.textContent='body.in3d #areas1145,body.fencing-map #areas1145{display:none!important}';document.head.append(css);
 function draw(v){
  if(areaCanvas.width!==canvas.width||areaCanvas.height!==canvas.height){areaCanvas.width=canvas.width;areaCanvas.height=canvas.height;}
  ctx.clearRect(0,0,areaCanvas.width,areaCanvas.height);shown=[];
  if(filter==='off'||window.GC500FencingMap?.active||document.body.classList.contains('in3d'))return;
  lastAreas=H.areas();const M=sheetToDevice(dpr*v.scale,canvas.width,canvas.height),boxes=[];
  const project=p=>{const g=toGeo(p.x,p.y);return applyM(M,g.x,g.y);};
  for(const a of lastAreas){
   if(filter&&a.id!==filter)continue;
   let label=null;
   for(const poly of a.polygons){
    const pts=poly.map(project),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),b={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
    if(b.x+b.w<0||b.y+b.h<0||b.x>canvas.width||b.y>canvas.height)continue;
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
    ctx.fillStyle=a.color+(filter?'22':'12');ctx.fill();ctx.strokeStyle=a.color+'30';ctx.lineWidth=(filter?10:6)*dpr;ctx.stroke();ctx.strokeStyle=a.color;ctx.lineWidth=(filter?2.5:1.5)*dpr;ctx.stroke();
    if(!label||b.w*b.h>label.w*label.h)label=b;
   }
   if(!label)continue;shown.push(a.id);
   ctx.font=`800 ${12*dpr}px Inter,sans-serif`;
   const full='Area '+a.id+' · '+a.name;
   let text=full,max=filter?canvas.width-20*dpr:Math.min(290*dpr,Math.max(80*dpr,label.w));
   if(ctx.measureText(text).width>max&&!filter)text='Area '+a.id;
   while(text.length>8&&ctx.measureText(text).width>max)text=text.slice(0,-2)+'…';
   const w=ctx.measureText(text).width+16*dpr,h=26*dpr,x=Math.max(4*dpr,Math.min(canvas.width-w-4*dpr,label.x+label.w/2-w/2));
   let y=Math.max(4*dpr,Math.min(canvas.height-h-4*dpr,label.y-h/2));
   for(let tries=0;tries<4&&boxes.some(b=>x<b.x+b.w&&x+w>b.x&&y<b.y+b.h&&y+h>b.y);tries++)y+=h+3*dpr;
   if(y+h>canvas.height-4*dpr)continue;boxes.push({x,y,w,h});
   ctx.fillStyle='#101c23f2';ctx.strokeStyle=a.color;ctx.lineWidth=2*dpr;ctx.beginPath();ctx.roundRect(x,y,w,h,6*dpr);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(text,x+8*dpr,y+h/2);
  }paints++;
 }
 function select(id){
  const all=H.areas();if(id!==''&&id!=='off'&&!all.some(a=>a.id===id&&a.polygons.length))return false;
  filter=id;
  const pts=all.find(a=>a.id===id)?.polygons.flat();
  if(pts?.length){const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),pad=35;stopCameraMotion813();gotoRect([Math.min(...xs)-pad,Math.min(...ys)-pad,Math.max(...xs)+pad,Math.max(...ys)+pad],'Area '+id);}
  // Clear an old highlight immediately even when the map is just below the viewport.
  draw(currentView());requestPaint();return true;
 }
 window.MapUnits1145=Object.freeze({reference,draw,select,get state(){return {ready,filter,paints,shown:[...shown],areas:lastAreas.map(a=>({id:a.id,name:a.name,parts:a.polygons.length}))};}});
 H.controls(window);
}
function controls(win){
 const frame=win.frameElement;if(!frame||!frame.parentNode)return;
 let bar=document.getElementById('map1145-controls');if(bar)bar.remove();
 bar=document.createElement('section');bar.id='map1145-controls';bar.setAttribute('aria-label','Map area and equipment key');
 const label=document.createElement('label');label.textContent='Highlight area ';
 const select=document.createElement('select');select.setAttribute('aria-label','Highlight servicing area');select.setAttribute('data-ro','');
 for(const [value,text,disabled] of [['','All areas · separate outlines',false],['off','Hide area highlights',false],...areas().map(a=>[a.id,(a.id==='0'?'':`Area ${a.id} · `)+a.name+(a.polygons.length?'':' · '+a.locationNote),!a.polygons.length])]){const o=document.createElement('option');o.value=value;o.textContent=text;o.disabled=disabled;select.append(o);}
 select.onchange=()=>win.MapUnits1145.select(select.value);label.append(select);bar.append(label);
 const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Equipment symbols';details.append(summary);
 const key=document.createElement('div');key.className='map1145-key';
 for(const [name,s] of Object.entries(DATA1145.symbols)){
  const row=document.createElement('span');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 26 26');svg.setAttribute('aria-hidden','true');
  for(const line of s.lines){const p=document.createElementNS(svg.namespaceURI,'polyline');p.setAttribute('points',line.map(p=>p.join(',')).join(' '));svg.append(p);}
  row.append(svg,document.createTextNode(s.label));key.append(row);
 }details.append(key);bar.append(details);
 const hint=document.createElement('small');hint.textContent='Area numbers match the servicing sheets. Outlines group recorded locations; they are not surveyed boundaries.';bar.append(hint);
 frame.before(bar);
}
const style=document.createElement('style');style.id='map1145-style';style.textContent='#map1145-controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px 20px;padding:12px;border:1px solid #49616c;border-radius:10px;background:#111c22;color:#edf6fa;margin:10px 0}#map1145-controls label{display:flex;align-items:center;gap:10px;font-weight:750;flex:1;min-width:0}#map1145-controls select{min-width:0;max-width:100%;width:100%;padding:9px;background:#202e35;color:#fff;border:1px solid #68818d;border-radius:6px}#map1145-controls small{flex-basis:100%;color:#b8cbd4}#map1145-controls details{max-width:100%}#map1145-controls summary{cursor:pointer;font-weight:750;padding:8px}#map1145-controls details[open]{flex-basis:100%;order:2}.map1145-key{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;padding:10px}.map1145-key span{display:flex;align-items:center;gap:8px}.map1145-key svg{flex:none;width:28px;height:28px;fill:none;stroke:#a1f2ff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}@media(max-width:650px){#map1145-controls label{align-items:flex-start;flex-direction:column;flex-basis:100%}#map1145-controls{gap:6px;padding:10px}.map1145-key{grid-template-columns:1fr 1fr;font-size:12px;padding:5px;gap:10px 6px}}';document.head.append(style);
W.MapUnits1145=Object.freeze({kind,kinds,areas,controls,data:DATA1145,mount(win){if(win.MapUnits1145)return;const s=win.document.createElement('script');s.id='mapunits1145-frame';s.textContent='('+frameMain.toString()+')();';win.document.head.append(s);}});
})(window);
