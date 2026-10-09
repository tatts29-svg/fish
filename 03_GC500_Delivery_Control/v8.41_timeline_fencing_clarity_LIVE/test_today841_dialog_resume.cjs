// Author: Andrew Fisher. Focused phone dialog/offscreen motion regression, read only.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {installWriteGuard,ready840}=require('../v8.40_today_work_progress_LIVE/test_today840.cjs');
const {motionState}=require('./test_today841.cjs');
const {open}=require('../toolchain/harness/open_page.js');
const {PAGE,OUT,CANDIDATE_SHA}=process.env,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(!PAGE||!OUT||sha(fs.readFileSync(PAGE))!==CANDIDATE_SHA)throw Error('Frozen PAGE, SHA and private OUT required');
fs.mkdirSync(OUT,{recursive:true});
const report={author:'Andrew Fisher',candidate:CANDIDATE_SHA,at:new Date().toISOString(),scope:'Phone dialog restores focus/scroll, stays idle offscreen, resumes on visible track; GET-only',checks:[]};
const check=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name);};
const guard=installWriteGuard();let session;
async function top(p){await p.evaluate(()=>{const m=document.querySelector('main'),b=document.querySelector('#gc500-work-board840');m.scrollTop+=b.getBoundingClientRect().top-m.getBoundingClientRect().top-14;});await p.waitForTimeout(200);}
(async()=>{try{
 session=await open({pageFile:PAGE,hash:'#today',W:390,H:844,dpr:2,mobile:true});const p=session.page;await ready840(p);await p.waitForFunction(()=>TodayWork840.report().groupsMerged);
 await top(p);await p.waitForFunction(()=>!!TodayWork840.report().running);const initial=await motionState(p);
 check('Visible phone track autoplays before the dialog probe',initial.active.length===1&&initial.visible.includes(initial.work.running),initial);
 await p.evaluate(()=>{const m=document.querySelector('main'),r=document.querySelector('[data-tw840-area=buildings] .tw841-motion-track').getBoundingClientRect(),clip=m.getBoundingClientRect();m.scrollTop+=r.bottom-Math.max(0,clip.top)+8;});await p.waitForTimeout(300);
 const offscreen=await motionState(p);check('Probe explicitly positions every track outside the phone viewport',offscreen.visible.length===0&&!offscreen.work.running,offscreen);
 const trigger=await p.locator('[data-tw840-detail=buildings][data-tw840-mode=left]').evaluate(button=>{const r=button.getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,clipTop:Math.max(0,m.top),clipBottom:Math.min(innerHeight,m.bottom),width:innerWidth};});check('Native dialog trigger remains in view without automatic scrolling',trigger.top>=trigger.clipTop&&trigger.bottom<=trigger.clipBottom&&trigger.left>=0&&trigger.right<=trigger.width,trigger);
 await p.locator('[data-tw840-detail=buildings][data-tw840-mode=left]').evaluate(button=>{button.focus({preventScroll:true});button.click();});await p.waitForTimeout(300);
 const before=await p.evaluate(()=>({main:document.querySelector('main').scrollTop,dialog:document.querySelector('#gc500-work-dialog840').open}));
 await p.evaluate(()=>renderToday());await p.waitForTimeout(150);await p.keyboard.press('Escape');
 await p.waitForFunction(()=>!document.querySelector('#gc500-work-dialog840').open&&document.activeElement?.dataset.tw840Focus==='buildings-left',null,{timeout:1500});await p.waitForTimeout(300);
 const after=await p.evaluate(()=>({main:document.querySelector('main').scrollTop,focus:document.activeElement?.dataset.tw840Focus})),motion=await motionState(p);
 check('Native close restores the exact trigger and main scroll',before.dialog&&after.focus==='buildings-left'&&Math.abs(before.main-after.main)<=1,{before,after});
 check('Phone close lands with every decorative track offscreen',motion.visible.length===0,motion);
 check('Offscreen close keeps controller LEDs and track effects stopped',!motion.work.running&&!motion.active.length&&!motion.animations.length,motion);
 await top(p);await p.waitForFunction(()=>!!TodayWork840.report().running,null,{timeout:3000});const visible=await motionState(p);
 check('Scrolling a track back into view resumes exactly one instrument',visible.active.length===1&&visible.visible.includes(visible.work.running)&&visible.active[0].id===visible.work.running&&visible.animations.every(a=>a.id===visible.work.running),visible);
 await p.screenshot({path:path.join(OUT,'phone-dialog-visible-resume.png')});
 check('No browser runtime error',session.errors.length===0,session.errors);
 check('Frozen candidate remains unchanged',sha(fs.readFileSync(PAGE))===CANDIDATE_SHA);
}catch(error){check('Focused dialog execution',false,String(error.message));}finally{
 if(session)await session.browser.close();await guard.closeAll();report.guard=guard;
 check('Every non-GET is blocked',guard.nonGetSeen.length===guard.blocked.length,{seen:guard.nonGetSeen,blocked:guard.blocked});
 check('No operational write attempted',!guard.nonGetSeen.some(r=>r.operational),guard.nonGetSeen);
 const unexpected=guard.consoleErrors.filter(e=>!(/Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>!b.operational&&b.url===e.url)));
 check('No unexpected console error',!unexpected.length,unexpected);
 report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;fs.writeFileSync(path.join(OUT,'dialog-resume841.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({candidate:CANDIDATE_SHA,passed:report.passed,total:report.total}));if(report.passed!==report.total)process.exitCode=1;
}})().catch(error=>{console.error(error.message);process.exitCode=2;});
