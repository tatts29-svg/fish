/* Author: Andrew Fisher. GET-only practice: completion visuals and local Rules-table scrolling. */
const fs=require('fs'),assert=require('assert'),path=require('path'),crypto=require('crypto');
const source=path.resolve(__dirname,'..');
const {open}=require(path.resolve(source,'../toolchain/harness/open_page'));
const out=process.env.OUT||'/tmp/gc500-review1008';fs.mkdirSync(out,{recursive:true});
const live=process.env.LIVE==='1',pageFile=live?undefined:process.env.PAGE||path.resolve(source,'../build/GC500_v10.08/GC500_Delivery_Control_hosted.html');
const report={author:'Andrew Fisher',mode:live?'public':'candidate',sha256:null,checks:[],screenshots:[],errors:[],blocked:0};
const check=(name,ok,details)=>{report.checks.push({name,ok,details});assert(ok,name+': '+JSON.stringify(details));};
const geometry=()=>{
 const main=document.querySelector('main'),details=document.querySelector('#pane-timeline .flow891-rules'),table=details.querySelector('table'),box=details.querySelector('.flow1008-table'),card=details.closest('.flow891');
 const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,width:r.width,right:r.right}};
 return {main:{width:main.clientWidth,scrollWidth:main.scrollWidth,scrollLeft:main.scrollLeft},details:{...rect(details),open:details.open},table:rect(table),box:{...rect(box),clientWidth:box.clientWidth,scrollWidth:box.scrollWidth,scrollLeft:box.scrollLeft,overflow:getComputedStyle(box).overflowX},card:rect(card)};
};
(async()=>{
 for(const mobile of [true,false]){
  const label=mobile?'phone':'desktop',h=await open({pageFile,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
  try{
   const p=h.page;
   const digest=live?await p.evaluate(async()=>{
    const response=await fetch('/v/Coates-GC500-2026',{cache:'no-store'});
    if(!response.ok)throw new Error('Public page GET failed: '+response.status);
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');
   }):crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');
   check(label+' exact served page hash',(!report.sha256||report.sha256===digest)&&(!process.env.EXPECTED_SHA||process.env.EXPECTED_SHA===digest),digest);report.sha256=digest;
   await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
   await p.evaluate(()=>{go('timeline');});
   const chain=await p.evaluate(()=>{let el=document.querySelector('#pane-timeline .flow891-rules');const list=[];while(el){if(el.tagName==='DETAILS')list.unshift(el.className);el=el.parentElement;}return list;});
   for(const cls of chain){const detail=p.locator('#pane-timeline details.'+cls.trim().split(/\s+/).join('.')).first();if(!await detail.evaluate(el=>el.open))await detail.locator(':scope>summary').click();}
   await p.waitForTimeout(100);
   const before=await p.evaluate(geometry);
   await p.evaluate(()=>document.querySelector('#pane-timeline .flow891-rules table').scrollIntoView({block:'center'}));
   await p.waitForTimeout(300);const after=await p.evaluate(geometry);
   check(label+' Rules wrapper contains expanded table',before.details.open&&after.details.open&&after.box.overflow==='auto'&&after.box.width<=after.details.width+1,{before,after});
   check(label+' scrollIntoView does not move main horizontally',after.main.scrollLeft===0&&before.main.scrollLeft===0,{before,after});
   check(label+' card remains within viewport',after.card.x>=0&&after.card.right<=(mobile?390:1440)+1,after.card);
   if(mobile){
    check('phone table remains locally scrollable',after.box.scrollWidth>after.box.clientWidth,after.box);
    await p.evaluate(()=>{document.querySelector('.flow1008-table').scrollLeft=999;});
    const scrolled=await p.evaluate(geometry);check('phone table can be scrolled independently',scrolled.box.scrollLeft>0&&scrolled.main.scrollLeft===0,scrolled);
    const right=out+'/'+label+'-rules-right.png';await p.locator('#pane-timeline .flow891-rules').screenshot({path:right});report.screenshots.push(right);
    await p.evaluate(()=>{document.querySelector('.flow1008-table').scrollLeft=0;});
   }
   const rules=out+'/'+label+'-rules.png';await p.locator('#pane-timeline .flow891-rules').screenshot({path:rules});report.screenshots.push(rules);
   const key=await p.evaluate(()=>allAssets().find(a=>/^P\d/.test(a.key)&&gc500IsComplete897(a.key))?.key);
   check(label+' real completed reference available',!!key,key);
   await p.evaluate(key=>openAsset(key),key);await p.waitForTimeout(250);
   const complete=await p.evaluate(()=>{const el=document.querySelector('#drawer .cmp816 .complete1008-done'),badge=document.querySelector('#drawer .complete1008-badge');return {row:!!el,icon:!!el?.querySelector('svg'),badge:!!badge,label:el?.textContent.trim(),lights:!!document.querySelector('#drawer .cmp816 .sighead'),colour:el&&getComputedStyle(el).color};});
   check(label+' actual completed drawer shows emblem and keeps lamps',complete.row&&complete.icon&&complete.badge&&complete.lights,complete);
   await p.locator('#drawer .cmp816').scrollIntoViewIfNeeded();
   const shot=out+'/'+label+'-complete.png';await p.screenshot({path:shot});report.screenshots.push(shot);
   await p.emulateMedia({reducedMotion:'reduce'});
   const animations=await p.locator('#drawer .cmp816 .complete1008-ring').evaluateAll(els=>els.map(el=>getComputedStyle(el).animationName));
   check(label+' reduced motion disables new pulse',animations.length>0&&animations.every(v=>v==='none'),animations);
   await p.emulateMedia({reducedMotion:'no-preference'});
   await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();});
   const off=await p.locator('#drawer .cmp816 .complete1008-ring').evaluateAll(els=>els.map(el=>getComputedStyle(el).animationName));
   check(label+' Motion Off disables new pulse',off.every(v=>v==='none'),off);
   // Isolated native Save practice: replace only this test realm's renderer and capture all shared writes.
   await p.locator('#dclose').click();
   await p.evaluate(()=>{
    capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';
    window.__save1008Captured=[];SYNC.db.doc=path=>({set:body=>{window.__save1008Captured.push({path,body});return new Promise(()=>{});},delete:()=>{throw Error('Unexpected delete in save visual fixture');}});
    state.tab='timeline';state.day=todayIso();render=()=>{document.querySelector('#pane-timeline').innerHTML=DailyStaff988.html(todayIso());};render();
   });
   const staff=p.locator('#pane-timeline .staff988');await staff.locator('[data-staff988-edit]>summary').click();
   const extra=staff.locator('[data-staff988-extra]');await extra.fill(await extra.inputValue());
   check(label+' availability form marks draft unsaved',await staff.locator('[data-staff988-result]').textContent()==='Unsaved changes');
   await staff.locator('[data-staff988-save]').click();
   check(label+' availability confirmation stays after collapse',!await staff.locator('[data-staff988-edit]').evaluate(el=>el.open)&&/Saved on this device · syncing/.test(await staff.locator('[data-staff988-result]').textContent()));
   const pending=out+'/'+label+'-save-pending.png';await staff.screenshot({path:pending});report.screenshots.push(pending);
   await p.waitForFunction(()=>window.__save1008Captured.length>0,null,{timeout:5000});
   await p.evaluate(()=>{const key=DailyStaff988.key(todayIso()),id=docIdOf(key),body={...S.loads[key],_k:key};SYNC.last.loads[id]=JSON.stringify(body);delete SYNC.inflight['loads/'+id];delete SYNC.queue.loads[id];SYNC.status='live';SYNC.readonly=false;syncFooter();});
   check(label+' only exact acknowledgement produces shared confirmation',(await staff.locator('[data-staff988-result]').textContent())==='SAVED · shared record updated');
   check(label+' save practice captured native transport',await p.evaluate(()=>window.__save1008Captured.length>0));
   const saved=out+'/'+label+'-save-confirmed.png';await staff.screenshot({path:saved});report.screenshots.push(saved);
   report.errors.push(...h.errors);report.blocked+=h.counts.blocked;
  }finally{await h.browser.close();}
 }
 check('no browser errors',report.errors.length===0,report.errors);check('no operational writes attempted',report.blocked===0,report.blocked);
 fs.writeFileSync(out+'/browser-review.json',JSON.stringify(report,null,2));
 const summary={author:'Andrew Fisher',mode:report.mode,sha256:report.sha256,checks:report.checks.length,passed:true,browserErrors:report.errors.length,operationalWritesAttempted:report.blocked,viewports:['390×844','1440×1000'],scope:['expanded Rules-table containment and independent scrolling','verified completion emblem and retained lights','reduced motion and Motion Off','isolated native availability Save and exact acknowledgement after collapse']};
 fs.writeFileSync(out+'/browser-summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({...summary,screenshots:report.screenshots}));
})().catch(e=>{report.failure=String(e);fs.writeFileSync(out+'/browser-review.json',JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
