/* Author: Andrew Fisher. Confirm every generator contract contributes once; no native saves. */
'use strict';
const fs=require('fs');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({hash:'#costs',W:1440,H:1000});
 await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await h.page.waitForFunction(()=>photoIndex().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const original=JSON.stringify(S),checks=[],cases=[],check=(name,value)=>checks.push({name,pass:!!value}),eq=(a,b)=>Math.round(a*100)===Math.round(b*100);
  const restore=()=>{S=JSON.parse(original);sharedCache975();};
  const read=()=>holdAssets(()=>{const G=generatorModel1004(),m=moneySummary(),p=pl770Model();return {model:{actual:G.actual,remaining:G.remaining,forecast:G.forecast,contracts:[...G.contracts]},actual:m.charge.total,forecast:p.revJob,direct:p.direct,directJob:p.directJob,pl:p.checks,branches:branchFinancial978(pl752Rows(),m).checks};});
  const base=read(),sources=ONHIRE_ROWS.filter(r=>(r.kind==='generator'||r.family==='generator')&&!r.charge_line);
  let raw;
  try{
   check('one generator model contract per source line',base.model.contracts.length===sources.length&&new Set(sources.map(r=>r.rental_contract+':'+r.line)).size===sources.length);
   for(const r of sources){
    const key=r.rental_contract+':'+r.line,expected=base.model.contracts.find(([id])=>id===key)?.[1];
    check(key+' accepts existing typed-rate audit path',r.rate_1==null&&!!expected);
    if(r.rate_1!=null||!expected)continue;
    restore();S.lineRates['c|'+r.rental_contract+'|'+r.line]='0';sharedCache975();const state=read();cases.push({key,expected,state});
    check(key+' arrives in Costs exactly once',eq(base.actual-state.actual,expected.actual||0));
    check(key+' arrives in P&L forecast exactly once',eq(base.forecast-state.forecast,expected.forecast||0));
    check(key+' leaves Direct costs unchanged',eq(base.direct,state.direct)&&eq(base.directJob,state.directJob));
    check(key+' keeps branch and P&L sums balanced',Object.values(state.pl).every(Boolean)&&Object.values(state.branches).every(Boolean));
   }
   restore();raw=holdAssets(()=>({assets:DATA.assets.filter(a=>a.discipline==='Generators'||/^GN/.test(a.key||'')),orphanRows:DATA.orphan_rows,unreferenced:DATA.unreferenced,plantLines:(DATA.plant_lines.lines||[]).filter(r=>/generator|\d\s*kva\b/i.test(JSON.stringify(r))),master:Object.fromEntries(Object.entries(MASTER_LOC).filter(([key])=>/^GN/.test(key))),currentRawNumbers:allAssets().filter(a=>a.discipline==='Generators').map(a=>({ref:a.key,assetNumbers:a.asset_numbers,numberSources:a._numberSources,buildingNumbers:a._buildingNumbers,removed:a._numbersTakenOff,rawNotes:a.asset_notes}))}));
  }finally{restore();}
  check('in-memory record exactly restored',JSON.stringify(S)===original);return {checks,cases,base,raw,nativeVersion:SYNC.backend.readVersion821()};
 });
 result.checks.push({name:'zero errors and operational writes',pass:!h.errors.length&&!h.counts.blocked});
 fs.writeFileSync(process.env.OUT,JSON.stringify({author:'Andrew Fisher',...result,errors:h.errors,counts:h.counts},null,2)+'\n');console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(c=>!c.pass),contracts:result.cases.length,nativeVersion:result.nativeVersion,errors:h.errors,counts:h.counts}));if(result.checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(h)await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
