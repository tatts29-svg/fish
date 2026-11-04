/* Author: Andrew Fisher. Exact native picture crops for the three Build map beacons.
 * The existing lifecycle owns the picture and its small projection snapshot together.
 * No independent location lookup, animation draw loop or additional image request.
 */
(function(W,D){
'use strict';
const PANEL_W=336,PANEL_H=242,GAP=6,WIDTH=PANEL_W*3+GAP*2;
const finite=Number.isFinite;
function frame(snapshot,image,left,view){
 if(!snapshot||!image||!snapshot.location||!snapshot.marker||snapshot.marker.kind==='unlocated')return null;
 const iw=image.naturalWidth,ih=image.naturalHeight;
 if(![iw,ih,snapshot.location.x,snapshot.location.y].every(finite)||iw<=0||ih<=0)return null;
 // Identical to panel(): top aligned, horizontally centred, clipped to this panel.
 const scale=Math.max(PANEL_W/iw,PANEL_H/ih),dx=(PANEL_W-iw*scale)/2;
 const point=p=>({x:dx+p.x*scale,y:p.y*scale}),line=ps=>ps.map(point);
 const parts=(snapshot.parts||[]).map(part=>({...part,points:line(part.points),
  doors:(part.doors||[]).map(door=>({arcs:door.arcs.map(line),leaves:door.leaves.map(line),landing:door.landing.map(line)})),
  chevrons:(part.chevrons||[]).map(line)}));
 return {left,top:0,width:PANEL_W,height:PANEL_H,view,location:point(snapshot.location),marker:snapshot.marker,parts};
}
function attach(host,picture){
 if(picture&&Array.isArray(picture.frames)&&picture.frames.length)W.MapBeacon1298?.attach(host,{width:WIDTH,height:PANEL_H,frames:picture.frames});
}
function detach(host){if(host)W.MapBeacon1298?.detach(host);}
const api=Object.freeze({version:'v12.98',frame,attach,detach,width:WIDTH,height:PANEL_H});
if(typeof module==='object'&&module.exports){module.exports=api;return;}
if(W.BuildBeacon1298)return;
W.BuildBeacon1298=api;
function load(src,revoke,snapshot){
 return new Promise((ok,no)=>{
  const im=new Image();im.decoding='async';
  const done=()=>{if(revoke)try{URL.revokeObjectURL(src);}catch(_){}};
  im.onload=()=>{done();ok({image:im,snapshot});};im.onerror=()=>{done();no(new Error('a map picture would not load'));};im.src=src;
 });
}
function panel(c,item,x,label){
 const im=item?.image,w=PANEL_W,h=PANEL_H;
 if(im){const s=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;c.save();c.beginPath();c.rect(x,0,w,h);c.clip();c.drawImage(im,x+(w-dw)/2,0,dw,dh);c.restore();}
 else{c.fillStyle='#213e4b';c.fillRect(x,0,w,h);}
 c.save();c.font='700 20px Inter,"Segoe UI",sans-serif';const tw=c.measureText(label).width+20;
 c.fillStyle='rgba(16,28,35,.86)';c.fillRect(x+8,h-38,tw,30);c.fillStyle='#ffd7b5';c.textBaseline='middle';c.fillText(label,x+18,h-23);c.restore();
}
async function drawing(key,L){
 try{
  const M=W.DemobMap1236;if(!M||typeof M.spot!=='function'||typeof M.draw!=='function')return null;
  const id=W.BuildShapes1297?.drawingId(key,L);if(!id)return null;
  let snapshot=null;const url=await M.draw(id,L.demob1297,value=>{snapshot=value;});
  return url?await load(url,true,snapshot):null;
 }catch(_){return null;}
}
W.composeMaps1261=async function(L,key,isCurrent){
 const F=W.Find1176;if(!F||!Array.isArray(F.VIEWS))throw new Error('Find it on the map is unavailable');
 const close=F.VIEWS.find(v=>v.key==='close'),wide=F.VIEWS.find(v=>v.key==='wide');
 if(!close||!wide)throw new Error('Native map views unavailable');
 const [a,b,d]=await Promise.all([
  F.picture(L,close).then(p=>load(p.dataUrl,false,p._beacon1298)).catch(()=>null),
  F.picture(L,wide).then(p=>load(p.dataUrl,false,p._beacon1298)).catch(()=>null),drawing(key,L)]);
 if(!isCurrent())return null;
 if(!a&&!b&&!d)throw new Error('No map picture could be drawn');
 const canvas=D.createElement('canvas');canvas.width=WIDTH;canvas.height=PANEL_H;
 const c=canvas.getContext('2d');if(!c)throw new Error('Canvas unavailable');
 try{
  c.fillStyle='#102630';c.fillRect(0,0,WIDTH,PANEL_H);
  panel(c,a,0,'Close up');panel(c,b,PANEL_W+GAP,'Wider area');panel(c,d,(PANEL_W+GAP)*2,d?'On the drawing':'Not on the drawing');
  const frames=[frame(a?.snapshot,a?.image,0,'close'),frame(b?.snapshot,b?.image,PANEL_W+GAP,'wide'),frame(d?.snapshot,d?.image,(PANEL_W+GAP)*2,'plan')].filter(Boolean);
  return {url:canvas.toDataURL('image/jpeg',.8),frames};
 }finally{canvas.width=canvas.height=0;}
};
})(typeof window==='object'?window:globalThis,typeof document==='object'?document:null);
