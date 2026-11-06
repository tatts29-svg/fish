// Author: Andrew Fisher. Original-design, stand-free native4K 14-second film.
// Original geometry/artwork/materials; capture-only poses and camera. No product changes.
const PROOF={seconds:14,fps:30,width:3840,height:2160};
const quint=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10)};
const originalShot={position:[11.051832491639134,6.925950443286972,16.31343582448372],target:[.000004291534423828125,.04686999320983887,-3.916799998283386],fov:34};
let proofPrepared=false,proofMeshes=[],proofFloor=null;
function proofChannels(t){t=((t%14)+14)%14;const q=t<=5.5?t:t<=8.5?5.5:14-t;return {time:t,reveal_time:q,open:quint((q-1)/3.5),front:quint(q-4.5)};}
function proofPoints(){const out=[],v=new T.Vector3(),instance=new T.Matrix4(),world=new T.Matrix4();for(const mesh of proofMeshes){let visible=true;for(let p=mesh;p;p=p.parent)if(!p.visible){visible=false;break}if(!visible)continue;const b=mesh.geometry.boundingBox;for(let k=0;k<(mesh.isInstancedMesh?mesh.count:1);k++){if(mesh.isInstancedMesh){mesh.getMatrixAt(k,instance);world.multiplyMatrices(mesh.matrixWorld,instance)}else world.copy(mesh.matrixWorld);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])out.push(v.set(x,y,z).applyMatrix4(world).clone())}}return out;}
function proofExactBounds(){const screen=[Infinity,Infinity,-Infinity,-Infinity],depth=[Infinity,-Infinity],v=new T.Vector3(),instance=new T.Matrix4(),world=new T.Matrix4(),view=new T.Matrix4(),project=new T.Matrix4();let sampled=0;for(const mesh of proofMeshes){let visible=true;for(let p=mesh;p;p=p.parent)if(!p.visible){visible=false;break}if(!visible)continue;const a=mesh.geometry.attributes.position;for(let k=0;k<(mesh.isInstancedMesh?mesh.count:1);k++){if(mesh.isInstancedMesh){mesh.getMatrixAt(k,instance);world.multiplyMatrices(mesh.matrixWorld,instance)}else world.copy(mesh.matrixWorld);view.multiplyMatrices(camera.matrixWorldInverse,world);project.multiplyMatrices(camera.projectionMatrix,view);for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(view);depth[0]=Math.min(depth[0],-v.z);depth[1]=Math.max(depth[1],-v.z);v.fromBufferAttribute(a,i).applyMatrix4(project);screen[0]=Math.min(screen[0],(v.x+1)/2);screen[1]=Math.min(screen[1],(1-v.y)/2);screen[2]=Math.max(screen[2],(v.x+1)/2);screen[3]=Math.max(screen[3],(1-v.y)/2);sampled++}}}return {screen,depth,vertices:sampled};}
window.__machineFilm995={
 prepare(){
  if(!ready)throw Error('Original mechanism not ready');renderer.setAnimationLoop(null);capturing=true;controls.autoRotate=false;camTween=null;isolated=false;cutaway=false;mechanismView=false;drive.reset();applyTransforms();updateVisibility();
  if(model.parts[18].id!=='base')throw Error('Support identity mismatch');model.parts[18].group.visible=false;
  proofFloor=scene.children.find(o=>o.isMesh&&o.geometry?.type==='PlaneGeometry');if(proofFloor){proofFloor.position.y=-5.25;proofFloor.scale.set(20,20,1)}
  keyLight.shadow.mapSize.set(4096,4096);keyLight.shadow.radius=3;
  model.root.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();proofMeshes.push(o)}});
  proofPrepared=true;return {author:'Andrew Fisher',...PROOF,source_parts:PARTS.length,support_hidden_index:18,original_geometry_and_artwork:true,render_geometry:'Original model and service components; no replacement semantic meshes',floor:'Existing floor enlarged to prevent visible far edge; original shadow retained',camera:'Continuous perspective lens; front-to-rear three-quarter orbit and exact return; complete mechanism remains visible'};
 },
 render(t,width=3840,height=2160){
  if(!proofPrepared)throw Error('Prepare first');const ch=proofChannels(t),u=ch.open,f=ch.front;
  drive.reset();drive.spread=u;drive.spreadTarget=u;applyTransforms();updateVisibility();model.parts[18].group.visible=false;
  // Original source release directions and stages, with greater axial separation.
  for(const p of model.parts){if(p.index===18)continue;const home=partPose(p.index,drive,0).position;for(let i=0;i<3;i++)p.group.position.setComponent(i,home[i]+(p.group.position.getComponent(i)-home[i])*1.15);
   const h=p.base;
   if(p.name==='Steering wheel rim')p.group.position.z=h[2]+(.20-h[2])*u;
   else if(p.name==='Spoke plate')p.group.position.z=h[2]+(-.20-h[2])*u;
   else if(p.mount!==undefined&&p.mount<4){const z=p.group.position.z;p.group.position.z=z+(Math.min(z,.20)-z)*u;}
  }
  scene.updateMatrixWorld(true);const points=proofPoints(),bounds=new T.Box3().setFromPoints(points),centre=bounds.getCenter(new T.Vector3());
  const startTarget=new T.Vector3().fromArray(originalShot.target),target=startTarget.clone().lerp(centre,u);// Keep the full mechanism centred throughout the reveal.
  const orbit=quint((ch.reveal_time-1)/4.5),az=.50+1.85*orbit,el=.29+.08*orbit,dir=new T.Vector3(Math.cos(el)*Math.sin(az),Math.sin(el),Math.cos(el)*Math.cos(az));
  camera.fov=34-2*u;camera.aspect=width/height;
  const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),dir).normalize(),up=new T.Vector3().crossVectors(dir,right),tan=Math.tan(camera.fov*Math.PI/360);let needed=0;
  for(const point of points){const d=point.clone().sub(target),depth=d.dot(dir);needed=Math.max(needed,Math.abs(d.dot(right))/(tan*camera.aspect)+depth,Math.abs(d.dot(up))/tan+depth)}
  const firstDistance=new T.Vector3().fromArray(originalShot.position).distanceTo(startTarget),distance=firstDistance*(1-u)+needed*1.14*u;
  if(u===0){camera.position.fromArray(originalShot.position);target.copy(startTarget);camera.fov=originalShot.fov;}else camera.position.copy(target).addScaledVector(dir,distance);
  // Tight camera-depth bounds preserve the original almost-coplanar printed surfaces.
  const eyeDepth=points.map(point=>point.clone().sub(camera.position).dot(dir.clone().negate()));camera.near=Math.max(.2,Math.min(...eyeDepth)-2);camera.far=distance+260;camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld(true);controls.target.copy(target);
  // Fog hides the original floor's distant horizon while keeping the wheel and its shadow crisp.
  scene.fog=new T.Fog(0x16191b,distance+24,distance+110);
  renderer.setPixelRatio(1);if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);renderer.getContext().finish();
  const {screen,depth,vertices}=proofExactBounds();
  const pose={camera_position:camera.position.toArray(),camera_quaternion:camera.quaternion.toArray(),fov:camera.fov,near:camera.near,far:camera.far,target:target.toArray(),fog:[scene.fog.near,scene.fog.far],floor:proofFloor?{position:proofFloor.position.toArray(),scale:proofFloor.scale.toArray()}:null,parts:model.parts.map(p=>({index:p.index,visible:p.group.visible,matrix:p.group.matrixWorld.toArray()})),meshes:proofMeshes.map(m=>({matrix:m.matrixWorld.toArray(),visible:m.visible,instances:m.isInstancedMesh?Array.from(m.instanceMatrix.array):null}))};
  return {time:t,channels:ch,width:renderer.domElement.width,height:renderer.domElement.height,frame_bounds:screen,depth_bounds:depth,geometry_vertices_checked:vertices,within_frame:screen[0]>=0&&screen[1]>=0&&screen[2]<=1&&screen[3]<=1,in_front:depth[0]>camera.near&&depth[1]<camera.far,source_parts:PARTS.length,support_visible:model.parts[18].group.visible,exploded_travel_multiplier:1.15,hidden_parts:model.parts.filter(p=>!p.group.visible).map(p=>p.index),pose,draws:renderer.info.render.calls,triangles:renderer.info.render.triangles};
 },
 channels:proofChannels
};
