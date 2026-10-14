/* Author: Andrew Fisher. Frozen-record diagnostic of native drawer Save; writes captured only. Original assertions preserved with detailed evidence. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const fetcher=require('../../toolchain/harness/curlfetch'),fixture=JSON.parse(fs.readFileSync(process.env.STATE)),fetchBefore=fetcher.curlFetch;
fetcher.curlFetch=async function(url,...args){const pathname=new URL(url).pathname;if(pathname==='/api/state'||pathname==='/api/version')return {status:200,headers:{'content-type':'application/json'},body:JSON.stringify(pathname==='/api/state'?fixture:{version:fixture.version,level:'view',updated:fixture.updated})};return fetchBefore.call(this,url,...args);};
const {open}=require('../../toolchain/harness/open_page');
const out=process.env.OUT||'/workspace/private-gc5001012-selection-drawers';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',nativeVersion:fixture.version,candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),checks:[],errors:[],nativeWrites:0};
const check=(name,ok,details)=>{report.checks.push({name,ok,details});assert(ok,name+': '+JSON.stringify(details));};
(async()=>{for(const mobile of (process.env.FOCUS_ONLY?Array.from({length:Number(process.env.REPEAT)||1},()=>true):[true,false])){
 const label=mobile?'phone':'desktop',h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
 try{
 const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
 const version=await p.evaluate(()=>SYNC.backend.readVersion821());await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:'edit'})}));
 await p.evaluate(()=>{
  capability=()=> 'edit';canEdit=()=>true;mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';
  window.__drawerWrites=[];SYNC.db.doc=path=>({set:body=>{__drawerWrites.push({path,body});return new Promise(()=>{});},delete:()=>{__drawerWrites.push({path,body:null});return new Promise(()=>{});}});
  window.__drawerTrace=[];for(const kind of ['focusin','focusout','blur','input','change'])document.addEventListener(kind,e=>{if(e.target.matches?.('input[data-branch]'))__drawerTrace.push({kind,time:performance.now(),value:e.target.value,isConnected:e.target.isConnected,active:document.activeElement===e.target,capability:capability(),readonly:SYNC.readonly,level:SYNC.level,disabled:e.target.disabled,readOnly:e.target.readOnly,family:SelectionSave1012.family(e.target)?.id,key:SelectionSave1012.family(e.target)&&SelectionSave1012.identity(e.target,SelectionSave1012.family(e.target)),selected:state.sel});},true);
  window.__drawerNativeEvents=0;document.addEventListener('change',e=>{if(SelectionSave1012.family(e.target))__drawerNativeEvents++;},true);
  go('timeline');openAsset('P33');
 });
 await p.waitForTimeout(200);
 for(const family of ['asset-branch','rental','supplied','charge-selection']){
  const selector={'asset-branch':'input[data-branch]','rental':'#rentalSel','supplied':'input[data-supq]','charge-selection':'input[data-stairs1006-select]'}[family];
  const setup=await p.evaluate(({selector,family})=>{
   let el=document.querySelector('#drawer '+selector);if(!el)return {found:false};
   if(family==='rental'&&![...el.options].some(o=>o.value&&o.value!=='+new'&&o.value!==el.value)){S.contracts['PRACTICE-1012']={rental_id:'PRACTICE-1012'};openAsset('P33',{keep:true});el=document.querySelector('#drawer '+selector);}
   for(let d=el.closest('details');d;d=d.parentElement.closest('details'))d.open=true;
   SelectionSave1012.mount();const f=SelectionSave1012.family(el),key=SelectionSave1012.identity(el,f);window.__drawerField={selector,family,key};
   window.__drawerBeforeDoc=JSON.stringify(f.collections.map(c=>toDocs(c)));
   let next;if(family==='asset-branch')next=el.value==='NOIS'?'KINS':'NOIS';
   else if(family==='rental')next=[...el.options].find(o=>o.value&&o.value!=='+new'&&o.value!==el.value)?.value;
   else if(family==='supplied')next=String(Number(el.value||0)+1);
   else next=!el.checked;
   window.__drawerNext=next;
   const bars=[...document.querySelectorAll('.selection1012-controls')].filter(b=>b.dataset.selection1012Key===key);
   const copies=[...document.querySelectorAll('#drawer '+selector)].filter(n=>SelectionSave1012.identity(n,SelectionSave1012.family(n))===key);
   const adjacent=copies.every(n=>{const label=n.closest('label'),anchor=label&&label.querySelectorAll('input,select,textarea').length===1?label:n;return anchor.nextElementSibling?.classList.contains('selection1012-controls')&&anchor.nextElementSibling.querySelectorAll('[data-selection1012-save]').length===1;});
   return {found:true,nextAvailable:next!==undefined,bars:bars.length,copies:copies.length,adjacent};
  },{selector,family});
  check(label+' '+family+' has one native field Save',setup.found&&setup.nextAvailable&&setup.bars===setup.copies&&setup.adjacent,setup);
  const field=p.locator('#drawer '+selector).first();
  const bar=()=>p.locator('.selection1012-controls').filter({has:p.locator('[data-selection1012-save]')});
  await field.evaluate(el=>{el.scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));});
  if(family==='asset-branch'||family==='supplied'){
   await field.fill(await p.evaluate(()=>__drawerNext));
   const draft=await p.evaluate(()=>{const a=SelectionSave1012.attempts.get(__drawerField.key),f=SelectionSave1012.families.find(f=>f.id===__drawerField.family),current=JSON.stringify(f.collections.map(c=>toDocs(c))),bar=[...document.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key),el=document.querySelector('#drawer '+__drawerField.selector);return {dirty:a?.dirty,accepted:a?.accepted,error:a?.error,state:bar?.dataset.selection1012State,status:bar?.querySelector('[data-selection1012-status]')?.textContent,fieldValue:el?.value,attemptKey:a?.key,currentKey:el&&SelectionSave1012.identity(el,SelectionSave1012.family(el)),capability:capability(),readonly:SYNC.readonly,level:SYNC.level,next:__drawerNext,active:document.activeElement===el,documentsUnchanged:current===__drawerBeforeDoc,events:__drawerTrace,writes:__drawerWrites.length,version:SYNC.backend.readVersion821()};});
   check(label+' '+family+' typed draft is not falsely saved',draft.dirty&&draft.documentsUnchanged,draft);
   if(process.env.FOCUS_ONLY)break;
  }else if(family==='rental')await field.selectOption(await p.evaluate(()=>__drawerNext));
  else await field.setChecked(await p.evaluate(()=>__drawerNext));
  await p.waitForTimeout(100);
  const before=await p.evaluate(()=>{const dr=document.querySelector('#drawer'),bar=[...dr.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key);bar.querySelector('[data-selection1012-save]').scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));return {top:dr.scrollTop,db:dr.querySelector('.db').scrollTop,open:[...dr.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,dr))};});
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key);b.querySelector('[data-selection1012-save]').click();});
  await p.waitForTimeout(180);
  const saved=await p.evaluate(()=>{
   const dr=document.querySelector('#drawer'),el=dr.querySelector(__drawerField.selector),a=SelectionSave1012.attempts.get(__drawerField.key),bar=[...dr.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key);
   window.__drawerNativeAcceptedEvents=__drawerNativeEvents;window.__drawerAcceptedDocs=JSON.stringify((a?.expected||[]).map(d=>[d.collection,d.id,JSON.stringify(toDocs(d.collection)[d.id]??null)]));
   return {accepted:a?.accepted,expectedCount:a?.expected?.length||0,collections:[...new Set((a?.expected||[]).map(d=>d.collection))],state:bar?.dataset.selection1012State,status:bar?.querySelector('[data-selection1012-status]')?.textContent,value:el?.type==='checkbox'?el.checked:el?.value,matches:el?.type==='checkbox'?el.checked===__drawerNext:el?.value===__drawerNext,top:dr.scrollTop,db:dr.querySelector('.db').scrollTop,on:dr.classList.contains('on'),open:[...dr.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,dr))};
  });
  check(label+' '+family+' native handler captured exact changed documents',saved.accepted&&saved.expectedCount>0&&saved.matches,{accepted:saved.accepted,expectedCount:saved.expectedCount,collections:saved.collections,matches:saved.matches});
  check(label+' '+family+' waiting for acknowledgement is device-only',saved.state==='local'&&saved.status.includes('Saved on this device'),{state:saved.state,status:saved.status});
  check(label+' '+family+' Save retains open drawer and disclosures',saved.on&&JSON.stringify(saved.open)===JSON.stringify(before.open),{beforeOpen:before.open.length,afterOpen:saved.open.length});
  check(label+' '+family+' Save keeps reading position',Math.abs(before.top-saved.top)<50&&Math.abs(before.db-saved.db)<50,{before:{top:before.top,db:before.db},after:{top:saved.top,db:saved.db}});
  await p.evaluate(()=>{const a=SelectionSave1012.attempts.get(__drawerField.key);for(const d of a.expected){SYNC.last[d.collection]??={};if(d.expected===null)delete SYNC.last[d.collection][d.id];else SYNC.last[d.collection][d.id]=d.expected;delete SYNC.queue[d.collection]?.[d.id];delete SYNC.inflight[d.collection+'/'+d.id];}SelectionSave1012.refresh();});
  check(label+' '+family+' exact acknowledgement reports shared Saved',await p.evaluate(()=>[...document.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key)?.dataset.selection1012State==='shared'));
  await p.evaluate(()=>[...document.querySelectorAll('.selection1012-controls')].filter(b=>b.dataset.selection1012Key===__drawerField.key).at(-1).querySelector('[data-selection1012-save]').click());await p.waitForTimeout(70);
  check(label+' '+family+' repeat Save never replays native change',await p.evaluate(()=>{const a=SelectionSave1012.attempts.get(__drawerField.key);return __drawerNativeEvents===__drawerNativeAcceptedEvents&&JSON.stringify(a.expected.map(d=>[d.collection,d.id,JSON.stringify(toDocs(d.collection)[d.id]??null)]))===__drawerAcceptedDocs;}));

  if(family==='supplied'){
   await field.fill('1.5');await p.evaluate(()=>[...document.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key).querySelector('[data-selection1012-save]').click());await p.waitForTimeout(80);
   check(label+' invalid supplied quantity stays visibly unsaved',await p.evaluate(()=>[...document.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key).dataset.selection1012State==='error'));
   const beforeReload=await p.evaluate(()=>{const dr=document.querySelector('#drawer'),bar=[...dr.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key);bar.scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));return {top:dr.scrollTop,db:dr.querySelector('.db').scrollTop,maxTop:dr.scrollHeight-dr.clientHeight,maxDb:dr.querySelector('.db').scrollHeight-dr.querySelector('.db').clientHeight,fieldY:dr.querySelector(__drawerField.selector).getBoundingClientRect().top,open:[...dr.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,dr))};});
   await p.evaluate(()=>[...document.querySelectorAll('.selection1012-controls')].find(b=>b.dataset.selection1012Key===__drawerField.key).querySelector('[data-selection1012-reload]').click());await p.waitForTimeout(180);
   const afterReload=await p.evaluate(()=>{const dr=document.querySelector('#drawer');return {top:dr.scrollTop,db:dr.querySelector('.db').scrollTop,maxTop:dr.scrollHeight-dr.clientHeight,maxDb:dr.querySelector('.db').scrollHeight-dr.querySelector('.db').clientHeight,fieldY:dr.querySelector(__drawerField.selector).getBoundingClientRect().top,open:[...dr.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,dr)),value:dr.querySelector(__drawerField.selector).value,expected:__drawerNext};});
   check(label+' field Reload restores native value without closing disclosures',afterReload.value===afterReload.expected&&JSON.stringify(beforeReload.open)===JSON.stringify(afterReload.open),{nativeValueRestored:afterReload.value===afterReload.expected,beforeOpen:beforeReload.open.length,afterOpen:afterReload.open.length});
   check(label+' field Reload keeps reading position',Math.abs(Math.min(beforeReload.top,Math.max(0,afterReload.maxTop))-afterReload.top)<50&&Math.abs(Math.min(beforeReload.db,Math.max(0,afterReload.maxDb))-afterReload.db)<50,{before:{top:beforeReload.top,db:beforeReload.db,maxTop:beforeReload.maxTop,maxDb:beforeReload.maxDb,fieldY:beforeReload.fieldY},after:{top:afterReload.top,db:afterReload.db,maxTop:afterReload.maxTop,maxDb:afterReload.maxDb,fieldY:afterReload.fieldY}});
  }
 }
 const special=await p.evaluate(()=>{const forms=[...document.querySelectorAll('#drawer [data-loading1012-editor],#drawer [data-unit925-form],#drawer [data-transport1006-form]')];return {forms:forms.length,duplicates:forms.filter(f=>f.querySelector('.selection1012-controls')).length};});
 check(label+' specialised forms receive no duplicate generic Save',special.forms>0&&special.duplicates===0,special);
 await p.screenshot({path:out+'/'+label+'-drawer.png'});
 check(label+' native drawer checks have no runtime errors',h.errors.length===0,h.errors);check(label+' no service write escaped isolated capture',h.counts.blocked===0,h.counts.blocked);report.errors.push(...h.errors);report.nativeWrites+=h.counts.blocked;
 }finally{await h.browser.close();fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));}
 }
 console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.filter(x=>x.ok).length,errors:report.errors.length,nativeWrites:report.nativeWrites}));
})().catch(error=>{fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.error(error);process.exit(1);});
