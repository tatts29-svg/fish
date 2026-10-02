/* Author: Andrew Fisher. Camera framing, preservation and recovery checks; no WebGL. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const checks=[];let delegated=0,draws=0,frames=0;
const modes=['auto','chase','onboard','hero','heli','top','wide','detail','frontdetail'];
const G={M_PER_PT:6,VIEWS:modes.map(x=>[x,x]),camStep(){delegated++;},framedFov:d=>d*Math.PI/180,
 setView(name){if(!modes.includes(name)&&!this.VIEWS.some(v=>v[0]===name))return null;const S=this.S;S.view=name;S.forceShot=name==='auto'?null:name;S.camBase=null;return name;},
 frame(){frames++;},render(){draws++;},captureContextState792(S){return {state:{sim:S.sim,clock:S.clock,view:S.view,forceShot:S.forceShot,cam:S.cam,paused:S.paused}};},
 restoreContextState792(S,back){Object.assign(S,back.state);return true;}};
const context={window:{GC3D:G,innerWidth:1280,innerHeight:720},document:{hidden:false},console};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'camera794_src.js'),'utf8'),context);
const TAU=Math.PI*2,N=240,points=Array.from({length:N},(_,i)=>[100*Math.cos(i*TAU/N),65*Math.sin(i*TAU/N),2.2]);
const lengths=[0];for(let i=1;i<=N;i++){const a=points[i-1],b=points[i%N];lengths.push(lengths[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
const CL={p:points,n:N,L:lengths[N],at(s){s=((s%this.L)+this.L)%this.L;let i=0;while(lengths[i+1]<s)i++;const a=points[i],b=points[(i+1)%N],t=(s-lengths[i])/(lengths[i+1]-lengths[i]);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,2.2];}};
function scene(width=1280,height=720){return {CL,gridS:0,clock:20,cv:{clientWidth:width,clientHeight:height},pack:{mPerPt:6},toWorld:p=>p.slice(),tune:{tc:1,carS:.38,deckH:.02,shiftX:.38,shiftY:-.04},sim:{s:0,v:7,lap:0,rnd(){throw Error('Camera must not consume simulation RNG');}},pose:{pos:[100,.02,0],hd:Math.PI/2},heightAt:()=>0,view:'chase',forceShot:'chase',paused:false};}
function locate(S,s){S.sim.s=s;const p=CL.at(s),q=CL.at(s+.1);S.pose={pos:[p[0],.02,p[1]],hd:Math.atan2(q[1]-p[1],q[0]-p[0])};}
function settle(S,mode){G.S=S;G.setView(mode);for(let i=0;i<150;i++){S.clock+=1/120;G.camStep(1/120);}return G.cameraReport794();}
function check(name,fn){fn();checks.push({name,passed:true});}
check('Full circuit fits both axes at all lap positions in landscape, portrait and ultrawide',()=>{
 for(const [w,h] of [[1280,720],[390,844],[2560,720]])for(const mode of ['top','wide'])for(let bin=0;bin<12;bin++){
  const S=scene(w,h);locate(S,CL.L*bin/12);const r=settle(S,mode);assert(r.wholeCircuitInFrame,mode+' '+w+' '+bin);assert.strictEqual(r.visibleRouteVertices,N);
 }
});
check('Forward-facing chase and car-follow retain the car in frame throughout lap',()=>{
 for(const [w,h] of [[1280,720],[390,844]])for(const mode of ['chase','hero','heli'])for(let bin=0;bin<12;bin++){
  const S=scene(w,h);locate(S,CL.L*bin/12);const r=settle(S,mode);assert(r.carInFrame,mode+' '+w+' '+bin+' '+JSON.stringify(r.carScreen));assert(r.obstructionClear);
 }
});
check('Driver aims along the forthcoming route and uses a road-level lens',()=>{
 const S=scene();locate(S,CL.L*.17);const r=settle(S,'onboard'),q=CL.at(S.sim.s+r.lookAheadM/6);
 assert(Math.hypot(r.target[0]-q[0],r.target[2]-q[1])<1e-9);assert(r.eye[1]*6<2);assert(r.lookAheadM>10);
});
check('Tour includes every diagnostic lap section and recurring aerial orientation',()=>{
 const S=scene(),seen=new Set(),rigs=new Set();
 for(let bin=0;bin<12;bin++){locate(S,CL.L*(bin+.25)/12);const r=settle(S,'tour');seen.add(r.lapSection);rigs.add(r.shot);}
 assert.strictEqual(seen.size,12);for(const mode of ['chase','onboard','heli','hero','wide'])assert(rigs.has(mode));
 S.clock=0;S.cam=null;const r=settle(S,'tour');assert.strictEqual(r.shot,'top');assert(r.wholeCircuitInFrame);
});
check('Camera-only updates preserve simulation, source route and source building rows',()=>{
 const S=scene(),source=[{h:20,p:[[20,20],[23,20],[23,23],[20,23]]}];S.architecture781Source=source;
 const saved=JSON.stringify({sim:S.sim,CL:CL.p,buildings:source});settle(S,'tour');settle(S,'heli');settle(S,'onboard');
 assert.strictEqual(JSON.stringify({sim:S.sim,CL:CL.p,buildings:source}),saved);
});
check('Exact building footprints avoid false high lifts from coarse city cells',()=>{
 const S=scene();S.heightAt=()=>99;S.architecture781Source=[{h:99,p:[[20,20],[23,20],[23,23],[20,23]]}];
 const r=settle(S,'onboard');assert(r.eye[1]*6<2);assert(!r.obstructionAdjusted);assert(r.obstructionClear);
});
check('Expanded footprint clearance avoids a building intersecting the requested camera',()=>{
 const S=scene();const before=settle(S,'chase'),e=before.eye;
 S.architecture781Source=[{h:6,p:[[e[0]-.2,e[2]-.2],[e[0]+.2,e[2]-.2],[e[0]+.2,e[2]+.2],[e[0]-.2,e[2]+.2]]}];
 G.camStep(1/120);const r=G.cameraReport794();assert(r.obstructionClear);assert(r.obstructionAdjusted);
});
check('Manual selection transitions continuously and finishes after one second',()=>{
 const S=scene();settle(S,'chase');const from=S.cam.eye.slice();G.setView('heli');G.camStep(0);
 assert(Math.hypot(...S.cam.eye.map((x,i)=>x-from[i]))<1e-9);assert(G.cameraReport794().transitionActive);
 for(let i=0;i<121;i++)G.camStep(1/120);assert(!G.cameraReport794().transitionActive);assert.strictEqual(G.cameraReport794().shot,'heli');
});
check('Paused selection animates camera without stepping the simulation or original frame',()=>{
 const S=scene();settle(S,'chase');S.paused=true;const sim=JSON.stringify(S.sim),beforeFrames=frames,beforeDraws=draws;
 G.setView('heli');G.camStep(0);for(let i=0;i<63;i++)G.frame(i*1000/60);
 assert(!G.cameraReport794().transitionActive);assert.strictEqual(JSON.stringify(S.sim),sim);assert(draws>beforeDraws);assert(frames-beforeFrames<=2);
});
check('Reduced motion settles camera selection immediately and stops an active transition',()=>{
 const S=scene();settle(S,'chase');S.paused=true;S.reducedMotion=true;G.setView('top');G.camStep(0);
 assert(!G.cameraReport794().transitionActive);assert(G.cameraReport794().wholeCircuitInFrame);
 S.reducedMotion=false;G.setView('chase');G.camStep(.1);assert(G.cameraReport794().transitionActive);
 S.reducedMotion=true;G.frame(100);assert(!G.cameraReport794().transitionActive);assert.strictEqual(G.cameraReport794().shot,'chase');
 S.reducedMotion=false;context.motionOff=()=>true;G.setView('top');G.camStep(0);assert(!G.cameraReport794().transitionActive);assert(G.cameraReport794().wholeCircuitInFrame);delete context.motionOff;
});
check('Context recovery preserves selected view and in-progress camera blend without old caches',()=>{
 const S=scene();settle(S,'chase');G.setView('heli');G.camStep(.1);const report=G.cameraReport794(),back=G.captureContextState792(S),fresh=scene();
 G.S=fresh;G.restoreContextState792(fresh,back);assert.strictEqual(fresh.camera794.view,report.view);assert.strictEqual(fresh.camera794.transition.elapsed,.1);
 assert.strictEqual(fresh.routeCamera794,null);assert.strictEqual(fresh.cameraCollision794,null);assert.strictEqual(fresh.tune.shiftX,0);
});
check('Detail, plant, tow, fireworks and diagnostic views delegate to existing camera',()=>{
 for(const kind of ['detail','plant','tow','fireworks','debug']){
  const S=scene();settle(S,'chase');if(kind==='detail')G.setView('detail');if(kind==='plant')S.vehicle='forklift';if(kind==='tow')S.towVms=true;if(kind==='fireworks')S.fw={cam:true};if(kind==='debug')S.camDebug={};
  const before=delegated;G.camStep(.01);assert.strictEqual(delegated,before+1);assert(!G.cameraReport794().enabled);assert.strictEqual(S.tune.shiftX,.38);
 }
});
check('Camera reset drops prior-lap anchor and recreates deterministic opening view',()=>{
 const S=scene();locate(S,CL.L*.6);settle(S,'tour');S.cam=null;S.clock=0;locate(S,0);G.camStep(0);
 const r=G.cameraReport794();assert.strictEqual(r.shot,'top');assert.strictEqual(r.lapSection,1);assert(r.wholeCircuitInFrame);
});
const result={author:'Andrew Fisher',passed:true,checks,scope:'CPU camera geometry and lifecycle; actual GPU rendering and motion require browser review',physicsModified:false,glResources:0};
const out=path.join(__dirname,'evidence');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'camera794_checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length}));
