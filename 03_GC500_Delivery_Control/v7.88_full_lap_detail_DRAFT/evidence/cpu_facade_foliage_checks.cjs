/* Author: Andrew Fisher. Synthetic full-circuit geometry budget checks. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const dir=require('path').resolve(__dirname,'..')+'/';
let invalid=0;
class MeshBatch{
 constructor(gl,layout){this.layout=layout;this.v={length:0};this.i={length:0};this.nv=0;this.vb={};this.ib={};this.vao={};}
 vert(...p){if(p.some(x=>!Number.isFinite(x)))invalid++;this.v.length+=p.length;return this.nv++;}
 tri(){this.i.length+=3;}get ni(){return this.i.length;}upload(){}draw(){}
}
const gl=new Proxy({},{get:(o,p)=>p==='getShaderParameter'||p==='getProgramParameter'?()=>true:()=>({})});
const P=Array.from({length:120},(_,i)=>[100*Math.cos(i*Math.PI/60),100*Math.sin(i*Math.PI/60),2]);
let L=0;for(let i=0;i<P.length;i++)L+=Math.hypot(P[i][0]-P[(i+1)%P.length][0],P[i][1]-P[(i+1)%P.length][1]);
const CL={p:P,n:P.length,L,at(){throw Error('grid-centred selection must not return');}};
const G={MeshBatch,setBuildings(){},M_PER_PT:6,rng(){throw Error('RNG must be preserved');},area(P){return P.reduce((s,p,i)=>s+p[0]*P[(i+1)%P.length][1]-P[(i+1)%P.length][0]*p[1],0)/2;},V:{norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l);}}};
const context=vm.createContext({window:{GC3D:G},console});
vm.runInContext(fs.readFileSync(dir+'architecture788_src.js','utf8'),context);
const buildings=[];for(let s=0;s<12;s++)for(let j=0;j<24;j++){
 const angle=(s+(j+.5)/24)*Math.PI/6,r=108+(j%3)*8,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
 buildings.push({h:8+(j%4)*3,y0:0,p:[[x-1,z-1],[x+1,z-1],[x+1,z+1],[x-1,z+1]]});
}
buildings.push({h:1.2,pit:true,p:[[0,0],[1,0],[1,1],[0,1]]});
const source=JSON.stringify(buildings),S={gl,CL,gridS:0,toWorld:p=>p.slice(),pack:{mPerPt:6},architecture781Source:buildings};G.S=S;
const stats=G.installArchitecture781(S);assert.strictEqual(JSON.stringify(buildings),source);assert(stats.triangles<=150000);assert.strictEqual(stats.coverageSectors,12);assert.strictEqual(stats.fullEligibleCoverage,true);assert.strictEqual(stats.garageModules,0);assert.strictEqual(invalid,0);
console.log(JSON.stringify({architecture:stats},null,2));
vm.runInContext(fs.readFileSync(dir+'vegetation788_src.js','utf8'),context);
const rows=[];let vertices=0,indices=0;
for(let s=0;s<12;s++)for(let j=0;j<130;j++){
 const angle=(s+(j+.5)/130)*Math.PI/6,x=Math.cos(angle)*112,z=Math.sin(angle)*112,near=j<95,palm=j%5===0,mid=true;
 const triangles=palm?(near?638:396):(near?352:288),nv=triangles*2;
 rows.push({x,z,r:1,h:1.7,y0:.06,lean:.05,tint:1,phase:j/7,near,mid,palm,v0:vertices,v1:vertices+nv,i0:indices,i1:indices+triangles*3});vertices+=nv;indices+=triangles*3;
}
const original={ni:indices,v:new Proxy({length:vertices*9},{get:(o,k)=>k==='length'?o.length:0}),i:{length:indices}},saved=JSON.stringify(rows);S.vegetation781Source=rows;S.dayTrees=original;S.trees=original;
const foliage=G.installVegetation781(S);assert.strictEqual(JSON.stringify(rows),saved);assert(foliage.addedTriangles<=100000);assert.strictEqual(foliage.refinedTrees,rows.length);assert.strictEqual(foliage.coverageSectors,12);assert.strictEqual(foliage.fullEligibleCoverage,true);assert.strictEqual(invalid,0);
console.log(JSON.stringify({vegetation:foliage},null,2));G.disposeVegetation781(S);assert.strictEqual(S.dayTrees,original);assert.strictEqual(S.trees,original);console.log('PASS: full-lap synthetic CPU budget, distribution, finite vertices, immutable source, restore');
