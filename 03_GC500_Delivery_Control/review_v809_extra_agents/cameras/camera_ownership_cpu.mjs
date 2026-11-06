// Author: Andrew Fisher. Source-bound actual OrbitControls/driver-camera tests, no DOM or GPU.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import crypto from 'node:crypto';
if(!process.argv[2]||!process.argv[3]||!process.argv[4])throw Error('Usage: node camera_ownership_cpu.mjs /path/to/car-app.js baseline|patched expected-sha256');
const input=path.resolve(process.argv[2]),root=path.dirname(input),mode=process.argv[3],src=fs.readFileSync(input,'utf8'),sha=crypto.createHash('sha256').update(src).digest('hex');assert.match(process.argv[4],/^[a-f0-9]{64}$/);assert.equal(sha,process.argv[4]);
const T=await import(root+'/vendor/three.module.js');const {segmentClear,OBSTACLES}=await import(root+'/crew.js');
const orbitSource=fs.readFileSync(root+'/vendor/OrbitControls.js','utf8').replace("from 'three'",'from '+JSON.stringify('file://'+root+'/vendor/three.module.js'));
const {OrbitControls}=await import('data:text/javascript;base64,'+Buffer.from(orbitSource).toString('base64'));
const section=src.slice(src.indexOf("const DX={state:"),src.indexOf('/* v6.99b — SMALL PARTS'));
const confine=src.slice(src.indexOf('function confineCamera()'),src.indexOf("/* v6.92 — THE DRIVER'S EYES."));
const frame='{'+src.slice(src.indexOf('controls.dampingFactor=1-Math.pow'),src.indexOf('}highlight.visible=false;updateFrustum()'))+'}';
const start=src.split("controls.addEventListener('start',()=>{")[1].split('});')[0];
const gate=src.slice(src.indexOf('if(assemblyFit&&!camTween&&!DXC.mode)'),src.indexOf("if(view==='cog')seatCamera(now,dt);else{if(DXC.mode)"));
assert(frame.includes('controls.update()')&&confine.includes('function confineCamera')&&start.includes('dxCamCancel()'));
const out={author:'Andrew Fisher',source:input,sha256:sha,mode,assertions:[],measurements:[]};
const check=(name,x)=>{assert(x,name);out.assertions.push({name,pass:true});};
function setup(aspect){const camera=new T.PerspectiveCamera(24,aspect,.01,100);camera.position.set(-10,2,5);const controls=new OrbitControls(camera,null);controls.target.set(0,.5,0);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxDistance=20;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.04;controls.update();
 const s={T,Math,console,camera,controls,CREW_OBSTACLES:OBSTACLES,crewSegmentClear:segmentClear,carAssets:[],GARAGE:{front:-27,back:27,far:-21,near:21},CAM_MAX_Y:8,TARGET_MAX_Y:6,LOOK:{fov:24},ready:true,view:'car',reduced:false,camTween:null,followPart:false,assemblyFit:false,dt:1/60,drive:{spread:0,spreadTarget:0,pulls:[],pullTargets:[]}};
 vm.createContext(s);vm.runInContext(section+confine+';globalThis.api={DX,DXC,dxShot,dxCamGo,dxCamStep,dxCamStart,dxCamCancel,doorReach};',s);
 controls.addEventListener('start',()=>vm.runInContext(start,s));return s;}
