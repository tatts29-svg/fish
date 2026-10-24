/* Author: Andrew Fisher. GET-only charge coverage snapshot; private records stay outside Git. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../toolchain/harness/open_page');
(async()=>{let h;try{
 const out=process.env.OUT||'/workspace/private-gc500-finance1007';fs.mkdirSync(out,{recursive:true});
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000,dpr:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S),checks=[],errors=[],r2=n=>Math.round((n+Number.EPSILON)*100)/100;
  const check=(name,pass)=>checks.push({name,pass:!!pass}),safe=(name,fn)=>{try{return fn();}catch(e){errors.push({name,error:String(e)});return null;}};
  const assets=allAssets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key)),items=[];
  for(const a of assets){const total=safe(a.key+' hire',()=>assetTotal(a)),units=safe(a.key+' units',()=>gcModel925(a).rows);
   for(const l of chargeLines(a)){const card=cardRate(l.discipline,l.item,a.key),p=charge1006(a,l),offered=labourLinesFor(a.key,l.discipline,l.item,a.key,undefined,a);
    const hire=safe(a.key+' '+l.item+' contract',()=>ItemCharges979.project(a.key,l.item,ItemIdentity979.select(a.key,l.item,ONHIRE_ROWS,units),generatorDisplayCharge1004,card.labour_per_piece,[]));
    items.push({ref:a.key,name:a.name||a.title,discipline:l.discipline,item:l.item,quantity:l.quantity,received:p.arrived,branch:branchOf(a.key),relocation:!!a.relocation,delivery:deliveryOf(a.key),physicalUnits:units?.filter(u=>String(u.item).toLowerCase()===String(l.item).toLowerCase()),line:l,card,offered,charges:p,hire,assetHire:total?.lines.find(x=>x.item===l.item),accessories:a.accessories,stairsExcluded:Stairs975.quantity(a,l)});
   }
  }
  const plan=labourPlan(),m=moneySummary(),ticks=pl760Ticks(),bill=onsiteComplete979(),pl=pl770Model(),f=cj764Model(),branches=branchFinancial978(pl752Rows(),m),oct=acc761Model('2026-10'),sep=acc761Model('2026-09'),ties=recon888Model().ties,T=buildingTransportModel831(),V=transport888View(),H=fh866Model(),C=contractFigures(ONHIRE_ROWS),G=generatorModel1004(),scope=scopeFigures(),labour=fin745Summary(null),labourRows=fin745Rows();
  const sum=(rs,k)=>r2(rs.reduce((n,r)=>n+(Number(r[k])||0),0));
  check('No model mutation of shared record',JSON.stringify(S)===before);
  check('All arrived applicable automatic service quantities included',items.filter(i=>i.received>0).every(i=>i.charges.rows.filter(r=>OnsiteCharges1006.automatic.has(r.key)).every(r=>r.qty>=i.received)));
  check('Stairs remain manual',items.every(i=>i.charges.rows.filter(r=>r.key==='steps').every(r=>!r.automatic&&r.qty===r.recordedQty)));
  check('Costs labour equals charged plan and tick total',m.charge.labour===plan.all.charged&&ticks.total===plan.all.charged);
  check('Labour slots have unique reference item charge state',new Set(plan.slots.map(r=>JSON.stringify([r.ref,r.disc,r.item,r.key,r.state]))).size===plan.slots.length);
  check('Costs actual and P&L actual agree',r2(pl.revNow-m.charge.total)===0);
  check('Costs job and P&L forecast agree',r2(pl.revJob-f.revenue.job)===0);
  check('P&L model controls reconcile',Object.values(pl.checks).every(v=>v!==false));
  check('Branch financial controls reconcile',Object.values(branches.checks).every(Boolean));
  check('P&L reconciliation controls pass',ties.filter(r=>r.group==='P&L').every(r=>r.ok));
  check('Arrived package branch sum matches priced subtotal',sum(bill.byBranch,'total')===bill.known);
  check('Transport actual and remaining reconcile once',r2(T.actualAdditional1006+T.remainingAdditional1006)===T.uncoveredAdditional);
  check('Transport contract plus arrived allowance equals Costs',r2(C.transport.charge+T.actualAdditional1006)===r2(m.charge.delivery));
  check('Transport invoice and revenue controls pass',Object.values(V.checks).every(Boolean)&&Object.values(H.invCheck).every(Boolean));
  check('Generator actual plus remaining equals total',r2(G.actual+G.remaining)===G.forecast);
  check('Generator branch amounts tie once',sum(G.byBranch,'actual')===G.actual&&sum(G.byBranch,'forecast')===G.forecast);
  const quoted=[];for(const [collection,docs]of Object.entries(S)){if(!docs||typeof docs!=='object')continue;for(const [id,value]of Object.entries(docs)){if(JSON.stringify(value).includes('27172'))quoted.push({collection,id,value});}}
  const snapshot={nativeVersion:SYNC.backend.readVersion821(),day:todayIso(),checks,errors,items,plan:{...plan,byLine:[...plan.byLine],byBranch:[...plan.byBranch]},money:m,ticks,bill,pl,finance:f,branches,branchRows:pl752Rows(),oct,sep,ties,transport:T,transportView:V,transportHandover:H,contractFigures:C,generators:{...G,contracts:[...G.contracts]},scope,scopeBranches:scopeBranchAllocation978(),labour,labourRows,quote27172:quoted,peeHire:peeHireForecast979(),contracts:ONHIRE_ROWS};
  return JSON.parse(JSON.stringify(snapshot,(key,value)=>value instanceof Map?[...value]:value instanceof Set?[...value]:value));
 }));
 const hash=process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):await h.page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await(await fetch('/v/Coates-GC500-2026',{cache:'no-store'})).arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join(''));
 result.checks.push({name:'No browser errors or live writes',pass:!h.errors.length&&!h.counts.blocked});
 const detail={author:'Andrew Fisher',at:new Date().toISOString(),sha256:hash,...result,browserErrors:h.errors,requestCounts:h.counts};
 fs.writeFileSync(path.join(out,'coverage-snapshot.json'),JSON.stringify(detail,null,2)+'\n');
 const summary={author:detail.author,at:detail.at,sha256:hash,nativeVersion:detail.nativeVersion,items:detail.items.length,arrivedItemGroups:detail.items.filter(i=>i.received>0).length,checks:detail.checks,modelErrors:detail.errors,browserErrors:h.errors,liveWrites:h.counts.blocked};
 fs.mkdirSync(path.join(__dirname,'evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'evidence','coverage-controls.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify(summary));if(detail.errors.length||detail.checks.some(r=>!r.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
