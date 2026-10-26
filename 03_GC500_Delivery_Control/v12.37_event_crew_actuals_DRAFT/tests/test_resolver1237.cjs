/* Author: Andrew Fisher. Synthetic, offline evidence-allocation regression tests. */
'use strict';
const assert=require('node:assert/strict'),path=require('path');
const api=require(path.join(__dirname,'../eventcrew1237_src.js'));
const clone=x=>JSON.parse(JSON.stringify(x));
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('PASS '+name);}catch(e){fail++;console.error('FAIL '+name+': '+e.message);}}
function env(){return{notes:[],days:['2030-02-01','2030-02-02','2030-02-03'],scopeKey:'fence',scopeDocument:'SYNTHETIC-EVENT-SCOPE',group:'SYNTHETIC-CREW',quote:{number:'QUOTE-FIXTURE',rate:120.25},today:'2030-02-04',deleted:[],financeConflicts:{},rateConflicts:{}};}
function note(e,id='FIXTURE-NOTE-A',number='980001',day='2030-02-02',hours=17.25){const n={id,note_no:number,date:day,labour_hours:hours,recorded_by:'Fixture recorder',usable:true};n.event_allocation=api.makeAllocation(n,e,{by:'Fixture recorder',on:'2030-02-04',text:'Confirmed same existing crew for the whole event day.'});return n;}
function one(change){const e=env(),n=note(e);if(change)change(n,e);e.notes.push(n);return api.resolve(e);}
function held(r){assert.equal(r.days.length,0);assert.equal(r.hours,0);assert.equal(r.amount,0);assert(r.issues.length>0,'Rejected linkage must remain visible for review');}
test('empty evidence leaves no coverage',()=>assert.deepEqual(api.resolve(env()),{byId:{},byDate:{},days:[],issues:[],hours:0,amount:0}));
test('unlinked same-day text never establishes coverage',()=>{const e=env(),n=note(e);delete n.event_allocation;n.location='Event crew';n.crew_note='Same crew';e.notes=[n];assert.equal(api.resolve(e).days.length,0);});
test('valid whole-day note keeps aggregate hours and rounds supplier cents once',()=>{const r=one();assert.equal(r.days.length,1);assert.equal(r.hours,17.25);assert.equal(r.amount,2074.31);assert.equal(r.days[0].rate,120.25);assert.equal(r.days[0].status,'valid');});
test('different linked days add their distinct aggregate costs once',()=>{const e=env();e.notes=[note(e),note(e,'FIXTURE-NOTE-B','980002','2030-02-03',23.5)];const r=api.resolve(e);assert.equal(r.days.length,2);assert.equal(r.hours,40.75);assert.equal(r.amount,4900.19);});
// Integer hour hundredths × rate cents is independent of floating-point multiplication.
for(const [hours,rate]of[[109.75,83.42],[0.25,0.02],[0.75,1.34],[99.99,0.50]])test('decimal supplier half-cent boundary '+hours+' × '+rate,()=>{
 const e=env();e.supplierRate=rate;e.notes=[note(e,'FIXTURE-CENTS','980009','2030-02-02',hours)];
 const expected=Math.round(Math.round(hours*100)*Math.round(rate*100)/100)/100,r=api.resolve(e);
 assert.equal(r.days.length,1);assert.equal(r.days[0].amount,expected);assert.equal(r.amount,expected);
});
test('distinct supplier notes sum their rounded amounts once',()=>{const e=env();e.supplierRate=0.02;e.notes=[note(e,'FIXTURE-CENTS-A','980007','2030-02-02',0.25),note(e,'FIXTURE-CENTS-B','980008','2030-02-03',0.25)];const r=api.resolve(e);assert.equal(r.days[0].amount,0.01);assert.equal(r.days[1].amount,0.01);assert.equal(r.amount,0.02);});
test('small aggregate hours do not inherit an invented individual minimum',()=>{const e=env();e.quote.minimumHours=4;e.notes=[note(e,'FIXTURE-NOTE-A','980001','2030-02-02',1.25)];assert.equal(api.resolve(e).amount,150.31);});
test('explicit supplier rate preserves its precedence',()=>{const r=one((n,e)=>e.supplierRate=101.35);assert.equal(r.days[0].rate,101.35);assert.equal(r.amount,1748.29);});
test('consistent dated supplier rate preserves its precedence',()=>{const r=one((n,e)=>{e.supplierRate=101.35;e.ratesByDay={'2030-02-02':99.95};});assert.equal(r.days[0].rate,99.95);assert.equal(r.amount,1724.14);});
test('approved per-note supplier amount wins without inventing a uniform rate',()=>{const r=one((n,e)=>e.approvedPrices={[n.id]:{date:n.date,hours:n.labour_hours,amount:1870,rate:null}});assert.equal(r.days[0].amount,1870);assert.equal(r.days[0].rate,null);assert.equal(r.amount,1870);});
test('invalid supplier claim against note identity holds event coverage',()=>held(one((n,e)=>e.invalidSupplierClaims=[{id:n.id,book:'green',number:'980099',po:'PO-FIXTURE',errors:['Fixture invalid allocation']}])));
test('invalid green supplier paper claim holds a new native identity',()=>held(one((n,e)=>e.invalidSupplierClaims=[{id:'NOT-YET-NATIVE',book:'green',number:n.note_no,po:'PO-FIXTURE',errors:['Fixture unresolved paper claim']}])));
test('invalid supplier claim takes precedence over an approved pricing fallback',()=>held(one((n,e)=>{e.approvedPrices={[n.id]:{date:n.date,hours:n.labour_hours,amount:1870,rate:null}};e.invalidSupplierClaims=[{id:n.id,book:'green',number:n.note_no,po:'PO-FIXTURE',errors:['Fixture conflicting claim']}];})));
test('unrelated invalid supplier claim does not hold the linked event day',()=>{const r=one((n,e)=>e.invalidSupplierClaims=[{id:'UNRELATED',book:'green',number:'980099',po:'PO-FIXTURE',errors:['Fixture unrelated issue']}]);assert.equal(r.days.length,1);assert.equal(r.issues.length,0);});
test('other book paper number does not masquerade as a green-note claim',()=>{const r=one((n,e)=>e.invalidSupplierClaims=[{id:'UNRELATED',book:'red',number:n.note_no,po:'PO-FIXTURE',errors:['Fixture other book issue']}]);assert.equal(r.days.length,1);assert.equal(r.issues.length,0);});
test('ordinary unlinked notes retain their existing treatment despite supplier claims',()=>{const e=env(),n=note(e);delete n.event_allocation;e.notes=[n];e.invalidSupplierClaims=[{id:n.id,book:'green',number:n.note_no,po:'PO-FIXTURE',errors:['Fixture ordinary issue']}];const r=api.resolve(e);assert.equal(r.days.length,0);assert.equal(r.issues.length,0);assert.deepEqual(r.byId,{});});
test('approved quantity mismatch is visibly held',()=>held(one((n,e)=>e.approvedPrices={[n.id]:{date:n.date,hours:99,amount:1870,rate:null}})));
test('approved date mismatch is visibly held',()=>held(one((n,e)=>e.approvedPrices={[n.id]:{date:'2030-02-01',hours:n.labour_hours,amount:1870,rate:null}})));
for(const [name,change] of [
 ['null link',n=>n.event_allocation=null],
 ['array link',n=>n.event_allocation=[]],
 ['unknown link field',n=>n.event_allocation.extra=true],
 ['unsupported version',n=>n.event_allocation.version=2],
 ['wrong kind',n=>n.event_allocation.kind='partial-day'],
 ['wrong customer scope',n=>n.event_allocation.scope_key='other'],
 ['stale scope document',n=>n.event_allocation.scope_document='OLD'],
 ['wrong roster group',n=>n.event_allocation.roster_group='OTHER'],
 ['stale quote',n=>n.event_allocation.quote='OLD'],
 ['missing source',n=>delete n.event_allocation.source],
 ['unknown source field',n=>n.event_allocation.source.extra=1],
 ['changed source paper',n=>n.note_no='980099'],
 ['changed source date',n=>n.date='2030-02-03'],
 ['changed source hours',n=>n.labour_hours=18],
 ['missing confirmation name',n=>n.event_allocation.confirmed_by=' '],
 ['missing confirmation words',n=>n.event_allocation.confirmation=''],
 ['impossible confirmation date',n=>n.event_allocation.confirmed_on='2030-02-30'],
 ['future confirmation',n=>n.event_allocation.confirmed_on='2030-02-05'],
 ['missing source identity',n=>delete n.id],
 ['invalid paper number',n=>{n.note_no='ABC';n.event_allocation.source.note_no='ABC';}],
 ['date outside event',n=>{n.date='2030-01-01';n.event_allocation.source.date=n.date;}],
 ['impossible work date',n=>{n.date='2030-02-30';n.event_allocation.source.date=n.date;}],
 ['zero hours',n=>{n.labour_hours=0;n.event_allocation.source.labour_hours=0;}],
 ['negative hours',n=>{n.labour_hours=-1;n.event_allocation.source.labour_hours=-1;}],
 ['infinite hours',n=>{n.labour_hours=Infinity;n.event_allocation.source.labour_hours=Infinity;}],
 ['NaN hours',n=>{n.labour_hours=NaN;n.event_allocation.source.labour_hours=NaN;}],
 ['unsupported precision',n=>{n.labour_hours=17.255;n.event_allocation.source.labour_hours=17.255;}],
 ['unbounded hours',n=>{n.labour_hours=10001;n.event_allocation.source.labour_hours=10001;}],
 ['negative supplier rate',(n,e)=>e.supplierRate=-1],
 ['infinite supplier rate',(n,e)=>e.supplierRate=Infinity],
 ['conflicting supplier rates',(n,e)=>e.rateConflicts[n.date]=['Fixture conflicting rate']],
 ['existing Finance coverage',(n,e)=>e.financeConflicts[n.date]=['Fixture existing review']]
])test(name+' is visibly held',()=>held(one(change)));
test('duplicate paper numbers invalidate the proposed linkage',()=>{const e=env(),n=note(e);e.notes=[n,{id:'FIXTURE-UNLINKED',note_no:n.note_no,date:n.date,labour_hours:2}];held(api.resolve(e));});
test('two whole-day notes never silently replace one another',()=>{const e=env();e.notes=[note(e),note(e,'FIXTURE-NOTE-B','980002')];const r=api.resolve(e);held(r);assert.equal(r.issues.length,2);});
test('duplicate record identity across dates cannot cost twice',()=>{const e=env();e.notes=[note(e),note(e,'FIXTURE-NOTE-A','980002','2030-02-03',23.5)];held(api.resolve(e));});
test('a tombstoned note does not cover or suppress a forecast',()=>{const e=env(),n=note(e);e.notes=[n];e.deleted=[n.id];const r=api.resolve(e);assert.equal(r.days.length,0);assert.equal(r.amount,0);});
test('function tombstone lookup also removes coverage',()=>{const e=env(),n=note(e);e.notes=[n];e.deleted=id=>id===n.id;assert.equal(api.resolve(e).days.length,0);});
test('explicitly unusable evidence never covers a forecast',()=>{const r=one(n=>n.usable=false);assert.equal(r.days.length,0);assert.equal(r.amount,0);});
test('deleting one duplicate restores the single valid day',()=>{const e=env(),a=note(e),b=note(e,'FIXTURE-NOTE-B','980002');e.notes=[a,b];e.deleted=[b.id];const r=api.resolve(e);assert.equal(r.days.length,1);assert.equal(r.byDate[a.date].id,a.id);});
test('ordinary additional work on same date is retained and unlinked',()=>{const e=env(),n=note(e);e.notes=[n,{id:'FIXTURE-ADDITIONAL',note_no:'980003',date:n.date,labour_hours:7,location:'Event'}];const before=JSON.stringify(e);const r=api.resolve(e);assert.equal(r.days.length,1);assert.equal(r.hours,17.25);assert.equal(r.byId['FIXTURE-ADDITIONAL'],undefined);assert.equal(JSON.stringify(e),before);});
test('resolution is deterministic and never mutates source evidence',()=>{const e=env();e.notes=[note(e)];const before=clone(e);assert.deepEqual(api.resolve(e),api.resolve(e));assert.deepEqual(e,before);});
console.log(pass+'/'+(pass+fail)+' resolver checks');process.exitCode=fail?1:0;
