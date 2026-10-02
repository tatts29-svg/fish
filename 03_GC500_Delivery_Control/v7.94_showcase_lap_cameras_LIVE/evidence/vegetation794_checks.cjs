/* Author: Andrew Fisher. CPU geometry/lifecycle comparison with the accepted v7.92 foliage. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const dir=path.resolve(__dirname,'..'),prior=path.resolve(dir,'../v7.92_showcase_photo_refinement_LIVE/vegetation792_src.js');
const checks=[];function check(name,fn){fn();checks.push({name,pass:true});}
class MeshBatch{
 constructor(){this.v=[];this.i=[];this.nv=0;this.vb={};this.ib={};this.vao={};}
 vert(...a){assert.equal(a.length,9);assert(a.every(Number.isFinite));this.v.push(...a);return this.nv++;}
 tri(...a){assert(a.every(i=>Number.isInteger(i)&&i>=0&&i<this.nv));this.i.push(...a);}
 upload(){this.ni=this.i.length;}
}
function runtime(file,Batch=MeshBatch){
 const G={MeshBatch:Batch},math=Object.create(Math);math.random=()=>{throw Error('Placement/physics RNG called');};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:{GC3D:G},Math:math,console});return G;
}
function scene(rows){
 let v0=0,i0=0;const v=[],i=[];
 rows=rows.map(q=>{const nv=q.mid?4:3,nt=q.mid?(q.palm?(q.near?638:396):(q.near?352:288)):1;
  const row={y0:.06,lean:.04,tint:1,phase:1.27,...q,v0,v1:v0+nv,i0,i1:i0+nt*3};
  for(let k=0;k<nv;k++)v.push(q.x+k*.1,.06+k*.15,q.z+k*.07,.04,.1,.03,1,0,0);
  for(let k=0;k<nt;k++)i.push(v0,v0+1,v0+2);v0+=nv;i0+=nt*3;return Object.freeze(row);});
 Object.freeze(rows);const original={v,i,ni:i.length},removed=[];
 const P=Array.from({length:120},(_,k)=>[100*Math.cos(k*Math.PI/60),100*Math.sin(k*Math.PI/60),2]);
 return {CL:{p:P,n:P.length},gridS:0,gl:{deleteBuffer:b=>removed.push(b),deleteVertexArray:b=>removed.push(b)},
  dayTrees:original,trees:original,vegetation781Source:rows,sunShadow:{source:{}},removed,original,
  dayTreeTrunks:Object.freeze({preserved:true}),detail781Enabled:true};
}
function install(file,rows){const G=runtime(file),S=scene(rows),saved=JSON.stringify(S.vegetation781Source),stats=G.installVegetation781(S);assert.equal(saved,JSON.stringify(S.vegetation781Source));return {G,S,stats,mesh:S.dayTrees};}
const target=path.join(dir,'vegetation794_src.js');
const populations=[];
for(let sector=0;sector<12;sector++)for(let j=0;j<30;j++){
 const a=(sector+(j+.5)/30)*Math.PI/6;populations.push({x:112*Math.cos(a),z:112*Math.sin(a),r:.7+(j%4)*.15,h:1.7+(j%3)*.24,near:j<18,mid:j<28,palm:j%5===0,phase:j*.67});
}
const old=install(prior,populations),fresh=install(target,populations),snapshot=JSON.stringify(fresh.S.vegetation781Source);
check('All accepted tree rows, coordinates, height/radius and source ranges remain exact',()=>assert.equal(JSON.stringify(fresh.S.vegetation781Source),snapshot));
check('One replacement batch, no additional draw call, same triangle count and 80000-triangle ceiling',()=>{
 assert.equal(fresh.stats.triangles,old.stats.triangles);assert.equal(fresh.stats.addedTriangles,old.stats.addedTriangles);
 assert(fresh.stats.addedTriangles<=80000);assert.equal(fresh.stats.drawCalls,1);assert.equal(fresh.stats.additionalDrawCalls,0);
});
check('Full twelve-sector allocation and premium selection preserved',()=>{
 assert.equal(fresh.stats.coverageSectors,12);assert(fresh.stats.fullEligibleCoverage);
 assert.equal(JSON.stringify(fresh.stats.sectors),JSON.stringify(old.stats.sectors));assert.equal(fresh.stats.premiumTrees,old.stats.premiumTrees);
});
check('Branch tufts double the lobe count while keeping leaf-spray and palm counts unchanged',()=>{
 assert.equal(fresh.stats.branchTufts794,old.stats.crownLobes*2);assert.equal(fresh.stats.leafSprays,old.stats.leafSprays);
 assert.equal(fresh.stats.palmFronds,old.stats.palmFronds);assert.equal(fresh.stats.palmLeaflets,old.stats.palmLeaflets);
});
check('Vertex growth bounded to eight per refined broadleaf, index memory unchanged',()=>{
 const broad=populations.filter(q=>q.mid&&!q.palm).length;
 assert(fresh.stats.vertices<=old.stats.vertices+broad*8);assert.equal(fresh.mesh.i.length,old.mesh.i.length);
 assert(fresh.stats.gpuBytes<=old.stats.gpuBytes+broad*8*9*4);
});
check('All normals encode within octahedral range, colours remain finite and restrained',()=>{
 for(let k=0;k<fresh.mesh.v.length;k+=9){for(const p of [7,8])assert(Math.abs(fresh.mesh.v[k+p])<=1.0000001);
  for(const p of [3,4,5])assert(fresh.mesh.v[k+p]>=0&&fresh.mesh.v[k+p]<.3);assert.equal(fresh.mesh.v[k+6],1);}
});
check('Original trunk object and original foliage arrays are not mutated',()=>{
 assert(fresh.S.dayTreeTrunks.preserved);assert.deepStrictEqual(fresh.S.original,scene(populations).original);
});
check('Palms and distant trees retain identical generated mesh bytes',()=>{
 for(const q of [{x:112,z:0,r:1,h:2,near:true,mid:true,palm:true},{x:115,z:10,r:1,h:2,near:false,mid:true,palm:true},{x:200,z:0,r:1,h:2,near:false,mid:false,palm:false}]){
  const a=install(prior,[q]),b=install(target,[q]);assert.deepStrictEqual(a.mesh.v,b.mesh.v);assert.deepStrictEqual(a.mesh.i,b.mesh.i);
 }
});
check('Modified broadleaf crowns keep original height envelope and bounded lateral extent',()=>{
 for(let j=0;j<16;j++){
  const q={x:112+j,z:12,r:1,h:1.5,near:true,mid:true,palm:false,phase:j*.49},a=install(prior,[q]),b=install(target,[q]);
  const heights=m=>m.v.filter((_,k)=>k%9===1),ha=heights(a.mesh),hb=heights(b.mesh);
  assert(Math.max(...hb)<=Math.max(...ha)+.001);assert(Math.min(...hb)>=Math.min(...ha)-.001);
  for(let k=0;k<b.mesh.v.length;k+=9)assert(Math.hypot(b.mesh.v[k]-q.x-.04,b.mesh.v[k+2]-q.z)<1.4*q.r);
 }
});
check('Install is idempotent and performs no second allocation',()=>assert.strictEqual(fresh.G.installVegetation781(fresh.S),fresh.stats));
const geometry=fresh.mesh.v.slice(),indices=fresh.mesh.i.slice();
check('Detail-off restores both original mesh identities and frees exactly three GPU handles',()=>{
 fresh.G.disposeVegetation781(fresh.S);assert.strictEqual(fresh.S.dayTrees,fresh.S.original);assert.strictEqual(fresh.S.trees,fresh.S.original);
 assert.equal(fresh.S.removed.length,3);assert.equal(fresh.S.vegetation781,null);assert.equal(fresh.S.sunShadow.source,null);
});
check('Re-enable is deterministic, with unchanged source rows and geometry',()=>{
 fresh.G.installVegetation781(fresh.S);assert.deepStrictEqual(fresh.S.dayTrees.v,geometry);assert.deepStrictEqual(fresh.S.dayTrees.i,indices);
 assert.equal(JSON.stringify(fresh.S.vegetation781Source),snapshot);
});
check('Context-loss disposal skips invalid GPU deletes and rebuilds equivalent geometry',()=>{
 fresh.S.lost=true;fresh.G.disposeVegetation781(fresh.S);assert.equal(fresh.S.removed.length,3);fresh.S.lost=false;
 fresh.G.installVegetation781(fresh.S);assert.deepStrictEqual(fresh.S.dayTrees.v,geometry);assert.deepStrictEqual(fresh.S.dayTrees.i,indices);
});
check('Dense 1560-tree full-lap budget remains bounded and matches accepted allocation',()=>{
 class CountBatch extends MeshBatch{
  constructor(){super();this.v={length:0};this.i={length:0};}
  vert(...a){assert(a.every(Number.isFinite));this.v.length+=a.length;return this.nv++;}
  tri(...a){assert(a.every(i=>Number.isInteger(i)&&i>=0&&i<this.nv));this.i.length+=3;}
 }
 const dense=[];for(let sector=0;sector<12;sector++)for(let j=0;j<130;j++){
  const a=(sector+(j+.5)/130)*Math.PI/6;dense.push({x:112*Math.cos(a),z:112*Math.sin(a),r:1,h:1.7,near:j<95,mid:true,palm:j%5===0,phase:j/7});
 }
 const stats=file=>runtime(file,CountBatch).installVegetation781(scene(dense)),a=stats(prior),b=stats(target);
 assert.equal(a.triangles,b.triangles);assert.equal(a.addedTriangles,b.addedTriangles);assert(b.addedTriangles<=80000);
 assert.equal(a.premiumTrees,b.premiumTrees);assert.equal(JSON.stringify(a.sectors),JSON.stringify(b.sectors));
 assert(b.fullEligibleCoverage);assert.equal(b.coverageSectors,12);
});
const result={author:'Andrew Fisher',checks,passed:checks.length,baseline:{triangles:old.stats.triangles,vertices:old.stats.vertices,gpuBytes:old.stats.gpuBytes},candidate:fresh.stats,
 limits:'CPU synthetic geometry/lifecycle checks; final browser visual and actual-source performance verification required by integrating owner.'};
fs.writeFileSync(path.join(__dirname,'vegetation794_checks.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:checks.length,triangles:fresh.stats.triangles,gpuBytes:fresh.stats.gpuBytes}));
