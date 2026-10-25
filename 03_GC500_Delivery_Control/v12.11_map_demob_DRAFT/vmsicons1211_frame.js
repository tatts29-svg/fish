/* Author: Andrew Fisher. Crisp numbered VMS signs; shared pins remain exact with separate, linked labels. */
function vmsIcons1211(){
 'use strict';
 // A VMS can be on an approach road outside the paper plan. Let an explicit
 // search fit those known positions without changing or clipping the actual pins.
 let searchBounds=null;
 const clamp0=clampCamera;
 clampCamera=function(){const before={...camera};clamp0();if(!searchBounds)return;
  camera.cx=clamp(before.cx,Math.min(geoOn()&&GB?GB.x0-150:0,searchBounds.x0),Math.max(geoOn()&&GB?GB.x1+150:SHEET_W,searchBounds.x1));
  camera.cy=clamp(before.cy,Math.min(geoOn()&&GB?GB.y0-150:0,searchBounds.y0),Math.max(geoOn()&&GB?GB.y1+150:SHEET_H,searchBounds.y1));
  camera.z=clamp(before.z,Math.min(MIN_Z,searchBounds.z),MAX_Z);
 };
 function fitKnown(rect,label){const [x0,y0,x1,y1]=rect,rot=camera.rot||0,z=Math.max(.005,Math.min(MAX_Z,fitZoomFor(x1-x0,y1-y0,rot,150)));
  searchBounds={x0,y0,x1,y1,z};stopCameraMotion813();document.querySelectorAll('.jump.active').forEach(e=>e.classList.remove('active'));setLabel(label);
  glideCamera887({cx:(x0+x1)/2,cy:(y0+y1)/2,z,rot});
 }
 window.fitSearch1211=(rect,label)=>fitKnown(rect,label);
 const clear0=clearSelection813;clearSelection813=function(){searchBounds=null;return clear0.apply(this,arguments);};
 const goto0=gotoRect;gotoRect=function(rect,label){if(selected?.location1210?.kind==='vms')return fitKnown(geoRect(rect),label);return goto0.apply(this,arguments);};
 const oldLabel=label1009;label1009=function(ctx,it){if(it.location1210?.kind==='vms')return;return oldLabel.apply(this,arguments);};
 const root=document.createElement('div');root.id='vmsicons1211';root.setAttribute('aria-label','VMS board map markers');stage.appendChild(root);
 const css=document.createElement('style');css.textContent=`#vmsicons1211{position:absolute;inset:0;z-index:8;pointer-events:none;overflow:hidden}#vmsicons1211>svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}#vmsicons1211 button{position:absolute;width:76px;height:64px;padding:0;border:0;background:transparent;box-shadow:none;pointer-events:auto;cursor:pointer;color:white;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;filter:drop-shadow(0 2px 2px #000a)}#vmsicons1211 button>svg{width:44px;height:40px;flex-shrink:0}#vmsicons1211 button b{font:800 12px/18px Inter,sans-serif;white-space:nowrap;padding:0 5px;border:1px solid white;border-radius:4px;background:#121923;color:#ffe28a}#vmsicons1211 button:focus-visible{outline:3px solid #fff;outline-offset:2px}#vmsicons1211 button[aria-pressed=true] b{background:#e95700;color:white}#vmsicons1211 button[data-departed=true] b{background:#075239;color:white}#vmsicons1211 button small{font:800 9px/12px Inter,sans-serif;background:#075239;padding:0 3px;border-radius:2px}`;document.head.appendChild(css);
 const NS='http://www.w3.org/2000/svg',lines=document.createElementNS(NS,'svg');lines.setAttribute('aria-hidden','true');root.appendChild(lines);let signature='',shown=[],rawPoints=[],nodes=new Map(),reserved=[],reservedSize='';
 const sign='<svg viewBox="0 0 44 40" aria-hidden="true"><path d="M13 28v7M31 28v7M8 36h28" fill="none" stroke="#fff" stroke-width="4"/><rect x="2" y="2" width="40" height="27" rx="4" fill="#131820" stroke="#fff" stroke-width="4"/><rect x="3" y="3" width="38" height="25" rx="3" fill="#131820" stroke="#ffbd37" stroke-width="2"/><path d="M9 10h16M9 15h23M9 20h16M25 9l7 6-7 6" fill="none" stroke="#ffca47" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 4"/></svg>';
 function cluster(points){
  const pinned=points.filter(p=>p.selected),fixed=points.filter(p=>pinned.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<.5)),todo=points.filter(p=>!fixed.includes(p)),groups=[];
  while(todo.length){const group=[todo.shift()];for(let j=todo.length-1;j>=0;j--)if(Math.hypot(group[0].x-todo[j].x,group[0].y-todo[j].y)<70)group.push(todo.splice(j,1)[0]);groups.push(group);}
  return fixed.concat(groups.flatMap(g=>g.length<3||g.every(p=>Math.hypot(p.x-g[0].x,p.y-g[0].y)<.5)?g:[{code:'group:'+g.map(p=>p.code).sort().join('|'),label:'VMS × '+g.length,place:0,x:g.reduce((a,p)=>a+p.x,0)/g.length,y:g.reduce((a,p)=>a+p.y,0)/g.length,selected:false,departed:g.every(p=>p.departed),members:g}]));
 }
 function zoomGroup(p){const boxes=p.members.flatMap(m=>ITEMS.find(it=>it.code===m.code)?.places.map(b=>geoRect(b))||[]);if(!boxes.length)return;
  const x0=Math.min(...boxes.map(b=>b[0])),y0=Math.min(...boxes.map(b=>b[1])),x1=Math.max(...boxes.map(b=>b[2])),y1=Math.max(...boxes.map(b=>b[3])),pad=Math.max(8,Math.max(x1-x0,y1-y0)*.05);fitKnown([x0-pad,y0-pad,x1+pad,y1+pad],p.members.map(m=>m.label).join(' · '));
 }
 function exclusions(){const size=sw+':'+sh;if(reservedSize===size)return reserved;reservedSize=size;const r=stage.getBoundingClientRect();reserved=[...stage.querySelectorAll('button,input,#rose,#toast,#qual,#viewName,#mini')].filter(e=>!root.contains(e)).map(e=>{const b=e.getBoundingClientRect();return {left:b.left-r.left,top:b.top-r.top,width:b.width,height:b.height};}).filter(b=>b.width&&b.height);return reserved;}
 function layout(points,w,h,avoid=[]){
  const blocked=(x,y)=>avoid.some(q=>x<q.left+q.width+3&&x+78>q.left-3&&y<q.top+q.height+3&&y+66>q.top-3)?1000:0;
  const placed=[];for(const p of points){let best=null,score=Infinity;
   for(let row=0;row<5;row++)for(const dx of [0,-82,82,-164,164]){const x=Math.max(2,Math.min(w-78,p.x-38+dx)),y=Math.max(2,Math.min(h-66,p.y-66-row*68));const overlaps=blocked(x,y)+placed.filter(q=>x<q.left+78&&x+78>q.left&&y<q.top+66&&y+66>q.top).length,s=overlaps*100000+Math.abs(dx)+row*80;
    if(s<score){score=s;best={...p,left:x,top:y};}}
   if(score>=100000)for(let y=2;y<=h-66;y+=68)for(let x=2;x<=w-78;x+=80){const overlaps=blocked(x,y)+placed.filter(q=>x<q.left+78&&x+78>q.left&&y<q.top+66&&y+66>q.top).length,s=overlaps*100000+Math.hypot(x-(p.x-38),y-(p.y-66));if(s<score){score=s;best={...p,left:x,top:y};}}
   placed.push(best);
  }return placed;
 }
 function paint(v){
  const candidates=[...new Map(marks.map(m=>m.it).concat(selected?[selected]:[]).filter(it=>it.location1210?.kind==='vms').map(it=>[it.code,it])).values()].sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
  const M=sheetToDevice(v.scale,sw,sh),points=[];
  for(const it of candidates)it.places.forEach((b,place)=>{const g=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),p=applyM(M,g.x,g.y);if(p.x<0||p.y<0||p.x>sw||p.y>sh)return;points.push({code:it.code,label:it.sourceLabel1210||it.code,place,x:p.x,y:p.y,selected:selected===it,departed:mapStatus1009(it)?.departure1211?.complete===true});});
  const next=JSON.stringify([sw,sh,points.map(p=>({...p,x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10}))]);if(next===signature)return;signature=next;rawPoints=points;shown=layout(cluster(points),sw,sh,exclusions());const live=new Set(shown.map(p=>p.code+':'+p.place));for(const [key,n] of nodes)if(!live.has(key)){n.button.remove();n.line.remove();n.dot.remove();nodes.delete(key);}
  for(const p of shown){const key=p.code+':'+p.place;let n=nodes.get(key);
   if(!n){const line=document.createElementNS(NS,'path');line.setAttribute('stroke','#ffce56');line.setAttribute('stroke-width','2');lines.appendChild(line);const dot=document.createElementNS(NS,'circle');dot.setAttribute('r','3');dot.setAttribute('fill','#ffce56');dot.setAttribute('stroke','#111');lines.appendChild(dot);
    const button=document.createElement('button');button.type='button';button.dataset.vms1211=p.code;button.style.left='0';button.style.top='0';button.innerHTML=sign;const label=document.createElement('b');button.appendChild(label);const note=document.createElement('small');note.textContent='LEFT SITE';button.appendChild(note);button.onclick=ev=>{ev.stopPropagation();const item=shown.find(x=>x.code===button.dataset.vms1211);if(item?.members)zoomGroup(item);else if(item)GC500Search1210.select(item.code,item.place);};root.appendChild(button);n={button,label,note,line,dot};nodes.set(key,n);
   }
   n.line.setAttribute('d','M'+(p.left+38)+' '+(p.top+58)+'L'+p.x+' '+p.y);n.dot.setAttribute('cx',p.x);n.dot.setAttribute('cy',p.y);n.button.style.transform='translate('+p.left+'px,'+p.top+'px)';n.button.dataset.departed=String(p.departed);n.button.dataset.cluster=String(!!p.members);n.button.title=p.members?p.members.map(m=>m.label).join(', '):p.label;n.button.setAttribute('aria-label',p.members?p.members.length+' VMS boards · zoom to numbered signs':p.label+(p.departed?' · left site':'')+' · show board location');n.button.setAttribute('aria-pressed',String(p.selected));if(n.label.textContent!==p.label)n.label.textContent=p.label;n.note.style.display=p.departed?'block':'none';
  }
 }
 const draw=drawMarks;drawMarks=function(v){const result=draw.apply(this,arguments);paint(v);return result;};
 window.GC500VmsIcons1211=Object.freeze({layout,cluster,get points(){return rawPoints.map(p=>({...p}));},get state(){return shown.map(p=>({...p}));}});requestPaint();
}
