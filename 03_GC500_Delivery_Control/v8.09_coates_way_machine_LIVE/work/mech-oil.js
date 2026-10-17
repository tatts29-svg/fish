import {ENGINE_LAYOUT} from './engine-kinematics.js';
/* THE OIL YOU CAN WATCH (v8.09). Andrew Fisher, 2 Oct 2026: "Add more mecahnical features". The V8 had a sump and a gear pump
   turning in it (engine-systems.js: driven at camshaft speed by the distributor's shaft), but the oil went nowhere. Now the
   pump's outlet climbs to a main gallery drilled along the near side of the block; five drillings feed the five main bearings;
   a riser takes oil up the right bank to its camshaft, and a cross drilling at the front of the block takes it under the
   crank to the left bank's riser and camshaft.

   The pump is a positive-displacement gear pump: every turn of its gears moves the same volume, so the oil in the drillings
   moves exactly as far as the pump has turned. That is what the amber pulses do — their place along each drilling is the
   pump's own angle (half the crank's) times one fixed displacement, so they run faster with the revs, creep at idle and stop
   dead when the engine stops. Nothing is timed by the clock.

   Instanced: every pulse in every drilling is one draw, and its matrices are rewritten only when the pump has moved. Rig
   units (ENGINE_FIT). */
export const OIL_STROKE=.08;   /* rig units of travel along a drilling per radian of the pump's gears */
export function buildOilGalleries(T,mats,assembly,mesh,batch,h){
 const {engineX,crankY}=ENGINE_LAYOUT,{tube}=h;
 const front=engineX-.64,galY=.37,galZ=.215,bearings=[-.625,-.30,0,.30,.625].map(x=>engineX+x);
 const home=[engineX,crankY,0],rel=p=>[p[0]-home[0],p[1]-home[1],p[2]-home[2]];
 /* the drillings, straight lines as drillings are, in the order the oil goes through them */
 const paths=[
  [[-.36,.27,.45],[-.36,.33,.33],[-.40,galY,galZ],[front,galY,galZ],[front,.33,.17],[front,.33,-.215],[front,.55,-.33],[front,.80,-.40]],   /* outlet → main gallery → front cross drilling → left bank riser */
  [[-.50,galY,galZ],[-.50,.55,.33],[-.50,.80,.40]],                                                                                          /* right bank riser */
  ...bearings.map(x=>[[x,galY,galZ],[x,.405,.06]]),                                                                                       /* the five main bearing feeds */
 ].map(p=>p.map(rel));
 const g=assembly('oil-galleries','Oil galleries & pressure feed',home,[0,-.45,.75]);
 batch(g,'steel',paths.map(p=>tube(p,.0065,Math.max(4,p.length*6),6)),'Drilled oil galleries');
 /* the pulses: every .05 along every drilling */
 const lines=paths.map(p=>{const seg=[];let L=0;for(let i=1;i<p.length;i++){const a=new T.Vector3(...p[i-1]),b=new T.Vector3(...p[i]),d=a.distanceTo(b);seg.push({a,b,d,at:L});L+=d;}return {seg,L,n:Math.max(2,Math.round(L/.05))};});
 const count=lines.reduce((n,l)=>n+l.n,0);
 const mat=new T.MeshStandardMaterial({color:0xffb12e,emissive:0xb86a00,emissiveIntensity:.9,roughness:.25,metalness:.1});
 const drops=new T.InstancedMesh(new T.SphereGeometry(.0105,10,8),mat,count);drops.name='Oil moving through the drillings';drops.castShadow=false;drops.receiveShadow=false;g.add(drops);
 const m=new T.Matrix4(),v=new T.Vector3();
 function at(line,s){s=((s%line.L)+line.L)%line.L;let k=0;while(k<line.seg.length-1&&s>line.seg[k].at+line.seg[k].d)k++;const q=line.seg[k];return v.copy(q.a).lerp(q.b,Math.min(1,(s-q.at)/q.d));}
 let last=null,travel=0;
 function animate(crankAngle,connected=()=>true){
  if(!connected('oil-galleries'))return;
  const pump=crankAngle*.5;   /* the pump turns at camshaft speed (engine-systems.js), its outlet always pushing forward */
  if(last!==null&&Math.abs(pump-last)<1e-7)return;   /* the pump has not moved, so neither has the oil */
  travel+=last===null?0:Math.abs(pump-last)*OIL_STROKE;last=pump;
  let i=0;for(const line of lines)for(let k=0;k<line.n;k++){const p=at(line,k/line.n*line.L+travel);m.makeTranslation(p.x,p.y,p.z);drops.setMatrixAt(i++,m);}
  drops.instanceMatrix.needsUpdate=true;
 }
 animate(0);
 return {animate,count,get travel(){return travel;},paths};
}
