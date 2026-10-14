/* Author: Andrew Fisher. Native Save reassurance under isolated document capture; no service writes. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');
// Convert version answers only inside this isolated practice browser. Transform
// after the awaited GET so a previously in-flight view answer cannot undo the
// local edit simulation while the user is typing. All request methods stay guarded.
const fetcher=require('../../toolchain/harness/curlfetch'),fetchBefore=fetcher.curlFetch;let practiceEdit=false;
fetcher.curlFetch=async function(url,...args){const result=await fetchBefore.call(this,url,...args);if(practiceEdit&&new URL(url).pathname==='/api/version'&&result.status===200){const body=JSON.parse(result.body);body.level='edit';return {...result,body:JSON.stringify(body)};}return result;};
const{open}=require(process.env.HARNESS||'../../record_14Oct2026_purchase_order/readonly_page.cjs');
const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});const report={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),checks:[]};
function ck(name,pass,detail){report.checks.push({name,pass:!!pass,...detail?{detail}:{}});if(!pass)throw Error(name+': '+JSON.stringify(detail));}
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844});const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
 const version=await p.evaluate(()=>SYNC.backend.readVersion821());report.nativeVersion=version;
 if(process.env.TIMINGS==='1'){report.renderTimings=[];for(const route of ['about','costs','timeline','plant']){const milliseconds=await p.evaluate(route=>{const start=performance.now();go(route);return performance.now()-start;},route);report.renderTimings.push({route,milliseconds:Math.round(milliseconds)});}}
 practiceEdit=true;
 await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:'edit'})}));
 await p.evaluate(()=>{capability=()=> 'edit';canEdit=()=>true;mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';window.__save1018Captured=[];SYNC.db.doc=path=>({set:body=>{__save1018Captured.push({path,body});return new Promise(()=>{});},delete:()=>{__save1018Captured.push({path,body:null});return new Promise(()=>{});}});go('timeline');openAsset('P33');});await p.waitForTimeout(350);
 const field=p.locator('#drawer input[data-branch]').first();await field.evaluate(el=>{for(let d=el.closest('details');d;d=d.parentElement.closest('details'))d.open=true;SelectionSave1012.mount();el.scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));});
 const setup=await field.evaluate(el=>{const f=SelectionSave1012.family(el);window.__save1018Key=SelectionSave1012.identity(el,f);window.__save1018Before=JSON.stringify(f.collections.map(c=>toDocs(c)));return {key:__save1018Key,old:el.value,next:el.value==='NOIS'?'KINP':'NOIS',family:f.id};});
 const bar=()=>p.locator('#drawer .selection1012-controls[data-selection1012-key='+JSON.stringify(setup.key)+']').first();
 ck('Native field has one adjacent explicit Save',await bar().count()===1&&await bar().locator('[data-selection1012-save]').count()===1,{family:setup.family});
 await field.fill(setup.next);
 const draft=await p.evaluate(()=>{const a=SelectionSave1012.attempts.get(__save1018Key),f=SelectionSave1012.families.find(x=>x.id==='asset-branch'),b=[...document.querySelectorAll('.selection1012-controls')].find(x=>x.dataset.selection1012Key===__save1018Key),el=document.querySelector('#drawer input[data-branch]');return {dirty:a?.dirty,text:b?.querySelector('[data-selection1012-status]').textContent,state:b?.dataset.selection1012State,nativeUnchanged:JSON.stringify(f.collections.map(c=>toDocs(c)))===__save1018Before,field:el?.value,attempt:a,active:document.activeElement===el,capability:capability(),readonly:SYNC.readonly,level:SYNC.level,disabled:el?.disabled,readOnly:el?.readOnly};});
 ck('Practice capability remains consistently editable',draft.capability==='edit'&&!draft.readonly&&draft.level==='edit');
 ck('Typed draft says Unsaved and has not changed native documents',draft.dirty&&draft.state==='dirty'&&draft.text==='Unsaved change'&&draft.nativeUnchanged,draft);
 const position=()=>{const d=document.getElementById('drawer'),db=d.querySelector('.db');return {top:d.scrollTop,body:db.scrollTop,open:d.classList.contains('on'),folds:Persistence1010.capture(d,false).folds.filter(x=>x[1]).map(x=>x[0])};};
 const before=await p.evaluate(position);await p.evaluate(()=>Idle1006.redraw());await p.waitForTimeout(200);
 ck('Draft and focus remain through background redraw',await field.inputValue()===setup.next&&await field.evaluate(el=>document.activeElement===el));
 await bar().locator('[data-selection1012-save]').click();await p.waitForTimeout(250);
 const local=await p.evaluate(()=>{const a=SelectionSave1012.attempts.get(__save1018Key),b=[...document.querySelectorAll('.selection1012-controls')].find(x=>x.dataset.selection1012Key===__save1018Key);return {accepted:a?.accepted,count:a?.expected?.length,state:b?.dataset.selection1012State,text:b?.querySelector('[data-selection1012-status]').textContent};});
 ck('Save awaits acknowledgement and never claims shared persistence early',local.accepted&&local.count>0&&local.state==='local'&&local.text.includes('Saved on this device')&&!local.text.includes('shared record'),local);
 const after=await p.evaluate(position);ck('Save preserves drawer disclosures and reading position',after.open&&before.folds.every(k=>after.folds.includes(k))&&Math.abs(before.top-after.top)<50&&Math.abs(before.body-after.body)<50,{before,after});
 await p.evaluate(()=>{SYNC.unkept=true;SelectionSave1012.refresh();});const failed=await bar().locator('[data-selection1012-status]').textContent();ck('Failed device persistence is visibly Not saved',failed==='Not saved · keep this page open',{text:failed});
 await p.evaluate(()=>{SYNC.unkept=false;const a=SelectionSave1012.attempts.get(__save1018Key);for(const d of a.expected){SYNC.last[d.collection]??={};if(d.expected===null)delete SYNC.last[d.collection][d.id];else SYNC.last[d.collection][d.id]=d.expected;delete SYNC.queue[d.collection]?.[d.id];delete SYNC.inflight[d.collection+'/'+d.id];}SelectionSave1012.refresh();});
 const acknowledged=await bar().locator('[data-selection1012-status]').textContent();ck('Exact document acknowledgement enables shared Saved',acknowledged==='Saved · shared record updated',{text:acknowledged});
 await bar().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'phone-save-shared.png')});
 ck('No application errors or operational request escaped capture',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,requests:h.counts});report.errors=h.errors;report.requests=h.counts;report.captured=await p.evaluate(()=>__save1018Captured.length);
 }catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();fs.writeFileSync(path.join(out,'save-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(x=>!x.pass),failure:report.failure}));}
})();
