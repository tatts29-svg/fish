/* Author: Andrew Fisher. Synthetic customer-hours and existing memo invalidation checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),helper=require('../customer_fence_hours12451.js');
assert(process.env.BASE,'BASE must be the reviewed predecessor');
const base=fs.readFileSync(process.env.BASE,'utf8');
const script=base.match(/<script id="eventcrew1237-script">([\s\S]*?)<\/script>/)[1];
const context={module:{exports:{}}};vm.createContext(context);vm.runInContext(script,context);
const reader=context.module.exports,dates=['2030-01-01','2030-01-02','2030-01-03'];
const row={key:'fence',rate:19.33,hours:15,amount:289.95,amount_exact:289.95,days:dates.map(date=>({date,day:date,hours:5,per:2.5,people:2})),rate_key:'synthetic-rate',rate_typed:false};
const record={days:dates.map((date,index)=>({date,hours:index===2?3.75:4,status:'valid',customerScopeConfirmed:true})),issues:[],hours:11.75,amount:901.23};
const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
record.customer={complete:true,hours:record.hours,days:record.days.map(({date,hours})=>({date,hours,id:'synthetic-'+date})),issues:[]};
freeze(row);freeze(record);let count=0;
const check=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const result=helper.project(row,record,reader.product);
check('documented aggregate replaces only customer hours',()=>assert.equal(result.hours,11.75));
check('customer product rounds once to cents',()=>assert.equal(result.amount,227.13));
check('scope exact amount is the same customer line cents',()=>assert.equal(result.amount_exact,result.amount));
check('source hours retained',()=>assert.equal(result.scope_hours12451,row.hours));
check('source amount retained',()=>assert.equal(result.scope_amount12451,row.amount));
check('original day plan retains identity',()=>assert.equal(result.days,row.days));
check('existing customer rate retained',()=>assert.equal(result.rate,row.rate));
check('supplier amount untouched',()=>assert.equal(record.amount,901.23));
check('repeat projection is idempotent',()=>assert.deepEqual(helper.project(result,record,reader.product),result));
check('zero explicitly approved rate stays zero',()=>assert.equal(helper.project({...row,rate:0},record,reader.product).amount,0));
check('unrelated role retains identity',()=>{const other={...row,key:'other'};assert.equal(helper.project(other,record,reader.product),other);});
check('no documented notes remain explicitly unknown',()=>{const result=helper.project(row,{days:[],issues:[],hours:0},reader.product);assert.equal(result.hours,null);assert.equal(result.amount,null);assert(result.customer_hours_review12451);});
for(const [name,customer]of[
 ['incomplete confirmed aggregate',{complete:false,hours:null}],
 ['missing aggregate',null],
 ['non-finite hours',{complete:true,hours:NaN}],
 ['invalid negative hours',{complete:true,hours:-1}],
 ['unconfirmed zero hours',{complete:true,hours:0}]
])check('review '+name,()=>{const result=helper.project(row,{...record,customer},reader.product);assert.equal(result.hours,null);assert.equal(result.amount,null);assert(result.customer_hours_review12451);assert.equal(result.scope_hours12451,row.hours);});
for(const rate of [null,NaN,-1,'19.33'])check('review invalid existing rate '+rate,()=>{const result=helper.project({...row,rate},record,reader.product);assert.equal(result.amount,null);assert(result.customer_hours_review12451);});
check('supplier-only review does not suppress confirmed customer hours',()=>assert.equal(helper.project(row,{...record,days:[],hours:0,issues:[{reason:'supplier price'}]},reader.product).hours,record.customer.hours));
check('source row has no projected fields',()=>assert.equal(row.customer_hours12451,undefined));

/* Exercise the actual existing reader cache, then the actual patched scope function.
   No additional hours cache is introduced by the customer projection. */
