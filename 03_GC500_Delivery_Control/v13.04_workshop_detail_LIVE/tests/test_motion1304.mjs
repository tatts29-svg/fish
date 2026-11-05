/* Author: Andrew Fisher. v13.04 actual original crew/engine geometry, deterministic master
 * scrubbing, contact/floor/clearance, and complete original-state restoration.
 * Optional WORKSHOP_MECHANIC_SOURCE supplies extracted original machine modules.
 * No browser, network access or operational record writes are used by this test.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)), release=path.resolve(here,'..'), repo=path.resolve(here,'../../..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'coates-working-mechanic-'));
const prefix='03_GC500_Delivery_Control/v8.09_coates_way_machine_LIVE/work/',commit='04b39247275b6b99475185560e43828f1c8fdcec';
let checks=0;const check=(value,label)=>{assert.ok(value,label);checks++;};
try{
  if(process.env.WORKSHOP_MECHANIC_SOURCE)fs.cpSync(process.env.WORKSHOP_MECHANIC_SOURCE,temp,{recursive:true});
  else for(const name of execFileSync('git',['ls-tree','-r','--name-only',commit,'--',prefix],{cwd:repo,encoding:'utf8'}).trim().split('\n')){
    if(!name.endsWith('.js'))continue;const rel=name.slice(prefix.length);assert.ok(name.startsWith(prefix)&&!rel.split('/').includes('..'));
    const dest=path.join(temp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,execFileSync('git',['show',`${commit}:${name}`],{cwd:repo,maxBuffer:16*1024*1024}));
  }
  fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
  fs.copyFileSync(path.resolve(release,'../v13.02_machine_workshop_LIVE/crew-polish.js'),path.join(temp,'crew-polish.js'));
  for(const name of ['workshop-mechanic.js','workshop-service.js','engine-lift-preview.js','workshop-showcase.js','workshop-lessons.js']){
    const source=path.join(release,name);
    fs.copyFileSync(fs.existsSync(source)?source:path.resolve(release,'../v13.03_mechanic_service_LIVE',name),path.join(temp,name));
  }
  const load=name=>import(pathToFileURL(path.join(temp,name)).href);
  const T=await load('vendor/three.module.js'),{buildCrew}=await load('crew.js'),{mountCrewPolish}=await load('crew-polish.js');
  const {buildPowertrain}=await load('car-powertrain.js'),{buildCarBody}=await load('car-body.js'),{fitCarMechanics}=await load('car-fit.js');
  const {installEngineLiftPreview}=await load('engine-lift-preview.js'),{installWorkshopMechanic}=await load('workshop-mechanic.js'),{installWorkshopService}=await load('workshop-service.js');
  const scene=new T.Scene(),engine=buildPowertrain(T),body=buildCarBody(T);fitCarMechanics(T,body,engine);scene.add(engine.root,body.root);
  const crew=buildCrew();scene.add(crew.root);const polish=mountCrewPolish({T,crew}),man=crew.men.mechanic;
  const studioRoot=new T.Group(),mx=new T.Group();scene.add(studioRoot);studioRoot.add(mx);
  const bridge=new T.Group(),trolley=new T.Group(),hook=new T.Group(),drum=new T.Group(),ropes=new T.Group();
  bridge.position.x=13;mx.add(bridge);bridge.add(trolley);trolley.position.z=-4;trolley.add(hook,drum,ropes);hook.position.y=4.6;
  drum.name='crane hoist drum';ropes.name='crane ropes';ropes.position.y=9.1;
  studioRoot.userData.machinery={group:mx,crane:{bridge,trolley,hook},state:{crane:{x:13,z:-4,hook:4.6}}};
  const drive={running:false,stationary:true,assembled:true,locked:false,stop(){this.running=false;}};
  const lift=installEngineLiftPreview({T,scene,engine,body,studioRoot,drive});
  const mechanic=installWorkshopMechanic({T,scene,crew,crewPolish:polish,engine,body,studioRoot});
  const service=installWorkshopService({T,scene,engine,body,studioRoot,lift,mechanic});
  const fields=new Map(Object.entries(man)), originalRoot=man.fig.root, originalSkeleton=man.fig.skeleton;
  const transforms=man.fig.skeleton.bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
  const otherPeople=Object.values(crew.men).filter(m=>m!==man).map(m=>({m,root:m.fig.root.matrixWorld.clone(),bones:m.fig.skeleton.bones.map(b=>b.matrixWorld.clone())}));
  const oldGrip=man.fig.markers.gripR.getWorldPosition(new T.Vector3());
  const shadow=crew.root.getObjectByName('Crew drawn shadows'),shadowBefore=new Float32Array(shadow.instanceMatrix.array);
  check(service.enter().ok,'Existing service/actor enter successfully');
  check(man.fig.root===originalRoot&&man.fig.skeleton===originalSkeleton,'Original person and polished skeleton are reused');
  check(mechanic.diagnostics().fingerBoneCount===20,'Original polished finger joints are reused');
  check(man.fig.markers.gripR.getWorldPosition(new T.Vector3()).distanceTo(oldGrip)<1e-10,'Zero progress retains the original palm pose');
  const pAttr=man.fig.mesh.geometry.attributes.position,si=man.fig.mesh.geometry.attributes.skinIndex;
  const soleVertices=[];for(let i=0;i<pAttr.count;i++)if(pAttr.getY(i)<.014&&[15,18,19,20].includes(si.getX(i)))soleVertices.push(i);
  check(soleVertices.length>30,'Floor check samples actual original boot geometry');
  let maxContact=0,minFloor=Infinity,minObstacle=Infinity,minLiftClearance=Infinity,contacts=0,toolContacts=0,finite=true;
  const samples=new Map();
  const sample=p=>{
    service.setProgress(p);const d=mechanic.diagnostics(),s=service.diagnostics;
    minFloor=Math.min(minFloor,d.floorClearance);minObstacle=Math.min(minObstacle,d.obstacleClearance);
    if(d.contact>.999&&!['pickup','stow'].includes(d.task)){
      maxContact=Math.max(maxContact,...d.palmErrors);contacts++;
      if(s.targets.tool==='ratchet'){check(d.socketError!==null&&d.socketError<1e-9,`Actual socket stays on its source point at ${p}`);toolContacts++;}
    }
    if(s.phase==='lift'){minLiftClearance=Math.min(minLiftClearance,d.loadClearance);check(d.readyForLift&&!d.walking,'Mechanic remains clear throughout load movement');}
    man.fig.skeleton.update();finite&&=man.fig.skeleton.boneMatrices.every(Number.isFinite);
    if(Math.round(p*1000)%20===0)for(const index of soleVertices){
      const v=new T.Vector3().fromBufferAttribute(pAttr,index);man.fig.mesh.applyBoneTransform(index,v);man.fig.mesh.localToWorld(v);
      minFloor=Math.min(minFloor,v.y-man.floor(v.x,v.z));
    }
    return{root:d.root,palms:d.palms,tool:d.toolGrip,socket:d.socket,bones:man.fig.skeleton.bones.map(b=>b.matrixWorld.elements.slice())};
  };
  const flat=value=>Array.isArray(value)?value.flatMap(flat):value&&typeof value==='object'?Object.values(value).flatMap(flat):[value];
  const samePose=(actual,expected,label)=>{const a=flat(actual),b=flat(expected);const error=Math.max(...a.map((v,i)=>Math.abs(v-b[i])));assert.ok(error<1e-9,`${label}: world-space transform error ${error}`);};
  for(let i=0;i<=500;i++){const p=i/500,s=sample(p);if(i%5===0)samples.set(p,s);}
  check(contacts>20&&toolContacts>5,'Full contact windows were exercised for hands and tools');
  check(maxContact<.025,`Full-contact palm error remains under 25mm: ${maxContact}`);
  check(minFloor>-.007,`Actual boot soles do not sink through the floor: ${minFloor}`);
  check(minObstacle>.005,`Body centre remains outside the car/equipment clearance: ${minObstacle}`);
  check(minLiftClearance>.35,`Torso and head remain clear of the actual travelling engine: ${minLiftClearance}`);
  check(finite,'All real skeleton transforms remain finite');
  for(const[p,expected]of[...samples].reverse()){
    service.setDirection(-1);const actual=sample(p);samePose(actual,expected,`Reverse scrub retraces ${p}`);
  }
  checks++;check(true,'All forward/reverse snapshots match');
  const scrambled=[.856,.042,.234,.115,.91,.18,.799,.05,.33,.133,.0,.94];
  for(const p of scrambled){const first=sample(p);sample(1-p);const again=sample(p);samePose(again,first,`Arbitrary jump is deterministic at ${p}`);}checks++;
  service.setProgress(.233);const pause=JSON.stringify(sample(.233));service.update(0);check(JSON.stringify(sample(.233))===pause,'Paused working hands and tool do not drift');
  let maxWalkingSpeed=0;
  for(const[at,direction]of[[0,1],[.1116,1],[.225,1],[.8152,1],[.27,1],[.24,-1],[.30,-1]]){
    service.setDirection(direction);service.setProgress(at);service.setPlaying(true);let previous=mechanic.diagnostics().root;
    for(let i=0;i<12;i++){service.update(.1);const current=mechanic.diagnostics().root;maxWalkingSpeed=Math.max(maxWalkingSpeed,Math.hypot(...current.map((v,k)=>v-previous[k]))/.1);previous=current;}
  }
  check(maxWalkingSpeed<=1.30,`Low-frame-rate playback keeps the original worker at a walking pace in both directions: ${maxWalkingSpeed}`);
  // The former >.99 wrist and >.999 socket gates produced a finite jump across
  // arbitrarily small timeline steps. Probe both sides of those exact contact
  // values on every actual hose/fastener task, in both engagement directions.
  const smooth=x=>x*x*(3-2*x);
  function strokeForContact(target){let lo=0,hi=1;for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(smooth(mid)<target)lo=mid;else hi=mid;}return(lo+hi)/2*.2;}
  let largestSocketStep=0,largestWristStep=0,continuitySamples=0;
  const tasks=[[.34,.48],[.48,.62],...Array.from({length:10},(_,i)=>[.62+i*.028,.62+(i+1)*.028])];
  for(const[from,to]of tasks)for(const gate of [.99,.999])for(const backward of [false,true]){
    const centre=backward?1-strokeForContact(gate):strokeForContact(gate),delta=1e-6;
    service.setProgress(.18*(from+(to-from)*(centre-delta)));
    const before=mechanic.diagnostics();
    const bones=man.fig.skeleton.bones.filter(b=>/handR|wristR/i.test(b.name)).map(b=>b.getWorldQuaternion(new T.Quaternion()));
    service.setProgress(.18*(from+(to-from)*(centre+delta)));
    const after=mechanic.diagnostics();
    const step=Math.hypot(...after.socket.map((x,i)=>x-before.socket[i]));largestSocketStep=Math.max(largestSocketStep,step);
    const matched=man.fig.skeleton.bones.filter(b=>/handR|wristR/i.test(b.name));
    const wristStep=Math.max(0,...matched.map((b,i)=>b.getWorldQuaternion(new T.Quaternion()).angleTo(bones[i])));largestWristStep=Math.max(largestWristStep,wristStep);
    check(step<.001,`Socket engagement is continuous at ${from}:${centre}: ${step}`);
    check(wristStep<.001,`Working wrist is continuous at ${from}:${centre}: ${wristStep}`);
    continuitySamples++;
  }
  const {installWorkshopShowcase}=await load('workshop-showcase.js');
  const {installWorkshopLearning}=await load('workshop-learning.js');
  const {installWorkshopLessons}=await load('workshop-lessons.js');
  const camera=new T.PerspectiveCamera(35,1.5,.01,200);camera.position.set(-5,3,7);
  const controls=new T.EventDispatcher();controls.target=new T.Vector3();controls.maxDistance=30;
  const learning=installWorkshopLearning({T,scene,engine,lift});
  const lessons=installWorkshopLessons({T,scene,engine,lift,learning});
  const show=installWorkshopShowcase({T,camera,controls,service,lift,learning,lessons});
  const tourRuns=[];
  for(const dt of [.1,.016]){
    service.setProgress(0);check(show.start().ok,'Actual workshop tour starts');
    let frames=0,maxSpeed=0,last=mechanic.diagnostics().root,lastProgress=show.progress;
    const stages=new Set();
    while(show.playing&&frames<60000){
      show.update(dt);frames++;
      const d=mechanic.diagnostics(),speed=Math.hypot(...d.root.map((v,k)=>v-last[k]))/dt;
      maxSpeed=Math.max(maxSpeed,speed);last=d.root;stages.add(show.step);
      assert.ok(show.progress>=lastProgress,'The single directed timeline never reverses during playback');lastProgress=show.progress;
      assert.ok(!service.playing&&!lift.playing&&!lessons.state.playing,'No second service/lift/lesson clock runs');
    }
    check(show.progress===1&&!show.playing&&service.progress===0,'Actual tour completes and fully refits the engine');
    check(stages.size===7,'Full model playback visits every tour shot');
    check(maxSpeed<=1.20001,`Actual tour keeps the mechanic at walking pace at dt=${dt}: ${maxSpeed}`);
    tourRuns.push({dt,frames,elapsedSeconds:frames*dt,maxWalkingSpeed:maxSpeed,shots:[...stages]});
    show.stop();
  }
  const poses=[];
  for(const p of [.035,.145,.52,.90,.985]){show.seek(p);poses.push({p,service:service.progress,root:mechanic.diagnostics().root,cam:camera.position.toArray()});}
  for(const expected of poses.reverse()){
    show.seek(expected.p);assert.deepEqual({p:show.progress,service:service.progress,root:mechanic.diagnostics().root,cam:camera.position.toArray()},expected,'Movement limiting never changes exact direct seek poses');checks++;
  }
  show.stop();show.dispose();lessons.dispose();learning.dispose();
  check(otherPeople.every(({m,root,bones})=>m.fig.root.matrixWorld.equals(root)&&m.fig.skeleton.bones.every((b,i)=>b.matrixWorld.equals(bones[i]))),'No unrelated worker or finger animation is changed');
  service.exit();
  check([...fields].every(([k,v])=>man[k]===v),'Every original mechanic field/reference is restored, including paths, contacts and callbacks');
  check(transforms.every(({b,p,q,s})=>b.position.equals(p)&&b.quaternion.equals(q)&&b.scale.equals(s)),'All body and glove bone transforms restore exactly');
  check(man.fig.markers.gripR.getWorldPosition(new T.Vector3()).distanceTo(oldGrip)<1e-10,'Original equipment palm contact restores exactly');
  check(!polish.info().workshop,'Original crew-polish workshop mode restores');
  check(shadowBefore.every((v,i)=>v===shadow.instanceMatrix.array[i]),'Original per-worker contact shadows restore exactly');
  check(!mechanic.root.visible,'Owned tool rack and ratchet are hidden outside the sequence');
  check(service.enter().ok,'The same actor can enter again after complete restoration');service.setProgress(.51);service.exit();
  mechanic.dispose();mechanic.dispose();check(mechanic.state.disposed&&!mechanic.root.parent,'Dispose removes owned geometry and is idempotent');
  console.log(JSON.stringify({result:'PASS',checks,contactSamples:contacts,toolContacts,maxContact,minFloor,minObstacle,minLiftClearance,maxWalkingSpeed,continuitySamples,largestSocketStep,largestWristStep,tourRuns,sourceCommit:commit},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
