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
  await p.evaluate(()=>{state.day='2026-10-09';go('timeline');renderTimeline();});
  if(publicMode){check(h.counts.page===0,'No public HTML substitution');check(servedHash===process.env.EXPECTED_SHA,'Exact served public bytes');}
  const result=await p.evaluate(()=>{
   const required=['delivery','supplied','added','items','qtys','aside','moves','givenRefs','descs','rental','fenceDockets','fenceCollections','deleted','assetNumbers','accessories','units'];
   const empty=required.find(k=>{const value=SYNC_COLLS[k]?.get();return value&&typeof value==='object'&&Object.keys(value).length===0&&SYNC.first.has(k);});
   if(!empty)throw Error('Regression needs one currently empty required collection');
   const initialS=JSON.stringify(S),initialMoney=JSON.stringify(pl770Model()),first=SYNC.first,firstEntries=[...first],status=SYNC.status,realNow=Date.now,realRender=renderTimeline;
   const dates=['2026-10-07','2026-10-08','2026-10-09'],read=()=>dates.map(iso=>({iso,text:document.querySelector('.bc984-day[data-day="'+iso+'"] .bc984-percentage')?.textContent}));
   const expect=()=>{
    const memo=new Map(RENDER_MEMO),days=calendarDays();RENDER_MEMO.clear();
    try{return dates.map(iso=>{const value=PastDay984.model(days.find(d=>d.iso===iso),todayIso(),d=>progress881Model(d));return {iso,text:value.percent===null?'Not recorded':(value.bound?'≥':'')+value.text+'%'};});}
    finally{RENDER_MEMO.clear();for(const[k,v]of memo)RENDER_MEMO.set(k,v);}
   };
   let renders=0,reads=0;const realProgress=progress881Model;
   renderTimeline=function(){renders++;return realRender.apply(this,arguments);};
   progress881Model=function(){reads++;return realProgress.apply(this,arguments);};
   let report;
   try{
    // A new Brisbane day produces a cold card cache even on the broken previous release.
    // No source record is changed: only the test clock and SYNC readiness are varied.
    const now=realNow();Date.now=()=>now+86400000;TODAY_ISO.at=0;
    SYNC.first.delete(empty);RENDER_MEMO.clear();renderTimeline();
    const waiting=read(),waitingReady=todayWorkHealth840().ready,recordSameAtWait=JSON.stringify(S)===initialS;
    const readsBeforeRetry=reads;renderTimeline();const uncachedUnavailable=reads>readsBeforeRetry;
    const beforeRestore=renders;for(const key of firstEntries)SYNC.first.add(key);syncFooter();
    const restored=read(),expected=expect(),restoreRenders=renders-beforeRestore,recordSameAfterRestore=JSON.stringify(S)===initialS;
    const beforeStable=renders;syncFooter();syncFooter();const stableRenders=renders-beforeStable;
    // Losing readiness with unchanged S must also hide stale numerical completion.
    SYNC.first.delete(empty);syncFooter();const unavailableAgain=read();
    for(const key of firstEntries)SYNC.first.add(key);syncFooter();const restoredAgain=read();
    const beforeStale=renders;SYNC.status='unreachable';syncFooter();const stale={health:todayWorkHealth840(),renders:renders-beforeStale};
    const beforeStaleRepeat=renders;syncFooter();stale.repeatRenders=renders-beforeStaleRepeat;
    const beforeReconnect=renders;SYNC.status=status;syncFooter();const reconnected={health:todayWorkHealth840(),renders:renders-beforeReconnect};
    report={emptyCollection:empty,waiting,waitingReady,recordSameAtWait,uncachedUnavailable,restored,expected,restoreRenders,recordSameAfterRestore,stableRenders,unavailableAgain,restoredAgain,stale,reconnected};
   }finally{
    Date.now=realNow;TODAY_ISO.at=0;SYNC.status=status;first.clear();for(const key of firstEntries)first.add(key);SYNC.first=first;
    progress881Model=realProgress;renderTimeline=realRender;RENDER_MEMO.clear();renderTimeline();
   }
   return {...report,nativeUnchanged:JSON.stringify(S)===initialS,moneyUnchanged:JSON.stringify(pl770Model())===initialMoney,firstRestored:JSON.stringify([...SYNC.first])===JSON.stringify(firstEntries)};
  });
  check(!result.waitingReady&&result.waiting.every(x=>x.text==='Not recorded'),'Cold cache records unavailable progress before final empty collection arrives');
  check(result.recordSameAtWait&&result.recordSameAfterRestore&&result.nativeUnchanged,'Native record remains byte-identical throughout readiness changes');
  check(result.moneyUnchanged&&result.firstRestored,'P&L and shared-sync readiness restored');
  if(expectBug){
   check(result.restored.every(x=>x.text==='Not recorded')&&result.expected.every(x=>x.text.includes('%')),'Previous release deterministically retains unavailable progress after hydration');
   check(result.restoreRenders===0,'Previous release misses readiness-only automatic redraw');
  }else{
   check(result.uncachedUnavailable,'Unavailable progress is retried rather than cached');
   check(JSON.stringify(result.restored)===JSON.stringify(result.expected),'Final empty collection reveals exact whole-build percentages');
   check(result.restoreRenders===1,'Native sync footer automatically refreshes readiness-only transition exactly once');
   check(result.stableRenders===0,'Repeated same-health sync footer calls do not redraw');
   check(result.unavailableAgain.every(x=>x.text==='Not recorded'),'Readiness loss clears numerical completion without changing S');
   check(JSON.stringify(result.restoredAgain)===JSON.stringify(result.expected),'Readiness recovery restores dated percentages');
   check(result.stale.health.stale&&result.stale.renders===1&&result.stale.repeatRenders===0,'Disconnect invalidates health once without a redraw loop');
   check(!result.reconnected.health.stale&&result.reconnected.renders===1,'Reconnect refreshes current health once');
  }
  check(h.errors.length===0,'No page errors');check(h.counts.blocked===0,'No operational writes');
  const evidence={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,expectedBug:expectBug,sha256:process.env.EXPECTED_SHA,result,errors:0,writes:0};
  if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/hydration.json',JSON.stringify(evidence,null,2));}
  console.log(JSON.stringify(evidence));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
