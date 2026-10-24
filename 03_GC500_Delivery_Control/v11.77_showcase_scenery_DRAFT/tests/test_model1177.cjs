/* Author: Andrew Fisher. CPU geometry and preservation checks. */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const base=fs.readFileSync(process.env.BASE,'utf8'),page=fs.readFileSync(process.env.PAGE,'utf8'),out=[];
const check=(name,ok)=>{out.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name)};
function engine(html){const G={};const ctx=vm.createContext({window:{GC3D:G},Float32Array,Uint32Array,console});
 let src=html.slice(html.indexOf('G.PLANT={forklift:'),html.indexOf('G.syncRaceCarQuality=function(S){'));
 vm.runInContext('const G=window.GC3D;\n'+src,ctx);return G;}
const A=engine(base),B=engine(page),hash=a=>crypto.createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
for(const level of ['balanced','high']){
 const t=B.plantModel('fencing_truck',level);check(level+' cached model',t===B.plantModel('fencing_truck',level));
 check(level+' bounded model',t.stats.triangles<20000&&t.parts.length<=45);
 let valid=true,degenerate=0,winding=0;
 for(const p of t.parts){const v=p.vertices,ix=p.indices;valid&&=Array.from(v).every(Number.isFinite)&&v.length%8===0&&Array.from(ix).every(i=>i<v.length/8);
  for(let i=0;i<ix.length;i+=3){const q=Array.from(ix.slice(i,i+3),j=>Array.from(v.slice(j*8,j*8+6))),a=q[1].map((v,j)=>v-q[0][j]),b=q[2].map((v,j)=>v-q[0][j]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=Math.hypot(...n);if(len<1e-11)degenerate++;if(n.reduce((s,v,j)=>s+v*q.reduce((t,x)=>t+x[j+3],0),0)<-1e-8)winding++;}
 }
 check(level+' finite indexed mesh',valid);check(level+' non-degenerate outward faces',degenerate===0&&winding===0);
 const pivots=[...new Set(t.parts.filter(p=>p.wheel).map(p=>JSON.stringify(p.wheel)))];check(level+' six independently rotating wheels with correct radius',pivots.length===6&&pivots.every(x=>JSON.parse(x).r===.205));
 check(level+' illustrative truck envelope',t.bounds.min[0]>-1.8&&t.bounds.max[0]<1.5&&t.bounds.max[1]<1.3&&t.bounds.max[2]<.7);
 for(const kind of ['forklift','boom','scissor','tractor']){const a=A.plantModel(kind,level),b=B.plantModel(kind,level);check(level+' '+kind+' unchanged',JSON.stringify(a.stats)===JSON.stringify(b.stats)&&a.parts.every((p,i)=>hash(p.vertices)===hash(b.parts[i].vertices)&&hash(p.indices)===hash(b.parts[i].indices)));}
 console.log('MODEL',JSON.stringify(t.stats));
}
const scripts=h=>Array.from(h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]);
const b=scripts(base),p=scripts(page);check('no added script block',b.length===p.length);
const edited=b.map((s,i)=>s===p[i]?null:i).filter(i=>i!==null);console.log('Edited scripts',edited);
// Maps and graphics scheduling repairs are exact source-preservation checks.
for(const marker of ['ShowcaseStable1175','function gpuBusy1175','MapFind1176']){const i=b.findIndex(x=>x.includes(marker));if(i>=0)check(marker+' preserved',b[i]===p[i]);}
check('shared embedded data preserved',base.match(/const DATA = (.*);/)[1]===page.match(/const DATA = (.*);/)[1]);
check('eight garage choices and selector present',page.includes("['fencing_truck', 'Advanced Fencing', 'Fencing truck']")&&page.includes('<option value="fencing_truck">'));
if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2));
