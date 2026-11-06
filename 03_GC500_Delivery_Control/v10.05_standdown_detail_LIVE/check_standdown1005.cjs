// Author: Andrew Fisher. Read-only candidate/public presentation and financial reconciliation.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page'));
(async()=>{let h;try{
 const mobile=process.env.MOB==='1',out=path.resolve(__dirname,'evidence'),prefix=(process.env.PAGE?'candidate':'public')+'-'+(mobile?'phone':'desktop');
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 await h.page.locator('[data-finance857="generators"]').click();
 await h.page.locator('.generator1005-standdown').first().waitFor();
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const checks=[],ok=(name,pass)=>checks.push({name,pass:!!pass}),M=generatorModel1004(),p=pl770Model(),m=moneySummary();
  ok('Generator actual/forecast unchanged',M.actual===28196.40&&M.remaining===9333.73&&M.forecast===37530.13&&M.standdown===25017.27);
  ok('P&L and branch figures reconcile',Math.abs(p.revNow-m.charge.total)<.005&&Object.values(branchFinancial978(pl752Rows(),m).checks).every(Boolean));
  const domRows=[...document.querySelectorAll('[data-generator1004-row]')];
  ok('Every generator group has one row',domRows.length===M.rows.length);
  for(const r of M.rows){
   const dom=domRows.find(e=>e.dataset.generator1004Row===r.id),visible=key=>dom?.querySelector('[data-standdown1005="'+key+'"]'),id=r.displayRef||r.ref;
   ok(id+' all five facts visible without expanding More info',['rate','start','end','days','total'].every(k=>visible(k)?.getBoundingClientRect().height>0&&!visible(k).closest('details')));
   ok(id+' rate is per unit/day',visible('rate')?.innerText===money(r.standdownRate)&&dom.innerText.includes('Rate / unit / day'));
   const start=r.actualIsConfirmed?r.deliveredDate:r.plannedDate;
   ok(id+' actual or planned start',visible('start')?.querySelector('time')?.dateTime===start&&(!r.actualIsConfirmed?dom.innerText.includes('Planned start'):true));
   ok(id+' end is day before race Friday',visible('end')?.querySelector('time')?.dateTime==='2026-10-22');
   const inclusiveDays=(Date.parse('2026-10-22')-Date.parse(start))/86400000+1;
   ok(id+' inclusive calendar days',Number(visible('days')?.innerText)===inclusiveDays&&r.standdownDays===inclusiveDays);
   ok(id+' total already includes quantity',visible('total')?.innerText===money(r.standdownCharge));
  }
  const stateBefore=JSON.stringify(S),r=M.rows.find(x=>x.ref==='GN?');
  const noStanddown={...r,...GeneratorFinance1004.windowOf('2026-10-23'),deliveredDate:'2026-10-23',standdownCharge:0};
  const zero=document.createElement('div');zero.innerHTML=generatorStanddownHtml1005(noStanddown,M.eventFrom);
  ok('Race-Friday arrival has zero days and no reversed dates',zero.querySelector('[data-standdown1005="days"]').textContent==='0'&&zero.querySelector('[data-standdown1005="start"]').textContent==='Not applicable'&&zero.querySelector('[data-standdown1005="end"]').textContent==='Not applicable');
  const missing=document.createElement('div');missing.innerHTML=generatorStanddownHtml1005({...r,deliveredDate:null,plannedDate:'2026-10-12',standdownDays:null,standdownCharge:null},M.eventFrom);
  ok('Unknown actual date does not borrow planned date or show zero',!missing.querySelector('time')&&missing.querySelector('[data-standdown1005="days"]').textContent==='Not recorded'&&missing.querySelector('[data-standdown1005="total"]').textContent==='Not priced');
  ok('Rendering did not change native state',JSON.stringify(S)===stateBefore);
  ok('No horizontal clipping',document.documentElement.scrollWidth<=innerWidth+2);
  return {checks,totals:{actual:M.actual,remaining:M.remaining,total:M.forecast,standdown:M.standdown},concert:{qty:r.qty,start:r.deliveredDate,days:r.standdownDays,rate:r.standdownRate,total:r.standdownCharge}};
 }));
 const concert=h.page.locator('[data-generator1004-row]').filter({has:h.page.locator('[data-generator1004-open="GN?"]')});
 await concert.evaluate(e=>e.scrollIntoView({block:'start'}));
 fs.mkdirSync(out,{recursive:true});await h.page.screenshot({path:path.join(out,prefix+'.png')});
 const sha=process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):await h.page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await (await fetch('/v/Coates-GC500-2026',{cache:'no-store'})).arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join(''));
 result.checks.push({name:'No page errors or attempted writes',pass:h.errors.length===0&&h.counts.blocked===0});
 const evidence={author:'Andrew Fisher',sha256:sha,at:new Date().toISOString(),...result,errors:h.errors,counts:h.counts};
 fs.writeFileSync(path.join(out,prefix+'.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({...evidence,checks:result.checks.length,failures:result.checks.filter(c=>!c.pass)}));
 for(const c of result.checks)assert.ok(c.pass,c.name);
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
