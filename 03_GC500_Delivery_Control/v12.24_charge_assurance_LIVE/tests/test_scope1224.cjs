// Author: Andrew Fisher. Synthetic shared-model scope regressions; no records or network.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.env.PAGE,'PAGE must identify the patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8');
const script=id=>{const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'),m=html.match(re);assert(m,'Missing '+id);return m[1];};
const financeSource=script('finance-request996-script');
const ctx=vm.createContext({console});
vm.runInContext(financeSource,ctx);
const F=ctx.FinanceRequest996;
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const request=(id,ref,quantity=1)=>({request:{id,name:'Synthetic request',item:'FWF',aliases:[id.toLowerCase()],source:{fixture:true}},resolution:{state:'active',key:ref},quantity,branch:'TEST'});
const inputs=[request('REQ-A','SITE-A'),request('REQ-B','SITE-B')],card={hire_rate:12.345};
const snapshot=JSON.stringify(inputs);
check('source forecast preserves unrelated requests and rounded amount',()=>{
 const m=F.project(inputs,[],()=>({amount:0}),card,ref=>ref==='SITE-A'?'Existing exclusion':null);
 assert.equal(m.rows.length,1);assert.equal(m.rows[0].ref,'SITE-B');assert.equal(m.amount,12.35);assert.equal(m.excluded.length,1);assert.equal(m.excluded[0].reason,'Existing exclusion');assert.equal(m.issues.length,0);assert.equal(JSON.stringify(inputs),snapshot);
});
check('excluded sources do not require a rate or create quantity holds',()=>{
 const m=F.project([request('REQ-A','SITE-A',null)],[],()=>({amount:null}),null,()=> 'Existing exclusion');
 assert.equal(m.amount,0);assert.equal(m.rows.length,0);assert.equal(m.issues.length,0);assert.equal(m.excluded.length,1);
});
check('request identifier is checked before a native reference exists',()=>{
 const i={...request('REQ-MISSING',null),resolution:{state:'missing'}};
 const m=F.project([i],[],()=>({amount:0}),card,ref=>ref==='REQ-MISSING'?'Existing exclusion':null);
 assert.equal(m.amount,0);assert.equal(m.excluded[0].ref,'REQ-MISSING');
});
check('valid contract coverage still supersedes a source estimate',()=>{
 const c={rental_contract:'TEST-HS',line:1,register_type:'FWF',quantity:1,match:{key:'SITE-B'}};
 const m=F.project(inputs,[c],()=>({amount:99}),card,ref=>ref==='SITE-A'?'Existing exclusion':null);
 assert.equal(m.rows[0].state,'covered');assert.equal(m.amount,0);assert.equal(m.rows[0].coverage[0],'TEST-HS|1');
});
check('missing source pricing still remains a review',()=>{
 const m=F.project(inputs,[],()=>({amount:null}),{},()=>null);
 assert.equal(m.rows.length,2);assert(m.rows.every(r=>r.state==='card rate needs review'));assert.equal(m.amount,0);
});
check('native source model is wired to the existing exclusion authority',()=>{
 assert(financeSource.includes("ref=>typeof NotChargedHere1152==='undefined'?null:NotChargedHere1152.why(ref)"));
});
const start=html.indexOf("(function(root){\n'use strict';\nconst config=()=>EventConfig1013.current();");
assert(start>=0,'Shared generator model not found');
const end=html.indexOf("})(typeof window==='undefined'?globalThis:window);",start);
assert(end>start,'Shared generator model end not found');
ctx.EventConfig1013={current:()=>({eventFrom:'2040-01-06',offhire:'2040-01-08',invoiceMonth:'2040-01',eventValid:true,invoiceValid:true,dayCount:3}),short:x=>x,issue:()=> 'Fixture configuration issue',invoiceWords:()=> 'Fixture invoice'};
vm.runInContext(html.slice(start,end+"})(typeof window==='undefined'?globalThis:window);".length),ctx);
const G=ctx.GeneratorFinance1004;
const contract=(line,flagged=true,status='Pending')=>({rental_contract:'TEST-HS',line,asset_no:'UNIT-'+line,quantity:1,rate_1:90,rate_type:'W',flagged,status_as_written:status});
const input=(rows,arrived=false)=>({id:'fixture:'+rows[0].line,ref:'SITE-G',refLabel:'Synthetic generator',item:'60kva',branch:'TEST',qty:rows.length,contractRows:rows,contractDeliveries:rows.map(r=>({id:'TEST-HS:'+r.line,actualIsConfirmed:arrived,deliveredDate:arrived?'2040-01-04':null})),assetNumbers:rows.map(r=>r.asset_no),actualIsConfirmed:arrived,actualQuantity:arrived?rows.length:0,deliveredDate:arrived?'2040-01-04':null,plannedDate:'2040-01-04',issues:[]});
const treatment=r=>r.flagged&&r.status_as_written==='Pending'?{kind:'pending_no_charge',label:'Pending — not charged',basis:'Existing conditional source decision',approved_by:'Fixture',approved_on:'2040-01-01'}:null;
const env={lineRate:()=>null,weeklyRate:()=>null,rehire:()=>false,treatment};
check('pending treated generator is zero in every shared financial projection',()=>{
 const i=input([contract(1)]),before=JSON.stringify(i),m=G.project([i],env),c=m.contracts.get('TEST-HS:1');
 for(const k of ['actual','remaining','forecast','standdown','race','hireRemaining','rehireRemaining'])assert.equal(m[k],0,k);
 assert.equal(m.byBranch[0].forecast,0);assert.equal(m.rows[0].forecast,0);assert.equal(m.unpriced.length,0);assert.equal(c.amount,0);assert.equal(c.forecast,0);assert.equal(c.treatment,'pending_no_charge');assert.equal(c.basis,'Existing conditional source decision');assert.equal(JSON.stringify(i),before);
});
check('unrelated pending generator keeps its existing forecast',()=>{
 const m=G.project([input([contract(2,false)])],env);
 assert.equal(m.actual,0);assert.equal(m.remaining,120);assert.equal(m.forecast,120);assert.equal(m.contracts.get('TEST-HS:2').forecast,120);
});
check('source status ending its pending treatment restores the normal forecast',()=>{
 const m=G.project([input([contract(1,true,'Called off')])],env);
 assert.equal(m.forecast,120);assert.equal(m.remaining,120);assert.equal(m.rows[0].treatment,undefined);
});
check('confirmed native receipt satisfies no-charge-unless-called-off condition',()=>{
 const m=G.project([input([contract(1)],true)],env);
 assert.equal(m.actual,120);assert.equal(m.forecast,120);assert.equal(m.remaining,0);assert.equal(m.contracts.get('TEST-HS:1').arrived,true);assert.equal(m.rows[0].treatment,undefined);
});
check('partial receipt does not release a different pending unit',()=>{
 const i=input([contract(1),contract(2,false)]);i.actualIsConfirmed=true;i.actualQuantity=1;i.deliveredDate='2040-01-04';i.contractDeliveries[1]={id:'TEST-HS:2',actualIsConfirmed:true,deliveredDate:'2040-01-04'};
 const m=G.project([i],env);
 assert.equal(m.actual,120);assert.equal(m.forecast,120);assert.equal(m.rows.length,2);assert.equal(m.contracts.get('TEST-HS:1').treatment,'pending_no_charge');assert.equal(m.contracts.get('TEST-HS:2').actual,120);const held=m.rows.find(r=>r.treatment);assert.equal(held.assetNumbers.join(','),'UNIT-1');assert.equal(held.deliveredDate,null);
});
check('unconditional existing exclusion stays excluded after receipt',()=>{
 const m=G.project([input([contract(1)],true)],{...env,treatment:()=>({kind:'own_use',label:'Own use',basis:'Existing own-use decision'})});
 assert.equal(m.actual,0);assert.equal(m.forecast,0);assert.equal(m.contracts.get('TEST-HS:1').treatment,'own_use');
});
check('shared generator wrapper uses the canonical treatment function',()=>{
 const from=html.indexOf('function generatorModel1004(){'),to=html.indexOf('function generatorContract1004',from);assert(from>=0&&to>from);
 let calls=0;Object.assign(ctx,{heldMemo:(key,fn)=>fn(),holdAssets:fn=>fn(),generatorInputs1004:()=>[input([contract(1)])],contractTreatment747:r=>{calls++;return treatment(r);},lr748Typed:()=>null,S:{rates:{}},finance928ContractOwner:()=>({rehire:false})});
 vm.runInContext(html.slice(from,to),ctx);const m=ctx.generatorModel1004();assert.equal(m.forecast,0);assert.equal(calls,1);
});
console.log(JSON.stringify({passed:checks,failed:0,record_writes:0,network:false}));
