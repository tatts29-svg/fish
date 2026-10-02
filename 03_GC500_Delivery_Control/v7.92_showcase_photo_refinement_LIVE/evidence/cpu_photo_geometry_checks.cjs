/* Author: Andrew Fisher. Photograph-informed facade and crown preservation/budget checks. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dir=require('path').resolve(__dirname,'..')+'/';
let invalid=0,meshAllocations=0;
class MeshBatch{
 constructor(gl,layout){meshAllocations++;this.layout=layout;this.v={length:0};this.i={length:0};this.nv=0;this.vb={};this.ib={};this.vao={};this.geometrySum=0;}
 vert(...p){if(p.some(x=>!Number.isFinite(x)))invalid++;for(let i=0;i<p.length;i++)this.geometrySum+=p[i]*(i+1)*(1+this.nv%19);this.v.length+=p.length;return this.nv++;}
 tri(){this.i.length+=3;}get ni(){return this.i.length;}upload(){}draw(){}
}
const gl=new Proxy({},{get:(o,p)=>p==='getShaderParameter'||p==='getProgramParameter'?()=>true:()=>({})});
const P=Array.from({length:120},(_,i)=>[100*Math.cos(i*Math.PI/60),100*Math.sin(i*Math.PI/60),2]);
let L=0;for(let i=0;i<P.length;i++)L+=Math.hypot(P[i][0]-P[(i+1)%P.length][0],P[i][1]-P[(i+1)%P.length][1]);
const CL={p:P,n:P.length,L,at(){throw Error('grid-centred selection must not return');}};
const G={MeshBatch,setBuildings(){},M_PER_PT:6,rng(){throw Error('RNG must be preserved');},area(P){return P.reduce((s,p,i)=>s+p[0]*P[(i+1)%P.length][1]-P[(i+1)%P.length][0]*p[1],0)/2;},V:{norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}}};
const context=vm.createContext({window:{GC3D:G},console});
vm.runInContext(fs.readFileSync(dir+'architecture792_src.js','utf8'),context);
const buildings=[];for(let s=0;s<12;s++)for(let j=0;j<24;j++){
 const angle=(s+(j+.5)/24)*Math.PI/6,r=108+(j%3)*8,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
 buildings.push({h:8+(j%4)*3,y0:0,p:[[x-1,z-1],[x+1,z-1],[x+1,z+1],[x-1,z+1]]});
}
buildings.push({h:1.2,pit:true,p:[[0,0],[1,0],[1,1],[0,1]]});
const source=JSON.stringify(buildings),S={gl,CL,gridS:0,toWorld:p=>p.slice(),pack:{mPerPt:6},architecture781Source:buildings};G.S=S;
const stats=G.installArchitecture781(S);assert.strictEqual(JSON.stringify(buildings),source);assert(stats.triangles<=150000);assert.strictEqual(stats.coverageSectors,12);assert.strictEqual(stats.fullEligibleCoverage,true);assert.strictEqual(stats.garageModules,0);assert.strictEqual(invalid,0);
assert(stats.creamFacadeBays>0);assert(stats.thinHandrailProfiles>0);
assert.strictEqual(stats.storeyRhythmM,3.1);assert.strictEqual(stats.shaderStoreyBands,true);assert.strictEqual(S.architecture781.floorStep,3.1/S.pack.mPerPt);
const architecture=stats;
const firstFacadeSum=S.architecture781.mesh.geometrySum,facadeAllocations=meshAllocations;
assert.strictEqual(G.installArchitecture781(S),stats);assert.strictEqual(meshAllocations,facadeAllocations);
G.disposeArchitecture781(S);assert.strictEqual(S.architecture781,null);
assert.strictEqual(JSON.stringify(G.installArchitecture781(S)),JSON.stringify(architecture));assert.strictEqual(S.architecture781.mesh.geometrySum,firstFacadeSum);
vm.runInContext(fs.readFileSync(dir+'vegetation792_src.js','utf8'),context);
const rows=[];let vertices=0,indices=0;
for(let s=0;s<12;s++)for(let j=0;j<130;j++){
 const angle=(s+(j+.5)/130)*Math.PI/6,x=Math.cos(angle)*112,z=Math.sin(angle)*112,near=j<95,palm=j%5===0,mid=true;
 const triangles=palm?(near?638:396):(near?352:288),nv=triangles*2;
 rows.push({x,z,r:1,h:1.7,y0:.06,lean:.05,tint:1,phase:j/7,near,mid,palm,v0:vertices,v1:vertices+nv,i0:indices,i1:indices+triangles*3});vertices+=nv;indices+=triangles*3;
}
const original={ni:indices,v:new Proxy({length:vertices*9},{get:(o,k)=>k==='length'?o.length:0}),i:{length:indices}},saved=JSON.stringify(rows);S.vegetation781Source=rows;S.dayTrees=original;S.trees=original;
const foliage=G.installVegetation781(S);assert.strictEqual(JSON.stringify(rows),saved);assert(foliage.addedTriangles<=80000);assert.strictEqual(foliage.refinedTrees,rows.length);assert.strictEqual(foliage.coverageSectors,12);assert.strictEqual(foliage.fullEligibleCoverage,true);assert.strictEqual(invalid,0);
assert(foliage.coniferProfiles>0);assert(foliage.palmFronds>0);assert(foliage.coniferProfiles<foliage.broadleaf);
const firstFoliageSum=S.vegetation781.mesh.geometrySum,foliageAllocations=meshAllocations;
assert.strictEqual(G.installVegetation781(S),foliage);assert.strictEqual(meshAllocations,foliageAllocations);
G.disposeVegetation781(S);assert.strictEqual(S.dayTrees,original);assert.strictEqual(S.trees,original);
assert.strictEqual(JSON.stringify(G.installVegetation781(S)),JSON.stringify(foliage));assert.strictEqual(S.vegetation781.mesh.geometrySum,firstFoliageSum);
G.disposeVegetation781(S);assert.strictEqual(S.dayTrees,original);assert.strictEqual(S.trees,original);
const result={author:'Andrew Fisher',passed:true,scope:'CPU full-lap fixture; no GPU or service calls',architecture,vegetation:foliage,sourceRowsUnchanged:true,finiteGeometry:invalid===0,originalFoliageRestored:S.dayTrees===original,deterministicReinstallation:true,idempotentInstallAllocatesNothing:true};
fs.writeFileSync(require('path').join(__dirname,'cpu_photo_geometry_checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
