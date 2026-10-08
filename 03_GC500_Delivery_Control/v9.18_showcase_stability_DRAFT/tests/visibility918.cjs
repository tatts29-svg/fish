// Author: Andrew Fisher. Camera visibility must preserve source triangles and crossing geometry.
const vm=require('vm'),fs=require('fs'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../showcase918_src.js'),'utf8');
let checks=0;function check(x,msg){assert(x,msg);checks++;}
for(const test of ['inside','outside','crossing','above','no-camera','dynamic']){
 let upload,draws=[];const gl={STATIC_DRAW:1,TRIANGLES:2,UNSIGNED_INT:3,ELEMENT_ARRAY_BUFFER:4,bindVertexArray(){},bindBuffer(){},bufferData(t,x){upload=Array.from(x)},drawElements(t,n,ty,offset){draws.push([n,offset])}};
 const xyz=test==='outside'?[[100,0,0],[101,0,0],[100,1,0]]:test==='crossing'?[[-100,0,0],[100,0,0],[0,.1,0]]:test==='above'?[[0,100,0],[.1,101,0],[0,100,.1]]:[[0,0,0],[.1,0,0],[0,.1,0]];
 const original=Array.from({length:12000},(_,i)=>i%3),v=xyz.flat(),mesh={gl,layout:[3],stride:3,v,i:original.slice(),ni:original.length,dynamic:test==='dynamic',vao:{},ib:{},draw(){gl.drawElements(2,this.ni,3,0)}};
 const S={crowdMesh:mesh,visibilityVP918:test==='no-camera'?null:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},G={S,render(){mesh.draw()},mount(){}};
 vm.runInNewContext(src,{window:{GC3D:G},document:{},Float32Array,Uint32Array,Map,Array,Infinity,Math});G.render();
 check(JSON.stringify(mesh.i)===JSON.stringify(original),'source index order retained');check(JSON.stringify(mesh.v)===JSON.stringify(v),'source vertices retained');
 check(draws.reduce((a,x)=>a+x[0],0)===(['outside','above'].includes(test)?0:12000),test+' conservative visibility');
 if(upload)check(upload.length===original.length&&upload.every((n,i)=>n===original[i]),'complete GPU topology retained');
}
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true}));
