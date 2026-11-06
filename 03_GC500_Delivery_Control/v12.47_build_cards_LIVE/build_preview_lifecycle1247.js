/* Author: Andrew Fisher. Bounded lifecycle for the additive Build map preview.
 * Drawing includes decoding/compaction: there is never a second concurrent draw.
 */
(function(root){'use strict';
 function createBuildPreviewLifecycle1247(options){
  const cacheLimit=options.cacheLimit||16,imageLimit=options.imageLimit||16;
  const records=new Map(),cache=new Map();
  let queue=[],admitted=new Set(),flight=null,scheduled=false,disposed=false;
  const counts={drawn:0,reused:0,failed:0,stale:0,evicted:0,active:0,peakActive:0};
  const now=options.now||Date.now,defer=options.defer||(fn=>Promise.resolve().then(fn));
  const connected=target=>options.connected(target);
  const near=record=>record.near&&connected(record.target)&&options.inView(record.target);
  const read=target=>{try{return options.describe(target);}catch(_){return null;}};
  const eligible=description=>!!description&&!!description.eligible&&!!description.key;
  function clear(record){
   if(record.state==='idle')return;
   if(record.shownKey){counts.evicted++;record.shownKey=null;}
   options.clear(record.target);record.state='idle';
  }
  function unavailable(record,reason){
   if(record.shownKey||record.state==='waiting')clear(record);
   if(record.state!=='unavailable'||record.reason!==reason)options.unavailable(record.target,reason);
   record.state='unavailable';record.reason=reason;
  }
  function reset(record,description){
   const key=description?.key||null;
   if(record.key!==key){clear(record);record.key=key;record.failure=null;}
   record.description=description;
  }
  function get(key){const url=cache.get(key);if(url){cache.delete(key);cache.set(key,url);}return url;}
  function put(key,url){cache.delete(key);cache.set(key,url);while(cache.size>cacheLimit)cache.delete(cache.keys().next().value);}
  function current(job){
   if(disposed||!options.active()||records.get(job.target)!==job.record||!admitted.has(job.target)||!near(job.record))return false;
   const description=read(job.target);return eligible(description)&&description.key===job.key;
  }
  function schedule(){if(disposed||scheduled||flight||!queue.length)return;scheduled=true;defer(()=>{scheduled=false;pump();});}
  function reconcile(){
   if(disposed)return;
   for(const [target,record] of records)if(!connected(target)){clear(record);records.delete(target);}
   const candidates=[];
   if(options.active())for(const record of records.values())if(near(record)){
    const description=read(record.target);reset(record,description);
    if(!eligible(description)){unavailable(record,description?.reason||'Open recorded location ↗');continue;}
    candidates.push(record);
   }
   // Stable admission bounds attached decoded images even on unusually tall viewports.
   admitted=new Set(candidates.slice(0,imageLimit).map(record=>record.target));queue=[];
   for(const record of records.values())if(!admitted.has(record.target)&&(record.shownKey||record.state==='waiting'))clear(record);
   for(const record of candidates){
    if(!admitted.has(record.target))continue;
    if(record.shownKey===record.key)continue;
    const url=get(record.key);
    if(url){if(record.shownKey!==record.key){options.present(record.target,url);record.shownKey=record.key;record.state='shown';counts.reused++;}continue;}
    if(record.failure&&record.failure.key===record.key&&now()-record.failure.at<60000)continue;
    if(flight&&flight.record===record&&flight.key===record.key)continue;
    if(record.state!=='waiting'){options.waiting(record.target);record.state='waiting';}
    queue.push({target:record.target,record,key:record.key,description:record.description});
   }
   schedule();
  }
  function pump(){
   if(disposed||flight)return;
   // Intersection callbacks may lag a scroll. Recheck geometry before dequeuing.
   reconcile();const job=queue.shift();if(!job)return;
   if(!current(job)){reconcile();return;}
   flight=job;counts.active++;counts.peakActive=Math.max(counts.peakActive,counts.active);
   Promise.resolve().then(()=>{
    if(!current(job))return null;
    return options.draw(job.description,()=>current(job));
   }).then(url=>{
    if(!current(job)){counts.stale++;return;}
    if(!url)throw new Error('Map preview unavailable');
    put(job.key,url);counts.drawn++;
   }).catch(()=>{
    if(!current(job)){counts.stale++;return;}
    counts.failed++;job.record.failure={key:job.key,at:now()};unavailable(job.record,'Preview unavailable · Open map ↗');
   }).finally(()=>{flight=null;counts.active--;if(!disposed)reconcile();});
  }
  function track(targets){
   if(disposed)return;const found=new Set(targets);
   for(const [target,record] of records)if(!found.has(target)){clear(record);records.delete(target);}
   for(const target of found)if(!records.has(target))records.set(target,{target,near:false,key:null,shownKey:null,description:null,failure:null,state:'idle',reason:null});
   reconcile();
  }
  function visibility(entries){
   if(disposed)return;
   for(const [target,value] of entries){const record=records.get(target);if(!record)continue;
    if(value&&!record.near)record.failure=null;record.near=!!value;
   }
   reconcile();
  }
  function dispose(){if(disposed)return;disposed=true;for(const record of records.values())clear(record);records.clear();cache.clear();queue=[];admitted.clear();}
  return Object.freeze({track,visibility,refresh:reconcile,dispose,stats:()=>({...counts,cached:cache.size,queued:queue.length,tracked:records.size,attached:[...records.values()].filter(r=>!!r.shownKey).length,cacheLimit,imageLimit,disposed})});
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={createBuildPreviewLifecycle1247};
 else root.createBuildPreviewLifecycle1247=createBuildPreviewLifecycle1247;
})(typeof window!=='undefined'?window:globalThis);
