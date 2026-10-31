/* Author: Andrew Fisher. Native ruled-contract acceptance on exact pages and a pinned record.
 * GET-only harness; private evidence and an independently reviewed EXPECTED file stay outside git.
 * CAPTURE_ONLY=1 gathers evidence but deliberately does not report acceptance.
 */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const KNOWN_BASES=new Set(['378d4b6632101ad6a1429f31b2241c567b3670ae0888f70b7df6f75109625a5c','20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5']);
const BASE_SHA=process.env.BASE_SHA;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const cents=x=>{assert.equal(typeof x,'number','Money comparison requires an explicit number');assert(Number.isFinite(x));return Math.round(x*100);};
const lineKey=r=>String(r.rental_contract)+'|'+String(r.line);
function extract(file,start,finish){
 const text=fs.readFileSync(path.resolve(__dirname,file),'utf8'),begin=text.indexOf(start),end=text.indexOf(finish,begin);
 assert(begin>=0&&end>begin,'Shared native reader boundary changed');
 return vm.runInNewContext(text.slice(begin,end).replace(/^const \w+=/,'').replace(/;\s*$/,''));
}
const read=extract('../../v12.45.1_financial_consistency_LIVE/tests/financial_native.cjs','const read=()=>holdAssets(()=>{','\nasync function optionalRegisterCapture');
const details=extract('../../v12.50_contract_quantity_precision_LIVE/tests/native_precision.cjs','const readDetails=()=>holdAssets(()=>{','\n(async()=>');
const finance=()=>holdAssets(()=>{
 const H=fh866Model(),B=pl752Rows(),M=moneySummary();
 return JSON.parse(JSON.stringify({H,legacy:legacyFinance978(),summary:fin745Summary(),branch:branchFinancial978(B,M),
  extraArgs:branchFinancial978.call({testReceiver:true},B,M,{costs:[]}),csv:fh866Csv(H),text:fh866Text(H),html:fh866Html(),monthlyHtml:fin745Html(),
  controls:{print:printCosts.toString(),csv:fh866Csv.toString(),text:fh866Text.toString(),html:fh866Html.toString(),pricing:renderPricing.toString(),monthly:fin745Html.toString()}}));
});
const extra=()=>holdAssets(()=>{
 const LP=labourPlan(),M=moneySummary(),B=pl752Rows(),eq=assetOf('EQ0004'),sourceModel=Source949.model();
 const peeAsset=assetOf('WC09'),peeItem='Pee Panel',peeSource=ONHIRE_ROWS.find(r=>String(r.rental_contract)==='9994954'&&Number(r.line)===19);
 const peeSourceBefore=peeSource?JSON.stringify(peeSource):null;
 const peeSelected=peeAsset?ItemIdentity979.select(peeAsset.key,peeItem,ONHIRE_ROWS,gcModel925(peeAsset).rows):[];
 const peeProjection=peeAsset?ItemCharges979.project(peeAsset.key,peeItem,peeSelected,generatorDisplayCharge1004,cardRate(peeAsset.discipline,peeItem,peeAsset.key).labour_per_piece,sourceModel):null;
 const peeHtml=peeAsset?itemChargesHtml979(peeAsset,peeItem):'';
 const peeTable=new DOMParser().parseFromString('<table><tbody>'+peeHtml+'</tbody></table>','text/html');
 const peeHireRows=[...peeTable.querySelectorAll('tr[data-item979]')].map(row=>[...row.querySelectorAll('td')].map(td=>td.textContent.trim())).filter(cells=>/^Hire(?:\s|$)/.test(cells[0]||''));
 const arrivedDocument=new DOMParser().parseFromString(peeAsset?arrivedChargesHtml975(peeAsset):'','text/html');
 const arrivedPee=[...arrivedDocument.querySelectorAll('section[data-charges952] > details')].find(d=>d.querySelector(':scope > summary')?.textContent.startsWith('Pee Panel ×'));
 const arrivedRows=arrivedPee?[...arrivedPee.querySelectorAll('tbody > tr')].map(row=>[...row.querySelectorAll(':scope > td')].map(td=>td.textContent.trim())):[];
 const assignments=DATA.rental_on_hire.assignments;
 const ownUseItems=new Map(LP.slots.filter(s=>String(assignments[s.ref]?.rental_contract)==='9968929'&&['install','steps','levelling','demob','cleaning'].includes(s.key)).map(s=>[JSON.stringify([s.ref,s.item]),{ref:s.ref,item:s.item}]));
 const ownUseDrawers=[...ownUseItems.values()].map(({ref,item})=>{
  const asset=assetOf(ref),doc=new DOMParser().parseFromString(asset?arrivedChargesHtml975(asset):'','text/html');
  const detail=[...doc.querySelectorAll('section[data-charges952] > details')].find(d=>d.querySelector(':scope > summary')?.textContent.startsWith(item+' ×'));
  return {ref,item,assignment:assignments[ref],summary:detail?.querySelector(':scope > summary')?.textContent||'',
   rows:detail?[...detail.querySelectorAll('tbody > tr')].map(row=>[...row.querySelectorAll(':scope > td')].map(td=>td.textContent.trim())):[],
   note:detail?.querySelector('[data-installation-coverage1255]')?.textContent||''};
 });
 return JSON.parse(JSON.stringify({
  rows:ONHIRE_ROWS.map(row=>({row,charge:contractCharge(row),category:contractChargeCategory1224(row),stream:contractChargeStream1224(row),branch:generatorBranch1004(row),billingQuantity:contractBillingQuantity1010(row),allocation:contractAllocation1010(row),treatment:contractTreatment747(row),owner:finance928ContractOwner(row)})),
  allLabourSlots:LP.slots,labourPlan:{all:LP.all,byLine:[...LP.byLine],byBranch:[...LP.byBranch],fwf:LP.fwf1244},
  ticks:pl760Ticks(),service:servicing748(),supplier:supplierService1068(),scope:scopeFigures(),scopeBranch:scopeBranchAllocation978(),money:M,branch:branchFinancial978(B,M),contractBranch:B,
  pee:peeHireForecast979(),pricingForecast:pricingForecast1010(),
  peeDrawer:{selected:peeSelected,projection:peeProjection,hireRows:peeHireRows,unlinked:!!peeTable.querySelector('[data-item979-unlinked]'),sourceUnchanged:peeSourceBefore===(peeSource?JSON.stringify(peeSource):null),formattedAmount:peeProjection?.amount==null?null:money(peeProjection.amount),arrivedRows,arrivedSummary:arrivedPee?.querySelector(':scope > summary')?.textContent,coverageNote:arrivedPee?.querySelector('[data-installation-coverage1255]')?.textContent||''},
  ownUseDrawers,
  source949:{model:sourceModel,rows:ONHIRE_ROWS.filter(r=>Source949.evidence(r)).map(r=>({key:r.rental_contract+'|'+r.line,evidence:Source949.evidence(r),value:Source949.forRow(r)})),months:sourceModel.map(f=>({id:f.id,values:['2026-09','2026-10','2026-11'].map(m=>Source949.month(f,m))}))},
  eq0004:eq?{asset:eq,total:assetTotal(eq),arrived:arrivedChargeRows975(eq),service:nightService1040(eq),held:NotChargedHere1152.has('EQ0004')}:null,
  moduleSources:typeof RuledFinance1255==='object'?RuledFinance1255.installation:null
 }));
});

