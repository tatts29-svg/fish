/* Author: Andrew Fisher. Isolated native review/hydration rehearsals; no record writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.STATE&&process.env.OUT,'Candidate, frozen state and private output required');
 const s=await openCandidate();
 try{
  const result=await s.page.evaluate(()=>holdAssets(()=>{
   const original=EventCrew1237.model,docs=()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
   const before=docs(),env=EventCrew1237.environment(),source=env.notes.find(note=>note.event_allocation);
   const clear=()=>{RENDER_MEMO.clear();HELD_MEMO.clear();};
   clear();const baseline=scopeFigures(),line=baseline.lines.find(row=>row.key==='fence');
   const duplicate={...source,id:String(source.id)+'-synthetic-review'};
   const cases=[
    ['hydrating',{...env,notes:[]}],
    ['ambiguous source',{...env,notes:env.notes.concat(duplicate)}],
    ['supplier price review',{...env,rateConflicts:{...env.rateConflicts,[env.days[0]]:['Synthetic supplier-only review']}}]
   ];
   const checks=[];
   try{
    for(const [name,input]of cases){
     const evidence=EventCrew1237.resolve(input);EventCrew1237.model=()=>evidence;clear();
     const scope=scopeFigures(),fence=scope.lines.find(row=>row.key==='fence'),money=moneySummary(),crew=RaceCrew1227.model(),all=FenceAllIn12423.model(),assurance=ChargeAssurance1224.model(),reconciliation=recon888Model();
     renderCosts();renderPricing();
     checks.push({name,
      customerComplete:evidence.customer.complete,
      customerHours:fence.hours,customerAmount:fence.amount,
      expectedHours:line.hours,expectedAmount:line.amount,
      knownScopeTotal:scope.total,expectedKnownSubtotal:Math.round((baseline.total-line.amount)*100)/100,
      accessPlanStatusUnchanged:scope.provisional===baseline.provisional,
      review:scope.customer_review12451||null,missing:money.missing||[],missingShort:money.missing_short||[],
      assurance:assurance.state,assuranceUnavailable:assurance.checks.some(row=>row.label==='Documented customer fencing hours'&&row.status==='unavailable'),
      reconciliation:reconciliation.ok,allScope:all.scope,allScopeHours:all.scopeH,allReview:all.scopeReview12451||null,
      crewCharge:crew.charge,crewWords:RaceCrew1227.words(crew,'charge'),
      pricingText:document.querySelector('#pane-pricing [data-customer-hours12451]')?.textContent||'',
      fencingHeading:document.querySelector('#fence-allin12423 h3')?.textContent||'',
      fencingText:document.querySelector('#fence-allin12423')?.textContent||'',
      costsRendered:!!document.getElementById('pane-costs')?.children.length,
      sourceDocumentsUnchanged:docs()===before});
    }
   }finally{EventCrew1237.model=original;clear();renderCosts();renderPricing();}
   return {checks,documentsRestored:docs()===before,restoredScope:scopeFigures(),baseline};
  }));
  let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
  for(const row of result.checks){
   check(row.name+' renders Costs',()=>assert(row.costsRendered));
   check(row.name+' preserves source documents',()=>assert(row.sourceDocumentsUnchanged));
   check(row.name+' preserves source access-plan status',()=>assert(row.accessPlanStatusUnchanged));
   if(row.name==='supplier price review'){
    check('supplier-only conflict retains complete customer evidence',()=>assert(row.customerComplete));
    check('supplier-only conflict retains confirmed customer hours',()=>assert.equal(row.customerHours,row.expectedHours));
    check('supplier-only conflict retains confirmed customer cents',()=>assert.equal(row.customerAmount,row.expectedAmount));
    check('supplier-only conflict does not add a customer review hold',()=>assert.equal(row.review,null));
    check('supplier-only conflict keeps the complete fencing heading',()=>assert.equal(row.fencingHeading,'Fencing, everything included'));
   }else{
    check(row.name+' customer hours are unavailable, not zero or plan',()=>assert.equal(row.customerHours,null));
    check(row.name+' customer amount is unavailable',()=>assert.equal(row.customerAmount,null));
    check(row.name+' scope retains only known other roles',()=>assert.equal(row.knownScopeTotal,row.expectedKnownSubtotal));
    check(row.name+' explicit customer review survives',()=>assert(row.review?.length));
    check(row.name+' native missing-charge explanation is present',()=>assert(row.missing.some(text=>/unconfirmed charge is excluded from the known subtotal/.test(text))&&row.missingShort.some(text=>/excludes unconfirmed customer fencing hours/.test(text))));
    check(row.name+' assurance is unavailable',()=>assert(row.assurance==='unavailable'&&row.assuranceUnavailable));
    check(row.name+' cannot claim complete reconciliation',()=>assert.equal(row.reconciliation,false));
    check(row.name+' fencing summary preserves unknown customer amount',()=>assert(row.allScope===null&&row.allScopeHours===null&&row.allReview));
    check(row.name+' supplier model customer reference remains unknown',()=>assert(row.crewCharge.hours===null&&row.crewCharge.amount===null&&row.crewCharge.review12451));
    check(row.name+' pricing uses the existing review/subtotal language',()=>assert(/Needs review/.test(row.pricingText)&&/excluded from the known subtotal/.test(row.pricingText)));
    check(row.name+' fencing heading and footer disclose known subtotal',()=>assert(row.fencingHeading==='Fencing — known subtotal'&&/Known subtotal/.test(row.fencingText)&&!/Everything included/.test(row.fencingText)));
   }
  }
  check('source documents restored exactly',()=>assert(result.documentsRestored));
  check('current shared scope restored exactly',()=>assert.deepEqual(result.restoredScope,result.baseline));
  check('zero runtime errors',()=>assert.deepEqual(s.errors,[]));
  check('zero console errors',()=>assert.deepEqual(s.consoleErrors,[]));
  check('zero HTTP writes',()=>assert.equal(s.counts.blocked,0));
  fs.mkdirSync(process.env.OUT,{recursive:true});
  fs.writeFileSync(path.join(process.env.OUT,'customer-hours-review-native.json'),JSON.stringify({baseline:s.baseline,result,validation:{passed,failed:0},errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked},null,2)+'\n');
  console.log(passed+' native customer-hours review checks PASS');
 }finally{await s.browser.close();}
})().catch(error=>{console.error('FAIL customer hours review gate: '+error.stack);process.exitCode=1;});
