/* Author: Andrew Fisher. Expanded control/table contrast audit; GET-only service access.
   PAGE is an isolated candidate. LIVE=1 uses actual public bytes. No native edits. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
process.env.PAGE ||= '/workspace/private-argon-review-14Oct2026/live.html';
const {auditRendered}=require(root+'/v10.07_contrast_charges_LIVE/check_contrast1007.cjs');
const {open}=require(root+'/toolchain/harness/open_page');
const out=process.env.OUT||'/workspace/private-contrast1012-check';fs.mkdirSync(out,{recursive:true});
const mobile=process.env.MODE!=='desktop',mode=mobile?'phone':'desktop',scheme=process.env.SCHEME||'light',access=process.env.EDIT==='0'?'view':'edit';
const report={author:'Andrew Fisher',mode,scheme,access,checks:[],audits:[],errors:[],writes:[],limitations:'Solid colours and representative CSS gradient stops measured; image backgrounds require the paired visual review. Edit access is an isolated test capability; all operational writes are trapped and blocked.'};
const check=(name,ok,detail)=>{report.checks.push({name,ok,...(detail===undefined?{}:{detail})});assert(ok,name+': '+JSON.stringify(detail));};
const controlSelector=base=>['button','a.btn','input','textarea','select','table','label','legend'].map(x=>base+' '+x).join(',');
(async()=>{let h;try{
 h=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
 await p.emulateMedia({colorScheme:scheme});
 const actual=await p.evaluate(async()=>{const response=await fetch('/v/Coates-GC500-2026/?contrast1012=1',{cache:'no-store'});const bytes=await response.arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')});
 const expected=process.env.EXPECTED_SHA||crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
 check('exact page bytes',actual===expected,{actual,expected});report.sha256=actual;
 const version=await p.evaluate(()=>SYNC.backend.readVersion821());
 await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:access})}));
 await p.evaluate(access=>{window.__contrast1012Writes=[];SYNC.db.doc=key=>({set:()=>{__contrast1012Writes.push('set:'+key);return new Promise(()=>{})},delete:()=>{__contrast1012Writes.push('delete:'+key);return new Promise(()=>{})}});capability=()=>access;canEdit=()=>access==='edit';mayWrite=()=>false;SYNC.readonly=access!=='edit';SYNC.level=access;applyCapability();},access);
 const audit=async(name,selector,frame=p)=>{const result=await frame.evaluate(auditRendered,selector);const failures=result.groups.filter(x=>x.ratio<x.min&&!x.image);report.audits.push({name,...result,failures});check(name+' readable controls and table text',failures.length===0,failures);return result;};
 const statuses=async(host,name)=>{
  if(!await p.evaluate(()=>!!window.SelectionSave1012))return;
  await p.evaluate(host=>{const parent=document.querySelector(host);if(!parent)throw Error('Missing status fixture host '+host);for(const state of ['idle','dirty','local','shared','error','changed']){const box=document.createElement('span');box.className='selection1012-controls';box.dataset.selection1012State=state;box.dataset.contrast1012Fixture='';const text=document.createElement('span');text.dataset.selection1012Status='';text.textContent=state==='shared'?'Saved · shared record updated':state==='local'?'Saved on this device · syncing…':state==='dirty'?'Unsaved change':state==='changed'?'Record changed · review this field':state==='error'?'Not saved · keep this page open':'No new change to save';box.append(text);parent.append(box)}},host);
  await audit(name+' all Save status colours',host+' [data-contrast1012-fixture]');
  await p.evaluate(()=>document.querySelectorAll('[data-contrast1012-fixture]').forEach(e=>e.remove()));
 };
 const openDetails=async()=>{await p.evaluate(()=>{const pane=document.querySelector('main .pane:not([hidden])');pane.querySelectorAll('details').forEach(x=>x.open=true);pane.querySelectorAll('.lc991-detail[hidden]').forEach(x=>x.hidden=false)});await p.waitForTimeout(120)};
 const tabs=process.env.TABS?process.env.TABS.split(','):await p.evaluate(()=>TABS.map(x=>x[0]));
 for(const tab of tabs){await p.evaluate(tab=>go(tab),tab);await p.waitForTimeout(180);await openDetails();await audit(tab,controlSelector('main .pane:not([hidden])'));
  if(tab==='timeline'){
   const b=p.locator('[data-loading1012-clear],[data-door872-clear]').filter({visible:true}).first();
   check('Build loading selection is rendered',await p.locator('#pane-timeline [data-loading1012-choice],#pane-timeline [data-door872-ref]').count()>0);
   if(access==='edit'){
    check('Build Clear action is available',await b.count()>0);await b.evaluate(e=>{const t=e.closest('.lc991')?.querySelector('.lc991-toggle');if(t?.getAttribute('aria-expanded')==='false')t.click()});await p.evaluate(()=>document.querySelectorAll('#pane-timeline details').forEach(d=>d.open=true));await b.scrollIntoViewIfNeeded();
    for(const state of ['default','hover','focus','disabled']){
     if(state==='hover')await b.hover({force:true});
     if(state==='focus'){await p.mouse.move(0,0);await p.keyboard.press('Tab');await b.focus()}
     if(state==='disabled')await b.evaluate(e=>{e.__contrast1012Disabled=e.disabled;e.disabled=true});
     await p.waitForTimeout(170);await b.evaluate(e=>e.dataset.contrast1012Check='clear');await audit('Build Clear '+state,'[data-contrast1012-check="clear"]');
     if(state==='focus'){const ring=await b.evaluate(e=>({style:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth,shadow:getComputedStyle(e).boxShadow,focus:e.matches(':focus'),visible:e.matches(':focus-visible'),active:document.activeElement?.outerHTML.slice(0,150)}));check('Build Clear has a visible focus ring',ring.style!=='none'&&parseFloat(ring.width)>=2,ring)}
     if(state==='disabled')await b.evaluate(e=>e.disabled=e.__contrast1012Disabled);
    }
    await b.evaluate(e=>delete e.dataset.contrast1012Check);await p.mouse.move(0,0);await b.evaluate(e=>e.blur());await p.waitForTimeout(200);
    await p.screenshot({path:path.join(out,'build-loading.png')});await statuses('#pane-timeline .lc991:not([hidden]) .timeline908-plans','dark Build');
   }
  }
  if(tab==='map'){
   await p.waitForFunction(()=>EXP.loaded,null,{timeout:60000});const f=await p.locator('#expFrame').elementHandle().then(e=>e.contentFrame());await f.waitForFunction(()=>document.getElementById('q'),null,{timeout:60000});
   await audit('map frame',controlSelector('body'),f);
  }
 }
 // Each finance subview has its own native forms, including POA transport and rates.
 if(tabs.includes('costs')){
  await p.evaluate(()=>go('costs'));const views=await p.evaluate(()=>[...document.querySelectorAll('#pane-costs [data-finance857],#pane-costs [data-finance888]')].map(e=>({attr:e.hasAttribute('data-finance857')?'data-finance857':'data-finance888',value:e.getAttribute('data-finance857')||e.getAttribute('data-finance888')})));
  for(const view of views){await p.evaluate(v=>document.querySelector('#pane-costs ['+v.attr+'="'+v.value+'"]')?.click(),view);await p.waitForTimeout(160);await openDetails();await audit('finance '+view.value,controlSelector('#pane-costs'))}
 }
 for(const ref of ['P33','WC09','GN20']){
  await p.evaluate(ref=>{openAsset(ref);document.querySelectorAll('#drawer details').forEach(d=>d.open=true)},ref);await p.waitForTimeout(180);await audit('drawer '+ref,controlSelector('#drawer'));
  if(ref==='P33'){
   const b=p.locator('#drawer [data-loading1012-clear],#drawer [data-door872-clear]').filter({visible:true}).first();
   if(access==='edit'&&await b.count()){await b.scrollIntoViewIfNeeded();await p.keyboard.press('Tab');await b.focus();await audit('drawer loading focus',controlSelector('#drawer .loading872'));await p.screenshot({path:path.join(out,'drawer-loading.png')});await statuses('#drawer .loading872','light drawer')}
  }
  await p.locator('#drawer .close').click({force:true});
 }
 await p.evaluate(()=>timeline841Dialog('P33'));await audit('dark progress dialog',controlSelector('#timeline841-dialog'));await p.screenshot({path:path.join(out,'progress-dialog.png')});await statuses('#timeline841-dialog','dark dialog');await p.evaluate(()=>timeline841Close(false));
 await p.evaluate(()=>machineOpen('machine'));await p.waitForFunction(()=>MACHINE.open&&!document.getElementById('machine').hidden);await audit('machine modal header',controlSelector('#machine .mtop'));await p.screenshot({path:path.join(out,'machine-header.png')});await p.evaluate(()=>machineClose());
 report.writes=await p.evaluate(()=>__contrast1012Writes);report.errors=h.errors;report.network=h.counts;
 check('no native save requests',report.writes.length===0,report.writes);check('no operational requests',h.counts.blocked===0,h.counts);check('no page errors',h.errors.length===0,h.errors);
 console.log(JSON.stringify({passed:true,checks:report.checks.length,audits:report.audits.length,mode,scheme,access,sha256:actual}));
 }catch(error){report.failure=String(error);throw error}finally{fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(report,null,2));if(h)await h.browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
