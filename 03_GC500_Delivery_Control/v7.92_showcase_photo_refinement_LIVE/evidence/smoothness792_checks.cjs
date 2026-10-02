/* Author: Andrew Fisher. Rendering storage, quality and lifecycle checks without a service write. */
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const file=path.join(__dirname,'..','smoothness792_src.js'),source=fs.readFileSync(file,'utf8'),checks=[];
function fixture(options={}){
 const calls=[],buffers=new Map(),bindings=new Map(),listeners={};let caps=0,frameCalls=0,oldUploads=0;
 const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,DYNAMIC_DRAW:3,MAX_TEXTURE_SIZE:4,MAX_RENDERBUFFER_SIZE:5,
  getParameter(p){caps++;return p===4?8192:4096;},bindVertexArray(x){calls.push(['vao',x]);},
  bindBuffer(target,b){bindings.set(target,b);},bufferData(target,bytes){const b=bindings.get(target);buffers.set(b,new Uint8Array(bytes));calls.push(['allocate',target,bytes]);},
  bufferSubData(target,offset,array,start,count){assert(count>0);const b=buffers.get(bindings.get(target));assert(b,'storage must precede upload');const bytes=new Uint8Array(array.buffer,start*array.BYTES_PER_ELEMENT,count*array.BYTES_PER_ELEMENT);assert(offset+bytes.length<=b.length);b.set(bytes,offset);calls.push(['subdata',target,bytes.length]);}
 };
 class MeshBatch{constructor(dynamic){this.gl=gl;this.dynamic=dynamic;this.vao={};this.vb={};this.ib={};this.v=[];this.i=[];this.ni=0;}upload(){oldUploads++;}}
 const S={gl,o:{ss:1},quality:{name:'high'},bloom:true,last:1,sim:{s:55},cam:{eye:[1,2,3]},paused:false};
 const G={S,MeshBatch,frame(t){frameCalls++;if(options.frameThrows)throw Error('original frame failure');S.last=t;return 'frame';},stepDown(){const q=S.quality.name;
  if(q==='ultra')S.quality.name='high';else if(q!=='balanced'&&!S.reflOff){S.reflOff=true;S.quality.name='balanced';}
  else if(!S.shadowOff)S.shadowOff=true;else if(S.bloom)S.bloom=false;else S.unmounted=true;
  return 'original';},mount(){return 'mounted';}};
 const document={hidden:false,addEventListener(n,f){listeners[n]=f;}};
 vm.runInNewContext(source,{window:{GC3D:G},document,WeakMap,Map,Float32Array,Uint32Array,Number,Math});
 return {G,S,gl,document,listeners,calls,buffers,counts:()=>({caps,frameCalls,oldUploads})};
}
function test(name,f){f();checks.push({name,passed:true});}
test('context limits are queried once each, and reset after a context rebuild',()=>{const x=fixture();for(let n=0;n<200;n++){assert.equal(x.G.renderLimit792(x.gl,4),8192);assert.equal(x.G.renderLimit792(x.gl,5),4096);}assert.equal(x.counts().caps,2);x.G.resetRenderLimits792(x.gl);assert.equal(x.G.renderLimit792(x.gl,4),8192);assert.equal(x.counts().caps,3);});
test('static uploads retain their original implementation',()=>{const x=fixture(),m=new x.G.MeshBatch(false);m.upload();assert.equal(x.counts().oldUploads,1);assert.equal(x.calls.length,0);});
test('dynamic uploads retain exact GPU bytes and reuse all storage at steady size',()=>{const x=fixture(),m=new x.G.MeshBatch(true);m.v=[1,.25,-2,3];m.i=[0,1,2];m.upload();const va=m.storage792.v,ia=m.storage792.i;for(let n=0;n<300;n++){m.v[0]=n;m.upload();}assert.equal(m.storage792.v,va);assert.equal(m.storage792.i,ia);assert.equal(x.calls.filter(c=>c[0]==='allocate').length,2);assert.deepEqual(Array.from(new Float32Array(x.buffers.get(m.vb).buffer,0,4)),m.v);assert.deepEqual(Array.from(new Uint32Array(x.buffers.get(m.ib).buffer,0,3)),m.i);assert.equal(m.ni,3);});
test('growth allocates only when capacity is exceeded; shrink and empty draws retain safe counts',()=>{const x=fixture(),m=new x.G.MeshBatch(true);m.v=[1];m.i=[0];m.upload();m.v=Array.from({length:257},(_,i)=>i*.5);m.i=Array.from({length:130},(_,i)=>i);m.upload();assert.equal(m.storage792.v.length,512);assert.equal(m.storage792.i.length,256);assert.equal(x.calls.filter(c=>c[0]==='allocate').length,4);m.v=[9,8];m.i=[1,0];m.upload();assert.equal(m.ni,2);assert.deepEqual(Array.from(new Float32Array(x.buffers.get(m.vb).buffer,0,2)),[9,8]);m.v=[];m.i=[];m.upload();assert.equal(m.ni,0);assert.equal(x.calls.filter(c=>c[0]==='allocate').length,4);});
test('quality decreases pixels before sunlight or full detail and never climbs automatically',()=>{const x=fixture();x.S.quality.name='ultra';x.G.stepDown();assert.equal(x.S.quality.name,'high');x.G.stepDown();assert.equal(x.S.quality.name,'balanced');for(const ss of [.85,.70,.60]){x.G.stepDown();assert.equal(x.S.o.ss,ss);assert(!x.S.shadowOff);assert(x.S.bloom);}x.G.stepDown();assert(x.S.shadowOff);assert(x.S.bloom);x.G.stepDown();assert.equal(x.S.bloom,false);assert.equal(x.S.sim.s,55);assert.deepEqual(x.S.cam.eye,[1,2,3]);assert.equal(x.S.paused,false);});
test('automatic reductions target smoothness first, retaining a bounded fallback threshold',()=>{const x=fixture();x.S.fps=40;assert(x.G.shouldReduceQuality792(x.S));x.S.fps=50;assert(!x.G.shouldReduceQuality792(x.S));x.S.quality.name='balanced';x.S.o.ss=.60;x.S.fps=30;assert(!x.G.shouldReduceQuality792(x.S));x.S.fps=25;assert(x.G.shouldReduceQuality792(x.S));x.S.fps=0;assert(!x.G.shouldReduceQuality792(x.S));});
test('reinstalling the quality ladder is idempotent',()=>{const x=fixture(),before=x.G.stepDown;x.G.installSmoothLadder792();x.G.mount();assert.equal(x.G.stepDown,before);});
test('hidden and lost-context callbacks skip GL work; visible callbacks retain the original frame',()=>{const x=fixture(),sim=x.S.sim,cam=x.S.cam;x.document.hidden=true;x.G.frame(100);assert.equal(x.counts().frameCalls,0);assert.equal(x.S.last,null);x.document.hidden=false;x.S.lost=true;x.G.frame(200);assert.equal(x.counts().frameCalls,0);x.S.lost=false;assert.equal(x.G.frame(300),'frame');assert.equal(x.counts().frameCalls,1);assert.equal(x.S.sim,sim);assert.equal(x.S.cam,cam);});
test('visibility changes reset elapsed wall time without changing the user pause state',()=>{const x=fixture();x.S.paused=true;x.listeners.visibilitychange();assert.equal(x.S.last,null);assert.equal(x.S.paused,true);assert(x.S.needsRender);});
test('rendering exceptions remain visible to the caller',()=>{const x=fixture({frameThrows:true});assert.throws(()=>x.G.frame(1),/original frame failure/);assert.equal(x.counts().frameCalls,1);});
const result={author:'Andrew Fisher',scope:'CPU checks of storage reuse, quality policy and frame lifecycle; not a physical-device FPS benchmark',passed:checks.length,total:checks.length,checks};
fs.writeFileSync(path.join(__dirname,'smoothness792_checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
