/* Author: Andrew Fisher. Combine only identical solid-car draw semantics. The
   authored geometry, normals, UVs, triangle order and wheel pivots stay intact. */
G.compactRaceCarParts1091=function(parts){
 const opaque=new Map(),groups=[],last={1:null,2:null};
 for(const part of parts){
  const panel=part.name==='wing-endplates'?2:part.name==='roof-and-pillars'?1:0;
  const spoke=part.name.includes('spokes');
  const key=JSON.stringify([part.material,part.color||null,part.wheel||null,panel,spoke]);
  // Future independently animated or textured parts keep their own draw.
  const separate=['sway','vmsFace','door','arm','tex'].some(k=>part[k]!==undefined);
  const layer=part.material==='decal'||part.material==='ledAmber'?2:part.material==='glass'||spoke?1:0;
  // Blended batches merge only consecutive compatible draws in their layer.
  // Their original compositing/label order therefore stays exact.
  let group=!separate?(layer===0?opaque.get(key):last[layer]?.key===key?last[layer]:null):null;
  if(!group){group={key,parts:[],vertices:0,indices:0};groups.push(group);if(!separate&&layer===0)opaque.set(key,group);}
  if(layer)last[layer]=separate?null:group;
  group.parts.push(part);group.vertices+=part.vertices.length;group.indices+=part.indices.length;
 }
 return groups.map(group=>{
  if(group.parts.length===1)return group.parts[0];
  const first=group.parts[0],vertices=new Float32Array(group.vertices),indices=new Uint32Array(group.indices);
  let v=0,i=0;
  for(const part of group.parts){vertices.set(part.vertices,v);const offset=v/8;for(const index of part.indices)indices[i++]=offset+index;v+=part.vertices.length;}
  return {...first,vertices,indices,sourceParts1091:group.parts.map(p=>p.name)};
 });
};