function useShot(s){Object.assign(s.api.DX,{state:'exiting',phase:'stepout'});const shot=s.api.dxShot();s.camera.position.copy(shot.pos);s.controls.target.copy(shot.target);s.camera.lookAt(shot.target);s.camera.updateMatrixWorld();s.api.DXC.mode='hold';return shot;}
for(const aspect of [1.6,.791,.65,.552,.524,.5,.4]){const s=setup(aspect),shot=useShot(s),desired=s.camera.position.clone();vm.runInContext(frame,s);s.camera.updateMatrixWorld();
 const R=s.api.doorReach(),points=[];for(const p of [[.7,-1.5],R.out,[-1,-2.85],[-3,-2.8],[-2.62,-1.12],[2.62,-1.12]])for(const y of [0,1.95])points.push(new T.Vector3(p[0],y,p[1]).project(s.camera));
 const error=s.camera.position.distanceTo(desired),maxX=Math.max(...points.map(p=>Math.abs(p.x))),maxY=Math.max(...points.map(p=>Math.abs(p.y)));
 out.measurements.push({aspect,desiredDistance:desired.distanceTo(shot.target),drawnDistance:s.camera.position.distanceTo(shot.target),poseError:error,maxX,maxY});
 check(`aspect ${aspect}: manual maxDistance unchanged`,s.controls.maxDistance===20);
 if(mode==='patched'){check(`aspect ${aspect}: shot pose survives real control update`,error<1e-9);check(`aspect ${aspect}: intended action points remain in frame`,maxX<=1&&maxY<=1);}
 else if(aspect<=.552)check(`aspect ${aspect}: original clamp reproduced`,error>.1);
}
{const s=setup(.524),shot=useShot(s);s.controls._sphericalDelta.theta=.3;s.controls._panOffset.set(.15,0,.08);const originalPan=s.controls._panOffset.length();
 for(let i=0;i<60;i++)vm.runInContext(frame,s);
 check('orbit residual decays while driver shot owns camera',Math.abs(s.controls._sphericalDelta.theta)<.003);check('pan residual decays while driver shot owns camera',s.controls._panOffset.length()<originalPan*.01);
 if(mode==='patched'){check('residual input does not move authored camera',s.camera.position.distanceTo(shot.pos)<1e-9);check('residual pan does not move authored target',s.controls.target.distanceTo(shot.target)<1e-9);}
 s.controls.dispatchEvent({type:'start'});check('actual gesture-start handler immediately releases ownership',s.api.DXC.mode===null&&s.api.DXC.saved===null);vm.runInContext(frame,s);check('manual max distance applies after gesture release',s.camera.position.distanceTo(s.controls.target)<=20+1e-9);
}
{const s=setup(.524),home=s.camera.position.clone(),homeTarget=s.controls.target.clone();useShot(s);s.api.DXC.saved={pos:home.clone(),target:homeTarget.clone()};s.api.dxCamGo(home,homeTarget,'back');
 for(let i=0;i<74;i++){s.api.dxCamStep(1/60);vm.runInContext(frame,s);}
 check('completed return releases ownership',s.api.DXC.mode===null&&s.api.DXC.saved===null);check('completed return reaches saved position',s.camera.position.distanceTo(home)<1e-8);check('completed return reaches saved target',s.controls.target.distanceTo(homeTarget)<1e-8);
 let fits=0;s.assemblyFit=true;s.fit=()=>{fits++;};vm.runInContext(gate,s);check('separate assemblyFit follow-on remains explicit',fits===1);out.measurements.push({assemblyFitFollowOn:fits,note:'Source interaction is unchanged; original exact-return test omits this real-frame gate.'});
}
{const s=setup(.524);useShot(s);s.api.dxCamCancel();check('view/reset cancellation releases ownership',s.api.DXC.mode===null);s.camera.position.set(-8,3,4);s.controls.target.set(0,.5,0);const p=s.camera.position.clone();vm.runInContext(frame,s);check('no stale scripted pose restored after cancellation',s.camera.position.distanceTo(p)<1e-8);}
{const s=setup(.791);s.reduced=true;Object.assign(s.api.DX,{state:'exiting',phase:'door'});s.api.dxCamStart('out');s.api.dxCamStep(1/60);const shot=s.camera.position.clone();vm.runInContext(frame,s);check('reduced-motion camera reaches hold on first frame',s.api.DXC.mode==='hold');if(mode==='patched')check('reduced-motion cut preserved through controls',s.camera.position.distanceTo(shot)<1e-9);}
console.log(JSON.stringify(out,null,2));
