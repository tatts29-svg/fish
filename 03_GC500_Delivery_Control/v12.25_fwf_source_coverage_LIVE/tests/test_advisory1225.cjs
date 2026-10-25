/* Author: Andrew Fisher. Synthetic contract-work classification; no records or network. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
assert(process.env.PAGE,'PAGE must identify the candidate HTML');
const html=fs.readFileSync(process.env.PAGE,'utf8');let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function section(from,to){const a=html.indexOf(from),b=html.indexOf(to,a);assert(a>=0&&b>a,from);return html.slice(a,b);}
let typed=null,treatment=null;
const ctx=vm.createContext({module:{exports:{}},console,CONTRACT_DAILY_KINDS:new Set(),STREAM_OF_KIND:{},
 contractTreatment747:()=>treatment,contractCardCorrection1224:r=>r,lr748Typed:()=>typed,
 money:n=>'$'+n.toFixed(2),contractBillingQuantity1010:r=>r.quantity,generatorBranch1004:r=>r.branch_code,
 finance928ContractOwner:()=>({rehire:false})});
vm.runInContext(section('/* contract-service1224:','/* WHAT THE CONTRACTS HOLD, PER BRANCH.'),ctx);
ctx.contractCharge=ctx.contractCharge_747;
const moduleText=html.match(/<script id="finance1007-script">([\s\S]*?)<\/script>/);assert(moduleText);
vm.runInContext(moduleText[1],ctx);const F=ctx.module.exports;ctx.Finance1007=F;
const row={rental_contract:'SYNTHETIC',line:1,branch_code:'TEST',item:'LABOUR',charge_line:true,
 sales_analysis_code:'TEST-INS',quantity:1,price:123.45,subhired:false,
 sourceAddition1224:{scope:'water-filled-barriers',combined:true}};
const input={ref:'TEST-BARRIER',item:'TL2',discipline:'Water-filled barriers',received:5,ownUse:false,branch:'TEST',card:{}};
ctx.ONHIRE_ROWS=[row];
const coverage=()=>ctx.contractBulkCoverage1224('water-filled-barriers','installation');
const gap=(extra={})=>F.workGap({...input,bulkCoverage:coverage(),...extra});
const plain=o=>JSON.parse(JSON.stringify(o));
check('positive current contract charge is included but still needs allocation review',()=>{
 const before=JSON.stringify(ctx.ONHIRE_ROWS),r=gap();assert.equal(r.state,'contract_scope');assert.match(r.why,/included?[^.]*Revenue|includes[^.]*Revenue/);
 assert.match(r.why,/physical work separately/);assert.match(r.why,/No per-reference amount/);assert.match(r.name,/allocation review/);
 assert.equal(r.rate,null);assert.equal(r.value,null);assert.equal(JSON.stringify(ctx.ONHIRE_ROWS),before);
});
check('explicit typed zero remains zero without claiming positive Revenue',()=>{
 typed=0;assert.equal(ctx.contractCharge(row).amount,0);const r=gap();assert.equal(r.state,'contract_scope');assert.match(r.why,/zero combined/);assert(!r.why.includes('in Revenue'));assert.equal(r.value,null);typed=null;
});
check('source zero retains a visible scope review and is not unpriced',()=>{
 ctx.ONHIRE_ROWS=[{...row,price:0}];const r=gap();assert.equal(r.state,'contract_scope');assert.match(r.name,/recorded at zero/);ctx.ONHIRE_ROWS=[row];
});
check('current typed rate takes precedence over an unavailable source price',()=>{
 ctx.ONHIRE_ROWS=[{...row,price:null}];typed=17.25;assert.equal(coverage().items[0].amount,17.25);assert.equal(gap().state,'contract_scope');typed=null;ctx.ONHIRE_ROWS=[row];
});
check('existing included treatment remains visible as zero combined work',()=>{
 treatment={kind:'included',label:'Included',basis:'Synthetic existing decision'};const r=gap();assert.equal(r.state,'contract_scope');assert.match(r.why,/zero combined/);treatment=null;
});
check('missing source does not hide genuinely unpriced work',()=>{
 ctx.ONHIRE_ROWS=[];assert.equal(gap().state,'unpriced');ctx.ONHIRE_ROWS=[row];
});
check('unavailable source amount remains unpriced',()=>{
 ctx.ONHIRE_ROWS=[{...row,price:null}];assert.equal(gap().state,'unpriced');ctx.ONHIRE_ROWS=[row];
});
check('negative current charge does not establish complete installation coverage',()=>{
 typed=-2;assert.equal(gap().state,'unpriced');typed=null;
});
check('incomplete mixed source coverage stays unpriced',()=>{
 ctx.ONHIRE_ROWS=[row,{...row,line:2,price:null}];assert.equal(gap().state,'unpriced');ctx.ONHIRE_ROWS=[row];
});
check('malformed coverage cannot suppress the original work review',()=>{
 const good=plain(coverage());
 for(const bad of [null,{}, {...good,covered:false},{...good,items:[]},{...good,scope:'other'},
  {...good,category:'transport'},{...good,items:[{...good.items[0],amount:'123.45'}]},
  {...good,items:[{...good.items[0],amount:NaN}]},{...good,items:[{...good.items[0],line:0}]},
  {...good,items:[{...good.items[0],source:{scope:'other'}}]}, {...good,items:[good.items[0],good.items[0]]}])
  assert.equal(gap({bulkCoverage:bad}).state,'unpriced');
});
check('barrier scope never masks unrelated trailer or container work gaps',()=>{
 for(const item of ['FWF Trailer','3.0m Cont','Event Container'])assert.equal(gap({item}).state,'unpriced');
 assert.equal(gap({discipline:'Other'}).state,'unpriced');assert.equal(gap({item:'FWF'}),null);
});
check('no receipt and own-use decisions retain their existing precedence',()=>{
 assert.equal(gap({received:0}),null);assert.equal(gap({ownUse:true}),null);
});
check('existing numeric, zero and included card work retains precedence',()=>{
 for(const line of [{key:'install',money:'rate',rate:9},{key:'install',money:'zero'},{key:'demob',money:'included'}])
  assert.equal(gap({card:{labour_per_piece:{lines:[line]}}}),null);
 assert.equal(gap({card:{labour_per_piece:{state:'Included'}}}),null);
});
check('multiple valid contract lines retain identities without an allocated amount',()=>{
 ctx.ONHIRE_ROWS=[row,{...row,line:2,price:0}];const r=gap();assert.match(r.source,/line 1; Contract SYNTHETIC line 2/);assert.equal(r.value,null);ctx.ONHIRE_ROWS=[row];
});
const covered=gap(),unpriced=gap({item:'FWF Trailer'});
check('shared summary separates missing money from retained contract advisories',()=>{
 const context=vm.createContext({workPricing1007:()=>[covered,unpriced],missing:[],short:[]});
 context.miss=(a,b)=>{context.missing.push(a);context.short.push(b);};
 vm.runInContext(section(' const workReview1225=workPricing1007();','miss(labourNote753(day)'),context);
 vm.runInContext(section(' const caveats = [];',' if (SF && SF.provisional)'),context);
 const result=vm.runInContext('({missing,caveats,caveats_short})',context);
 assert.equal(result.missing.length,1);assert(result.missing[0].includes('FWF Trailer'));assert.equal(result.caveats.length,1);assert(result.caveats[0].includes(covered.why));assert.equal(result.caveats_short.length,1);
});
check('charge assurance keeps both unpriced and covered-allocation reviews',()=>{
 const at=html.indexOf('const C=typeof module!==\'undefined\'&&module.exports?require(\'./charge_checks1224_src.js\')');assert(at>=0);
 const from=html.indexOf('function project(m){',at),end=html.indexOf('const api={project};',from);
 const context=vm.createContext({C:require('../../v12.24_charge_assurance_LIVE/charge_checks1224_src.js')});
 const project=vm.runInContext('('+html.slice(from,end).trim()+')',context),result=project({workPricing:[covered,unpriced]});
 assert.equal(result.issues.length,2);assert(result.issues.some(x=>x.charge===covered.name&&x.reason===covered.why));
});
check('drawer label uses the same work classification and evidence',()=>{
 const from=html.indexOf('if(!info.lines.length){const gap=workGap1007(a,l);'),end=html.indexOf('\n',from);assert(from>=0);
 const context=vm.createContext({info:{lines:[]},a:{},l:{item:'TL2'},workGap1007:()=>covered,esc:String});
 const rendered=vm.runInContext('(function(){'+html.slice(from,end)+'})()',context);
 assert(rendered.includes(covered.name));assert(rendered.includes(covered.why));assert(!rendered.includes('Work scope / rate to confirm'));
});
check('native coverage lookup is limited to barrier installation and fails closed',()=>{
 const provider=ctx.contractBulkCoverage1224;
 Object.assign(ctx,{window:{},movedAway:()=>false,receivedChargeQty1006:()=>5,ItemIdentity979:{select:()=>[]},gcModel925:()=>({rows:[]}),branchOf:()=>({code:'TEST'}),cardRate:()=>({})});
 vm.runInContext(section(' window.workGap1007=function(a,l){',' window.workPricing1007='),ctx);
 const a={key:'TEST-BARRIER',discipline:'Water-filled barriers'},l={item:'TL2',discipline:a.discipline};
 assert.equal(ctx.window.workGap1007(a,l).state,'contract_scope');
 ctx.contractBulkCoverage1224=()=>{throw Error('unavailable')};assert.equal(ctx.window.workGap1007(a,l).state,'unpriced');
 ctx.contractBulkCoverage1224=undefined;assert.equal(ctx.window.workGap1007(a,l).state,'unpriced');
 let calls=0;ctx.contractBulkCoverage1224=()=>{calls++;return provider('water-filled-barriers','installation')};
 assert.equal(ctx.window.workGap1007({...a,discipline:'Other'},l).state,'unpriced');assert.equal(calls,0);ctx.contractBulkCoverage1224=provider;
});
if(process.env.BASE)check('per-reference totals and original unpriced result shape remain unchanged',()=>{
 const base=fs.readFileSync(process.env.BASE,'utf8'),b=vm.createContext({module:{exports:{}}});
 vm.runInContext(base.match(/<script id="finance1007-script">([\s\S]*?)<\/script>/)[1],b);
 assert.deepEqual(plain(F.workGap(input)),plain(b.module.exports.workGap(input)));
 const rows=s=>s.slice(s.indexOf(' const previousRows1007=arrivedChargeRows975;'),s.indexOf(' const previousBranches1007=pl752Rows;'));
 assert.equal(rows(html),rows(base));
});
console.log(JSON.stringify({passed:checks,failed:0,synthetic:true,record_writes:0,network:false}));
