/* Author: Andrew Fisher. Visible satellite tiles only, with explicit cache and mosaic budgets. */
const satVisible1018 = new Set();
function tileVisible1018(points,tx,ty){
 if(!points)return true;
 const x0=tx*TILE-1,y0=ty*TILE-1,x1=(tx+1)*TILE+1,y1=(ty+1)*TILE+1;
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 if(Math.max(...xs)<x0||Math.min(...xs)>x1||Math.max(...ys)<y0||Math.min(...ys)>y1)return false;
 // Separating axes of both convex shapes, with one source pixel of edge coverage.
 for(let i=0;i<4;i++){
  const a=points[i],b=points[(i+1)%4],nx=-(b[1]-a[1]),ny=b[0]-a[0];
  const poly=points.map(p=>p[0]*nx+p[1]*ny),box=[x0*nx+y0*ny,x1*nx+y0*ny,x1*nx+y1*ny,x0*nx+y1*ny];
  if(Math.max(...box)<Math.min(...poly)||Math.max(...poly)<Math.min(...box))return false;
 }
 return true;
}
function satelliteView1018(v,R,hold){
 const wanted=tileZoomFor(v,R.M,hold),budget=PHONE?74:164,mosaicBudget=PHONE?96:256;
 for(let z=wanted.z;z>=12;z--){
  const range=satRange(R,z,v.x,v.y,v.x+v.w,v.y+v.h);if(!range)return null;
  const area=(range.tx1-range.tx0+1)*(range.ty1-range.ty0+1);
  if(area>mosaicBudget&&z>12)continue;
  const points=v.corners&&v.corners.length===4?[0,1,3,2].map(i=>ap(range.Mz,v.corners[i].x,v.corners[i].y)):null,cells=[];
  for(let ty=range.ty0;ty<=range.ty1;ty++)for(let tx=range.tx0;tx<=range.tx1;tx++)if(tileVisible1018(points,tx,ty))cells.push([tx,ty]);
  if(cells.length>budget&&z>12)continue;
  return {z,range,cells,over:wanted.over,limited:z<wanted.z,requestedZ:wanted.z};
 }
 return null;
}
function mapMotionOff1018(){
 if(matchMedia('(prefers-reduced-motion:reduce)').matches||document.documentElement.getAttribute('data-motion')==='off')return true;
 try{return window.parent!==window&&window.parent.document.documentElement.getAttribute('data-motion')==='off'}catch(_){return false}
}
