/* Author: Andrew Fisher. The destination's outline is the map marker; load labels sit alongside it. */
(function(){
 'use strict';
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const overlaps=(a,b,gap=0)=>a.x-a.w/2< b.x+b.w/2+gap&&a.x+a.w/2> b.x-b.w/2-gap&&a.y-a.h/2< b.y+b.h/2+gap&&a.y+a.h/2> b.y-b.h/2-gap;
 function caption(refs){return refs.length>2?[...refs.slice(0,2),'+'+(refs.length-2)]:refs.slice();}
 function dimensions(refs){return {w:Math.max(78,Math.min(116,38+String(caption(refs).join(' · ')).length*6)),h:44};}
 // This placement moves only the label, never a destination, outline or door.
 function labels(items,width,height,obstacles=[]){
  const placed=[],blocked=obstacles.filter(r=>[r.x,r.y,r.w,r.h].every(Number.isFinite));
  const controls=[{x:width-48,y:57,w:96,h:114},{x:width-58,y:height-60,w:116,h:120}];
  for(const item of items){
   const size=dimensions(item.refs),minX=size.w/2+5,maxX=Math.max(minX,width-size.w/2-5),minY=27,maxY=Math.max(minY,height-32);
   let clear=null,available=null,any=null;
   const consider=(x,y)=>{
    const p={x:clamp(x,minX,maxX),y:clamp(y,minY,maxY),...size};p.distance=Math.hypot(p.x-item.x,p.y-item.y);
    if(!any||p.distance<any.distance)any=p;
    if(placed.some(q=>overlaps(p,q,4))||controls.some(q=>overlaps(p,q,3)))return;
    p.covered=blocked.reduce((n,q)=>n+(overlaps(p,q,7)?1:0),0);
    if(!available||p.covered<available.covered||(p.covered===available.covered&&p.distance<available.distance))available=p;
    if(!p.covered&&(!clear||p.distance<clear.distance))clear=p;
   };
   // Search near the destination first. Stop as soon as a clear ring exists instead of
   // sorting a full-viewport candidate grid on every pan frame.
   for(let ring=1;ring<=8&&!clear;ring++)for(let i=0;i<ring*12;i++){
    const angle=i/(ring*12)*Math.PI*2;consider(item.x+Math.cos(angle)*ring*(size.w/2+18),item.y+Math.sin(angle)*ring*39);
   }
   if(!clear)for(let y=minY;y<=maxY;y+=48)for(let x=minX;x<=maxX;x+=size.w+6)consider(x,y);
   // A close zoom may fill the viewport with the actual footprint. Keep the label small
   // and choose the least covered location; never alter the footprint to make room.
   const p=clear||available||any||{x:clamp(item.x,minX,maxX),y:clamp(item.y,minY,maxY),...size};
   placed.push({...item,...p,anchorX:item.x,anchorY:item.y,crowded:!available});
  }
  // Greedy near-anchor placement can leave an awkward hole even when all labels fit.
  // Repack the whole set into a bounded grid rather than covering an earlier load.
  if(placed.some(p=>p.crowded)&&items.length){
   const w=Math.max(...items.map(p=>dimensions(p.refs).w)),h=44,grid=[];
   for(let y=27;y<=height-32;y+=h+4)for(let x=w/2+5;x<=width-w/2-5;x+=w+6){const p={x,y,w,h};if(!controls.some(q=>overlaps(p,q,3)))grid.push(p);}
   if(grid.length>=items.length)return items.map(item=>{
    let best=0,score=Infinity;grid.forEach((p,i)=>{const covered=blocked.reduce((n,q)=>n+(overlaps(p,q,7)?1:0),0),value=covered*(width+height)+Math.hypot(p.x-item.x,p.y-item.y);if(value<score){score=value;best=i;}});
    const p=grid.splice(best,1)[0];return {...item,...p,...dimensions(item.refs),anchorX:item.x,anchorY:item.y,crowded:false,repacked:true};
   });
  }
  return placed;
 }
 // Bounds use the exact projected points already prepared by Shapes926. No DOM geometry
 // reads or second projection pass during pan/zoom.
 function bounds(layout,at){
  const out=[],add=points=>{const ps=points.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite));if(!ps.length)return;const xs=ps.map(p=>p[0]+at.x),ys=ps.map(p=>p[1]+at.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);out.push({x:(x0+x1)/2,y:(y0+y1)/2,w:x1-x0,h:y1-y0});};
  for(const c of layout.components||[]){add(c.poly||[]);for(const d of c.doors||[]){const points=[...(d.arcs||[]).flat(),...(d.leaves||[]).flat(),...(d.landing||[]).flat()];if(d.mid&&d.out)points.push(d.mid,[d.mid[0]+d.out[0]*20,d.mid[1]+d.out[1]*20]);add(points);}}
  return out;
 }
 function draw(view,map,model,selected,data){
  // The existing projection contains the original traced polygons and exact door rotations.
  view.__destination930Obstacles=[];
  if(typeof Shapes926!=='undefined')Shapes926.overlay(view,map,model,selected);
  const pins=view.querySelector('.drops911-pins'),lines=view.querySelector('.drops911-leaders');
  const projected=data.map(p=>{const q=map.project(p.point);return q?{...p,x:q.x,y:q.y}:null;}).filter(p=>p&&p.x>=0&&p.y>=0&&p.x<=view.clientWidth&&p.y<=view.clientHeight);
  const shown=labels(projected,view.clientWidth,view.clientHeight,view.__destination930Obstacles);
  lines.setAttribute('viewBox','0 0 '+view.clientWidth+' '+view.clientHeight);
  lines.innerHTML=shown.map(p=>'<g class="destination930-leader'+(p.id===selected?' selected':'')+'"><line x1="'+p.anchorX+'" y1="'+p.anchorY+'" x2="'+p.x+'" y2="'+p.y+'"/><circle cx="'+p.anchorX+'" cy="'+p.anchorY+'" r="2.5"/></g>').join('');
  const signature=projected.map(p=>p.key+':'+p.n+':'+p.complete+':'+p.refs.join(',')).join(';');
  if(pins.__destination930Signature!==signature){
   const oldFocus=document.activeElement&&document.activeElement.dataset.destination930Key;
   pins.innerHTML=projected.map(p=>'<button type="button" class="drops911-pin destination930-label'+(p.complete?' finished':'')+'" data-drop911-marker="'+esc(p.id)+'" title="'+esc(p.refs.join(' · '))+'" data-destination930-key="'+esc(p.key)+'" aria-label="Load '+p.n+': '+esc(p.refs.join(', '))+(p.complete?'. Finished.':'')+'"><span class="destination930-number">'+p.n+'</span><strong>'+caption(p.refs).map(r=>'<span class="destination930-ref">'+esc(r)+'</span>').join(' · ')+'</strong>'+(p.complete?'<i aria-hidden="true">✓</i>':'')+'</button>').join('');
   pins.__destination930Signature=signature;
   if(oldFocus){const focus=[...pins.children].find(b=>b.dataset.destination930Key===oldFocus);if(focus)focus.focus({preventScroll:true});}
  }
  [...pins.children].forEach((b,i)=>{const p=shown[i];b.style.left=p.x+'px';b.style.top=p.y+'px';b.style.width=p.w+'px';});
  return shown;
 }
 const api=Object.freeze({version:'v9.30',labels,caption,dimensions,overlaps,bounds,draw});
 if(typeof window!=='undefined')window.DestinationMarkers930=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
