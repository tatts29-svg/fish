/* Author: Andrew Fisher. Actual sample selection, allocation and target lifecycle.
 * node aa802_checks.cjs BASE_HTML CANDIDATE_HTML [OUTPUT_JSON]
 * CPU mocks verify capability/lifecycle contracts; GPU support and timing are separate.
 */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const [baseFile,pageFile,output]=process.argv.slice(2),base=fs.readFileSync(baseFile,'utf8'),page=fs.readFileSync(pageFile,'utf8');
const source=fs.readFileSync(path.join(__dirname,'../aa802_src.js'),'utf8'),checks=[],sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});assert(pass,name);};
const oldSelection=' const choices=Array.from(available).filter(n=>n<=wanted&&n>1&&Array.from(depthAvailable).includes(n));\n const samples=choices.length?Math.max(...choices):0;if(!samples)return;';
const newSelection=' const samples=G.selectSamples802(available,depthAvailable,wanted);if(!samples)return;';
ck('only the helper and exact sample selection changed',page.replace(source,'').replace(newSelection,oldSelection)===base);
const take=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const lifecycle=take(page,'G.addMSAA=function(gl,t,wanted){','G.sunDirection=');
const oldLifecycle=take(base,'G.addMSAA=function(gl,t,wanted){','G.sunDirection=');
ck('allocation, incomplete-target cleanup, disposal and resolve remain byte-identical',lifecycle.replace(newSelection,oldSelection)===oldLifecycle);
const chooser={G:{}};vm.runInNewContext(source,chooser);const choose=chooser.G.selectSamples802;
const subsets=Array.from({length:16},(_,bits)=>[0,1,2,4].filter((x,i)=>bits&(1<<i)));let combinations=0,changed=0;
for(const colour of subsets)for(const depth of subsets)for(const wanted of [0,1,2,4]){
 const shared=colour.filter(n=>n>1&&depth.includes(n)),old=Math.max(0,...shared.filter(n=>n<=wanted));
 const expected=old||(wanted===2&&shared.includes(4)?4:0),actual=choose(new Int32Array(colour),new Int32Array(depth),wanted);
 assert.equal(actual,expected);if(actual!==old){assert.equal(wanted,2);assert.equal(actual,4);assert(!shared.includes(2));changed++;}combinations++;
}
ck('all 1024 colour/depth/request combinations satisfy the bounded rule',combinations===1024,{combinations,changed});
ck('2x stays 2x when both support it',choose([4,2],[4,2],2)===2);
ck('4x fallback requires both actual attachment formats',choose([4],[2],2)===0&&choose([2],[4],2)===0&&choose([4],[4],2)===4);
ck('8x alone cannot satisfy the bounded 2x fallback',choose([8],[8],2)===0);
ck('ordinary 4x and higher requests keep the original maximum-at-or-below rule',choose([8,4,2],[8,4],4)===4&&choose([8,4],[8,4],8)===8);
ck('missing capability lists return no multisampling',choose(null,[4],2)===0&&choose([4],undefined,2)===0);
function fixture(colour,depth,hdr,incomplete=false){
 const live=new Map(),calls=[];let next=0;
 const gl={RENDERBUFFER:1,RGBA16F:2,RGBA8:3,DEPTH24_STENCIL8:4,SAMPLES:5,FRAMEBUFFER:6,COLOR_ATTACHMENT0:7,DEPTH_STENCIL_ATTACHMENT:8,
  FRAMEBUFFER_COMPLETE:9,READ_FRAMEBUFFER:10,DRAW_FRAMEBUFFER:11,COLOR_BUFFER_BIT:1<<4,DEPTH_BUFFER_BIT:1<<5,NEAREST:12};
 const make=kind=>{const q={id:++next,kind};live.set(q.id,q);calls.push(['create',kind,q.id]);return q;};
 const del=q=>{if(q){assert(live.has(q.id),'double or foreign free');live.delete(q.id);calls.push(['delete',q.kind,q.id]);}};
 Object.assign(gl,{getExtension(){return hdr?{}:null;},getInternalformatParameter(t,f,s){calls.push(['capability',f]);return new Int32Array(f===gl.DEPTH24_STENCIL8?depth:colour);},
  createFramebuffer:()=>make('framebuffer'),createRenderbuffer:()=>make('renderbuffer'),deleteFramebuffer:del,deleteRenderbuffer:del,deleteTexture:del,
  bindFramebuffer:(...a)=>calls.push(['bindFramebuffer',...a]),bindRenderbuffer:(...a)=>calls.push(['bindRenderbuffer',...a]),
  renderbufferStorageMultisample:(...a)=>calls.push(['storage',...a]),framebufferRenderbuffer:(...a)=>calls.push(['attach',...a]),
  checkFramebufferStatus:()=>incomplete?0:gl.FRAMEBUFFER_COMPLETE,blitFramebuffer:(...a)=>calls.push(['resolve',...a])});
 const G={freeTarget(g,t){if(t){g.deleteTexture(t.tex);g.deleteFramebuffer(t.fb);if(t.rb)g.deleteRenderbuffer(t.rb);if(t.depthTex)g.deleteTexture(t.depthTex);}}};
 vm.runInNewContext(source+lifecycle,{G});
 const target=()=>({w:1280,h:517,samples:1,fb:make('framebuffer'),tex:make('texture'),depthTex:make('texture')});
 return{G,gl,live,calls,target};
}
for(const hdr of [false,true]){
 const f=fixture([4],[4],hdr),t=f.target();f.G.addMSAA(f.gl,t,2);
 ck((hdr?'HDR':'RGBA8')+' chooses 4x for colour and matching depth',t.samples===4&&f.calls.filter(c=>c[0]==='storage').every(c=>c[2]===4)&&f.calls.filter(c=>c[0]==='storage').map(c=>c[3]).join()===((hdr?f.gl.RGBA16F:f.gl.RGBA8)+','+f.gl.DEPTH24_STENCIL8));
 ck((hdr?'HDR':'RGBA8')+' success allocates exactly the existing three MSAA objects',f.live.size===6);
 f.G.resolveMSAA(f.gl,t);const resolve=f.calls.find(c=>c[0]==='resolve');
 ck((hdr?'HDR':'RGBA8')+' resolves colour and depth with existing nearest blit',resolve&&resolve.at(-2)===(f.gl.COLOR_BUFFER_BIT|f.gl.DEPTH_BUFFER_BIT)&&resolve.at(-1)===f.gl.NEAREST);
 f.G.freeTarget(f.gl,t);ck((hdr?'HDR':'RGBA8')+' disposal releases all target and MSAA objects',f.live.size===0);
 const bad=fixture([4],[4],hdr,true),bt=bad.target();bad.G.addMSAA(bad.gl,bt,2);
 ck((hdr?'HDR':'RGBA8')+' incomplete allocation restores 1x and deletes all partial MSAA objects',bt.samples===1&&!bt.msfb&&!bt.mscol&&!bt.msdepth&&bad.live.size===3);
 bad.G.resolveMSAA(bad.gl,bt);ck((hdr?'HDR':'RGBA8')+' failed allocation never attempts resolve',!bad.calls.some(c=>c[0]==='resolve'));
 bad.G.freeTarget(bad.gl,bt);ck((hdr?'HDR':'RGBA8')+' failed-allocation teardown leaves no objects',bad.live.size===0);
}
for(const wanted of [0,1]){const f=fixture([4],[4],true),t=f.target();f.G.addMSAA(f.gl,t,wanted);ck(wanted+' requested keeps the original early no-allocation path',f.live.size===3&&f.calls.every(c=>c[0]!=='capability'));f.G.freeTarget(f.gl,t);}
{const f=fixture([4],[2],true),t=f.target();f.G.addMSAA(f.gl,t,2);ck('incompatible attachment capabilities allocate nothing',f.live.size===3&&!t.msfb);f.G.freeTarget(f.gl,t);}
{const f=fixture([4,2],[4,2],true);for(const wanted of [2,4,2,4,2]){const t=f.target();f.G.addMSAA(f.gl,t,wanted);assert.equal(t.samples,wanted);f.G.freeTarget(f.gl,t);assert.equal(f.live.size,0);}ck('successive quality target replacement leaks no framebuffer or renderbuffer',true);}
const budgets=[['captured desktop',1280,517],['captured phone',390,590],['Balanced 1.8M-pixel cap',1800000,1]].map(([name,w,h])=>({name,pixels:w*h,
 hdr4ExtraVsNoMSAABytes:w*h*4*12,hdr4ExtraVsIntended2Bytes:w*h*2*12,rgba8FourExtraVsNoMSAABytes:w*h*4*8,
 hdr4ExtraVsNoMSAAMiB:w*h*48/1048576}));
const result={author:'Andrew Fisher',baseline:{path:path.resolve(baseFile),sha256:sha(base)},candidate:{path:path.resolve(pageFile),sha256:sha(page)},sourceSha256:sha(source),checks,budgets,
 limits:['CPU mocked capability/allocation lifecycle; real GL validation remains required.','Counts are attachment storage estimates; driver allocation padding and real-device timing are not measured.','Incomplete-framebuffer failure path is preserved; no new exception or out-of-memory recovery mechanism is introduced.']};
if(output)fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,combinations,candidate:result.candidate.sha256,budgets}));
