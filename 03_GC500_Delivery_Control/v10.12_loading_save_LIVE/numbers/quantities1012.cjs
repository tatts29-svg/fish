/* Author: Andrew Fisher. Pure exact-source quantity, receipt and collection invariants. */
'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const file=process.env.PAGE||'/workspace/private-argon-review-14Oct2026/live.html',html=fs.readFileSync(file,'utf8'),sha=crypto.createHash('sha256').update(html).digest('hex');
if(process.env.EXPECTED_SHA)assert.equal(sha,process.env.EXPECTED_SHA,'exact source');
const checks=[];function test(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,actual:e.message});}}
function script(id){const s=html.split('<script id="'+id+'">');assert.equal(s.length,2,id+' occurs once');return s[1].split('</script>')[0];}
const c=vm.createContext({console});vm.runInContext(script('loads987-script'),c);
const demob=script('demob-weather996-source').split('/* Author: Andrew Fisher. Approved Build card components')[0];vm.runInContext(demob,c);
const B=c.BuildLoads987,D=c.DemobProgress996,today='2026-10-14',arr='2026-10-13T01:00:00.000Z';
const row=(key,q=4)=>({key,a:{key},units:[{type:'FWF',n:q}],iso:today});
const rec=events=>({state:'on site',set_at:arr,history:[{state:'on site',at:arr},...events]});
function collection(r,{n=2,type='FWF',id='C1',date=today,stamp='2026-10-14T01:00:00.000Z',units=[],numbers=[],key=D.fingerprint(r.units)}={}){return {state:'on site',at:stamp,by:'Test fixture',collection996:{version:1,kind:'collection',id,date,arrivalAt:arr,requiredKey:key,items:[{type,n,unitIds:units,numbers}]}};}
const r=row('X');
test('Partial collection subtracts only its own typed quantity',()=>{const x=D.evidence(r,rec([collection(r)]),today);assert.equal(x.collected[0].n,2);assert.equal(x.remaining[0].n,2);assert.equal(x.complete,false);});
test('A duplicate collection id is counted once',()=>{const x=collection(r);assert.equal(D.evidence(r,rec([x,x]),today).collected[0].n,2);});
test('Two collection events cannot collect the same physical unit twice',()=>{const a=collection(r,{id:'A',n:1,units:['unit1']}),b=collection(r,{id:'B',n:1,units:['unit1']});assert.equal(D.evidence(r,rec([a,b]),today).collected[0].n,1);});
test('Two collection events cannot collect the same legacy asset number twice',()=>{const a=collection(r,{id:'A',n:1,numbers:['123']}),b=collection(r,{id:'B',n:1,numbers:['123']});assert.equal(D.evidence(r,rec([a,b]),today).collected[0].n,1);});
test('A collection beyond the required quantity contributes nothing',()=>assert.equal(D.evidence(r,rec([collection(r,{n:5})]),today).collected[0].n,0));
test('Wrong item type cannot reduce FWF pickup quantity',()=>assert.equal(D.evidence(r,rec([collection(r,{type:'Pee Panel'})]),today).collected[0].n,0));
test('A stale scope fingerprint requests review, never completion',()=>{const x=D.evidence(r,rec([collection(r,{n:4,key:'stale'})]),today);assert.equal(x.complete,false);assert.equal(x.issues.length,1);});
test('Future collection is excluded before its dated day',()=>assert.equal(D.evidence(r,rec([collection(r,{date:'2026-10-15',stamp:'2026-10-15T01:00:00Z'})]),today).collected[0].n,0));
test('Unconfirmed arrival cannot establish physical collection',()=>{const x=D.evidence(r,{state:'not on site',history:[collection(r,{n:4})]},today);assert.equal(x.complete,false);assert.equal(x.events.length,0);});
test('Complete collection requires every typed item, not a summed count',()=>{const mixed={...r,units:[{type:'FWF',n:4},{type:'Pee Panel',n:6}]};const x=D.evidence(mixed,rec([collection(mixed,{n:4})]),today);assert.equal(x.complete,false);assert.equal(x.remaining.find(r=>r.type==='Pee Panel').n,6);});
test('Unknown quantity prevents collection Complete',()=>{const x={...r,units:[...r.units,{type:'Toilet Block',n:0,unknown:true}]};assert.equal(D.evidence(x,rec([collection(x,{n:4})]),today).complete,false);});
test('Cancelled, duplicate and zero references do not inflate Demob denominator',()=>{const s=D.scope({refs:[r,r,{...row('cancelled'),cancelled:true},row('zero',0),{...row('unknown'),units:[{type:'FWF',unknown:true,n:0}]}]});assert.equal(s.total,1);assert.equal(s.zero.length,1);assert.equal(s.unknown.length,1);});
test('Demob whole percentage uses reference completion, never unlike unit totals',()=>{const other={...row('Y'),units:[{type:'Fence',n:1000}]},records={X:rec([collection(r,{n:4})]),Y:rec([])},w=D.create({record:k=>records[k]}).whole({refs:[r,other]},today);assert.equal(w.percent,50);assert.equal(w.completed,1);assert.equal(w.total,2);});
test('No recorded collections show unknown percentage, not invented 0% complete',()=>assert.equal(D.create({record:()=>rec([])}).whole({refs:[r]},today).percent,null));
function build(loads,receipt,date=today){return B.create({ready:()=>true,loads:()=>loads,idOf:(d,g)=>g.id,receipt}).day(date,today,{iso:date});}
const load=(id,keys,basis='plan')=>({id,basis,kind:'deliveries',rows:keys.map(key=>({a:{key},events:[]}))});
test('Physical day loads count one truck even with multiple item references',()=>{const x=build([load('truck1',['A','B'])],()=>true);assert.equal(x.metric,'loads');assert.equal(x.total,1);assert.equal(x.completed,1);});
test('A truck is incomplete if any scheduled reference has no receipt',()=>{const x=build([load('truck1',['A','B'])],r=>r.a.key==='A');assert.equal(x.completed,0);assert.equal(x.percent,0);});
test('Repeated unallocated reference appears once in delivery-reference denominator',()=>{const x=build([load(null,['A'],'area'),load(null,['A','B'],'area')],r=>r.a.key==='A');assert.equal(x.metric,'references');assert.equal(x.total,2);assert.equal(x.completed,1);assert.equal(x.percent,50);});
test('Cancelled day rows are excluded instead of a failed delivery',()=>{const l=load('truck1',['A']);l.rows[0].a._cancelled=true;assert.equal(build([l],()=>false).total,0);});
test('Future delivery has no invented completed quantity or percentage',()=>{const x=build([load('truck1',['A'])],()=>true,'2026-10-15');assert.equal(x.completed,null);assert.equal(x.percent,null);assert.equal(x.status,'scheduled');});
test('No deliveries planned has no 100% claim',()=>{const x=build([],()=>true);assert.equal(x.total,0);assert.equal(x.percent,null);assert.equal(x.status,'none-scheduled');});
test('A missing receipt does not count as received',()=>assert.equal(build([load('truck1',['A'])],()=>null).completed,0));
const out={author:'Andrew Fisher',sourceSha256:sha,checks,passed:checks.filter(t=>t.pass).length,failed:checks.filter(t=>!t.pass)};if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));if(out.failed.length)process.exitCode=1;
