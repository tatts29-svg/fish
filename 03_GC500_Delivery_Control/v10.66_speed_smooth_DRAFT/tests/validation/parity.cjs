/* Author: Andrew Fisher. Private frozen-record parity snapshot: all panes, every third day, every sixth drawer. */
'use strict';
const C=require('./common.cjs');
const [pageFile,outFile]=process.argv.slice(2); if(!pageFile||!outFile)throw new Error('Usage: node parity.cjs page.html private-output.json');
(async()=>{
 const mobile=process.env.MOB==='1', s=await C.launch({pageFile,mobile}), p=s.page;
 const out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),mobile,clock:C.CLOCK_ISO,panes:{},days:{},drawers:{}};
 try{
  await C.ready(s); await C.settled(p,3000);
  out.version=await p.evaluate(()=>SYNC.db.readVersion821());
  out.initial=await p.evaluate(()=>({tab:state.tab,hash:location.hash,selected:document.querySelector('#tabs [aria-selected="true"]')?.dataset.tab}));
  out.tabs=await p.evaluate(()=>TABS.map(t=>t[0]));
  const capture=async sel=>p.evaluate(sel=>{const el=document.querySelector(sel);if(!el)throw new Error('Missing element '+sel);const c=el.cloneNode(true);c.querySelectorAll('style,script').forEach(x=>x.remove());return {visible:el.innerText,full:c.textContent};},sel);
  for(const tab of out.tabs){
   await p.evaluate(k=>go(k),tab); await C.settled(p,1300);
   if(tab==='plant'){await p.evaluate(()=>{if(typeof PLANT_REST!=='undefined'&&PLANT_REST.flush)PLANT_REST.flush();});await C.settled(p,1300);}
   out.panes[tab]=await capture('#pane-'+tab);
  }
  await p.evaluate(()=>go('timeline')); await C.settled(p,1500);
  const allDays=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .bc984-day')].map(x=>x.dataset.day));
  out.dayKeys=allDays.filter((_,i)=>i%3===0);
  if(!out.dayKeys.length)throw new Error('No Build days tested');
  for(const day of out.dayKeys){
   await p.evaluate(day=>{const button=[...document.querySelectorAll('#pane-timeline .bc984-day')].find(x=>x.dataset.day===day);if(!button)throw new Error('Build day missing');button.click();},day);
   await C.settled(p,1000);
   // The strip's scroll position is intentionally retained in v10.66; contents remain included in full text.
   out.days[day]=await capture('#pane-timeline');
  }
  out.drawerKeys=await p.evaluate(()=>allAssets().map(a=>a.key).filter((_,i)=>i%6===0));
  if(!out.drawerKeys.length)throw new Error('No asset drawers tested');
  for(const key of out.drawerKeys){await p.evaluate(k=>openAsset(k),key);await C.settled(p,900);out.drawers[key]=await capture('#drawer');}
  await p.evaluate(()=>document.getElementById('dclose')?.click()); await C.settled(p,1000);
  out.header=await capture('header.top'); out.footer=await capture('#foot');
  out.redelivery=await p.evaluate(async()=>{const before=JSON.stringify(S);await SYNC.backend.pull(true);return {unchanged:before===JSON.stringify(S),version:SYNC.db.readVersion821()};});
  out.versionAfter=await p.evaluate(()=>SYNC.db.readVersion821()); out.health=C.errorsOf(s);
  if(!out.redelivery.unchanged||out.version!==out.versionAfter)throw new Error('Frozen record changed during capture');
  C.assertClean(s); out.pass=true;
 }catch(error){out.pass=false;out.error=String(error.stack||error);out.health=C.errorsOf(s);process.exitCode=1;}
 finally{C.writePrivate(outFile,out);await s.browser.close();}
 console.log(JSON.stringify({pass:out.pass,mobile,tabs:Object.keys(out.panes).length,days:Object.keys(out.days).length,drawers:Object.keys(out.drawers).length,pageSha256:out.pageSha256,error:out.error?.split('\n')[0]}));
})();