function privatePath(value,label){
 assert(value,label+' is required');const resolved=path.resolve(value),repo=path.resolve(__dirname,'../../..');
 assert(resolved!==repo&&!resolved.startsWith(repo+path.sep),label+' must be private, outside the repository');return resolved;
}
function observedDeltas(A,B){
 const revenue={};for(const row of B.financial.revenue){const next=A.financial.revenue.find(x=>x.key===row.key);if(next)revenue[row.key]={now:cents(next.now)-cents(row.now),job:cents(next.job)-cents(row.job)};}
 const branches={};for(const row of B.financial.branch.rows){const next=A.financial.branch.rows.find(x=>x.code===row.code);if(next)branches[row.code]=Object.fromEntries(['revenue','revenueJob','cost','costJob'].map(k=>[k,cents(next[k])-cents(row[k])]));}
 return {revenue,branches,headline:{now:cents(A.financial.ledger.now)-cents(B.financial.ledger.now),job:cents(A.financial.ledger.job)-cents(B.financial.ledger.job)}};
}

function validate(result,expected){
 let checks=0;
 const same=(name,a,b)=>{assert.deepEqual(canonical(a),canonical(b),name);checks++;};
 const check=(name,ok)=>{assert(ok,name);checks++;};
 const money=(name,a,b)=>same(name,cents(a),cents(b));
 const B=result.models.base,A=result.models.candidate;
 const matchesRule=(rule,slot)=>rule.refs.includes(slot.ref)&&rule.items.includes(slot.item)&&rule.keys.includes(slot.key)&&(!rule.states||rule.states.includes(slot.state));
 const ownUseRules=expected?.ownUseCoverageRules||[];
 for(const [name,x]of Object.entries(result.models)){
  same(name+' explicit fixed instant',x.fixedTime,result.fixedTime);
  same(name+' zero runtime/console errors and writes',[x.errors,x.consoleErrors,x.writes],[[],[],0]);
  same(name+' pinned record settled',[x.baseline.docsMatch,x.baseline.inflight,x.baseline.queuedDocuments],[true,0,0]);
  same(name+' no pending record writes',x.financial.queue,{inflight:0,queued:0});
 }
 same('same exact native record',[A.baseline.version,A.baseline.stateSha256],[B.baseline.version,B.baseline.stateSha256]);
 same('every operational document preserved',A.financial.docs,B.financial.docs);
 same('physical units, quantities, source assets, branches and arrival evidence preserved',A.details.physical,B.details.physical);
 same('Build group identities preserved',Object.keys(A.details.build),Object.keys(B.details.build));
 for(const [key,b]of Object.entries(B.details.build)){
  const a=A.details.build[key];
  // Native Build comparisons include customer Hire totals, which this release intentionally changes.
  // Preserve comparison identity, quantities and transport; money acceptance is independently gated below.
  const comparisons=b&&Array.isArray(b.comparisons)?a.comparisons.map((row,i)=>Object.hasOwn(b.comparisons[i],'hire')?{...row,hire:b.comparisons[i].hire}:row):a?.comparisons;
  same('Build physical projection '+key,b&&Array.isArray(b.money)?{...a,money:b.money,...(Array.isArray(b.comparisons)?{comparisons}:{})}:a,b);
 }
 same('footer only changes release number',A.financial.footer,B.financial.footer.replace(/v12\.54(?:\.1)?\b/,'v12.55'));
 for(const key of ['categories','costs','supplier','supplierModel','heldReferences','sourceScope','documentedCustomerFenceAmount'])same('unrelated financial/source projection '+key,A.financial[key],B.financial[key]);
 const omit=(value,keys)=>Object.fromEntries(Object.entries(value||{}).filter(([key])=>!keys.includes(key)));
 same('supplier event crew inputs unchanged',omit(A.financial.eventCrew,['customer']),omit(B.financial.eventCrew,['customer']));
 same('supplier race crew inputs unchanged',omit(A.financial.crew,['charge']),omit(B.financial.crew,['charge']));
 same('Direct cost values and inputs unchanged',{...A.financial.direct,race_crew1227:omit(A.financial.direct.race_crew1227,['charge'])},{...B.financial.direct,race_crew1227:omit(B.financial.direct.race_crew1227,['charge'])});
 same('fencing supplier and physical model unchanged',omit(A.financial.fenceAll,['charge','scope','cl']),omit(B.financial.fenceAll,['charge','scope','cl']));
 same('fencing contract charge identities preserved',A.financial.fenceAll.cl.map(r=>r.w),B.financial.fenceAll.cl.map(r=>r.w));
 for(const [i,row]of A.financial.fenceAll.cl.entries()){
  const prior=B.financial.fenceAll.cl[i];
  if(row.w.endsWith('9997710/1')){
   same('ruled fence detail keeps its physical/source label',omit(row,['a']),omit(prior,['a']));
   money('ruled fence detail equals its native source charge',row.a,A.details.contracts.find(r=>r.key==='9997710|1').charge.amount);
  }else same('unruled fencing contract detail exact '+i,row,prior);
 }
 same('customer servicing remains exactly as approved in v12.54',A.financial.service,B.financial.service);
 same('linked supplier model, per-row evidence and monthly amounts exact',A.extra.source949,B.extra.source949);
 same('EQ0004 physical identity, charges, service and financial hold exact',A.extra.eq0004,B.extra.eq0004);
 same('supplier service decoration exact',A.financial.service.supplier1068,B.financial.service.supplier1068);
 same('physical tick count preserved',A.financial.ticks.ticks,B.financial.ticks.ticks);
 for(const key of ['install','cleaning','fire_ext','other'])same('physical '+key+' tick count',A.financial.ticks[key].ticks,B.financial.ticks[key].ticks);
 const ownUseCleaning=B.extra.allLabourSlots.filter((s,i)=>s.key==='cleaning'&&s.state==='charged'&&(expected?ownUseRules.some(r=>matchesRule(r,s)):!!A.extra.allLabourSlots[i]?.ownUse1255));
 same('Cleaning counts and unknown-rate state preserved',omit(A.financial.ticks.cleaning,['amount']),omit(B.financial.ticks.cleaning,['amount']));
 same('only independently ruled own-use Cleaning leaves customer charges',cents(A.financial.ticks.cleaning.amount),cents(B.financial.ticks.cleaning.amount)-ownUseCleaning.reduce((n,s)=>n+cents(s.value),0));
 for(const [branch,b]of Object.entries(B.financial.ticks.byBranch)){
  const a=A.financial.ticks.byBranch[branch];
  same('Cleaning branch counts and unknown rates preserved '+branch,omit(a.cleaning,['amount']),omit(b.cleaning,['amount']));
  same('Cleaning branch amount changes only for approved own use '+branch,cents(a.cleaning.amount),cents(b.cleaning.amount)-ownUseCleaning.filter(s=>s.branch===branch).reduce((n,s)=>n+cents(s.value),0));
 }
 same('unrelated other tick projection retained',A.financial.ticks.other,B.financial.ticks.other);
 same('labour physical slot count unchanged',A.extra.allLabourSlots.length,B.extra.allLabourSlots.length);
 const slotMoney=['rate','value','sourceRate1255','sourceValue1255','covered1255','ownUse1255'];
 for(const [i,b]of B.extra.allLabourSlots.entries()){
  const a=A.extra.allLabourSlots[i];same('physical labour slot '+i,omit(a,slotMoney),omit(b,slotMoney));
  if(a.covered1255||a.ownUse1255){
   money('covered customer slot zero '+i,a.value,0);money('covered customer rate zero '+i,a.rate,0);
   same('covered slot retains original rate '+i,a.sourceRate1255,b.rate);
   same('covered slot retains exact cost-allocation value '+i,a.sourceValue1255,b.value);
  }else if(b.key==='fire_ext'){
   check('fire customer amount stays unchanged or is explicitly zero '+i,a.value===b.value||a.value===0);
   check('fire customer rate stays unchanged or is explicitly zero '+i,a.rate===b.rate||a.rate===0);
  }else same('uncovered labour charge exact '+i,a,b);
 }
 same('scope physical hours, dates and source envelope unchanged',omit(A.financial.scope,['lines','people','total']),omit(B.financial.scope,['lines','people','total']));
 same('scope role identities retained',A.financial.scope.lines.map(l=>l.key),B.financial.scope.lines.map(l=>l.key));
 for(const b of B.financial.scope.lines){
  const a=A.financial.scope.lines.find(l=>l.key===b.key);
  if(a.covered1255){
   same('covered scope physical fields retained '+b.key,omit(a,['amount','amount_exact','sourceAmount1255','sourceAmountExact1255','covered1255']),omit(b,['amount','amount_exact']));
   money('covered scope amount zero '+b.key,a.amount,0);money('covered exact scope amount zero '+b.key,a.amount_exact,0);
   same('covered scope retains prior amount '+b.key,a.sourceAmount1255,b.amount);same('covered scope retains prior exact amount '+b.key,a.sourceAmountExact1255,b.amount_exact);
  }else same('uncovered scope complete result retained '+b.key,a,b);
 }
 same('public branch reader ignores extra arguments',A.finance.extraArgs,A.finance.branch);
 same('shared rendering/print/export controls preserved',A.finance.controls,B.finance.controls);
 for(const key of ['people','peopleCheck','pos','poSum','receiptedSum','notConfirmed','counts','noValue','cols','FBR','TBR','costs','costTotal','costCheck','wagesUnpricedAfterEvent'])same('Finance cost/source field '+key,A.finance.H[key],B.finance.H[key]);
 const addedCount=expected?Object.keys(expected.sourceAdditions||{}).length-Object.keys(expected.sourceRemovals||{}).length:A.details.contracts.length-B.details.contracts.length;
 same('billed source metadata changes only its reviewed line denominator',A.finance.H.billed,{...B.finance.H.billed,of:B.finance.H.billed.of+addedCount});
 for(const b of B.details.monthly){
  const a=A.details.monthly.find(x=>x.month===b.month);check('same monthly period '+b.month,!!a);
  for(const key of ['costs','unallocatedCosts','invoiceRecords','labourReview','supplierIncomplete1068','supplierFullCost1068','costCandidateTotal','costAccrue','costDecide','forecastCostTotal','invoiced','invoiceSnapshotTotal','wip'])same('monthly cost/source '+b.month+' '+key,a[key],b[key]);
 }
 check('all native reconciliation ties pass',A.financial.reconciliation.ok&&A.financial.reconciliation.bad===0&&A.financial.reconciliation.ties.every(x=>x.ok));
 check('all branch cent ties pass',Object.values(A.financial.branch.checks).every(Boolean));
 check('Finance invoice/current and forecast ties pass',Object.values(A.finance.H.invCheck).every(Boolean));
 money('headline equals ledger',A.financial.customer.total,A.financial.ledger.now);
 for(const [group,label]of [[A.financial.revenue,'candidate'],[B.financial.revenue,'base']]){
  const ledger=label==='candidate'?A.financial.ledger:B.financial.ledger;
  same(label+' current ledger adds to cents',group.reduce((s,r)=>s+cents(r.now),0),cents(ledger.now));
  same(label+' forecast ledger adds to cents',group.reduce((s,r)=>s+cents(r.job),0),cents(ledger.job));
 }
 same('branch identities preserved',A.financial.branch.rows.map(x=>x.code),B.financial.branch.rows.map(x=>x.code));
 for(const row of A.financial.branch.rows){
  const inv=A.finance.H.inv.find(x=>x.branch===row.code);check('Finance branch exists '+row.code,!!inv);
  money('Finance current revenue agrees '+row.code,inv.onRecord,row.revenue);money('Finance forecast agrees '+row.code,inv.job,row.revenueJob);
  const prior=B.finance.H.inv.find(x=>x.branch===row.code);money('billed amount preserved '+row.code,inv.billed,prior.billed);
 }
 if(!expected)return {status:'CAPTURE ONLY',checks,acceptance:false,reason:'Independent expected source/ledger/branch manifest not supplied'};
 check('expected manifest explicitly reviewed',expected.reviewed===true&&typeof expected.basis==='string'&&expected.basis.length>0);
 same('expectation predecessor pinned',expected.baseSha256,BASE_SHA);
 same('expectation candidate pinned',expected.candidateSha256,result.models.candidate.baseline.pageSha256);
 same('expectation pinned record',expected.stateSha256,result.models.candidate.baseline.stateSha256);
 check('independent labour coverage rules supplied',Array.isArray(expected.labourCoverageRules));
 check('independent own-use coverage rules supplied',Array.isArray(expected.ownUseCoverageRules));
 check('independent scope coverage supplied',expected.scopeCoverage&&typeof expected.scopeCoverage==='object'&&!Array.isArray(expected.scopeCoverage));
 for(const [i,rule]of expected.labourCoverageRules.entries()){
  check('explicit refs/items/keys for coverage rule '+i,['refs','items','keys'].every(k=>Array.isArray(rule[k])&&rule[k].length>0));
  check('explicit coverage source '+i,typeof rule.source==='string'&&rule.source.length>0);
 }
 for(const [i,rule]of ownUseRules.entries()){
  check('explicit refs/items/keys for own-use rule '+i,['refs','items','keys'].every(k=>Array.isArray(rule[k])&&rule[k].length>0));
  same('own-use rule names the separately ruled source contract '+i,rule.contract,'9968929');
 }
 const coveredSourceRows=new Set();
 for(const [i,b]of B.extra.allLabourSlots.entries()){
  const a=A.extra.allLabourSlots[i],rules=expected.labourCoverageRules.filter(r=>matchesRule(r,b)),ownRules=ownUseRules.filter(r=>matchesRule(r,b));
  check('one covering contract rule at most for slot '+i,rules.length<=1);
  check('one own-use rule at most for slot '+i,ownRules.length<=1);
  check('own use is distinct from Installation source coverage '+i,!(rules.length&&ownRules.length));
  same('only independently approved slot is covered '+i,!!a.covered1255,rules.length===1);
  same('only independently approved slot is own use '+i,!!a.ownUse1255,ownRules.length===1);
  if(ownRules.length){
   same('own-use contract provenance is explicit '+i,a.ownUse1255,{contract:ownRules[0].contract,category:'Coates own use',outcome:'no customer charge'});
   money('own-use customer value is zero '+i,a.value,0);money('own-use customer rate is zero '+i,a.rate,0);
   same('own-use original allocation rate is retained '+i,a.sourceRate1255,b.rate);
   same('own-use original allocation value is retained '+i,a.sourceValue1255,b.value);
  }
  if(rules.length){same('approved source covers slot '+i,a.covered1255.source,rules[0].source);same('covered slot classification '+i,a.covered1255.category,'Installation');rules[0].source.split(/\s*\+\s*/).forEach(k=>coveredSourceRows.add(k));}
 }
 const expectedOwnUseItems=new Map();
 for(const rule of ownUseRules)for(const ref of rule.refs)for(const item of rule.items)expectedOwnUseItems.set(JSON.stringify([ref,item]),{ref,item,contract:rule.contract,keys:rule.keys});
 same('only reviewed own-use item readers exist',A.extra.ownUseDrawers.map(r=>JSON.stringify([r.ref,r.item])).sort(),[...expectedOwnUseItems.keys()].sort());
 same('own-use item reader identities preserved',A.extra.ownUseDrawers.map(r=>[r.ref,r.item]),B.extra.ownUseDrawers.map(r=>[r.ref,r.item]));
 for(const drawer of A.extra.ownUseDrawers){
  const key=JSON.stringify([drawer.ref,drawer.item]),rule=expectedOwnUseItems.get(key),prior=B.extra.ownUseDrawers.find(r=>r.ref===drawer.ref&&r.item===drawer.item);
  same('own-use source assignment retained '+key,drawer.assignment,prior.assignment);
  same('own-use reader is assigned to the ruled contract '+key,String(drawer.assignment.rental_contract),rule.contract);
  same('own-use drawer explains no charge without false Installation coverage '+key,drawer.note,'Coates own use on contract '+rule.contract+'; no customer charge. Physical completion is recorded separately.');
  check('own-use summary explicitly says no customer charge '+key,drawer.summary.includes('Coates own use; no customer charge'));
  check('own-use summary does not claim contract Installation coverage '+key,!drawer.summary.includes('Installation charged on contract'));
  for(const part of rule.keys){
   const slot=B.extra.allLabourSlots.find(s=>s.ref===drawer.ref&&s.item===drawer.item&&s.key===part);check('approved own-use component exists '+key+' '+part,!!slot);
   const rows=drawer.rows.filter(cells=>cells[0]===slot.line);
   same('own-use drawer component appears once '+key+' '+part,rows.length,1);
   same('own-use drawer component has truthful customer treatment '+key+' '+part,[rows[0][1],rows[0][3]],['Coates own use','No customer charge']);
  }
 }
 for(const b of B.financial.scope.lines){
  const a=A.financial.scope.lines.find(l=>l.key===b.key),source=expected.scopeCoverage[b.key];
  same('only independently approved scope role is covered '+b.key,!!a.covered1255,typeof source==='string');
  if(source){same('approved source covers scope role '+b.key,a.covered1255.source,source);same('covered scope classification '+b.key,a.covered1255.category,'Installation');source.split(/\s*\+\s*/).forEach(k=>coveredSourceRows.add(k));}
 }
 for(const key of Object.keys(expected.scopeCoverage))check('approved scope role exists '+key,B.financial.scope.lines.some(l=>l.key===key));
 check('explicit per-piece fire-zero decision supplied',expected.fireZero===true);
 money('per-piece fire charge zero',A.financial.ticks.fire_ext.amount,0);
 for(const [i,s]of A.extra.allLabourSlots.entries())if(s.key==='fire_ext'){money('physical fire slot customer value zero '+i,s.value,0);money('physical fire slot customer rate zero '+i,s.rate,0);}
 check('independent FWF coverage supplied',expected.fwfCoverage&&Array.isArray(expected.fwfCoverage.coveredSources)&&Array.isArray(expected.fwfCoverage.remainingSources));
 const fwf=A.financial.ticks.fwf1244,fwfExpected=expected.fwfCoverage;
 same('FWF physical charged basis retained',fwf.recorded,B.financial.ticks.fwf1244.recorded);
 same('FWF remaining source identities',fwf.source,fwfExpected.remainingSources);
 same('FWF covered source identities',fwf.ruled1255.coveredSources,fwfExpected.coveredSources);
 same('FWF remaining aggregate approved cents',cents(fwf.approved),fwfExpected.targetCents);
 same('FWF contract coverage cents',cents(fwf.ruled1255.coveredAmount),fwfExpected.coveredAmountCents);
 same('FWF balancing adjustment in cents',cents(fwf.delta),fwfExpected.targetCents-cents(fwf.recorded));
 fwfExpected.coveredSources.forEach(k=>coveredSourceRows.add(k));
 for(const key of coveredSourceRows){
  check('covered source has independently expected contract result '+key,expected.contractResults&&Object.hasOwn(expected.contractResults,key));
  const row=A.details.contracts.find(r=>r.key===key);check('covered source exists exactly once '+key,!!row&&A.details.contracts.filter(r=>r.key===key).length===1);
  same('covered source is contract Installation '+key,row.category,'installation');same('covered source uses Installation stream '+key,row.stream,'crew');
 }
 check('explicit PPE source replacement decision supplied',expected.peeCovered===true);
 for(const key of ['amount','actualAmount','remainingAmount'])money('PPE fallback removed after contract source '+key,A.extra.pee[key],0);
 same('PPE original quoted card evidence preserved',A.extra.pee.source,B.extra.pee.source);
 const peeDrawer=A.extra.peeDrawer,peeContract=A.details.contracts.find(r=>r.key==='9994954|19');
 check('PPE approved contract source exists',!!peeContract);
 same('PPE item reader selects its approved hire source once',peeDrawer.selected.map(lineKey),['9994954|19']);
 same('PPE item reader copy names the existing reference',peeDrawer.selected[0].match.key,'WC09');
 check('PPE read association leaves original source unchanged',peeDrawer.sourceUnchanged);
 same('PPE raw source remains unallocated',peeContract.row.match.state,'unmatched');
 same('PPE item projection has one hire line',peeDrawer.projection.lines.map(r=>r.id),['9994954|19']);
 money('PPE item projection equals approved source charge',peeDrawer.projection.amount,peeContract.charge.amount);
 same('PPE item projection is priced',peeDrawer.projection.incomplete,false);
 same('PPE rendered drawer has one hire row',peeDrawer.hireRows.length,1);
 same('PPE rendered drawer shows the whole source amount',peeDrawer.hireRows[0][3],peeDrawer.formattedAmount);
 same('PPE rendered drawer has no unlinked-hire warning',peeDrawer.unlinked,false);
 same('PPE drawer names exact contract Installation coverage',peeDrawer.coverageNote,'Installation included in contract 9994954 line 20. Physical completion is recorded separately.');
 check('PPE drawer subtotal is explicitly distinguished from contract Installation',peeDrawer.arrivedSummary.includes('item subtotal · Installation charged on contract'));
 for(const label of ['Install','Levelling','Demob']){
  const rows=peeDrawer.arrivedRows.filter(cells=>cells[0]===label);
  same('PPE covered drawer component appears once '+label,rows.length,1);
  same('PPE covered drawer component is labelled Included '+label,[rows[0][1],rows[0][3]],['Included','Included']);
 }
 same('PPE separate Cleaning display is retained',peeDrawer.arrivedRows.filter(cells=>cells[0]==='Cleaning'),B.extra.peeDrawer.arrivedRows.filter(cells=>cells[0]==='Cleaning'));
 for(const field of ['sourceChanges','sourceAdditions','sourceRemovals','contractResults','revenueDeltasCents','branchDeltasCents'])check('expected '+field+' supplied',expected[field]&&typeof expected[field]==='object'&&!Array.isArray(expected[field]));
 const before=new Map(B.details.contracts.map(x=>[x.key,x])),after=new Map(A.details.contracts.map(x=>[x.key,x]));
 same('no duplicate native source identities',after.size,A.details.contracts.length);
 same('only approved source rows removed',[...before.keys()].filter(k=>!after.has(k)).sort(),Object.keys(expected.sourceRemovals).sort());
 for(const [key,proof]of Object.entries(expected.sourceRemovals))same('approved removed predecessor row and charge proof '+key,before.get(key),proof);
 same('only approved source additions',[...after.keys()].filter(k=>!before.has(k)).sort(),Object.keys(expected.sourceAdditions).sort());
 const targets=new Set([...Object.keys(expected.sourceChanges),...Object.keys(expected.sourceAdditions),...Object.keys(expected.contractResults)]);
 for(const [key,b]of before){
  if(Object.hasOwn(expected.sourceRemovals,key))continue;
  const a=after.get(key),changes=expected.sourceChanges[key]||{},row={...b.row};
  for(const [field,value]of Object.entries(changes))row[field]=value;
  same('bounded source fields '+key,a.row,row);
  if(!targets.has(key))same('unrelated complete contract result '+key,a,b);
  else{
   same('existing contract branch and ownership preserved '+key,[a.branch,a.owner],[b.branch,b.owner]);
   same('existing physical source mapping preserved '+key,a.row.match,b.row.match);
  }
 }
 for(const [key,row]of Object.entries(expected.sourceAdditions))same('reviewed source-only addition '+key,after.get(key).row,row);
 for(const [key,wanted]of Object.entries(expected.contractResults)){
  const actual=after.get(key);check('expected contract result exists '+key,!!actual);
  for(const [field,value]of Object.entries(wanted)){
   if(field==='amountCents')same('settled contract charge '+key,actual.charge.amount==null?null:cents(actual.charge.amount),value);
   else if(field==='chargeFields')for(const [sub,v]of Object.entries(value))same('settled contract metadata '+key+' '+sub,actual.charge[sub],v);
   else same('settled contract result '+key+' '+field,actual[field],value);
  }
 }
 for(const key of Object.keys(expected.sourceChanges))check('source modification has an expected charge result '+key,key in expected.contractResults);
 for(const key of Object.keys(expected.sourceAdditions))check('source addition has an expected charge result '+key,key in expected.contractResults);
 const deltas=result.observedDeltas;
 same('ledger identities preserved',A.financial.revenue.map(x=>[x.key,x.code]),B.financial.revenue.map(x=>[x.key,x.code]));
 for(const [key,d]of Object.entries(deltas.revenue))same('independent ledger delta '+key,d,expected.revenueDeltasCents[key]||{now:0,job:0});
 for(const key of Object.keys(expected.revenueDeltasCents))check('expected ledger exists '+key,key in deltas.revenue);
 for(const [code,d]of Object.entries(deltas.branches))same('independent branch delta '+code,d,{revenue:0,revenueJob:0,cost:0,costJob:0,...expected.branchDeltasCents[code]});
 for(const code of Object.keys(expected.branchDeltasCents))check('expected branch exists '+code,code in deltas.branches);
 const sum=(collection,key)=>Object.values(collection).reduce((n,r)=>n+(r[key]||0),0);
 same('expected ledger current delta agrees with headline',deltas.headline.now,sum(expected.revenueDeltasCents,'now'));
 same('expected ledger forecast delta agrees with headline',deltas.headline.job,sum(expected.revenueDeltasCents,'job'));
 same('expected branch current delta agrees with headline',deltas.headline.now,sum(expected.branchDeltasCents,'revenue'));
 same('expected branch forecast delta agrees with headline',deltas.headline.job,sum(expected.branchDeltasCents,'revenueJob'));
 return {status:'PASS',checks,acceptance:true,expectedSha256:result.expectedSha256};
}

