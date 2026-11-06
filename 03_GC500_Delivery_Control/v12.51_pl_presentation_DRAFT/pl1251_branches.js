/* Author: Andrew Fisher. Read-only ledger presentation from existing native financial routes. */
(function (W) {
'use strict';
const cents=v=>Math.round(Number(v)*100), amount=v=>v/100;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const branch=b=>b&& !['—','no branch','the job','Shared job / allocation pending'].includes(b)?b:'Unassigned';
function project(i){
 const rows={};
 const add=(kind,key,code,now,job,basis)=>{
  const id=kind+':'+key,r=rows[id]||(rows[id]={id,kind,key,branches:{},basis:[]}),b=branch(code);
  if(!r.branches[b])r.branches[b]={now:0,job:0};
  if(finite(now))r.branches[b].now+=cents(now);
  if(finite(job))r.branches[b].job+=cents(job);
  if(basis&&!r.basis.includes(basis))r.basis.push(basis);
 };
 const p=i.ledger,rehireCurrent={},consCurrent={};
 const bump=(o,k,v)=>{k=branch(k);o[k]=(o[k]||0)+cents(v||0);};
 for(const r of i.rehireSources)bump(rehireCurrent,r.branch,r.amount);
 bump(rehireCurrent,i.pee.branch,i.pee.actualAmount);
 for(const r of i.consumables)bump(consCurrent,r.branch,r.amount);
 for(const b of i.contractBranches){
  const t=i.ticks.byBranch[b.code]||{},n=k=>t[k]?.amount||0,rh=amount(rehireCurrent[b.code]||0),cons=amount(consCurrent[b.code]||0);
  const hire=amount(cents(b.total)-cents(b.transport)-cents(b.installation1224||0)-cents(b.services1224||0)-cents(rh)-cents(cons)+cents(n('fire_ext')));
  add('revenue','hire',b.code,hire,hire,'Contract/reference branch and existing hire classification');
  add('revenue','transport',b.code,b.transport,b.transport,'Contract and received-equipment transport branch');
  add('revenue','install',b.code,b.installation1224||0,b.installation1224||0,'Source-priced contract Installation branch');
  add('revenue','contract_services1224',b.code,b.services1224||0,b.services1224||0,'Original miscellaneous contract branch; ledger code remains unassigned');
 }
 for(const [b,c]of Object.entries(rehireCurrent))add('revenue','rehire',b,amount(c),amount(c),'Confirmed supplier contract/reference revenue branch');
 for(const [b,c]of Object.entries(consCurrent))add('revenue','cons',b,amount(c),amount(c),'Original consumable contract branch');
 for(const [b,t]of Object.entries(i.ticks.byBranch)){
  add('revenue','install',b,(t.install?.amount||0)+(t.other?.amount||0),(t.install?.amount||0)+(t.other?.amount||0),'Existing per-piece charge branch, including the approved combined adjustment');
  add('revenue','cleaning',b,t.cleaning?.amount||0,t.cleaning?.amount||0,'Existing per-piece cleaning branch');
 }
 for(const [b,n]of Object.entries(i.fencingByBranch))add('revenue','rehire',b,n,n,'Existing fencing docket revenue branch');
 add('revenue','rehire',i.fencingBranch,0,i.closeout.fencing?.revenue||0,'Native fencing forecast branch');
 add('revenue','pump',i.toiletBranch,i.summary.charge.servicing,i.summary.charge.servicing,'Existing customer servicing branch');
 for(const r of i.scopeParts)add('revenue',r.kind,r.branch,r.recorded,r.job,r.source);
 for(const r of i.manual)add('revenue','other',r.branch,r.recorded,r.job,r.source);
 for(const r of i.forecasts)add('revenue',r.kind,r.branch,0,r.amount,'Existing branch-coded remaining forecast');

 const k=i.summary.cost,sp=i.fenceSplit,tb=i.toiletBranch,fb=i.fencingBranch;
 const supplier=p.qClean?p.qk.rehire:Number(k.rehire)||0,gear=sp.clean?Number(sp.gear)||0:Number(k.fencing_paid)||0;
 add('cost','rehire',tb,supplier,supplier,'Native supplier cost category and cost branch; estimate until invoiced');
 add('cost','rehire',fb,gear,gear+(Number(i.closeout.fencing?.cost)||0),'Existing fencing supplier cost branch');
 for(const r of i.costAllocations.filter(r=>r.kind==='rehire'))add('cost','rehire',r.branch,r.now,r.job,'Explicit supplier cost branch; forecast amounts are estimates');
 for(const key of ['pump','cons']){
  const r=p.cost.find(r=>r.key===key);if(r)add('cost',key,tb,r.now,r.job,'Native supplier cost category and cost branch; estimate until invoiced');
 }
 const install=p.cost.find(r=>r.key==='install');if(install)add('cost','install',fb,install.now,install.job,'Existing fencing supplier Installation cost branch');
 for(const r of i.costAllocations){
  const key=r.kind==='transport'?'transport':r.kind==='expenses'?'overheads':r.kind==='labour'?'wages':null;
  if(key)add('cost',key,r.branch,r.now,r.job,key==='transport'?'Existing Finance allocation: unbranched loads are shared by known-load weights':key==='overheads'?'Existing Finance allocation: labour-per-piece weights':'Existing Finance KINP labour allocation');
 }
 // A new category cannot silently acquire the whole-job allocation of a different category.
 if(p.cost.some(r=>r.key==='rm'&&(r.now||r.job)))throw Error('R&M needs its own source branch mapping before this preview can be used');
 const ledgerRows=p.rev.map(r=>({...r,kind:'revenue'})).concat(p.cost.map(r=>({...r,kind:'cost'})),[
  {key:'overheads',kind:'cost',now:p.over,job:p.overJob},{key:'wages',kind:'cost',now:p.wages.toDate,job:p.wages.job}
 ]);
 const gaps=[];
 for(const l of ledgerRows){
  const id=l.kind+':'+l.key,r=rows[id]||(rows[id]={id,kind:l.kind,key:l.key,branches:{},basis:[]});
  for(const period of ['now','job']){
   if(!finite(l[period]))continue;
   const missing=cents(l[period])-Object.values(r.branches).reduce((s,b)=>s+b[period],0);
   if(missing){add(l.kind,l.key,'Unassigned',period==='now'?amount(missing):0,period==='job'?amount(missing):0,'Source branch mapping incomplete');gaps.push({id,period,cents:missing});}
  }
 }
 if(gaps.some(g=>g.cents<0))throw Error('Source category mapping exceeds a native ledger row; original display retained');
 const active=new Set(ledgerRows.map(r=>r.kind+':'+r.key));
 for(const [id,r]of Object.entries(rows))if(!active.has(id)&&Object.values(r.branches).some(b=>b.now||b.job))throw Error('Branch source has no native ledger row: '+id);
 const codes=[...new Set(i.nativeBranches.rows.map(r=>branch(r.code)).concat(Object.values(rows).flatMap(r=>Object.keys(r.branches))))].filter(b=>b!=='Unassigned'||Object.values(rows).some(r=>r.branches[b]?.now||r.branches[b]?.job)).sort();
 const aggregate=(kind,keys)=>Object.fromEntries(codes.map(b=>[b,{now:0,job:0}]).map(([b,v])=>{for(const l of ledgerRows.filter(l=>l.kind===kind&&(!keys||keys.includes(l.key)))){const a=rows[kind+':'+l.key].branches[b];if(a){v.now+=a.now;v.job+=a.job;}}return[b,v];}));
 const revenue=aggregate('revenue'),cost=aggregate('cost'),direct=aggregate('cost',p.cost.map(r=>r.key)),beforeWages=aggregate('cost',p.cost.map(r=>r.key).concat('overheads'));
 const difference=Object.fromEntries(codes.map(b=>[b,{now:revenue[b].now-cost[b].now,job:revenue[b].job-cost[b].job}]));
 const nativeMatches=i.nativeBranches.rows.every(b=>{const code=branch(b.code);return revenue[code]?.now===cents(b.revenue)&&revenue[code]?.job===cents(b.revenueJob)&&cost[code]?.now===cents(b.cost)&&cost[code]?.job===cents(b.costJob);});
 if(!nativeMatches)throw Error('Branch row projection differs from the native Finance totals; original display retained');
 return {codes,rows:Object.fromEntries(ledgerRows.map(r=>[r.kind+':'+r.key,rows[r.kind+':'+r.key]])),totals:{revenue,direct,'costs-before-wages':beforeWages,costs:cost,difference},gaps,nativeMatches,allocationQualification:true};
}
function inputs(m){
 const p=m.ledger,summary=m.summary,B=m.contractBranches||pl752Rows(),R=rh766Model(),X=cj764Model(),TK=pl760Ticks(),H=legacyFinance978(),T=transport888Core(),LP=labourPlan(),labW={};
 LP.slots.filter(sl=>['install','steps','levelling','demob'].includes(sl.key)&&sl.value!=null&&sl.branch).forEach(sl=>{labW[sl.branch]=(labW[sl.branch]||0)+sl.value;});
 const tb=pl760ToiletBranch(),fb=pl760FencingBranch(),costAllocations=[];
 for(const r of H.costs){
  let weights;if(r.kind==='fencing')weights={[fb]:1};else if(r.kind==='toilets')weights={[tb]:1};else if(r.kind==='labour')weights={KINP:1};else if(r.kind==='rehire'){const src=X.rows.find(x=>x.stream.split(' — ')[0]===r.stream&&x.toDate===r.toDate&&x.toCome===r.toCome);weights={[src?.branch||'—']:1};}else if(r.kind==='transport')weights=Object.keys(T.weights.toDate).length?T.weights.toDate:labW;else weights=labW;
  // Use the same native allocator as branchFinancial978, retaining its existing basis.
  const recorded=fh866Split(r.toDate,weights);
  for(const b of new Set([...Object.keys(recorded),...Object.keys(r.by)]))costAllocations.push({kind:r.kind,branch:b,now:recorded[b]||0,job:r.by[b]||0});
 }
 const rehireIds=new Set(R.groups.filter(g=>!/^Fencing/.test(g.what)).flatMap(g=>g.revenueLines1010||[]));
 const rehireSources=ONHIRE_ROWS.filter(r=>rehireIds.has(r.rental_contract+'|'+r.line)).map(r=>({branch:generatorBranch1004(r),amount:contractCharge(r).amount}));
 const consumables=ONHIRE_ROWS.filter(r=>['10000506|1','10000506|2','9997710|2'].includes(r.rental_contract+'|'+r.line)).map(r=>({branch:generatorBranch1004(r),amount:contractCharge(r).amount}));
 const scope=scopeBranchAllocation978(),scopeParts=scope.map((r,index)=>({...r,kind:index===scope.length-1?'event_support':'install'}));
 const forecasts=[];
 LP.slots.filter(sl=>sl.state!=='charged'&&sl.value!=null&&['install','steps','levelling','demob','cleaning'].includes(sl.key)).forEach(sl=>forecasts.push({kind:sl.key==='cleaning'?'cleaning':'install',branch:sl.branch,amount:sl.value}));
 (X.buildingTransport.rows||[]).filter(r=>r.remainingAdditional1006>0).forEach(r=>forecasts.push({kind:'transport',branch:r.branch,amount:r.remainingAdditional1006}));
 const pee=peeHireForecast979();if(pee.remainingAmount>0)forecasts.push({kind:'rehire',branch:pee.branch,amount:pee.remainingAmount});
 FinanceRequest996.model().rows.filter(r=>r.amount>0).forEach(r=>forecasts.push({kind:'rehire',branch:r.branch,amount:r.amount}));
 generatorModel1004().rows.filter(r=>r.remaining>0).forEach(r=>forecasts.push({kind:r.ledger==='1010'?'rehire':'hire',branch:r.branch,amount:r.remaining}));
 pricingForecast1010().rows.forEach(r=>forecasts.push({kind:r.ledger==='1010'?'rehire':'hire',branch:r.branch,amount:r.amount}));
 const additional=additionalHire1013();if(additional.remainingAmount>0)forecasts.push({kind:'hire',branch:additional.branch,amount:additional.remainingAmount});
 return {ledger:p,summary,contractBranches:B,nativeBranches:m.branches,ticks:TK,closeout:X,fenceSplit:fencePaidSplit(),fencingByBranch:pl760FencingByBranch(),toiletBranch:tb,fencingBranch:fb,costAllocations,rehireSources,consumables,scopeParts,manual:manualChargeBranches1016(),forecasts,pee};
}
W.PL1251Branches=Object.freeze({inputs,project,model:m=>project(inputs(m))});
})(window);
