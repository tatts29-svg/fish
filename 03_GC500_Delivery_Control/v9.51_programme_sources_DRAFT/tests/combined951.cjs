/* Author: Andrew Fisher. Read-only final workbook integration proof. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require('../../v9.48_explorer_card_LIVE/tests/strict948.cjs');
const out=process.env.OUT951,expectedCents=Number(process.env.EXPECTED_REHIRE_TOTAL_CENTS);assert(out&&process.env.PAGE&&Number.isFinite(expectedCents));fs.mkdirSync(out,{recursive:true});
(async()=>{const results=[];for(const width of [390,1440]){
 const s=await open({pageFile:process.env.PAGE,W:width,H:width===390?844:1000,mobile:width===390}),p=s.page;
 try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&typeof Source949!=='undefined'&&GC500Refresh904.report().settled,null,{timeout:120000});
 await p.evaluate(()=>go('costs'));
 const before=await p.evaluate(()=>{(SYNC.unsub||[]).forEach(f=>f());SYNC.unsub=[];return JSON.stringify(S);});
 const result=await p.evaluate(()=>holdAssets(()=>({source:DATA.rental_on_hire.source_sha256,contractRows:ONHIRE_ROWS.length,supplier:Source949.model().map(f=>({id:f.id,total:f.total,estimate:f.estimate,units:f.units,qty:f.quantity,daily:f.daily})),ties:recon888Model().ties,arrival:arrival943Model().artifactCurrent,infra:DATA.infrastructure_review951.rows.map(r=>r.reference),fenceSource:DATA.fencing.source_sha256,schedule:DATA.schedule_review950.sha256})));
 fs.writeFileSync(path.join(out,'initial-'+width+'.json'),JSON.stringify(result,null,2));
 assert.equal(result.source,'eb4a224fadbe1350d031adf8a1b12760d3dd748a2f0643119ea103d1df9b5b21');assert.equal(result.contractRows,320);assert.equal(result.supplier.length,9);assert.equal(Math.round(result.supplier.reduce((sum,f)=>sum+f.total,0)*100),expectedCents);assert(result.ties.every(t=>t.ok));assert.equal(result.infra.length,12);assert(result.arrival);
 assert.equal(result.fenceSource,'836a3e1036c660caa89b1b36d4b821e2f84df7a8d8b977068b13a4f07602d9db');
 for(const ref of result.infra){await p.evaluate(ref=>holdAssets(()=>openAsset(ref)),ref);assert.equal(await p.locator('#drawer.on [data-infrastructure951]').count(),1);assert.equal(await p.locator('#drawer.on [data-infrastructure951]').evaluate(x=>x.open),false);await p.locator('#dclose').click();}
 await p.evaluate(()=>holdAssets(()=>openAsset('P45')));const fold=p.locator('#drawer [data-infrastructure951]');await fold.locator('summary').click();const words=await fold.innerText();assert(words.includes('12 Oct 2026')&&words.includes('12 Oct 2025'));assert(!words.includes('46307')&&!words.includes('45942'));await fold.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'infrastructure-'+width+'.png')});await p.locator('#dclose').click();
 await p.evaluate(()=>go('fencing'));assert.equal(await p.locator('.fp-working #fencing-source951').count(),1);await p.locator('#fencing-source951 > summary').click();await p.locator('#fencing-source951').scrollIntoViewIfNeeded();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await p.screenshot({path:path.join(out,'fencing-'+width+'.png')});
 await p.evaluate(()=>go('costs'));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));await p.screenshot({path:path.join(out,'costs-'+width+'.png')});
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),before,'Read-only checks preserve native state');assert.deepEqual(s.errors,[]);assert((s.counts.blockedPaths||[]).every(r=>r.method==='POST'&&r.origin==='https://tile.googleapis.com'&&r.path==='/v1/createSession'));
 result.width=width;result.errors=0;result.writes=0;result.recordUnchanged=true;results.push(result);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('PASS combined workbook '+width);
 }finally{await s.browser.close();}
}})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack);console.error('Combined workbook proof failed; inspect private failure.txt');process.exitCode=1;});
