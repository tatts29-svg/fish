/* Author: Andrew Fisher. Narrow shader failure-injection and derivative-order checks. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sourcePath=path.join(__dirname,'../track_detail792_src.js'),source=fs.readFileSync(sourcePath,'utf8');
const end=source.lastIndexOf('})();');assert.ok(end>0);
const context={window:{GC3D:{}}};vm.createContext(context);
vm.runInContext(source.slice(0,end)+'globalThis.review792={program,FS};\n'+source.slice(end),context);
const {program,FS}=context.review792,checks=[];
function check(name,test){test();checks.push({name,passed:true});}
function mock(fail){
 let serial=0;
 const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  shaders:[],programs:[],deletedShaders:[],deletedPrograms:[],sources:[],attached:[],
  createShader(type){if(fail==='vertex allocation'&&type===1||fail==='fragment allocation'&&type===2)return null;const s={id:++serial,type};this.shaders.push(s);return s;},
  shaderSource(s,text){this.sources.push({s,text});},compileShader(){},
  getShaderParameter(s){return !(fail==='vertex compilation'&&s.type===1||fail==='fragment compilation'&&s.type===2);},
  getShaderInfoLog(){return 'injected compile failure';},
  deleteShader(s){assert.ok(this.shaders.includes(s),'Only allocated shaders are deleted');assert.ok(!this.deletedShaders.includes(s),'Each shader is deleted once');this.deletedShaders.push(s);},
  createProgram(){if(fail==='program allocation')return null;const p={id:++serial};this.programs.push(p);return p;},
  attachShader(p,s){this.attached.push({p,s});},linkProgram(){},getProgramParameter(){return fail!=='link';},getProgramInfoLog(){return 'injected link failure';},
  getUniformLocation(p,name){return {p,name};},
  deleteProgram(p){assert.ok(this.programs.includes(p),'Only allocated programs are deleted');assert.ok(!this.deletedPrograms.includes(p),'Each program is deleted once');this.deletedPrograms.push(p);}};
 return gl;
}
for(const failure of ['vertex allocation','fragment allocation','vertex compilation','fragment compilation','program allocation','link']){
 check(failure+' failure releases every allocated shader and partial program',()=>{
  const gl=mock(failure);assert.throws(()=>program(gl),/Track preview/);
  assert.equal(gl.deletedShaders.length,gl.shaders.length);
  assert.equal(gl.deletedPrograms.length,gl.programs.length);
  if(failure==='fragment compilation')assert.equal(gl.shaders.length,2);
  if(failure==='link'){assert.equal(gl.shaders.length,2);assert.equal(gl.programs.length,1);}
 });
}
check('Successful link releases shaders and transfers exactly one live program to the renderer',()=>{
 const gl=mock(),result=program(gl);assert.equal(gl.shaders.length,2);assert.equal(gl.deletedShaders.length,2);
 assert.equal(gl.programs.length,1);assert.equal(gl.deletedPrograms.length,0);assert.equal(result.p,gl.programs[0]);assert.equal(Object.keys(result.u).length,12);
});
check('Surface derivatives run before the first alpha discard',()=>{
 const discard=FS.indexOf('discard;');assert.ok(discard>0);
 for(const token of ['dFdx(surfacePoint)','dFdy(surfacePoint)']){const i=FS.indexOf(token);assert.ok(i>=0&&i<discard,token+' must precede divergent discard');}
 assert.equal(FS.slice(discard).includes('dFdx('),false);assert.equal(FS.slice(discard).includes('dFdy('),false);
});
check('Alpha masking retains premultiplied output for the established blend mode',()=>{
 assert.match(FS,/if\(atlasSample\.a<\.006\)discard;/);
 assert.match(FS,/float alpha=fog\*atlasSample\.a;outColour=vec4\(light\*alpha,alpha\);/);
});
const report={author:'Andrew Fisher',source:path.basename(sourcePath),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),passed:checks.length,checks};
console.log(JSON.stringify(report,null,2));
