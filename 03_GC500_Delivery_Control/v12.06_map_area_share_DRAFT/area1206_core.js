/* Author: Andrew Fisher. Pure geometry for a north-up 50 m square, including crossing footprints. */
function areaCore1206(){
 'use strict';
 const EARTH=6378137,WORLD=512*2**18,HALF=25,EPS=1e-7;
 const merc=ll=>{const s=Math.sin(ll.lat*Math.PI/180);return [(ll.lon+180)/360*WORLD,(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*WORLD];};
 function frame(ll){const centre=merc(ll),mpp=2*Math.PI*EARTH*Math.cos(ll.lat*Math.PI/180)/WORLD;
  return {centre,mpp,local:q=>[(q[0]-centre[0])*mpp,(q[1]-centre[1])*mpp],world:p=>[centre[0]+p[0]/mpp,centre[1]+p[1]/mpp]};
 }
 const inside=p=>p.every(Number.isFinite)&&Math.abs(p[0])<=HALF+EPS&&Math.abs(p[1])<=HALF+EPS;
 function segment(a,b){let lo=0,hi=1;const d=[b[0]-a[0],b[1]-a[1]];
  for(let k=0;k<2;k++){if(Math.abs(d[k])<EPS){if(Math.abs(a[k])>HALF+EPS)return false;}else{let x=(-HALF-a[k])/d[k],y=(HALF-a[k])/d[k];if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi+EPS)return false;}}return true;
 }
 function contains(poly,p){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 function intersects(poly,closed=true){if(!poly.length)return false;if(poly.some(inside))return true;for(let i=1;i<poly.length;i++)if(segment(poly[i-1],poly[i]))return true;
  return closed&&poly.length>=3&&(segment(poly.at(-1),poly[0])||contains(poly,[0,0]));
 }
 const direction=(a,b)=>{const deg=(Math.atan2(b[0]-a[0],a[1]-b[1])*180/Math.PI+360)%360;return ['north','north-east','east','south-east','south','south-west','west','north-west'][Math.round(deg/45)%8];};
 function edgeDoor(poly,index){if(!Number.isInteger(index)||index<0||index>=poly.length||poly.length<3)return null;const a=poly[index],b=poly[(index+1)%poly.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2],centre=poly.reduce((v,p)=>[v[0]+p[0]/poly.length,v[1]+p[1]/poly.length],[0,0]),d=[b[0]-a[0],b[1]-a[1]],n=Math.hypot(...d);if(!n)return null;let out=[-d[1]/n,d[0]/n];if(out[0]*(mid[0]-centre[0])+out[1]*(mid[1]-centre[1])<0)out=out.map(v=>-v);return {mid,out};}
 const rect=(r,p)=>p[0]>=r[0]&&p[0]<=r[2]&&p[1]>=r[1]&&p[1]<=r[3];
 const bounds=pts=>{const x=pts.map(p=>p[0]),y=pts.map(p=>p[1]);return [Math.min(...x),Math.min(...y),Math.max(...x),Math.max(...y)];};
 return {frame,merc,inside,segment,contains,intersects,direction,edgeDoor,rect,bounds,HALF};
}
if(typeof module!=='undefined')module.exports=areaCore1206;
