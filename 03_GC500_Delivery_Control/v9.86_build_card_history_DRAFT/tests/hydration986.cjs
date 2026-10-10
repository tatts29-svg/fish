// Author: Andrew Fisher. Empty-collection hydration regression; browser-only fixtures, no service writes.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
let servedHash;
if(process.env.PUBLIC==='1'){
 const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,...args){const result=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=crypto.createHash('sha256').update(result.body).digest('hex');return result;};
}
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1',expectBug=process.env.EXPECT_BUG==='1',out=process.env.OUTDIR;
 if(!publicMode)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#day/2026-10-09',mobile,W:mobile?390:1440,H:900}),p=h.page;
 let checks=0;const check=(ok,name)=>{assert(ok,name);checks++;};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
  await p.waitForFunction(()=>DOCS.state==='ready',null,{timeout:150000});
  await p.evaluate(()=>{state.day='2026-10-09';go('timeline');renderTimeline();});
  if(publicMode){check(h.counts.page===0,'No public HTML substitution');check(servedHash===process.env.EXPECTED_SHA,'Exact served public bytes');}
  const result=await p.evaluate(async()=>{
   const required=['delivery','supplied','added','items','qtys','aside','moves','givenRefs','descs','rental','fenceDockets','fenceCollections','deleted','assetNumbers','accessories','units'];
   const empty=required.find(k=>{const value=SYNC_COLLS[k]?.get();return value&&typeof value==='object'&&Object.keys(value).length===0&&SYNC.first.has(k);});
   if(!empty)throw Error('Regression needs one currently empty required collection');
   const initialS=JSON.stringify(S),initialMoney=JSON.stringify(pl770Model()),first=SYNC.first,firstEntries=[...first],status=SYNC.status,realNow=Date.now,realRender=renderTimeline;
   const dates=['2026-10-07','2026-10-08','2026-10-09'],read=()=>dates.map(iso=>({iso,text:document.querySelector('.bc984-day[data-day="'+iso+'"] .bc984-percentage')?.textContent}));
   const settle=async()=>{
    await new Promise(requestAnimationFrame);
    const fixtureVisibility=()=>{for(const iso of dates){const card=document.querySelector('.bc984-day[data-day="'+iso+'"]');if(card)card.dataset.bc984Visible='true';}BuildProgress986.sync();};
    fixtureVisibility();const end=performance.now()+45000;
    while(dates.some(iso=>document.querySelector('.bc984-day[data-day="'+iso+'"]')?.dataset.buildProgress==='pending')){
     if(performance.now()>end)throw Error('Deferred historical readings did not resolve after hydration '+JSON.stringify({queue:BuildProgress986.report(),health:todayWorkHealth840(),cards:dates.map(iso=>{const c=document.querySelector('.bc984-day[data-day="'+iso+'"]');return {iso,state:c?.dataset.buildProgress,visible:c?.dataset.bc984Visible};})}));
     fixtureVisibility();
     await new Promise(resolve=>setTimeout(resolve,50));
    }
   };
   const expect=()=>{
    const memo=new Map(RENDER_MEMO),days=calendarDays();RENDER_MEMO.clear();
    try{return dates.map(iso=>{const value=PastDay984.model(days.find(d=>d.iso===iso),todayIso(),d=>progress881Model(d));return {iso,text:value.percent===null?'Not recorded':(value.bound?'≥':'')+value.text+'%'};});}
    finally{RENDER_MEMO.clear();for(const[k,v]of memo)RENDER_MEMO.set(k,v);}
   };
   let renders=0,reads=0;const realProgress=progress881Model,realFenceEvidence=fenceProgressEvidence848,docsState=DOCS.state,docsAt=DOCS.at;
   renderTimeline=function(){renders++;return realRender.apply(this,arguments);};
   progress881Model=function(){reads++;return realProgress.apply(this,arguments);};
   let report;
   try{
    // A new Brisbane day produces a cold card cache even on the broken previous release.
    // No source record is changed: only the test clock and SYNC readiness are varied.
    const now=realNow();Date.now=()=>now+86400000;TODAY_ISO.at=0;
    SYNC.first.delete(empty);RENDER_MEMO.clear();renderTimeline();
    const waiting=read(),waitingReady=todayWorkHealth840().ready,recordSameAtWait=JSON.stringify(S)===initialS;
    const readsBeforeRetry=reads;renderTimeline();const unavailableNotCalculated=reads===readsBeforeRetry&&BuildProgress986.report().queued===0;
    const beforeRestore=renders;for(const key of firstEntries)SYNC.first.add(key);syncFooter();const restoreRenders=renders-beforeRestore;await settle();
    const restored=read(),expected=expect(),recordSameAfterRestore=JSON.stringify(S)===initialS;
    const beforeStable=renders;syncFooter();syncFooter();const stableRenders=renders-beforeStable;
    // Losing readiness with unchanged S must also hide stale numerical completion.
    SYNC.first.delete(empty);syncFooter();const unavailableAgain=read();
    for(const key of firstEntries)SYNC.first.add(key);syncFooter();await settle();const restoredAgain=read();
    const beforeStale=renders;SYNC.status='unreachable';syncFooter();const stale={health:todayWorkHealth840(),renders:renders-beforeStale};
    const beforeStaleRepeat=renders;syncFooter();stale.repeatRenders=renders-beforeStaleRepeat;
    const beforeReconnect=renders;SYNC.status=status;syncFooter();const reconnected={health:todayWorkHealth840(),renders:renders-beforeReconnect};
    let fenceReads=0;fenceProgressEvidence848=function(){fenceReads++;return realFenceEvidence.apply(this,arguments);};
    const fenceBeforeLoading=fenceReads,renderBeforeLoading=renders;DOCS.state='loading';syncFooter();const loadingRenders=renders-renderBeforeLoading;await settle();
    const sourceLoading={renders:loadingRenders,reads:fenceReads-fenceBeforeLoading};
    const fenceBeforeReady=fenceReads,renderBeforeReady=renders;DOCS.state=docsState;syncFooter();const readyRenders=renders-renderBeforeReady;await settle();
    const sourceReady={renders:readyRenders,reads:fenceReads-fenceBeforeReady};
    const fenceBeforeRevision=fenceReads,renderBeforeRevision=renders;DOCS.at=docsAt+1;syncFooter();const revisionRenders=renders-renderBeforeRevision;await settle();
    const sourceRevision={renders:revisionRenders,reads:fenceReads-fenceBeforeRevision};
    const renderBeforeSourceStable=renders;syncFooter();syncFooter();const sourceStableRenders=renders-renderBeforeSourceStable;
    report={sourceLoading,sourceReady,sourceRevision,sourceStableRenders,emptyCollection:empty,waiting,waitingReady,recordSameAtWait,unavailableNotCalculated,retriedWhenReady:reads>readsBeforeRetry,restored,expected,restoreRenders,recordSameAfterRestore,stableRenders,unavailableAgain,restoredAgain,stale,reconnected};
   }finally{
    Date.now=realNow;TODAY_ISO.at=0;SYNC.status=status;DOCS.state=docsState;DOCS.at=docsAt;fenceProgressEvidence848=realFenceEvidence;first.clear();for(const key of firstEntries)first.add(key);SYNC.first=first;
    progress881Model=realProgress;renderTimeline=realRender;RENDER_MEMO.clear();renderTimeline();
   }
   return {...report,nativeUnchanged:JSON.stringify(S)===initialS,moneyUnchanged:JSON.stringify(pl770Model())===initialMoney,firstRestored:JSON.stringify([...SYNC.first])===JSON.stringify(firstEntries)};
  });
  if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/hydration-debug.json',JSON.stringify(result,null,2));}
  check(!result.waitingReady&&result.waiting.every(x=>x.text==='Not recorded'),'Cold cache records unavailable progress before final empty collection arrives');
  check(result.recordSameAtWait&&result.recordSameAfterRestore&&result.nativeUnchanged,'Native record remains byte-identical throughout readiness changes');
  check(result.moneyUnchanged&&result.firstRestored,'P&L and shared-sync readiness restored');
  if(expectBug){
   check(result.restored.every(x=>x.text==='Not recorded')&&result.expected.every(x=>x.text.includes('%')),'Previous release deterministically retains unavailable progress after hydration');
   check(result.restoreRenders===0,'Previous release misses readiness-only automatic redraw');
  }else{
   check(result.unavailableNotCalculated&&result.retriedWhenReady,'Unavailable progress waits for readiness and is then calculated without a stale missing-data cache');
   check(JSON.stringify(result.restored)===JSON.stringify(result.expected),'Final empty collection reveals exact whole-build percentages');
   check(result.restoreRenders===1,'Native sync footer automatically refreshes readiness-only transition exactly once');
   check(result.stableRenders===0,'Repeated same-health sync footer calls do not redraw');
   check(result.unavailableAgain.every(x=>x.text==='Not recorded'),'Readiness loss clears numerical completion without changing S');
   check(JSON.stringify(result.restoredAgain)===JSON.stringify(result.expected),'Readiness recovery restores dated percentages');
   check(result.stale.health.stale&&result.stale.renders===1&&result.stale.repeatRenders===0,'Disconnect invalidates health once without a redraw loop');
   check(!result.reconnected.health.stale&&result.reconnected.renders===1,'Reconnect refreshes current health once');
  }
  check(result.sourceLoading.renders===1&&result.sourceLoading.reads>0,'Source document loading invalidates daily work and progress once');
  check(result.sourceReady.renders===1&&result.sourceReady.reads>0,'Source document readiness refreshes recorded work without changing S');
  check(result.sourceRevision.renders===1&&result.sourceRevision.reads>0,'New source document revision refreshes native fencing evidence');
  check(result.sourceStableRenders===0,'Same source revision never causes a redraw loop');
  check(h.errors.length===0,'No page errors');check(h.counts.blocked===0,'No operational writes');
  const evidence={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,expectedBug:expectBug,sha256:process.env.EXPECTED_SHA,result,errors:0,writes:0};
  if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/hydration.json',JSON.stringify(evidence,null,2));}
  console.log(JSON.stringify(evidence));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
