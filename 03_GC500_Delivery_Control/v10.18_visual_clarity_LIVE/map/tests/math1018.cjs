/* Author: Andrew Fisher. Dependency-free exact-function renderer test harness. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const candidate=process.env.MAP_CODE||'/tmp/private-gc500-visual1018/map/candidate';
const js=fs.readFileSync(path.join(candidate,'explorer.js'),'utf8');
function sourceFunction(name){
 const start=js.indexOf('function '+name+'(');assert(start>=0,'Missing source function '+name);
 const begin=js.indexOf('{',start);let depth=0,quote='',comment='';
 for(let i=begin;i<js.length;i++){
  const c=js[i],n=js[i+1];
  if(comment==='line'){if(c==='\n')comment='';continue;}
  if(comment==='block'){if(c==='*'&&n==='/'){comment='';i++;}continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==='/'&&n==='/'){comment='line';i++;continue;}
  if(c==='/'&&n==='*'){comment='block';i++;continue;}
  if(c==='\''||c==='"'||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&!--depth)return js.slice(start,i+1);
 }
 throw new Error('Unclosed source function '+name);
}
const checks=[],failures=[];function check(name,fn){try{fn();checks.push(name);}catch(error){failures.push({name,error:String(error.stack||error)});}}
function context(globals={},setup='',names=[]){const c=vm.createContext({Math,Map,Set,Number,Object,JSON,Array,console,...globals});vm.runInContext(setup,c);for(const name of names)vm.runInContext(sourceFunction(name),c);return c;}
const mainM=[[.006209606192736599,-2.678811572270095,124312606.97781198],[2.6899847635931895,.006687497663555323,77981931.41801661],[0,0,1]];
const core=`const SHEET_W=2384,SHEET_H=1684,TILE=512,VT=512,MIN_Z=.5,MAX_Z=640;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let sw=3840,sh=2160,dpr=1,fitScale=1, camera={cx:1192,cy:842,z:1,rot:45},interacting=false,zAnim=0;const GEO={main:{sheet_to_z18px:${JSON.stringify(mainM)}}};const satZHeld=new Map();let SOURCE='google';function tileMaxZ(){return SOURCE==='google'?21:19;}`;
const geometry=context({},core+'let PHONE=false;',[
 'sheetToDevice','invertM','applyM','currentView','mul','ap','tileZoomFor','satRange','tileVisible1018','satelliteView1018'
]);
function view(w,h,ratio,z,rot,phone=false){return vm.runInContext(`sw=${w};sh=${h};dpr=${ratio};PHONE=${phone};fitScale=Math.max(.025,Math.min((sw-30)/SHEET_W,(sh-30)/SHEET_H));camera={cx:1192,cy:842,z:${z},rot:${rot}};(()=>{const v=currentView(),R={M:GEO.main.sheet_to_z18px,rect:[-10000,-10000,10000,10000]},wanted=tileZoomFor(v,R.M),range=satRange(R,wanted.z,v.x,v.y,v.x+v.w,v.y+v.h);return {wanted,box:(range.tx1-range.tx0+1)*(range.ty1-range.ty0+1),chosen:satelliteView1018(v,R)};})()`,geometry);}
check('Rotated 4K retains native source level while culling 225 box tiles to 105 visible tiles',()=>{
 const r=view(3840,2160,1,2.6103617316844017,45);
 assert.equal(r.box,225);assert.equal(r.chosen.cells.length,105);assert.equal(r.chosen.z,19);assert.equal(r.chosen.requestedZ,19);assert.equal(r.chosen.limited,false);
});
check('390 px DPR 3 phone retains source level and fits visible and mosaic budgets',()=>{
 const r=view(390,720,3,.920614342399489,45,true);
 assert.equal(r.box,81);assert(r.chosen.cells.length<=74);assert.equal(r.chosen.z,r.wanted.z);assert.equal(r.chosen.limited,false);
});
check('Supported phone and 4K views keep requested source zoom across ordinary scales and rotations',()=>{
 for(const [w,h,ratio,phone]of[[390,720,3,true],[3840,2160,1,false]])for(const z of[.5,1,2,4,8,16,32,64])for(const rot of[0,30,45,90,135]){
  const r=view(w,h,ratio,z,rot,phone);assert.equal(r.chosen.z,r.wanted.z,`${w} px z=${z} rot=${rot}`);assert.equal(r.chosen.limited,false);
 }
});
check('Over-budget tablet view lowers level explicitly and still returns visible tiles',()=>{
 const r=view(834,1000,3,.8172395924787571,35,true),q=r.chosen;
 assert(r.box>96);assert(q.cells.length>0&&q.cells.length<=74);assert(q.limited);assert(q.z<q.requestedZ);assert((q.range.tx1-q.range.tx0+1)*(q.range.ty1-q.range.ty0+1)<=96);
});
check('Tile visibility rejects off-screen rectangles and retains shared edges without gaps',()=>{
 const polygon=[[100,100],[900,100],[900,900],[100,900]];
 assert.equal(geometry.tileVisible1018(polygon,0,0),true);assert.equal(geometry.tileVisible1018(polygon,3,0),false);assert.equal(geometry.tileVisible1018(polygon,0,3),false);
 assert.equal(geometry.tileVisible1018([[0,0],[512,0],[512,512],[0,512]],1,0),true);
 assert.equal(geometry.tileVisible1018([[0,256],[256,0],[512,256],[256,512]],1,1),false);
});
let closed=[];
const caches=context({performance:{now:()=>1000}},`const TILE_CAP=90,tiles=new Map(),tileTries=new Map(),satVisible1018=new Set(),satWanted=new Set();`,['evict']);
check('Eviction keeps all 74 current visible tiles and wanted fallbacks within 90 slots',()=>{
 closed=[];caches.close=(key)=>closed.push(key);
 vm.runInContext(`tiles.clear();satWanted.clear();satVisible1018.clear();for(let i=0;i<74;i++){const k='visible'+i;satVisible1018.add(k);tiles.set(k,{at:i,bm:{close(){close(k)}}});}for(let i=0;i<16;i++){const k='fallback'+i;satWanted.add(k);tiles.set(k,{at:100+i,bm:{close(){close(k)}}});}for(let i=0;i<30;i++){const k='old'+i;tiles.set(k,{at:10000+i,bm:{close(){close(k)}}});}evict();`,caches);
 assert.equal(vm.runInContext('tiles.size',caches),90);assert.equal(vm.runInContext('[...satVisible1018].every(k=>tiles.has(k))&&[...satWanted].every(k=>tiles.has(k))',caches),true);assert.equal(closed.length,30);assert(closed.every(k=>k.startsWith('old')));
});
check('Future and off-screen arrivals cannot evict the current viewport',()=>{
 vm.runInContext(`for(let i=0;i<100;i++){const k='future'+i;tiles.set(k,{at:20000+i,bm:{close(){close(k)}}});evict();}`,caches);
 assert.equal(vm.runInContext('tiles.size',caches),90);assert.equal(vm.runInContext('[...satVisible1018].every(k=>tiles.has(k))',caches),true);
});
const coarse=context({performance:{now:()=>1000}},`const TILE=512,tiles=new Map(),satWanted=new Set(),requested=[];let mockRange={tx0:0,tx1:4,ty0:0,ty1:4};function satRange(){return mockRange;}function requestTile(z,x,y){requested.push([z,x,y]);}function tileKey(z,x,y){return z+'/'+x+'/'+y;}`,['requestCoarse']);
check('Coarse halo respects remaining cache capacity and marks cached fallbacks wanted',()=>{
 vm.runInContext(`requestCoarse({x:0,y:0,w:100,h:100},{},18,16);`,coarse);assert.equal(vm.runInContext('requested.length',coarse),0);
 vm.runInContext(`mockRange={tx0:0,tx1:3,ty0:0,ty1:3};for(let y=0;y<4;y++)for(let x=0;x<4;x++)tiles.set(tileKey(16,x,y),{bm:{},at:0});requestCoarse({x:0,y:0,w:100,h:100},{},18,16);`,coarse);
 assert.equal(vm.runInContext('satWanted.size',coarse),16);assert.equal(vm.runInContext('requested.length',coarse),0);assert.equal(vm.runInContext('[...tiles.values()].every(t=>t.at===1000)',coarse),true);
});
const noop=()=>{},canvasDocument={createElement:()=>({width:300,height:150,getContext:()=>({drawImage:noop,fillRect:noop,clearRect:noop})})};
const mosaics=context({document:canvasDocument},'const TILE=512,VT=512,mosaics=new Map(),vmosaics=new Map();',['mosaicFor','vMosaic']);
check('Satellite and drawing mosaics shrink after wide-to-tall aspect changes',()=>{
 for(const name of['mosaicFor','vMosaic']){
  const r=vm.runInContext(`(()=>{let m=${name}('aspect',20,0,0,24,5);const first=[m.canvas.width,m.canvas.height];m=${name}('aspect',20,0,0,5,24);return {first,w:m.canvas.width,h:m.canvas.height};})()`,mosaics);
  assert.equal(r.first[0],24*512);assert.equal(r.first[1],5*512);assert.equal(r.w,5*512);assert.equal(r.h,24*512);
 }
});
check('Mosaics release excess capacity on smaller settled views and reuse stable sizes',()=>{
 for(const name of['mosaicFor','vMosaic']){
  const r=vm.runInContext(`(()=>{let m=${name}('small',20,0,0,12,12);m=${name}('small',20,0,0,4,4);const canvas=m.canvas;m=${name}('small',20,0,0,4,4);return {w:m.canvas.width,h:m.canvas.height,same:m.canvas===canvas};})()`,mosaics);
  assert.equal(r.w,4*512);assert.equal(r.h,4*512);assert.equal(r.same,true);
 }
});
const levels=context({},'let dpr=1,PYR={},PYR_MAX=3.25;const PYR_LEVELS=Array.from({length:26},(_,i)=>-3+i/4);',['levelFor']);
check('Resting pyramid level never stretches source tiles above native density',()=>{
 for(const ratio of[1,2,3])for(let L=-3;L<=3.25;L+=.25){
  vm.runInContext('dpr='+ratio,levels);
  const at=levels.levelFor({scale:2**L/ratio}),above=levels.levelFor({scale:2**(L+.001)/ratio});
  assert.equal(at,L);assert(above>L,`Boundary ${L} must select sharper source`);assert(2**above>=2**(L+.001));
 }
});
check('Vector fallback and absent-pyramid quantisation round up to native density',()=>{
 vm.runInContext('dpr=1',levels);
 for(let L=-3;L<=3.25;L+=.25){vm.runInContext('PYR=null',levels);assert(levels.levelFor({scale:2**L})===L);}
 for(const need of[-2.99,-1.12,.12,2.01,3.251,3.7,8.001]){
  vm.runInContext('PYR=null;',levels);const out=levels.levelFor({scale:2**need});assert(out>=need);
  vm.runInContext('PYR={};',levels);const full=levels.levelFor({scale:2**need});assert(full>=need);
 }
});
let now=0,nextTimer=1;const raf=new Map(),timers=new Map();
const rotation=context({performance:{now:()=>now},setTimeout:(fn,ms)=>{const id=nextTimer++;timers.set(id,{fn,at:now+ms});return id},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{const id=nextTimer++;raf.set(id,fn);return id},cancelAnimationFrame:id=>raf.delete(id)},`let camera={rot:0},rotAnim=0,interacting=false,zAnim=0,flingRAF=0,gotoAnim887=0,paintID=0,restTimer=0,lastInput=0,lightWent887=false,lightMoving887=false,lightNext887=false,lightTrials887=0,lightPending887=false;const slow887=[],pointers=new Map(),vtGoal=new Set(),goalWanted=new Set();let painted=0;function stopCameraMotion813(){cancelAnimationFrame(rotAnim);rotAnim=0;}function changeView(){}function requestPaint(){painted++;}function dropVTQueue(){}function mapMotionOff1018(){return false;}`,['touchInteraction','rotateTo']);
check('Completed rotation clears RAF handle and returns to resting full-quality state',()=>{
 vm.runInContext('rotateTo(90)',rotation);
 for(now=16;now<2000;now+=16){for(const[id,fn]of[...raf]){raf.delete(id);fn(now);}for(const[id,t]of[...timers])if(t.at<=now){timers.delete(id);t.fn();}}
 const r=vm.runInContext('({angle:camera.rot,rotAnim,interacting,lightPending887,painted})',rotation);
 assert.equal(r.angle,90);assert.equal(r.rotAnim,0);assert.equal(r.interacting,false);assert.equal(r.lightPending887,true);assert(r.painted>0);assert.equal(raf.size,0);assert.equal(timers.size,0);
});
check('Reduced motion rotation lands immediately without scheduling animation',()=>{
 vm.runInContext('mapMotionOff1018=()=>true;rotateTo(180)',rotation);
 assert.equal(vm.runInContext('camera.rot',rotation),180);assert.equal(vm.runInContext('rotAnim',rotation),0);assert.equal(raf.size,0);
});
if(failures.length)process.exitCode=1;
console.log(JSON.stringify({author:'Andrew Fisher',checks:checks.length+failures.length,passed:!failures.length,failures,sourceSha256:crypto.createHash('sha256').update(js).digest('hex'),names:checks}));
