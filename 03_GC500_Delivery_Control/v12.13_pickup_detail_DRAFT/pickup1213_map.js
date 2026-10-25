/* Author: Andrew Fisher. Upright source-plan detail; overlay and QR share the same plotted destination. */
 function pickupTarget1213(s,map){
  const pts=(map?.points||[]).filter(p=>p.length===2&&p.every(Number.isFinite));
  const p=pts.slice().sort((a,b)=>Math.hypot(...a)-Math.hypot(...b))[0]||[0,0],w=s.F.world(p),N=512*2**18;
  const ll={lat:Math.atan(Math.sinh(Math.PI*(1-2*w[1]/N)))*180/Math.PI,lon:w[0]/N*360-180};
  return {point:p,ll,label:pts.length?'Mapped position for '+map.code:'Selected spot; reference footprint crosses this area',basis:pts.length>1?'Nearest mapped occurrence in this selected area; individual unit position not established.':pts.length?'Recorded map reference; individual unit position not established.':'No separate reference point inside the square; destination is the selected spot.'};
 }
 async function pickupPicture1213(s,focus=null){
  await ensureScene();const target=pickupTarget1213(s,focus),rp=ap(inv(GEO.main.sheet_to_z18px),...s.F.centre),R=region(rp),m=R.sheet_to_z18px;
  const edges=(focus?[focus]:s.rows).flatMap(r=>r.parts.filter(p=>p.closed&&p.poly.length>2).flatMap(p=>p.poly.map((a,i)=>{const b=p.poly[(i+1)%p.poly.length];return [b[0]-a[0],b[1]-a[1]];}))).sort((a,b)=>Math.hypot(...b)-Math.hypot(...a));
  let theta=edges.length?Math.atan2(edges[0][1],edges[0][0]):Math.atan2(m[1][0],m[0][0]);while(theta>Math.PI/2)theta-=Math.PI;while(theta< -Math.PI/2)theta+=Math.PI;
  const co=Math.cos(theta),si=Math.sin(theta),rot=p=>[co*p[0]+si*p[1],-si*p[0]+co*p[1]];
  const square=[[-25,-25],[25,-25],[25,25],[-25,25]],geometry=focus?[...focus.points,...focus.parts.flatMap(p=>p.poly),target.point]:square;
  const pp=geometry.map(rot),bb=C.bounds(pp),span=focus?Math.max(18,bb[2]-bb[0]+8,bb[3]-bb[1]+8):50*(Math.abs(co)+Math.abs(si))+8;
  const centre=[(bb[0]+bb[2])/2,(bb[1]+bb[3])/2],sc=EDGE/span,at=p=>{const q=rot(p);return [(q[0]-centre[0])*sc+EDGE/2,(q[1]-centre[1])*sc+EDGE/2];};
  const k=sc*s.F.mpp,base=s.F.centre,outM=[[k*co,k*si,EDGE/2-centre[0]*sc-k*(co*base[0]+si*base[1])],[-k*si,k*co,EDGE/2-centre[1]*sc-k*(-si*base[0]+co*base[1])],[0,0,1]];
  const cv=document.createElement('canvas');cv.width=EDGE;cv.height=EDGE+BAND;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,EDGE,EDGE+BAND);
  if(!await plan(g,s,outM))throw new Error('The pickup map is outside the registered plan.');
  await document.fonts.ready;
  function trace(ps,close=false){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(...at(p)):g.moveTo(...at(p)));if(close)g.closePath();}
  g.save();g.beginPath();g.rect(0,0,EDGE,EDGE);g.clip();
  for(const r of s.rows)for(const part of r.parts){trace(part.poly,part.closed);g.fillStyle='#ff6a1319';g.strokeStyle='#17475c';g.lineWidth=5;if(part.closed)g.fill();g.stroke();
   for(const d of part.doors){for(const l of [...d.arcs,...d.leaves]){trace(l);g.strokeStyle='#006ad4';g.lineWidth=9;g.stroke();}
    const p=at(d.mid),v=rot(d.out),dx=v[0]*90,dy=v[1]*90;g.beginPath();g.moveTo(...p);g.lineTo(p[0]+dx,p[1]+dy);g.lineTo(p[0]+dx*.6-dy*.25,p[1]+dy*.6+dx*.25);g.moveTo(p[0]+dx,p[1]+dy);g.lineTo(p[0]+dx*.6+dy*.25,p[1]+dy*.6-dx*.25);g.strokeStyle='#fff';g.lineWidth=20;g.stroke();g.strokeStyle='#006ad4';g.lineWidth=10;g.stroke();
   }
  }
  if(!focus){trace(square,true);g.setLineDash([22,16]);g.lineWidth=10;g.strokeStyle='#e45300';g.stroke();g.setLineDash([]);}
  for(const r of (focus?[focus]:s.rows)){const t=pickupTarget1213(s,r),p=at(t.point);g.beginPath();g.arc(p[0],p[1],32,0,Math.PI*2);g.fillStyle='#e45300';g.strokeStyle='#fff';g.lineWidth=8;g.fill();g.stroke();
   const label=r.code+' '+r.symbols.map(x=>x.glyph||'').join(' ');g.font='800 125px GC500MapUnits1147,Inter,sans-serif';const w=g.measureText(label).width+70,x=Math.max(16,Math.min(EDGE-w-16,p[0]+55)),y=Math.max(100,Math.min(EDGE-110,p[1]-55));g.fillStyle='#132c3e';g.fillRect(x,y-120,w,160);g.fillStyle='#fff';g.fillText(label,x+35,y);
  }
  g.restore();
  // Actual north direction in the upright drawing, never falsely labelled north-up.
  const n=rot([0,-1]),x=EDGE-235,y=245;g.fillStyle='#fff';g.fillRect(EDGE-450,10,440,440);g.strokeStyle='#132c3e';g.lineWidth=12;g.beginPath();g.moveTo(x-n[0]*45,y-n[1]*45);g.lineTo(x+n[0]*100,y+n[1]*100);g.stroke();g.beginPath();g.moveTo(x+n[0]*100,y+n[1]*100);g.lineTo(x+n[0]*50-n[1]*25,y+n[1]*50+n[0]*25);g.lineTo(x+n[0]*50+n[1]*25,y+n[1]*50-n[0]*25);g.closePath();g.fillStyle='#132c3e';g.fill();g.font='800 95px Inter,sans-serif';g.fillStyle='#132c3e';g.fillText('N',x+n[0]*150-33,y+n[1]*150+32);
  const bar=5*sc;g.fillStyle='#fff';g.fillRect(25,EDGE-210,bar+100,200);g.strokeStyle='#132c3e';g.lineWidth=10;g.beginPath();g.moveTo(50,EDGE-55);g.lineTo(50+bar,EDGE-55);g.stroke();g.font='700 90px Inter,sans-serif';g.fillStyle='#132c3e';g.fillText('5 m',50,EDGE-80);
  g.fillStyle='#102332';g.fillRect(0,EDGE,EDGE,BAND);g.fillStyle='#fff';g.font='800 60px Inter,sans-serif';g.fillText(focus?'PICKUP LOCATION · '+focus.code:'SELECTED AREA · dashed boundary = 50 m × 50 m',50,EDGE+85);
  g.font='500 38px Inter,sans-serif';g.fillText('Plan aligned to equipment · Blue arrows: recorded doors · Orange dot: navigation destination',50,EDGE+150);
  g.fillText(focus?target.ll.lat.toFixed(6)+', '+target.ll.lon.toFixed(6):'Location sheets carry a separate navigation destination for each reference.',50,EDGE+210);
  g.fillText('Author: Andrew Fisher · Drawing © iEDM D001 rev 03 · registered plan, not survey',50,EDGE+270);
  const blob=await new Promise((ok,no)=>cv.toBlob(b=>b?ok(b):no(new Error('Pickup map export failed.')),'image/png'));cv.width=cv.height=1;
  return {blob,target,span,theta};
 }
