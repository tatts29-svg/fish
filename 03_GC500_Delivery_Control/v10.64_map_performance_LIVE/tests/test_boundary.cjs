/* Author: Andrew Fisher. Verify the actual patched label-fit function preserves every tested point and result. */
'use strict';
const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
const [base,candidate]=process.argv.slice(2);
function source(p){const s=fs.readFileSync(p,'utf8');const a=s.indexOf('const labFits =');assert(a>=0);const b=s.indexOf(';    /* its whole outline',a);assert(b>a);return s.slice(a,b)+'; labFits';}
const old=source(base), next=source(candidate);assert.notEqual(old,next);
let seed=1064, cases=0;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
function run(code,dpr,args,reject){const points=[];const fn=vm.runInNewContext(code,{dpr,Math,at:(x,y)=>[x,y],inGroup:p=>{points.push(p);return points.length!==reject;}});const ok=fn(...args);return{points:points.map(p=>Array.from(p)),ok};}
for(const dpr of [1,1.25,1.5,2,2.625,3])for(let i=0;i<60;i++){
 const args=[rand()*100-50,rand()*100-50,rand()*300,rand()*150];
 const a=run(old,dpr,args,-1),b=run(next,dpr,args,-1);assert.deepEqual(b,a);cases++;
 for(const reject of [1,Math.ceil(a.points.length/2),a.points.length]){assert.deepEqual(run(next,dpr,args,reject),run(old,dpr,args,reject));cases++;}
}
console.log(`PASS ${cases} exact label sample/result comparisons across six pixel densities`);
