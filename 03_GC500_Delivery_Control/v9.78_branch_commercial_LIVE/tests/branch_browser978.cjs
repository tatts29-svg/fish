// Author: Andrew Fisher. Read-only branch/ledger/phone verification.
const fs=require('fs'),assert=require('assert/strict'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,hash:'#costs',mobile:true,W:390,H:844,dpr:1}),p=h.page;try{
await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
const r=await p.evaluate(()=>holdAssets(()=>{renderCosts();const before=JSON.stringify(S),a=JSON.stringify({p:pl770Model(),x:cj764Model(),h:fh866Model()}),b=branchFinancial978(pl752Rows(),moneySummary());renderCosts();const after=JSON.stringify({p:pl770Model(),x:cj764Model(),h:fh866Model()});return{branch:b,legacyExact:a===after,nativeExact:before===JSON.stringify(S),finance:fh866Model().costTotal.by,p:pl770Model().checks};}));
assert(r.legacyExact&&r.nativeExact);assert(!r.branch.rows.some(x=>x.code==='Shared job / allocation pending'),'All current figures allocated to branches');assert(Object.values(r.branch.checks).every(Boolean));assert(Object.values(r.p).every(Boolean));
for(const [code,job] of Object.entries(r.finance))assert.equal(r.branch.rows.find(x=>x.code===code).costJob,job);
const section=p.locator('[data-branch978]');assert.equal(await section.count(),1);await section.scrollIntoViewIfNeeded();await p.screenshot({path:process.env.OUTDIR+'/branches-phone.png'});const bounds=await section.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=391);assert(await section.locator('.branch978-mobile').isVisible());assert(!(await section.locator('.branch978-desktop').isVisible()));
assert(await p.locator('#pl770').innerText().then(t=>t.includes('Charges to V8 Supercars')));assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);
fs.writeFileSync(process.env.OUTDIR+'/branch-browser.json',JSON.stringify({author:'Andrew Fisher',pass:true,result:r,bounds,errors:h.errors,writes:h.counts.blocked},null,2));console.log(JSON.stringify({pass:true,branches:r.branch.rows.map(x=>x.code),checks:r.branch.checks}));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
