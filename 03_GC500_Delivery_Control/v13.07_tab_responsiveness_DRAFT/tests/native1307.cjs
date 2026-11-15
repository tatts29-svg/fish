/* Author: Andrew Fisher. Native source/record preservation and navigation regression. GET-only harness. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const OUT=process.env.OUT;assert(OUT&&path.isAbsolute(OUT),'Private OUT directory required');fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const checks=[];function check(name,ok){checks.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);}
const final=process.env.PAGE,base=process.env.BASE;assert(base&&final&&process.env.STATE,'BASE PAGE STATE required');
const results={};
async function settle(p,ms=300){await p.waitForTimeout(ms);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
(async()=>{
 for(const [kind,file] of [['base',base],['candidate',final]]){
  process.env.PAGE=file;process.env.INITIAL_HASH='#about';
  const s=await openCandidate(),p=s.page,r={};
  try{
   await settle(p,700);
   const original=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
   r.documents=hash(original);
   r.cold=await p.evaluate(async()=>{
    const prior=progress881Model;let reads=0;progress881Model=function(){reads++;return prior.apply(this,arguments);};
    const start=performance.now();go('timeline');const sync=performance.now()-start,initial=reads;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));progress881Model=prior;
    return {sync_ms:sync,paint_ms:performance.now()-start,initial_reads:initial,cards:document.querySelectorAll('#pane-timeline .bc984-day').length,selected:document.querySelector('#pane-timeline .bc984-day.on')?.dataset.day};
   });
   if(kind==='candidate')check('Build initial replay is bounded to selected and cutoff',r.cold.initial_reads<=2&&r.cold.cards>40);
   await settle(p,700);
   r.models=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .bc984-day')].map(card=>({day:card.dataset.day,model:PastDay984.model({iso:card.dataset.day},todayIso(),BuildCards984.progressForDate)})));
   if(kind==='candidate'){
    check('Every native Build day reading equals the live baseline',hash(r.models)===hash(results.base.models));
    const first=await p.evaluate(()=>{const strip=document.querySelector('#pane-timeline .daystrip');strip.scrollLeft=0;strip.dispatchEvent(new Event('scroll'));return strip.querySelector('.bc984-day')?.dataset.day;});
    await p.waitForFunction(day=>{const c=document.querySelector('#pane-timeline .bc984-day[data-day="'+day+'"]');return c?.dataset.buildProgress!=='pending';},first,{timeout:15000});
    check('Scrolling resolves the newly visible historical card',true);
    await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
    const print=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .bc984-day')].map(c=>({day:c.dataset.day,status:c.dataset.buildProgress,reading:c.querySelector('.bc984-percentage')?.textContent})));
    check('Print contains no pending past Build reading',print.every(c=>c.day>=new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Brisbane'})||c.status!=='pending'));
    check('Printed Build values equal native models',print.every(c=>{const m=r.models.find(x=>x.day===c.day)?.model;return m&&(!m.past||c.reading===(m.percent===null?'Not recorded':(m.bound?'≥':'')+m.text+'%'));}));
    await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
    await p.screenshot({path:path.join(OUT,'build-'+(process.env.MOB==='1'?'phone':'desktop')+'.png')});
   }
   await p.evaluate(()=>go('demob'));await settle(p,500);await p.evaluate(()=>go('about'));await settle(p,600);
   r.hidden=await p.evaluate(async()=>{let count=0;const raw=demob816;demob816=function(){count++;return raw.apply(this,arguments);};const x=document.createElement('span');x.dataset.test1307='hidden';document.getElementById('pane-demob').append(x);await new Promise(r=>setTimeout(r,250));x.remove();await new Promise(r=>setTimeout(r,100));demob816=raw;return count;});
   if(kind==='candidate')check('Hidden Demob mutation performs no Demob model work',r.hidden===0);
   await p.evaluate(()=>go('vms'));await settle(p,1000);
   r.vms=await p.evaluate(async()=>{let builds=0;const raw=buildAllAssets;buildAllAssets=function(){builds++;return raw.apply(this,arguments);};const t=performance.now();VMS1024.render();const ms=performance.now()-t;buildAllAssets=raw;return {builds,ms,text:document.getElementById('pane-vms').innerText,model:holdAssets(()=>VMSArrival1098.count())};});
   if(kind==='candidate'){
    check('Direct VMS redraw builds one fresh asset snapshot',r.vms.builds===1);
    check('VMS board status and rendered facts equal baseline',hash(r.vms.model)===hash(results.base.vms.model)&&hash(r.vms.text)===hash(results.base.vms.text));
   }
   await p.evaluate(()=>go('today'));await settle(p);
   r.rapid=await p.evaluate(async()=>{document.querySelector('#tabs [data-tab="timeline"]').click();document.querySelector('#tabs [data-tab="plant"]').click();document.querySelector('#tabs [data-tab="demob"]').click();await new Promise(r=>setTimeout(r,100));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {tab:state.tab,visible:[...document.querySelectorAll('main>.pane')].filter(x=>!x.hidden&&x.offsetHeight>0).map(x=>x.id),busy:document.querySelectorAll('#tabs .busy').length};});
   check(kind+' rapid tab clicks settle on the last requested pane',r.rapid.tab==='demob'&&r.rapid.visible.length===1&&r.rapid.visible[0]==='pane-demob'&&r.rapid.busy===0);
   r.money=await p.evaluate(()=>holdAssets(()=>{const m=moneySummary(),p=pl770Model();return JSON.parse(JSON.stringify({money:m,pl:p}));}));
   if(kind==='candidate')check('Native financial outputs unchanged',hash(r.money)===hash(results.base.money));
   check(kind+' every operational document unchanged',original===await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))));
   check(kind+' no runtime/console errors or attempted writes',!s.errors.length&&!s.consoleErrors.length&&!s.counts.blocked);
   r.errors=s.errors;r.console=s.consoleErrors;r.writes=s.counts.blocked;results[kind]=r;
   fs.writeFileSync(path.join(OUT,kind+'-native-private.json'),JSON.stringify(r,null,2),{mode:0o600});
  }finally{await s.browser.close();}
 }
 const report={author:'Andrew Fisher',checks,passed:checks.filter(x=>x.ok).length,failed:checks.filter(x=>!x.ok).length,desktop:process.env.MOB!=='1',base:{cold:results.base.cold,hiddenDemobCalls:results.base.hidden,vmsBuilds:results.base.vms.builds,vmsRenderMs:results.base.vms.ms},candidate:{cold:results.candidate.cold,hiddenDemobCalls:results.candidate.hidden,vmsBuilds:results.candidate.vms.builds,vmsRenderMs:results.candidate.vms.ms},modelsSha:hash(results.candidate.models),moneySha:hash(results.candidate.money)};
 fs.writeFileSync(path.join(OUT,'native-summary.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{fs.writeFileSync(path.join(OUT,'native-failure.json'),JSON.stringify({checks,error:e.message},null,2));console.error(e.stack);process.exitCode=1;});

