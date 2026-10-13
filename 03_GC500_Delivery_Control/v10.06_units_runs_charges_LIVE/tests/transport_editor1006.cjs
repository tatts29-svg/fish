/* Author: Andrew Fisher. Native GN20 editor in a disposable browser; all network writes blocked. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),{open}=require('../../toolchain/harness/open_page.js');
(async()=>{const s=await open({pageFile:process.env.PAGE,W:390,H:844,mobile:true,hash:'#costs'});try{
 await s.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const result=await s.page.evaluate(()=>{
  const checks=[],ok=(name,pass)=>checks.push({name,pass:!!pass}),near=(a,b)=>Math.abs(a-b)<.011,api=CustomerTransport1006;
  const original={save:window.save,capability:window.capability,mayWrite:window.mayWrite,whoAmI:window.whoAmI,readonly:SYNC.readonly,level:SYNC.level},native=JSON.stringify(S);
  const clear=()=>{RENDER_MEMO.clear();if(ASSETS_HELD)HELD_STALE775=true;};
  let saveCalls=0;window.save=()=>{saveCalls++;clear();return true;};window.capability=()=> 'edit';window.mayWrite=()=>true;window.whoAmI=()=> 'Andrew Fisher';SYNC.readonly=false;SYNC.level='edit';
  const snapshot=()=>holdAssets(()=>{const M=moneySummary(),P=pl770Model(),T=buildingTransportModel831(),H=fh866Model(),V=transport888View(),R=recon888Model();return {charge:M.charge.total,transport:M.charge.delivery,cost:M.cost.known,hire:P.rev.find(r=>r.key==='hire')?.now,forecast:P.rev.find(r=>r.key==='transport')?.job,branch:pl752Rows().find(r=>r.code==='NVAC')?.transport,rows:T.rows.filter(r=>r.ref==='GN20'),invoice:acc761Model('2026-10').revenue.filter(r=>r.stream==='Transport Revenue — October invoice allocation').reduce((n,r)=>n+r.amount,0),checks:Object.values(H.invCheck).every(Boolean)&&Object.values(V.checks).every(Boolean)&&R.ties.filter(t=>t.group==='Transport'||t.group==='P&L').every(t=>t.ok)};});
  const before=snapshot(),key=api.key('GN20','350kva');
  ok('Native save was not shadowed by module helper',original.save!==api.save&&!String(original.save).includes('Select your recorder name before saving.'));
  ok('GN20 begins with two POA legs',before.rows.length===2&&before.rows.every(r=>r.rate===null&&r.state==='held'));
  openAsset('GN20');let form=document.querySelector('#drawer [data-transport1006-form]');if(!form)throw Error('Missing GN20 form');form.closest('details').open=true;
  const expected=form.dataset.expected,sourceToken=form.dataset.sourceToken;
  ok('One editable field per transport leg',form.querySelectorAll('[name=delivery]').length===1&&form.querySelectorAll('[name=pickup]').length===1&&!form.querySelector('[name=delivery]').disabled);
  const rejected=api.save('GN20','350kva',{delivery:'-5',pickup:''},expected,sourceToken);
  ok('Invalid rate does not mutate the record',!rejected.ok&&JSON.stringify(S)===native&&saveCalls===0);
  window.mayWrite=()=>false;const readonly=api.save('GN20','350kva',{delivery:'10',pickup:''},expected,sourceToken);window.mayWrite=()=>true;
  ok('Read-only view cannot save',!readonly.ok&&JSON.stringify(S)===native&&saveCalls===0);
  form.querySelector('[name=delivery]').value='123.45';form.querySelector('[name=pickup]').value='234.56';form.querySelector('[name=note]').value='Local test quote';form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  const after=snapshot(),saved=api.record('GN20','350kva'),doc=toDocs('loads')[docIdOf(key)];
  ok('Native Save writes one revisioned shared document',saveCalls===1&&saved?.history.length===1&&doc?._k===key&&doc.kind===api.kind&&doc.by==='Andrew Fisher');
  ok('Entered delivery and pickup replace POA rows',after.rows.every(r=>r.manualTransport1006&&r.state==='estimate')&&near(after.rows.reduce((n,r)=>n+r.actualAdditional1006,0),358.01));
  ok('Actual transport revenue increases exactly once',near(after.transport-before.transport,358.01)&&near(after.charge-before.charge,358.01));
  ok('Carrier costs and Hire Revenue remain unchanged',near(after.cost,before.cost)&&near(after.hire,before.hire));
  ok('Correct branch and whole-job transport increase once',near(after.branch-before.branch,358.01)&&near(after.forecast-before.forecast,358.01));
  ok('October invoice preparation uses the same charges',near(after.invoice-before.invoice,358.01)&&after.checks);
  ok('Physical status is not changed by entered rates',Object.keys(JSON.parse(native)).filter(k=>!['loads','stamps','by'].includes(k)).every(k=>JSON.stringify(S[k])===JSON.stringify(JSON.parse(native)[k])));
  ok('Unacknowledged shared save is not claimed live',/syncing/.test(api.status('GN20','350kva')));
  const oldLast=SYNC.last.loads[docIdOf(key)];SYNC.last.loads[docIdOf(key)]=JSON.stringify(doc);
  ok('Shared acknowledgement gives Saved reassurance',api.status('GN20','350kva')==='SAVED · shared record updated');SYNC.last.loads[docIdOf(key)]=oldLast;
  const stale=api.save('GN20','350kva',{delivery:'888',pickup:'999'},expected,sourceToken);
  ok('Concurrent older form is refused without duplicate',!stale.ok&&/another device/.test(stale.reason)&&api.record('GN20','350kva').history.length===1&&saveCalls===1);
  const staleSource=api.save('GN20','350kva',{delivery:'888',pickup:'999'},api.token(saved),'changed source');
  ok('Stale quantity/branch/source token is refused',!staleSource.ok&&/source changed/.test(staleSource.reason)&&saveCalls===1);
  const oneLeg=api.save('GN20','350kva',{delivery:'123.45',pickup:'',note:'Pickup quote pending'},api.token(saved),api.canonical(api.source('GN20','350kva'))),single=snapshot();
  ok('Clearing one leg restores POA and removes only that charge',oneLeg.ok&&near(single.transport-before.transport,123.45)&&single.rows.find(r=>r.leg==='pickup').state==='held');
  const zero=api.save('GN20','350kva',{delivery:'0',pickup:'',note:'Explicit agreed no charge'},api.token(api.record('GN20','350kva')),api.canonical(api.source('GN20','350kva'))),zeroModel=snapshot();
  ok('Explicit zero stays distinct from blank POA',zero.ok&&zeroModel.rows.find(r=>r.leg==='delivery').rate===0&&zeroModel.rows.find(r=>r.leg==='pickup').rate===null&&near(zeroModel.transport,before.transport));
  const cleared=api.save('GN20','350kva',{delivery:'',pickup:'',note:''},api.token(api.record('GN20','350kva')),api.canonical(api.source('GN20','350kva'))),final=snapshot();
  ok('Clearing both preserves history and restores all totals',cleared.ok&&!api.record('GN20','350kva').active&&api.record('GN20','350kva').history.length===4&&near(final.transport,before.transport)&&near(final.charge,before.charge)&&final.checks);
  form=document.querySelector('#drawer [data-transport1006-form]');for(let p=form.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;form.scrollIntoView({block:'center'});
  const input=form.querySelector('[name=delivery]'),style=getComputedStyle(input),rect=form.getBoundingClientRect();
  ok('Phone fields use readable dark text on white',style.color==='rgb(23, 39, 46)'&&style.backgroundColor==='rgb(255, 255, 255)'&&parseFloat(style.fontSize)>=16);
  ok('Phone editor stays within viewport',rect.left>=0&&rect.right<=innerWidth+1);
  // Restore in-memory fixture; the harness never permits a network write.
  const restore=JSON.parse(native);for(const k of Object.keys(S))delete S[k];Object.assign(S,restore);Object.assign(window,{save:original.save,capability:original.capability,mayWrite:original.mayWrite,whoAmI:original.whoAmI});SYNC.readonly=original.readonly;SYNC.level=original.level;clear();
  return {checks,before,after,saveCalls};
 });
 if(process.env.OUTPUT)fs.writeFileSync(process.env.OUTPUT,JSON.stringify({...result,errors:s.errors,blocked:s.counts.blocked},null,2));
 if(process.env.SCREENSHOT){
  await s.page.locator('[data-charges952="GN20"] > details').evaluate(el=>{el.open=true;});
  await s.page.locator('#transport-rate1006-GN20').evaluate(el=>{el.open=true;});
  await s.page.locator('#drawer [data-transport1006-form]').scrollIntoViewIfNeeded();
  const box=await s.page.locator('#drawer [data-transport1006-form]').boundingBox();assert.ok(box&&box.width>=200&&box.height>=150,'Visible readable phone editor');
  await s.page.screenshot({path:process.env.SCREENSHOT});
 }
 assert.deepEqual(result.checks.filter(c=>!c.pass),[]);assert.deepEqual(s.errors,[]);assert.equal(s.counts.blocked,0);console.log(JSON.stringify({checks:result.checks.length,saveCalls:result.saveCalls,errors:s.errors,blocked:s.counts.blocked},null,2));
 }finally{await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
