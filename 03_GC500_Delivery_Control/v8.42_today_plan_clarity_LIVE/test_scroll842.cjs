// Author: Andrew Fisher. Read-only print/redraw geometry diagnostic; private evidence only.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840,nativeSnapshot}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const groupQA=require('../v8.41_timeline_fencing_clarity_LIVE/test_group_ownership841.cjs');
const frontQA=require('./test_front842.cjs');
const {open}=require('../toolchain/harness/open_page.js');
const {PAGE,OUT,CANDIDATE_SHA}=process.env,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(!PAGE||!OUT||sha(fs.readFileSync(PAGE))!==CANDIDATE_SHA)throw Error('Frozen PAGE/SHA and private OUT required');
fs.mkdirSync(OUT,{recursive:true});const report={author:'Andrew Fisher',candidate:CANDIDATE_SHA,at:new Date().toISOString(),checks:[],samples:[]};
const save=()=>fs.writeFileSync(path.join(OUT,'scroll842.json'),JSON.stringify(report,null,2));
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name);save();};
const guard=installWriteGuard();let session;
async function snapshot(p,label){const value=await p.evaluate(()=>{
 const m=document.querySelector('main'),board=document.querySelector('#gc500-work-board840'),rect=n=>{const r=n.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,width:r.width};};
 return {top:m.scrollTop,height:m.scrollHeight,client:m.clientHeight,max:m.scrollHeight-m.clientHeight,focus:document.activeElement?.dataset.tw840Focus,body:document.body.className,main:rect(m),board:rect(board),heading:rect(document.querySelector('[data-tw840-area=equipment] h3')),report:TodayWork840.report(),folds:[...board.querySelectorAll('[data-tw841-group-card],[data-tw842-plan-fold]')].map(d=>({id:d.dataset.tw841GroupCard||d.dataset.tw842PlanFold,kind:d.dataset.tw841GroupCard?'group':'plan',open:d.open,rect:rect(d)})),cards:[...board.querySelectorAll('[data-tw840-area]')].map(d=>({id:d.dataset.tw840Area,rect:rect(d),css:d.getAttribute('style')})),siblings:[...document.querySelector('#pane-today').children].map(n=>({id:n.id,cls:n.className,rect:rect(n),css:n.getAttribute('style')}))};
 });report.samples.push({label,...value});save();console.log(label,JSON.stringify({top:value.top,max:value.max,board:value.board.height,heading:value.heading.top}));return value;}
async function redraw(p,label){await p.locator('[data-tw840-jump=equipment]').click();await p.waitForTimeout(700);const before=await snapshot(p,label+' before');await p.evaluate(()=>renderToday());const immediate=await snapshot(p,label+' immediate');await p.waitForTimeout(300);const after=await snapshot(p,label+' settled');await p.evaluate(()=>render());await p.waitForTimeout(300);const full=await snapshot(p,label+' full');await p.waitForTimeout(6500);const polled=await snapshot(p,label+' poll');
 check(label+' preserves focus and scroll through settled Today full and polled refresh',[after,full,polled].every(s=>s.focus===before.focus&&Math.abs(s.top-before.top)<=1),{before,immediate,after,full,polled});}
