/* Author: Andrew Fisher. Actual final unit projection, mutation and native invalidation checks. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');
const fetcher=require('../../toolchain/harness/curlfetch'),fetchBefore=fetcher.curlFetch;let practiceEdit=false;
fetcher.curlFetch=async function(url,...args){const r=await fetchBefore.call(this,url,...args);if(practiceEdit&&new URL(url).pathname==='/api/version'&&r.status===200)return {...r,body:JSON.stringify({...JSON.parse(r.body),level:'edit'})};return r;};
const{open}=require('../map/tests/readonly1018.cjs');const out=process.env.OUT_DIR;if(!out)throw Error('Private OUT_DIR required');fs.mkdirSync(out,{recursive:true});const report={author:'Andrew Fisher',pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex')};
(async()=>{let h;try{h=await open({pageFile:process.env.PAGE,W:1440,H:1000});const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});practiceEdit=true;
report.result=await p.evaluate(()=>{
 const before=JSON.stringify(S),version=SYNC.backend.readVersion821(),checks=[],ck=(name,pass,detail)=>checks.push({name,pass:!!pass,...detail?{detail}:{}});go('about');
 let reads=0;const original=VmsAssignment1016.model;VmsAssignment1016.model=function(){reads++;return original.apply(this,arguments);};
 const fixtureKey='unit925/practice-memo1018',prior=S.loads?.[fixtureKey],loadsBefore=S.loads,beforeState=JSON.parse(before);
 try{
  const parity=holdAssets(()=>allAssets().map(a=>{const plain=gcModel925(a,{loading:false,__uncached1018:true}),full=gcModel925(a,{__uncached1018:true}),cachedPlain=gcModel925(a,{loading:false}),cachedFull=gcModel925(a);return {ref:a.key,plain:JSON.stringify(plain)===JSON.stringify(cachedPlain),full:JSON.stringify(full)===JSON.stringify(cachedFull)};}));
  ck('All182 full and plain unit projections match uncached native calculation',parity.length===182&&parity.every(r=>r.plain&&r.full),{references:parity.length,failed:parity.filter(r=>!r.plain||!r.full)});
  const a=holdAssets(()=>assetOf('P33'));reads=0;
  holdAssets(()=>{
   const x=gcModel925(a,{loading:false}),y=gcModel925(a,{loading:false});ck('Actual internal memo reuses one source calculation',reads===1,{reads});
   ck('Every reader receives distinct mutable rows and arrays',x!==y&&x.rows!==y.rows&&x.rows.every((r,i)=>r!==y.rows[i]));ck('Cloned groups preserve row aliases',x.groups.every(g=>g.units.every(u=>x.rows.includes(u))));
   const expected=JSON.stringify(y);x.rows[0].label='Isolated test mutation';x.groups[0].units.length=0;ck('Returned graph mutation cannot alter another reader',JSON.stringify(gcModel925(a,{loading:false}))===expected);
   const n=reads;gcUnits925(a,{loading:false});ck('Closure-local gcUnits925 reuses the same native model',reads===n);
   const variant={...a,_bookingNumbers801:[]};gcModel925(variant,{loading:false});ck('Same-reference booking variants stay isolated by object',reads===n+1);
   const c=reads;gcModel925(a);ck('Loading-enabled model is separate',reads>c);const c2=reads;gcModel925(a,{loading:true});ck('Explicit true and default loading share their equivalent calculation',reads===c2);
   const c3=reads;gcModel925(a,{loading:false,__futureOption:true});gcModel925(a,{loading:false,__futureOption:true});ck('Unknown future options safely bypass memo',reads===c3+2);
  });const next=reads;holdAssets(()=>gcModel925(a,{loading:false}));ck('Next draw recalculates even the same asset object',reads===next+1);const outside=reads;gcModel925(a,{loading:false});gcModel925(a,{loading:false});ck('Outside a draw there is no retained answer',reads===outside+2);
  const fixture={kind:'unit925-record',ref:'P33',owner:'coates',assetNo:'PRACTICE-1018',nativeId:'practice-memo1018',item:chargeLines(a).find(l=>l.item).item,label:'Isolated test only',active:true};
  holdAssets(()=>{gcModel925(a,{loading:false});S.loads??={};S.loads[fixtureKey]=fixture;sharedCache975();ck('Shared native invalidation exposes newly received data immediately',gcModel925(a,{loading:false}).rows.some(r=>r.assetNo===fixture.assetNo));delete S.loads[fixtureKey];sharedCache975();ck('Shared native removal invalidates the same draw',!gcModel925(a,{loading:false}).rows.some(r=>r.assetNo===fixture.assetNo));});
  capability=()=> 'edit';canEdit=()=>true;mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';window.__memo1018Captured=[];SYNC.db.doc=p=>({set:body=>{__memo1018Captured.push({path:p,body});return new Promise(()=>{});},delete:()=>{__memo1018Captured.push({path:p,body:null});return new Promise(()=>{});}});
  holdAssets(()=>{gcModel925(a,{loading:false});S.loads[fixtureKey]=fixture;bump();ck('Native bump/save invalidates an already-held unit model',gcModel925(a,{loading:false}).rows.some(r=>r.assetNo===fixture.assetNo));});
 }finally{VmsAssignment1016.model=original;if(prior===undefined)delete S.loads?.[fixtureKey];else S.loads[fixtureKey]=prior;if(loadsBefore===undefined)delete S.loads;for(const k of ['saved','changes']){if(Object.hasOwn(beforeState,k))S[k]=beforeState[k];else delete S[k];}sharedCache975();}
 ck('All original native records restored exactly',JSON.stringify(S)===before&&SYNC.backend.readVersion821()===version,{changedKeys:[...new Set([...Object.keys(beforeState),...Object.keys(S)])].filter(k=>JSON.stringify(beforeState[k])!==JSON.stringify(S[k]))});
 return {checks,nativeVersion:version,captured:window.__memo1018Captured?.length||0};
});report.errors=h.errors;report.requests=h.counts;if(report.result.checks.some(c=>!c.pass)||h.errors.length||h.counts.blocked)process.exitCode=1;
}catch(e){report.failure=String(e.stack||e);process.exitCode=1;}finally{if(h)await h.browser.close();fs.writeFileSync(path.join(out,'unit-memo-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
