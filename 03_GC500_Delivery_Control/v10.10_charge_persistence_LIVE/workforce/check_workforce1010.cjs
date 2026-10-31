// Author: Andrew Fisher. GET-only live record; edits practised only in isolated browser state.
'use strict';const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',out=process.env.OUT||'/workspace/private-workforce1010';fs.mkdirSync(out,{recursive:true});
 const session=await open({pageFile:process.env.PAGE||'/workspace/private-workforce1010-candidate.html',mobile,W:mobile?390:1440,H:mobile?844:1000});const p=session.page;
 try{await p.waitForFunction(()=>typeof Workforce1010!=='undefined'&&SYNC.status==='live');
 const model=await p.evaluate(()=>{RENDER_MEMO.clear();return {scope:scopeFigures(),days:Workforce1010.DATES.map(day=>({day,data:runDay(day)})),finance:fin745Rows().filter(r=>Workforce1010.isPerson(r.person)),staff:eventStaffingModel833(),source:Workforce1010.source(),native:JSON.stringify(S.costs),version:SYNC.backend.readVersion821()};});
 let checks=0;const yes=(ok,msg)=>{assert.ok(ok,msg);checks++;};
 for(const day of model.days){yes(day.data.rows.filter(r=>/^Fencing [1-6]$/.test(r.name)&&r.shift).length===6,'six workers '+day.day);yes(!day.data.rows.some(r=>r.name==='Fencing crew ×6'),'aggregate excluded');yes(day.data.rows.some(r=>r.name==='Kyle Gover'&&r.shift.note.startsWith('Night shift confirmed')),'Kyle night');yes(!day.data.rows.some(r=>r.name==='Night person — TBC'),'empty obsolete night placeholder removed');}
 const friday=model.finance.filter(r=>r.date==='2026-10-23');yes(friday.length===6,'six finance shifts');yes(friday.every(r=>r.rate===142&&r.paid===12&&r.calculatedCost===1704&&r.status==='forecast'),'142 flat times12 forecast per worker');yes(friday.reduce((s,r)=>s+r.calculatedCost,0)===10224,'crew total10224 once');
 const fence=model.scope.lines.find(r=>r.key==='fence');yes(fence.rate===88.49&&fence.hours===195&&fence.amount===17255.55,'customer scope unchanged');yes(model.staff.confirmedNights.some(r=>r.name==='Kyle Gover'&&!r.hoursKnown),'Kyle confirmed unknownhours');
 await p.evaluate(()=>{state.runDay='2026-10-23';go('runsheet');});await p.waitForTimeout(1200);
 yes((await p.locator('#pane-runsheet').innerText()).includes('Night shift'),'visible Kyle night');yes((await p.locator('#pane-runsheet').innerText()).includes('Fencing 6'),'visible Fencing6');
 await p.locator('#pane-runsheet .rstbl tbody tr').filter({hasText:'Fencing 5'}).first().scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,mobile?'phone-workforce.png':'desktop-workforce.png')});
 const scopeHtml=await p.evaluate(()=>eventScopeCard());yes((scopeHtml.match(/data-scope-person1010=/g)||[]).length===6,'six customer scope worker rows');yes(scopeHtml.includes('17,255.55'),'one correct customer total');
 const nativeAfter=await p.evaluate(()=>JSON.stringify(S.costs));yes(nativeAfter===model.native,'reading unchanged nativecosts');
 const practice=await p.evaluate(()=>{
  const before=JSON.stringify(S),priorSave=save,priorMay=mayWrite,priorWho=whoAmI;let saved=0;
  try{save=()=>{saved++;RENDER_MEMO.clear();return true;};mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';
   const id=Workforce1010.shiftId('Fencing 1','2026-10-23');
   const edited=runSetShift('Fencing 1','2026-10-23',{start:'07:00',finish:'15:00'});RENDER_MEMO.clear();
   const rows=fin745Rows().filter(r=>Workforce1010.isPerson(r.person)&&r.date==='2026-10-23');
   const afterEdit=rows.map(r=>({person:r.person,paid:r.paid,cost:r.calculatedCost})),savedKey=S.costs.find(r=>r.id===id)?._k;
   const removed=removeOurCost(id);RENDER_MEMO.clear();const count=ourCosts().filter(r=>r.kind==='labour'&&r.date==='2026-10-23'&&Workforce1010.isPerson(r.person)).length;
   return {edited,removed,afterEdit,count,saved,savedKey};
  }finally{S=JSON.parse(before);save=priorSave;mayWrite=priorMay;whoAmI=priorWho;RENDER_MEMO.clear();}
 });
 yes(practice.savedKey==='W-L-fencing-1-20261023','individual native document key preserved');yes(practice.edited===true&&practice.afterEdit.find(r=>r.person==='Fencing 1').paid===8,'individual native setter works');yes(practice.afterEdit.filter(r=>r.person!=='Fencing 1').every(r=>r.paid===12),'other5 untouched');yes(practice.removed===true&&practice.count===5,'native tombstone removes one child');yes((await p.evaluate(()=>JSON.stringify(S.costs)))===model.native,'practice restored');
 yes(session.errors.length===0,'browser errors');yes(session.counts.blocked===0,'no attempted operational writes');
 fs.writeFileSync(path.join(out,mobile?'phone-result.json':'desktop-result.json'),JSON.stringify({author:'Andrew Fisher',pass:true,checks,version:model.version,friday,customerFence:fence,practice,errors:session.errors,requests:session.counts},null,2));console.log(JSON.stringify({pass:true,checks,version:model.version,errors:session.errors,requests:session.counts}));
 }finally{await session.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
