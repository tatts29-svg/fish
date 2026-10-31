/* Author: Andrew Fisher. Public-view GET-only read-back; scope stays in private input. */
'use strict';
const fs=require('fs'),assert=require('assert'),path=require('path');
const {open}=require('../toolchain/harness/open_page');
(async()=>{
 const scope=JSON.parse(fs.readFileSync(process.env.GC500_COMPLETION_SCOPE_JSON,'utf8'));
 console.log('Opening public-view test page');
 const s=await open({pageFile:process.env.PAGE,mobile:!!process.env.MOB,W:process.env.MOB?390:1440,H:process.env.MOB?844:1000,hash:'#today'});
 try{
  console.log('Page loaded; waiting for shared record');
  await s.page.waitForFunction(()=>typeof todayGroupHealth841==='function'&&todayGroupHealth841().ready,null,{timeout:120000});
  console.log('Shared record ready; comparing completion models');
  const result=await s.page.evaluate(excluded=>{
   const check=(ok,name)=>{if(!ok)throw Error(name);};
   const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),saved=window.CompletionScope1098,day=todayIso();
   const snapshot=()=>holdAssets(()=>JSON.stringify({delivery:S.delivery,quantities:S.qtys,pins:S.pins,assets:allAssets().map(a=>({key:a.key,price:a.pricing,lines:chargeLines(a),location:a.locations}))}));
   const read=()=>holdAssets(()=>{const areas=todayWorkMetrics840(day),groups=todayGroupDetails841(day,areas),summary=todayWorkSummary848(day,areas,groups,todayFencingSummary848(day));return{areas,groups,summary,types:todayTypeMetrics843(day,groups,summary),show:ShowcaseActuals1089.read(day),milestone:MS1025.facts('barriers',day)};});
   const before=snapshot();let full,scoped;
   try{
    window.CompletionScope1098={includes:()=>true,note:()=>''};sharedCache975();full=read();
    window.CompletionScope1098=saved;sharedCache975();scoped=read();
   }finally{window.CompletionScope1098=saved;sharedCache975();}
   const a=full.areas.find(a=>a.id==='barriers'),b=scoped.areas.find(a=>a.id==='barriers'),removed=a.rows.filter(r=>excluded.includes(r.key));
   check(removed.length===excluded.length,'all excluded references are present in the live category');
   check(b.total===a.total-removed.reduce((n,r)=>n+r.quantity,0),'headline denominator');
   check(b.done===a.done-removed.reduce((n,r)=>n+r.done,0),'headline numerator');
   check(!b.rows.some(r=>excluded.includes(r.key)),'excluded references absent from completion rows');
   check(excluded.every(key=>assetOf(key)&&!assetOf(key)._cancelled),'register retained');
   check(same(full.summary.byId.barriers.plan,scoped.summary.byId.barriers.plan),'arrival plan retained');
   const types=m=>m.types.instruments.filter(t=>t.groupName==='Water-filled barriers');
   check(types(scoped).every(t=>!t.rows.some(r=>excluded.includes(r.key))),'type completion rows');
   check(types(scoped).every(t=>t.pct==null||t.pct>=0&&t.pct<=100),'type percentage bounds');
   for(const t of types(scoped)){const old=types(full).find(x=>x.id===t.id),omitted=old.rows.filter(r=>excluded.includes(r.key));check(t.total===old.total-omitted.reduce((n,r)=>n+r.quantity,0),'type denominator');check(t.done===old.done-omitted.reduce((n,r)=>n+r.done,0),'type numerator');check(same(t.plan,old.plan),'type arrivals retained');}
   const group=m=>m.groups.equipment.groups.find(g=>g.name==='Water-filled barriers');
   check(same(group(full).summary,group(scoped).summary),'native schedule retained');
   check(same(group(full).facts,group(scoped).facts),'native asset facts retained');
   check(same(full.groups.equipment.money,scoped.groups.equipment.money),'native financial readings retained');
   check(same(full.groups.equipment.comparisons,scoped.groups.equipment.comparisons),'native schedule price readings retained');
   check(same(full.areas.filter(a=>a.id!=='barriers'),scoped.areas.filter(a=>a.id!=='barriers')),'other category metrics retained');
   check(scoped.show.areas.find(a=>a.id==='barriers').total===b.total&&scoped.show.areas.find(a=>a.id==='barriers').done===b.done,'showcase category');
   check(scoped.show.checks.total===full.show.checks.total-excluded.length,'showcase scope count');
   check(['levelled','steps','needLevel'].every(k=>scoped.show.checks[k]===full.show.checks[k]),'full-scope setup checks retained');
   const milestone=scoped.milestone;
   check(milestone.total===b.rows.length&&milestone.units.total===b.total&&milestone.units.done===b.done,'milestones share completion scope');
   check(milestone.recordTotal1098===full.milestone.total,'milestone full-record denominator');
   for(const field of ['onsite','firstOn','levelled','steps','numbered','numbersTotal','noNumber','withAcc','notLevelled','noSteps','noAcc','onsiteBy','movedMany','reticked','noHistory','types']) check(same(milestone[field],full.milestone[field]),'milestone full factual field '+field);
   const arrivalDays=f=>f.byDay.filter(d=>d.onsite).map(d=>[d.day,d.onsite]);
   check(same(arrivalDays(milestone),arrivalDays(full.milestone)),'milestone arrival history retained');
   check(snapshot()===before,'source record quantities charges and pins unchanged');
   return {checks:40,sourceUnchanged:true,excludedCount:excluded.length};
  },scope.excluded_references);
  console.log('Model comparisons passed');
  assert.equal(s.counts.blocked,0);assert.deepStrictEqual(s.errors,[]);
  if(process.env.SCREENSHOT){const card=s.page.locator('#tw840-card-barriers');await card.scrollIntoViewIfNeeded();await card.screenshot({path:path.resolve(process.env.SCREENSHOT)});}
  console.log(JSON.stringify({pass:true,...result,mobile:!!process.env.MOB,errors:s.errors.length,writes:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
