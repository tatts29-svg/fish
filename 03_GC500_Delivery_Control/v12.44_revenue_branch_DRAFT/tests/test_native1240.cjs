/* Author: Andrew Fisher. Native customer branch regression; source and supplier projections preserved. GET only. */
'use strict';
const {openCandidate}=require('./browser_harness.cjs');
const {expectedTransfers,assertTransfers}=require('./revenue_transfer_oracle.cjs');
const fs=require('node:fs');
(async()=>{
 const s=await openCandidate();
 try{
  const result=await s.page.evaluate(()=>{
   const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),checks=[],check=(ok,name)=>{checks.push({name,ok:!!ok});if(!ok)throw Error(name);};
   const clear=()=>{RENDER_MEMO.clear();HELD_MEMO.clear();},docs=()=>clone(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
   const saved={S:clone(S),docs:docs(),queue:clone(SYNC.queue),last:clone(SYNC.last),unkept:SYNC.unkept,persisted:PERSISTED_JSON,epoch:REC_EPOCH1066,stale:HELD_STALE775,readonly:SYNC.readonly,level:SYNC.level,send:syncSend,folder:folderWrite,write:mayWrite,cap:capability,who:document.querySelector('#who')?.value,local:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))};
   const capture=()=>{clear();return holdAssets(()=>{
    const P=pl770Model(),M=moneySummary(),C=cj764Model(),R=rh766Model(),H=fh866Model(),B=branchFinancial978(pl752Rows(),M);
    return clone({money:M,scope:scopeFigures(),pnl:P,closeout:C,branches:B,finance:{costs:H.costs,costTotal:H.costTotal,people:H.people,demob:H.demob,invoiceTotal:H.invTotal,invoiceChecks:H.invCheck},
     supplierHire:supplierHire1094Model(),supplierService:supplierService1068(),supplierGroups:R.groups.map(g=>({source:g.what,branch:g.branch,supplier:g.supplier,cost:g.cost,costJob:g.costJob,costToCome:g.costToCome,costBranch:g.costBranch1010,costEvidence:g.costEvidence949})),
     supplierSource949:Source949.model(),supplier955:Supplier955.model(),invoiceRows:H.inv,forecastRows:pricingForecast1010().rows,
     sourceRows:{contracts:ONHIRE_ROWS,scope:SCOPE},
     rehireTotals:R.totals,contractCharges:ONHIRE_ROWS.map(r=>({key:'c|'+r.rental_contract+'|'+r.line,charge:contractCharge(r),category:r.charge_line?contractChargeCategory1224(r):null,owner:finance928ContractOwner(r)})),
     oracleContracts:ONHIRE_ROWS.map(r=>({key:'c|'+r.rental_contract+'|'+r.line,branch:generatorBranch1004(r),amount:contractCharge(r).amount,owner:finance928ContractOwner(r),category:r.charge_line?contractChargeCategory1224(r):null})),
     references:allAssets().map(a=>({ref:a.key,branch:branchOf(a.key),units:gcModel925(a).rows}))});
   });};
   const restore=()=>{clearTimeout(SYNC.timer);SYNC.timer=null;S=clone(saved.S);SYNC.queue=clone(saved.queue);SYNC.last=clone(saved.last);SYNC.unkept=saved.unkept;PERSISTED_JSON=saved.persisted;REC_EPOCH1066=saved.epoch;HELD_STALE775=saved.stale;localStorage.clear();for(const[k,v]of Object.entries(saved.local))localStorage.setItem(k,v);const who=document.querySelector('#who');if(who)who.value=saved.who||'';clear();};
   let baseline,after;const targets=[];
   try{
    const A=RevenueBranch1240;check(A&&typeof A.set==='function','exact Revenue branch API exists');
    syncSend=()=>{clearTimeout(SYNC.timer);SYNC.timer=null;};folderWrite=()=>false;mayWrite=()=>true;capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';S.operator='Synthetic branch reviewer';const who=document.querySelector('#who');if(who)who.value=S.operator;
    baseline=capture();const before=docs();
    const candidates=ONHIRE_ROWS.filter(r=>r.subhired&&A.current('c|'+r.rental_contract+'|'+r.line)?.eligible&&A.status('c|'+r.rental_contract+'|'+r.line).state==='none');
    check(candidates.length>0,'eligible exact hired-in source is present');const row=candidates[0],key='c|'+row.rental_contract+'|'+row.line,ordinary=generatorBranch1004(row),target=A.current(key).allowedBranches.find(b=>b!==ordinary);
    check(A.current(key).source.ordinaryBranch===ordinary,'source binding agrees with the independently captured pre-set branch reader');
    const req=(key,branch)=>A.make(key,{branch,reason:'Synthetic read-only allocation regression',evidence:'Synthetic fixture only; no operational write',confirmed_by:'Synthetic reviewer',confirmed_on:todayIso()});
    check(A.set(key,req(key,target)),'native exact contract allocation accepted');clear();
    targets.push({key,branch:target});
    check(generatorBranch1004(row)===target,'existing customer reader uses exact selected branch');
    const roles=scopeFigures().lines.filter(l=>A.current('scope|'+l.key)?.eligible&&A.status('scope|'+l.key).state==='none'),role=roles.find(l=>l.key==='gentech_ent')||roles[0];check(!!role,'eligible current event role is present');
    const rk='scope|'+role.key,rb=A.current(rk).allowedBranches.find(b=>b!==A.current(rk).branch);
    check(A.set(rk,req(rk,rb)),'native exact event role allocation accepted');clear();
    targets.push({key:rk,branch:rb});after=capture();
    check(same(after.contractCharges,baseline.contractCharges),'all contract charge amounts, periods and ownership categories are unchanged');
    check(same(after.scope,baseline.scope),'complete customer event scope is unchanged');
    check(same(after.supplierHire,baseline.supplierHire),'all supplier hire amounts and source evidence are unchanged');
    check(same(after.supplierService,baseline.supplierService),'all supplier servicing amounts and source evidence are unchanged');
    check(same(after.supplierSource949,baseline.supplierSource949)&&same(after.supplier955,baseline.supplier955),'original supplier pricing and allocation source models are unchanged');
    check(same(after.sourceRows,baseline.sourceRows),'entire source contract and agreed scope records are unchanged');
    check(same(after.supplierGroups,baseline.supplierGroups),'all Rehire supplier groups and cost branches are unchanged');
    check(same(after.rehireTotals,baseline.rehireTotals),'all combined Rehire totals are unchanged');
    check(same(after.references,baseline.references),'all physical quantities, identities and reference branches are unchanged');
    check(same(after.branches.total,baseline.branches.total),'combined Revenue, costs and contribution totals are unchanged');
    const costRows=x=>x.rows.map(r=>[r.code,r.cost,r.costJob]).sort((a,b)=>a[0].localeCompare(b[0]));
    check(same(costRows(after.branches),costRows(baseline.branches)),'every branch supplier and allocated cost remains unchanged');
    check(same(after.finance,baseline.finance),'Finance costs, wages, demob, invoice totals and checks remain unchanged');
    check(same(after.money,baseline.money),'whole-job money and all charge categories remain unchanged');
    check(same(after.pnl,baseline.pnl),'whole-job P&L remains unchanged');
    check(same(after.closeout,baseline.closeout),'whole-job close-out model remains unchanged');
    check(!same(after.branches.rows,baseline.branches.rows),'only financial Revenue allocation changes');
    check(Object.values(after.branches.checks).every(Boolean),'branch Revenue and cost sums reconcile to the combined job');
    const afterDocs=docs(),changes=[];for(const c of Object.keys(before))for(const k of new Set([...Object.keys(before[c]),...Object.keys(afterDocs[c])]))if(!same(before[c][k],afterDocs[c][k]))changes.push(c+'/'+k);
    const expected=[key,rk].flatMap(k=>{const r=A.PREFIX+k;return ['answers/'+docIdOf(r),'stamps/'+docIdOf('answers/'+r),'by/'+docIdOf('answers/'+r)];}).sort();
    check(same(changes.sort(),expected),'exactly two decisions and four native audit documents changed in memory');
    check(A.control(key).includes('data-revenue1240-details')&&A.control(rk).includes('data-revenue1240-details'),'both retained decisions expose their evidence');
    const typed=(S.lineRates||{})[key];S.lineRates=S.lineRates||{};S.lineRates[key]='999.99';clear();check(A.status(key).state==='review'&&generatorBranch1004(row)===ordinary,'changed customer override holds stale branch decision for review');if(typed===undefined)delete S.lineRates[key];else S.lineRates[key]=typed;clear();
    check(A.status(key).state==='active','restored exact source restores validated allocation');
    const decision=clone(S.answers[A.PREFIX+key]);S.answers[A.PREFIX+key].history=[null];clear();check(A.status(key).state==='review'&&A.details(key).includes('Unrecognised retained history'),'malformed retained history is visibly held without runtime failure');S.answers[A.PREFIX+key]=decision;clear();
    check(A.set(key,req(key,''))&&A.status(key).state==='cleared','native clear restores source branch with history');
    check(A.set(rk,req(rk,''))&&A.status(rk).state==='cleared','native role clear restores source role allocation with history');
    check(same(capture(),baseline),'all financial projections restore after clearing decisions');
   }catch(e){if(!checks.some(c=>!c.ok))checks.push({name:'native execution: '+e.message,ok:false});}
   finally{restore();SYNC.readonly=saved.readonly;SYNC.level=saved.level;syncSend=saved.send;folderWrite=saved.folder;mayWrite=saved.write;capability=saved.cap;}
   checks.push({name:'entire synchronized record and queue restored',ok:same(docs(),saved.docs)&&same(S,saved.S)&&same(SYNC.queue,saved.queue)});
   return {checks,baseline,after,targets};
  });
  if(result.checks.every(c=>c.ok)){
   const selected=new Set(result.targets.map(t=>t.key));
   const expected=expectedTransfers({branches:result.baseline.branches.rows,invoices:result.baseline.invoiceRows,contracts:result.baseline.oracleContracts.filter(r=>selected.has(r.key)),forecastRows:result.baseline.forecastRows.filter(r=>selected.has(r.key||'c|'+r.contract+'|'+r.line)),scope:result.baseline.scope,roleBranches:{pm:'KINP',gentech:'NVAC',fence:'STPS',toilets:'KINP',vms:'STPS',gentech_ent:'NVAC',toilets_ent:'KINP'},targets:result.targets});
   try{assertTransfers(expected,{branches:result.after.branches.rows,invoices:result.after.invoiceRows});result.checks.push({name:'exact Revenue and Finance branch transfers match independent pre-set source amounts, including unrelated and residual branches',ok:true});}catch(e){result.checks.push({name:'independent Revenue transfer oracle: '+e.message,ok:false});}
  }
  result.checks.push({name:'zero page errors',ok:s.errors.length===0},{name:'zero console errors',ok:s.consoleErrors.length===0},{name:'zero HTTP write attempts',ok:s.counts.blocked===0},{name:'exact settled frozen record before fixtures',ok:s.baseline.docsMatch&&s.baseline.inflight===0&&s.baseline.queued===0});
  if(process.env.REPORT)fs.writeFileSync(process.env.REPORT,JSON.stringify({author:'Andrew Fisher',...result,record:s.baseline},null,2));
  for(const c of result.checks)console.log((c.ok?'PASS ':'FAIL ')+c.name);const passed=result.checks.filter(c=>c.ok).length;console.log(passed+'/'+result.checks.length+' native checks');if(passed!==result.checks.length)process.exitCode=1;
 }finally{await s.browser.close();}
})().catch(e=>{console.error('FAIL '+e.message);process.exitCode=1;});
