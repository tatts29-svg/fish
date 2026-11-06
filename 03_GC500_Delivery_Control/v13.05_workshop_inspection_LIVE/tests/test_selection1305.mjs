/* Author: Andrew Fisher. Original geometry, tap intent, occlusion and restoration.
 * WORKSHOP_SOURCE points to the verified complete machine. No browser or network.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),source=process.env.WORKSHOP_SOURCE;
assert.ok(source,'WORKSHOP_SOURCE must name the verified complete machine source');
const original=name=>import(pathToFileURL(path.join(source,name)).href);
const T=await original('vendor/three.module.js');
const sourceURL=name=>'data:text/javascript;base64,'+fs.readFileSync(path.resolve(here,'..',name)).toString('base64');
const selectionURL=sourceURL('workshop-selection.js');
const {installWorkshopHighlight,installWorkshopPicker}=await import(selectionURL);
let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++;};
const close=(a,b,label,tolerance=1e-6)=>check(Math.abs(a-b)<=tolerance,label);
class Target{
 constructor(){this.listeners=new Map();}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
 removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
 dispatch(type,props={}){const event={type,...props};for(const fn of this.listeners.get(type)||[])fn(event);}
 count(){return [...this.listeners.values()].reduce((a,b)=>a+b.size,0);}
}
// The batch follows actual translated/rotated/instanced mesh vertices, rather
// than using a box or altering source render resources.
{
 const scene=new T.Scene(),parent=new T.Group(),part=new T.Group();scene.add(parent,part);parent.position.set(1,-2,.2);
 const geo=new T.BoxGeometry(1,2,3),mat=new T.MeshBasicMaterial(),mesh=new T.Mesh(geo,mat);part.add(mesh);part.position.set(-2,3,1);part.rotation.y=.3;
 let originalDisposed=0;geo.addEventListener('dispose',()=>originalDisposed++);mat.addEventListener('dispose',()=>originalDisposed++);
 const api=installWorkshopHighlight({T,parent});api.update(part);
 check(api.object.isLineSegments&&!api.object.isBox3Helper,'Shape highlight is a single line batch');
 check(api.object.material.depthTest&&!api.object.material.depthWrite,'Occluded edges respect depth');
 check(api.diagnostics.draws===1&&api.diagnostics.segments===12,'Cube has its twelve real edges, one draw');
 const verts=api.object.geometry.attributes.position;
 const transformedBox=new T.Box3().setFromObject(part),overlayBox=new T.Box3().setFromObject(api.object);
 close(overlayBox.min.distanceTo(transformedBox.min),0,'Batch reaches actual minimum bounds');close(overlayBox.max.distanceTo(transformedBox.max),0,'Batch reaches actual maximum bounds');
 const first=verts.array.slice(),rebuilds=api.diagnostics.rebuilds;api.update(part);check(api.diagnostics.rebuilds===rebuilds,'Unchanged pose does not rewrite edge buffer');
 part.rotation.x=.6;mesh.position.x=.3;api.update(part);check(!first.every((v,i)=>v===api.object.geometry.attributes.position.array[i]),'Edges follow changed part and child pose');
 const instanced=new T.InstancedMesh(geo,mat,2);part.add(instanced);mesh.visible=false;const m=new T.Matrix4();
 instanced.setMatrixAt(0,m.makeTranslation(-2,0,0));instanced.setMatrixAt(1,m.makeTranslation(2,0,0));api.update(part);
 check(api.diagnostics.segments===24,'Instance transforms contribute their actual separate edges');
 const count=api.diagnostics.rebuilds;instanced.instanceMatrix.needsUpdate=true;api.update(part);check(api.diagnostics.rebuilds===count,'Unchanged instance values do not rebuild despite version tick');
 instanced.setMatrixAt(1,m.makeTranslation(4,0,0));api.update(part);check(api.diagnostics.rebuilds===count+1,'Changed instance matrix updates outline');
 part.visible=false;api.update(part);check(!api.object.visible,'Hidden parent has no outline');part.visible=true;
 mat.visible=false;api.update(part);check(!api.object.visible,'Invisible material has no outline');mat.visible=true;
 const beforeChildren=part.children.slice();api.dispose();api.dispose();check(originalDisposed===0,'Disposal preserves original geometry and material');check(part.children.every((v,i)=>v===beforeChildren[i]),'Original children never reparented');check(api.object.parent===null,'Owned line removed on disposal');
}
// A renderer removes only attributes still attached at a dispose event. Observe
// that public lifecycle contract across growing/shrinking the owned line batch.
{
 const scene=new T.Scene(),part=new T.Group(),source=new T.BoxGeometry(),material=new T.MeshBasicMaterial();scene.add(part);
 const first=new T.Mesh(source,material),second=new T.Mesh(source,material);part.add(first);second.position.x=2;
 const api=installWorkshopHighlight({T,parent:scene});api.update(part);
 const geometry=api.object.geometry,allocated=new Set([geometry.attributes.position]),retired=[];
 geometry.addEventListener('dispose',event=>{const attached=event.target.attributes.position;retired.push(attached);allocated.delete(attached);});
 const initial=geometry.attributes.position;part.add(second);api.update(part);
 check(retired.length===1&&retired[0]===initial,'Growing batch disposes while the previous attribute is still attached');
 check(!allocated.size&&geometry.attributes.position!==initial,'Growing batch releases old allocation before installing new data');allocated.add(geometry.attributes.position);
 const expanded=geometry.attributes.position;part.remove(second);api.update(part);
 check(retired.at(-1)===expanded&&!allocated.size,'Shrinking batch also retires the old attached attribute');allocated.add(geometry.attributes.position);
 const stable=geometry.attributes.position,eventCount=retired.length;first.position.x=1;api.update(part);
 check(retired.length===eventCount&&geometry.attributes.position===stable,'Pose-only change retains the existing GPU allocation');
 material.visible=false;api.update(part);check(retired.at(-1)===stable&&!allocated.size,'Empty selection retires the previous populated buffer');
 material.visible=true;api.update(part);const finalAttribute=geometry.attributes.position;allocated.add(finalAttribute);
 api.dispose();check(retired.at(-1)===finalAttribute&&!allocated.size,'Final disposal retires the current attribute after previous resizes');
 const finalEvents=retired.length;api.dispose();check(retired.length===finalEvents,'Repeated disposal does not repeat owned geometry retirement');
 check(source.attributes.position.count>0&&first.geometry===source,'Resize lifecycle never replaces the original model geometry');
}
// Geometry/material groups and exact original replacement are observed.
{
 const scene=new T.Scene(),part=new T.Group();scene.add(part);const a=new T.MeshBasicMaterial(),b=new T.MeshBasicMaterial({visible:false});
 const geometry=new T.BoxGeometry(1,1,1);geometry.groups.forEach((g,i)=>g.materialIndex=i%2);
 part.add(new T.Mesh(geometry,[a,b]));const api=installWorkshopHighlight({T,parent:scene});api.update(part);const filtered=api.diagnostics.vertices;
 b.visible=true;api.update(part);check(api.diagnostics.vertices>=filtered,'Material-group visibility changes edge coverage');
 const old=part.children[0].geometry;part.children[0].geometry=new T.BoxGeometry(2,2,2);api.update(part);check(api.diagnostics.cachedGeometries===2,'Changed source geometry receives separate edge cache');check(old.attributes.position.count>0,'Old source geometry not modified');api.dispose();
}
// Occlusion is against rendered scene meshes, not merely registered choices.
{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,.1,50);camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
 const front=new T.Group(),back=new T.Group();scene.add(front,back);front.position.z=1;back.position.z=-1;
 const material=new T.MeshBasicMaterial(),box=new T.BoxGeometry(1,1,1);front.add(new T.Mesh(box,material));back.add(new T.Mesh(box,material));
 const document=new Target(),win=new Target(),canvas=new Target();document.defaultView=win;canvas.ownerDocument=document;canvas.getBoundingClientRect=()=>({left:0,top:0,right:300,bottom:300,width:300,height:300});
 let clock=0,enabled=true,selections=[];const parts=[{id:'front',group:front},{id:'back',group:back}];
 const api=installWorkshopPicker({T,element:canvas,camera,scene,parts:()=>parts,enabled:()=>enabled,now:()=>clock,onSelect:id=>{selections.push(id);return {ok:true};}});
 const tap=(props={})=>{const base={pointerId:1,pointerType:'mouse',button:0,isPrimary:true,clientX:150,clientY:150,...props};canvas.dispatch('pointerdown',base);clock+=40;canvas.dispatch('pointerup',base);};
 check(api.pickAt(150,150)?.id==='front','Nearest registered component is selected');check(selections.length===0,'pickAt is read-only');
 tap();check(selections.at(-1)==='front'&&api.diagnostics.selections===1,'Deliberate tap chooses visible component');
 front.visible=false;check(api.pickAt(150,150)?.id==='back','Hidden ancestor does not occlude');front.visible=true;
 front.children[0].layers.set(1);check(api.pickAt(150,150)?.id==='back','Camera-excluded mesh does not occlude');camera.layers.set(1);check(api.pickAt(150,150)?.id==='front','Camera layer selection matches rendered geometry');camera.layers.set(0);front.children[0].layers.set(0);
 const obstacle=new T.Mesh(new T.BoxGeometry(1,1,.1),material);obstacle.position.z=2;scene.add(obstacle);check(api.pickAt(150,150)===null,'Unregistered foreground surface blocks selecting through it');
 obstacle.userData.workshopOverlay=true;check(api.pickAt(150,150)?.id==='front','Teaching overlays do not steal hits');obstacle.userData={};obstacle.material=new T.MeshBasicMaterial({transparent:true,opacity:0});check(api.pickAt(150,150)?.id==='front','Invisible transparent material does not occlude');scene.remove(obstacle);
 const start=api.diagnostics.raycasts,base={pointerId:1,pointerType:'mouse',button:0,isPrimary:true,clientX:150,clientY:150};
 canvas.dispatch('pointerdown',base);canvas.dispatch('pointermove',{...base,clientX:170});canvas.dispatch('pointermove',base);clock+=30;canvas.dispatch('pointerup',base);check(api.diagnostics.raycasts===start,'Drag away and back never casts');
 canvas.dispatch('pointerdown',base);clock+=700;canvas.dispatch('pointerup',base);check(api.diagnostics.raycasts===start,'Long press never casts');
 canvas.dispatch('pointerdown',base);canvas.dispatch('pointerdown',{...base,pointerId:2,isPrimary:false,pointerType:'touch'});clock+=40;canvas.dispatch('pointerup',{...base,pointerId:2});canvas.dispatch('pointerup',base);check(api.diagnostics.raycasts===start,'Multitouch never becomes a tap');
 canvas.dispatch('pointerdown',base);canvas.dispatch('pointerdown',{...base,pointerId:2,isPrimary:false});canvas.dispatch('lostpointercapture',{pointerId:2});canvas.dispatch('pointerdown',{...base,pointerId:3});canvas.dispatch('pointerup',{...base,pointerId:3});canvas.dispatch('pointerup',base);check(api.diagnostics.raycasts===start,'Losing one capture does not forget another held pointer');
 tap({button:2});check(api.diagnostics.raycasts===start,'Right button does not select');
 for(const target of [document,win]){canvas.dispatch('pointerdown',base);target.dispatch(target===document?'visibilitychange':'pagehide');clock+=10;canvas.dispatch('pointerup',base);}
 check(api.diagnostics.raycasts===start,'Visibility and pagehide cancel pending intent');
 canvas.dispatch('pointerdown',base);canvas.dispatch('lostpointercapture',{pointerId:1});canvas.dispatch('pointerup',base);tap();check(api.diagnostics.selections===2,'Lost capture cancels old gesture without blocking next tap');
 enabled=false;tap();check(api.diagnostics.selections===2&&api.pickAt(150,150)===null,'Inactive bench cannot select');enabled=true;
 check(api.pickAt(-1,150)===null&&api.pickAt(150,301)===null,'Canvas bounds enforced');
 // Replica rendering uses the existing geometry but its ordinary raycast is disabled.
 front.visible=false;back.visible=false;const replica=new T.Group();replica.userData.workshopLesson=true;scene.add(replica);const clone=new T.Mesh(box,material);clone.userData.workshopLesson=true;clone.raycast=()=>{};replica.add(clone);parts.push({id:'front',group:replica});
 check(api.pickAt(150,150)?.id==='front','Explicit visible display replica maps to registered component');
 const captured=api.diagnostics.raycasts;api.dispose();check(canvas.count()+document.count()+win.count()===0,'Disposal removes every listener');tap();check(api.diagnostics.raycasts===captured,'Disposed picker remains inactive');
}
// Actual sixteen-component model, including changing mechanics and isolation.
{
 const {buildPowertrain}=await original('car-powertrain.js'),{buildCarBody}=await original('car-body.js'),{fitCarMechanics}=await original('car-fit.js');
 let learningCode=fs.readFileSync(path.resolve(here,'../workshop-learning.js'),'utf8');
 learningCode=learningCode.replace("'./engine-kinematics.js'",JSON.stringify(pathToFileURL(path.join(source,'engine-kinematics.js')).href)).replace("'./workshop-selection.js?v=13.05'",JSON.stringify(selectionURL));
 const {installWorkshopLearning}=await import('data:text/javascript;base64,'+Buffer.from(learningCode).toString('base64'));
 const {installWorkshopLessons}=await original('workshop-lessons.js');
 const scene=new T.Scene(),engine=buildPowertrain(T),body=buildCarBody(T);fitCarMechanics(T,body,engine);scene.add(engine.root,body.root);
 const {installWorkshopFinish}=await original('workshop-finish.js');
 const finish=installWorkshopFinish({T,scene,engine,body,studioRoot:new T.Group(),camera:new T.PerspectiveCamera(),renderer:{shadowMap:{needsUpdate:false},capabilities:{getMaxAnisotropy:()=>16}}});
 const lift={active:true,benchReady:true,progress:1,diagnostics:{rigging:{attached:0,clear:1}}};
 const originals=new Map();engine.root.traverse(o=>originals.set(o,{parent:o.parent,children:o.children.slice(),geometry:o.geometry,material:o.material,visible:o.visible}));
 const learning=installWorkshopLearning({T,scene,engine,lift}),lessons=installWorkshopLessons({T,scene,engine,lift,learning});
 check(learning.setMode('inspect').ok,'Supported original model opens bench');
 let maxSegments=0;const samples=[];
 for(const part of learning.parts){
  check(learning.selectPart(part.id).ok,'Original registered component selected: '+part.id);learning.turnCrank(.13);learning.refreshHighlight();
  const d=learning.diagnostics.highlight;check(d.draws===1&&d.vertices>0,'Actual part produces visible shape edges: '+part.id);maxSegments=Math.max(maxSegments,d.segments);samples.push({id:part.id,segments:d.segments});
  const edge=scene.getObjectByName('Inspected original component'),position=edge.geometry.attributes.position;
  check(position.array.every(Number.isFinite),'Actual component edge coordinates finite: '+part.id);
  const b=new T.Box3().setFromObject(engine.removable.find(p=>p.id===part.id).group).expandByScalar(1e-5);
  for(let i=0;i<position.count;i+=Math.max(1,Math.floor(position.count/12))){const p=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(edge.matrixWorld);check(b.containsPoint(p),'Selected outline stays on actual component bounds: '+part.id);}
 }
 learning.selectPart('intake-valve-1');lessons.setMode('isolate');lessons.setRotation(Math.PI/3);learning.refreshHighlight();
 const display=scene.getObjectByName('Rotatable inspection display'),outline=scene.getObjectByName('Inspected original component');
 check(outline.visible&&learning.pickParts.some(p=>p.id==='intake-valve-1'&&p.group===display),'Isolated visible display receives selection and outline');
 const displayBox=new T.Box3().setFromObject(display,true).expandByScalar(1e-5),outlineBox=new T.Box3().setFromObject(outline);
 check(displayBox.containsBox(outlineBox),'Isolated edges stay within actual rotated display vertices');
 const rotated=outline.geometry.attributes.position.array.slice();lessons.setRotation(-Math.PI/3);learning.refreshHighlight();
 check(!rotated.every((value,i)=>value===outline.geometry.attributes.position.array[i]),'Changing isolation rotation updates the actual edge buffer');
 const displayVertices=[],temporary=new T.Vector3(),instanceMatrix=new T.Matrix4(),world=new T.Matrix4();
 display.traverse(object=>{if(!object.isMesh||!object.visible)return;const positions=object.geometry.attributes.position;for(let index=0;index<(object.isInstancedMesh?object.count:1);index++){world.copy(object.matrixWorld);if(object.isInstancedMesh){object.getMatrixAt(index,instanceMatrix);world.multiply(instanceMatrix);}for(let i=0;i<positions.count;i++)displayVertices.push(temporary.fromBufferAttribute(positions,i).applyMatrix4(world).clone());}});
 const actual=outline.geometry.attributes.position;for(let i=0;i<actual.count;i+=Math.max(1,Math.floor(actual.count/20))){const point=new T.Vector3().fromBufferAttribute(actual,i).applyMatrix4(outline.matrixWorld);check(displayVertices.some(value=>value.distanceTo(point)<1e-5),'Isolated highlight vertex belongs to the current rotated original geometry');}
 lessons.reset();learning.reset();check(!outline.visible||!outline.parent.visible,'Closed bench has no visible selection');lessons.dispose();learning.dispose();
 for(const [object,saved] of originals){check(object.parent===saved.parent&&object.geometry===saved.geometry&&object.material===saved.material,'Original render resources and ownership restored');check(object.children.length===saved.children.length&&object.children.every((child,i)=>child===saved.children[i]),'Original child order retained');check(object.visible===saved.visible,'Original visibility restored');}
 check(maxSegments<100000,'Actual selected-component edge batch remains bounded');finish.dispose();
 console.log(JSON.stringify({author:'Andrew Fisher',suite:'selection1305',passed:true,checks,maxSegments,samples}));
}
