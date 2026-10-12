// Author: Andrew Fisher. Independent financial reconciliation and live-state propagation; no service writes.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const control=path.resolve(__dirname,'../..'),{open}=require(path.join(control,'toolchain/harness/open_page'));
const privateDir=process.env.FIXTURES||'/workspace/private-gc500-generators1004',out=process.env.OUT||privateDir;
const fixture=JSON.parse(fs.readFileSync(path.join(privateDir,'current.json'))),baseline=JSON.parse(fs.readFileSync(path.join(privateDir,'baseline-finance.json'))),oracle=JSON.parse(fs.readFileSync(path.join(privateDir,'numerical-baseline.json')));
(async()=>{let h;try{
 const mobile=process.env.MOB==='1';h=await open({pageFile:process.env.PAGE,hash:'#costs',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const result=await h.page.evaluate(({frozen,before,expected})=>{
  const original=S,checks=[],ok=(name,value)=>checks.push({name,pass:!!value}),r2=n=>Math.round((n+Number.EPSILON)*100)/100,same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const capture=()=>{sharedCache975();return holdAssets(()=>({generator:generatorModel1004(),money:moneySummary(),forecast:cj764Model(),pl:pl770Model(),branch:branchFinancial978(pl752Rows(),moneySummary()),handover:fh866Model(),onsite:onsiteComplete979(),monthSep:acc761Model('2026-09'),monthOct:acc761Model('2026-10'),contractRows:ONHIRE_ROWS.map(r=>({row:r,charge:contractCharge(r)})),assets:allAssets().filter(a=>a.discipline==='Generators').map(a=>({asset:a,span:chargeSpanOf(a),money:assetTotal(a)}))}));};
  const gen=r=>!r.charge_line&&(r.kind==='generator'||r.family==='generator'),totalOld=before.contractRows.filter(x=>gen(x.row)).reduce((n,x)=>n+(x.charge.amount||0),0);
  try{
   S=JSON.parse(JSON.stringify(frozen));const frozenText=JSON.stringify(S),after=capture(),G=after.generator;
   ok('Actual hire matches independent decimal oracle',G.actual===28196.40);
   ok('Remaining forecast matches independent decimal oracle',G.remaining===9333.73);
   ok('Standdown separately reconciles to independent calculation',G.standdownActual===21132.58&&G.standdownRemaining===3884.69&&G.standdown===25017.27&&r2(G.race+G.standdown)===G.forecast);
   ok('Total hire equals actual plus remaining forecast',G.forecast===37530.13&&r2(G.actual+G.remaining)===G.forecast);
   ok('18 active generators across 17 references/contracts',G.rows.length===17&&G.rows.reduce((n,r)=>n+r.qty,0)===18);
   ok('Nine confirmed arrivals and nine future units',G.rows.filter(r=>r.actualIsConfirmed).reduce((n,r)=>n+r.qty,0)===9&&G.rows.filter(r=>!r.actualIsConfirmed).reduce((n,r)=>n+r.qty,0)===9);
   for(const e of expected.rows){const g=G.rows.find(r=>r.id.startsWith(e.id));ok('Independent amount/date/quantity '+e.id,g&&g.forecast===Number(e.contractLineRounded)&&g.qty===e.qty&&(g.deliveredDate||g.plannedDate)===e.start&&g.standdownDays===e.standdownDays&&g.eventDays===e.raceDays);}
   ok('All known generator records priced',G.unpriced.length===0);
   ok('Corrected GN13 confirmed asset number only',same(G.rows.find(r=>r.ref==='GN13').assetNumbers,['1276503']));
   ok('Unconfirmed Concert and GN18 asset numbers omitted',G.rows.filter(r=>['GN?','GN18'].includes(r.ref)).every(r=>r.assetNumbers.length===0));
   ok('GN23 distribution board excluded from generator identity',!G.rows.find(r=>r.ref==='GN23').assetNumbers.includes('1189078'));
   ok('All off hire dates Sunday 25 October',G.rows.every(r=>r.offhire==='2026-10-25'));
   ok('Recorded Revenue replaces old generator charges once',r2(after.money.charge.total-before.money.charge.total)===r2(G.actual-totalOld));
   ok('Whole-job Revenue adds complete generator total once',r2(after.forecast.revenue.job-before.forecast.revenue.job)===r2(G.forecast-totalOld));
   ok('All Direct costs unchanged',same(after.money.cost,before.money.cost)&&after.pl.direct===before.pl.direct&&after.pl.directJob===before.pl.directJob);
   ok('P&L actual and forecast reconcile to shared totals',r2(after.pl.revNow-after.money.charge.total)===0&&r2(after.pl.revJob-after.forecast.revenue.job)===0&&Object.values(after.pl.checks).every(v=>v!==false));
   ok('Branch totals reconcile',Object.values(after.branch.checks).every(Boolean));
   ok('Finance handover reconciles',Object.values(after.handover.invCheck).every(Boolean));
   ok('Entire generator charge allocated to October invoice period',after.monthOct.revenue.filter(r=>r.stream.includes('generator October')).reduce((n,r)=>r2(n+r.amount),0)===G.forecast&&!after.monthSep.revenue.some(r=>r.stream.includes('generator October')));
   for(const prev of before.contractRows.filter(x=>!gen(x.row))){const next=after.contractRows.find(x=>x.row.rental_contract===prev.row.rental_contract&&x.row.line===prev.row.line);ok('Unrelated contract charge unchanged '+prev.row.rental_contract+':'+prev.row.line,same(next.charge,prev.charge));}
   for(const prev of before.assets){const next=after.assets.find(x=>x.asset.key===prev.asset.key);ok('Physical pickup and accessory/labour/transport unchanged '+prev.asset.key,same(next.asset.events,prev.asset.events)&&same(next.money.accessories,prev.money.accessories)&&same(next.money.labour,prev.money.labour)&&same(next.money.transport,prev.money.transport));}
   for(const g of G.rows.filter(r=>r.ref)){const a=after.assets.find(x=>x.asset.key===g.ref);ok('Reference hire equals generator total '+g.ref,a&&a.money.lines.some(l=>l.total===g.forecast||l.amount===g.forecast||l.t===g.forecast));}
   // A delivery correction must propagate without persisting a fixture.
   S.hireStart.GN13='2026-10-13';const dateEdit=capture(),d=1406.75-1494.68;
   ok('Delivery correction changes generator and recorded Revenue together',r2(dateEdit.generator.actual-G.actual)===r2(d)&&r2(dateEdit.money.charge.total-after.money.charge.total)===r2(d));
   ok('Delivery correction changes Costs/P&L/branch forecast together',r2(dateEdit.forecast.revenue.job-after.forecast.revenue.job)===r2(d)&&r2(dateEdit.pl.revJob-after.pl.revJob)===r2(d)&&r2(dateEdit.branch.total.revenueJob-after.branch.total.revenueJob)===r2(d));
   S=JSON.parse(frozenText);S.delivery.GN04={state:'on site',set_at:'2026-10-13T01:00:00.000Z',by:'Browser fixture',history:[]};S.assetNumbers.GN04=['999999'];const receipt=capture(),old=G.rows.find(r=>r.ref==='GN04'),arrived=receipt.generator.rows.find(r=>r.ref==='GN04');
   ok('Receipt moves forecast to actual using actual delivery date',arrived.actualIsConfirmed&&arrived.deliveredDate==='2026-10-13'&&arrived.actual===1132.27&&arrived.remaining===0&&same(arrived.assetNumbers,['999999']));
   ok('Receipt adjusts remaining forecast in every view',r2(receipt.generator.remaining-G.remaining)===-old.remaining&&r2(receipt.pl.rev.find(r=>r.key==='hire').job-after.pl.rev.find(r=>r.key==='hire').job)===r2(arrived.actual-old.remaining)&&Object.values(receipt.branch.checks).every(Boolean));
   S=JSON.parse(frozenText);S.lineRates['c|9961976|'+G.rows.find(r=>r.ref==='GN13').contractIds[0].split(':')[1]]=600;const rateEdit=capture(),rateRow=rateEdit.generator.rows.find(r=>r.ref==='GN13');
   ok('Legacy 3-day rate override becomes daily 200 without changing its unit',rateRow.dailyRate===200&&rateRow.actual===1700);
   ok('Rate edit propagates to P&L and reference charge',r2(rateEdit.pl.revNow-after.pl.revNow)===205.32&&rateEdit.assets.find(x=>x.asset.key==='GN13').money.lines.some(l=>l.total===1700||l.amount===1700||l.t===1700));
   S=JSON.parse(frozenText);S.branch.GN13='KINP';const branchEdit=capture();
   ok('Reference branch change moves actual Revenue to chosen branch',branchEdit.generator.rows.find(r=>r.ref==='GN13').branch==='KINP'&&r2(branchEdit.branch.rows.find(r=>r.code==='KINP').revenue-after.branch.rows.find(r=>r.code==='KINP').revenue)>=1494.68&&Object.values(branchEdit.branch.checks).every(Boolean));
   S=JSON.parse(frozenText);sharedCache975();const concert=assetOf('GN?'),pin=refLatLon(concert),master=gc500PlanItems().items.find(r=>r.key==='GN?');
   ok('Concert exact supplied coordinate drives navigation',pin.lat===-27.984576&&pin.lon===153.427700&&dest782(concert).kind==='confirmed');
   ok('Concert location links to Costs and master map',destinationOf(concert).text.includes('peacock')&&G.rows.find(r=>r.ref==='GN?').location.includes('peacock')&&master&&master.pt.every(Number.isFinite)&&DATA.sheets.find(r=>r.master).markers.filter(r=>r.ref==='GN?').length===1);
   S.fixes['GN?']={lat:-27.9846,lon:153.4278,at:'2026-10-13T00:00:00Z',by:'Browser fixture'};sharedCache975();const moved=refLatLon(assetOf('GN?')),movedMaster=gc500PlanItems().items.find(r=>r.key==='GN?');ok('Later native Concert pin updates navigation and master',moved.lat===-27.9846&&moved.lon===153.4278&&!same(movedMaster.pt,master.pt));
   S=JSON.parse(frozenText);const restored=capture();ok('Financial fixtures restore exactly',same(restored.money,after.money)&&same(restored.generator.rows,G.rows));ok('Native state unchanged by all read-only models',JSON.stringify(S)===frozenText);
   return {checks,diagnostics:{receiptRemainingDelta:r2(receipt.generator.remaining-G.remaining),receiptPLDelta:r2(receipt.pl.revJob-after.pl.revJob),receiptHireDelta:r2(receipt.pl.rev.find(r=>r.key==='hire').job-after.pl.rev.find(r=>r.key==='hire').job),expectedDelta:r2(arrived.actual-old.remaining),receiptBranchChecks:receipt.branch.checks},totals:{actual:G.actual,remaining:G.remaining,total:G.forecast,oldGenerator:totalOld},after};
  }finally{S=original;sharedCache975();}
 },{frozen:fixture.state,before:baseline,expected:oracle});
 await h.page.locator('[data-finance857="generators"]').first().click();await h.page.locator('#generators1004').waitFor();
 result.checks.push({name:'Generator subtab is selected',pass:await h.page.locator('[data-finance857="generators"]').getAttribute('aria-pressed')==='true'});
 result.checks.push({name:'Total charge visible per reference',pass:await h.page.locator('#generators1004 [data-l="Total charge"]').first().isVisible()});
 result.checks.push({name:'No horizontal page clipping',pass:await h.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)});
 fs.mkdirSync(out,{recursive:true});await h.page.locator('#generators1004').evaluate(e=>e.scrollIntoView({block:'start'}));await h.page.screenshot({path:path.join(out,'generators1004-'+(mobile?'phone':'desktop')+'.png'),fullPage:false});
 await h.page.locator('#generators1004 tbody tr').first().evaluate(e=>e.scrollIntoView({block:'start'}));await h.page.screenshot({path:path.join(out,'generators1004-'+(mobile?'phone':'desktop')+'-rows.png')});
 const evidence={author:'Andrew Fisher',fixtureVersion:fixture.version,diagnostics:result.diagnostics,checks:result.checks,totals:result.totals,errors:h.errors,counts:h.counts,candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex')};
 fs.writeFileSync(path.join(out,'generators1004-'+(mobile?'phone':'desktop')+'.json'),JSON.stringify(evidence,null,2)+'\n');fs.writeFileSync(path.join(privateDir,'candidate-finance.json'),JSON.stringify(result.after));
 console.log(JSON.stringify({...evidence,checks:result.checks.length,failures:result.checks.filter(c=>!c.pass)}));
 assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);for(const c of result.checks)assert.ok(c.pass,c.name);
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
