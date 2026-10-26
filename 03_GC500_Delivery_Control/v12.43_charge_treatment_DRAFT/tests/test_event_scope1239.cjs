// Author: Andrew Fisher. Fictional aggregate customer decisions; no browser, service or record writes.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SOURCE=fs.readFileSync(path.join(__dirname,'../charge1239_src.js'),'utf8');
const BASE=fs.readFileSync(process.env.BASE||path.join(__dirname,'../../build/GC500_v12.43/base_live.html'),'utf8');
const CREW=BASE.match(/<script id="eventcrew1237-script">([\s\S]*?)<\/script>/)?.[1];assert.ok(CREW,'Existing aggregate-note validator is required.');
const K='scope|fence',TYPE='approved_event_crew_hours',TODAY='2030-04-10',DATES=['2030-04-01','2030-04-02','2030-04-03'];
const clone=x=>JSON.parse(JSON.stringify(x)),canon=x=>JSON.stringify(x),checks=[];
function test(name,run){try{run();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
function fixture(){
 const count={resolve:0,ordinary:0,stamps:0,bumps:0,fullModels:0},memo=new Map();let held=false;
 const ctx={Date:class extends Date{constructor(...a){super(...(a.length?a:['2030-04-10T01:00:00.000Z']));}},S:{answers:{},rates:{},eventHours:{},serviceNotes:[]},
  FCOM:{service_notes:[]},SCOPE:{document:'Synthetic scope',lines:[{key:'fence',role:'Fictional crew',days:{Mon:{people:3},Tue:{people:3},Wed:{people:3}}}]},
  Workforce1010:{DATES:clone(DATES),GROUP_ID:'synthetic-group',QUOTE:{number:'SYNTHETIC-QUOTE',rate:17},scopeRows:(line,ro)=>'<tr data-original-plan><td>Original source '+line.hours+' hours; readOnly='+ro+'</td></tr>'},
  tombedHere:id=>(ctx.deleted||[]).includes(id),todayIso:()=>TODAY,mayWrite:()=>true,whoAmI:()=>'Synthetic Operator',stampIt:()=>count.stamps++,bump:()=>{count.bumps++;memo.clear();},
  flash:()=>{},esc:x=>String(x??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),money:n=>'$'+n,capability:()=>'edit',mounted:()=>{},
  heldMemo:(key,fn)=>{if(!held)return fn();if(!memo.has(key))memo.set(key,fn());return memo.get(key);},
  contractCharge:()=>({amount:9}),assetTotal:()=>null,ItemCharges979:{project:()=>({lines:[]})},pricingForecast1010:()=>({rows:[]}),
  contractMoneyWords:()=>'',card748Html:()=>'',pl767Servicing:()=>'',ONHIRE_ROWS:[],DATA:{},
  ourCosts:()=>{count.fullModels++;throw Error('Supplier scan forbidden');},fin745Rows:()=>{count.fullModels++;throw Error('Finance scan forbidden');}
 };
 function ordinary(){count.ordinary++;const rate=ctx.S.rates['scope-rate:fence']===undefined?7.25:Number(ctx.S.rates['scope-rate:fence']);
  const days=DATES.map((date,i)=>{const hkey='scope-hours:fence|'+date,pkey='scope-people:fence|'+date,per=Number(ctx.S.eventHours[hkey]??4),people=Number(ctx.S.eventHours[pkey]??3);return {date,day:['Mon','Tue','Wed'][i],start:360,finish:600,per,people,hours:per*people,amount:per*people*rate,hkey,pkey,per_typed:ctx.S.eventHours[hkey]!=null,people_typed:ctx.S.eventHours[pkey]!=null};});
  const hours=days.reduce((s,d)=>s+d.hours,0),amount=hours*rate;
  const line={key:'fence',role:'Fictional crew',rate,rate_key:'scope-rate:fence',days,hours,amount,amount_exact:amount};
  return {lines:[line,{key:'other',rate:2,days:[],hours:5,amount:10,amount_exact:10}],people:amount+10,hours:hours+5,at:50,total:amount+60,edits:0,times:[{source:true}]};}
 ctx.scopeFigures=ordinary;vm.createContext(ctx);vm.runInContext(CREW,ctx);const E=ctx.EventCrew1237,prior=E.resolve;
 E.resolve=env=>{count.resolve++;return prior(env);};E.model=E.environment=()=>{count.fullModels++;throw Error('Full crew model forbidden');};
 DATES.forEach((date,i)=>{const n={id:'synthetic-note-'+i,note_no:String(321+i),date,labour_hours:[11,12,10][i],recorded_by:'Synthetic Operator'};n.event_allocation=E.makeAllocation(n,{scopeKey:'fence',scopeDocument:ctx.SCOPE.document,group:ctx.Workforce1010.GROUP_ID,quote:ctx.Workforce1010.QUOTE},{by:'Synthetic Operator',on:'2030-04-09',text:'Synthetic existing crew confirmation'});ctx.S.serviceNotes.push(n);});
 ctx.document={addEventListener(){}};vm.runInContext(SOURCE,ctx);const api=ctx.ChargeTreatment1239;
 const make=extra=>api.make(K,{treatment:TYPE,reason:'Synthetic explicit customer approval.',evidence:'Fictional customer instruction applies to these notes.',confirmed_by:'Synthetic Approver',confirmed_on:'2030-04-09',...extra});
 return {ctx,count,api,make,save:extra=>api.set(K,make(extra)),ordinary,held:v=>{held=v;memo.clear();},clear:()=>memo.clear()};
}
test('no decision leaves financial scope unchanged and never scans notes or supplier models',()=>{const f=fixture(),s=canon(f.ctx.S);for(let i=0;i<1000;i++)assert.equal(f.ctx.scopeFigures().total,321);assert.equal(f.count.resolve,0);assert.equal(f.count.fullModels,0);assert.equal(canon(f.ctx.S),s);});
test('explicit target binds unique three-day notes, raw scope, rate and original source plan',()=>{const f=fixture(),t=f.api.current(K);assert.equal(t.eligible,true);assert.equal(t.source.scope_document,'Synthetic scope');assert.deepEqual(clone(t.source.days.map(d=>d.hours)),[11,12,10]);assert.equal(t.source.customer_line.hours,36);assert.equal(t.source.customer_line.rate,7.25);assert.equal(t.source.overrides.rate,null);assert.equal(f.count.fullModels,0);});
test('save projects only approved customer aggregate and preserves operational and supplier sources',()=>{const f=fixture(),before=clone(f.ctx.S),scope=canon(f.ctx.SCOPE);assert.equal(f.save(),true);const out=f.ctx.scopeFigures(),l=out.lines[0];assert.equal(l.hours,33);assert.equal(l.amount,239.25);assert.equal(out.hours,38);assert.equal(out.people,249.25);assert.equal(out.total,299.25);assert.equal(out.lines[1].amount,10);assert.equal(l.sourceLine1239.hours,36);assert.equal(l.rate,7.25);for(const d of l.days){assert.equal(d.people,null);assert.equal(d.per,null);assert.equal(d.start,null);assert.equal(d.finish,null);}const state=clone(f.ctx.S);delete state.answers[f.api.PREFIX+K];assert.deepEqual(state,before);assert.equal(canon(f.ctx.SCOPE),scope);assert.equal(f.count.stamps,1);assert.equal(f.count.bumps,1);assert.equal(f.count.fullModels,0);});
test('supplier linked notes alone never authorise changed customer hours',()=>{const f=fixture();assert.equal(f.ctx.scopeFigures().lines[0].hours,36);assert.equal(f.api.status(K).state,'none');});
test('whole-crew UI retains the full original table as read-only source',()=>{const f=fixture();f.save();const html=f.ctx.Workforce1010.scopeRows(f.ctx.scopeFigures().lines[0],false);assert.match(html,/Confirmed whole-crew customer hours/);assert.match(html,/Original agreed plan — source only/);assert.match(html,/Original source 36 hours; readOnly=true/);assert.match(html,/no individual actual hours assigned/);assert.doesNotMatch(html,/h each/);});
test('render cache resolves note membership once for repeated active financial projections',()=>{const f=fixture();f.save();f.held(true);const before=f.count.resolve;for(let i=0;i<1000;i++)assert.equal(f.ctx.scopeFigures().lines[0].hours,33);assert.equal(f.count.resolve-before,1);assert.equal(f.count.fullModels,0);});
test('native save bypasses held render cache after note evidence changes',()=>{const f=fixture();f.save();f.held(true);f.ctx.scopeFigures();const draft=f.make();f.ctx.S.serviceNotes[0].labour_hours=12;const before=canon(f.ctx.S);assert.equal(f.api.set(K,draft),false);assert.equal(canon(f.ctx.S),before);});
for(const [name,mutate] of [
 ['hours',f=>{f.ctx.S.serviceNotes[0].labour_hours=12;}],['paper',f=>{f.ctx.S.serviceNotes[0].note_no='999';}],['date',f=>{f.ctx.S.serviceNotes[0].date='2030-04-04';}],
 ['named allocation',f=>{f.ctx.S.serviceNotes[0].event_allocation.confirmed_by='Changed approver';}],['scope document',f=>{f.ctx.SCOPE.document='Changed scope';}],
 ['customer rate',f=>{f.ctx.S.rates['scope-rate:fence']=8;}],['hours override',f=>{f.ctx.S.eventHours['scope-hours:fence|'+DATES[0]]=3;}],
 ['people override',f=>{f.ctx.S.eventHours['scope-people:fence|'+DATES[0]]=2;}],['raw customer plan',f=>{f.ctx.SCOPE.lines[0].days.Mon.people=4;}],
 ['deleted source',f=>{f.ctx.deleted=[f.ctx.S.serviceNotes[0].id];}],['missing date',f=>{f.ctx.S.serviceNotes.pop();}],
 ['duplicate note',f=>{f.ctx.S.serviceNotes.push(clone(f.ctx.S.serviceNotes[0]));}],['two notes for one date',f=>{const n=clone(f.ctx.S.serviceNotes[0]);n.id='extra';n.note_no='555';n.event_allocation.source.note_no='555';f.ctx.S.serviceNotes.push(n);}],
 ['wrong scope allocation',f=>{f.ctx.S.serviceNotes[0].event_allocation.scope_key='other';}],['unusable note',f=>{f.ctx.S.serviceNotes[0].usable=false;}]
])test('changed '+name+' visibly holds the decision and restores ordinary customer scope',()=>{const f=fixture();assert.equal(f.save(),true);mutate(f);assert.equal(f.api.status(K).state,'review');assert.deepEqual(clone(f.ctx.scopeFigures()),clone(f.ordinary()));assert.match(f.api.control(K),/needs review/);});
test('wrong treatment kind cannot turn customer event labour into a hire exemption',()=>{const f=fixture(),s=canon(f.ctx.S);assert.equal(f.save({treatment:'own_use_hire'}),false);assert.equal(canon(f.ctx.S),s);});
test('clearing and reapplying preserves audit history and the source plan',()=>{const f=fixture();f.save();assert.equal(f.save({treatment:'standard'}),true);assert.equal(f.ctx.scopeFigures().lines[0].hours,36);assert.equal(f.save(),true);assert.equal(f.ctx.scopeFigures().lines[0].hours,33);const r=f.api.record(K);assert.equal(r.revision,3);assert.deepEqual(clone(r.history.map(h=>h.treatment)),[TYPE,'standard']);});
test('unrelated customer role and accommodation changes do not invalidate this bounded decision',()=>{const f=fixture();f.save();f.ctx.S.rates['scope-at']=80;f.ctx.S.eventHours['scope-hours:other|'+DATES[0]]=7;assert.equal(f.api.status(K).state,'active');});
test('line money rounds decimal tie once without per-day rounding',()=>{const f=fixture();f.ctx.S.rates['scope-rate:fence']=0.335;f.ctx.S.serviceNotes.forEach(n=>{n.labour_hours=1;n.event_allocation.source.labour_hours=1;});f.save();const line=f.ctx.scopeFigures().lines[0];assert.equal(line.hours,3);assert.equal(line.amount,1.01);assert.equal(f.ctx.scopeFigures().people,11.01);});
test('native eligibility refuses source person-hours beyond the existing note precision',()=>{const f=fixture();f.ctx.S.serviceNotes.forEach(n=>{n.labour_hours=0.125;n.event_allocation.source.labour_hours=0.125;});assert.equal(f.api.current(K).eligible,false);assert.equal(f.save(),false);assert.equal(f.ctx.scopeFigures().lines[0].hours,36);});
test('pure projection sums any trusted fractional hours exactly before pricing',()=>{const f=fixture(),target=f.api.current(K);target.source.days.forEach(d=>{d.hours=0.125;});const base=f.ordinary();base.lines[0].rate=100;const out=f.api.scope(base,{state:'active',record:{treatment:TYPE,source:target.source}});assert.equal(out.lines[0].hours,0.375);assert.equal(out.lines[0].amount,37.5);});
const failed=checks.filter(c=>!c.pass);failed.forEach(f=>console.error('FAIL '+f.name+'\n'+f.error));console.log(JSON.stringify({author:'Andrew Fisher',suite:'synthetic explicit customer aggregate',passed:checks.length-failed.length,failed:failed.length,checks:checks.length}));process.exitCode=failed.length?1:0;
