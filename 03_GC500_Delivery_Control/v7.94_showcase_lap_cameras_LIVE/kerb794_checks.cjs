/* Author: Andrew Fisher. Actual-source CPU geometry; no browser, GPU or service.
 * node kerb794_checks.cjs [BASE_HTML] [OUTPUT_JSON]
 */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const base=process.argv[2]||path.join(__dirname,'../build/GC500_v7.92/GC500_Delivery_Control_hosted.html');
const html=fs.readFileSync(base,'utf8'),data=JSON.parse(html.match(/const DATA\s*=\s*(.*);/)[1]);
const take=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i);assert(i>=0&&j>i,'source fixture boundary '+a);return html.slice(i,j);};
class MeshBatch{
 constructor(){this.v=[];this.i=[];this.nv=0;this.ni=0;this.vb={};this.ib={};this.vao={};}
 vert(...a){assert(a.every(Number.isFinite),'finite vertex');this.v.push(...a);return this.nv++;}
 tri(...i){assert(i.every(v=>Number.isInteger(v)&&v>=0&&v<this.nv),'valid triangle indices');this.i.push(...i);this.ni+=3;}
 upload(){}draw(){}
}
const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getUniformLocation:()=>0},{get:(o,k)=>k in o?o[k]:()=>({})});
const G={M_PER_PT:5.937552372855356,MeshBatch},S={gl,tune:{deckH:.08}};G.S=S;
const context=vm.createContext({console,window:{GC3D:G},G,S,data,o:{ring:data.circuit.ring,roadWidth:data.circuit.roadWidth}});
vm.runInContext(take('const area=G.area=','/* ear clipping')+take(' /* key plan → world:',' /* speed from curvature')+take(' const hd=C.map',' /* corner speed')+'\nS.kap=kap;S.gridS=0;const H=S.tune.deckH;const gl=S.gl;'+take(' const kerb=S.kerb=',' /* Restrained non-emissive grid paint.'),context);
const paintStart=S.kerb.nv,paintFixture=[[0,.09,0,.62,.63,.64,.86,0,0],[1,.09,0,.61,.63,.64,.86,1,0],[1,.09,1,.62,.63,.64,.86,1,1],[0,.09,1,.62,.63,.64,.86,0,1]];
for(const v of paintFixture)S.kerb.vert(...v);S.kerb.tri(paintStart,paintStart+1,paintStart+2);S.kerb.tri(paintStart,paintStart+2,paintStart+3);
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const protectedData=()=>({outer:S.outer,inner:S.inner,cl:S.CL.p,cum:S.CL.cum,kap:S.kap,kerb:S.kerb.v,indices:S.kerb.i,stats:S.kerbStats});
const before=hash(protectedData()),source=fs.readFileSync(path.join(__dirname,'../v7.92_showcase_photo_refinement_LIVE/track_detail792_src.js'),'utf8'),fragment=fs.readFileSync(path.join(__dirname,'kerb794_src.js'),'utf8');
const start=source.indexOf(' /* The source\'s nominal kerb paint is several metres wide.'),end=source.indexOf('  // Original grid boxes, chequered start line, road-edge lines and rubber',start);
assert(start>=0&&end>start);
let corrected=source.slice(0,start)+' D.auditKerb794=true;D.kerbFaces794=[];\n'+fragment+source.slice(end);
corrected=corrected.replace('  for(const p of points)mesh.vert', '  if(D.auditKerb794)D.kerbFaces794.push({points:points.map(p=>p.slice()),normal:normal.slice()});\n  for(const p of points)mesh.vert');
// Record actual emitted kerb faces before subsequent wall/fence detail. This
// inspects output normals/winding rather than duplicating the join algorithm.
corrected=corrected.replace('  // Original grid boxes, chequered start line, road-edge lines and rubber','  D.auditKerb794=false;D.kerbVertexCount794=mesh.nv;D.kerbIndexCount794=mesh.ni;\n  // Original grid boxes, chequered start line, road-edge lines and rubber');
vm.runInContext(corrected,context);
const stats=G.installTrackDetail781(S),D=S.trackDetail781,edges=D.kerbEdges,checks=[];
function ck(name,pass,detail){checks.push({name,pass:!!pass,detail});assert(pass,name);}
const near=(a,b,tol=1e-10)=>a.length===b.length&&a.every((x,k)=>Math.abs(x-b[k])<tol),distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
ck('all source route, widths, kerbs, indices and curvature immutable',hash(protectedData())===before);
ck('each original selected quad represented once',edges.length===S.kerbStats.blocks*2&&new Set(edges.map(e=>e.sourceQuad)).size===edges.length);
let joined=0,ends=0,oldGapMaxM=0;
const byIndex=new Map(edges.map(e=>[e.sourceIndex+':'+e.side,e]));
for(const e of edges){
 const p=Array.from(S.kerb.v.slice(e.sourceQuad*36,e.sourceQuad*36+36));
 assert(near(e.sourceOuterStart,[p[9],p[10],p[11]])&&near(e.sourceOuterEnd,[p[18],p[19],p[20]]),'source provenance');
 for(const [outer,inner] of [[e.outerStart,e.innerStart],[e.outerEnd,e.innerEnd]])assert(Math.abs(distance(outer,inner)*G.M_PER_PT-.85)<1e-9,'established endpoint width');
 const expected=byIndex.get(((e.sourceIndex+2)%S.CL.p.length)+':'+e.side);
 assert.strictEqual(e.nextQuad,expected?expected.sourceQuad:null,'join only consecutive selected source spans');
 if(expected){
  joined++;assert(near(e.outerEnd,expected.outerStart)&&near(e.innerEnd,expected.innerStart),'identical shared cross-section');
  assert.strictEqual(expected.previousQuad,e.sourceQuad,'reciprocal adjacency');
  const sourceMid=e.sourceOuterEnd.map((v,k)=>(v+expected.sourceOuterStart[k])/2);
  assert(near(e.outerEnd,sourceMid),'join inside source lip envelope');
  oldGapMaxM=Math.max(oldGapMaxM,distance(e.sourceOuterEnd,expected.sourceOuterStart)*G.M_PER_PT);
 }else{ends++;assert(near(e.outerEnd,e.sourceOuterEnd),'real run end retained');}
 if(e.previousQuad===null){ends++;assert(near(e.outerStart,e.sourceOuterStart),'real run start retained');}
}
ck('all source adjacency joins share exact cross-sections',joined>0&&stats.kerbSharedJoins===joined,{joined,oldGapMaxM});
ck('curvature-rule gaps remain open and only run ends capped',ends===stats.kerbRunEnds&&ends>0,{ends});
ck('visual dimensions and stripe length retained',stats.kerbWidthM===.85&&stats.kerbHeightM===.07&&stats.kerbMaxStripeM<=1.000000001);
const vertices=D.mesh.v,indices=D.mesh.i,stride=12;let topTriangles=0,sideTriangles=0,minTopNormalY=1,degenerate=0;
for(let i=0;i<D.kerbIndexCount794;i+=3){
 const points=indices.slice(i,i+3).map(n=>vertices.slice(n*stride,n*stride+3));
 const normals=indices.slice(i,i+3).map(n=>vertices.slice(n*stride+3,n*stride+6));
 const a=points[1].map((v,k)=>v-points[0][k]),b=points[2].map((v,k)=>v-points[0][k]),cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 if(Math.hypot(...cross)<1e-14)degenerate++;
 assert(cross.reduce((sum,v,k)=>sum+v*normals[0][k],0)>0,'winding matches emitted normal');
 const bottom=H=>Math.abs(H-(S.tune.deckH+.001/G.M_PER_PT))<1e-10;
 const top=points.every(p=>!bottom(p[1]))&&Math.abs(normals[0][1])>1e-6;
 if(top){topTriangles++;minTopNormalY=Math.min(minTopNormalY,normals[0][1]);assert(normals.every(n=>n[1]>0),'upward top normal on both sides');}
 else sideTriangles++;
 assert(points.every(p=>p[1]>=S.tune.deckH+.001/G.M_PER_PT-1e-10&&p[1]<=S.tune.deckH+.07/G.M_PER_PT+1e-10),'height bounds');
}
ck('kerb faces finite, nondegenerate, upward on both road sides',degenerate===0&&topTriangles===stats.kerbPaintBlocks*6,{topTriangles,sideTriangles,minTopNormalY});
let cursor=0,exteriorSideFaces=0;
const dot=(a,b)=>a.reduce((sum,v,k)=>sum+v*b[k],0);
for(const e of edges){
 const pieces=Math.max(1,Math.ceil(distance(e.outerStart,e.outerEnd)*G.M_PER_PT)),
  inward=[e.innerStart[0]+e.innerEnd[0]-e.outerStart[0]-e.outerEnd[0],0,e.innerStart[2]+e.innerEnd[2]-e.outerStart[2]-e.outerEnd[2]],
  along=[e.outerEnd[0]-e.outerStart[0],0,e.outerEnd[2]-e.outerStart[2]];
 for(let j=0;j<pieces;j++){
  cursor+=3;
  assert(dot(D.kerbFaces794[cursor++].normal,inward)>0,'inner side normal faces road');
  assert(dot(D.kerbFaces794[cursor++].normal,inward)<0,'outer side normal faces away from road');exteriorSideFaces+=2;
  if(j===0&&e.previousQuad===null){assert(dot(D.kerbFaces794[cursor++].normal,along)<0,'start cap exterior');exteriorSideFaces++;}
  if(j===pieces-1&&e.nextQuad===null){assert(dot(D.kerbFaces794[cursor++].normal,along)>0,'end cap exterior');exteriorSideFaces++;}
 }
}
ck('both side walls and genuine end caps face their exterior',cursor===D.kerbFaces794.length,{exteriorSideFaces});
ck('shared span ends add no hidden cap faces',D.kerbIndexCount794/3===stats.kerbPaintBlocks*10+stats.kerbRunEnds*4);
ck('post-kerb road paint vertices and triangle order exact',hash(D.paint.v)===hash(paintFixture.flat())&&hash(D.paint.i)===hash([0,1,2,0,2,3]));
ck('whole detail mesh remains within established triangle budget',stats.triangles<70000,{triangles:stats.triangles,kerbTriangles:D.kerbIndexCount794/3});
ck('no yellow paint, new islands, source or driving writes',!fragment.includes('[1,1,0')&&stats.sourceTrackChanged===false&&stats.sourceKerbChanged===false&&stats.drivingChanged===false);
const first=hash({v:D.mesh.v,i:D.mesh.i});ck('second install reuses detail',G.installTrackDetail781(S)===stats);
G.disposeTrackDetail781(S);G.installTrackDetail781(S);ck('deterministic rebuild and immutable source',hash({v:S.trackDetail781.mesh.v,i:S.trackDetail781.mesh.i})===first&&hash(protectedData())===before);
const result={author:'Andrew Fisher',passed:true,scope:'Actual source geometry CPU checks; rendering requires parent browser review',sourceSha256:hash(fragment),checks,stats:{sourceQuads:edges.length,sharedJoins:joined,runEnds:ends,oldGapMaxM,triangles:stats.triangles,kerbTriangles:D.kerbIndexCount794/3}};
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
