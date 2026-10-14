/* Author: Andrew Fisher. Supplier recursion, branch and edit regressions; service is GET-only. */
'use strict';
const fs=require('fs'),crypto=require('crypto');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
if(!process.env.PAGE||!process.env.OUT)throw Error('Candidate PAGE and private OUT required');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#costs'});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),originalState=clone(S),stateText=JSON.stringify(S),sourceText=JSON.stringify([PO_SRC,FCOM]),version=SYNC.backend.readVersion821();
  const original={supplierPricing1014,calculate:SupplierPo1014.calculate,costDocket,save775Inner,mayWrite,whoAmI,flash};
  const supplier=PO_SRC.supplier,dockets=FCOM.dockets,checks=[],cases=[];
  const check=(name,pass,detail)=>checks.push({name,pass:!!pass,...(pass?{}:{detail})});
  const reset=()=>{for(const k of Object.keys(S))delete S[k];Object.assign(S,clone(originalState));PO_SRC.supplier=supplier;FCOM.dockets=dockets;sharedCache975();};
  const round=n=>Math.round(n*100)/100;
  const legacyBranch=()=>{const current=costDocket;try{costDocket=supplierBaseDocket1014;return pl760FencingBranch();}finally{costDocket=current;}};
  function probe(fn,implementation=original.supplierPricing1014){
   const p={calls:0,maxDepth:0,rangeErrors:0,branches:[]};let depth=0;
   supplierPricing1014=function(){p.calls++;depth++;p.maxDepth=Math.max(p.maxDepth,depth);try{
    if(depth>8){p.rangeErrors++;throw new RangeError('Bounded regression recursion sentinel');}
    return implementation.apply(this,arguments);
   }finally{depth--;}};
   SupplierPo1014.calculate=function(orders,rows,expected){p.branches.push(expected.branch);return original.calculate.apply(this,arguments);};
   try{p.result=fn();}finally{supplierPricing1014=original.supplierPricing1014;SupplierPo1014.calculate=original.calculate;}
   return p;
  }
  try{
   // Prevent persistence while retaining the real Save cache-invalidating wrappers.
   save775Inner=()=>true;mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher';flash=()=>{};
   for(const mode of ['normal','blank branch','blank branch no dockets','normal no dockets','blank branch nothing to price']){
    reset();if(mode.startsWith('blank'))PO_SRC.supplier={...supplier,branch_code:''};
    if(mode.includes('no dockets')){FCOM.dockets=[];S.fenceDockets=[];}
    if(mode.includes('nothing to price')){FCOM.dockets=[{id:'AUDIT-EMPTY',docket_no:'AUDIT-EMPTY',date:todayIso(),usable:true,quantities:{},recorded_by:'Andrew Fisher'}];S.fenceDockets=[];}
    const expected=legacyBranch();sharedCache975();
    const p=probe(()=>supplierPricing1014());cases.push({mode,expected,calls:p.calls,maxDepth:p.maxDepth,rangeErrors:p.rangeErrors,branches:p.branches});
    check(mode+' retains previous branch semantics',p.branches.length===1&&p.branches[0]===expected);
    check(mode+' initial supplier lookup does not recurse',p.maxDepth===1&&p.rangeErrors===0);
    if(mode==='blank branch')check('priced missing branch stays explicitly unknown',expected==='no branch');
    if(mode.includes('no dockets')||mode.includes('nothing to price'))check(mode+' retains existing empty-ledger fallback',expected==='STPS');
   }
   reset();
   const priced=supplierPricing1014(),normalDockets=allDockets(),baseCosts=allCosts(supplierBaseDocket1014),defaultCosts=allCosts();
   const approved=[...priced.records.values()].filter(r=>r.book==='red'),overlays=approved.map(r=>({r,d:normalDockets.find(d=>d.id===r.id)}));
   check('fixture includes approved supplier docket overlays',overlays.length>0);
   check('default docket readers retain approved supplier prices',overlays.every(({r,d})=>d&&d.supplier_po===r.po&&d.supplier_branch===r.branch&&d.paid_total===r.amount));
   check('base-pricer path preserves every customer charge line',JSON.stringify(baseCosts)===JSON.stringify(defaultCosts));
   check('base-pricer branch path has no supplier overlay',allDockets(supplierBaseDocket1014).every(d=>!d.supplier_po));
   const p=probe(()=>({dockets:allDockets().length,costs:allCosts().length}));
   check('ordinary readers stay nonrecursive',p.maxDepth<=1&&p.rangeErrors===0);
   // A negative control restores just the old recursive edge. A bounded sentinel
   // makes the swallowed overflow observable without exhausting the browser stack.
   const fixed='branch:pl760FencingBranch(allCosts(supplierBaseDocket1014))',old='branch:pl760FencingBranch()',source=original.supplierPricing1014.toString();
   check('negative control targets the exact corrected call edge',source.split(fixed).length===2);
   if(source.split(fixed).length===2){
    window.eval('supplierPricing1014 = ('+source.replace(fixed,old)+');');const prior=supplierPricing1014;sharedCache975();
    const bad=probe(()=>supplierPricing1014(),prior);cases.push({mode:'old recursive edge',calls:bad.calls,maxDepth:bad.maxDepth,rangeErrors:bad.rangeErrors});
    check('negative control reproduces swallowed recursion',bad.maxDepth>1&&bad.rangeErrors>0);
   }
   reset();const clean=supplierPricing1014(),sample=[...clean.records.values()].find(r=>r.book==='red'),docket=allDockets().find(d=>d.id===sample.id),line=docket.lines.find(l=>Number.isFinite(l.rate)&&l.qty>0);
   check('rate refresh fixture has a priced customer line',!!line);
   if(line){
    const before=supplierPricing1014(),nextRate=line.rate+1.25,expected=round(docket.cost_total-round(line.qty*line.rate)+round(line.qty*nextRate));
    S.fenceRates={...S.fenceRates,[line.column]:String(nextRate)};stampIt('fenceRates',line.column,'Andrew Fisher');save();
    const fresh=supplierPricing1014(),next=allDockets().find(d=>d.id===docket.id);
    check('native Save invalidates supplier projection after rate edit',fresh!==before);
    check('rate edit updates customer docket arithmetic',next.cost_total===expected);
    check('customer rate edit retains separate approved supplier amount',next.paid_total===docket.paid_total&&next.supplier_po===docket.supplier_po);
   }
   reset();const before=supplierPricing1014(),order=before.orders.find(o=>o.valid),po=poOf(order.number),amount=Number(po.amount);
   check('P/O refresh fixture is a valid priced order',!!order&&Number.isFinite(amount));
   setPo(order.number,{amount:amount+1});
   const after=supplierPricing1014(),changed=after.orders.find(o=>o.number===order.number);
   check('native P/O edit invalidates supplier projection',after!==before);
   check('P/O amount edit recalculates exact variance',changed.difference===round(order.difference-1));
   check('P/O amount edit does not create or alter docket costs',changed.total===order.total&&changed.valid===order.valid);
  }finally{reset();supplierPricing1014=original.supplierPricing1014;SupplierPo1014.calculate=original.calculate;costDocket=original.costDocket;save775Inner=original.save775Inner;mayWrite=original.mayWrite;whoAmI=original.whoAmI;flash=original.flash;sharedCache975();}
  check('native record restored exactly',stateText===JSON.stringify(S));
  check('source supplier and dockets restored exactly',sourceText===JSON.stringify([PO_SRC,FCOM]));
  check('service version unchanged',version===SYNC.backend.readVersion821());
  return {author:'Andrew Fisher',nativeVersion:version,checks,cases};
 });
 result.errors=h.errors;result.requests=h.counts;result.pageSha=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
 result.checks.push({name:'zero browser errors or operational writes',pass:!h.errors.length&&!h.counts.blocked});
 fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(c=>!c.pass),errors:h.errors,requests:h.counts,pageSha:result.pageSha}));
 if(result.checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
