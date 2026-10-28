/* Author: Andrew Fisher. Synthetic lifecycle scenarios; no operational data, browser or network. */
'use strict';
const assert=require('node:assert/strict');
const {createBuildPreviewLifecycle1247:create}=require('../build_preview_lifecycle1247');
let assertions=0;const check=(value,message)=>{assert(value,message);assertions++;};
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function harness(config={}){
 let enabled=true,time=0;const draws=[],cleared=[],shown=[],errors=[];
 const target=(id,position=1)=>({id,position,connected:true,inView:true,url:null,eligible:true,state:'idle'});
 const manager=create({cacheLimit:config.cacheLimit||3,imageLimit:config.imageLimit||3,active:()=>enabled,connected:t=>t.connected,inView:t=>t.inView,now:()=>time,
  describe:t=>t.position===null?{eligible:false,reason:'No coordinate'}:{key:t.id+'|'+t.position,eligible:t.eligible,position:t.position,reason:'Offsite'},
  draw:description=>new Promise((resolve,reject)=>draws.push({description,resolve,reject})),
  present(t,url){check(t.connected&&t.inView&&enabled,'Only currently visible connected targets may receive images');t.url=url;t.state='ready';shown.push({id:t.id,url});},
  clear(t){if(t.url)cleared.push(t.url);t.url=null;t.state='waiting';},waiting(t){t.state='queued';},unavailable(t,reason){t.url=null;t.state='unavailable';errors.push({id:t.id,reason});}
 });
 return {manager,target,draws,cleared,shown,errors,setActive:v=>{enabled=v;manager.refresh();},advance:n=>{time+=n;},enter:ts=>manager.visibility(ts.map(t=>[t,true])),leave:ts=>manager.visibility(ts.map(t=>[t,false]))};
}
(async()=>{
 // Leave before dequeue, and prune queued work while a different draw is in flight.
 {
  const h=harness(),a=h.target('a'),b=h.target('b');h.manager.track([a,b]);h.enter([a]);h.leave([a]);await tick();check(h.draws.length===0,'Leave before microtask must prevent drawing');check(a.state==='waiting','Dropped queue returns to waiting');
  h.enter([a,b]);await tick();check(h.draws.length===1,'Single first draw');h.leave([b]);check(h.manager.stats().queued===0,'Offscreen queued target pruned');h.draws[0].resolve('url-a');await tick();check(h.draws.length===1,'Pruned target never starts');check(a.url==='url-a','Current target receives image');
 }
 // Geometry recheck rejects lagging positive IntersectionObserver state.
 {
  const h=harness(),a=h.target('a'),b=h.target('b');h.manager.track([a,b]);h.enter([a,b]);await tick();b.inView=false;h.draws[0].resolve('url-a');await tick();check(h.draws.length===1,'Actual geometry wins over stale near state');check(b.url===null,'Offscreen stale intersection never receives an image');
 }
 // Depart during picture/decoder work: no stale attachment, then reentry draws once.
 {
  const h=harness(),a=h.target('a');h.manager.track([a]);h.enter([a]);await tick();h.leave([a]);h.draws[0].resolve('late-a');await tick();check(a.url===null,'Leaving in flight rejects result');check(h.manager.stats().cached===0,'Offscreen completion not cached');
  h.enter([a]);await tick();check(h.draws.length===2,'Reentry after discarded result starts one draw');h.draws[1].resolve('new-a');await tick();h.leave([a]);check(a.url===null&&h.cleared.includes('new-a'),'Offscreen image loses its decoded source');h.enter([a]);await tick();check(a.url==='new-a'&&h.draws.length===2,'Reentry restores retained cache without drawing');
 }
 // Many fast-scroll targets, repeated events, exact image/cache budgets and redraw after eviction.
 {
  const h=harness({cacheLimit:3,imageLimit:2}),items=Array.from({length:25},(_,i)=>h.target('item'+i));h.manager.track(items);
  for(const item of items){h.leave(items);h.enter([item]);h.enter([item]);await tick();const job=h.draws.at(-1);job.resolve('url-'+item.id);await tick();check(h.manager.stats().attached<=2&&h.manager.stats().cached<=3,'Image and compressed cache budgets hold throughout scroll');check(items.filter(t=>t.url).length<=2,'Decoded DOM attachments remain bounded');}
  check(h.manager.stats().peakActive===1,'Repeated events never overlap drawing/decoding');check(h.draws.length===25,'Each new visible target draws once');
  h.leave(items);h.enter([items[0]]);await tick();check(h.draws.length===26,'Reentry after cache eviction redraws once');h.draws.at(-1).resolve('url-reentry');await tick();check(items[0].url==='url-reentry','Evicted target recovers');
 }
 // A tall viewport cannot exceed the decoded-image budget; newly admitted target proceeds.
 {
  const h=harness({imageLimit:2}),items=[h.target('a'),h.target('b'),h.target('c')];h.manager.track(items);h.enter(items);await tick();h.draws[0].resolve('a');await tick();h.draws[1].resolve('b');await tick();check(h.draws.length===2&&h.manager.stats().attached===2,'Admission caps simultaneously decoded images');h.leave([items[0]]);await tick();check(h.draws.length===3&&items[0].url===null,'Leaving frees a decoded-image slot');h.draws[2].resolve('c');await tick();check(items[2].url==='c','Next visible target enters freed slot');
 }
 // A smaller compressed cache does not redraw still-displayed decoded images.
 {
  const h=harness({cacheLimit:1,imageLimit:3}),items=[h.target('a'),h.target('b'),h.target('c')];h.manager.track(items);h.enter(items);
  for(let i=0;i<3;i++){await tick();h.draws[i].resolve('url-'+i);}await tick();for(let i=0;i<5;i++)h.manager.refresh();await tick();
  check(h.draws.length===3&&h.manager.stats().attached===3&&h.manager.stats().cached===1,'Attached valid images stay satisfied independently of compressed-cache eviction');
 }
 // Pane or document hiding pauses queue, drops displayed images and rejects late result.
 {
  const h=harness(),a=h.target('a'),b=h.target('b');h.manager.track([a,b]);h.enter([a,b]);await tick();h.draws[0].resolve('a');await tick();h.setActive(false);check(a.url===null&&h.manager.stats().queued===0,'Inactive pane releases images and queue');h.draws[1].resolve('late-b');await tick();check(b.url===null,'Inactive completion is discarded');h.setActive(true);await tick();check(a.url==='a'&&h.draws.length===3,'Returning restores cached image and resumes missing one');h.draws[2].resolve('b');await tick();
 }
 // Replacement DOM identity and coordinate changes reject both success and failure races.
 {
  const h=harness(),old=h.target('same'),replacement=h.target('same');h.manager.track([old]);h.enter([old]);await tick();old.connected=false;h.manager.track([replacement]);h.enter([replacement]);h.draws[0].resolve('old-dom');await tick();check(replacement.url===null&&h.draws.length===2,'Old DOM completion cannot populate replacement');h.draws[1].resolve('replacement');await tick();
  replacement.position=2;h.manager.refresh();await tick();check(replacement.url===null&&h.draws.length===3,'Changed coordinates evict stale cached image');replacement.position=3;h.manager.refresh();h.draws[2].reject(new Error('stale failure'));await tick();check(h.errors.length===0&&h.draws.length===4,'Stale coordinate failure is ignored and newest location queued');h.draws[3].resolve('new-place');await tick();check(replacement.url==='new-place','Newest position alone is attached');check(h.manager.stats().peakActive===1,'Coordinate race preserves single draw');
 }
 // Coordinate change before dequeue, missing/offsite coordinates and failure retry controls.
 {
  const h=harness(),a=h.target('a'),b=h.target('b');h.manager.track([a,b]);h.enter([a,b]);await tick();b.position=2;h.draws[0].resolve('a');await tick();check(h.draws[1].description.position===2,'Queued coordinate is read again before drawing');h.draws[1].reject(new Error('decode'));await tick();check(b.state==='unavailable'&&h.manager.stats().active===0,'Decode failure gives explicit fallback and releases draw slot');
  for(let i=0;i<10;i++)h.manager.refresh();await tick();check(h.draws.length===2,'Failure does not create an automatic retry loop');h.leave([b]);h.enter([b]);await tick();check(h.draws.length===3,'Reentry permits one fresh attempt');h.draws[2].resolve('b');await tick();
  a.position=null;b.eligible=false;h.manager.refresh();await tick();check(a.url===null&&b.url===null&&h.draws.length===3,'Missing/offsite positions never auto-draw');
 }
 // Disposal and tracking cleanup reject detached work and release retained resources.
 {
  const h=harness(),a=h.target('a');h.manager.track([a]);h.enter([a]);await tick();h.manager.dispose();h.draws[0].resolve('disposed');await tick();check(a.url===null&&h.manager.stats().tracked===0&&h.manager.stats().cached===0,'Disposed lifecycle retains no target or image');check(h.manager.stats().active===0&&h.manager.stats().disposed,'Settled disposed draw releases active slot');
 }
 console.log(JSON.stringify({checks:assertions,scenarios:10,status:'PASS',browser:false,network:false}));
})().catch(error=>{console.error(error.stack);process.exit(1)});
