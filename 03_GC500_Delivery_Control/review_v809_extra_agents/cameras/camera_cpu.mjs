// Author: Andrew Fisher. Source-bound CPU review: no browser, network or writes to scene state outside this process.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
if(!process.argv[2])throw Error('Usage: node camera_cpu.mjs /path/to/work/car-app.js [baseline|patched] [expected-sha256]');
const input=path.resolve(process.argv[2]);
const root=path.dirname(input);
const mode=process.argv[3]||'baseline';
const orbitSource=fs.readFileSync(root+'/vendor/OrbitControls.js','utf8').replace("from 'three'",'from '+JSON.stringify('file://'+root+'/vendor/three.module.js'));
const {OrbitControls}=await import('data:text/javascript;base64,'+Buffer.from(orbitSource).toString('base64'));
const T=await import(root+'/vendor/three.module.js');
const {Crewman,buildFigure,segmentClear,OBSTACLES}=await import(root+'/crew.js');
const src=fs.readFileSync(input,'utf8');
const sourceHash=crypto.createHash('sha256').update(src).digest('hex');
const expectedHash=process.argv[4]||(mode==='patched'?'39df72cf086d5a3b31f0288a2d3b6f11c4ed4161f5ff9f95f212e3a41d1542e1':'718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707');
assert.match(expectedHash,/^[0-9a-f]{64}$/,'Explicit combined-source SHA-256, if supplied');
assert.equal(sourceHash,expectedHash,'Reviewed source hash');
const section=src.slice(src.indexOf("const DX={state:"),src.indexOf('/* v6.99b — SMALL PARTS'));
assert(section.includes('function driverStep(dt)'));
function context(aspect=1.8){
 const camera=new T.PerspectiveCamera(24,aspect,.01,100);camera.position.set(-10,2,5);
 const sandbox={T,console,Math,CREW_OBSTACLES:OBSTACLES,crewSegmentClear:segmentClear,carAssets:[],
  GARAGE:{front:-27,back:27,far:-21,near:21},CAM_MAX_Y:8,LOOK:{fov:24},camera,controls:{target:new T.Vector3(0,.5,0)},
  ready:true,view:'car',reduced:false,camTween:null,followPart:false,tempQuat:new T.Quaternion(),yAxis:new T.Vector3(0,1,0),
  drive:{spread:0,spreadTarget:0},engine:{root:{getObjectByName:()=>null}},applySpread:()=>{},
  crew:{release:m=>{m.path=null;},arrived:m=>!m.path,walk:()=>{}}};
 vm.createContext(sandbox);vm.runInContext(section+';globalThis.api={DX,DXC,driverStep,dxShot,dxCamStart,dxCamGo,dxCamStep,driverShow,driverHome};',sandbox);
 const fig=buildFigure(T,{title:'race driver',label:6,height:1.78,build:1,helmet:'crew'}),m=new Crewman(fig,{seed:26,name:'race driver',walk:1.05});
 fig.root.visible=false;sandbox.api.DX.fig=fig;sandbox.api.DX.man=m;
 return sandbox;
}
const out={author:'Andrew Fisher',source:root+'/car-app.js',sourceHash,mode,checks:[]};
function check(name,actual,expected){assert.equal(actual,expected,name);out.checks.push({name,pass:true});}
// Stop on the first frame in which the walking figure becomes visible, exactly like frameBody.
for(const old of [[0,0],[-4.4,-4.9]]){
 const s=context(),{DX,driverStep}=s.api,m=DX.man;
 m.place(old[0],old[1],0);m.update(0);
 if(old[0]!==0){Object.assign(DX,{state:'out',phase:null,seated:false});s.api.driverHome();check('Reset driverHome hides former safe-point walker',m.fig.root.visible,false);}
 const clockBefore={t:m.t,idle:m.idleT};
 Object.assign(DX,{state:'exiting',phase:'door',door:1,doorTo:1,seated:true});
 driverStep(1/60);
 const delta=m.fig.root.position.distanceTo(m.pos);
 out.checks.push({name:'first visible walker at logical sill position',previous:old,phase:DX.phase,visible:m.fig.root.visible,logical:m.pos.toArray(),drawn:m.fig.root.position.toArray(),errorMetres:delta});
 check('walker exposed on door-complete frame',m.fig.root.visible,true);
 check('first exposed root is current (regression expectation)',delta<1e-9,mode==='patched');
 if(mode==='patched'){check('zero-time sync retains crouch',m.post.k,1);check('zero-time sync does not advance clock',m.t,clockBefore.t);check('zero-time sync does not advance idle',m.idleT,clockBefore.idle);const finite=Object.values(m.fig.bones).every(b=>[...b.position.toArray(),...b.quaternion.toArray()].every(Number.isFinite));check('zero-time sync leaves all bone transforms finite',finite,true);}
 driverStep(1/60);check('next-frame root is current',m.fig.root.position.distanceTo(m.pos)<1e-9,true);
}
// Source frustum math: test actual viewport aspects without GPU, using source dxShot.
for(const aspect of [2.2,1.6,1,.65,.552,.524,.5,.4]){
 const s=context(aspect),{pos,target}=s.api.dxShot();s.camera.position.copy(pos);s.camera.lookAt(target);s.camera.updateMatrixWorld();
 const foot=new T.Vector3(.70,0,-1.50).project(s.camera),head=new T.Vector3(.70,1.78,-1.50).project(s.camera);
 const controls=new OrbitControls(s.camera,null);controls.target.copy(target);controls.maxDistance=20;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.04;controls.update();s.camera.updateMatrixWorld();
 const shotCorners=[];for(const x of [-3,2.63542139789])for(const y of [0,1.95])for(const z of [-2.85,-1.12])shotCorners.push(new T.Vector3(x,y,z).project(s.camera));
 out.checks.push({name:'real OrbitControls after scripted shot',aspect,scriptedDistance:pos.distanceTo(target),drawnDistance:s.camera.position.distanceTo(target),maxAbsX:Math.max(...shotCorners.map(p=>Math.abs(p.x))),maxAbsY:Math.max(...shotCorners.map(p=>Math.abs(p.y))),allInside:shotCorners.every(p=>Math.abs(p.x)<=1&&Math.abs(p.y)<=1)});
 out.checks.push({name:'door-shot silhouette projection',aspect,camera:pos.toArray(),target:target.toArray(),foot:foot.toArray(),head:head.toArray(),heightFraction:(head.y-foot.y)/2,inside:[foot,head].every(p=>Math.abs(p.x)<=1&&Math.abs(p.y)<=1&&p.z>=-1&&p.z<=1)});
}
// Real frame ordering after camera return: source's assemblyFit gate starts another fit immediately.
const gate=src.slice(src.indexOf('if(assemblyFit&&!camTween&&!DXC.mode)'),src.indexOf("if(view==='cog')seatCamera(now,dt);else{if(DXC.mode)"));
assert(gate.startsWith('if(assemblyFit'));
const s=context();let fitCalls=0;s.assemblyFit=true;s.drive.pulls=[];s.drive.pullTargets=[];s.fit=()=>{fitCalls++;};
s.api.DXC.mode=null;s.camTween=null;vm.runInContext(gate,s);
check('real frame requests fit once driver-camera relinquishes control',fitCalls,1);
out.checks.push({name:'test coverage gap',fastForwardContainsAssemblyFit:/function advance\([^]*?\n/.exec(src)?.[0].includes('assemblyFit')||false,realFrameGate:gate});
console.log(JSON.stringify(out,null,2));
