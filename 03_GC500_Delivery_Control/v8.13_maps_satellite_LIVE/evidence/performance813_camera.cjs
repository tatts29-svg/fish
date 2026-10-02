// Author: Andrew Fisher. Exact-source camera, DPR and demand-loading checks; no browser/network.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const arg=n=>{const i=process.argv.indexOf(n);return i<0?null:process.argv[i+1]};
const basePath=arg('--base'),sourcePath=arg('--source'),output=arg('--output');
if(!basePath||!sourcePath||!output)throw Error('Usage: --base live.js --source candidate.js --output report.json');
const base=fs.readFileSync(basePath,'utf8'),source=fs.readFileSync(sourcePath,'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(sha(base),'ad9ab5e488d690444c59730f8ad286b2df60ab0353cd1d21dabc40e398a3b5a4');
const checks=[];function check(name,f){f();checks.push({name,pass:true})}
function take(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j)}
const line=(s,n)=>s.split('\n').find(x=>x.startsWith('function '+n+'('));
function rig(s=source){
 let next=0;const jobs=new Map(),inputs={zoomInput:{value:'800%'}},changed=[];
 const c={Math,Number,performance:{now:()=>c.now},now:0,sw:1222,sh:872,fitScale:.5,MIN_Z:.5,MAX_Z:640,SHEET_W:2384,SHEET_H:1684,
 camera:{cx:1192,cy:842,z:4,rot:0},highlight:null,revision:0,ready:false,vtQueue:new Map(),vtGoal:new Set(['old']),goalWanted:new Set(['old']),GB:null,
 clamp:(n,a,b)=>Math.max(a,Math.min(n,b)),geoOn:()=>false,geoRect:x=>x,
 requestAnimationFrame:f=>{jobs.set(++next,f);return next},cancelAnimationFrame:id=>jobs.delete(id),
 matchMedia:()=>({matches:false}),document:{activeElement:null,querySelectorAll:()=>[]},$:id=>inputs[id]||(inputs[id]={style:{}}),
 setLabel:x=>c.label=x,dropVTQueue(){for(const[k,q]of c.vtQueue)if(!q.goal)c.vtQueue.delete(k)},requestPaint(){changed.push(c.now)},touchInteraction(){},screenToSource:(x,y)=>({x,y}),keepUnder(){},toast(){},currentView:()=>({})};
 vm.createContext(c);vm.runInContext(take(s,'/* the zoom that fits a sheet-space rectangle',"/* the drawing's geometry lives in a worker"),c);
 c.frame=t=>{c.now=t;const pending=[...jobs.values()];jobs.clear();for(const f of pending)f(t)};
 c.snapshot=()=>JSON.parse(JSON.stringify(c.camera));c.pending=()=>jobs.size;c.changed=changed;
 return c;
}
const commands={fit:c=>c.fit(true),reference:c=>c.gotoRect([200,200,400,400],'Synthetic reference'),typedZoom:c=>{vm.runInContext(line(source,'applyZoomInput'),c);c.$('zoomInput').value='200%';c.applyZoomInput()}};
for(const[name,command]of Object.entries(commands))for(const motion of ['zoom','fling','rotate'])check(name+' owns camera after '+motion,()=>{
 const c=rig();if(motion==='zoom')c.zoomBy(2);else if(motion==='fling')c.fling(1,0);else c.rotateTo(90);c.vtQueue.set('old',{goal:true});command(c);const expected=c.snapshot();c.frame(32);c.frame(420);
 assert.deepStrictEqual(c.snapshot(),expected);assert.equal(c.pending(),0);assert.equal(c.vtGoal.size,0);assert.equal(c.goalWanted.size,0);assert.equal(c.vtQueue.size,0);
});
check('rotation replaces zoom without a late zoom frame',()=>{const c=rig();c.zoomBy(2);const z=c.camera.z;c.rotateTo(90);c.frame(420);assert.equal(c.camera.z,z);assert.equal(c.camera.rot,90)});
check('zoom replaces rotation while retaining the requested zoom glide',()=>{const c=rig();c.rotateTo(90);c.zoomBy(2);for(let t=16;t<=1000;t+=16)c.frame(t);assert.equal(c.camera.rot,0);assert.equal(c.camera.z,8)});
check('ordinary zoom remains time based and reaches its destination',()=>{for(const hz of [30,60,120]){const c=rig();c.zoomBy(2);for(let t=1000/hz;t<=1000;t+=1000/hz)c.frame(t);assert.equal(c.camera.z,8)}});
check('reduced motion remains an immediate zoom',()=>{const c=rig();c.matchMedia=()=>({matches:true});c.zoomBy(2);assert.equal(c.camera.z,8);assert.equal(c.pending(),0)});
for(const name of ['fit','reference'])check(name+' exact view matches v7.90 when no motion is pending',()=>{const a=rig(base),b=rig();commands[name](a);commands[name](b);assert.deepStrictEqual(a.snapshot(),b.snapshot())});
check('v7.90 family switch still fits and clears all motion',()=>{const c=rig();c.mode='original';c.geoOn=()=>c.mode!=='original';c.setSatState=()=>{};c.ensureKey=()=>Promise.resolve();c.setAttrib=()=>{};c.cancelTiles=()=>{};vm.runInContext(take(source,'function setMode(m)','/* v6.97 - one request for the key'),c);c.zoomBy(2);c.setMode('hybrid');const expected=c.snapshot();c.frame(400);assert.deepStrictEqual(c.snapshot(),expected);assert.equal(c.label,'Full master plan · as drawn')});
function pointerRig(){
 const calls=[],sel={style:{}},c={performance:{now:()=>100},pointers:new Map([[1,{x:10,y:10}]]),boxMode:true,boxStart:{x:10,y:10},gestureStart:null,panTrail:[],pinch:null,lastTap:{t:50},tapPick:null,camera:{cx:0,cy:0},Math,
 stagePoint:e=>({x:e.clientX,y:e.clientY}),screenToSource:(x,y)=>({x,y}),gotoRect:(r,l)=>calls.push({r,l}),$:()=>sel,setBox:x=>{c.boxMode=x},stage:{hasPointerCapture:()=>true,releasePointerCapture:id=>calls.push({release:id}),classList:{remove(){}}},changeView(){},zoomBy:()=>calls.push({zoom:true}),fling:()=>calls.push({fling:true})};
 vm.createContext(c);vm.runInContext(take(source,'function endPointer(e)',"stage.addEventListener('pointerup'"),c);c.calls=calls;return c;
}
check('cancelled box gesture never commits a jump or pick',()=>{const c=pointerRig();c.endPointer({type:'pointercancel',pointerId:1,pointerType:'touch',clientX:80,clientY:90});assert(!c.calls.some(x=>x.r||x.zoom||x.fling));assert.equal(c.tapPick,null);assert.equal(c.lastTap,null);assert.equal(c.pointers.size,0);assert.equal(c.boxMode,false)});
check('cancelled pinch releases both captures and does not reuse a tap',()=>{const c=pointerRig();c.boxStart=null;c.boxMode=false;c.pointers.set(2,{});c.pinch={};c.gestureStart={type:'touch',moved:false,t:0};c.endPointer({type:'pointercancel',pointerId:1,pointerType:'touch'});assert.equal(c.calls.filter(x=>x.release).length,2);assert.equal(c.pinch,null);assert.equal(c.gestureStart,null);assert.equal(c.tapPick,null);assert.equal(c.lastTap,null)});
check('completed box gesture still commits the exact rectangle',()=>{const c=pointerRig();c.endPointer({type:'pointerup',pointerId:1,pointerType:'touch',clientX:80,clientY:90});assert.deepStrictEqual(JSON.parse(JSON.stringify(c.calls[0].r)),[10,10,80,90])});
check('first sharp view resolves readiness without eager workers/fetches/timers',()=>{let ready=0,heavy=0;const c={maybeReady:()=>ready++,fetch:()=>heavy++,setTimeout:()=>heavy++,whenQuiet:()=>heavy++,ensureScene:()=>heavy++,underlayJob:()=>heavy++};vm.createContext(c);vm.runInContext(take(source,'function afterFirstSharp()','function maybeReady()'),c);c.afterFirstSharp();assert.equal(ready,1);assert.equal(heavy,0)});
// Protection checks bind source geometry and demand fallbacks, not a reimplementation of them.
for(const[name,a,b]of [
 ['georeferencing and tile density','function mat(m)','function tileKey(z, x, y)'],
 ['affine transforms and resize','function sheetToDevice(','/* ---------------------------------------------------------------- the satellite layer */'],
 ['pyramid rendering, range fetch and detail demand','const VT = 512,','let probeF = null'],
 ['drawing and original aerial demand','function draw()','/* the backing store follows the gesture'],
 ['DPR adaptive backing-store reuse','function applyDpr()','let lastInput ='],
 ['source labels and register picks','function alignmentPanel()','function chooseResult('],
 ['export detail and source demand',"$('exportBtn').onclick",'function onControls('],
 ['scene worker recovery and boot demand','function ensureScene()','/* v8.13 - keep first view']
 ])check(name+' preserved',()=>{
  let leftEnd=b;if(name==='scene worker recovery and boot demand')leftEnd='/* after the first sharp view: Original plan';
  assert.equal(take(source,a,b),take(base,a,leftEnd));
 });
