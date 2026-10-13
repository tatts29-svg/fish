// Author: Andrew Fisher. Read-only phone regression for legibility and save acknowledgement.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page'));
(async()=>{let h;try{
 if(!process.env.PAGE)throw Error('PAGE must name the local candidate');
 h=await open({pageFile:process.env.PAGE,W:390,H:844,mobile:true,dpr:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const recordVersion=await h.page.evaluate(()=>SYNC.backend.readVersion821());
 await h.page.route('**/api/version',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:recordVersion,level:'edit'})}));
 const native=await h.page.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';return JSON.stringify(S)});
 const checks=[],readings=[],ok=(name,pass)=>checks.push({name,pass:!!pass});
 for(const scheme of ['light','dark']){
  await h.page.emulateMedia({colorScheme:scheme});
  for(const ref of ['WC72','P25']){
   await h.page.evaluate(ref=>{openAsset(ref);document.querySelectorAll('#drawer details').forEach(d=>d.open=true)},ref);
   await h.page.waitForTimeout(300);
   const result=await h.page.evaluate(({scheme,ref})=>{
    const fixture=document.createElement('div');fixture.id='contrast1006-test';fixture.innerHTML=ourKindCard('transport').form+'<div class="flow891"><div class="flow891-people"><input value="3" aria-label="Staff count test"></div></div>';document.body.append(fixture);
    const rgb=v=>(v.match(/[\d.]+/g)||[]).map(Number),lum=v=>{const c=rgb(v).slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]},ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
    const fields=[...document.querySelectorAll('#drawer input[data-sup],#drawer input[data-supq],#drawer .rstbl input,#drawer .rstbl select,#contrast1006-test input,#contrast1006-test select')].filter(el=>el.getBoundingClientRect().height).map(el=>{const s=getComputedStyle(el),p=getComputedStyle(el,'::placeholder');return {selector:el.id||el.getAttribute('data-sup')||el.getAttribute('data-supq')||el.name||el.tagName,background:s.backgroundColor,color:s.webkitTextFillColor,contrast:ratio(s.webkitTextFillColor,s.backgroundColor),placeholder:el.placeholder?ratio(p.color,s.backgroundColor):null,disabled:el.disabled,drawer:!!el.closest('#drawer')};});
    fixture.remove();return {scheme,ref,fields};
   },{scheme,ref});
   readings.push(result);ok(scheme+' '+ref+' has actual drawer and cost fields',result.fields.filter(f=>f.drawer).length>=2&&result.fields.filter(f=>!f.drawer).length>=8);ok(scheme+' '+ref+' text contrast at least 4.5:1',result.fields.every(f=>f.contrast>=4.5));ok(scheme+' '+ref+' placeholders contrast at least 4.5:1',result.fields.every(f=>f.placeholder==null||f.placeholder>=4.5));
  }
 }
 const status=await h.page.evaluate(()=>{
  const names=['on','status','at','first','readonly','unkept','queue','inflight'],original=Object.fromEntries(names.map(k=>[k,SYNC[k]])),checks=[],ok=(name,pass)=>checks.push({name,pass:!!pass});
  const base=()=>Object.assign(SYNC,{on:true,status:'live',at:Date.now(),first:new Set(Object.keys(SYNC_COLLS)),readonly:false,unkept:false,queue:{},inflight:{}});
  try{
   base();ok('Acknowledged recorded changes say saved',drawerSync798Word()==='Recorded changes saved');
   SYNC.queue={loads:{test:{value:'pending'}}};ok('Queued change is not called saved',drawerSync798Word()==='Saving recorded changes…');
   const input=document.querySelector('#drawer input[data-sup]'),before=input;input.value='Unsubmitted form text';syncFooter();ok('Existing badge updates without replacing input',document.querySelector('#drawer .ptag.sync b').textContent==='Saving recorded changes…'&&document.querySelector('#drawer input[data-sup]')===before&&input.value==='Unsubmitted form text');
   ok('One save badge, no duplicate panel',document.querySelectorAll('#drawer .ptag.sync').length===1);
   base();SYNC.inflight={'loads/test':'pending'};ok('In-flight write is not called saved',drawerSync798Word()==='Saving recorded changes…');
   SYNC.status='unreachable';ok('Offline pending change is waiting to sync',drawerSync798Word()==='Changes waiting to sync');
   SYNC.unkept=true;ok('Local persistence failure says not saved',drawerSync798Word()==='Not saved · keep this page open');
   base();SYNC.first=new Set();ok('Partial hydration is not called saved',drawerSync798Word()==='Checking shared record…');
   base();SYNC.at=0;ok('No acknowledgement timestamp is not called saved',drawerSync798Word()==='Checking shared record…');
   base();SYNC.readonly=true;ok('Read-only link says view only',drawerSync798Word()==='View only');
   base();SYNC.status='file';SYNC.on=false;ok('Local copy is not called shared-saved',drawerSync798Word()==='Local copy only');
  }finally{Object.assign(SYNC,original);syncFooter()}
  return checks;
 });checks.push(...status);
 ok('Native operational data unchanged',await h.page.evaluate(n=>JSON.stringify(S)===n,native));
 const focused=await h.page.evaluate(()=>{const field=document.querySelector('#drawer input[data-sup]');field.scrollIntoView({block:'center'});field.focus({preventScroll:true});const s=getComputedStyle(field),lum=v=>{const c=v.match(/[\d.]+/g).slice(0,3).map(x=>{x=Number(x)/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]},a=lum(s.backgroundColor),b=lum(s.webkitTextFillColor);return {background:s.backgroundColor,color:s.webkitTextFillColor,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}});
 ok('Focused supplied field remains readable',focused.contrast>=4.5);
 const screenshot=process.env.SHOT||path.join(__dirname,'evidence','contrast1006-phone.png');await h.page.screenshot({path:screenshot});
 ok('No page errors or attempted operational writes',!h.errors.length&&!h.counts.blocked);
 const evidence={author:'Andrew Fisher',at:new Date().toISOString(),checks,readings,focused,errors:h.errors,counts:h.counts};
 fs.writeFileSync(process.env.OUT||path.join(__dirname,'evidence','contrast1006-phone.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({...evidence,readings:readings.map(r=>({scheme:r.scheme,ref:r.ref,count:r.fields.length,min:Math.min(...r.fields.map(f=>f.contrast))})),checks:checks.length,failures:checks.filter(c=>!c.pass)}));
 for(const c of checks)assert.ok(c.pass,c.name);
}finally{if(h)await h.browser.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
