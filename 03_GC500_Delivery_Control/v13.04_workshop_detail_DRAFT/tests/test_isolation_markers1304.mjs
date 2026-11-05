/* Author: Andrew Fisher. Original-model isolation annotation regression.
 * WORKSHOP_SOURCE=/private/verified-machine node tests/test_isolation_markers1304.mjs
 * No browser, network request or operational write.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),source=process.env.WORKSHOP_SOURCE;
assert.ok(source,'WORKSHOP_SOURCE must name the complete verified machine source');
const original=name=>import(pathToFileURL(path.join(source,name)).href);
const T=await original('vendor/three.module.js');
const {buildPowertrain}=await original('car-powertrain.js'),{buildCarBody}=await original('car-body.js'),{fitCarMechanics}=await original('car-fit.js');
const {installWorkshopLearning}=await original('workshop-learning.js'),{installEngineLiftPreview}=await original('engine-lift-preview.js');
let code=fs.readFileSync(path.resolve(here,'../workshop-lessons.js'),'utf8');
for(const name of ['car-references.js','part-connections.js'])code=code.replace(`'./${name}'`,JSON.stringify(pathToFileURL(path.join(source,name)).href));
const {installWorkshopLessons}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const scene=new T.Scene(),engine=buildPowertrain(T),body=buildCarBody(T);fitCarMechanics(T,body,engine);scene.add(engine.root,body.root);
const studioRoot=new T.Group(),machinery=new T.Group(),bridge=new T.Group(),trolley=new T.Group(),hook=new T.Group(),drum=new T.Group(),ropes=new T.Group();
scene.add(studioRoot);studioRoot.add(machinery);machinery.add(bridge);bridge.add(trolley);trolley.add(hook,drum,ropes);hook.position.y=4.6;drum.name='crane hoist drum';ropes.name='crane ropes';ropes.position.y=9.1;
studioRoot.userData.machinery={group:machinery,crane:{bridge,trolley,hook},state:{crane:{x:0,z:0,hook:4.6}}};
const drive={running:false,stationary:true,assembled:true,locked:false,stop(){this.running=false;}};
const lift=installEngineLiftPreview({T,scene,engine,body,studioRoot,drive}),learning=installWorkshopLearning({T,scene,engine,lift});
const lessons=installWorkshopLessons({T,scene,engine,lift,learning});
let checks=0,disposedOriginals=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
const resources=new Set();engine.root.traverse(object=>{if(object.geometry)resources.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)resources.add(material);});
for(const resource of resources)resource.addEventListener('dispose',()=>disposedOriginals++);
check(lift.enter().ok,'Original assembled engine enters workshop');lift.setProgress(1);check(lift.setRigging({attached:0,clear:1}),'Supported engine rig cleared');learning.setMode('inspect');
const displayed=scene.getObjectByName('Rotatable inspection display'),fittedMarker=scene.getObjectByName('Fitted location marker'),displayMarker=scene.getObjectByName('Inspection location marker'),line=scene.getObjectByName('Inspection view to fitted connection');
check(displayMarker.material.depthTest&&fittedMarker.material.depthTest&&line.material.depthTest,'Isolation annotations cannot draw through inspected surfaces');
const samples=[];
for(const part of learning.parts){
  learning.selectPart(part.id);
  const sourcePart=engine.removable.find(item=>item.id===part.id).group,originalVisible=sourcePart.visible,originalParent=sourcePart.parent,originalMatrix=sourcePart.matrix.clone();
  sourcePart.updateWorldMatrix(true,true);
  const originalBox=new T.Box3().setFromObject(sourcePart),centre=originalBox.getCenter(new T.Vector3());
  const maxExtent=Math.max(...originalBox.getSize(new T.Vector3()).toArray());
  check(lessons.setMode('isolate').ok,'Original part isolated: '+part.id);
  const originalRadius=lessons.diagnostics.isolationMarkerRadius;
  for(let turn=0;turn<8;turn++){
    lessons.setRotation(turn*Math.PI/4);scene.updateMatrixWorld(true);
    const box=lessons.bounds,endpoint=displayMarker.getWorldPosition(new T.Vector3()),radius=lessons.diagnostics.isolationMarkerRadius;
    const lineStart=new T.Vector3().fromBufferAttribute(line.geometry.attributes.position,0),lineEnd=new T.Vector3().fromBufferAttribute(line.geometry.attributes.position,1);
    check(radius<=.005&&radius/maxExtent<=.012+1e-8,'Marker is small relative to selected component: '+part.id);
    check(Math.abs(radius-originalRadius)<1e-12,'Marker size remains stable while component rotates: '+part.id);
    check(Math.abs(displayMarker.scale.x*.020-radius)<1e-12&&displayMarker.scale.equals(fittedMarker.scale),'Both marker meshes use the measured radius: '+part.id);
    check(box.distanceToPoint(endpoint)>=radius*2.99,'Display marker sphere is wholly clear of the inspected bounds: '+part.id);
    check(lineEnd.distanceTo(endpoint)<1e-6,'Tether ends at outside marker, not component centre: '+part.id);
    check(lineStart.distanceTo(centre)<1e-6&&fittedMarker.position.distanceTo(centre)<1e-6,'Fitted reference retains true original location: '+part.id);
    // Depth testing is also checked above for arbitrary orbit angles. In the
    // model's default presentation the tether never crosses the selected box.
    for(let t=0;t<=10;t++)check(!box.containsPoint(lineStart.clone().lerp(lineEnd,t/10)),'Tether stays outside inspected component: '+part.id+' turn '+turn);
    const sourceMeshes=[],displayMeshes=[];sourcePart.traverse(object=>{if(object.isMesh)sourceMeshes.push(object);});displayed.children[0].traverse(object=>{if(object.isMesh)displayMeshes.push(object);});
    check(sourceMeshes.length===displayMeshes.length&&sourceMeshes.every((object,index)=>object.geometry===displayMeshes[index].geometry&&object.material===displayMeshes[index].material),'Original render resources preserved: '+part.id);
  }
  samples.push({id:part.id,maxExtent,markerRadius:originalRadius});
  lessons.reset();check(sourcePart.visible===originalVisible&&sourcePart.parent===originalParent&&sourcePart.matrix.equals(originalMatrix),'Source ownership and visibility restore: '+part.id);
}
lessons.dispose();learning.dispose();lift.dispose();check(disposedOriginals===0,'No original material or geometry disposed');
console.log(JSON.stringify({author:'Andrew Fisher',suite:'isolation-markers1304',checks,components:samples.length,rotations:8,samples},null,2));
