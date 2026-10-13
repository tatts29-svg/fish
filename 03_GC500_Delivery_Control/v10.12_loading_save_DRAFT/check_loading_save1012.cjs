/* Author: Andrew Fisher. Loading Save browser practice; native writes captured only. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {open}=require('../toolchain/harness/open_page');
const out=process.env.OUT||'/workspace/private-gc5001012-loading';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',checks:[],errors:[],nativeWrites:0};
const check=(name,ok,details)=>{report.checks.push({name,ok,details});assert(ok,name+': '+JSON.stringify(details));};
(async()=>{for(const mobile of [true,false]){
 const label=mobile?'phone':'desktop',h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
 try{
 const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
 const version=await p.evaluate(()=>SYNC.backend.readVersion821());
 await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:'edit'})}));
 await p.evaluate(()=>{
  capability=()=> 'edit';canEdit=()=>true;mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';
  window.__lsWrites=[];SYNC.db.doc=path=>({set:body=>{__lsWrites.push({path,body});return new Promise(()=>{});},delete:()=>{__lsWrites.push({path,body:null});return new Promise(()=>{});}});
  window.__lsSetCount=0;const doorBefore=loading872Set;loading872Set=function(){__lsSetCount++;return doorBefore.apply(this,arguments);};
  window.__lsHandlingCount=0;const handlingBefore=handling875Set;handling875Set=function(){__lsHandlingCount++;return handlingBefore.apply(this,arguments);};
  go('timeline');openAsset('P33');
  for(const box of document.querySelectorAll('#drawer [data-loading1012-editor]'))for(let d=box.closest('details');d;d=d.parentElement.closest('details'))d.open=true;
 });
 await p.waitForTimeout(250);
 const initial=await p.evaluate(()=>{
  const boxes=[...document.querySelectorAll('#drawer [data-loading1012-editor]')],door=boxes.find(b=>b.dataset.loading1012Kind==='door');
  if(!door)return {found:false,boxes:boxes.length};
  window.__lsUnit=door.dataset.loading1012Unit;window.__lsSpec={kind:'door',ref:'P33',unit:__lsUnit};
  window.__lsOriginal=loading872Side(assetOf('P33'),__lsUnit);window.__lsNext=__lsOriginal==='driver'?'passenger':'driver';
  window.__lsDoc=JSON.stringify(toDocs('delivery')[docIdOf('P33')]);
  return {found:true,save:door.querySelectorAll('[data-loading1012-save]').length,oldSelectors:document.querySelectorAll('#drawer [data-door872-ref],#drawer [data-handling875-ref],#drawer [data-door872-clear],#drawer [data-handling875-clear]').length};
 });
 check(label+' one Save per editor and native auto-save selectors removed',initial.found&&initial.save===1&&initial.oldSelectors===0,initial);
 const door=()=>p.locator('#drawer [data-loading1012-kind="door"]').filter({has:p.locator('[data-loading1012-choice]')}).first();
 await door().locator('[data-loading1012-choice]').evaluateAll(inputs=>{const chosen=inputs.find(n=>n.value===__lsNext);chosen.checked=true;chosen.dispatchEvent(new Event('change',{bubbles:true}));});
 check(label+' radio selection is draft only',await p.evaluate(()=>__lsSetCount===0&&__lsDoc===JSON.stringify(toDocs('delivery')[docIdOf('P33')])&&LoadingSave1012.controller.feedback(__lsSpec).state==='dirty'));
 await p.evaluate(()=>Idle1006.refreshDrawer());await p.waitForTimeout(100);
 check(label+' unsaved selection and open editor survive live drawer refresh',await door().evaluate(box=>box.closest('details').open&&box.querySelector('[data-loading1012-choice]:checked')?.value===__lsNext&&box.querySelector('[data-loading1012-result]').textContent==='Unsaved changes'));
 await door().locator('[data-loading1012-save]').evaluate(n=>{n.scrollIntoView({block:'center'});document.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:1}));n.focus({preventScroll:true});});
 const position=()=>{const dr=document.querySelector('#drawer'),btn=dr.querySelector('[data-loading1012-kind=door] [data-loading1012-save]');return {on:dr.classList.contains('on'),top:dr.scrollTop,db:dr.querySelector('.db').scrollTop,buttonY:btn?.getBoundingClientRect().top,open:[...dr.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,dr))};};
 await p.evaluate(()=>document.addEventListener('pointerdown',()=>{const d=document.querySelector('#drawer');window.__lsPointerPosition={top:d.scrollTop,buttonY:d.querySelector('[data-loading1012-kind=door] [data-loading1012-save]')?.getBoundingClientRect().top};},{once:true,capture:true}));const before=await p.evaluate(position);await p.screenshot({path:out+'/'+label+'-before-save.png'});await door().locator('[data-loading1012-save]').click();await p.waitForTimeout(150);const after=await p.evaluate(position);after.pointer=await p.evaluate(()=>window.__lsPointerPosition);await p.screenshot({path:out+'/'+label+'-after-save.png'});
 check(label+' Save keeps drawer open and reading position',after.on&&Math.abs(before.top-after.top)<45&&Math.abs(before.db-after.db)<45,{before,after});
 check(label+' Save invokes native door setter once',await p.evaluate(()=>__lsSetCount===1&&loading872Side(assetOf('P33'),__lsUnit)===__lsNext));
 check(label+' pending shared acknowledgement is not reported as shared Saved',await door().evaluate(box=>/Saved on this device/.test(box.querySelector('[data-loading1012-result]').textContent)&&box.querySelector('[data-loading1012-result]').dataset.save1012!=='shared'));
 await p.evaluate(()=>{
  const id=docIdOf('P33');SYNC.last.delivery[id]=JSON.stringify(toDocs('delivery')[id]);delete SYNC.queue.delivery?.[id];delete SYNC.inflight['delivery/'+id];LoadingSave1012.feedback();
 });
 check(label+' exact acknowledged delivery document reports shared Saved',await door().evaluate(box=>box.querySelector('[data-loading1012-result]').dataset.save1012==='shared'));
 await door().locator('[data-loading1012-clear]').click();
 check(label+' Clear is readable draft and does not write',await door().evaluate(box=>{const b=box.querySelector('[data-loading1012-clear]'),s=getComputedStyle(b);return __lsSetCount===1&&!box.querySelector('[data-loading1012-choice]:checked')&&loading872Side(assetOf('P33'),__lsUnit)===__lsNext&&s.color!==s.backgroundColor;}));
 await door().locator('[data-loading1012-save]').click();await p.waitForTimeout(80);
 check(label+' Save Clear writes explicit blank once',await p.evaluate(()=>__lsSetCount===2&&loading872Record('P33')[__lsUnit]?.side===''));
 const handling=p.locator('#drawer [data-loading1012-kind="handling"]').first();
 await handling.locator('[data-loading1012-choice]').evaluateAll(inputs=>{window.__lsHandlingNext=handling875Record(assetOf('P33'))?.method==='franna'?'forklift':'franna';const n=inputs.find(n=>n.value===__lsHandlingNext);n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));});
 check(label+' unloading draft does not call native setter',await p.evaluate(()=>__lsHandlingCount===0));
 await handling.locator('[data-loading1012-save]').click();await p.waitForTimeout(80);
 check(label+' unloading Save calls native setter once',await p.evaluate(()=>__lsHandlingCount===1&&handling875Record(assetOf('P33')).method===__lsHandlingNext));
 await door().locator('[data-loading1012-choice][value="passenger"]').evaluate(n=>{n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));});
 await p.evaluate(()=>{S.delivery.P33.loading872[__lsUnit]={side:'na',by:'Other practice operator',at:'2099-01-01T00:00:00.000Z'};LoadingSave1012.feedback();});
 await door().locator('[data-loading1012-save]').click();
 check(label+' stale draft is rejected after remote selection change',await p.evaluate(()=>__lsSetCount===2&&LoadingSave1012.controller.feedback(__lsSpec).state==='changed'));
 await door().locator('[data-loading1012-reset]').click();
 check(label+' Reload takes latest selection without a write',await door().evaluate(box=>box.querySelector('[data-loading1012-choice]:checked')?.value==='na'&&__lsSetCount===2));
 const shape=await p.evaluate(()=>{
  const env={asset:r=>assetOf(r),units:a=>gcUnits925(a),rows:a=>loading872Rows(a),side:(a,id)=>loading872Side(a,id),can:()=>true,shapes:MasterShapes926};
  const found=['P33','WC50','WC09'].flatMap(ref=>Shapes926.unitModel(assetOf(ref),env)).find(u=>u.loadingId);if(!found)return {found:false};
  window.__lsShape=found;const holder=document.createElement('div');holder.id='loading1012-shape-practice';holder.innerHTML=Shapes926.productHtml942(found.ref,{units:[found]},env);document.querySelector('#drawer .db').append(holder);
  return {found:true,auto:holder.querySelectorAll('[data-shape926-door]').length,save:holder.querySelectorAll('[data-loading1012-save]').length};
 });
 check(label+' shape dropdown receives one explicit Save and no auto-save selector',shape.found&&shape.auto===0&&shape.save===1,shape);
 await p.evaluate(()=>{
  window.__lsBeforeShape=__lsSetCount;const field=document.querySelector('#loading1012-shape-practice select');field.value=field.value==='driver'?'passenger':'driver';field.dispatchEvent(new Event('change',{bubbles:true}));
 });
 check(label+' shape selection is draft only',await p.evaluate(()=>__lsSetCount===__lsBeforeShape));
 await p.locator('#loading1012-shape-practice [data-loading1012-save]').click();await p.waitForTimeout(100);
 check(label+' shape Save uses exactly one native door setter',await p.evaluate(()=>__lsSetCount===__lsBeforeShape+1));
 const nativeBuild=await p.evaluate(()=>{
  state.drawerClose?.();go('timeline');const pane=document.querySelector('#pane-timeline');
  const boxes=[...pane.querySelectorAll('[data-loading1012-editor]')];
  return {editors:boxes.length,missingSave:boxes.filter(b=>b.querySelectorAll('[data-loading1012-save]').length!==1).length,auto:pane.querySelectorAll('[data-door872-ref],[data-handling875-ref],[data-shape926-door]').length};
 });
 check(label+' shared Build editors all have exactly one Save and no old auto-save selectors',nativeBuild.editors>0&&nativeBuild.missingSave===0&&nativeBuild.auto===0,nativeBuild);
 await p.evaluate(()=>{SYNC.readonly=true;openAsset('P33',{keep:true});for(const box of document.querySelectorAll('#drawer [data-loading1012-editor]'))for(let d=box.closest('details');d;d=d.parentElement.closest('details'))d.open=true;});
 check(label+' view-only editor has disabled choices and no Save',await p.evaluate(()=>![...document.querySelectorAll('#drawer [data-loading1012-choice]')].some(n=>!n.disabled)&&!document.querySelector('#drawer [data-loading1012-save]')));
 check(label+' drawer contains no unhandled runtime errors',h.errors.length===0,h.errors);report.errors.push(...h.errors);report.nativeWrites+=h.counts.blocked;
 await p.screenshot({path:out+'/'+label+'-view-only.png'});
 }finally{await h.browser.close();fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));}
 }
 console.log(JSON.stringify({checks:report.checks.length,passed:report.checks.filter(x=>x.ok).length,errors:report.errors.length,nativeWrites:report.nativeWrites}));
})().catch(error=>{fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.error(error);process.exit(1);});
