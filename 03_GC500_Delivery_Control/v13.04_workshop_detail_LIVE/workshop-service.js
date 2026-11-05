/* Author: Andrew Fisher.
 * Deterministic modelled workshop sequence. The original coolant paths and
 * bellhousing fastener instances are used; this is not a factory procedure.
 * This controller exclusively owns the lift clock. Run after the host poses,
 * then run bench learning/lessons, so all of them see this frame's geometry.
 */
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const windowed = (value, a, b) => clamp((value - a) / (b - a));
const workStroke = value => smooth(windowed(value, .2, .8));
const PHASES = [['disconnect', 0, .18], ['rig', .18, .30], ['lift', .30, .78], ['unhook', .78, .94], ['bench', .94, 1]];

export function installWorkshopService({T, scene, engine, body, studioRoot, lift, mechanic}) {
  if (!T || !scene || !engine || !lift?.setRigging) throw Error('Workshop service needs the original engine and the rigging-capable lift.');
  const byId = id => engine.removable.find(part => part.id === id)?.group;
  const cooling = byId('cooling-system'), gearbox = byId('gearbox');
  const originalHoses = cooling?.children.find(child => child.name === 'Upper and lower coolant hoses');
  const fasteners = gearbox?.children.find(child => child.name === 'Hex fasteners' && child.isInstancedMesh);
  if (!cooling || !originalHoses || !fasteners) throw Error('The original coolant hoses and bellhousing fasteners are required.');
  // These centre lines are the exact points used by car-powertrain.js to build
  // the original two coolant hoses, in that cooling assembly's own coordinates.
  const HOSES = [
    {id: 'upper-hose', points: [[.04,.23,-.47],[.24,.28,-.46],[.44,.25,-.48],[.57,.27,-.36]], radius: .037, host: byId('cylinder-head-far')},
    {id: 'lower-hose', points: [[.04,-.21,.47],[.18,-.27,.50],[.46,-.27,.48],[.65,-.05,.28]], radius: .036, host: byId('engine-block')}
  ];
  const root = new T.Group(); root.name = 'Modelled workshop connections'; root.visible = false; scene.add(root);
  const geometry = new Set(), materials = new Set();
  const mat = values => { const m = new T.MeshStandardMaterial(values); materials.add(m); return m; };
  const rubber = mat({color: 0x182025, roughness: .79, metalness: .03});
  const steel = mat({color: 0xb3c0c6, roughness: .30, metalness: .86});
  const orange = mat({color: 0xff6a13, roughness: .40, metalness: .33});
  const dark = mat({color: 0x263039, roughness: .55, metalness: .42});
  function mesh(geo, material, name, parent = root) {
    geometry.add(geo); const m = new T.Mesh(geo, material); m.name = name; m.castShadow = false; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(w, h, d, material, name, p, parent = root) {
    const m = mesh(new T.BoxGeometry(w, h, d), material, name, parent); m.position.fromArray(p); return m;
  }
  const tray = new T.Group(); tray.name = 'Original fasteners on service tray'; root.add(tray); tray.position.set(.55, 0, 1.75);
  box(.48, .035, .34, dark, 'Fastener tray', [0,.76,0], tray);
  for (const z of [-.165,.165]) box(.48,.045,.012,orange,'Fastener tray rim',[0,.80,z],tray);
  for (const x of [-.234,.234]) box(.012,.045,.34,orange,'Fastener tray end',[x,.80,0],tray);
  for (const x of [-.17,.17]) {
    box(.035,.73,.035,dark,'Fastener tray leg',[x,.38,0],tray);
    const foot = box(.09,.05,.39,dark,'Fastener tray foot',[x,.021,0],tray); foot.castShadow = true;
  }
  const hoses = HOSES.map(spec => {
    const curve = new T.CatmullRomCurve3(spec.points.map(p => new T.Vector3(...p)));
    const tube = mesh(new T.TubeGeometry(curve, 24, spec.radius * .74, 8, false), rubber, `Original ${spec.id} service path`);
    const collar = mesh(new T.TorusGeometry(spec.radius * .74 + .006, .005, 6, 18), steel, `Modelled ${spec.id} clamp`);
    const port = mesh(new T.CylinderGeometry(spec.radius * .74 * .8, spec.radius * .74 * .8, .035, 16, 1, true), steel, `Modelled ${spec.id} engine-side connection`);
    const cap = mesh(new T.CylinderGeometry(spec.radius * .74 * .95, spec.radius * .74 * .95, .014, 16), orange, `Modelled ${spec.id} disconnected cap`);
    return {...spec, curve, tube, collar, port, cap, worldPoints: [], portLocal: null, freeEnd: new T.Vector3(), normal:new T.Vector3(), amount:0,lastAmount:NaN};
  });
  const scratch = new T.Vector3(), matrix = new T.Matrix4(), quaternion = new T.Quaternion(), scale = new T.Vector3();
  const boltHomes = [], boltTargets = [], boltWorld = [];
  const finishClamps=[];
  let lastBoltProgress=NaN,tubeUpdates=0,fastenerUpdates=0;
  let snapshot = null, active = false, playing = false, progress = 0, direction = 1;
  let phase = 'disconnect', phaseProgress = 0, stage = 'Mechanic approaches the car', targets = null;
  const clear = [1.7,0,2.5], bayStand = [-1.0,0,1.45], pickup = [-1,.84,2.13];
  const duration = 64;

  function updateTube(hose, points) {
    tubeUpdates++;
    hose.curve.points = points; hose.curve.updateArcLengths();
    const frames = hose.curve.computeFrenetFrames(24, false), position = hose.tube.geometry.attributes.position, normals = hose.tube.geometry.attributes.normal;
    let index = 0;
    for (let i = 0; i <= 24; i++) {
      const p = hose.curve.getPointAt(i / 24);
      for (let j = 0; j <= 8; j++) {
        const a = j / 8 * Math.PI * 2, n = frames.normals[i].clone().multiplyScalar(-Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a));
        position.setXYZ(index, p.x + n.x * hose.radius * .74, p.y + n.y * hose.radius * .74, p.z + n.z * hose.radius * .74);
        normals.setXYZ(index, n.x, n.y, n.z); index++;
      }
    }
    position.needsUpdate = normals.needsUpdate = true; hose.tube.geometry.computeBoundingSphere();
  }
  function describePhase() {
    const probe=clamp(progress+direction*1e-10);
    const entry = PHASES.find(([,a,b]) => probe >= a && (probe < b || b === 1)) || PHASES[4];
    phase = entry[0]; phaseProgress = windowed(progress, entry[1], entry[2]);
  }
  function connectionPose() {
    const d = phase === 'disconnect' ? phaseProgress : 1;
    originalHoses.visible = false; cooling.visible = true;
    for (const id of ['radiator-fan-left','radiator-fan-right']) { const fan = byId(id); if (fan) fan.visible = true; }
    for (let index = 0; index < hoses.length; index++) {
      const hose = hoses[index], u = windowed(d, index ? .48 : .34, index ? .62 : .48), amount = workStroke(u);
      hose.amount = amount;
      if(amount!==hose.lastAmount){
        const points=hose.worldPoints.map(p=>p.clone()),end=points.at(-1);
        end.z+=(Math.max(.75,end.z+.32)-end.z)*amount;end.y-=.06*amount;points.at(-2).lerp(end,amount*.35);
        hose.freeEnd.copy(end);updateTube(hose,points);hose.normal.copy(end).sub(points.at(-2)).normalize();
        hose.collar.position.copy(end);hose.collar.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),hose.normal);hose.collar.rotateZ(amount*Math.PI*2);hose.lastAmount=amount;
      }
      const normal=hose.normal,end=hose.freeEnd;
      const portWorld=hose.host.localToWorld(hose.portLocal.clone()),portNormal=hose.portAxis.clone().transformDirection(hose.host.matrixWorld);
      hose.port.position.copy(portWorld);hose.port.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),portNormal);
      hose.cap.position.copy(end).addScaledVector(normal,.007);hose.cap.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),normal);hose.cap.visible=amount>.98;
      hose.collar.visible=finishClamps.length===0;
      if(amount!==hose.finishAmount){
        const rotation=new T.Quaternion().setFromUnitVectors(hose.initialNormal,normal);
        for(const entry of finishClamps){
          const source=entry.ends[index],p=source.position.clone().sub(hose.worldPoints.at(-1)).applyQuaternion(rotation).add(end),q=rotation.clone().multiply(source.quaternion);
          if(amount===0)matrix.fromArray(entry.original,(index?3:1)*16);else{matrix.compose(p,q,source.scale);matrix.premultiply(entry.object.matrixWorld.clone().invert());}entry.object.setMatrixAt(index?3:1,matrix);entry.object.instanceMatrix.needsUpdate=true;entry.object.computeBoundingSphere();
        }
        hose.finishAmount=amount;
      }
    }
    const boltProgress = windowed(d, .62, .90);
    if(boltProgress===lastBoltProgress)return;
    boltWorld.length=0;fastenerUpdates++;lastBoltProgress=boltProgress;
    for (let i = 0; i < boltHomes.length; i++) {
      const u = clamp(boltProgress * boltHomes.length - i), amount = workStroke(u), home = boltHomes[i];
      const p = home.world.clone(), extraction = smooth(windowed(amount,0,.30)), carry = smooth(windowed(amount,.30,1));
      p.x -= .07 * extraction; p.lerp(boltTargets[i], carry); p.y += Math.sin(carry * Math.PI) * .18;
      const local = fasteners.worldToLocal(p.clone()), q = home.quaternion.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0), amount * Math.PI * 4));
      if(amount===0)fasteners.setMatrixAt(i,home.matrix);else{matrix.compose(local,q,home.scale);fasteners.setMatrixAt(i,matrix);}boltWorld.push(p);
    }
    fasteners.instanceMatrix.needsUpdate = true; fasteners.computeBoundingSphere();
  }
  function rigPose() {
    let liftProgress = 0, attached = 0, clearance = 1, handles = false, handleIndex = 1;
    if (phase === 'rig') {
      clearance = 1 - smooth(windowed(phaseProgress,0,.25));
      const r = windowed(phaseProgress,.25,.75), order = [1,3,0,2], n = Math.min(3, Math.floor(r * 4)), stroke = clamp(r * 4 - n);
      attached = (n + workStroke(stroke)) / 4; if (r >= 1) attached = 1;
      handles = phaseProgress >= .25 && phaseProgress < .75; handleIndex = order[3 - n];
    } else if (phase === 'lift') {
      liftProgress = phaseProgress; attached = 1; clearance = 0;
    } else if (phase === 'unhook' || phase === 'bench') {
      liftProgress = 1; clearance = phase === 'bench' ? 1 : smooth(windowed(phaseProgress,.78,1));
      const r = phase === 'bench' ? 1 : windowed(phaseProgress,.22,.78), n = Math.min(3, Math.floor(r * 4)), stroke = clamp(r * 4 - n);
      attached = 1 - (n + workStroke(stroke)) / 4; if (r >= 1) attached = 0;
      handles = phase === 'unhook' && phaseProgress >= .22 && phaseProgress < .78; handleIndex = [1,3,0,2][n];
    }
    // One atomic pose owns the lift clock and enforces the support interlock.
    if(!lift.setServicePose({progress:liftProgress,direction,rigging:{attached,clear:clearance,handles,handleIndex}}))throw Error('Service attempted to release an unsupported engine.');
  }
  function cue() {
    const engineBox = lift.engineBounds, bench = lift.diagnostics.cradleWorld.slice(), hook = lift.diagnostics.crane;
    const timing=PHASES.find(entry=>entry[0]===phase),range=(a,b)=>[timing[1]+a*(timing[2]-timing[1]),timing[1]+b*(timing[2]-timing[1])],choose=clamp(phaseProgress+direction*1e-9);
    const base = {task:'hold',work:pickup.slice(),grip:pickup.slice(),toolPoint:pickup.slice(),normal:[-1,0,0],tool:null,stroke:0,clear:clear.slice(),stand:bayStand.slice(),previousStand:bayStand.slice(),taskIndex:0,taskCount:1,
      engineBox:{min:engineBox.min.toArray(),max:engineBox.max.toArray()},hook:[hook.x,hook.hook,hook.z],bench,range:range(0,1)};
    if (phase === 'disconnect') {
      const d = phaseProgress;
      if (choose < .26) { base.task='approach'; base.stroke=windowed(d,0,.26); base.stand=bayStand.slice();base.range=range(0,.26); }
      else if (choose < .34) { base.task='pickup'; base.stroke=windowed(d,.26,.34); base.work=pickup.slice(); base.grip=pickup.slice(); base.tool='ratchet';base.range=range(.26,.34); }
      else if (choose < .62) {
        const index=choose<.48?0:1, hose=hoses[index]; base.task=hose.id; base.stroke=windowed(d,index?.48:.34,index?.62:.48);base.range=range(index?.48:.34,index?.62:.48);
        base.toolPoint=hose.freeEnd.toArray();const grip=hose.freeEnd.clone().add(new T.Vector3(0,.02,.65*(1-hose.amount)));grip.y=Math.max(.82,grip.y);grip.z=Math.max(.80,grip.z);base.grip=grip.toArray();base.work=base.grip.slice();base.tool='ratchet';base.stand=[grip.x-.15,0,1.45];base.previousStand=index?[hoses[0].freeEnd.x-.15,0,1.45]:bayStand.slice();base.taskIndex=index;base.taskCount=2;
      } else if (choose < .90) {
        const u=windowed(d,.62,.90)*boltHomes.length, i=Math.max(0,Math.min(boltHomes.length-1,Math.floor(u+direction*1e-9))); base.task=`bellhousing-fastener-${i+1}`; base.stroke=clamp(u-i);base.range=range(.62+i*.28/boltHomes.length,.62+(i+1)*.28/boltHomes.length);
        base.toolPoint=boltWorld[i].toArray();base.tool='ratchet';const grip=boltWorld[i].clone().add(new T.Vector3(0,.45,.65));grip.x=-.2;grip.y=Math.max(.82,grip.y);grip.lerp(new T.Vector3(0,.82,1.9),smooth(windowed(workStroke(base.stroke),.3,1)));grip.z=Math.max(.80,grip.z);base.grip=grip.toArray();base.work=base.grip.slice();base.stand=[-.2,0,1.45];base.previousStand=i?base.stand.slice():[hoses[1].freeEnd.x-.15,0,1.45];base.taskIndex=i;base.taskCount=boltHomes.length;
      } else { base.task='stow';base.stroke=windowed(d,.90,1);base.previousStand=[-.2,0,1.45];base.stand=bayStand.slice();base.range=range(.90,1); }
    } else if (phase === 'rig') {
      if (choose < .25) { base.task='rig-approach'; base.stroke=windowed(phaseProgress,0,.25);base.range=range(0,.25); }
      else if (choose < .75) {
        const u=windowed(phaseProgress,.25,.75)*4, n=Math.max(0,Math.min(3,Math.floor(u+direction*1e-9))), index=[2,0,3,1][n], point=lift.riggingTargets[index];
        base.task=`rig-eye-${index}`;base.stroke=clamp(u-n);base.work=base.grip=point.grip.slice();base.toolPoint=point.hook.slice();base.tool='hands';base.stand=[point.eye[0],0,1.45];base.previousStand=n?[lift.riggingTargets[[2,0,3,1][n-1]].eye[0],0,1.45]:bayStand.slice();base.taskIndex=n;base.taskCount=4;base.range=range(.25+n*.125,.25+(n+1)*.125);
      } else {base.task='stand-clear';base.stroke=windowed(phaseProgress,.75,1);base.previousStand=[lift.riggingTargets[1].eye[0],0,1.45];base.stand=clear.slice();base.range=range(.75,1);}
    } else if (phase === 'lift') { base.task='stand-clear'; base.stroke=1; base.stand=clear.slice(); base.previousStand=clear.slice(); base.work=lift.diagnostics.loadWorld.slice(); }
    else if (phase === 'unhook') {
      const stand=[bench[0],0,bench[2]+1.1];
      if (choose < .22) { base.task='approach-bench'; base.stroke=windowed(phaseProgress,0,.22); base.previousStand=clear.slice(); base.stand=stand;base.range=range(0,.22); }
      else if (choose < .78) {
        const u=windowed(phaseProgress,.22,.78)*4, n=Math.max(0,Math.min(3,Math.floor(u+direction*1e-9))), index=[1,3,0,2][n], point=lift.riggingTargets[index];
        base.task=`unhook-eye-${index}`;base.stroke=clamp(u-n);base.work=base.grip=point.grip.slice();base.toolPoint=point.hook.slice();base.tool='hands';base.stand=[point.eye[0],0,stand[2]];base.previousStand=n?[lift.riggingTargets[[1,3,0,2][n-1]].eye[0],0,stand[2]]:stand;base.taskIndex=n;base.taskCount=4;base.range=range(.22+n*.14,.22+(n+1)*.14);
      } else {base.task='stand-clear';base.stroke=windowed(phaseProgress,.78,1);base.previousStand=[lift.riggingTargets[2].eye[0],0,stand[2]];base.stand=clear.slice();base.range=range(.78,1);}
    } else { base.task='bench'; base.stand=clear.slice(); base.previousStand=clear.slice(); base.work=lift.diagnostics.loadWorld.slice(); }
    return base;
  }
  function pose() {
    if (!active) return;
    describePhase();root.visible=true;rigPose();connectionPose();root.updateMatrixWorld(true);targets=cue();
    stage = phase==='disconnect' ? (direction<0?'Reconnect modelled hoses and fasteners':'Mechanic disconnects modelled hoses and fasteners') : phase==='rig' ? (direction<0?'Remove the unloaded rigging':'Attach the lifting rigging') : phase==='lift' ? (direction<0?'Refit the engine in the bay':'Lift the engine onto its supports') : phase==='unhook' ? (direction<0?'Reattach the rigging on the supported engine':'Unhook the supported engine and clear the rig') : 'Engine supported, rig clear — service bench';
    if (progress===0 && direction<0) stage='Engine refitted and modelled connections restored';
    mechanic?.pose?.({phase,phaseProgress,progress,direction,targets});
  }
  function enter() {
    if (active) return {ok:true};
    const result=lift.enter(); if (!result?.ok) return result;
    scene.updateMatrixWorld(true);
    snapshot={hoseVisible:originalHoses.visible,coolingVisible:cooling.visible,fanVisibility:['radiator-fan-left','radiator-fan-right'].map(id=>[byId(id),byId(id)?.visible]),fasteners:new Float32Array(fasteners.instanceMatrix.array)};
    finishClamps.length=0;const finish=cooling.getObjectByName('Workshop detail · cooling-system');
    if(finish)for(const object of finish.children)if(object.isInstancedMesh&&object.count===4){
      const ends=[1,3].map(index=>{object.getMatrixAt(index,matrix);matrix.premultiply(object.matrixWorld);matrix.decompose(scratch,quaternion,scale);return{position:scratch.clone(),quaternion:quaternion.clone(),scale:scale.clone()};});
      finishClamps.push({object,original:new Float32Array(object.instanceMatrix.array),ends});
    }
    boltHomes.length=boltTargets.length=0;
    for(let i=0;i<fasteners.count;i++) {
      fasteners.getMatrixAt(i,matrix); matrix.decompose(scratch,quaternion,scale);
      const home={position:scratch.clone(),quaternion:quaternion.clone(),scale:scale.clone(),matrix:matrix.clone(),world:fasteners.localToWorld(scratch.clone())};boltHomes.push(home);
      if(!fasteners.geometry.boundingBox)fasteners.geometry.computeBoundingBox();
      const boltBox=fasteners.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(fasteners.matrixWorld,matrix));
      boltTargets.push(tray.localToWorld(new T.Vector3(-.17+(i%5)*.085,.7775+home.world.y-boltBox.min.y+.0005,-.07+Math.floor(i/5)*.14)));
    }
    lastBoltProgress=NaN;
    for(const hose of hoses){hose.lastAmount=hose.finishAmount=NaN;hose.worldPoints=hose.points.map(p=>cooling.localToWorld(new T.Vector3(...p)));hose.portLocal=hose.host.worldToLocal(hose.worldPoints.at(-1).clone());hose.initialNormal=hose.worldPoints.at(-1).clone().sub(hose.worldPoints.at(-2)).normalize();hose.portAxis=hose.initialNormal.clone().transformDirection(hose.host.matrixWorld.clone().invert());}
    active=true;playing=false;progress=0;direction=1;mechanic?.enter?.();pose();return{ok:true};
  }
  function exit() {
    if(!active)return;
    active=false;playing=false;root.visible=false;mechanic?.exit?.();
    originalHoses.visible=snapshot.hoseVisible;cooling.visible=snapshot.coolingVisible;
    for(const [fan,visible]of snapshot.fanVisibility)if(fan)fan.visible=visible;
    fasteners.instanceMatrix.array.set(snapshot.fasteners);fasteners.instanceMatrix.needsUpdate=true;fasteners.computeBoundingSphere();
    for(const entry of finishClamps){entry.object.instanceMatrix.array.set(entry.original);entry.object.instanceMatrix.needsUpdate=true;entry.object.computeBoundingSphere();}finishClamps.length=0;
    lift.exit();snapshot=null;scene.updateMatrixWorld(true);
  }
  function update(dt=0) {
    if(!active)return;
    if(playing){
      let seconds=Math.max(0,Math.min(.1,Number(dt)||0));const approachEnd=.18*.26;
      while(seconds>1e-10){
        const approaching=direction>0?progress<approachEnd:progress<=approachEnd;
        const walkRate=Number(mechanic?.state?.maxProgressPerSecond),baseRate=approaching?.0018:1/duration,rate=walkRate>0?Math.min(baseRate,walkRate):baseRate;
        const boundary=targets?.range?(direction>0?targets.range[1]:targets.range[0]):(direction>0?1:0);
        const toBoundary=Math.abs(boundary-progress)/rate,used=Math.min(seconds,toBoundary);
        progress=clamp(progress+direction*rate*used);seconds-=used;
        if(used===toBoundary){progress=boundary;pose();}
        if(direction>0?progress>=1:progress<=0){playing=false;break;}
        if(used<1e-12&&seconds>0)break;
      }
    }
    pose();
  }
  function setProgress(value){progress=clamp(value);playing=false;pose();return progress;}
  function setPlaying(value){if(!active)return false;if(value&&direction>0&&progress>=1)progress=0;playing=!!value&&!(direction<0&&progress<=0);pose();return playing;}
  function setDirection(value){direction=Number(value)<0?-1:1;pose();return direction;}
  function reverse(){if(!active)return false;direction*=-1;playing=direction>0?progress<1:progress>0;pose();return playing;}
  function refit(){if(!active)return false;direction=-1;playing=progress>0;pose();return playing;}
  function reset(){playing=false;progress=0;direction=1;pose();}
  function dispose(){exit();root.removeFromParent();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();}
  return{enter,exit,setProgress,setPlaying,setDirection,reverse,refit,reset,update,dispose,
    get active(){return active;},get playing(){return playing;},get progress(){return progress;},get direction(){return direction;},get stage(){return stage;},
    // The director may request a faster illustrative shot, but must keep the
    // same actual walking limit and stop at each action boundary before reading
    // the next limit. This is a constraint on the one master, not another clock.
    get playbackConstraint(){const rate=Number(mechanic?.state?.maxProgressPerSecond);return{maxProgressPerSecond:rate>0?rate:null,range:targets?.range?.slice()||[0,1]};},
    get benchReady(){return active&&progress>=.94&&lift.diagnostics.rigging.attached===0&&lift.diagnostics.rigging.clear>.999;},
    get focus(){return targets?.work?.slice()||lift.diagnostics.loadWorld.slice();},
    get bounds(){const b=lift.bounds;if(active&&targets)b.expandByPoint(new T.Vector3(...targets.work));return b;},
    get diagnostics(){return{active,playing,progress,direction,phase,phaseProgress,stage,benchReady:this.benchReady,liftProgress:lift.progress,rigging:{...lift.diagnostics.rigging},hoseAmounts:hoses.map(h=>h.amount),fastenerCount:boltHomes.length,tubeUpdates,fastenerUpdates,targets:targets?JSON.parse(JSON.stringify(targets)):null};}
  };
}
