// Author: Andrew Fisher. Compare exact authored triangles, attributes and draw semantics.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const [pageFile,out]=process.argv.slice(2),source=fs.readFileSync(pageFile,'utf8'),checks=[],result={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(source).digest('hex')};
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a);return source.slice(a,b);}
const G={};const window={GC3D:G};
Function('window',section('/* Author: Andrew Fisher. v8.00 — surfaced race coupe.','/* GC3D — bounded, simplified facade reflections'))(window);
Function('window',section('/* GC500 v1.7 — explicitly typeset livery,','/* Author: Andrew Fisher. v8.00 — surfaced race coupe.'))(window);
Function('G',section('G.compactRaceCarParts1091=function(parts){','G.syncRaceCarQuality=function(S){'))(G);
const sha=typed=>crypto.createHash('sha256').update(Buffer.from(typed.buffer,typed.byteOffset,typed.byteLength)).digest('hex');
const layer=p=>p.material==='decal'||p.material==='ledAmber'?2:p.material==='glass'||p.name.includes('spokes')?1:0;
const semantics=p=>JSON.stringify([p.material,p.color||null,p.wheel||null,p.name==='wing-endplates'?2:p.name==='roof-and-pillars'?1:0,p.name.includes('spokes'),layer(p)]);
result.geometry=[];
for(const quality of ['balanced','high']){
 const model=G.raceCarModel(quality),original=model.parts.slice().sort((a,b)=>(a.material==='glass')-(b.material==='glass')).concat(G.raceCarDecals());
 const before=original.map(p=>[sha(new Float32Array(p.vertices)),sha(new Uint32Array(p.indices))]);
 const compact=G.compactRaceCarParts1091(original),byName=new Map(original.map(p=>[p.name,p]));
 for(const merged of compact){let v=0,i=0;for(const name of merged.sourceParts1091||[merged.name]){
  const p=byName.get(name);assert(p);assert.equal(semantics(p),semantics(merged),'Matching draw contract '+name);
  assert.deepEqual(Array.from(merged.vertices.slice(v,v+p.vertices.length)),Array.from(new Float32Array(p.vertices)),name+' exact position/normal/UV');
  for(const index of p.indices)assert.equal(merged.indices[i++],index+v/8,name+' exact oriented triangle');v+=p.vertices.length;
 }assert.equal(v,merged.vertices.length);assert.equal(i,merged.indices.length);}
 for(const l of [1,2])assert.deepEqual(compact.filter(p=>layer(p)===l).flatMap(p=>p.sourceParts1091||[p.name]),original.filter(p=>layer(p)===l).map(p=>p.name),'Exact blended draw order');
 assert.deepEqual(original.map(p=>[sha(new Float32Array(p.vertices)),sha(new Uint32Array(p.indices))]),before,'Source arrays immutable');
 const total=parts=>parts.reduce((r,p)=>({vertices:r.vertices+p.vertices.length/8,triangles:r.triangles+p.indices.length/3}),{vertices:0,triangles:0});
 assert.deepEqual(total(compact),total(original));assert(compact.length<original.length);
 result.geometry.push({quality,originalDraws:original.length,compactedDraws:compact.length,...total(compact),allAttributesTrianglesAndBlendedOrderExact:true,groups:compact.filter(p=>p.sourceParts1091).map(p=>p.sourceParts1091)});
 checks.push(quality+' authored geometry, transforms, semantics, blend order and immutable source');
}
// Distinct future animation hooks are deliberately never folded together.
const p=G.raceCarModel('balanced').parts[0];const separate=G.compactRaceCarParts1091([{...p,sway:{}},{...p,sway:{}}]);assert.equal(separate.length,2);checks.push('Unknown independent animation hooks remain separate');
result.checks=checks;result.pass=true;if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
