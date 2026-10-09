// Author: Andrew Fisher. Read-only presentation and unchanged-model checks.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const source=path.resolve(__dirname,'../pnl_clarity981.js');
async function capture(p){return p.evaluate(()=>{RENDER_MEMO.clear();return holdAssets(()=>({native:JSON.stringify(S),models:JSON.stringify({pl752:pl752Rows(),ticks:pl760Ticks(),pl770:pl770Model(),rehire:rh766Model(),cj:cj764Model(),finance:fh866Model(),money:moneySummary(),fenceSplit:fencePaidSplit(),fence:fenceDerived(),green:greenBookTotals(),source949:Source949.model(),supplierCosts:ourCosts(),contracts:ONHIRE_ROWS,ties:recon888Model(),scope961:supplierScope961(),onsite:onsiteComplete979(),branch:branchFinancial978(pl752Rows(),moneySummary())})}));});}
(async()=>{const mobile=process.env.MOB==='1',h=await open({pageFile:process.env.PAGE,hash:'#costs',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1}),p=h.page;let count=0;const check=(ok,message)=>{assert(ok,message);count++;};try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
 const before=await capture(p);
 if(process.env.INJECT==='1')await p.addScriptTag({content:fs.readFileSync(source,'utf8')});
 await p.evaluate(()=>{state.financeView857='summary';go('costs');});await p.waitForTimeout(500);
 check(await p.locator('#pane-costs [data-pnl981]').count()===1,'One primary P&L');
 check(await p.locator('#pane-costs #costs765').count()===0,'Redundant glance removed');
 let summary=await p.locator('#pane-costs').innerText();
 check(!summary.includes('Where the job stands on money'),'No repeated money story');
 check(!summary.includes('Labour — what we charge'),'No expanded repeated labour summary');
 check(!summary.includes('Provisional contribution'),'Settled difference terminology');
 check(summary.includes('Installation & cleaning Revenue')&&summary.includes('Transport Revenue'),'Onsite charge categories');
 check(summary.includes('rate / allocation holds'),'Onsite source holds remain visible');
 check(summary.includes('labour hours unpriced'),'Unpriced labour remains visible');
 const match=await p.evaluate(()=>{const P=pl770Model(),B=branchFinancial978(pl752Rows(),moneySummary()),el=document.querySelector('[data-pnl981-resultcard]');return el.innerText.includes(money(B.total.contribution))&&el.innerText.includes(money(B.total.contributionJob))&&B.total.contribution===Math.round((P.revNow-P.costNow-P.wages.toDate)*100)/100;});
 check(match,'Primary difference includes priced wages and matches branches');
 check(await p.locator('[data-pnl981-fold="branch"]').evaluate(d=>!d.open),'Branch detail initially closed');
 const revenue=await p.evaluate(()=>money(pl770Model().revNow));
 check(summary.split(revenue).length-1===1,'Recorded Revenue occurs once by default');
 await p.locator('[data-pnl981-fold="branch"] > summary').click();
 check(await p.locator('[data-branch978]').isVisible(),'Branch rows open in one click');
 await p.evaluate(()=>renderCosts());
 check(await p.locator('[data-pnl981-fold="branch"]').evaluate(d=>d.open),'Branch disclosure survives redraw');
 await p.locator('[data-pnl981-fold="branch"] > summary').click();
 await p.locator('[data-pnl981-fold="labour"] > summary').click();
 check(await p.locator('#labour865').isVisible(),'Labour source retained');
 check(await p.locator('#labour865 .fin745-metrics').count()===0,'Repeated labour headline tiles removed');
 await p.locator('[data-pnl981-fold="labour"] > summary').click();
 if(process.env.OUTDIR){fs.mkdirSync(process.env.OUTDIR,{recursive:true});await p.locator('[data-pnl981]').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.OUTDIR,(mobile?'phone':'desktop')+'-pnl981.png')});}
 await p.locator('[data-finance857="handover"]').click();await p.waitForTimeout(350);
 check(await p.locator('#handover866').count()===1,'Finance handover remains accessible');
 const handover=await p.locator('#handover866').innerText();
 check(!handover.includes('Each figure is a cut'),'Repeated Finance explanation removed');
 const financeIdentity=await p.evaluate(()=>{const blocks=[...document.querySelectorAll('#handover866 > .fin745-block')],rows=[...blocks[1].querySelector('.fin745-table').querySelectorAll('tbody > tr')],H=fh866Model();return H.costs.map((r,i)=>({stream:r.stream,text:rows[i].children[0].innerText,po:rows[i].children[1].innerText}));});
 check(financeIdentity.filter(r=>r.stream==='Rehire').every(r=>r.text!=='Rehire'),'Distinct Rehire source identities visible');
 check(financeIdentity.filter(r=>r.stream==='Salary allowance').every(r=>r.po==='—'),'Salary allowance has no unrelated Job Connect PO');
 check(!handover.includes('Inside the costs above, not additional.'),'Finance basis prose folded');
 if(process.env.OUTDIR){await p.locator('#handover866').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(process.env.OUTDIR,(mobile?'phone':'desktop')+'-handover981.png')});}
 const after=await capture(p);check(before.native===after.native,'Native records unchanged');check(before.models===after.models,'All 17 source models unchanged');
 check(h.errors.length===0,'No page errors');check(h.counts.blocked===0,'No attempted operational writes');
 console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:count,mobile,injectedPreview:process.env.INJECT==='1',modelEquality:true,nativeEquality:true,errors:h.errors.length,writes:h.counts.blocked}));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exit(1)});