const candidate=fs.readFileSync(process.env.PAGE,'utf8');
const scopeStart=candidate.indexOf('function scopeFigures(){');
const scopeSource=candidate.slice(scopeStart,candidate.indexOf('/* a change to the scope,',scopeStart));
const modelStart=base.indexOf('\nfunction model() {');
const modelSource=base.slice(modelStart,base.indexOf('\nfunction status(note)',modelStart));
let current=structuredClone(record),reads=0;
const scope={lines:[{key:'fence',role:'Synthetic fence crew',rate:row.rate,days:Object.fromEntries(dates.map(day=>[day,{start:{at:'start'},finish:{at:'finish'},people:2}]))}],accommodation_travel:{amount:7.25},access_plan:{fields:[],as_written:''},document:'Synthetic source',supplied_on:'2030-01-01'};
freeze(scope);
const ctx={root:{Workforce1010:{}},FCOM:{service_notes:[{event_allocation:{}}]},S:{eventHours:{},rates:{}},empty:{days:[],issues:[],hours:0},RENDER_MEMO:new Map(),resolve:()=>{reads++;return structuredClone(current);},environment:()=>({}),SCOPE:scope,SCOPE_DAYS:dates.map(day=>({name:day,date:day})),scopeRate:()=>({rate:row.rate,typed:false,key:'synthetic-rate'}),scopeTime:field=>({min:field==='start'?0:150}),scopeKey:(kind,key,day)=>[kind,key,day].join('|'),safeNum:()=>null,MAX_RATE:1000,Workforce1010:{DATES:dates},CustomerFenceHours12451:helper,EventCrew1237:{product:reader.product}};
vm.createContext(ctx);vm.runInContext(modelSource+'\nEventCrew1237.model=model;\n'+scopeSource,ctx);
const before=vm.runInContext('scopeFigures()',ctx),again=vm.runInContext('scopeFigures()',ctx);
check('native scope uses documented customer hours',()=>assert.equal(before.lines[0].hours,record.hours));
check('native scope total adds existing support once',()=>assert.equal(before.total,234.38));
check('repeated scope reads reuse the native reader memo',()=>assert.equal(reads,1));
check('same render yields same projected hours',()=>assert.equal(again.lines[0].hours,before.lines[0].hours));
current.days[2].hours=4.25;current.hours=12.25;current.customer.days[2].hours=4.25;current.customer.hours=12.25;
check('one native render keeps its established snapshot',()=>assert.equal(vm.runInContext('scopeFigures()',ctx).lines[0].hours,11.75));
ctx.RENDER_MEMO.clear();
const refreshed=vm.runInContext('scopeFigures()',ctx);
check('native invalidation rereads contractor evidence',()=>assert.equal(reads,2));
check('changed contractor hours update shared customer projection',()=>assert.equal(refreshed.lines[0].hours,12.25));
check('changed hours update cents at unchanged customer rate',()=>assert.equal(refreshed.lines[0].amount,236.79));
check('contractor source amount remains separate',()=>assert.equal(ctx.EventCrew1237.model().amount,901.23));
check('original scope and day quantities stay intact',()=>assert.equal(scope.lines[0].days[dates[0]].people,2));

const uiStart=candidate.indexOf('api.scopeRows=function(line,ro){');
const uiSource=candidate.slice(uiStart,candidate.indexOf("})(typeof window!=='undefined'?window:globalThis);",uiStart));
const ui={api:{},scopePeople:line=>[{name:'Synthetic planned worker',rate:line.rate,days:line.days.map(day=>({...day,active:true})),hours:line.days.reduce((sum,day)=>sum+day.hours,0)}],esc:String,money:value=>'$'+value.toFixed(2),EventCrew1237:reader};
vm.createContext(ui);vm.runInContext(uiSource,ui);
const html=ui.api.scopeRows(result,false);
check('documented customer row is labelled',()=>assert(html.includes('data-customer-hours12451')));
check('source daily plan is explicitly reference only',()=>assert(html.includes('Original scope plan — reference only')));
check('no invented daily or individual actual split',()=>assert(html.includes('No daily or individual customer split is supplied.')));
check('existing customer rate remains editable once',()=>assert.equal((html.match(/data-scope="rate\|fence\|"/g)||[]).length,1));
check('ineffective daily customer-hour inputs are absent',()=>assert.equal((html.match(/data-scope="hours\|fence\|/g)||[]).length,0));
check('original planned totals remain visible in disclosure',()=>assert(html.includes('15 h')));
const unavailable=ui.api.scopeRows(helper.project(row,null,reader.product),true);
check('unavailable customer amount is visibly reviewed',()=>assert(unavailable.includes('Needs review')&&unavailable.includes('excluded from the known subtotal')));
check('unavailable customer hours do not become zero',()=>assert(unavailable.includes('Customer hours</span><span class="amt">—')));
console.log(count+' customer fencing-hour checks PASS');
