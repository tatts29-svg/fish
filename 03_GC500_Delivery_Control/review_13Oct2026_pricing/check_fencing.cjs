// Author: Andrew Fisher. Read-only confirmation of race-weekend fencing charges.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page'));
(async()=>{let h;try{
 h=await open({hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S),scope=scopeFigures(),fence=scope.lines.find(l=>l.key==='fence'),money=moneySummary(),pl=pl770Model(),allocation=scopeBranchAllocation978();
  return {nativeVersion:SYNC.backend.readVersion821(),fence,allocation,plChecks:pl.checks,revenueTotalsMatch:Math.abs(pl.revNow-money.charge.total)<.005,nativeStateUnchanged:before===JSON.stringify(S),hoursOverrides:Object.fromEntries(Object.entries(S.eventHours||{}).filter(([k])=>k.includes('fence')||k.startsWith('scope-time:'))),rateOverride:(S.rates||{})['scope-rate:fence']??null};
 }));
 assert.equal(result.fence.rate,88.49);
 assert.equal(result.fence.days.length,3);
 for(const d of result.fence.days)assert.equal(d.people,6);
 assert.equal(result.nativeStateUnchanged,true);
 assert.equal(result.revenueTotalsMatch,true);
 assert.ok(Object.values(result.plChecks).every(x=>x!==false));
 assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);
 const summary={author:'Andrew Fisher',checkedAt:new Date().toISOString(),...result,errors:h.errors,writes:h.counts.blocked};
 const out=process.env.OUT||'/tmp/gc500-fencing-race-review';fs.mkdirSync(out,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(out,'live-check.json'),JSON.stringify(summary,null,2)+'\n',{mode:0o600});
 console.log(JSON.stringify(summary));
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
