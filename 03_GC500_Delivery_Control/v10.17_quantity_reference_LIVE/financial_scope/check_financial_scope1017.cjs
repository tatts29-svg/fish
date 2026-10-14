/* Author: Andrew Fisher. In-memory quantity, receipt and rate regression; every service write is blocked. */
'use strict';const fs=require('fs');const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs'});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const out=await h.page.evaluate(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),original=clone(S),saved=JSON.stringify(S),source=JSON.stringify(ONHIRE_ROWS),version=SYNC.backend.readVersion821();
  const previous={save,bump,mayWrite,whoAmI,flash},checks=[],cases=[],equal=(a,b)=>Math.round(a*100)===Math.round(b*100),cents=n=>Math.round((n+Number.EPSILON)*100)/100;
  const check=(name,pass,detail)=>checks.push({name,pass:!!pass,...(pass?{}:{detail})});
  const reset=()=>{for(const k of Object.keys(S))delete S[k];Object.assign(S,clone(original));sharedCache975();};
  const take=(ref,item)=>holdAssets(()=>{
   const a=assetOf(ref),contracts=ItemIdentity979.select(ref,item,ONHIRE_ROWS,gcModel925(a).rows),r=contracts[0],M=moneySummary(),P=pl770Model(),R=rh766Model();
   const parsed=document.createElement('table');parsed.innerHTML=itemChargesHtml979(a,item);const hireCells=[...parsed.querySelectorAll('[data-item979]')][0]?.textContent;
   const hire=ItemCharges979.project(ref,item,contracts,contractCharge,cardRate(a.discipline,item,ref).labour_per_piece,[]);
   return clone({ref,item,hire,hireCells,scope:toiletItem962(a,item,deliveryOf(ref),todayIso()),contract:r,charge:contractCharge(r),owner:finance928ContractOwner(r),M,P,job:cj764Model(),branches:branchFinancial978(pl752Rows(),M),R,planned:ScopeFinance1017.model(),forecast:pricingForecast1010(),supplier:Supplier996.model(),onsite:onsiteComplete979().rows.filter(x=>x.ref===ref)});
  });
  const balanced=x=>Object.values(x.P.checks).every(Boolean)&&Object.values(x.branches.checks).every(Boolean);
  const ledger=(x,key,field)=>x.P.rev.find(r=>r.key===key)[field];
  try{
   save=()=>{sharedCache975();return true;};bump=()=>save();mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';flash=()=>{};
   for(const target of [6,10]){
    reset();const b=take('WC09','FWF'),unit=b.contract.rate_1;setQty('WC09',String(target));const p=take('WC09','FWF'),extra=cents(unit*(target-b.scope.arrived));cases.push({target,b,p});
    check(target+' actual total unchanged',equal(p.M.charge.total,b.M.charge.total));
    check(target+' current contract hire only received quantity',equal(p.charge.amount,b.charge.amount)&&p.charge.billableQuantity1010===4);
    check(target+' supplier baseline atomically retained',Scope1017.record('WC09').items.find(r=>r.item==='FWF').financial1017.identified===4);
    check(target+' supplier ownership retained',p.owner.rehire&&p.owner.owner===b.owner.owner);
    check(target+' current Hire and Rehire ledgers unchanged',['hire','rehire'].every(k=>equal(ledger(p,k,'now'),ledger(b,k,'now'))));
    check(target+' future hire stays in Rehire ledger',equal(ledger(p,'rehire','job')-ledger(b,'rehire','job'),extra)&&equal(ledger(p,'hire','job'),ledger(b,'hire','job')));
    check(target+' drawer hire displays received quantity and matching rate',p.hire.lines.length===1&&p.hire.lines[0].quantity===4&&equal(p.hire.lines[0].amount/4,unit)&&p.hireCells.includes(chargeRateDisplay977(p.hire.lines[0].amount/4)));
    check(target+' exact source rate and forecast amount',p.planned.rows.length===1&&p.planned.rows[0].rate===unit&&equal(p.planned.total,extra)&&p.planned.rows[0].quantity===target-4);
    const bg=b.R.groups.find(g=>g.what==='Toilets — Event Portables'),pg=p.R.groups.find(g=>g.what==='Toilets — Event Portables');
    check(target+' supplier forecast agrees once',equal(pg.rev,bg.rev)&&equal(pg.revToCome-bg.revToCome,extra)&&equal(pg.revJob-bg.revJob,extra));
    check(target+' no added supplier cost',equal(p.M.cost.known,b.M.cost.known)&&equal(pg.costJob,bg.costJob));
    check(target+' central P&L and branch sums reconcile',balanced(p));
    check(target+' mixed item received charges unchanged',JSON.stringify(p.onsite.filter(x=>x.item!=='FWF'))===JSON.stringify(b.onsite.filter(x=>x.item!=='FWF')));
    check(target+' branch forecast allocated to existing branch',p.planned.rows[0].branch===generatorBranch1004(b.contract));
    setSupplied('WC09','FWF',{qty_supplied:target});S.stamps['supplied/WC09/FWF']=new Date(Date.now()+2000).toISOString();sharedCache975();const a=take('WC09','FWF');cases.push({target,received:a});
    check(target+' explicit receipt moves only hire from forecast to actual',a.scope.arrived===target&&equal(a.charge.amount-b.charge.amount,extra)&&a.planned.total===0);
    check(target+' drawer follows subsequent received quantity',a.hire.lines[0].quantity===target&&equal(a.hire.lines[0].amount/target,unit));
    check(target+' explicit receipt retains supplier ledger',a.owner.owner===b.owner.owner&&equal(ledger(a,'rehire','now')-ledger(b,'rehire','now'),extra)&&equal(ledger(a,'hire','now'),ledger(b,'hire','now')));
    check(target+' explicit receipt keeps existing job hire total',equal(ledger(a,'rehire','job'),ledger(p,'rehire','job'))&&balanced(a));
    check(target+' explicit receipt does not mark extra work complete',a.scope.done===b.scope.done);
   }
   reset();delete S.delivery.WC09;delete S.supplied.WC09;S.labour={};sharedCache975();const nb=take('WC09','FWF');setQty('WC09','6');const np=take('WC09','FWF');check('no-receipt planning edit creates no actual hire',np.scope.arrived===0&&np.charge.amount===0&&np.M.charge.total<=nb.M.charge.total&&balanced(np));
   reset();const wb=take('WC09','FWF');setQty('WC09','6');setQty('WC09','10');setQty('WC09','6');const wr=take('WC09','FWF');
   check('repeated planned edits keep actual charge and owner',equal(wr.charge.amount,wb.charge.amount)&&wr.owner.owner===wb.owner.owner);
   check('repeated planned edits keep remaining hire once',equal(wr.planned.total,2*wb.contract.rate_1)&&balanced(wr));
   reset();const pb=take('P33','Building 9.6m');setQty('P33','2');const pp=take('P33','Building 9.6m');cases.push({genericBefore:pb,genericPlanned:pp});
   check('building planned unit does not increase actual',equal(pp.M.charge.total,pb.M.charge.total)&&equal(pp.charge.amount,pb.charge.amount)&&pp.scope.arrived===1);
   check('building remaining whole-event hire is forecast once',equal(ledger(pp,'hire','job')-ledger(pb,'hire','job'),pb.charge.amount)&&equal(pp.planned.total,pb.charge.amount));
   check('building retains Coates ledger and balanced branch totals',!pp.owner.rehire&&balanced(pp));
   setSupplied('P33','Building 9.6m',{qty_supplied:2});S.stamps['supplied/P33/Building 9.6m']=new Date(Date.now()+2000).toISOString();sharedCache975();const pa=take('P33','Building 9.6m');
   check('building drawer hire follows actual quantity and rate',pp.hire.lines[0].quantity===1&&pa.hire.lines[0].quantity===2&&equal(pa.hire.lines[0].amount/2,pb.charge.amount));
   check('building later receipt moves existing whole-event price to actual',pa.scope.arrived===2&&equal(pa.charge.amount,pb.charge.amount*2)&&pa.planned.total===0&&balanced(pa));
   const stepsBefore=charge1006(assetOf('P33'),chargeLines(assetOf('P33'))[0]).rows.find(r=>r.key==='steps').qty;setQty('P33','3');const stepsAfter=charge1006(assetOf('P33'),chargeLines(assetOf('P33'))[0]).rows.find(r=>r.key==='steps').qty;check('repeated planning preserves manually selected stairs after new receipts',stepsBefore===1&&stepsAfter===stepsBefore);
   reset();setQty('WC09','6');const br=take('WC09','FWF').planned.rows[0];S.branch={...S.branch,WC09:'TEST'};sharedCache975();const bp=take('WC09','FWF');
   check('planned revenue follows edited branch',bp.planned.rows[0].branch==='TEST'&&balanced(bp));
   reset();const row=ONHIRE_ROWS.find(r=>String(r.rental_contract)==='9968955'&&Number(r.line)===102),oldRate=row.rate_1;
   try{row.rate_1=123.4567;sharedCache975();const rb=take('WC09','FWF');setQty('WC09','6');const rp=take('WC09','FWF');
    check('fractional source rate rounds extended totals once',equal(rp.charge.forecast,cents(6*row.rate_1))&&equal(rp.charge.amount,cents(4*row.rate_1))&&equal(rp.planned.total,cents(6*row.rate_1)-cents(4*row.rate_1)));
    check('rate changes propagate without changing quantities',rp.scope.arrived===4&&rp.scope.quantity===6&&balanced(rp));
   }finally{row.rate_1=oldRate;reset();}
   const generatorBefore=clone(generatorModel1004());setQty('GN06',String(qtyOf(chargeLines(assetOf('GN06'))[0])+1));
   check('date-sensitive generator excluded from whole-event extension',ScopeFinance1017.model().rows.every(r=>r.ref!=='GN06'));
   const generatorAfter=clone(generatorModel1004());cases.push({generatorBefore,generatorAfter});check('generator actual hire does not grow with planned scope',equal(generatorBefore.actual,generatorAfter.actual));check('extra generator scope has explicit allocation hold',generatorAfter.unpriced.some(r=>r.ref==='GN06'&&r.issues.includes('Contract quantity needs allocation')));
  }finally{reset();Object.assign(window,previous);}
  check('native record restored exactly',JSON.stringify(S)===saved);check('all source contracts and rates restored',JSON.stringify(ONHIRE_ROWS)===source);check('service version unchanged',version===SYNC.backend.readVersion821());
  return {author:'Andrew Fisher',checks,cases,version};
 });
 out.errors=h.errors;out.requests=h.counts;out.checks.push({name:'zero errors or operational write attempts',pass:!h.errors.length&&!h.counts.blocked});fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({checks:out.checks.length,failures:out.checks.filter(x=>!x.pass),errors:h.errors,requests:h.counts}));if(out.checks.some(x=>!x.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
