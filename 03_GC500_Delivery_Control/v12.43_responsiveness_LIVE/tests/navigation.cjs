/* Author: Andrew Fisher. Private native navigation proof; service writes denied. */
'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const {openCandidate}=require('./candidate_harness.cjs');
(async()=>{const s=await openCandidate(),checks=[];
const add=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);};
try{
 const original=await s.page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
 await s.page.emulateMedia({reducedMotion:'no-preference'});await s.page.evaluate(()=>{localStorage.setItem('gc500.motion','subtle');motionApply();});
 const first=await s.page.evaluate(async()=>{go('today');const p=document.getElementById('pane-today');window.__firstNavAnimation=p.getAnimations().find(a=>a.animationName==='paneIn');return {active:state.tab,shown:!!p.offsetHeight,focus:document.activeElement===p,arrive:p.classList.contains('arrive'),animation:getComputedStyle(p).animationName,motion:document.documentElement.dataset.motion,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,inline:p.style.cssText,childAnimation:getComputedStyle(p.firstElementChild).animationName,hasAnimation:!!window.__firstNavAnimation};});
 add('Today arrives visible with native focus and class',first.active==='today'&&first.shown&&first.focus&&first.arrive,first);
 if(process.env.MOTION_BASE){const base=JSON.parse(fs.readFileSync(process.env.MOTION_BASE));const b=base.checks[0].detail;add('Native motion policy matches original live page',first.animation===b.animation&&first.hasAnimation===b.hasAnimation&&first.childAnimation===b.childAnimation&&first.motion===b.motion&&first.reduced===b.reduced,first);}
 const second=await s.page.evaluate(async()=>{const m=document.querySelector('main');m.scrollTop=200;const saved=m.scrollTop;go('about');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));go('today');const p=document.getElementById('pane-today'),animation=p.getAnimations().find(a=>a.animationName==='paneIn');const restarted=!!animation&&animation!==window.__firstNavAnimation;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {saved,actual:m.scrollTop,shown:!!p.offsetHeight,focus:document.activeElement===p,restarted};});
 if(process.env.MOTION_BASE){const base=JSON.parse(fs.readFileSync(process.env.MOTION_BASE));const b=base.checks.find(x=>x.name==='Returning restores native tab scroll and focus').detail;add('Returning retains the original motion behaviour',second.restarted===b.restarted,second);}
 add('Returning restores native tab scroll and focus',second.saved>0&&Math.abs(second.actual-second.saved)<2&&second.shown&&second.focus,second);
 const refresh=await s.page.evaluate(async()=>{go('costs');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const m=document.querySelector('main');m.scrollTop=300;const before=m.scrollTop;renderCosts();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {before,after:m.scrollTop,tab:state.tab};});
 add('Costs same-tab refresh retains scroll',refresh.before>0&&Math.abs(refresh.before-refresh.after)<2&&refresh.tab==='costs',refresh);
 await s.page.screenshot({path:process.env.OUT+'/costs-phone.png'});
 await s.page.emulateMedia({reducedMotion:'reduce'});
 const reduced=await s.page.evaluate(async()=>{go('today');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const p=document.getElementById('pane-today');return {root:getComputedStyle(p).animationName,child:getComputedStyle(p.firstElementChild).animationName,focus:document.activeElement===p};});
 add('Reduced-motion preference remains honoured',reduced.root==='none'&&reduced.child==='none'&&reduced.focus,reduced);
 await s.page.screenshot({path:process.env.OUT+'/today-phone.png'});
 add('Every native document remains unchanged',original===await s.page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))));
 add('No errors or attempted service writes',!s.errors.length&&!s.consoleErrors.length&&!s.counts.blocked,{errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked});
 const result={author:'Andrew Fisher',checks,passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length,baseline:s.baseline};fs.writeFileSync(process.env.OUT+'/navigation-browser.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));assert.equal(result.failed,0);
}finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
