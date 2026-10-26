/* Author: Andrew Fisher. Synthetic native-page regressions. No operational record writes.
 * Run under flock /tmp/gc500-browser.lock. PAGE and optional STATE select candidate/snapshot.
 */
'use strict';
const {openCandidate}=require('./browser_harness.cjs');
(async()=>{
 const s=await openCandidate();
 const deadline=setTimeout(()=>{console.error('FAIL native evaluation timed out');s.browser.close().catch(()=>{});},240000);
 s.page.on('console',m=>{if(m.text().startsWith('EVENT1237_STAGE '))console.log(m.text());});
 try {
  const result=await s.page.evaluate(()=>holdAssets(()=>{
   const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),r2=n=>Math.round((n+Number.EPSILON)*100)/100,near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<0.005;
   const checks=[],check=(ok,name)=>{checks.push({name,ok:!!ok});},need=(ok,name)=>{check(ok,name);if(!ok)throw new Error(name);};
   const saved=clone(S),savedText=JSON.stringify(S),sender=syncSend,write=mayWrite,cap=capability,who=document.querySelector('#who'),oldWho=who&&who.value;
   const clear=()=>{RENDER_MEMO.clear();HELD_MEMO.clear();};
   const putState=x=>{Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,clone(x));clear();};
   const day=todayIso(),actor='Fixture recorder',W=Workforce1010,A=EventCrew1237;
   const dates=W.DATES.slice(-2),hours=[17.25,23.5],sumHours=40.75;
   const capture=()=>{console.info('EVENT1237_STAGE financial capture');clear();const fin=fin745Rows(day),scope=scopeFigures(),money=moneySummary(day),pl=pl770Model(),acc=acc761Labour();return clone({scope,green:greenBookTotals(),billed:FenceInvoiced1219.billed(),crew:RaceCrew1227.model(day),fin,summary:fin745Summary(null,day),review:acc762LabourReview(fin),acc:{all:acc.all,raceHours:acc.raceHours},money:{charge:money.charge.total,cost:money.cost.known,streams:money.streams},pl:{revNow:pl.revNow,revJob:pl.revJob,costNow:pl.costNow,costJob:pl.costJob,cost:pl.cost,wages:pl.wages,checks:pl.checks},branch:branchFinancial978(pl752Rows(),money),fenceBranch:pl760FencingBranch(),workforce:W.summary(),words:RaceCrew1227.words(RaceCrew1227.model(day),'charge'),wages:labourNote753(day)});};
   let baseline=null,linked=null,finalStateRestored=false;
   try {
    need(typeof A==='object'&&typeof A.environment==='function','event allocation API is present');
    need(dates.length===2,'two event days available');
    syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;};mayWrite=()=>true;capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';S.operator=actor;if(who)who.value=actor;
    // Existing dynamic event links are removed only from this browser fixture, never sent.
    S.serviceNotes=(S.serviceNotes||[]).filter(n=>!Object.prototype.hasOwnProperty.call(n,'event_allocation'));
    clear();baseline=capture();
    const cleanState=clone(S),line=baseline.scope.lines.find(l=>l.key==='fence'),baseDays=line.days.filter(d=>dates.includes(d.date));
    need(baseDays.length===2,'customer source has both fixture days');
    const sourceRows=baseline.fin.filter(row=>W.isPerson(row.person)&&dates.includes(row.date)&&row.id===W.shiftId(row.person,row.date));
    need(sourceRows.length>0,'source roster rows are available for replacement');
    const sourceIds=new Set(sourceRows.map(row=>row.id));
    const sourceCost=r2(sourceRows.reduce((n,row)=>n+(Number.isFinite(row.actualCost)?row.actualCost:Number.isFinite(row.calculatedCost)?row.calculatedCost:0),0));
    const supplierRate=A.environment().supplierRate,expectedCost=r2(r2(hours[0]*supplierRate)+r2(hours[1]*supplierRate));
    const expectedHours=r2(line.hours-baseDays.reduce((n,d)=>n+d.hours,0)+sumHours),expectedCharge=r2(expectedHours*line.rate),chargeDelta=r2(expectedCharge-line.amount);
    const fixtureNotes=[];
    for(let i=0;i<2;i++){
     let no=String(980001+i);while(paperNoTaken(no))no=String(Number(no)+10);
     const input={note_no:no,date:dates[i],location:'Synthetic event crew fixture',labour_hours:hours[i],crew_note:'Aggregate hours only; no individual allocation.',note:'Test fixture only; never sent to the service.'};
     input.event_allocation=A.makeAllocation(input,A.environment(),{by:actor,on:day,text:'Confirmed existing crew for this whole event day.'});
     console.info('EVENT1237_STAGE native fixture '+(i+1));const n=recordServiceNote(input);need(n&&n.id,'native setter accepts explicit fixture allocation '+(i+1));fixtureNotes.push(clone(n));clear();
    }
    const model=A.model();need(model.days.length===2&&near(model.hours,sumHours),'two native notes resolve to aggregate evidence');
    const hydratedNotes=fromDocs('serviceNotes',clone(toDocs('serviceNotes')));
    check(fixtureNotes.every(n=>{const found=hydratedNotes.find(x=>x.id===n.id);return found&&same(found.event_allocation,n.event_allocation);}), 'native sync serialization retains complete explicit allocation evidence');
    linked=capture();
    check(near(linked.green.amount-baseline.green.amount,expectedCost),'green book owns the supplier dollars exactly once');
    check(near(linked.green.hours-baseline.green.hours,sumHours),'green book keeps total person-hours without multiplying people');
    const readinessGreen=todayGroupDetails841(day).fencing.money.find(x=>x.id==='green-book'),greenHtml=greenBookCard();
    check(linked.green.priced>0&&readinessGreen&&near(readinessGreen.amount,linked.green.amount),'readiness retains mixed-rate green-book amount');
    check(greenHtml.includes(money(linked.green.amount))&&!/none on file yet/.test(greenHtml),'green-book card shows priced mixed-rate total without a false missing-rate claim');
    const linkedCard=fencePrivateRow(serviceNoteRows().find(n=>n.id===fixtureNotes[0].id));
    check(/Customer Revenue is in the event scope|customer Revenue in the event scope/i.test(linkedCard)&&!/The hours Advanced bill are charged to the V8s at the labour rate/.test(linkedCard),'current fencing card shows event-scope customer basis');
    const oldPaperOpen=PAPER.open;PAPER.open='green';const formHtml=paperFormsHtml(false);PAPER.open=oldPaperOpen;
    check(formHtml.includes('snEventCrew')&&/event.scope|event scope/i.test(formHtml)&&!formHtml.includes('The hours are paid to Advanced at their Labour rate and the hours they bill are charged to the V8s at the labour rate.'),'native form distinguishes linked crew from ordinary labour pricing');
    check(same(linked.billed.notes,baseline.billed.notes),'linked notes add no ordinary fencing customer charge');
    const finalLine=linked.scope.lines.find(l=>l.key==='fence');
    check(near(finalLine.hours,expectedHours)&&near(finalLine.amount,expectedCharge),'customer event scope replaces aggregate days at its existing rate');
    check(finalLine.days.filter(d=>dates.includes(d.date)).every((d,i)=>d.aggregate1237&&d.per===null&&near(d.hours,hours[i])),'actual days never invent per-person hours');
    check(same(finalLine.days.filter(d=>!dates.includes(d.date)),line.days.filter(d=>!dates.includes(d.date))),'uncovered customer event days remain unchanged');
    check(same(linked.scope.lines.filter(l=>l.key!=='fence'),baseline.scope.lines.filter(l=>l.key!=='fence')),'other customer scope lines remain unchanged');
    check(near(linked.money.charge-baseline.money.charge,chargeDelta),'overall Revenue changes only by the customer scope replacement');
    check(near(linked.pl.revNow-baseline.pl.revNow,chargeDelta)&&near(linked.pl.revJob-baseline.pl.revJob,chargeDelta),'P&L Revenue agrees with the customer scope');
    check(near(linked.money.cost-baseline.money.cost,expectedCost),'known Direct costs include the recorded supplier amount once');
    check(linked.money.streams.every(x=>{const b=baseline.money.streams.find(y=>y.key===x.key);return b&&near(x.charge-b.charge,x.key==='crew'?chargeDelta:0)&&near(x.cost-b.cost,x.key==='fencing'?expectedCost:0);}), 'event Revenue stays in People and supplier cost stays in Fencing; other streams unchanged');
    check(near(linked.pl.costJob-baseline.pl.costJob,r2(expectedCost-sourceCost)),'job-end Direct costs replace covered forecast once');
    const oldInstall=baseline.pl.cost.find(x=>x.key==='install'),newInstall=linked.pl.cost.find(x=>x.key==='install');
    check(near(newInstall.now-oldInstall.now,expectedCost)&&near(newInstall.job-oldInstall.job,r2(expectedCost-sourceCost)),'supplier event cost remains Installation — external contractors');
    check(same(linked.pl.cost.filter(x=>x.key!=='install').map(x=>[x.key,x.now,x.job]),baseline.pl.cost.filter(x=>x.key!=='install').map(x=>[x.key,x.now,x.job])),'other Direct cost categories remain unchanged');
    check(near(linked.pl.wages.toDate,baseline.pl.wages.toDate)&&near(linked.pl.wages.toCome,baseline.pl.wages.toCome)&&near(linked.pl.wages.job,baseline.pl.wages.job),'supplier event actuals never become or remove employee wages');
    const branch=baseline.fenceBranch,oldBranch=baseline.branch.rows.find(x=>x.code===branch),newBranch=linked.branch.rows.find(x=>x.code===branch);
    check(oldBranch&&newBranch&&near(newBranch.revenue-oldBranch.revenue,chargeDelta)&&near(newBranch.cost-oldBranch.cost,expectedCost)&&near(newBranch.costJob-oldBranch.costJob,r2(expectedCost-sourceCost)),'customer and supplier effects stay on the established fencing branch');
    check(same(linked.branch.rows.filter(x=>x.code!==branch),baseline.branch.rows.filter(x=>x.code!==branch)),'other branch allocations remain unchanged');
    check(Object.values(linked.branch.checks).every(Boolean)&&Object.values(linked.pl.checks).every(Boolean),'branch and P&L totals reconcile after aggregate actuals');
    check(near(linked.crew.job-baseline.crew.job,-sourceCost),'race crew residual contains only uncovered forecast costs');
    check(linked.fin.filter(r=>sourceIds.has(r.id)).length===sourceRows.length,'raw Finance source rows remain available');
    check(linked.fin.filter(r=>sourceIds.has(r.id)).every(r=>r.coveredByEventNote&&!A.active(r)),'covered source rows are explicitly marked and inactive');
    check(linked.summary.rows.every(r=>!sourceIds.has(r.id)),'Finance summary excludes covered source rows');
    check(near(linked.summary.expectedCost-baseline.summary.expectedCost,-sourceCost),'Finance labour totals remove the covered forecast dollars');
    check(linked.summary.unpricedCount===baseline.summary.unpricedCount,'covered rows do not become spurious unpriced shifts');
    check(linked.review.forecast.rows===baseline.review.forecast.rows-sourceRows.filter(r=>r.status==='forecast').length,'monthly labour review excludes covered forecasts');
    check(linked.acc.all.shifts===baseline.acc.all.shifts-sourceRows.length,'accrual labour model excludes covered source shifts');
    check(linked.workforce.held===0&&linked.workforce.missing===baseline.workforce.missing,'running-sheet missing/held metrics do not flag valid covered days');
    check(!/race-day dockets are not on the record yet/.test(linked.words),'crew wording recognises partial signed-note coverage');
    check(!/144 h with no rate/.test(linked.words+linked.wages),'covered source hours never reappear as unpriced wages');
    check(same(S.finance745,cleanState.finance745)&&same(S.costs,cleanState.costs),'capture creates no individual actuals, Finance journals or roster edits');
    const financeBefore=JSON.stringify(S);
    for(const row of linked.fin.filter(r=>sourceIds.has(r.id)).slice(0,1)){
      const review=fin745Save('review',row.id,{confirmed:true,fingerprint:row.fingerprint,actualCost:1,allocation:'needed',evidence:'Synthetic refusal test'},row.review?row.review.id:null);
      check(!review.ok&&/event|covered|service note/i.test(review.error||''),'native Finance refuses a duplicate covered-shift actual');
      for(const type of ['accrual','wip','allocation']){
        const journal=fin745Save('journal','FIXTURE-COVERED-'+type,{type,workMonth:row.month,postingMonth:row.month,reversalMonth:'',amount:1,sourceIds:[row.id],evidence:'Synthetic refusal test',debit:'',credit:'',status:'draft',approvedBy:'',externalRef:'',linkedJournal:'',note:''},null);
        check(!journal.ok&&/event|covered|service note/i.test(journal.error||''),'native Finance refuses covered source in '+type+' proposal');
      }
    }
    check(JSON.stringify(S)===financeBefore,'Finance refusals leave the entire record unchanged');
    const fakeExtra={...sourceRows[0],id:'FIXTURE-EXTRA-SHIFT'};
    check(A.active(fakeExtra)&&!A.covered(fakeExtra),'extra custom-ID work for the same person/date stays active');
    const projection=serviceNoteRows().filter(n=>fixtureNotes.some(x=>x.id===n.id)),baseProjection=supplierBaseNotes1014().filter(n=>fixtureNotes.some(x=>x.id===n.id));
    check(projection.length===2&&baseProjection.length===2&&projection.every(n=>near(n.cost,baseProjection.find(x=>x.id===n.id).cost)),'receipt reconciliation and final note projection share event supplier cost');
    const oldSupplierPricing=supplierPricing1014,ordinaryBefore=serviceNoteRows().filter(n=>!fixtureNotes.some(x=>x.id===n.id)).map(n=>[n.id,n.cost]);
    let invalidClaims=[];
    try{
      supplierPricing1014=function(){const p=oldSupplierPricing.apply(this,arguments);return {...p,orders:p.orders.concat(invalidClaims)};};
      invalidClaims=[{number:'SYNTHETIC-INVALID-PO',valid:false,errors:['Synthetic unresolved supplier allocation'],records:[{id:fixtureNotes[0].id,book:'green',number:fixtureNotes[0].note_no,date:fixtureNotes[0].date,lines:[]}]}];clear();
      check(A.model().days.length===1&&A.status(fixtureNotes[0]).status==='review'&&!A.model().byDate[fixtureNotes[0].date],'invalid supplier P/O evidence visibly holds only its linked event day');
      check(same(ordinaryBefore,serviceNoteRows().filter(n=>!fixtureNotes.some(x=>x.id===n.id)).map(n=>[n.id,n.cost])),'invalid event supplier claim preserves ordinary unrelated notes');
      let blockedPaper='980055';while(paperNoTaken(blockedPaper))blockedPaper=String(Number(blockedPaper)+10);
      invalidClaims=[{number:'SYNTHETIC-UNRESOLVED-PO',valid:false,errors:['Synthetic unmatched paper claim'],records:[{id:'NO-NATIVE-NOTE-YET',book:'green',number:blockedPaper,date:W.DATES[0],lines:[]}]}];clear();
      check(A.model().days.length===2,'unrelated invalid supplier order leaves valid linked days unchanged');
      const blockedInput={note_no:blockedPaper,date:W.DATES[0],location:'Synthetic invalid supplier allocation',labour_hours:1.5};
      blockedInput.event_allocation=A.makeAllocation(blockedInput,A.environment(),{by:actor,on:day,text:'Synthetic source guard rehearsal'});
      const beforeClaim=JSON.stringify(S),blockedNote=recordServiceNote(blockedInput);clear();
      check(!blockedNote&&JSON.stringify(S)===beforeClaim,'native capture refuses a new paper already claimed by invalid supplier P/O evidence without a partial save');
    }finally{supplierPricing1014=oldSupplierPricing;clear();}
    const oldSupplierEntry=supplierEntry1014;
    try{
      supplierEntry1014=function(book,id){return book==='green'&&id===fixtureNotes[0].id?{date:fixtureNotes[0].date,amount:1870,po:'SYNTHETIC-PO',branch:baseline.fenceBranch,lines:[{qty:10,rate:100,paid:1000,cents:100000},{qty:7.25,rate:120,paid:870,cents:87000}]}:oldSupplierEntry.apply(this,arguments);};clear();
      const priced=serviceNoteRows().find(n=>n.id===fixtureNotes[0].id),rawPriced=supplierBaseNotes1014().find(n=>n.id===fixtureNotes[0].id),approved=A.model().byId[fixtureNotes[0].id];
      check(priced&&near(priced.cost,1870)&&priced.cost_rate===null,'approved mixed supplier prices retain their exact source amount');
      check(rawPriced&&near(rawPriced.cost,1870)&&approved&&near(approved.amount,1870)&&approved.rate===null,'shared evidence and receipt model agree with approved supplier prices');
      check(near(RaceCrew1227.model(day).recordedCost,r2(1870+hours[1]*supplierRate)),'crew explanation shares the approved supplier total');
    }finally{supplierEntry1014=oldSupplierEntry;clear();}
    const linkedState=clone(S);
    const mealId=addOurCost('meals',{person:sourceRows[0].person,date:sourceRows[0].date,amount:9.25,description:'Synthetic independent meal fixture'});clear();
    const expenseDay=runDay(sourceRows[0].date),expenseRow=expenseDay.rows.find(r=>r.name===sourceRows[0].person);
    check(mealId&&expenseRow&&expenseRow.coveredByEventNote&&expenseRow.shift.id===sourceRows[0].id&&near(expenseRow.meal.amount,9.25)&&expenseRow.pay===null&&expenseRow.total>=9.25,'covered roster retains raw shift and independent meal cost');
    putState(linkedState);
    S.rates={...(S.rates||{}),[scopeKey('rate','fence')]:83.42};clear();
    // Independent cents × fixed-point hours expectation keeps an exact half-cent from floating down.
    const typedExpected=Math.round(Math.round(expectedHours*10000)*8342/10000)/100;
    const typedLine=scopeFigures().lines.find(l=>l.key==='fence');check(typedLine.rate_typed&&near(typedLine.rate,83.42),'typed customer rate keeps precedence');check(near(typedLine.amount,typedExpected),'typed customer rate prices aggregate actual hours to the correct cent');
    putState(linkedState);S.fenceCosts={...(S.fenceCosts||{}),labour:150.75};clear();
    check(serviceNoteRows().filter(n=>fixtureNotes.some(x=>x.id===n.id)).every(n=>near(n.cost,r2(n.labour_hours*150.75))),'typed supplier labour rate keeps precedence');
    putState(linkedState);S.fenceCosts={...(S.fenceCosts||{}),labour:83.42};
    let centNo='980066';while(paperNoTaken(centNo))centNo=String(Number(centNo)+10);
    const centInput={note_no:centNo,date:W.DATES[0],location:'Synthetic decimal boundary',labour_hours:109.75};
    centInput.event_allocation=A.makeAllocation(centInput,A.environment(),{by:actor,on:day,text:'Confirmed synthetic aggregate for this whole event day.'});clear();
    const oldFlash=flash,centFlashes=[];let centNote;try{flash=message=>centFlashes.push(String(message));centNote=recordServiceNote(centInput);}finally{flash=oldFlash;}clear();
    const centSource=serviceNoteRows().find(n=>n.id===centNote.id),centBase=supplierBaseNotes1014().find(n=>n.id===centNote.id),centModel=A.model().byId[centNote.id];
    check(near(centSource.cost,9155.35)&&near(centBase.cost,9155.35)&&near(centModel.amount,9155.35),'native supplier amount and receipt source agree at the decimal half-cent boundary');
    check(centFlashes.some(text=>text.includes(money(9155.35))),'native save confirmation agrees with the exact linked supplier cents');
    putState(linkedState);
    const raw=S.serviceNotes.find(n=>n.id===fixtureNotes[0].id);raw.labour_hours+=1;clear();
    const stale=A.status(raw);check(stale&&stale.status==='review'&&stale.errors.length>0&&!A.model().byDate[raw.date],'edited source hours hold their stale linkage visibly');
    const staleCard=document.createElement('div');staleCard.innerHTML=fencePrivateRow(serviceNoteRows().find(n=>n.id===raw.id));staleCard.querySelectorAll('details').forEach(e=>e.remove());
    check(/Event allocation needs review/i.test(staleCard.textContent),'current fencing card exposes stale-allocation warning without expanding evidence');
    check(!scopeFigures().lines.find(l=>l.key==='fence').days.find(d=>d.date===raw.date).aggregate1237,'stale linkage restores the source customer day');
    putState(linkedState);
    const aside=setAside('serviceNotes',fixtureNotes[0].id,actor);clear();
    check(aside&&tombedHere(fixtureNotes[0].id)&&!A.model().byDate[fixtureNotes[0].date],'native set-aside restores the original day coverage');
    const back=putBack(fixtureNotes[0].id,actor);clear();
    check(back&&!tombedHere(fixtureNotes[0].id)&&A.model().days.length===2,'native put-back restores the confirmed day once');
    putState(linkedState);
    S.serviceNotes=S.serviceNotes.filter(n=>n.id!==fixtureNotes[0].id);clear();
    check(!A.model().byDate[fixtureNotes[0].date]&&A.model().byDate[fixtureNotes[1].date],'removing one note restores only its original day');
    putState(linkedState);
    const added={...fixtureNotes[0],id:'FIXTURE-ORDINARY',note_no:'980099',labour_hours:7};delete added.event_allocation;S.serviceNotes.push(added);clear();
    check(A.model().days.length===2&&!A.status(added)&&serviceNoteRows().some(n=>n.id===added.id),'ordinary additional same-day work remains independent');
    putState(linkedState);
    const coveredId=sourceRows[0].id,month=sourceRows[0].month,at=new Date().toISOString(),key='FIXTURE-WITHDRAWN-JOURNAL';
    const payload={type:'accrual',workMonth:month,postingMonth:month,reversalMonth:'',amount:1,sourceIds:[coveredId],evidence:'Synthetic withdrawn proposal',debit:'',credit:'',status:'draft',approvedBy:'',externalRef:'',linkedJournal:'',note:''};
    const old={id:'FIXTURE-JOURNAL-OLD',kind:'journal',key,prev:null,at,by:actor,payload},voided={...old,id:'FIXTURE-JOURNAL-VOID',prev:old.id,payload:{...payload,status:'void'}};
    S.finance745={...(S.finance745||{}),[old.id]:old,[voided.id]:voided};clear();
    check(A.model().days.length===2,'a superseded withdrawn journal does not block coverage forever');
    delete S.finance745[voided.id];clear();
    check(!A.model().byDate[sourceRows[0].date],'a current active journal holds affected coverage for reconciliation');
    putState(linkedState);
    // The source form must refuse invalid explicit allocations without saving a partial note.
    for(const invalid of [Infinity,-1,0,17.255]){
      const f={note_no:'980088',date:dates[0],location:'Synthetic invalid fixture',labour_hours:invalid};f.event_allocation=A.makeAllocation(f,A.environment(),{by:actor,on:day,text:'Synthetic invalid fixture'});
      const before=JSON.stringify(S);const n=recordServiceNote(f);check(!n&&JSON.stringify(S)===before,'invalid explicit aggregate hours refused: '+String(invalid));
    }
    putState(linkedState);
    const third={note_no:'980077',date:W.DATES[0],location:'Synthetic remaining event day',labour_hours:1.5};
    third.event_allocation=A.makeAllocation(third,A.environment(),{by:actor,on:day,text:'Confirmed existing crew for this whole event day.'});
    const thirdNote=recordServiceNote(third);clear();
    const completeCrew=RaceCrew1227.model(day),completeWords=RaceCrew1227.words(completeCrew,'charge');
    check(thirdNote&&completeCrew.shifts===0&&completeCrew.job===0,'all linked event days leave no residual supplier forecast');
    check(/recorded|signed/i.test(completeWords)&&/invoice\/payment unverified/.test(completeWords),'fully covered event retains its recorded-evidence explanation');
    check(near(serviceNoteRows().find(n=>n.id===thirdNote.id).cost,r2(1.5*supplierRate)),'aggregate source hours receive no invented per-person minimum');
    putState(cleanState);clear();
    const restored=capture();check(same(restored,baseline),'all models restore exactly after removing fixture notes');
   } catch(error){checks.push({name:'native test execution: '+error.message,ok:false});}
   finally{putState(saved);if(who)who.value=oldWho;mayWrite=write;capability=cap;SYNC.readonly=true;SYNC.level='view';syncSend=sender;finalStateRestored=JSON.stringify(S)===savedText;}
   checks.push({name:'entire original browser record restored',ok:finalStateRestored});return {checks};
  }));
  result.checks.push({name:'zero page runtime errors',ok:s.errors.length===0},{name:'zero HTTP write attempts',ok:s.counts.blocked===0});
  for(const c of result.checks)console.log((c.ok?'PASS ':'FAIL ')+c.name);
  const passed=result.checks.filter(c=>c.ok).length;console.log(passed+'/'+result.checks.length+' '+(process.env.MOB==='1'?'phone':'desktop')+' native checks');
  process.exitCode=passed===result.checks.length?0:1;
 }finally{clearTimeout(deadline);await s.browser.close();}
})().catch(e=>{console.error('FAIL native harness: '+String(e.message));process.exitCode=1;});
