/* Author: Andrew Fisher. Native source projection and SVG length-limit regression, synthetic coordinates only. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++},near=(a,b,m)=>{assert.ok(Math.abs(a-b)<.001,m+': '+a+' vs '+b);checks++};
// Chromium's observed SVGAnimatedLength clamp is 33554428. Native image URLs
// can load successfully while absolute world x/y clamp and render off-screen.
const MAX_LENGTH=33554428,A=[[.005,-2.5,120000000],[2.5,.005,78000000]],det=A[0][0]*A[1][1]-A[0][1]*A[1][0];
const Ai=[[A[1][1]/det,-A[0][1]/det,0],[-A[1][0]/det,A[0][0]/det,0]];for(let i=0;i<2;i++)Ai[i][2]=-Ai[i][0]*A[0][2]-Ai[i][1]*A[1][2];
const GEO={A,Ai,main:[40,40,2384,1684]},origin=A.map(row=>Math.floor(row[0]*GEO.main[0]+row[1]*GEO.main[1]+row[2]));
let currentBox,currentZ;function load(suffix){const c={GEO,box:()=>currentBox,satZoom:()=>currentZ,SAT:'https://tiles.invalid/'};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(ROOT,'closure_projection1245'+suffix+'.js'),'utf8')+'\n'+fs.readFileSync(path.join(ROOT,'closure_matrix1245'+suffix+'.js'),'utf8')+'\nthis.tiles=satTiles;this.matrix=satMatrix;this.world=toZ18;',c);return c;}
const old=load('_before'),fresh=load(''),parse=s=>s.slice(7,-1).split(' ').map(Number),mul=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
for(let z=15;z<=20;z++){
 currentZ=z;const span=256/2**(z-19);currentBox={x:300,y:400,w:span/2,h:span/3};const before=old.tiles({}).tiles,after=fresh.tiles({}).tiles;
 eq(Array.from(after,t=>t.url),Array.from(before,t=>t.url),'Zoom '+z+' uses exact same tile URLs and order');eq(after.length>0,true,'Zoom '+z+' has a nonempty view');
 const m=parse(fresh.matrix());for(let i=0;i<after.length;i++){
  const a=after[i],b=before[i];eq(a.span,b.span,'Tile span preserved');eq(a.x,b.x-origin[0],'Fixed local x origin');eq(a.y,b.y-origin[1],'Fixed local y origin');eq(Math.abs(a.x)<32768&&Math.abs(a.y)<32768,true,'New SVG coordinates stay close to the site origin');
  for(const [dx,dy] of [[0,0],[a.span,a.span]]){const actual=mul(m,a.x+dx,a.y+dy),want=Ai.map(row=>row[0]*(b.x+dx)+row[1]*(b.y+dy)+row[2]);near(actual[0],want[0],'Projected sheet x unchanged');near(actual[1],want[1],'Projected sheet y unchanged');}
 }
}
for(const test of [{name:'fit',z:17,b:{x:0,y:0,w:2384,h:1684}},{name:'default zoom',z:20,b:{x:1144,y:808,w:96,h:68}},{name:'line zoom',z:20,b:{x:1434,y:472,w:96,h:68}}]){
 currentZ=test.z;currentBox=test.b;const before=old.tiles({}).tiles,after=fresh.tiles({}).tiles;eq(after.every(t=>Math.abs(t.x)<32768&&Math.abs(t.y)<32768),true,test.name+': all image positions remain near the local site origin');let oldCovered=0,newCovered=0;
 for(const fx of [.2,.5,.8])for(const fy of [.2,.5,.8]){
  const world=old.world(currentBox.x+currentBox.w*fx,currentBox.y+currentBox.h*fy),local=[world[0]-origin[0],world[1]-origin[1]];
  const covers=(tiles,p)=>tiles.some(t=>{const x=Math.min(MAX_LENGTH,Math.max(-MAX_LENGTH,t.x)),y=Math.min(MAX_LENGTH,Math.max(-MAX_LENGTH,t.y));return p[0]>=x&&p[0]<=x+t.span&&p[1]>=y&&p[1]<=y+t.span});
  oldCovered+=covers(before,world);newCovered+=covers(after,local);
 }
 eq(oldCovered,0,test.name+': old native length-clamped images miss the complete viewport');eq(newCovered,9,test.name+': rebased image geometry covers every sampled viewport point');
}
console.log(JSON.stringify({checks,passed:checks,failed:0}));
