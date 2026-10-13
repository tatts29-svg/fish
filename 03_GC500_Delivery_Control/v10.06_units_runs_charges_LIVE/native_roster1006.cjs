/* Author: Andrew Fisher. Adapter for the guarded native record runner. No source data or rates embedded. */
'use strict';
const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'native_roster_source1006.js'),'utf8');
const prepare=new Function('return function(){'+source+';const expected=KyleNative1006.capture();return {before:expected.docs,expected,actions:KyleNative1006.plan(expected)};}')();
const apply=new Function('return function(plan){'+source+';const result=KyleNative1006.apply({expected:plan.expected,backupConfirmed:true,commit:true});return {before:result.before.docs,after:result.after.docs,queue:JSON.parse(JSON.stringify(SYNC.queue)),days:result.after.days,person:result.after.person,changes:result.changes,actions:result.actions};}')();
function verify(staged,plan){
 const key=n=>String(n||'').trim().replace(/\s+/g,' ').toLowerCase();
 const checks={
  existingPerson:staged.person.id==='W-P-kyle-gover',
  unchangedPayAndBranch:staged.person.pay_rate===plan.expected.person.pay_rate&&staged.person.branch===plan.expected.person.branch&&staged.person.employer===plan.expected.person.employer,
  twelveDays:staged.days.length===12,
  onceEachDay:staged.days.every(day=>day.staff.names.filter(name=>key(name)==='kyle gover').length===1),
  othersPreserved:staged.days.every(day=>plan.expected.days.find(old=>old.date===day.date).staff.names.every(name=>day.staff.names.some(now=>key(name)===key(now)))),
  nightConfirmed:staged.days.filter(day=>day.date>='2026-10-23').every(day=>String(day.raw.note).startsWith('Night shift confirmed by Andrew Fisher, 13 Oct 2026.')),
  oldDaytimeAssumptionsRemoved:staged.days.filter(day=>day.date>='2026-10-23').every(day=>{const old=plan.expected.days.find(r=>r.date===day.date);return String(old.raw?.note||'').startsWith('Night shift confirmed by Andrew Fisher, 13 Oct 2026.')||day.raw.hours===null&&day.raw.start===null&&day.raw.finish===null;}),
  realBuildHoursPreserved:staged.days.filter(day=>day.date<'2026-10-23').every(day=>{const old=plan.expected.days.find(r=>r.date===day.date);return !old.raw||old.deleted||['start','finish','hours','break_min'].every(k=>JSON.stringify(day.raw[k])===JSON.stringify(old.raw[k]));})
 };
 return {author:'Andrew Fisher',pass:Object.values(checks).every(Boolean),checks,plannedDays:staged.days.map(day=>({date:day.date,available:day.staff.count,shift:day.date>='2026-10-23'?'night':'build'}))};
}
module.exports={prepare,apply,verify};
