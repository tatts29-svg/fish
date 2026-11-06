/* Author: Andrew Fisher. Read-only old/new model comparison; no private records are printed. */
'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const {open}=require('../../toolchain/harness/open_page');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function capture(pageFile){
 const s=await open({pageFile,W:1440,H:900});
 try{
  await s.page.waitForFunction(()=>typeof holdAssets==='function'&&typeof gcModel925==='function');
  await s.page.waitForTimeout(3000);
  const data=await s.page.evaluate(()=>holdAssets(()=>({
   source:S,
   assets:allAssets().map(a=>({ref:a.key,units:gcModel925(a),charges:chargeLines(a),rental:rentalOf(a.key),complete:gc500IsComplete897(a.key)})),
   complete:gc500CompleteKeys897(),costs:allCosts(),labour:labourPlan(),finance:fin745Rows(todayIso())
  })));
  assert.deepEqual(s.errors,[],'browser errors');
  assert.equal(s.counts.blocked,0,'unexpected attempted writes');
  return data;
 }finally{await s.browser.close();}
}
(async()=>{
 assert.ok(process.env.BASE&&process.env.PAGE,'BASE and PAGE are required');
 const before=await capture(process.env.BASE),after=await capture(process.env.PAGE);
 assert.equal(digest(before.source),digest(after.source),'live source changed between reads; repeat using an unchanged record');
 for(const key of ['assets','complete','costs','labour','finance'])assert.equal(digest(after[key]),digest(before[key]),key+' changed');
 console.log('PASS live parity: every asset model, charge line, rental line, completion key, cost, labour projection and finance row matches; source unchanged; no writes.');
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});