(async()=>{
 assert(process.env.BASE&&process.env.BASE_SHA&&process.env.CANDIDATE&&process.env.CANDIDATE_SHA&&process.env.STATE&&process.env.OUT,'Explicit exact pages, predecessor hash, snapshot and private output required');
 assert(KNOWN_BASES.has(BASE_SHA),'Root must pin one of the reviewed exact v12.54/v12.54.1 predecessors');
 const out=privatePath(process.env.OUT,'OUT'),stateFile=privatePath(process.env.STATE,'STATE');fs.mkdirSync(out,{recursive:true});
 const candidate=path.resolve(process.env.CANDIDATE),base=path.resolve(process.env.BASE);
 assert.equal(sha(fs.readFileSync(base)),BASE_SHA);assert.equal(sha(fs.readFileSync(candidate)),process.env.CANDIDATE_SHA);
 const instant=new Date(process.env.FIXED_TIME||'2026-10-28T18:30:00.000Z');assert(Number.isFinite(instant.getTime()));
 let expected=null;const captureOnly=process.env.CAPTURE_ONLY==='1';
 if(process.env.EXPECTED){const file=privatePath(process.env.EXPECTED,'EXPECTED');expected=JSON.parse(fs.readFileSync(file,'utf8'));}
 assert(captureOnly||expected,'Acceptance requires an independently reviewed private EXPECTED manifest; use CAPTURE_ONLY=1 for diagnostics');
 const result={author:'Andrew Fisher',createdUtc:new Date().toISOString(),fixedTime:instant.toISOString(),models:{},expectedSha256:process.env.EXPECTED?sha(fs.readFileSync(process.env.EXPECTED)):null};
 const save=()=>fs.writeFileSync(path.join(out,'native-contracts.json'),JSON.stringify(result,null,2)+'\n');
 for(const [label,file]of [['base',base],['candidate',candidate]]){
  process.env.PAGE=file;process.env.STATE=stateFile;const s=await openCandidate();
  let stage='clock';
  try{
   await s.page.clock.setFixedTime(instant);
   const model=result.models[label]={baseline:s.baseline,fixedTime:await s.page.evaluate(()=>new Date().toISOString()),errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked};
   for(const [name,reader]of [['financial',read],['details',details],['finance',finance],['extra',extra]]){
    stage=name;model[name]=await s.page.evaluate(reader);model.writes=s.counts.blocked;save();
   }
   console.log('Captured '+label+' native financial/source/physical outputs');
  }catch(error){
   const model=result.models[label]||(result.models[label]={baseline:s.baseline});
   model.captureError={stage,message:error.message};model.errors=s.errors;model.consoleErrors=s.consoleErrors;model.writes=s.counts.blocked;
   result.validation={status:'CAPTURE FAILED',acceptance:false,model:label,stage,error:error.message};save();throw error;
  }finally{await s.browser.close();}
  const model=result.models[label];fs.writeFileSync(path.join(out,label+'-routes.json'),JSON.stringify({author:'Andrew Fisher',baseline:model.baseline,errors:model.errors,consoleErrors:model.consoleErrors,writes:model.writes,result:model.extra},null,2)+'\n');
  save();
 }
 result.observedDeltas=observedDeltas(result.models.candidate,result.models.base);save();
 try{result.validation=validate(result,captureOnly?null:expected);save();}
 catch(error){result.validation={status:'FAIL',acceptance:false,error:error.message};save();throw error;}
 console.log(JSON.stringify({status:result.validation.status,checks:result.validation.checks,acceptance:result.validation.acceptance}));
})().catch(e=>{console.error('FAIL native ruled-contract gate: '+e.stack);process.exitCode=1;});
