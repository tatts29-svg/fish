/* Author: Andrew Fisher. Visible, correctly projected map locations without redrawing pictures.
 * A ring identifies a recorded location, not equipment size or verified completion.
 * Source polygons and door details stay at their actual scale and position. */
(function(W,D){
'use strict';
const NS='http://www.w3.org/2000/svg',entries=new Map(),pictures=new Map();let serial=0,timer=null;
const finite=Number.isFinite;
function capture(marker,p,dimensions){
 if(!marker||typeof marker.kind!=='string'||marker.kind==='unlocated'||!p||![p.x,p.y,p.width,p.height].every(finite)||p.width<=0||p.height<=0)return null;
 const width=dimensions?.width??p.width,height=dimensions?.height??p.height;
 if(![width,height].every(finite)||width<=0||height<=0)return null;
 return {width,height,location:{x:p.x,y:p.y},marker,parts:W.DemobShapes1297.projected(marker,p)||[]};
}
function frame(snapshot,view){return snapshot?{left:0,top:0,width:snapshot.width,height:snapshot.height,view,location:snapshot.location,marker:snapshot.marker,parts:snapshot.parts}:null;}
function colour(marker){return marker.kind==='reference'||marker.kind==='unassigned'?'#26edff':marker.colour||'#26edff';}
function path(points,close){return points?.length?points.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ')+(close?' Z':''):'';}
function doorPath(points){return points?.length===4?'M'+points[0].x+','+points[0].y+' C'+points.slice(1).map(p=>p.x+','+p.y).join(' '):path(points,false);}
function node(tag,attrs,parent){const e=D.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs||{}))e.setAttribute(k,String(v));if(parent)parent.appendChild(e);return e;}
function refresh(entry){
 const {host,svg,near}=entry,pane=host.closest('.pane'),bounds=host.getBoundingClientRect();
 const visible=intersection?near:bounds.width>0&&bounds.height>0&&bounds.bottom>0&&bounds.right>0&&bounds.top<W.innerHeight&&bounds.left<W.innerWidth;
 const active=!!(host.isConnected&&visible&&!D.hidden&&!host.closest('[hidden]')&&(!pane||pane.classList.contains('on'))&&host.getClientRects().length);
 const next=String(active);if(svg.dataset.active1298!==next)svg.dataset.active1298=next;
 const width=bounds.width;if(width<=0)return;
 const radius=22*entry.width/width;
 if(Math.abs(radius-entry.radius)<.05)return;entry.radius=radius;
 for(const ring of svg.querySelectorAll('.mb1298-ring,.mb1298-pulse'))ring.setAttribute('r',radius);
}
function detach(host){const old=entries.get(host);if(!old)return;intersection?.unobserve(host);resize?.unobserve(host);old.svg.remove();entries.delete(host);host.classList.remove('mb1298-host');}
function schedule(){if(timer!==null)return;timer=W.setTimeout(()=>{timer=null;for(const [host,entry]of entries){if(!host.isConnected)detach(host);else refresh(entry);}},0);}
const intersection=W.IntersectionObserver?new W.IntersectionObserver(changes=>{for(const c of changes){const e=entries.get(c.target);if(e){e.near=c.isIntersecting;refresh(e);}}},{threshold:0}):null;
const resize=W.ResizeObserver?new W.ResizeObserver(changes=>{for(const c of changes){const e=entries.get(c.target);if(e)refresh(e);}}):null;
function attach(host,layout){
 if(!host||!layout||!Array.isArray(layout.frames)||![layout.width,layout.height].every(finite)||layout.width<=0||layout.height<=0)return;
 detach(host);
 const frames=layout.frames.filter(f=>f&&typeof f.marker?.kind==='string'&&f.marker.kind!=='unlocated'&&f.location&&[f.left,f.top,f.width,f.height,f.location.x,f.location.y].every(finite)&&f.width>0&&f.height>0);if(!frames.length)return;
 host.classList.add('mb1298-host');
 const svg=node('svg',{class:'mb1298',viewBox:'0 0 '+layout.width+' '+layout.height,preserveAspectRatio:'none','aria-hidden':'true','data-active1298':'false'});
 const defs=node('defs',{},svg),id='mb1298-'+(++serial);
 frames.forEach((f,i)=>{
  const clip=node('clipPath',{id:id+'-'+i},defs);node('rect',{x:0,y:0,width:f.width,height:f.height},clip);
  const group=node('g',{class:'mb1298-frame',transform:'translate('+f.left+' '+f.top+')','data-view1298':f.view||'map','data-x1298':f.location.x,'data-y1298':f.location.y,'data-kind1298':f.marker.kind,'clip-path':'url(#'+id+'-'+i+')'},svg);
  group.style.setProperty('--mb1298-colour',colour(f.marker));
  const outlines=node('g',{class:'mb1298-shapes'},group);
  for(const part of f.parts||[]){
   const attrs={class:'mb1298-outline',d:path(part.points,true)};
   if(part.standard||f.marker.kind!=='reference'&&f.marker.partial)attrs['stroke-dasharray']='6 4';node('path',attrs,outlines);
   for(const d of part.doors||[]){for(const arc of d.arcs||[])node('path',{class:'mb1298-door',d:doorPath(arc)},outlines);for(const line of [...d.leaves||[],...d.landing||[]])node('path',{class:'mb1298-door',d:path(line,false)},outlines);}
   for(const line of part.chevrons||[])node('path',{class:'mb1298-door',d:path(line,false)},outlines);
  }
  const spot=node('g',{class:'mb1298-location',transform:'translate('+f.location.x+' '+f.location.y+')'},group);
  const uncertain=f.marker.kind==='unassigned'||f.marker.kind==='reference';
  node('circle',{class:'mb1298-ring',cx:0,cy:0,r:36,...(uncertain?{'stroke-dasharray':'5 4'}:{})},spot);
  node('circle',{class:'mb1298-pulse',cx:0,cy:0,r:36},spot);
  node('circle',{class:'mb1298-centre',cx:0,cy:0,r:2},spot);
 });
 host.appendChild(svg);const entry={host,svg,width:layout.width,near:!intersection,radius:0};entries.set(host,entry);intersection?.observe(host);resize?.observe(host);refresh(entry);
}
function picture(host,snapshot,view){if(snapshot)attach(host,{width:snapshot.width,height:snapshot.height,frames:[frame(snapshot,view)]});else detach(host);}
function remember(url,snapshot){if(url&&snapshot)pictures.set(url,snapshot);}
function forget(url){pictures.delete(url);}
function cached(host,url,view){picture(host,pictures.get(url),view);}
function paintRing(ctx,marker,p){
 if(!marker||marker.kind==='unlocated'||!p||![p.x,p.y].every(finite))return;
 ctx.save();ctx.beginPath();ctx.rect(0,0,p.width,p.height);ctx.clip();ctx.beginPath();ctx.arc(p.x,p.y,Math.max(16,p.width*.045),0,Math.PI*2);ctx.lineWidth=Math.max(3,p.width*.005);ctx.strokeStyle=colour(marker);ctx.shadowColor=colour(marker);ctx.shadowBlur=14;
 if(marker.kind==='reference'||marker.kind==='unassigned')ctx.setLineDash([8,6]);ctx.stroke();ctx.restore();
}
W.MapBeacon1298=Object.freeze({version:'v12.98',capture,frame,attach,detach,picture,remember,forget,cached,paintRing});
D.addEventListener('visibilitychange',schedule);W.addEventListener('resize',schedule);
if(!intersection)D.addEventListener('scroll',schedule,{capture:true,passive:true});
if(W.MutationObserver)new W.MutationObserver(changes=>{if(!entries.size)return;if(changes.some(m=>m.type==='childList'?[...m.removedNodes].some(n=>n.nodeType===1):m.target.matches?.('.pane,[role="dialog"]')||m.attributeName==='hidden'))schedule();}).observe(D.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
})(window,document);
