// Author: Andrew Fisher. Native dialog close/focus timing probe; GET only.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const {motionState}=require('./test_today842.cjs');
const {open}=require('../toolchain/harness/open_page.js');
const {PAGE,OUT,CANDIDATE_SHA}=process.env,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(!PAGE||!OUT||sha(fs.readFileSync(PAGE))!==CANDIDATE_SHA)throw Error('Frozen PAGE/SHA and private OUT required');
fs.mkdirSync(OUT,{recursive:true});const report={author:'Andrew Fisher',candidate:CANDIDATE_SHA,at:new Date().toISOString(),checks:[],runs:[]};
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name);};
const guard=installWriteGuard();let session;
(async()=>{try{
 session=await open({pageFile:PAGE,hash:'#today',W:3840,H:2160,dpr:1});const p=session.page;await ready840(p);await p.waitForFunction(()=>TodayWork840.report().groupsMerged&&typeof todayWorkSummary842==='function');const original=await nativeSnapshot(p);
 await p.evaluate(()=>{window.__dialogTrace842=[];const snap=stage=>{const d=document.querySelector('#gc500-work-dialog840');const s={stage,time:performance.now(),open:d.open,focus:document.activeElement?.dataset.tw840Focus||null,tag:document.activeElement?.tagName,main:document.querySelector('main').scrollTop,work:TodayWork840.report().running};__dialogTrace842.push(s);return s;};window.__dialogSnap842=snap;document.addEventListener('focusin',()=>snap('focusin'),true);const d=document.querySelector('#gc500-work-dialog840');d.addEventListener('cancel',()=>{snap('cancel');queueMicrotask(()=>snap('cancel microtask'));requestAnimationFrame(()=>snap('cancel frame'));});d.addEventListener('close',()=>{window.__dialogClosed842=true;snap('close listener');queueMicrotask(()=>snap('close microtask'));requestAnimationFrame(()=>snap('close frame'));});new MutationObserver(()=>snap('open mutation')).observe(d,{attributes:true,attributeFilter:['open']});});
 for(let i=0;i<5;i++){
  await p.locator('[data-tw840-jump=buildings]').click();await p.waitForTimeout(200);
  await p.locator('[data-tw840-detail=buildings][data-tw840-mode=left]').click();await p.waitForTimeout(300);const before=await p.evaluate(()=>__dialogSnap842('opened'));
  await p.evaluate(()=>renderToday());await p.waitForTimeout(300);await p.screenshot({path:path.join(OUT,'4k-dialog-before-close-'+i+'.png')});
  await p.evaluate(()=>{__dialogTrace842.length=0;__dialogClosed842=false;__dialogSnap842('before Escape');});await p.keyboard.press('Escape');const immediate=await p.evaluate(()=>({...__dialogSnap842('after keyboard command'),closedEvent:__dialogClosed842}));
  await p.waitForFunction(()=>__dialogClosed842&&!document.querySelector('#gc500-work-dialog840').open&&document.activeElement?.dataset.tw840Focus==='buildings-left',null,{timeout:1500}).catch(()=>{});
  const awaited=await p.evaluate(()=>({...__dialogSnap842('awaited close'),closedEvent:__dialogClosed842}));await p.waitForTimeout(100);const stable=await p.evaluate(()=>({...__dialogSnap842('100ms after close'),closedEvent:__dialogClosed842})),motion=await motionState(p),trace=await p.evaluate(()=>__dialogTrace842);report.runs.push({i,before,immediate,awaited,stable,motion,trace});
  check('4k native close event '+i+' restores the original control focus',awaited.closedEvent&&!awaited.open&&awaited.focus==='buildings-left',report.runs.at(-1));
  check('4k settled close '+i+' preserves focus scroll and visible motion',stable.focus==='buildings-left'&&Math.abs(before.main-stable.main)<=1&&!!motion.work.running&&motion.active.length===1&&motion.visible.includes(motion.work.running)&&!motion.native?.running,{before,stable,motion});
 }
 const after=await nativeSnapshot(p);check('Native records unchanged',JSON.stringify(original.collections)===JSON.stringify(after.collections));check('No runtime errors',session.errors.length===0,session.errors);check('Frozen candidate unchanged',sha(fs.readFileSync(PAGE))===CANDIDATE_SHA);
}catch(e){check('Focused dialog timing execution',false,e.stack);}finally{if(session)await session.browser.close();await guard.closeAll();report.guard=guard;check('Every non-GET blocked',guard.nonGetSeen.length===guard.blocked.length);check('No operational write attempted',!guard.nonGetSeen.some(r=>r.operational));const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));check('No unexpected console error',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;fs.writeFileSync(path.join(OUT,'dialog-focus842.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,candidate:CANDIDATE_SHA}));if(report.passed!==report.total)process.exitCode=1;}})().catch(e=>{console.error(e.message);process.exitCode=2;});
