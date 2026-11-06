/* Author: Andrew Fisher. CPU fault-injection checks; no browser or service access. */
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','full_lap788_src.js'),'utf8');
const checks=[];
function fixture(options={}){
 const counts={installs:0,disposals:0,draws:0,originalDraws:0,enhancedDraws:0,unmounts:0},live=new Set();
 const originalTrees={},state={sim:{s:147.25,speed:18},cam:{eye:[4,5,6],tgt:[7,8,9]},view:'chase',paused:true,calmDrive:false};
 const S={gl:{},bloom:true,look:{day:true},architecture781Source:[],vegetation781Source:[],dayTrees:originalTrees,trees:originalTrees,...state};
 const flags={failInstall:null,failRender:false,failOriginal:false,failComposite:false};
 const resource=type=>{const r={type};live.add(r);return r};
 const dispose=(s,key)=>{const r=s&&s[key];if(!r)return;assert(live.has(r),'double disposal');live.delete(r);s[key]=null;counts.disposals++};
 const G={S,
  init(){return true},
  render(){counts.draws++;if(S.detail781Enabled){counts.enhancedDraws++;if(!S.sky781)S.sky781=resource('sky');if(flags.failRender)throw Error('forced enhanced draw failure');if(flags.failComposite){flags.failComposite=false;S.bloom=false;}}
   else{counts.originalDraws++;if(flags.failOriginal)throw Error('forced original draw failure');}return 'original renderer result';},
  graphicsReport(){return {quality:'high'}},
  installTrackDetail781(s){counts.installs++;s.trackDetail781=resource('track');if(flags.failInstall==='track')throw Error('forced track install');},
  installArchitecture781(s){counts.installs++;s.architecture781=resource('architecture');if(flags.failInstall==='architecture')throw Error('forced architecture install');},
  installVegetation781(s){counts.installs++;s.vegetation781=resource('vegetation');s.dayTrees=s.trees=s.vegetation781;if(flags.failInstall==='vegetation')throw Error('forced vegetation install');},
  disposeTrackDetail781(s){dispose(s,'trackDetail781');s.detail781Enabled=false},
  disposeArchitecture781(s){dispose(s,'architecture781')},
  disposeVegetation781(s){dispose(s,'vegetation781');s.dayTrees=s.trees=originalTrees},
  disposeSky781(s){dispose(s,'sky781')}
 };
 if(options.mount!==false)G.mount=function(){S.unmount=function(){counts.unmounts++;assert.strictEqual(live.size,0,'enhancements must be disposed before original unmount');return 'unmounted'};return 'mounted'};
 vm.runInNewContext(source,{window:{GC3D:G}});
 const stable=()=>{assert.strictEqual(S.sim,state.sim);assert.deepStrictEqual(S.sim,{s:147.25,speed:18});assert.strictEqual(S.cam,state.cam);assert.strictEqual(S.view,'chase');assert.strictEqual(S.paused,true);assert.strictEqual(S.calmDrive,false)};
 return {G,S,counts,flags,live,originalTrees,stable};
}
function test(name,fn){fn();checks.push({name,passed:true});}
test('normal render installs once and retains original renderer',()=>{const c=fixture();assert.strictEqual(c.G.render(),'original renderer result');c.G.render();assert.strictEqual(c.counts.installs,3);assert.strictEqual(c.counts.draws,2);assert.strictEqual(c.live.size,4);c.stable();});
for(const stage of ['track','architecture','vegetation'])test(stage+' partial install failure disposes and renders original',()=>{const c=fixture();c.flags.failInstall=stage;c.G.render();assert.strictEqual(c.counts.originalDraws,1);assert.strictEqual(c.live.size,0);assert.strictEqual(c.S.dayTrees,c.originalTrees);assert.strictEqual(c.S.trees,c.originalTrees);assert.strictEqual(c.S.detail781Enabled,false);assert(c.S.fullLapFailed788);c.stable();});
test('installation failure is sticky without automatic retry',()=>{const c=fixture();c.flags.failInstall='architecture';c.G.render();const attempts=c.counts.installs;for(let i=0;i<4;i++)c.G.render();assert.strictEqual(c.counts.installs,attempts);assert.strictEqual(c.counts.originalDraws,5);assert.strictEqual(c.G.fullLapReport788().limitedByDevice,true);c.stable();});
test('explicit enable retries successfully after a fault',()=>{const c=fixture();c.flags.failInstall='vegetation';c.G.render();c.flags.failInstall=null;assert.strictEqual(c.G.enableFullLap788(true),true);c.G.render();assert.strictEqual(c.G.fullLapReport788().limitedByDevice,false);assert.strictEqual(c.G.fullLapReport788().detailError,null);assert.strictEqual(c.live.size,4);c.stable();});
test('bloom disabled before frame restores exact original foliage resources',()=>{const c=fixture();c.G.render();c.S.bloom=false;c.G.render();assert.strictEqual(c.live.size,0);assert.strictEqual(c.S.dayTrees,c.originalTrees);assert.strictEqual(c.S.detail781Enabled,false);assert.strictEqual(c.counts.originalDraws,1);assert.strictEqual(c.G.fullLapReport788().limitedByDevice,true);c.stable();});
test('bloom disabled scene does not reinstall on every frame',()=>{const c=fixture();c.S.bloom=false;for(let i=0;i<4;i++)c.G.render();assert.strictEqual(c.counts.installs,0);assert.strictEqual(c.counts.originalDraws,4);c.stable();});
test('deliberate quality restoration reinstalls without altering drive or camera',()=>{const c=fixture();c.G.render();c.S.bloom=false;c.G.render();c.S.bloom=true;c.G.render();assert.strictEqual(c.counts.installs,6);assert.strictEqual(c.live.size,4);assert.strictEqual(c.G.fullLapReport788().limitedByDevice,false);c.stable();});
test('composite allocation failure during render redraws original exactly once',()=>{const c=fixture();c.flags.failComposite=true;c.G.render();assert.strictEqual(c.counts.draws,2);assert.strictEqual(c.counts.enhancedDraws,1);assert.strictEqual(c.counts.originalDraws,1);assert.strictEqual(c.live.size,0);assert.strictEqual(c.S.dayTrees,c.originalTrees);c.G.render();assert.strictEqual(c.counts.draws,3);assert.strictEqual(c.counts.installs,3);c.stable();});
test('enhanced draw error falls back once and is not retried every frame',()=>{const c=fixture();c.flags.failRender=true;c.G.render();assert.strictEqual(c.counts.draws,2);assert.strictEqual(c.counts.originalDraws,1);assert.strictEqual(c.live.size,0);const attempts=c.counts.installs;c.G.render();assert.strictEqual(c.counts.installs,attempts);assert.strictEqual(c.counts.originalDraws,2);assert(c.S.fullLapFailed788.includes('forced enhanced draw failure'));c.stable();});
test('original renderer errors are not silently swallowed',()=>{const c=fixture();c.G.enableFullLap788(false);c.flags.failOriginal=true;assert.throws(()=>c.G.render(),/forced original draw failure/);assert.strictEqual(c.counts.draws,1);});
test('explicit detail off releases resources and remains off',()=>{const c=fixture();c.G.render();assert.strictEqual(c.G.enableFullLap788(false),false);assert.strictEqual(c.live.size,0);const attempts=c.counts.installs;c.G.render();assert.strictEqual(c.counts.installs,attempts);assert.strictEqual(c.counts.originalDraws,1);c.stable();});
test('unmount disposes additions before the original lifecycle',()=>{const c=fixture();assert.strictEqual(c.G.mount(),'mounted');c.G.render();assert.strictEqual(c.S.unmount(),'unmounted');assert.strictEqual(c.counts.unmounts,1);assert.strictEqual(c.live.size,0);c.stable();});
test('offline renderer without mount remains supported',()=>{const c=fixture({mount:false});assert.strictEqual(c.G.mount,undefined);c.G.init();c.G.render();assert.strictEqual(c.counts.draws,1);c.stable();});
test('context lost scene does not allocate optional resources',()=>{const c=fixture();c.S.lost=true;c.G.render();assert.strictEqual(c.counts.installs,0);assert.strictEqual(c.live.size,0);c.stable();});
const output={author:'Andrew Fisher',scope:'CPU lifecycle fault injection; no GPU or service calls',passed:checks.length,total:checks.length,checks};
fs.writeFileSync(path.join(__dirname,'cpu_lifecycle_checks.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
