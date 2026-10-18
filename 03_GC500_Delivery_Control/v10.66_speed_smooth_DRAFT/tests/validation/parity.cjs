/* Author: Andrew Fisher. Private frozen-record parity snapshot: all panes, every third day, every sixth drawer. */
'use strict';
const C=require('./common.cjs');
const [pageFile,outFile]=process.argv.slice(2); if(!pageFile||!outFile)throw new Error('Usage: node parity.cjs page.html private-output.json');
(async()=>{
 const mobile=process.env.MOB==='1', s=await C.launch({pageFile,mobile}), p=s.page;
 const out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,clock:C.CLOCK_ISO,panes:{},days:{},drawers:{}};
 try{
  await C.ready(s); await C.settled(p,3000);
  await p.evaluate(()=>{for(const sel of ['header.top','footer.foot','#drawer'])if(!document.querySelector(sel))throw new Error('Missing fixed capture element '+sel);});
  console.log(JSON.stringify({phase:'ready',mobile}));
  out.version=await p.evaluate(()=>SYNC.db.readVersion821());
  out.initial=await p.evaluate(()=>({tab:state.tab,hash:location.hash,selected:document.querySelector('#tabs [aria-selected="true"]')?.dataset.tab}));
  // The unchanged baseline can report Live before its ScopeSync collection merge finishes. Set up both arms
  // identically and record that defect explicitly; candidate boot.cjs independently forbids manual-redelivery repair.
  const initialRecord=await p.evaluate(()=>JSON.stringify(S)),initialMerge=await C.mergeReport(p);
  await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);
  const primedRecord=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);
  const stableRecord=await p.evaluate(()=>JSON.stringify(S)),merge=await C.mergeReport(p),secondChanges=C.recordDelta(JSON.parse(primedRecord),JSON.parse(stableRecord));
  out.fixtureSetup={initialMerge,initialChanges:C.recordDelta(JSON.parse(initialRecord),JSON.parse(primedRecord)),secondChanges,merge,recordSha256:C.sha(JSON.stringify(C.canonicalRecord(JSON.parse(stableRecord))))};
  if(secondChanges.length||!merge.complete)throw new Error('Frozen record did not reach a complete stable merge during explicit fixture setup');
  out.tabs=await p.evaluate(()=>TABS.map(t=>t[0]));
  const capture=async sel=>p.evaluate(sel=>{const el=document.querySelector(sel);if(!el)throw new Error('Missing element '+sel);const c=el.cloneNode(true);c.querySelectorAll('style,script').forEach(x=>x.remove());return {visible:el.innerText,full:c.textContent};},sel);
  for(const tab of out.tabs){
   await p.evaluate(k=>go(k),tab); await C.settled(p,1300);
   if(tab==='plant'){await p.evaluate(()=>{if(typeof PLANT_REST!=='undefined'&&PLANT_REST.flush)PLANT_REST.flush();});await C.settled(p,1300);}
   if(tab==='timeline')await C.materializeBuild(p);
   out.panes[tab]=await capture('#pane-'+tab);
   console.log(JSON.stringify({phase:'pane',mobile,tab}));
  }
  await p.evaluate(()=>go('timeline')); await C.settled(p,1500);
  const allDays=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .bc984-day')].map(x=>x.dataset.day));
  out.dayKeys=allDays.filter((_,i)=>i%3===0);
  if(!out.dayKeys.length)throw new Error('No Build days tested');
  for(const day of out.dayKeys){
   await p.evaluate(day=>{const button=[...document.querySelectorAll('#pane-timeline .bc984-day')].find(x=>x.dataset.day===day);if(!button)throw new Error('Build day missing');button.click();},day);
   await C.settled(p,1000);
   await C.materializeBuild(p);
   // The strip's scroll position is intentionally retained in v10.66; contents remain included in full text.
   out.days[day]=await capture('#pane-timeline');
   if(Object.keys(out.days).length%6===0)console.log(JSON.stringify({phase:'days',mobile,count:Object.keys(out.days).length,total:out.dayKeys.length}));
  }
  out.drawerKeys=await p.evaluate(()=>allAssets().map(a=>a.key).filter((_,i)=>i%6===0));
  if(!out.drawerKeys.length)throw new Error('No asset drawers tested');
  for(const key of out.drawerKeys){await p.evaluate(k=>openAsset(k),key);await C.settled(p,900);out.drawers[key]=await capture('#drawer');if(Object.keys(out.drawers).length%12===0)console.log(JSON.stringify({phase:'drawers',mobile,count:Object.keys(out.drawers).length,total:out.drawerKeys.length}));}
  await p.evaluate(()=>document.getElementById('dclose')?.click()); await C.settled(p,1000);
  out.header=await capture('header.top'); out.footer=await capture('footer.foot');
  const beforeRedelivery=await p.evaluate(()=>JSON.stringify(S));
  await p.evaluate(()=>SYNC.backend.redeliver()); await C.settled(p,1300);
  const afterRedelivery=await p.evaluate(()=>JSON.stringify(S));
  const changes=C.recordDelta(JSON.parse(beforeRedelivery),JSON.parse(afterRedelivery));
  out.redelivery={unchanged:changes.length===0,serializedUnchanged:beforeRedelivery===afterRedelivery,changes,version:await p.evaluate(()=>SYNC.db.readVersion821())};
  out.versionAfter=await p.evaluate(()=>SYNC.db.readVersion821()); out.health=C.errorsOf(s);
  if(!out.redelivery.unchanged||out.version!==out.versionAfter)throw new Error('Frozen record changed during capture');
  C.assertClean(s); out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);out.health=C.errorsOf(s);out.phase=await p.evaluate(()=>({tab:typeof state==='undefined'?null:state.tab,sync:typeof SYNC==='undefined'?null:SYNC.status,docs:typeof DOCS==='undefined'?null:DOCS.state,refresh:document.documentElement.getAttribute('data-refresh904')})).catch(()=>null);process.exitCode=1;}
 finally{C.writePrivate(outFile,out);await s.browser.close();}
 console.log(JSON.stringify({pass:out.pass,mobile,tabs:Object.keys(out.panes).length,days:Object.keys(out.days).length,drawers:Object.keys(out.drawers).length,pageSha256:out.pageSha256,error:out.error?.split('\n')[0]}));
})();
