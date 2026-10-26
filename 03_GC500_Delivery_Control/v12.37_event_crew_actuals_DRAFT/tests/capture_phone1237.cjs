/* Author: Andrew Fisher. Private phone evidence with fictional notes; all HTTP writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('./browser_harness.cjs');
(async()=>{
 assert(process.env.MOB==='1'&&process.env.OUT,'MOB=1 and a private OUT directory are required');
 const out=process.env.OUT;fs.mkdirSync(out,{recursive:true});
 const s=await openCandidate();
 const checks=[];
 const shot=async(selector,name)=>{const el=s.page.locator(selector).first();await el.waitFor({state:'visible',timeout:30000});await el.scrollIntoViewIfNeeded();await s.page.screenshot({path:path.join(out,name+'.png')});checks.push(name);console.log('PASS captured '+name);};
 try{
  const ids=await s.page.evaluate(()=>holdAssets(()=>{
   window.__event1237Visual={state:JSON.parse(JSON.stringify(S)),sender:syncSend,write:mayWrite,cap:capability};
   syncSend=()=>{clearTimeout(SYNC.timer);SYNC.timer=null;};mayWrite=()=>true;capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';S.operator='Fixture recorder';
   const who=document.querySelector('#who');if(who)who.value='Fixture recorder';
   S.serviceNotes=(S.serviceNotes||[]).filter(n=>!Object.prototype.hasOwnProperty.call(n,'event_allocation'));RENDER_MEMO.clear();HELD_MEMO.clear();
   const notes=Workforce1010.DATES.slice(-2).map((date,i)=>{
    let number=String(981001+i);while(paperNoTaken(number))number=String(Number(number)+10);
    const input={note_no:number,date,location:'Synthetic existing event crew',labour_hours:i?23.5:17.25,crew_note:'Crew total only; no individual allocation.',note:'Read-only rehearsal fixture.'};
    input.event_allocation=EventCrew1237.makeAllocation(input,EventCrew1237.environment(),{by:'Fixture recorder',on:todayIso(),text:'Confirmed existing crew for the whole event day.'});
    const n=recordServiceNote(input);if(!n)throw new Error('Native fixture refused');RENDER_MEMO.clear();HELD_MEMO.clear();return {id:n.id,date:n.date};
   });
   if(pl760FencingBranch()!=='STPS'||!PL_INSTALL.includes('2142'))throw new Error('Established supplier branch/category changed');
   FENCE_PRIVATE_VIEW.book='green';FENCE_PRIVATE_VIEW.date='';FENCE_PRIVATE_VIEW.evidence='all';state.q='';go('costs');state.financeView857='fencing';render();
   return notes;
  }));
  const card='[data-fp-id="'+ids[0].id+'"]';
  assert.match(await s.page.locator(card).innerText(),/total|crew/i);
  await shot(card,'phone-current-card');
  await s.page.locator(card+' summary').first().click();
  assert.match(await s.page.locator(card).innerText(),/customer Revenue in the event scope/i);
  await shot(card,'phone-current-card-details');
  await s.page.evaluate(()=>{PAPER.open='green';renderFencing();const form=document.querySelector('#paperGreen');for(let p=form?.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await s.page.locator('#snNo').fill('981099');
  await s.page.locator('#snDate').fill(ids[0].date);
  await s.page.locator('#snWhere').fill('Synthetic event crew');
  await s.page.locator('#snHours').fill('17.25');
  await s.page.locator('#snEventCrew').check();
  await s.page.locator('#snEventConfirm').fill('Confirmed existing crew for this whole event day.');
  const formText=await s.page.locator('#paperGreen').innerText();
  assert.match(formText,/existing event crew/);assert.match(formText,/event.scope|event scope/i);
  assert(!formText.includes('The hours are paid to Advanced at their Labour rate and the hours they bill are charged to the V8s at the labour rate.'),'No contradictory ordinary-rate form hint');
  await shot('#snEventCrew','phone-native-event-form');
  await s.page.evaluate(({id})=>{S.serviceNotes.find(n=>n.id===id).labour_hours+=1;RENDER_MEMO.clear();HELD_MEMO.clear();FENCE_PRIVATE_VIEW.opened[id]=false;PAPER.open=null;renderFencing();},ids[0]);
  const visibleWarning=s.page.locator(card+' > [data-event-review1237]');
  assert.match(await visibleWarning.innerText(),/Event allocation needs review/);
  await shot(card,'phone-current-card-review');
  await s.page.evaluate(({id})=>{S.serviceNotes.find(n=>n.id===id).labour_hours-=1;RENDER_MEMO.clear();HELD_MEMO.clear();state.q='';go('pricing');},ids[0]);
  // Keep the native horizontally scrollable table; capture its aggregate row without changing layout.
  const scope=s.page.locator('[data-event-scope1237]').first();
  await scope.evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  assert.match(await scope.innerText(),/Crew totals; no individual actual-hour split/);
  await shot('[data-event-scope1237]','phone-customer-aggregate-row');
  await scope.evaluate(el=>{const box=el.closest('.tblwrap');if(box)box.scrollLeft=box.scrollWidth-box.clientWidth;});
  await shot('[data-event-scope1237]','phone-customer-aggregate-totals');
  await s.page.evaluate(({date})=>{state.runDay=date;go('runsheet');},ids[0]);
  await shot('[data-event-day1237="'+ids[0].date+'"]','phone-running-sheet-aggregate');
  assert.equal(s.errors.length,0,'No page runtime errors');assert.equal(s.counts.blocked,0,'No HTTP write attempts');
  console.log('PASS '+checks.length+' native phone captures; zero runtime errors and HTTP write attempts');
 }finally{
  await s.page.evaluate(()=>{const x=window.__event1237Visual;if(!x)return;Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,x.state);RENDER_MEMO.clear();HELD_MEMO.clear();syncSend=x.sender;mayWrite=x.write;capability=x.cap;SYNC.readonly=true;SYNC.level='view';delete window.__event1237Visual;}).catch(()=>{});
  await s.browser.close();
 }
})().catch(e=>{console.error('FAIL phone visual capture: '+e.message);process.exitCode=1;});
