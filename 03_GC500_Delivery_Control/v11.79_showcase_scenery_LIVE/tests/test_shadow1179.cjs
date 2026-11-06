/* Author: Andrew Fisher. Regress the sampled depth attachment after a low-cost frame. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const base=fs.readFileSync(process.env.BASE,'utf8'),page=fs.readFileSync(process.env.PAGE,'utf8');
const fn=h=>h.match(/G\.bindSunShadow=function\(S,program,on\)\{[\s\S]*?\n\};/)[0];
function run(html,shadow,on){
 const G={},attachment={},bindings={3:attachment},uniforms={};let active=0;
 const gl={TEXTURE0:0,TEXTURE3:3,TEXTURE_2D:2,activeTexture:n=>active=n,bindTexture:(type,t)=>bindings[active]=t,
 uniform1f:(u,v)=>uniforms[u]=v,uniform1i:(u,v)=>uniforms[u]=v,uniformMatrix4fv:()=>{},uniform2f:()=>{}};
 vm.runInNewContext(fn(html),{G});G.bindSunShadow({gl,sunShadow:shadow},{u:{uShadowOn:'enabled',uShadow:'sampler'}},on);
 return {feedback:bindings[uniforms.sampler]===attachment,bound:bindings[3],active,enabled:uniforms.enabled};
}
assert(run(base,null,true).feedback,'baseline reproduces an attached depth texture left on sampler 3');
for(const on of [true,false]){const r=run(page,null,on);assert(!r.feedback);assert.equal(r.bound,null);assert.equal(r.enabled,0);assert.equal(r.active,0);}
const shadow={tex:{},ok:true,size:1024,vp:[]};
for(const on of [true,false]){const r=run(page,shadow,on);assert(!r.feedback);assert.equal(r.bound,shadow.tex);assert.equal(r.enabled,on?1:0);assert.equal(r.active,0);}
console.log('PASS baseline feedback reproduced; first and subsequent shadow-free frames detach sampled depth; allocated shadows preserved');
