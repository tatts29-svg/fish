/* Author: Andrew Fisher. Independent CPU audit of selectable fleet geometry.
 * Usage: node plant800_checks.cjs [--base /absolute/base.html]
 *        [--source /absolute/plant800_src.js] [--page /absolute/candidate.html]
 *        [--output /absolute/report.json]
 * Baseline and candidate HTML stay private; report stores their hashes only.
 * This checks geometry/behaviour on the CPU, not GPU appearance or frame rate.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const args=process.argv.slice(2),option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const release=path.resolve(__dirname,'..');
const basePath=option('--base','/workspace/private-v800-vehicle-review/vehicle-search-source.html');
const sourcePath=option('--source',path.join(release,'plant800_src.js'));
const pagePath=option('--page',null),outputPath=option('--output',path.join(__dirname,'plant800_checks.json'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const plain=x=>JSON.parse(JSON.stringify(x));
const checkList=[];
function check(name,ok,detail){checkList.push({name,pass:!!ok,...(detail===undefined?{}:{detail})});}
function fleetSource(html){
 const a=html.indexOf('G.PLANT='),b=html.indexOf('G.syncRaceCarQuality=function',a);
 if(a<0||b<a)throw Error('Cannot find established fleet source boundaries');
 return html.slice(a,b);
}
function context(source){const G={},c=vm.createContext({G,window:{GC3D:G},console});vm.runInContext(source,c,{timeout:15000});return {G,c};}
function clearCaches(G){delete G._plantModels;delete G._vmsModels;delete G._looModels;}
function model(G,kind,quality){return kind==='vms'?G.vmsModel(quality):kind==='loo'?G.looModel(quality):G.plantModel(kind,quality);}
function canonical(value){
 if(value===undefined)return '<undefined>';
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
function signature(p){return canonical({material:p.material,color:p.color,wheel:p.wheel,sway:p.sway,door:p.door,arm:p.arm,vmsFace:p.vmsFace,tex:p.tex,spokes:p.name.includes('spokes'),panel:p.name==='wing-endplates'?2:p.name==='roof-and-pillars'?1:0});}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function sub(a,b){return a.map((v,i)=>v-b[i]);}
function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0);}
function triangle(p,j){return [0,1,2].map(k=>Array.from(p.vertices.slice(p.indices[j+k]*8,p.indices[j+k]*8+8)));}
function geometry(parts){
 const result={parts:parts.length,triangles:0,vertices:0,bytes:0,invalidValues:0,invalidIndices:0,invalidStride:0,degenerateTriangles:0,invalidReferencedNormals:0,opposedNormals:0,minNormalAlignment:1,bounds:{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},issues:[]};
 for(const p of parts){
  const before=[result.degenerateTriangles,result.invalidReferencedNormals,result.opposedNormals];
  result.triangles+=p.indices.length/3;result.vertices+=p.vertices.length/8;result.bytes+=p.vertices.length*4+p.indices.length*4;
  if(p.vertices.length%8||p.indices.length%3)result.invalidStride++;
  for(const n of p.vertices)if(!Number.isFinite(n))result.invalidValues++;
  const referenced=new Set();
  for(const i of p.indices){if(!Number.isInteger(i)||i<0||i>=p.vertices.length/8)result.invalidIndices++;else referenced.add(i);}
  for(let i=0;i<p.vertices.length;i+=8)for(let k=0;k<3;k++){result.bounds.min[k]=Math.min(result.bounds.min[k],p.vertices[i+k]);result.bounds.max[k]=Math.max(result.bounds.max[k],p.vertices[i+k]);}
  for(const i of referenced){const l=Math.hypot(...p.vertices.slice(i*8+3,i*8+6));if(!Number.isFinite(l)||Math.abs(l-1)>1e-4)result.invalidReferencedNormals++;}
  if(!result.invalidIndices)for(let j=0;j<p.indices.length;j+=3){
   const v=triangle(p,j),n=cross(sub(v[1].slice(0,3),v[0].slice(0,3)),sub(v[2].slice(0,3),v[0].slice(0,3))),area=Math.hypot(...n);
   if(area<1e-14){result.degenerateTriangles++;continue;}
   const normal=[0,1,2].map(i=>v[0][3+i]+v[1][3+i]+v[2][3+i]),alignment=dot(n,normal)/(area*Math.hypot(...normal));
   result.minNormalAlignment=Math.min(result.minNormalAlignment,alignment);
   if(!Number.isFinite(alignment)||alignment< -1e-6)result.opposedNormals++;
  }
  const change=[result.degenerateTriangles,result.invalidReferencedNormals,result.opposedNormals].map((v,i)=>v-before[i]);
  if(change.some(Boolean))result.issues.push({part:p.name,degenerateTriangles:change[0],invalidReferencedNormals:change[1],opposedNormals:change[2]});
 }
 return result;
}
// Compare exactly the rendered triangle attributes, including winding and UVs,
// after Float32 conversion. Part concatenation/reindexing cannot change them.
function triangleInventory(parts,omitCollapsed=false){
 const groups=new Map();
 for(const p of parts){const key=signature(p);let values=groups.get(key);if(!values){values=[];groups.set(key,values);}
  for(let j=0;j<p.indices.length;j+=3){const values32=new Float32Array(triangle(p,j).flat());
   if(omitCollapsed){const a=Array.from(values32.slice(0,3)),b=Array.from(values32.slice(8,11)),c=Array.from(values32.slice(16,19)),edges=[sub(b,a),sub(c,a),sub(c,b)];if(Math.hypot(...cross(edges[0],edges[1]))<1e-12||Math.min(...edges.map(e=>Math.hypot(...e)))<1e-7)continue;}
   values.push(hash(Buffer.from(values32.buffer)));}
 }
 return Array.from(groups,([key,values])=>({key,count:values.length,hash:hash(values.sort().join(''))})).sort((a,b)=>a.key.localeCompare(b.key));
}
function modelDigest(m){return hash(canonical(triangleInventory(m.parts)));}
function cloneParts(parts){return parts.map(p=>({...plain({...p,vertices:undefined,indices:undefined}),vertices:Array.from(p.vertices),indices:Array.from(p.indices)}));}
function motionGroups(parts){return Array.from(new Set(parts.map(p=>canonical({wheel:p.wheel,sway:p.sway,door:p.door,arm:p.arm,vmsFace:p.vmsFace})))).sort();}
function sourceProtection(B,C,baseText,pageText){
 const names=['setVehicle','trailerStep','trailerMatrix','swayStep','swayMatrix','looStep','hingeY','hingeZ','looShot','looRollParts','looRolls','vmsTexture','finishModel'];
 for(const name of names)check('protected '+name,typeof C[name]==='function'&&String(B[name])===String(C[name]));
 check('protected PLANT speed grip and engine-note definitions',canonical(B.PLANT)===canonical(C.PLANT));
 check('protected VMS hitch length and LED text',canonical(B.VMS)===canonical(C.VMS));
 if(pageText){
  const anchors=[['selection','const SE_LIST =','function showViewGet'],['renderer','G.syncRaceCarQuality=function','\n})();']];
  for(const [name,a,b] of anchors){const read=t=>{const i=t.indexOf(a),j=t.indexOf(b,i);if(i<0||j<0)throw Error('Missing protected '+name+' block');return t.slice(i,j);};check('exact full-page '+name+' preservation',read(baseText)===read(pageText));}
 }
}
function mergeFixtures(G){
 const opts=[{}, {color:[1,0,0]},{color:[0,1,0]},{wheel:{x:1,y:.2}},{wheel:{x:1,y:.3}},{wheel:{x:-1,y:.2}},{wheel:{x:1,y:.2,z:.4,r:.2}},{sway:{p:[1,.7,0],roll:.9,pitch:.5}},{sway:{p:[1,.7,0],roll:.8,pitch:.5}},{door:{p:[-.25,0,.212]}},{arm:{p:[.14,.84,.09]}},{vmsFace:true},{vmsFace:false}];
 const parts=[];
 for(let i=0;i<opts.length;i++)for(let j=0;j<2;j++)parts.push({name:'fixture '+i+' '+j,material:'plant',...opts[i],vertices:[i,0,0,0,0,1,0,0, i+1,0,0,0,0,1,1,0, i,1,0,0,0,1,0,1],indices:[0,1,2]});
 const before=triangleInventory(parts),after=G.__auditConsolidate(G.finishModel(cloneParts(parts),'high','audit fixture'),'audit fixture');
 check('merger preserves exact material/color/wheel/sway/door/arm/vmsFace semantics',canonical(before)===canonical(triangleInventory(after.parts)),{inputParts:parts.length,outputParts:after.parts.length,renderGroups:before.length});
}
function primitiveChecks(G){
 const fixtures=[
  ['box',K=>K.box(K.group('box','plant'),-2,2,-1,1,-.7,.7)],
  ['rounded box',K=>K.rbox(K.group('rounded box','plant'),0,0,0,2,1,.7,.3,24,12)],
  ['small rounded box',K=>K.rbox(K.group('small rounded box','plant'),.31,.97,.3,.022,.028,.028,.5,10,6),[.31,.97,.3]],
  ['ball',K=>K.ball(K.group('ball','plant'),[0,0,0],1,20)],
  ['tube',K=>K.tube(K.group('tube','plant'),[-1,0,0],[1,0,0],.4,16)],
  ['bar',K=>K.bar(K.group('bar','plant'),[-1,0,0],[1,0,0],.5,.4)],
  ['disc',K=>K.disc(K.group('disc','plant'),[0,0,0],.2,1,-1,24),null,[0,0,-1]]
 ];
 const rows=[];
 for(const quality of ['balanced','high'])for(const [name,build,origin=[0,0,0],fixed] of fixtures){
  const K=G.plantKit(quality);build(K);const m=G.finishModel(K.parts,quality,'audit '+name),r=geometry(m.parts);let inward=0;
  for(const p of m.parts)for(let j=0;j<p.indices.length;j+=3){const v=triangle(p,j),n=cross(sub(v[1].slice(0,3),v[0].slice(0,3)),sub(v[2].slice(0,3),v[0].slice(0,3))),center=[0,1,2].map(i=>(v[0][i]+v[1][i]+v[2][i])/3),out=fixed||sub(center,origin);if(dot(n,out)<-1e-14)inward++;}
  check(name+' primitive '+quality+' finite nondegenerate outward mesh',!r.invalidValues&&!r.invalidIndices&&!r.invalidReferencedNormals&&!r.degenerateTriangles&&!r.opposedNormals&&!inward,{triangles:r.triangles,degenerate:r.degenerateTriangles,opposedNormals:r.opposedNormals,inward});rows.push({name,quality,...r,inward});
 }
 return rows;
}
function selectionChecks(B,C){
 const input=['car','car_vms','car_loo','forklift','boom','scissor','tractor','invalid','car_loo','car_loo','car'];
 function run(G){const calls=[];G.S={vehicle:'car',tune:{vmax:42,aLat:12},rebuildSpeed:()=>calls.push('speed')};G.sound={};return input.map(kind=>{const result=G.setVehicle(kind);return {kind,result,S:plain(G.S),vehicle:G.vehicle,towVms:G.towVms,sound:plain(G.sound),calls:calls.length};});}
 check('selection sequence preserves speed grip tow kind reset and note',canonical(run(B))===canonical(run(C)));
}
const baseText=fs.readFileSync(basePath,'utf8'),sourceText=fs.readFileSync(sourcePath,'utf8'),pageText=pagePath?fs.readFileSync(pagePath,'utf8'):null;
const instrument=text=>text.replace('function consolidate(model,kind){','G.__auditConsolidate=consolidate;\nfunction consolidate(model,kind){');
const baseline=context(fleetSource(baseText)),candidate=context(instrument(pageText?fleetSource(pageText):fleetSource(baseText)));
// The release source is an additive override when testing before full build.
// If the full candidate embeds it outside the fleet block, load that exact block.
if(!pageText||!fleetSource(pageText).includes('plantVisuals800'))vm.runInContext(instrument(sourceText),candidate.c,{timeout:15000});
const B=baseline.G,C=candidate.G;
if(pageText)check('candidate embeds exact audited fleet source',pageText.includes(sourceText));
sourceProtection(B,C,baseText,pageText);selectionChecks(B,C);mergeFixtures(C);
const primitives=primitiveChecks(C),models=[];
for(const quality of ['balanced','high'])for(const kind of ['forklift','boom','scissor','tractor','vms','loo']){
 const before=model(B,kind,quality),beforeStats=geometry(before.parts);
 let rawParts=null;const finish=C.finishModel;C.finishModel=function(parts,...rest){rawParts=cloneParts(parts);return finish.call(this,parts,...rest);};
 const start=performance.now(),after=model(C,kind,quality),buildMs=performance.now()-start;C.finishModel=finish;
 const stats=geometry(after.parts),label=kind+' '+quality;
 check(label+' finite attributes valid stride and indices',!stats.invalidValues&&!stats.invalidIndices&&!stats.invalidStride);
 check(label+' nondegenerate triangles and unit referenced normals',!stats.degenerateTriangles&&!stats.invalidReferencedNormals&&!stats.opposedNormals,{degenerate:stats.degenerateTriangles,invalidNormals:stats.invalidReferencedNormals,opposedNormals:stats.opposedNormals});
 check(label+' merge exact live triangle attributes and animation groups',rawParts&&canonical(triangleInventory(rawParts,true))===canonical(triangleInventory(after.parts)));
 check(label+' existing wheel sway door arm and LED motion groups preserved',canonical(motionGroups(before.parts))===canonical(motionGroups(after.parts)));
 check(label+' removed collapsed triangle count reported accurately',rawParts&&rawParts.reduce((s,p)=>s+p.indices.length/3,0)-stats.triangles===after.stats.collapsedLegacyPoleTrianglesRemoved);
 const digest=modelDigest(after),cached=Array.from({length:10},()=>model(C,kind,quality));
 check(label+' stable immutable model cache',cached.every(m=>m===after)&&digest===modelDigest(after));
 check(label+' bounded triangle and draw costs',stats.triangles<=30000&&stats.parts<=beforeStats.parts,{triangleLimit:30000,baselineTriangles:beforeStats.triangles,triangles:stats.triangles,baselineDraws:beforeStats.parts,draws:stats.parts,triangleRatio:stats.triangles/beforeStats.triangles});
 check(label+' bounds reported correctly',canonical(after.bounds)===canonical(rawParts?geometry(rawParts).bounds:stats.bounds)||after.bounds.min.every((v,i)=>Math.abs(v-stats.bounds.min[i])<1e-5)&&after.bounds.max.every((v,i)=>Math.abs(v-stats.bounds.max[i])<1e-5));
 models.push({kind,quality,baseline:beforeStats,candidate:stats,buildMs,digest,mergedFromParts:rawParts?.length});
}
for(const kind of ['forklift','boom','scissor','tractor','vms','loo']){
 const balanced=models.find(m=>m.kind===kind&&m.quality==='balanced'),high=models.find(m=>m.kind===kind&&m.quality==='high');
 check(kind+' balanced no larger than high',balanced.candidate.triangles<=high.candidate.triangles&&balanced.candidate.vertices<=high.candidate.vertices&&balanced.candidate.parts<=high.candidate.parts);
 check(kind+' quality caches isolated',model(C,kind,'balanced')!==model(C,kind,'high'));
}
clearCaches(C);
for(const row of models)check(row.kind+' '+row.quality+' deterministic cold rebuild',row.digest===modelDigest(model(C,row.kind,row.quality)));
const report={author:'Andrew Fisher',scope:'Independent CPU geometry and animation/selection preservation audit',timestamp:new Date().toISOString(),sourceSha256:hash(sourceText),baselinePageSha256:hash(baseText),candidatePageSha256:pageText?hash(pageText):null,limitations:['No GPU browser used; appearance, shader compatibility, real draw timing and phone frame rate require integrated browser checks.','Outward winding tested on isolated convex primitives; final assemblies checked for winding agreement with stored vertex normals.','CPU construction timings are diagnostic single samples, not a performance benchmark.'],passed:checkList.filter(c=>c.pass).length,failed:checkList.filter(c=>!c.pass).length,checks:checkList,models,primitives};
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,failed:report.failed,sourceSha256:report.sourceSha256,candidatePageSha256:report.candidatePageSha256,failures:checkList.filter(c=>!c.pass),models:models.map(m=>({kind:m.kind,quality:m.quality,triangles:m.candidate.triangles,draws:m.candidate.parts,buildMs:Math.round(m.buildMs)})),output:outputPath},null,2));
process.exitCode=report.failed?1:0;
