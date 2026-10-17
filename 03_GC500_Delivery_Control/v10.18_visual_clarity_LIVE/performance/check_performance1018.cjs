// Author: Andrew Fisher. Real embedded master-plan lifecycle and idle rendering checks; GET-only.
'use strict';
const fs=require('fs');
const {open}=require('../map/tests/readonly1018.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today',W:1440,H:1000});
 const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const initial=await p.evaluate(()=>({record:JSON.stringify(S),version:SYNC.backend.readVersion821()}));
 await p.evaluate(async()=>{
  const host=document.createElement('div');host.id='performance1018-host';
  Object.assign(host.style,{position:'fixed',top:'180px',left:'20px',width:'460px',height:'420px',zIndex:'200'});
  document.body.appendChild(host);window.__observerChanges1018=0;
  window.__observerAdapter1018=await MasterPlan911.create(host,{change:()=>window.__observerChanges1018++});
 });
 await p.waitForTimeout(1200);
 const checks=[],check=(name,pass)=>checks.push({name,pass:!!pass});
 const ready=await p.evaluate(()=>({ready:__observerAdapter1018.ready,report:__observerAdapter1018.rendering1018()}));
 check('actual explorer uses event-driven parent observer',ready.ready&&ready.report.eventDriven);
 const idle=await p.evaluate(()=>__observerAdapter1018.rendering1018().viewChecks);
 await p.waitForTimeout(1100);
 check('still embedded map does not remeasure every frame',await p.evaluate(n=>__observerAdapter1018.rendering1018().viewChecks===n,idle));
 const storm=await p.evaluate(()=>{
  const a=__observerAdapter1018,w=a.iframe.contentWindow,before=a.rendering1018().viewChecks;
  for(let i=0;i<100;i++)w.dispatchEvent(new w.Event('gc500viewchange1018'));
  return before;
 });
 await p.waitForTimeout(100);
 check('one hundred camera notifications coalesce into one measurement',await p.evaluate(n=>__observerAdapter1018.rendering1018().viewChecks===n+1,storm));
 const moved=await p.evaluate(()=>{
  const a=__observerAdapter1018,w=a.iframe.contentWindow,calls=__observerChanges1018,before=a.capture(),point=a.project([.5,.5]);
  w.GC500Explorer.goto([900,600,1100,800],'Clarity check');
  return {before,calls,point};
 });
 await p.waitForTimeout(900);
 check('animated camera move updates parent projection',await p.evaluate(b=>__observerChanges1018>b.calls&&JSON.stringify(__observerAdapter1018.capture())!==JSON.stringify(b.before)&&__observerAdapter1018.project([.5,.5])!==null,moved));
 const still=await p.evaluate(()=>__observerAdapter1018.rendering1018().viewChecks);await p.waitForTimeout(400);
 check('observer returns to rest after camera animation',await p.evaluate(n=>__observerAdapter1018.rendering1018().viewChecks===n,still));
 const preserved=await p.evaluate(()=>{
  const a=__observerAdapter1018,before=a.capture();a.iframe.contentWindow.GC500Explorer.refresh();return before;
 });
 await p.waitForTimeout(200);
 check('data refresh preserves exact camera',await p.evaluate(b=>JSON.stringify(__observerAdapter1018.capture())===JSON.stringify(b),preserved));
 const resize=await p.evaluate(()=>{const b=__observerChanges1018;document.getElementById('performance1018-host').style.width='620px';return b;});
 await p.waitForTimeout(300);
 check('resized embedded map updates its overlay',await p.evaluate(n=>__observerChanges1018>n,resize));
 const quiet=await p.evaluate(()=>{
  document.body.classList.add('showing');const a=__observerAdapter1018,n=a.rendering1018().viewChecks,w=a.iframe.contentWindow;w.dispatchEvent(new w.Event('gc500viewchange1018'));return n;
 });
 await p.waitForTimeout(100);
 check('covered showcase defers measurement',await p.evaluate(n=>__observerAdapter1018.rendering1018().viewChecks===n&&__observerAdapter1018.rendering1018().dirty,quiet));
 await p.evaluate(()=>document.body.classList.remove('showing'));await p.waitForTimeout(1200);
 check('uncovering resumes pending measurement',await p.evaluate(()=>!__observerAdapter1018.rendering1018().dirty));
 await p.evaluate(()=>document.getElementById('performance1018-host').remove());await p.waitForTimeout(1200);
 check('removed host releases observer and iframe',await p.evaluate(()=>__observerAdapter1018.status==='destroyed'&&!__observerAdapter1018.iframe.isConnected&&!__observerAdapter1018.rendering1018().eventDriven));
 check('record and service version untouched',await p.evaluate(b=>JSON.stringify(S)===b.record&&SYNC.backend.readVersion821()===b.version,initial));
 check('zero browser errors or operational write attempts',!h.errors.length&&!h.counts.blocked);
 const out={author:'Andrew Fisher',checks,version:initial.version,requests:h.counts,errors:h.errors};
 fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({checks:checks.length,failures:checks.filter(c=>!c.pass),version:out.version,requests:h.counts}));
 if(checks.some(c=>!c.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
