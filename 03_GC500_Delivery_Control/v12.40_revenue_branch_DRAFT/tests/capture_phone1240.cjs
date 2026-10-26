/* Author: Andrew Fisher. Phone proof on a read-only synthetic allocation; no HTTP writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {openCandidate}=require('./browser_harness.cjs');
(async()=>{
 assert(process.env.OUT,'Private OUT directory required');fs.mkdirSync(process.env.OUT,{recursive:true});
 const s=await openCandidate();
 try{
  const key=await s.page.evaluate(()=>{
   const A=RevenueBranch1240;syncSend=()=>{clearTimeout(SYNC.timer);SYNC.timer=null;};mayWrite=()=>true;capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';S.operator='Synthetic reviewer';const who=document.querySelector('#who');if(who)who.value=S.operator;
   const row=ONHIRE_ROWS.find(r=>r.subhired&&A.current('c|'+r.rental_contract+'|'+r.line)?.eligible&&A.status('c|'+r.rental_contract+'|'+r.line).state==='none');if(!row)throw Error('Eligible fixture source missing');
   const key='c|'+row.rental_contract+'|'+row.line,t=A.current(key),branch=t.allowedBranches.find(b=>b!==t.branch);
   if(!A.set(key,A.make(key,{branch,reason:'Synthetic branch allocation shown for layout review',evidence:'Synthetic test only; no operational save',confirmed_by:'Synthetic reviewer',confirmed_on:todayIso()})))throw Error('Fixture refused');
   go('costs');A.dialog(key);return key;
  });
  const dialog=s.page.getByRole('dialog',{name:'Customer Revenue branch'});await dialog.waitFor();
  assert.match(await dialog.innerText(),/Supplier|supplier/);assert.match(await dialog.innerText(),/Save Revenue branch/);
  await s.page.screenshot({path:path.join(process.env.OUT,'phone-contract-revenue-dialog.png')});
  await s.page.evaluate(()=>document.querySelector('[data-close1240]').click());
  await s.page.evaluate(()=>{go('pricing');RevenueBranch1240.dialog('scope|gentech_ent');});
  await s.page.getByRole('dialog',{name:'Customer Revenue branch'}).waitFor();
  await s.page.screenshot({path:path.join(process.env.OUT,'phone-event-role-revenue-dialog.png')});
  await s.page.evaluate(key=>{document.querySelector('[data-close1240]').click();const d=S.answers[RevenueBranch1240.PREFIX+key];d.source.ordinaryBranch='STALE';RENDER_MEMO.clear();HELD_MEMO.clear();go('costs');RevenueBranch1240.dialog(key);},key);
  assert.match(await s.page.getByRole('dialog',{name:'Customer Revenue branch'}).innerText(),/needs review/);
  await s.page.screenshot({path:path.join(process.env.OUT,'phone-stale-revenue-review.png')});
  assert.equal(s.errors.length,0,'Zero runtime errors');assert.equal(s.counts.blocked,0,'Zero HTTP write attempts');
  console.log('Phone contract, role and stale-source captures complete; no HTTP writes.');
 }finally{await s.browser.close();}
})().catch(e=>{console.error('FAIL '+e.message);process.exitCode=1;});
