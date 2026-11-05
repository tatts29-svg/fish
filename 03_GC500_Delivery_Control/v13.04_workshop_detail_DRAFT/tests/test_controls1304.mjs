/* Author: Andrew Fisher. Camera framing against the original engine geometry.
 * WORKSHOP_SOURCE=/private/verified-machine node tests/test_controls1304.mjs
 * No browser, network or operational-record writes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=process.env.WORKSHOP_SOURCE;
assert.ok(source,'WORKSHOP_SOURCE must name the verified complete machine source');
const original=name=>import(pathToFileURL(path.join(source,name)).href);
const T=await original('vendor/three.module.js');
const {buildPowertrain}=await original('car-powertrain.js');
const {buildCarBody}=await original('car-body.js');
const {fitCarMechanics}=await original('car-fit.js');
// The exported camera calculation is the production function. Its workshop
// imports are not needed until mountWorkshop is called by the browser.
const code=fs.readFileSync(path.resolve(here,'../workshop-ui.js'),'utf8').replace(/^import .*?;\n/gm,'');
const {workshopCameraFit}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const scene=new T.Scene(),engine=buildPowertrain(T),body=buildCarBody(T);
fitCarMechanics(T,body,engine);scene.add(engine.root,body.root);scene.updateMatrixWorld(true);
const ids=['crankshaft','piston-1','connecting-rod-1','camshaft-near','intake-valve-1','timing-belt','timing-tensioner','oil-pan','oil-pump','oil-galleries','distributor','accessory-belt','water-pump','cooling-system','alternator','starter-motor'];
const profiles=[{name:'phone',width:390,height:730,reserve:240},{name:'narrow phone',width:320,height:730,reserve:240},{name:'landscape',width:844,height:600,reserve:180},{name:'desktop',width:1130,height:860,reserve:200}];
let checks=0;
const check=(ok,message)=>{assert.ok(ok,message);checks++;};
const direction=new T.Vector3(-.53,.28,.80),corners=box=>[box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>new T.Vector3(x,y,z))));
const samples=[];
for(const id of ids){
  const group=engine.removable.find(part=>part.id===id)?.group;
  check(!!group,'Original component exists: '+id);
  const box=new T.Box3().setFromObject(group),saved=box.clone();
  for(const profile of profiles){
    const fov=profile.width<700?35:28,usable=Math.max(.35,1-profile.reserve/profile.height);
    const fit=workshopCameraFit({T,box,direction,fov,aspect:profile.width/profile.height,usable,margin:1.2,near:.018});
    check(!!fit&&fit.position.toArray().every(Number.isFinite),id+' finite camera '+profile.name);
    check(fit.minDistance>=.018*3&&fit.minDistance<fit.distance&&fit.maxDistance>fit.distance,id+' usable zoom limits '+profile.name);
    const camera=new T.PerspectiveCamera(fov,profile.width/profile.height,.018,160);
    camera.position.copy(fit.position);camera.setViewOffset(profile.width,profile.height,0,profile.reserve/2,profile.width,profile.height);
    camera.lookAt(fit.center);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
    const projected=corners(box).map(point=>point.project(camera));
    for(const point of projected){
      check(point.x>=-1&&point.x<=1,id+' fits width '+profile.name);
      check(point.y<=1&&point.y>=-1+2*profile.reserve/profile.height,id+' fits above controls '+profile.name);
      check(point.z>-1&&point.z<1,id+' survives near/far clipping '+profile.name);
    }
    samples.push({id,viewport:profile.name,distance:fit.distance,minDistance:fit.minDistance,
      horizontalFill:(Math.max(...projected.map(p=>p.x))-Math.min(...projected.map(p=>p.x)))/2,
      verticalFill:(Math.max(...projected.map(p=>p.y))-Math.min(...projected.map(p=>p.y)))/(2*usable)});
  }
  check(box.equals(saved),'Source bounds not mutated: '+id);
}
const valve=samples.filter(sample=>sample.id==='intake-valve-1');
for(const sample of valve){
  check(sample.distance<1.4,'Small valve is no longer held at the old 1.4 metre camera floor: '+sample.viewport);
  check(Math.max(sample.horizontalFill,sample.verticalFill)>.45,'Small valve occupies a useful inspection area: '+sample.viewport);
}
const empty=new T.Box3();
check(workshopCameraFit({T,box:empty,direction,fov:35,aspect:1})===null,'Empty bounds do not move the camera');
check(workshopCameraFit({T,box:new T.Box3(new T.Vector3(-1,-1,-1),new T.Vector3(1,1,1)),direction,fov:35,aspect:0})===null,'Zero-width viewport does not move the camera');
console.log(JSON.stringify({author:'Andrew Fisher',suite:'workshop-controls1304',checks,components:ids.length,profiles:profiles.length,samples},null,2));
