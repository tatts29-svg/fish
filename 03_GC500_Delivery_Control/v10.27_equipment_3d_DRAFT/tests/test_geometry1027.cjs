/* Author: Andrew Fisher. Independent GLB integrity, geometry and bounded-cost checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=process.argv[2]||path.join(__dirname,'../equipment_geometry1027.js');
const context={TextEncoder,ArrayBuffer,DataView,Float32Array,Uint32Array,Uint16Array,Uint8Array};
vm.createContext(context);vm.runInContext(fs.readFileSync(source,'utf8'),context,{filename:source});
const api=context.GC500EquipmentGeometry1027;
let count=0;
function check(name,run){run();count++;console.log('PASS '+name);}
function near(a,b,tol=1e-5){assert(Math.abs(a-b)<=tol,`${a} != ${b}`);}
function read(model){
 const buf=Buffer.from(model.glb),header=new DataView(model.glb);
 assert.equal(header.getUint32(0,true),0x46546c67);assert.equal(header.getUint32(4,true),2);assert.equal(header.getUint32(8,true),buf.length);
 const jsonSize=header.getUint32(12,true);assert.equal(jsonSize%4,0);assert.equal(header.getUint32(16,true),0x4e4f534a);
 const doc=JSON.parse(buf.subarray(20,20+jsonSize).toString()),binHead=20+jsonSize;
 assert.equal(header.getUint32(binHead+4,true),0x004e4942);const binSize=header.getUint32(binHead,true),bin=buf.subarray(binHead+8);
 assert.equal(bin.length,binSize);assert.equal(doc.buffers.length,1);assert.equal(doc.buffers[0].uri,undefined);assert.equal(doc.buffers[0].byteLength,binSize);
 assert.equal(doc.images,undefined);assert.equal(doc.textures,undefined);assert.equal(doc.animations,undefined);
 function accessor(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],components={VEC3:3,SCALAR:1}[a.type],width={5126:4,5125:4,5123:2}[a.componentType];
  assert(components&&width);assert.equal(v.byteOffset%4,0);assert.equal(v.buffer,0);assert.equal(a.byteOffset||0,0);assert.equal(v.byteLength,a.count*components*width);assert(v.byteOffset+v.byteLength<=bin.length);
  return Array.from({length:a.count*components},(_,i)=>a.componentType===5126?bin.readFloatLE(v.byteOffset+i*width):width===2?bin.readUInt16LE(v.byteOffset+i*width):bin.readUInt32LE(v.byteOffset+i*width));}
 return {doc,accessor};
}
function integrity(model){
 const {doc,accessor}=read(model);let vertices=0,triangles=0,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const primitive of doc.meshes[0].primitives){
  assert.equal(primitive.mode,4);assert(primitive.material>=0&&primitive.material<doc.materials.length);
  const p=accessor(primitive.attributes.POSITION),n=accessor(primitive.attributes.NORMAL),idx=accessor(primitive.indices);
  assert.equal(p.length,n.length);assert.equal(idx.length%3,0);vertices+=p.length/3;triangles+=idx.length/3;
  for(let j=0;j<p.length;j+=3){
   assert(p.slice(j,j+3).every(Number.isFinite));assert(n.slice(j,j+3).every(Number.isFinite));near(Math.hypot(...n.slice(j,j+3)),1,2e-6);
   const local=[p[j],-p[j+2],p[j+1]];for(let k=0;k<3;k++){min[k]=Math.min(min[k],local[k]);max[k]=Math.max(max[k],local[k]);}
  }
  for(const i of idx)assert(Number.isInteger(i)&&i>=0&&i<p.length/3);
  for(let j=0;j<idx.length;j+=3){
   const a=idx[j]*3,b=idx[j+1]*3,c=idx[j+2]*3,u=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],v=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
   assert(Math.hypot(...cross)>1e-12,'non-degenerate triangle');assert(cross[0]*n[a]+cross[1]*n[a+1]+cross[2]*n[a+2]>0,'counter-clockwise face matches outward normal');
  }
 }
 assert.equal(vertices,model.stats.vertices);assert.equal(triangles,model.stats.triangles);assert.equal(doc.meshes[0].primitives.length,model.stats.materials);assert.equal(model.stats.bytes,model.glb.byteLength);
 for(let k=0;k<3;k++){near(min[k],model.stats.bounds.min[k],2e-4);near(max[k],model.stats.bounds.max[k],2e-4);}
 assert.match(doc.asset.extras.note,/Illustrative.*Not surveyed/);assert.equal(doc.asset.extras.author,'Andrew Fisher');
 return {doc,min,max};
}
check('API is explicit and immutable',()=>{assert.equal(api.version,'10.27');assert(Object.isFrozen(api));});
const examples=[
 ['P60 building',{kind:'building',length:5.98,width:3.01,height:2.9,quantity:1}],
 ['P62 building',{kind:'building',length:6.02,width:3.01,height:2.9,quantity:1}],
 ['P63 building',{kind:'building',length:6.02,width:2.99,height:2.9,quantity:1}],
 ['WC49 three toilets',{kind:'toilet',length:1.21,width:1.19,height:2.3,quantity:3}],
 ['GN06 generator',{kind:'generator',length:2.88,width:1.21,height:2.1,quantity:1}],
 ['Shipping container',{kind:'container',length:6.06,width:2.44,height:2.59,quantity:1}],
 ['Light tower',{kind:'light',length:2.8,width:1.5,height:5,quantity:1}],
 ['Water-filled barrier',{kind:'barrier',length:2,width:.5,height:1,quantity:3}],
 ['Pee panel',{kind:'pee_panel',length:1.6,width:1.6,height:1.5,quantity:2}],
 ['Toilet block',{kind:'toilet_block',length:6,width:3,height:2.9,quantity:1}],
 ['Accessible toilet',{kind:'accessible_toilet',length:1.8,width:1.6,height:2.4,quantity:2}]
];
for(const [name,options]of examples){
 check(name+' is self-contained, finite, correctly wound GLB',()=>integrity(api.make(options)));
 check(name+' holds metric size and exact unit count',()=>{const m=api.make(options),{doc,min,max}=integrity(m);assert.equal(m.stats.quantity,options.quantity);assert.equal(m.stats.requestedQuantity,options.quantity);assert.deepEqual(doc.asset.extras.dimensionsMetres,{width:options.width,length:options.length,height:options.height});near(min[2],0);near(max[2],options.height);near((min[0]+max[0])/2,0);assert(max[1]-min[1]<=options.length*1.06+.05);assert(max[0]-min[0]<=options.quantity*(options.width+.22)+.1);});
 check(name+' has bounded geometry cost and deterministic output',()=>{const first=api.make(options),second=api.make(options);assert(Buffer.from(first.glb).equals(Buffer.from(second.glb)));assert(first.stats.triangles/options.quantity<2500);assert(first.glb.byteLength/options.quantity<200000);assert(first.stats.materials<=12);});
}
check('Three toilets are distinct adjacent units, not one enlarged cubicle',()=>{const opts=examples[3][1],one=api.make({...opts,quantity:1}),three=api.make(opts);assert.equal(three.stats.vertices,one.stats.vertices*3);assert.equal(three.stats.triangles,one.stats.triangles*3);near(three.stats.bounds.max[0]-one.stats.bounds.max[0],opts.width+Math.min(.22,opts.width*.12));near(three.stats.bounds.max[2],one.stats.bounds.max[2]);});
check('Requested large counts are capped visibly and remain valid GLB',()=>{const m=api.make({kind:'building',width:3,length:12,height:3,quantity:100000});integrity(m);assert.equal(m.stats.quantity,48);assert.equal(m.stats.requestedQuantity,100000);assert(m.glb.byteLength<8e6);});
check('Malformed dimensions and nonpositive quantity cannot produce NaN geometry',()=>{for(const kind of new Set(examples.map(([,spec])=>spec.kind)))integrity(api.make({kind,width:NaN,length:-20,height:Infinity,quantity:0}));});
check('Unsupported types do not silently become a different equipment model',()=>assert.throws(()=>api.make({kind:'fencing'}),/Unsupported equipment kind/));
// Decode individual meshes first, then independently transform every vertex and
// normal. Comparing to these values catches a shared error in geometry and stats.
function primitives(model){
 const {doc,accessor}=read(model);
 return doc.meshes[0].primitives.map(p=>({material:p.material,p:accessor(p.attributes.POSITION),n:accessor(p.attributes.NORMAL),i:accessor(p.indices)}));
}
function expectedGroup(parts){
 const materials=new Map(),bounds=[];
 for(const part of parts){
  const offset=part.offset||[0,0,0],angle=part.angle||0,c=Math.cos(angle),s=Math.sin(angle),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const source of primitives(api.make(part.spec))){
   let dest=materials.get(source.material);if(!dest){dest={material:source.material,p:[],n:[],i:[]};materials.set(source.material,dest);}
   const base=dest.p.length/3;
   for(let j=0;j<source.p.length;j+=3){
    const x=source.p[j],y=-source.p[j+2],z=source.p[j+1],nx=source.n[j],ny=-source.n[j+2],nz=source.n[j+1];
    const q=[x*c-y*s+offset[0],x*s+y*c+offset[1],z+offset[2]];
    dest.p.push(q[0],q[2],-q[1]);dest.n.push(nx*c-ny*s,nz,-(nx*s+ny*c));
    for(let k=0;k<3;k++){min[k]=Math.min(min[k],q[k]);max[k]=Math.max(max[k],q[k]);}
   }
   dest.i.push(...source.i.map(i=>i+base));
  }
  bounds.push({min,max});
 }
 return {materials:[...materials.values()].sort((a,b)=>a.material-b.material),bounds};
}
const mixed=[
 {spec:{kind:'toilet',length:1.21,width:1.19,height:2.3,quantity:2},offset:[3,-4,1.25],angle:Math.PI/2},
 {spec:{kind:'pee_panel',length:1.6,width:1.6,height:1.5,quantity:1},offset:[-3,2,.1],angle:-Math.PI/3},
 {spec:{kind:'toilet_block',length:6,width:3,height:2.9,quantity:1},offset:[1,8,0],angle:Math.PI},
 {spec:{kind:'accessible_toilet',length:1.8,width:1.6,height:2.4,quantity:2},offset:[-5,-7,.25],angle:.37}
];
check('Mixed group keeps all families, exact quantities and independent part totals',()=>{
 const group=api.makeGroup(mixed),{doc}=integrity(group);assert.equal(group.stats.kind,'group');assert.equal(group.stats.quantity,6);assert.equal(group.stats.requestedQuantity,6);assert.equal(group.stats.parts.length,4);
 let vertices=0,triangles=0;
 mixed.forEach((part,i)=>{const solo=api.make(part.spec),stats=group.stats.parts[i];vertices+=solo.stats.vertices;triangles+=solo.stats.triangles;assert.equal(stats.kind,part.spec.kind);assert.equal(stats.quantity,part.spec.quantity);assert.equal(stats.vertices,solo.stats.vertices);assert.equal(stats.triangles,solo.stats.triangles);});
 assert.equal(group.stats.vertices,vertices);assert.equal(group.stats.triangles,triangles);assert.deepEqual(doc.asset.extras.parts,JSON.parse(JSON.stringify(group.stats.parts)));
});
check('Mixed group transforms every position, normal and material-local index correctly',()=>{
 const group=api.makeGroup(mixed),actual=primitives(group),expected=expectedGroup(mixed);assert.equal(actual.length,expected.materials.length);
 actual.forEach((p,i)=>{const e=expected.materials[i];assert.equal(p.material,e.material);assert.deepEqual(p.i,e.i);for(const key of ['p','n']){assert.equal(p[key].length,e[key].length);p[key].forEach((v,j)=>near(v,e[key][j],key==='p'?3e-6:2e-6));}});
 group.stats.parts.forEach((part,i)=>{for(const edge of ['min','max'])part.bounds[edge].forEach((v,k)=>near(v,expected.bounds[i][edge][k],2e-6));});
});
check('Identity placement preserves the original mesh exactly',()=>{
 const spec=examples[5][1],solo=primitives(api.make(spec)),group=api.makeGroup([{spec}]);integrity(group);assert.deepEqual(primitives(group),solo);
});
check('Mixed group is deterministic and never mutates caller data',()=>{
 const before=JSON.stringify(mixed),a=api.makeGroup(mixed),b=api.makeGroup(mixed);assert.equal(JSON.stringify(mixed),before);assert(Buffer.from(a.glb).equals(Buffer.from(b.glb)));assert(a.stats.materials<=12);assert(a.glb.byteLength/6<200000);
});
check('Exactly 48 group units are retained; 49 or an already capped part is rejected',()=>{
 const full=api.makeGroup([{spec:{kind:'barrier',quantity:24}},{spec:{kind:'toilet',quantity:24},offset:[0,10,0]}]);integrity(full);assert.equal(full.stats.quantity,48);assert.equal(full.stats.parts[1].quantity,24);
 for(const parts of [[{spec:{kind:'toilet',quantity:49}}],[{spec:{kind:'toilet',quantity:24}},{spec:{kind:'barrier',quantity:25}}],[{spec:{kind:'generator',quantity:100000}}]])assert.throws(()=>api.makeGroup(parts),/exceeds 48 units/);
});
check('Empty, too many or unsupported group parts cannot silently produce a partial mesh',()=>{
 for(const parts of [null,{},[],Array.from({length:49},()=>({spec:{kind:'toilet'}}))])assert.throws(()=>api.makeGroup(parts),/1 to 48/);
 assert.throws(()=>api.makeGroup([{spec:{kind:'toilet'}},null]),/part is required/);assert.throws(()=>api.makeGroup([{spec:{kind:'toilet'}},{spec:{kind:'fencing'}}]),/Unsupported equipment kind/);
});
check('Invalid transforms fail clearly instead of contaminating coordinates',()=>{
 const spec={kind:'toilet'};
 for(const offset of [[NaN,0,0],[0,Infinity,0],[0,0,-Infinity],[0,0],[0,0,0,0],['1',0,0],[1000001,0,0],null])assert.throws(()=>api.makeGroup([{spec,offset}]),/three finite metre coordinates/);
 for(const angle of [NaN,Infinity,-Infinity,'0',null])assert.throws(()=>api.makeGroup([{spec,angle}]),/finite radians/);
});
check('Confirmed open doors stay on the requested wall for every supported doorway family',()=>{
 for(const kind of ['building','container','toilet_block','accessible_toilet','toilet']){
  const options={kind,width:3,length:6,height:2.9},base=api.make(options);
  for(const side of ['front','back','left','right']){
   const model=api.make({...options,doorSide:side,doorConfirmed:true,doorOpen:true}),data=integrity(model);
   assert(model.stats.triangles>base.stats.triangles);
   const axis=side==='left'||side==='right'?0:1;
   if(side==='left'||side==='front')assert(model.stats.bounds.min[axis]<base.stats.bounds.min[axis]-.5);
   else assert(model.stats.bounds.max[axis]>base.stats.bounds.max[axis]+.5);
   assert.equal(data.doc.asset.extras.doorSide,side);assert.equal(data.doc.asset.extras.doorConfirmed,true);assert.equal(data.doc.asset.extras.doorOpen,true);
  }
 }
});
check('An unconfirmed open request cannot create an authoritative door',()=>{
 const base=api.make({kind:'building'}),unsafe=api.make({kind:'building',doorSide:'right',doorOpen:true,doorConfirmed:false});
 assert.equal(base.stats.vertices,unsafe.stats.vertices);assert.equal(base.stats.triangles,unsafe.stats.triangles);
 const data=integrity(unsafe);assert.equal(data.doc.asset.extras.doorOpen,false);assert.equal(data.doc.asset.extras.doorCount,0);
});
check('Two sourced doorway offsets survive a transformed mixed group',()=>{
 const doors=[{side:'right',offset:-1.4,width:.8,confirmed:true,open:true},{side:'right',offset:1.2,width:.9,confirmed:true,open:true}];
 const options={kind:'toilet_block',width:3,length:6,height:2.9,doorSide:'right',doorConfirmed:true,doorOpen:true,doorCount:2,doors};
 const model=api.makeGroup([{spec:options,offset:[12,5,0],angle:.71},{spec:{kind:'toilet'},offset:[0,0,0],angle:0}]);integrity(model);
 const stats=model.stats.parts[0];assert.equal(stats.doorCount,2);assert.equal(stats.doors.length,2);assert.equal(stats.doors[0].offset,-1.4);assert.equal(stats.doors[1].width,.9);assert.equal(stats.doorOpen,true);
 assert.equal(model.stats.parts[1].doorConfirmed,false);assert.equal(model.stats.parts[1].doorCount,0);
});
check('Adapted doorway metadata survives grouping without changing the established mesh',()=>{
 const door={side:'right',offset:-.645,width:.83,confirmed:true,open:true};
 const spec={kind:'accessible_toilet',length:1.8,width:1.6,height:2.4,doorSide:'right',doorConfirmed:true,doorOpen:true,doors:[door]};
 const base=api.makeGroup([{spec}]),annotated=api.makeGroup([{spec:{...spec,doorAdapted:true,doors:[{...door,adapted:true,renderedOffset:-.485,renderedWidth:.83}]}}]);
 assert.deepEqual(primitives(base),primitives(annotated));
 const data=integrity(annotated),stats=annotated.stats.parts[0];
 assert.equal(stats.doorAdapted,true);assert.equal(stats.doors[0].adapted,true);near(stats.doors[0].offset,-.645);near(stats.doors[0].renderedOffset,-.485);
 assert.equal(data.doc.asset.extras.parts[0].doorAdapted,true);
});
console.log(`${count}/${count} PASS`);