async function interrupt(p){
 for(const event of ['wheel','touchstart','pointerdown','keydown']){
  await p.locator('[data-tw840-jump=equipment]').click();await p.waitForTimeout(600);
  const setup=await p.evaluate(name=>{const m=document.querySelector('main'),saved=m.scrollTop;renderToday();const clamped=m.scrollTop,max=m.scrollHeight-m.clientHeight,target=Math.max(0,clamped-400);const e=name==='wheel'?new WheelEvent(name,{bubbles:true,deltaY:-400}):name==='keydown'?new KeyboardEvent(name,{bubbles:true,key:'PageUp'}):new Event(name,{bubbles:true});m.dispatchEvent(e);m.scrollTop=target;return {saved,clamped,max,target,actual:m.scrollTop};},event);
  await p.waitForTimeout(750);const after=await snapshot(p,'controlled '+event+' takeover');
  check(event+' cancellation has a genuinely pending clamped restore',setup.saved>setup.clamped+1,setup);
  check(event+' cancellation preserves the requested user position beyond retry deadline',Math.abs(setup.actual-after.top)<=1,{setup,after});
 }
 await p.locator('[data-tw840-jump=equipment]').click();await p.waitForTimeout(600);await p.mouse.move(1800,1400);
 const saved=await p.evaluate(()=>{const m=document.querySelector('main'),v=m.scrollTop;renderToday();return {saved:v,clamped:m.scrollTop};});await p.mouse.wheel(0,-600);await p.waitForTimeout(650);const first=await snapshot(p,'trusted wheel settled');await p.waitForTimeout(300);const second=await snapshot(p,'trusted wheel later');
 check('Trusted browser wheel takes over without a later snap',first.top<saved.saved-200&&Math.abs(first.top-second.top)<=1,{saved,first,second});
 await p.locator('[data-tw840-jump=equipment]').click();await p.waitForTimeout(600);
 const modal=await p.evaluate(()=>{const m=document.querySelector('main'),saved=m.scrollTop;renderToday();const clamped=m.scrollTop;document.querySelector('[data-tw840-detail=equipment][data-tw840-mode=left]').click();return {saved,clamped,top:m.scrollTop,open:document.querySelector('#gc500-work-dialog840').open};});await p.waitForTimeout(750);
 const modalAfter=await p.evaluate(()=>({top:document.querySelector('main').scrollTop,open:document.querySelector('#gc500-work-dialog840').open}));check('Programmatic detail opening cancels pending scroll without moving behind the dialog',modal.saved>modal.clamped+1&&modal.open&&modalAfter.open&&Math.abs(modal.top-modalAfter.top)<=1,{modal,modalAfter});await p.keyboard.press('Escape');
 await p.locator('[data-tw840-jump=equipment]').click();await p.waitForTimeout(600);
 const navigation=await p.evaluate(()=>{const m=document.querySelector('main'),saved=m.scrollTop;renderToday();const clamped=m.scrollTop;go('timeline');m.scrollTop=120;return {saved,clamped,top:m.scrollTop,tab:state.tab};});await p.waitForTimeout(750);
 const navigationAfter=await p.evaluate(()=>({top:document.querySelector('main').scrollTop,tab:state.tab}));check('Pending restore cannot cross native navigation into another tab',navigation.saved>navigation.clamped+1&&navigationAfter.tab==='timeline'&&Math.abs(navigation.top-navigationAfter.top)<=1,{navigation,navigationAfter});await p.evaluate(()=>go('today'));await p.waitForFunction(()=>TodayWork840.report().groupsMerged);await p.waitForTimeout(300);
 await redraw(p,'after user takeover normal redraw');
}
(async()=>{try{
 session=await open({pageFile:PAGE,hash:'#today',W:3840,H:2160,dpr:1});const p=session.page;await ready840(p);await p.waitForFunction(()=>TodayWork840.report().groupsMerged&&typeof todayWorkSummary842==='function');const original=await nativeSnapshot(p);
 if(process.env.TRACE_ONLY==='1')await p.evaluate(()=>{
  window.__scrollTrace842=[];const info=()=>{const m=document.querySelector('main');return {top:m.scrollTop,max:m.scrollHeight-m.clientHeight,height:m.scrollHeight,client:m.clientHeight,focus:document.activeElement?.dataset.tw840Focus};};
  const originalCapture=TodayWork840.capture,originalRestore=TodayWork840.restore;
  TodayWork840.capture=function(){const s=originalCapture.apply(this,arguments);__scrollTrace842.push({stage:'capture',saved:s?.scroll?.top,...info()});return s;};
  TodayWork840.restore=function(s){__scrollTrace842.push({stage:'restore before',saved:s?.scroll?.top,...info()});const value=originalRestore.apply(this,arguments);__scrollTrace842.push({stage:'restore after',saved:s?.scroll?.top,...info()});queueMicrotask(()=>__scrollTrace842.push({stage:'restore microtask',...info()}));requestAnimationFrame(()=>__scrollTrace842.push({stage:'restore frame',...info()}));return value;};
 });
 await snapshot(p,'initial');await redraw(p,'fresh no-print');
 if(process.env.TRACE_ONLY==='1'){report.trace=await p.evaluate(()=>__scrollTrace842);save();console.log(JSON.stringify(report.trace));return;}
 await frontQA.exercisePlanFolds842(p,check,'4k diagnostic');await groupQA.exerciseGroupFolds841(p,check,'4k diagnostic',OUT);await snapshot(p,'all folds exercised');
 await frontQA.exercisePrint842(p,check,'4k diagnostic',OUT,groupQA.exerciseTodayPrint841);await snapshot(p,'after print and fold cleanup');await redraw(p,'after print');
 if(process.env.INTERRUPT==='1')await interrupt(p);
 await p.screenshot({path:path.join(OUT,'4k-after-print-redraw.png')});check('Native records unchanged',JSON.stringify(original.collections)===JSON.stringify((await nativeSnapshot(p)).collections));check('No runtime errors',session.errors.length===0,session.errors);check('Frozen candidate unchanged',sha(fs.readFileSync(PAGE))===CANDIDATE_SHA);
}catch(e){check('Focused diagnostic execution',false,e.stack);}finally{if(session)await session.browser.close();await guard.closeAll();report.guard=guard;check('Every non-GET blocked',guard.nonGetSeen.length===guard.blocked.length);check('No operational write attempted',!guard.nonGetSeen.some(r=>r.operational));const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));check('No unexpected console error',!unexpected.length,unexpected);report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;save();console.log(JSON.stringify({passed:report.passed,total:report.total,candidate:CANDIDATE_SHA}));if(report.passed!==report.total)process.exitCode=1;}})().catch(e=>{console.error(e.message);process.exitCode=2;});
