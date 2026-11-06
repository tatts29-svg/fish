// Author: Andrew Fisher. Read-only generator date, rate and cross-view audit.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page'));
(async()=>{let h;try{
 const out=process.env.OUT||'/workspace/private-gc500-unit1006',name=process.env.AUDIT_NAME||(process.env.PAGE?'candidate':'public');
 h=await open({pageFile:process.env.PAGE,hash:'#costs',W:1440,H:1000,dpr:1});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:60000});
 const result=await h.page.evaluate(()=>holdAssets(()=>{
  const before=JSON.stringify(S),G=generatorModel1004(),I=generatorInputs1004(),m=moneySummary(),p=pl770Model(),f=cj764Model(),b=branchFinancial978(pl752Rows(),m),oct=acc761Model('2026-10'),sep=acc761Model('2026-09'),checks=[];
  const check=(name,pass)=>checks.push({name,pass:!!pass}),r2=n=>Math.round((n+Number.EPSILON)*100)/100;
  const contracts=[...G.contracts].map(([id,charge])=>({id,charge,source:ONHIRE_ROWS.find(r=>GeneratorFinance1004.key(r)===id)}));
  const total=(list,key)=>r2(list.reduce((n,r)=>n+(r[key]||0),0));
  check('Every active generator charge has one contract allocation',new Set(G.rows.flatMap(r=>r.contractIds)).size===G.rows.flatMap(r=>r.contractIds).length&&G.unpriced.length===0);
  check('Contract actual totals equal generator actual once',total(contracts.map(x=>x.charge),'actual')===G.actual);
  check('Contract remaining totals equal generator remaining once',total(contracts.map(x=>x.charge),'remaining')===G.remaining);
  check('Contract complete totals equal generator total once',total(contracts.map(x=>x.charge),'forecast')===G.forecast);
  check('Actual plus forecast reconcile',r2(G.actual+G.remaining)===G.forecast);
  check('Separate standdown and race total reconcile',r2(G.standdown+G.race)===G.forecast);
  check('Branch actual, remaining and whole job equal generator totals',total(G.byBranch,'actual')===G.actual&&total(G.byBranch,'remaining')===G.remaining&&total(G.byBranch,'forecast')===G.forecast);
  check('Costs and P&L actual/forecast agree',r2(p.revNow-m.charge.total)===0&&r2(p.revJob-f.revenue.job)===0&&Object.values(p.checks).every(v=>v!==false));
  check('Branch financial controls reconcile',Object.values(b.checks).every(Boolean));
  check('Generator charges allocated to October once',total(oct.revenue.filter(r=>r.stream.includes('generator October')),'amount')===G.forecast&&!sep.revenue.some(r=>r.stream.includes('generator October')));
  for(const r of G.rows){
   const start=r.actualIsConfirmed?r.deliveredDate:r.plannedDate,days=[];
   for(let d=new Date(start+'T00:00:00Z');Number.isFinite(+d)&&d.toISOString().slice(0,10)<='2026-10-25';d.setUTCDate(d.getUTCDate()+1))days.push(d.toISOString().slice(0,10));
   check(r.id+' bills delivery day inclusively through Thursday',r.standdownDays===days.filter(d=>d<'2026-10-23').length);
   check(r.id+' bills Fri/Sat/Sun only at full rate',r.eventDays===days.filter(d=>d>='2026-10-23').length&&r.offhire==='2026-10-25');
   check(r.id+' arrival goes only to actual or remaining forecast',r.actualIsConfirmed?r.actual===r.forecast&&r.remaining===0:r.actual===0&&r.remaining===r.forecast);
   const a=r.ref&&assetOf(r.ref);if(a)check(r.id+' reference hire matches shared generator model',assetTotal(a).lines.some(l=>[l.total,l.amount,l.t].includes(r.forecast)));
   check(r.id+' asset numbers unique',new Set(r.assetNumbers).size===r.assetNumbers.length);
  }
  for(const [date,s,e] of [['2026-10-12',11,3],['2026-10-22',1,3],['2026-10-23',0,3],['2026-10-24',0,2],['2026-10-25',0,1],['2026-10-26',0,0],['2026-10-27',0,0]]){const w=GeneratorFinance1004.windowOf(date);check(date+' boundary',w.standdownDays===s&&w.eventDays===e);}
  const concert=G.rows.find(r=>r.ref==='GN?');check('200 kVA uses published card standby/full rates',concert.standdownRate===182.2791&&concert.dailyRate===364.5582);
  check('Models did not change native state',JSON.stringify(S)===before);
  return {checks,nativeVersion:SYNC.backend.readVersion821(),inputs:I,rows:G.rows,contracts,cardRates:GeneratorFinance1004.cardRates,byBranch:G.byBranch,totals:{actual:G.actual,remaining:G.remaining,total:G.forecast,standdown:G.standdown,standdownActual:G.standdownActual,standdownRemaining:G.standdownRemaining,quantity:G.rows.reduce((n,r)=>n+r.qty,0),actualQuantity:G.rows.filter(r=>r.actualIsConfirmed).reduce((n,r)=>n+r.qty,0)},plChecks:p.checks,branchChecks:b.checks};
 }));
 result.checks.push({name:'No browser errors or live writes',pass:h.errors.length===0&&h.counts.blocked===0});
 const hash=process.env.PAGE?crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'):await h.page.evaluate(async()=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await (await fetch('/v/Coates-GC500-2026',{cache:'no-store'})).arrayBuffer()))).map(v=>v.toString(16).padStart(2,'0')).join(''));
 const detail={author:'Andrew Fisher',at:new Date().toISOString(),sha256:hash,...result,errors:h.errors,counts:h.counts};fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'standdown-'+name+'-detail.json'),JSON.stringify(detail,null,2)+'\n');
 const summary={author:detail.author,at:detail.at,sha256:hash,nativeVersion:result.nativeVersion,checks:result.checks.length,failures:result.checks.filter(x=>!x.pass),totals:result.totals,errors:h.errors,writes:h.counts.blocked};
 fs.writeFileSync(path.join(__dirname,'evidence','standdown-'+name+'.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));for(const c of result.checks)assert.ok(c.pass,c.name);
 }finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
