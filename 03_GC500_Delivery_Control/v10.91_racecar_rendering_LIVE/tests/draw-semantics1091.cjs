// Author: Andrew Fisher. Independent native draw review.
/* Independent read-only review. Exact native draw functions, mocked WebGL calls.
 * Usage: node draw-semantics1091.cjs CANDIDATE_HTML [RESULT_JSON]
 * No browser, GPU, network or live record access.
 */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto');
const [pageFile,out]=process.argv.slice(2);
assert(pageFile,'Supply the reviewed candidate HTML');
const src=fs.readFileSync(pageFile,'utf8');
function take(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert(i>=0&&j>i);return src.slice(i,j);}
const G={};const window={GC3D:G};
Function('window',take('/* Author: Andrew Fisher. v8.00 — surfaced race coupe.','/* GC3D — bounded, simplified facade reflections'))(window);
Function('window',take('/* GC500 v1.7 — explicitly typeset livery,','/* Author: Andrew Fisher. v8.00 — surfaced race coupe.'))(window);
Function('G',take('G.compactRaceCarParts1091=function(parts){','G.syncRaceCarQuality=function(S){'))(G);
const layer=p=>p.material==='decal'||p.material==='ledAmber'?2:p.material==='glass'||p.name.includes('spokes')?1:0;
const materialSource=take('const materials={paint:','function releaseParts(gl,parts){');
const materials=Function(materialSource+';return materials;')();
const surfaces={paint:1,plant:2,plantBlack:2,plantWhite:2,rubber:3,alloy:4,steel:4,carbon:5,grille:5,glass:6};
G.matMul=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;};G.smooth=t=>t*t*(3-2*t);G.syncRaceCarQuality=()=>{};
Function('G','materials','vehicleSurfaces800','vehicleLayer800',take('G.raceCarMatrix=function(){','})();\n/* GC3D part 4'))(G,materials,surfaces,layer);
let uniforms={},blend=false,depth=true,draws=[];
const gl=new Proxy({uniformMatrix4fv:(k,t,v)=>uniforms[k]=Array.from(v),uniform3fv:(k,v)=>uniforms[k]=Array.from(v),uniform1f:(k,v)=>uniforms[k]=v,uniform1i:(k,v)=>uniforms[k]=v,uniform2f:(k,a,b)=>uniforms[k]=[a,b],enable:k=>{if(k==='BLEND')blend=true;},disable:k=>{if(k==='BLEND')blend=false;},depthMask:v=>depth=v,blendFuncSeparate:(...v)=>uniforms.blendFunc=v,blendEquation:v=>uniforms.blendEquation=v}, {get:(o,k)=>k in o?o[k]:['BLEND','DEPTH_TEST','CULL_FACE','TEXTURE0','TEXTURE_2D','FUNC_ADD','ONE','ONE_MINUS_SRC_ALPHA'].includes(k)?k:()=>{}});
const u=new Proxy({},{get:(o,k)=>k});
const S=G.S={raceCarEnabled:true,gl,raceProgram:{p:{},u},quality:{name:'balanced'},vehicle:'car',tune:{carS:1.7,vmax:50},sim:{pitch:.08,roll:-.12,steer:.31,wheel:2.45,wheelR:4.7,v:10,brake:.3},pose:{pos:[12,1,8],fwd:[Math.cos(.7),0,Math.sin(.7)],rt:[-Math.sin(.7),0,Math.cos(.7)]},cam:{eye:[0,10,4]},look:{day:.8},clock:3,towVms:false};
const snapshot=parts=>{draws=[];uniforms={};S.raceCarParts=parts.map(p=>({...p,batch:{draw(){draws.push({names:p.sourceParts1091||[p.name],model:uniforms.uModel,panel:uniforms.uPanel,opacity:uniforms.uOpacity,color:uniforms.uColor,rough:uniforms.uRough,metal:uniforms.uMetal,kind:uniforms.uKind,surface:uniforms.uSurface800,blend,depth});}}}));G.drawRaceCar(S,new Float32Array(16),[100,300]);return draws;};
const results=[];
for(const q of ['balanced','high'])for(const velocity of [0,10,49]){
 S.sim.v=velocity;const model=G.raceCarModel(q),original=model.parts.slice().sort((a,b)=>(a.material==='glass')-(b.material==='glass')).concat(G.raceCarDecals()),compact=G.compactRaceCarParts1091(original),before=snapshot(original),after=snapshot(compact),by=new Map(before.map(d=>[d.names[0],d]));
 for(const d of after)for(const name of d.names){const orig=by.get(name);assert(orig,name+' original drawn');assert.deepEqual({...d,names:null},{...orig,names:null},name+' native transform/uniforms/blend/depth');}
 assert.equal(after.flatMap(d=>d.names).length,before.length);
 for(const l of [1,2]){const accepted=new Set(original.filter(p=>layer(p)===l).map(p=>p.name));assert.deepEqual(after.flatMap(d=>d.names).filter(n=>accepted.has(n)),before.flatMap(d=>d.names).filter(n=>accepted.has(n)));}
 results.push({quality:q,velocity,partsBefore:before.length,partsAfter:after.length,worldModelMatricesAndDrawUniformsExact:true});
}
const result={scope:'Exact native G.raceCarMatrix and G.drawRaceCar with CPU instrumented WebGL calls; no browser or GPU',inputHtml:pageFile,pageSha256:crypto.createHash('sha256').update(src).digest('hex'),testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),pass:true,states:results};
if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
