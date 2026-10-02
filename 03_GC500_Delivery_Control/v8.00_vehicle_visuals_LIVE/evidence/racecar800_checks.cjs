/* Author: Andrew Fisher. Actual original-model comparison; CPU only.
 * node racecar800_checks.cjs ORIGINAL_HTML [OUTPUT_JSON] [CANDIDATE_HTML]
 * Geometry checks do not establish GPU rendering, frame rate or visual acceptance.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const folder=path.resolve(__dirname,'..'),originalPath=process.argv[2];
assert(originalPath,'Original hosted HTML is required');
const html=fs.readFileSync(originalPath,'utf8'),source=fs.readFileSync(path.join(folder,'racecar800_src.js'),'utf8');
const start=html.indexOf('/* GC500 v1.8 — original, purpose-built solid race coupe.'),end=html.indexOf('/* GC3D — bounded, simplified facade reflections',start);
assert(start>=0&&end>start,'original module boundaries');
const original=html.slice(start,end),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),checks=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});assert(pass,name+' '+JSON.stringify(detail||''));};
function context(src){const G={},math=Object.create(Math);math.random=()=>{throw Error('Visual mesh consumed random state');};
 const ctx=vm.createContext({window:{GC3D:G},Float32Array,Uint32Array,Math:math});vm.runInContext(src,ctx);return {G,ctx};}
function fingerprint(m){return sha(Buffer.concat(m.parts.flatMap(p=>[Buffer.from(p.vertices.buffer),Buffer.from(p.indices.buffer)])));}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function inspect(m){let finite=true,indices=true,normals=true,opposed=0,degenerate=0,bytes=0,minDot=1;const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const p of m.parts){bytes+=p.vertices.byteLength+p.indices.byteLength;finite=finite&&p.vertices.every(Number.isFinite);indices=indices&&p.indices.every(i=>i<p.vertices.length/8);
  for(let i=0;i<p.vertices.length;i+=8){for(let k=0;k<3;k++){min[k]=Math.min(min[k],p.vertices[i+k]);max[k]=Math.max(max[k],p.vertices[i+k]);}normals=normals&&Math.abs(Math.hypot(...p.vertices.slice(i+3,i+6))-1)<1e-5;}
  for(let j=0;j<p.indices.length;j+=3){const ix=p.indices.slice(j,j+3),P=Array.from(ix,i=>Array.from(p.vertices.slice(i*8,i*8+3))),n=cross(sub(P[1],P[0]),sub(P[2],P[0])),length=Math.hypot(...n);
   if(length<1e-12){degenerate++;continue;}
   let bad=false;for(const i of ix){const d=n.reduce((s,v,k)=>s+v*p.vertices[i*8+3+k],0)/length;minDot=Math.min(minDot,d);if(d<-.02)bad=true;}if(bad)opposed++;
  }
 }return {finite,indices,normals,opposed,degenerate,bytes,minDot,min,max};}
function closedSpokes(p){const edges=new Map(),key=i=>Array.from(p.vertices.slice(i*8,i*8+3),x=>Math.round(x*1e7)).join(','),points=i=>Array.from(p.vertices.slice(i*8,i*8+3));let volume=0;
 for(let j=0;j<p.indices.length;j+=3){const ix=Array.from(p.indices.slice(j,j+3)),P=ix.map(points);volume+=P[0].reduce((s,v,k)=>s+v*cross(P[1],P[2])[k],0)/6;
  for(let k=0;k<3;k++){const a=key(ix[k]),b=key(ix[(k+1)%3]),id=a<b?a+'|'+b:b+'|'+a,q=edges.get(id)||{count:0,direction:0};q.count++;q.direction+=a<b?1:-1;edges.set(id,q);}
 }return {unclosed:Array.from(edges.values()).filter(e=>e.count!==2||e.direction!==0).length,volume};}
function maxTriangleArea(p){let value=0;for(let j=0;j<p.indices.length;j+=3){const q=Array.from(p.indices.slice(j,j+3),i=>Array.from(p.vertices.slice(i*8,i*8+3)));value=Math.max(value,Math.hypot(...cross(sub(q[1],q[0]),sub(q[2],q[0])))/2);}return value;}

const old=context(original),next=context(source),metrics={};
ck('only visual model API is introduced',Object.keys(next.G).sort().join(',')==='raceCarModel,raceCarVisual800');
for(const quality of ['balanced','high']){
 const began=performance.now(),before=old.G.raceCarModel(quality),model=next.G.raceCarModel(quality),buildMs=performance.now()-began,a=inspect(before),b=inspect(model);
 const names=x=>x.parts.map(p=>[p.name,p.material,p.wheel||null]);
 ck(quality+' finite complete vertex and index buffers',b.finite&&b.indices&&model.parts.every(p=>p.vertices instanceof Float32Array&&p.indices instanceof Uint32Array));
 ck(quality+' unit normals agree with every nondegenerate triangle',b.normals&&b.opposed===0,{originalOpposed:a.opposed,currentOpposed:b.opposed,minimumDot:b.minDot});
 ck(quality+' no degenerate triangles after float32 storage',b.degenerate===0,{count:b.degenerate});
 ck(quality+' original bounding envelope remains exact',JSON.stringify(model.bounds)===JSON.stringify(before.bounds)&&b.min.every((v,k)=>v>=a.min[k]-1e-7)&&b.max.every((v,k)=>v<=a.max[k]+1e-7));
 ck(quality+' original part names materials and wheel pivots retained',JSON.stringify(names(model))===JSON.stringify(names(before)));
 ck(quality+' triangles and retained bytes below original budget',model.stats.triangles<before.stats.triangles&&b.bytes<a.bytes,{originalTriangles:before.stats.triangles,triangles:model.stats.triangles,originalBytes:a.bytes,bytes:b.bytes});
 ck(quality+' draw-part count is unchanged',model.parts.length===31&&model.parts.length===before.parts.length);
 const spokes=model.parts.filter(p=>p.name.endsWith('-spokes')).map(p=>({name:p.name,...closedSpokes(p)}));
 ck(quality+' all four forged spoke assemblies are closed outward volumes',spokes.length===4&&spokes.every(q=>q.unclosed===0&&q.volume>0),spokes);
 const red=model.parts.find(p=>p.name==='rear-light-guides'),oldRed=before.parts.find(p=>p.name==='rear-light-guides');
 ck(quality+' rear lights include filled lenses beyond the previous thin outlines',maxTriangleArea(red)>4*maxTriangleArea(oldRed),{oldMaximumFaceArea:maxTriangleArea(oldRed),maximumFaceArea:maxTriangleArea(red)});
 const glass=model.parts.find(p=>p.material==='glass'),oldGlass=before.parts.find(p=>p.material==='glass'),front=x=>Array.from(x.vertices).filter((v,i)=>i%8===0&&v>.95).length;
 ck(quality+' actual projector lens geometry is present ahead of the cabin',front(glass)>front(oldGlass)+50,{oldFrontLensVertices:front(oldGlass),frontLensVertices:front(glass)});
 const snapshot=fingerprint(model),cached=next.G.raceCarModel(quality);
 ck(quality+' cache reuses immutable geometry without rebuilding',cached===model&&fingerprint(cached)===snapshot);
 ck(quality+' visual geometry materially changes while retaining source model',snapshot!==fingerprint(before));
 metrics[quality]={original:before.stats,current:model.stats,originalBytes:a.bytes,currentBytes:b.bytes,bounds:model.bounds,opposedNormalsBefore:a.opposed,opposedNormalsAfter:b.opposed,combinedOriginalAndNewBuildMs:+buildMs.toFixed(2),geometrySha256:snapshot};
}
ck('Ultra and unspecified requests retain the established High model contract',next.G.raceCarModel('ultra')===next.G.raceCarModel('high')&&next.G.raceCarModel()===next.G.raceCarModel('high')&&next.G._raceCarModel===next.G.raceCarModel('high'));
let largestError=0,samples=0;
for(let i=0;i<=40;i++)for(let j=0;j<=20;j++){
 const x=-1.025+i/40*2.08,y=.07+j/20*.28,z=-.29+j/20*.58;
 for(const name of ['raceCarSideZ','raceCarSurfaceY']){const v=name==='raceCarSideZ'?y:z;largestError=Math.max(largestError,Math.abs(old.G[name](x,v)-next.G[name](x,v)));samples++;}
 const a=old.G.raceCarRearPoint(y,z),b=next.G.raceCarRearPoint(y,z);for(let k=0;k<3;k++)largestError=Math.max(largestError,Math.abs(a[k]-b[k]));
}
ck('livery surface callbacks retain exact placement',largestError===0,{samples,largestError});
ck('window anchors and rear geometry callbacks remain compatible',JSON.stringify(old.G.raceCarWindowInfo)===JSON.stringify(next.G.raceCarWindowInfo));
const rects=html.match(/const rects=\{coates:[^\n]+/)[0],ds=html.indexOf('G.raceCarDecals=function(){'),de=html.indexOf('\n})();',ds),decalSource='const G=window.GC3D,W=1024,H=512;'+rects+'\n'+html.slice(ds,de)+'\n';
vm.runInContext(decalSource,old.ctx);vm.runInContext(decalSource,next.ctx);
ck('complete existing livery mesh is byte-identical on refined body',JSON.stringify(old.G.raceCarDecals())===JSON.stringify(next.G.raceCarDecals()));
const replay=context(source);for(const q of ['balanced','high'])ck(q+' deterministic geometry without random state',fingerprint(replay.G.raceCarModel(q))===metrics[q].geometrySha256);
if(process.argv[4]){const candidate=fs.readFileSync(process.argv[4],'utf8'),scrub=source.replace(/ {2,}/g,' ').replaceAll(' .','.').replaceAll(' ,',',');ck('candidate includes exact current visual module',candidate.includes(source)||candidate.includes(scrub));}
const result={author:'Andrew Fisher',scope:'CPU geometry and original source contract; no GPU, network or live writes',original:{path:path.resolve(originalPath),sha256:sha(html),modelSha256:sha(original)},sourceSha256:sha(source),candidate:process.argv[4]?{path:path.resolve(process.argv[4]),sha256:sha(fs.readFileSync(process.argv[4]))}:null,metrics,checks};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,sourceSha256:result.sourceSha256,metrics},null,2));
