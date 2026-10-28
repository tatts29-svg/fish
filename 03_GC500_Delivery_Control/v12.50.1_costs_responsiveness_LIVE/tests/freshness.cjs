/* Author: Andrew Fisher. Native hold lifecycle controls; in-memory changes only, HTTP writes denied. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 assert(process.env.BASE&&process.env.PAGE&&process.env.STATE&&process.env.OUT);
 const base=fs.readFileSync(process.env.BASE,'utf8');
 assert.equal(sha(base),'7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404');
 const start=base.indexOf('function pl760Ticks(){'),end=base.indexOf('\n/* the By branch table',start);
 assert(start>=0&&end>start);const originalSource=base.slice(start,end);
 const branchStart=base.indexOf(' function branchFinancial978(B,M){'),branchEnd=base.indexOf('\n window.branchFinancial978=',branchStart);
 const financeStart=base.indexOf(' fh866Model=function(){'),financeEnd=base.indexOf('\n };',financeStart);
 assert(branchStart>0&&branchEnd>branchStart&&financeStart>0&&financeEnd>financeStart);
 const source={ticks:originalSource,branch:base.slice(branchStart,branchEnd).trim(),finance:base.slice(financeStart,financeEnd+3).trim().replace(/^fh866Model=/,'').replace('branchFinancial978(','previousBranch(')};
 const s=await openCandidate();
 try{
  await s.page.clock.setFixedTime(new Date('2026-10-28T18:30:00.000Z'));
  const result=await s.page.evaluate(source=>{
   const previousBranch=eval('('+source.branch+')'),previousFinance=eval('('+source.finance+')');
   const original=(0,eval)('('+source.ticks+')'),key='pl760Ticks12501',checks=[];
   const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
   const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
   const docs=()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])));
   const before=docs(),fnBefore=pl760Ticks.toString(),saveBefore=save775Inner;
   check('starts outside an asset hold',ASSETS_HELD===null);
   const one=pl760Ticks(),two=pl760Ticks();
   check('standalone calls retain exact native results',same(one,original())&&same(two,original()));
   check('standalone results remain independent',one!==two&&one.byBranch!==two.byBranch);
   check('standalone calls retain no tick cache',!HELD_MEMO.has(key));
   holdAssets(()=>{
    const first=pl760Ticks(),cached=HELD_MEMO.get(key),second=pl760Ticks();
    check('unchanged held calls reuse one private aggregate',cached&&cached===HELD_MEMO.get(key));
    check('held calls return independent nested results',first!==cached&&first!==second&&first.byBranch!==cached.byBranch&&first.byBranch!==second.byBranch);
    check('held result equals original calculation',same(first,original()));
    const expected=JSON.stringify(first),br=Object.keys(first.byBranch)[0];
    first.total=-123;first.install.amount=-456;first.byBranch[br].install.amount=-789;
    if(first.fwf1244.source)first.fwf1244.source.push('in-memory isolation control');
    check('caller mutations cannot contaminate later results',JSON.stringify(pl760Ticks())===expected&&JSON.stringify(cached)===expected);
    const sentinel={invalid:'argument control'};HELD_MEMO.set(key,sentinel);
    check('extra arguments and receiver bypass reuse',same(pl760Ticks.call({sentinel:true},'extra',2),original())&&HELD_MEMO.get(key)===sentinel);
    HELD_MEMO.set(key,cached);
    const clone=window.structuredClone;
    try{window.structuredClone=undefined;HELD_MEMO.set(key,sentinel);check('missing native clone support calculates fresh',same(pl760Ticks(),original())&&HELD_MEMO.get(key)===sentinel);}
    finally{window.structuredClone=clone;HELD_MEMO.set(key,cached);}
    const savedLabour=S.labour;
    try{
     S.labour={};sharedCache975();
     const changed=pl760Ticks();check('received-record invalidation changes same-hold results',!same(changed,second)&&same(changed,original())&&HELD_MEMO.get(key)!==cached);
     S.labour=savedLabour;save775Inner=()=>undefined;save();
     check('local-save invalidation restores current same-hold results',same(pl760Ticks(),second)&&same(pl760Ticks(),original()));
    }finally{S.labour=savedLabour;save775Inner=saveBefore;sharedCache975();}
    const previous=pl760Ticks(),priorMemo=HELD_MEMO.get(key),priorAssets=ASSETS_HELD;
    const basis=DATA.charge_basis,hadMonth=Object.hasOwn(basis,'invoice_month'),savedMonth=basis.invoice_month;
    try{
     basis.invoice_month=savedMonth==='2026-11'?'2026-12':'2026-11';
     const changed=pl760Ticks();
     check('event configuration invalidates before same-task lookup',HELD_MEMO.get(key)!==priorMemo&&ASSETS_HELD!==priorAssets&&same(changed,original()));
    }finally{if(hadMonth)basis.invoice_month=savedMonth;else delete basis.invoice_month;EventConfig1013.current();}
    check('restored configuration returns native result',same(pl760Ticks(),previous));
    const source=ONHIRE_ROWS.find(r=>String(r.rental_contract)+'|'+r.line==='9968955|146'),quantity=source.quantity;
    try{
     source.quantity=quantity+1;sharedCache975();
     let nativeError,candidateError;try{original();}catch(e){nativeError=e.message;}try{pl760Ticks();}catch(e){candidateError=e.message;}
     check('native source validation throws remain visible',!!nativeError&&candidateError===nativeError&&!HELD_MEMO.has(key));
    }finally{source.quantity=quantity;sharedCache975();}
    check('failed calculations do not poison later reads',same(pl760Ticks(),original())&&same(pl760Ticks(),previous));
    const outer=HELD_MEMO.get(key);holdAssets(()=>check('nested holds retain outer unchanged cache',same(pl760Ticks(),previous)&&HELD_MEMO.get(key)===outer));
   });
   check('hold exit releases cached tick result',ASSETS_HELD===null&&!HELD_MEMO.has(key));
   try{holdAssets(()=>{pl760Ticks();throw Error('intentional held-exit control');});}catch(e){check('intentional exception propagated',e.message==='intentional held-exit control');}
   check('exception exit releases cached tick result',ASSETS_HELD===null&&!HELD_MEMO.has(key));
   check('Finance helper is present on this candidate',typeof branchProjection12501==='function');
   holdAssets(()=>{
    const B=pl752Rows(),M=moneySummary(),H=legacyFinance978(),savedH=JSON.stringify(H);
    check('public native branch reads retain complete output and ignore extra arguments',same(branchFinancial978.call({test:true},B,M,{costs:[]}),previousBranch(B,M)));
    check('private Finance reuse retains original native branch projection',same(branchProjection12501(B,M,H),previousBranch(B,M)));
    check('private projection leaves Finance input untouched',JSON.stringify(H)===savedH);
    const before=previousFinance();
    check('native Finance output and every check remain exact',same(fh866Model(),before));
    const savedLabour=S.labour;
    try{S.labour={};sharedCache975();const changed=fh866Model();check('separate Finance calls observe changed native source',!same(changed,before)&&same(changed,previousFinance()));check('public branch calls observe changed native source',same(branchFinancial978(pl752Rows(),moneySummary()),previousBranch(pl752Rows(),moneySummary())));}
    finally{S.labour=savedLabour;sharedCache975();}
    const returned=fh866Model();returned.costs[0].by[Object.keys(returned.costs[0].by)[0]]=-1;
    check('Finance result mutation does not contaminate a later call',same(fh866Model(),previousFinance()));
   });
   check('reader and save implementation remain unchanged',pl760Ticks.toString()===fnBefore&&save775Inner===saveBefore);
   check('all native source documents restored byte for byte',docs()===before);
   return{checks,passed:checks.length,docsPreserved:true};
  },source);
  assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);
  Object.assign(result,{author:'Andrew Fisher',baseline:s.baseline,pageSha256:sha(fs.readFileSync(process.env.PAGE)),errors:s.errors,consoleErrors:s.consoleErrors,writes:s.counts.blocked});
  fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'freshness.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,checks:result.checks,errors:result.errors,consoleErrors:result.consoleErrors,writes:result.writes}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
