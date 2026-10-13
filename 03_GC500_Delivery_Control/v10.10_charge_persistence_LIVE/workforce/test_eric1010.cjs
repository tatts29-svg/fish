// Author: Andrew Fisher. Native proposal boundary checks; no service access.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {verify}=require('./native_eric1010.cjs');
const context={window:{},runType:v=>v==='External'?'hire':'salary',DailyStaff988:{nameKey:n=>String(n).trim().replace(/\s+/g,' ').toLowerCase()}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'native_eric_source1010.js'),'utf8'),context);
const api=context.window.EricNative1010,clone=x=>JSON.parse(JSON.stringify(x));let checks=0;
function check(ok,label){assert.ok(ok,label);checks++;}
const snapshot={today:'2026-10-14',daniel:{person:'Daniel Gough',type:'External',pay_rate:55.7},override:null,rateIssues:[],rate:55.7,labourAllocation:[{stream:'Labour',by:{KINP:1000}}],person:null,personDeleted:false,shift:null,shiftDeleted:false,staff:{count:5,names:['Aaron Zelvis','Alfie Harris','Daniel Gough','Andrew Fisher','Kyle Gover']}};
const actions=clone(api.plan(snapshot)),person=actions.find(x=>x.kind==='person'),shift=actions.find(x=>x.kind==='shift'),staff=actions.find(x=>x.kind==='availability');
check(actions.length===3,'exactly person, date and availability actions');
check(person.fields.pay_rate===55.7&&person.fields.branch==='NOIS'&&person.fields.type==='External','source rate, home and labour hire');
check(!Object.hasOwn(person.fields,'employer'),'no invented employer');
check(!Object.hasOwn(shift.fields,'hours')&&!Object.hasOwn(shift.fields,'start')&&!Object.hasOwn(shift.fields,'finish'),'no invented hours');
check(shift.date==='2026-10-14','only requested today');
check(staff.values.count===6&&staff.values.names.at(-1)==='Eric Lucian','six available with Eric once');
check(snapshot.staff.names.every(n=>staff.values.names.includes(n)),'existing roster preserved');
const same=clone(snapshot);same.person={person:'Eric Lucian',type:'External',branch:'NOIS',pay_rate:55.7};same.shift={person:'Eric Lucian',date:'2026-10-14',hours:7.5};same.staff=staff.values;
check(api.plan(same).length===0,'repeated run is a no-op and existing hours retained');
for(const [label,edit]of [
 ['wrong date',s=>s.today='2026-10-15'],['changed rate',s=>s.rate=56],['conflicting rate',s=>s.rateIssues=['conflict']],['wrong cost branch',s=>s.labourAllocation=[{by:{NOIS:1000}}]],['deleted person',s=>s.personDeleted=true],['deleted shift',s=>s.shiftDeleted=true],['existing conflicting person',s=>s.person={person:'Eric Lucian',type:'External',branch:'KINP',pay_rate:55.7}],['incorrect source identity',s=>s.daniel.person='Somebody Else']]){
 const input=clone(snapshot);edit(input);assert.throws(()=>api.plan(input),/Eric roster stopped/,label);checks++;
}
const unnamed=clone(snapshot);unnamed.staff.count=7;
check(api.plan(unnamed).find(a=>a.kind==='availability').values.count===8,'preserves unnamed available people');
const caseVariant=clone(same);caseVariant.staff.names[5]=' Eric  Lucian ';
check(api.plan(caseVariant).length===0,'case/spacing match does not duplicate person');
const record={...snapshot,person:{id:api.PID,person:'Eric Lucian',type:'External',branch:'NOIS',pay_rate:55.7},shift:{id:api.SID,person:'Eric Lucian',date:api.DATE,hours:null,start:null,finish:null,break_min:null},staff:staff.values};
const staged={record,views:{daily:[{rate:55.7,shift:{date:'2026-10-14'}}],missingHours:[{date:'2026-10-14'}],finance:[]},changes:[{collection:'costs'},{collection:'loads'}]};
check(verify(staged,{expected:snapshot}).pass,'independent successful verification');
for(const [label,edit]of [['wrong home',x=>x.record.person.branch='KINP'],['fabricated employer',x=>x.record.person.employer='JOB CONNECT'],['fabricated hours',x=>x.record.shift.hours=8],['missing Kyle',x=>x.record.staff.names=x.record.staff.names.filter(n=>n!=='Kyle Gover')],['extra finance posting',x=>x.changes.push({collection:'finance745'})]]){
 const changed=clone(staged);edit(changed);check(!verify(changed,{expected:snapshot}).pass,label+' rejected');
}
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
