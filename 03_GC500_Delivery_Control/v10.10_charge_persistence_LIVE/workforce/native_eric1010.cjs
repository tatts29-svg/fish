/* Author: Andrew Fisher. Adapter for backed-up native operator correction. */
'use strict';
const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'native_eric_source1010.js'),'utf8');
const prepare=new Function('return function(){'+source+';const expected=EricNative1010.capture();return {before:expected.docs,expected,actions:EricNative1010.plan(expected)};}')();
const apply=new Function('return function(plan){'+source+';const result=EricNative1010.apply({expected:plan.expected,backupConfirmed:true,commit:true});return {before:result.before.docs,after:result.after.docs,queue:JSON.parse(JSON.stringify(SYNC.queue)),record:result.after,views:{daily:runDay(EricNative1010.DATE).rows.filter(r=>r.name===EricNative1010.PERSON),missingHours:Roster1006.missing().filter(r=>r.person===EricNative1010.PERSON),finance:fin745Rows().filter(r=>r.person===EricNative1010.PERSON)},changes:result.changes,actions:result.actions};}')();
function verify(staged,plan){
 const key=n=>String(n||'').trim().replace(/\s+/g,' ').toLowerCase(),r=staged.record,prior=plan.expected;
 const checks={
  todayAEST:r.today==='2026-10-14',person:r.person.id==='W-P-eric-lucian'&&r.person.person==='Eric Lucian',
  labourHire:r.person.type==='External',homeNOIS:r.person.branch==='NOIS',rateCopied:r.person.pay_rate===prior.rate&&prior.rate===55.70,
  noInventedEmployer:!!prior.person||!r.person.employer,
  shift:r.shift.id==='W-L-eric-lucian-20261014'&&r.shift.date==='2026-10-14',
  noInventedHours:prior.shift?['start','finish','hours','break_min'].every(k=>JSON.stringify(r.shift[k])===JSON.stringify(prior.shift[k])):['start','finish','hours','break_min'].every(k=>r.shift[k]==null||r.shift[k]===''),
  onceAvailable:r.staff.names.filter(n=>key(n)==='eric lucian').length===1,
  othersPreserved:prior.staff.names.every(n=>r.staff.names.some(x=>key(x)===key(n))),
  correctCount:r.staff.count===Math.max(r.staff.names.length,prior.staff.count+(prior.staff.names.some(n=>key(n)==='eric lucian')?0:1)),
  allocationKINP:r.labourAllocation.length>0&&r.labourAllocation.every(x=>Object.keys(x.by||{}).every(k=>k==='KINP')),
  sourceUnchanged:JSON.stringify(r.daniel)===JSON.stringify(prior.daniel)&&JSON.stringify(r.override)===JSON.stringify(prior.override),
  dailyVisible:staged.views.daily.length===1&&staged.views.daily[0].shift?.date==='2026-10-14'&&staged.views.daily[0].rate===55.70,
  missingHoursExplicit:!!prior.shift||staged.views.missingHours.some(r=>r.date==='2026-10-14'),
  noInventedFinanceActual:!!prior.shift||!staged.views.finance.some(r=>r.date==='2026-10-14'),
  noFinancialPostings:staged.changes.every(c=>!['finance745','pos','fencing'].includes(c.collection))
 };
 return {author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks,person:'Eric Lucian',day:r.today,hourlyPayRate:r.person.pay_rate,homeBranch:r.person.branch,chargeBranch:'KINP',hours:'Not supplied',available:r.staff.count};
}
module.exports={prepare,apply,verify};
