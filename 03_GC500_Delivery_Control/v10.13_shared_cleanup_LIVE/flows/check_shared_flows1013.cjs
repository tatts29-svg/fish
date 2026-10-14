/* Author: Andrew Fisher. Shared read-only render/navigation regression. No live writes. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../toolchain/harness'),{open}=require(root+'/open_page');
const out=process.env.OUT||'/workspace/private-gc5001013-flows',mobile=process.env.MOB!=='0';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',mobile,sha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),checks:[],routes:[],errors:[]};
function check(name,pass,details){report.checks.push({name,pass:!!pass,details});fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({name,pass:!!pass}));}
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:150000});
 const baseline=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),state:JSON.stringify(S)}));report.nativeVersion=baseline.version;
 const tabs=await p.evaluate(()=>TABS.map(t=>t[0]));
 for(const tab of tabs){
  await p.evaluate(t=>go(t),tab);await p.waitForTimeout(tab==='today'?1800:tab==='map'?1500:350);
  const ready=await p.evaluate(()=>{const pane=document.getElementById('pane-'+state.tab),visible=n=>!!n.getClientRects().length;const folds=[...pane.querySelectorAll('details')].filter(d=>visible(d.querySelector(':scope>summary')));for(const d of [folds[0],folds[Math.floor(folds.length/2)]].filter(Boolean))d.open=true;return {tab:state.tab,pane:pane.id,shown:!pane.hidden&&pane.offsetHeight>0,folds:folds.length};});
  await p.waitForTimeout(tab==='today'?1700:150);
  await p.evaluate(()=>{const pane=document.getElementById('pane-'+state.tab),folds=[...pane.querySelectorAll('details[open]')].filter(n=>n.getClientRects().length);if(folds.length)folds.at(-1).querySelector('summary').scrollIntoView({block:'center'});else document.querySelector('main').scrollTop=300;document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));});await p.waitForTimeout(80);
  const capture=()=>{const pane=document.getElementById('pane-'+state.tab),main=document.querySelector('main'),held=Persistence1010.capture(pane,false);return {tab:state.tab,folds:held.folds.filter(f=>f[1]).map(f=>f[0]),top:main.scrollTop,max:main.scrollHeight-main.clientHeight,doc:document.scrollingElement.scrollTop,over:document.documentElement.scrollWidth>innerWidth+1,selectedCost:state.financeView857||null};};
  const before=await p.evaluate(capture);await p.evaluate(()=>Idle1006.redraw());await p.waitForTimeout(250);const after=await p.evaluate(capture);
  const destination=({progress:'today',register:'plant',journal:'today',breakdowns:'today',variances:'today',edit:'today',add:'today',pricing:'costs'})[tab]||tab;check(tab+' opens its native destination',ready.shown&&ready.tab===destination,{...ready,expectedDestination:destination});
  check(tab+' background update preserves open disclosures',before.tab===after.tab&&before.folds.every(k=>after.folds.includes(k)),{before:before.folds.length,after:after.folds.length,missing:before.folds.filter(k=>!after.folds.includes(k))});
  check(tab+' background update preserves reading position',Math.abs(Math.min(before.top,after.max)-after.top)<3&&Math.abs(before.doc-after.doc)<3,{before:before.top,after:after.top,maxAfter:after.max,documentBefore:before.doc,documentAfter:after.doc});
  report.routes.push({tab,before,after});
  if(['costs','plant','subhired','map'].includes(tab))await p.screenshot({path:out+'/'+tab+'.png'});
 }
 await p.evaluate(()=>{go('plant');});await p.waitForTimeout(200);await p.evaluate(()=>go('timeline'));await p.waitForTimeout(200);await p.goBack();await p.waitForTimeout(300);
 check('Browser Back returns to Equipment',await p.evaluate(()=>state.tab==='plant'&&location.hash==='#plant'));
 await p.evaluate(()=>{go('subhired');openAsset('WC09');});await p.waitForTimeout(150);const beforeDrawer=await p.evaluate(()=>({tab:state.tab,ref:state.sel,on:document.querySelector('#drawer').classList.contains('on')}));await p.evaluate(()=>Idle1006.redraw());await p.waitForTimeout(100);
 check('Subhired reference drawer stays open during update',await p.evaluate(()=>state.sel==='WC09'&&document.querySelector('#drawer').classList.contains('on')),beforeDrawer);
 await p.locator('#drawer [data-nav934-back]').click();await p.evaluate(()=>Idle1006.redraw());await p.waitForTimeout(100);
 check('Drawer Back returns to supplier page and remains closed',await p.evaluate(()=>state.tab==='subhired'&&!document.querySelector('#drawer').classList.contains('on')));
 const end=await p.evaluate(()=>({version:SYNC.backend.readVersion821(),state:JSON.stringify(S)}));if(baseline.version===end.version)check('Read-only flows preserve the unchanged native version',baseline.state===end.state,{version:end.version});else report.concurrentNativeUpdate={before:baseline.version,after:end.version,note:'Live user updates arrived during the read-only audit; record equality not asserted across versions.'};check('No runtime errors',!h.errors.length,h.errors);check('No operational writes attempted',h.counts.blocked===0,h.counts);report.errors=h.errors;report.requests=h.counts;
 }catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();report.result={checks:report.checks.length,passed:report.checks.filter(c=>c.pass).length};fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,failure:report.failure,failed:report.checks.filter(c=>!c.pass)}));if(report.checks.some(c=>!c.pass))process.exitCode=1;}})();
