/* Author: Andrew Fisher. Actual original car/powertrain geometry, read only.
 * node 03_GC500_Delivery_Control/v13.03_mechanic_service_DRAFT/tests/test_workshop_service.mjs
 * No network, browser or record writes. Crane/crew are explicit transform fixtures;
 * the dedicated mechanic and browser suites cover their full rendered geometry.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const commit='04b39247275b6b99475185560e43828f1c8fdcec',prefix='03_GC500_Delivery_Control/v8.09_coates_way_machine_LIVE/work/';
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'coates-service-'));
try{
  const files=execFileSync('git',['ls-tree','-r','--name-only',commit,'--',prefix],{cwd:repo,encoding:'utf8'}).trim().split('\n');
  for(const filename of files){if(!filename.endsWith('.js'))continue;const relative=filename.slice(prefix.length);assert.ok(filename.startsWith(prefix)&&!relative.split('/').includes('..'));const target=path.join(temporary,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,execFileSync('git',['show',`${commit}:${filename}`],{cwd:repo,maxBuffer:16*1024*1024}));}
  fs.writeFileSync(path.join(temporary,'package.json'),'{"type":"module"}');
  const original=name=>import(pathToFileURL(path.join(temporary,name)).href);
  const current=name=>import('data:text/javascript;base64,'+fs.readFileSync(path.resolve(here,'../'+name)).toString('base64'));
  const T=await original('vendor/three.module.js'),{buildPowertrain}=await original('car-powertrain.js'),{buildCarBody}=await original('car-body.js'),{fitCarMechanics}=await original('car-fit.js');
  const {installEngineLiftPreview}=await current('engine-lift-preview.js'),{installWorkshopService}=await current('workshop-service.js');
  const scene=new T.Scene(),engine=buildPowertrain(T),body=buildCarBody(T);fitCarMechanics(T,body,engine);scene.add(engine.root,body.root);
  const studioRoot=new T.Group(),machinery=new T.Group(),bridge=new T.Group(),trolley=new T.Group(),hook=new T.Group(),drum=new T.Group(),ropes=new T.Group();scene.add(studioRoot);studioRoot.add(machinery);machinery.add(bridge);bridge.position.x=13;bridge.add(trolley);trolley.position.z=-4;trolley.add(hook,drum,ropes);hook.position.y=4.6;drum.name='crane hoist drum';ropes.name='crane ropes';ropes.position.y=9.1;
  studioRoot.userData.machinery={group:machinery,crane:{bridge,trolley,hook},state:{crane:{x:13,z:-4,hook:4.6}}};
  const drive={running:false,stationary:true,assembled:true,locked:false,stop(){this.running=false;}};
  const finishCode=fs.readFileSync(path.resolve(here,'../workshop-finish.js'));
  const{installWorkshopFinish}=await import('data:text/javascript;base64,'+finishCode.toString('base64'));
  const finish=installWorkshopFinish({T,engine,studioRoot});
  const before=new Map();scene.updateMatrixWorld(true);scene.traverse(o=>before.set(o,{parent:o.parent,children:o.children.slice(),p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),visible:o.visible,instances:o.isInstancedMesh?new Float32Array(o.instanceMatrix.array):null}));
  const lift=installEngineLiftPreview({T,scene,engine,body,studioRoot,drive});
  const mechanic={entered:0,exited:0,last:null,enter(){this.entered++;},exit(){this.exited++;},pose(cue){this.last=cue;}};
  const service=installWorkshopService({T,scene,engine,body,studioRoot,lift,mechanic});
  let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
  check(service.enter().ok,'Enter assembled scene');check(mechanic.entered===1,'Mechanic entered once');
  const gearbox=engine.removable.find(p=>p.id==='gearbox').group,bolts=gearbox.children.find(o=>o.name==='Hex fasteners'),originalBolt=before.get(bolts).instances;
  check(bolts.count===10&&service.diagnostics.fastenerCount===10,'Ten actual original bellhousing fasteners');
  assert.deepEqual(bolts.instanceMatrix.array,originalBolt,'Connected state uses exact original fastener matrices');
  const clampGroup=engine.removable.find(p=>p.id==='cooling-system').group.getObjectByName('Workshop detail · cooling-system');
  for(const child of clampGroup.children)assert.deepEqual(child.instanceMatrix.array,before.get(child).instances,'Connected finish clamps retain original matrices');
  const port=scene.getObjectByName('Modelled upper-hose engine-side connection'),portQuaternion=port.quaternion.clone();
  service.setProgress(.18);check(port.quaternion.angleTo(portQuaternion)<1e-7,'Engine-side port does not turn as the loose hose is moved');
  for(const child of clampGroup.children){const original=before.get(child).instances;check(child.instanceMatrix.array.some((v,i)=>v!==original[i]),'Existing finish clamp follows the released hose');for(const index of[0,2])assert.deepEqual(child.instanceMatrix.array.slice(index*16,index*16+16),original.slice(index*16,index*16+16),'Radiator-side finish clamp stays fixed');}
  service.setProgress(0);
  const samples=[];
  for(let n=0;n<=200;n++){
    const p=n/200;service.setProgress(p);service.update(0);const d=service.diagnostics,ld=lift.diagnostics;
    check(drive.locked&&!drive.running,'Drive remains locked and stopped');check(!lift.playing,'Service alone owns the lift clock');
    check(d.targets.work.every(Number.isFinite)&&d.targets.grip.every(Number.isFinite),'Finite actual work/grip points');
    if(p<.30)check(lift.progress===0,'Engine remains in bay until rigging phase is complete');
    if(p>.30&&p<.78){check(ld.rigging.attached===1&&ld.rigging.clear===0,'Suspended engine stays attached');check(d.targets.task==='stand-clear','Mechanic clear during all engine movement');check(!lift.setRigging({attached:0,clear:0}),'Cannot unhook a suspended engine');}
    if(p>=.78)check(lift.progress===1,'Supported engine held still during unhook');
    if(ld.rigging.clear>0)check(ld.rigging.attached===0,'Rig only traverses clear with all legs released');
    check(service.benchReady===(p>=.94),'Bench gate waits for unhook and clear');
    const box=lift.engineBounds;check(box.min.y>=.10,'Load stays above the floor');
    for(const id of ['cockpit','gearbox','steering-rack','rear-differential','front-suspension'])check(engine.removable.find(part=>part.id===id).group.parent===engine.root,`${id} stays on the car`);
    for(const point of lift.riggingTargets)if(point.attached)check(point.eye.every((v,i)=>Math.abs(v-point.hook[i])<1e-9),'Attached sling connector remains on its actual lifting eye');
    samples.push({p,load:ld.loadWorld.slice(),rigging:{...ld.rigging},rigPoints:lift.riggingTargets,bolts:Array.from(bolts.instanceMatrix.array),hoses:d.hoseAmounts.slice()});
  }
  check(service.stage.includes('rig clear')&&service.benchReady,'Bench state has clear unloaded rig');
  check(service.diagnostics.rigging.attached===0&&service.diagnostics.rigging.clear===1,'Terminal rig fully unhooked and clear');
  const leading=[],returns=[];scene.traverse(o=>{if(o.name==='Engine sling')leading.push(o);if(o.name==='Slack sling return')returns.push(o);});
  for(let i=0;i<4;i++){const top=new T.Vector3(0,-.5,0).applyMatrix4(leading[i].matrixWorld),bend=new T.Vector3(0,.5,0).applyMatrix4(leading[i].matrixWorld),end=new T.Vector3(0,.5,0).applyMatrix4(returns[i].matrixWorld);check(bend.y<Math.min(top.y,end.y),'Returned sling sags downward');}
  check(scene.getObjectByName('Sling return keeper')!==undefined,'Returned connectors have actual beam keeper geometry');
  const tray=scene.getObjectByName('Fastener tray'),trayBox=new T.Box3().setFromObject(tray),matrix=new T.Matrix4();
  for(let i=0;i<bolts.count;i++){bolts.getMatrixAt(i,matrix);const box=bolts.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(bolts.matrixWorld,matrix));check(Math.abs(box.min.y-trayBox.max.y)<.001,'Removed original fastener contacts tray');}
  const stable=service.diagnostics,stableMatrices=new Float32Array(bolts.instanceMatrix.array),stableLoad=lift.diagnostics.loadWorld.slice();
  for(let i=0;i<20;i++)service.update(.1);
  check(service.progress===1&&lift.diagnostics.loadWorld.every((v,i)=>v===stableLoad[i]),'Paused supported scene does not drift');
  check(service.diagnostics.tubeUpdates===stable.tubeUpdates&&service.diagnostics.fastenerUpdates===stable.fastenerUpdates,'Paused frames do not rebuild hoses or fastener buffers');
  assert.deepEqual(bolts.instanceMatrix.array,stableMatrices,'Paused fasteners unchanged');
  service.setDirection(-1);
  for(let n=200;n>=0;n--){service.setProgress(n/200);const sample=samples[n],d=service.diagnostics,ld=lift.diagnostics;check(ld.loadWorld.every((v,i)=>Math.abs(v-sample.load[i])<1e-9),'Reverse load path identical');check(d.hoseAmounts.every((v,i)=>v===sample.hoses[i]),'Reverse hose positions identical');assert.deepEqual(Array.from(bolts.instanceMatrix.array),sample.bolts,'Reverse preserves deterministic fastener path');assert.deepEqual(lift.riggingTargets,sample.rigPoints,'Reverse retraces rig connectors and handling lines exactly');}
  assert.deepEqual(bolts.instanceMatrix.array,originalBolt,'Refit restores original fastening matrices');
  check(service.stage.includes('connections restored'),'Complete reverse reaches connected state');
  service.setDirection(1);service.setPlaying(true);for(let i=0;i<100;i++)service.update(.1);
  check(Math.abs(service.progress-.018)<1e-9,'Approach clock permits walking rather than running');
  service.setPlaying(false);const paused=service.progress;service.update(.1);check(service.progress===paused,'Pause holds master progress');
  service.setProgress(.18*.62);mechanic.state={maxProgressPerSecond:.0005};service.setPlaying(true);const capped=service.progress;service.update(.1);check(Math.abs(service.progress-capped-.00005)<1e-10,'Crew walking limit controls the master clock at the first work frame');mechanic.state={};service.setPlaying(false);
  service.setProgress(1);check(service.refit()&&service.progress===1,'Refit starts without a jump');service.update(.1);check(service.direction===-1&&service.progress<1,'Refit advances reverse master clock');
  service.reset();check(service.progress===0&&!service.playing&&service.direction===1,'Reset restores initial master state');
  service.setPlaying(true);for(let i=0;i<1000&&service.playing;i++)service.update(.1);check(service.progress===1&&service.benchReady&&!service.playing,'Full playback crosses every work boundary and reaches the clear bench');
  service.refit();for(let i=0;i<1000&&service.playing;i++)service.update(.1);check(service.progress===0&&!service.playing,'Full reverse playback crosses every work boundary and reconnects');assert.deepEqual(bolts.instanceMatrix.array,originalBolt,'Full played refit restores original fastening matrices');
  service.exit();check(!service.active&&!lift.active&&!drive.locked&&mechanic.exited===1,'Exit restores drive and mechanic ownership');
  for(const [o,s]of before){check(o.parent===s.parent,`${o.name}: parent restored`);check(o.position.equals(s.p)&&o.quaternion.equals(s.q)&&o.scale.equals(s.s),`${o.name}: transform restored`);check(o.visible===s.visible,`${o.name}: visibility restored`);if(s.instances)assert.deepEqual(o.instanceMatrix.array,s.instances,`${o.name}: original instance data restored`);const retained=o.children.filter(c=>before.has(c));assert.deepEqual(retained,s.children,`${o.name}: original child order restored`);}
  for(let i=0;i<3;i++){check(service.enter().ok,'Repeated entry works');service.setProgress(.86);service.exit();}
  service.dispose();lift.dispose();finish.dispose();
  console.log(JSON.stringify({passed:true,checks,originalSource:commit,progressSamples:201,originalFasteners:10,originalEngineParts:101,craneAndCrew:'Transform fixtures; rendered integration checked separately'}));
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
