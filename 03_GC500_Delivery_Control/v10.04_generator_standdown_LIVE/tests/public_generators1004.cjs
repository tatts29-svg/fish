// Author: Andrew Fisher. Verify the actual public page; all service writes are blocked.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
const expected='0030d7d3d6838fcad67773cdb19927ea0388591aa33cbc163e53d0d02d182443';
(async()=>{let h;try{
 const mobile=process.env.MOB==='1',out=process.env.OUT||path.resolve(__dirname,'../evidence');
 h=await open({hash:'#costs',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const checks=[],ok=(name,pass)=>checks.push({name,pass:!!pass});
 const sha=await h.page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await (await fetch('/v/Coates-GC500-2026',{cache:'no-store'})).arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join(''));
 ok('Actual public bytes match approved candidate',sha===expected);
 const live=await h.page.evaluate(()=>holdAssets(()=>{const G=generatorModel1004(),m=moneySummary(),p=pl770Model(),b=branchFinancial978(pl752Rows(),m),a=assetOf('GN?');return {
  actual:G.actual,remaining:G.remaining,total:G.forecast,standdown:G.standdown,standdownActual:G.standdownActual,standdownRemaining:G.standdownRemaining,
  quantity:G.rows.reduce((n,r)=>n+r.qty,0),unpriced:G.unpriced.length,offhires:G.rows.map(r=>r.offhire),concert:G.rows.find(r=>r.ref==='GN?'),
  pin:refLatLon(a),destination:destinationOf(a).text,plChecks:p.checks,branchChecks:b.checks,
  actualMatches:Math.abs(p.revNow-m.charge.total)<0.005,forecastMatches:Math.abs(p.revJob-cj764Model().revenue.job)<0.005
 };}));
 ok('Current generator actual and forecast reconcile',live.actual===28196.40&&live.remaining===9333.73&&live.total===37530.13);
 ok('Current standdown charge reconciles',live.standdown===25017.27&&live.standdownActual===21132.58&&live.standdownRemaining===3884.69);
 ok('All 18 active generators are priced',live.quantity===18&&live.unpriced===0);
 ok('Commercial off hire is race Sunday',live.offhires.every(v=>v==='2026-10-25'));
 ok('Costs and P&L agree',live.actualMatches&&live.forecastMatches&&Object.values(live.plChecks).every(v=>v!==false));
 ok('Branch totals reconcile',Object.values(live.branchChecks).every(Boolean));
 ok('Concert pair uses card standby rate',live.concert.qty===2&&live.concert.standdownRate===182.2791&&live.concert.dailyRate===364.5582);
 ok('Unconfirmed Concert plant numbers withheld',live.concert.assetNumbers.length===0);
 ok('Supplied Concert map location linked',live.pin.lat===-27.984576&&live.pin.lon===153.427700&&live.destination.includes('peacock'));
 await h.page.locator('[data-finance857="generators"]').first().click();
 await h.page.locator('#generators1004').waitFor();
 ok('Generator tab selected',await h.page.locator('[data-finance857="generators"]').getAttribute('aria-pressed')==='true');
 ok('All 17 generator groups visible',await h.page.locator('[data-generator1004-row]').count()===17);
 ok('Actual total displayed',/28,196\.40/.test(await h.page.locator('[data-generator1004-total="actual"]').innerText()));
 ok('Standdown and total columns visible',await h.page.locator('[data-l="Standdown charge"]').first().isVisible()&&await h.page.locator('[data-l="Total charge"]').first().isVisible());
 ok('No duplicate unrelated summary',await h.page.locator('#pane-costs [data-onsite979]').count()===0);
 ok('Fits viewport',await h.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 fs.mkdirSync(out,{recursive:true});
 await h.page.locator('#generators1004').evaluate(e=>e.scrollIntoView({block:'start'}));
 await h.page.screenshot({path:path.join(out,'public-'+(mobile?'phone':'desktop')+'.png')});
 await h.page.locator('[data-generator1004-row]').first().evaluate(e=>e.scrollIntoView({block:'start'}));
 await h.page.screenshot({path:path.join(out,'public-'+(mobile?'phone':'desktop')+'-rows.png')});
 ok('No page errors',h.errors.length===0);ok('No operational writes attempted',h.counts.blocked===0);
 const evidence={author:'Andrew Fisher',sha256:sha,checkedAt:new Date().toISOString(),viewport:mobile?'phone':'desktop',checks,totals:{actual:live.actual,remaining:live.remaining,total:live.total,standdown:live.standdown},errors:h.errors,counts:h.counts};
 fs.writeFileSync(path.join(out,'public-'+(mobile?'phone':'desktop')+'.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({...evidence,checks:checks.length,failures:checks.filter(c=>!c.pass)}));
 for(const c of checks)assert.ok(c.pass,c.name);
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