check('DPR stays within pixel budgets and avoids redundant canvas resize',()=>{
 let writes=0;function canvas(){const o={_w:0,_h:0};Object.defineProperties(o,{width:{get:()=>o._w,set:v=>{writes++;o._w=v}},height:{get:()=>o._h,set:v=>{writes++;o._h=v}}});return o}
 const c={Math,stage:{getBoundingClientRect:()=>({width:390,height:700})},window:{devicePixelRatio:3},PHONE:true,SHEET_W:2384,SHEET_H:1684,canvas:canvas(),mcanvas:canvas(),interacting:false,dpr:1,movW:0,movH:0,changeView(){}};vm.createContext(c);vm.runInContext(take(source,'function resize(entries)','/* ---------------------------------------------------------------- the satellite layer */')+take(source,'function applyDpr()','let lastInput ='),c);c.resize();assert.equal(c.canvas.width,1170);assert.equal(c.canvas.height,2100);const first=writes;c.resize();assert.equal(writes,first);c.interacting=true;c.applyDpr();assert.equal(c.canvas.width,780);c.interacting=false;c.applyDpr();assert.equal(c.canvas.width,1170);c.stage.getBoundingClientRect=()=>({width:4000,height:3000});c.resize();assert(c.canvas.width*c.canvas.height<=9005000);
});
const report={author:'Andrew Fisher',sourcePath,sourceSha256:sha(source),baseSha256:sha(base),checks,passed:checks.length,failed:0,limits:['Isolated exact-source CPU fixtures; browser timing and appearance are checked separately.','No physical device frame-rate claim. No operational records or source geometry changed.']};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,sourceSha256:report.sourceSha256}));
