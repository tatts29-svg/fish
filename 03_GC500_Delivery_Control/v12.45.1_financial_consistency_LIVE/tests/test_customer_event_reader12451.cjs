/* Author: Andrew Fisher. Synthetic source-bound customer evidence and unchanged supplier results. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(process.env.BASE&&process.env.PAGE,'BASE and PAGE must name the reviewed predecessor and candidate');
const base=fs.readFileSync(process.env.BASE,'utf8'),page=fs.readFileSync(process.env.PAGE,'utf8');
function read(text){
 const source=text.match(/<script id="eventcrew1237-script">([\s\S]*?)<\/script>/)[1];
 const context={module:{exports:{}}};vm.createContext(context);vm.runInContext(source,context);return context.module.exports;
}
const before=read(base),after=read(page),dates=['2030-01-01','2030-01-02','2030-01-03'];
const clone=value=>JSON.parse(JSON.stringify(value));
function fixture(){
 const env={notes:[],days:dates.slice(),scopeKey:'fence',scopeDocument:'Synthetic customer scope',group:'Synthetic crew',quote:{number:'SYNTHETIC',rate:17.25},today:'2030-01-04',shiftIdsByDay:{}};
 for(const [index,date]of dates.entries()){
  const note={id:'SYN-'+index,note_no:String(1001+index),date,labour_hours:[3.25,4.5,4][index],recorded_by:'Synthetic recorder'};
  note.event_allocation=before.makeAllocation(note,env,{by:'Synthetic confirmer',on:'2030-01-04',text:'Synthetic documented customer crew membership'});
  env.notes.push(note);
 }
 return env;
}
let checks=0;
const check=(name,run)=>{run();checks++;console.log('PASS '+name);};
function compare(name,env){
 const source=JSON.stringify(env),old=before.resolve(env),actual=after.resolve(env),{customer,...supplier}=actual;
 check(name+' supplier result byte-equivalent',()=>assert.equal(JSON.stringify(supplier),JSON.stringify(old)));
 check(name+' source unchanged',()=>assert.equal(JSON.stringify(env),source));
 return actual;
}
const complete=compare('complete source',fixture());
check('complete customer evidence',()=>assert.equal(complete.customer.complete,true));
check('existing decimal sum supplies customer hours',()=>assert.equal(complete.customer.hours,11.75));
check('customer days expose only existing identity/date/hours',()=>assert.deepEqual(clone(complete.customer.days),dates.map((date,index)=>({id:'SYN-'+index,date,hours:[3.25,4.5,4][index]}))));
check('complete customer evidence has no issues',()=>assert.equal(complete.customer.issues.length,0));

for(const [name,change]of[
 ['supplier quote changed',env=>{env.quote.number='CHANGED-SUPPLIER-QUOTE';}],
 ['supplier rate unavailable',env=>{env.ratesByDay={[dates[1]]:null};}],
 ['supplier rates conflict',env=>{env.rateConflicts={[dates[1]]:['Different supplier rates']};}],
 ['supplier Finance conflict',env=>{env.financeConflicts={[dates[1]]:['Synthetic journal coverage']};}],
 ['supplier allocation conflict',env=>{env.invalidSupplierClaims=[{id:'SYN-1'}];}],
 ['supplier approved quantity conflict',env=>{env.approvedPrices={'SYN-1':{date:dates[1],hours:99,amount:40}};}]
]){
 const env=fixture();change(env);const result=compare(name,env);
 check(name+' retains complete customer evidence',()=>assert.equal(result.customer.complete,true));
 check(name+' retains the confirmed customer hours',()=>assert.equal(result.customer.hours,11.75));
 check(name+' remains a supplier review',()=>assert(result.issues.length>0));
}

for(const [name,change]of[
 ['source quantity changed',env=>{env.notes[1].labour_hours=4.75;}],
 ['duplicate date',env=>{const note={...env.notes[1],id:'SYN-extra',note_no:'1099'};note.event_allocation=before.makeAllocation(note,env,{by:'Synthetic confirmer',on:'2030-01-04',text:'Synthetic duplicate'});env.notes.push(note);}],
 ['duplicate note number',env=>{env.notes[1].note_no=env.notes[0].note_no;env.notes[1].event_allocation.source.note_no=env.notes[0].note_no;}],
 ['duplicate record identity',env=>{env.notes[1].id=env.notes[0].id;}],
 ['missing day',env=>{env.notes.pop();}],
 ['deleted note',env=>{env.deleted=['SYN-1'];}],
 ['customer scope changed',env=>{env.scopeDocument='Different customer scope';}],
 ['confirmation absent',env=>{env.notes[1].event_allocation.confirmation='';}],
 ['unusable source',env=>{env.notes[1].usable=false;}],
 ['no notes',env=>{env.notes=[];}]
]){
 const env=fixture();change(env);const result=compare(name,env);
 check(name+' customer evidence unavailable',()=>assert.equal(result.customer.complete,false));
 check(name+' has no invented or partial aggregate',()=>assert.equal(result.customer.hours,null));
 check(name+' names the review',()=>assert(result.customer.issues.length>0));
}

function modelText(text){
 const start=text.indexOf('const empty = {byId: {}, byDate: {}, days: [], issues: [], hours: 0, amount: 0');
 return text.slice(start,text.indexOf('\nfunction status(note)',start));
}
const oldModel=modelText(base),newModel=modelText(page);
check('existing native memo function is unchanged',()=>assert.equal(newModel.slice(newModel.indexOf('function model()')),oldModel.slice(oldModel.indexOf('function model()'))));
let env=fixture(),reads=0;
const context={root:{Workforce1010:{}},FCOM:{service_notes:env.notes},S:{serviceNotes:[]},RENDER_MEMO:new Map(),environment:()=>env,resolve:value=>{reads++;return after.resolve(value);}};
vm.createContext(context);vm.runInContext(newModel,context);
const first=vm.runInContext('model()',context),second=vm.runInContext('model()',context);
check('native model caches its one source resolution',()=>assert.equal(reads,1));
check('native model returns the same memo object',()=>assert.equal(first,second));
env.notes[1].labour_hours=4.75;env.notes[1].event_allocation.source.labour_hours=4.75;
check('same render retains its existing snapshot',()=>assert.equal(vm.runInContext('model()',context).customer.hours,11.75));
context.RENDER_MEMO.clear();
const changed=vm.runInContext('model()',context);
check('native invalidation rereads existing evidence',()=>assert.equal(reads,2));
check('source-bound hour change reaches customer projection',()=>assert.equal(changed.customer.hours,12));
context.FCOM.service_notes=[];context.RENDER_MEMO.clear();
const empty=vm.runInContext('model()',context);
check('native no-note path is explicitly unavailable',()=>assert.equal(empty.customer.complete,false));
check('native no-note path has no customer amount or hours',()=>assert.equal(empty.customer.hours,null));
check('native no-note path retains all supplier zero/empty fields',()=>{const {customer,...supplier}=empty;assert.equal(JSON.stringify(supplier),JSON.stringify({byId:{},byDate:{},days:[],issues:[],hours:0,amount:0}));});
check('native no-note path does not resolve an imaginary source',()=>assert.equal(reads,2));
console.log(checks+' customer event-reader checks PASS');
