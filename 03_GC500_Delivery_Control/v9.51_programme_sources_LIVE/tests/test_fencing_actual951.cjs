/* Author: Andrew Fisher. GET-only exact-preview phone and actual-rate paired fencing proof. */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const DIR=process.env.OUT,TOOL=path.resolve(__dirname,'../../toolchain/harness'),hp=TOOL+'/open_page.js';
assert(DIR&&path.isAbsolute(DIR),'Set OUT to an absolute private evidence directory');fs.mkdirSync(DIR,{recursive:true,mode:0o700});
const save=(n,x)=>fs.writeFileSync(path.join(DIR,n),JSON.stringify(x,null,2),{mode:0o600});const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
assert(process.env.BASE_PAGE,'Set BASE_PAGE to the preceding source page');
const oldFencing=JSON.parse(fs.readFileSync(process.env.BASE_PAGE,'utf8').split('const DATA = ',2)[1].split('\n',1)[0].replace(/;\s*$/,'')).fencing;
assert(!oldFencing.source_review951,'BASE_PAGE must precede fencing951');
const fetcher=require(TOOL+'/curlfetch'),realFetch=fetcher.curlFetch;let frozen=null;
fetcher.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET');const u=new URL(url);
 if(frozen&&u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname))return {status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:frozen.level||'view'}))};
 const res=await realFetch(url,headers,method,body);
 if(!frozen&&u.origin==='https://gc500-production.up.railway.app'&&u.pathname==='/api/state'&&res.status===200){frozen=JSON.parse(res.body.toString());save('frozen-state.json',frozen)}
 return res;
};
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));let src=fs.readFileSync(hp,'utf8');
const guard="const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');";assert(src.includes(guard));src=src.replace(guard,'const okPost = false;').replace('counts.blocked++;',"counts.blocked++; (counts.denials ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});");
src=src.replace('const page = await ctx.newPage();',"const page = await ctx.newPage();counts.bootConsole=[];page.on('console',m=>{if(['warning','error'].includes(m.type()))counts.bootConsole.push({type:m.type(),text:m.text().replace(/key=[^&\\s]+/g,'key=[redacted]').slice(0,400)});});");h._compile(src,hp);
let checks=0;function eq(a,b,label){assert.deepEqual(a,b,label);checks++}function ok(x,label){assert(x,label);checks++}
function independent(snapshot){
 const r=x=>Math.round(x*100)/100, out={cost:0,revenue:0,weeks:{}};
 for(const w of snapshot.programme){if(!w.rolled_forward)continue;const mapped=snapshot.weeks.find(x=>snapshot.weekMap.find(m=>m.week_2026===x.sheet)?.programme_sheet===w.sheet);if(!mapped)continue;
  const past=!!(mapped.end&&mapped.end<snapshot.day), ds=snapshot.dockets.filter(d=>d.usable&&d.week===mapped.sheet&&(d.scope||'programme')==='programme'), lines=[];
  let cost=0,revenue=0;
  for(const c of snapshot.columns){const plan=w.totals[c.programme_type];if(plan==null)continue;const done=r(ds.reduce((n,d)=>n+(Number(d.quantities[c.key])||0),0)), q=Math.max(0,r(plan-done));if(!q)continue;const rate=snapshot.rates[c.key],paid=snapshot.paid[c.key];const rev=rate.value!=null?q*rate.value:null,co=paid.value!=null?q*paid.value:null;revenue+=rev||0;cost+=co||0;lines.push({name:c.name_as_written,unit:c.unit,q,rev,cost:co});}
  if(past&&!lines.length)continue;
  if(!past)for(const [type,q]of Object.entries(w.totals)){if(!(q>0)||snapshot.columns.some(c=>c.programme_type===type))continue;const card=snapshot.forecastCard.find(c=>c.programme_type===type&&c.unit==='m');if(card){const rev=q*card.rate;revenue+=rev;lines.push({name:type,unit:'m',q,rev,cost:null,forecastOnly:true});}}
  out.weeks[w.sheet]={cost:r(cost),revenue:r(revenue),lines};out.cost=r(out.cost+r(cost));out.revenue=r(out.revenue+r(revenue));
 }return out;
}
(async()=>{
 const PAGE=process.env.PAGE;assert(PAGE);const s=await h.exports.open({pageFile:PAGE,hash:'#fencing',W:390,H:844,dpr:2,mobile:true,gl:true});const p=s.page;p.setDefaultTimeout(15000);const timer=setTimeout(()=>s.browser.close().catch(()=>{}),240000);
 try{
  await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:90000});
  ok(frozen,'Captured initial real native record');
  const result=await p.evaluate(old=>{
   const stringify=x=>JSON.parse(JSON.stringify(x)),afterFencing=DATA.fencing,initial=JSON.stringify(S),version=SYNC.backend.readVersion821();
   const capture=()=>{RENDER_MEMO.clear();return holdAssets(()=>({day:todayIso(),programme:stringify(DATA.fencing.week_sheets),weeks:stringify(DATA.weeks),weekMap:stringify(DATA.fence.week_map),columns:stringify(FCOL),forecastCard:stringify(FORECAST_CARD771.entries),dockets:allDockets().map(d=>({week:d.week,usable:d.usable,scope:d.scope,quantities:d.quantities})),rates:Object.fromEntries(FCOL.map(c=>[c.key,stringify(fenceRateFor(c.key))])),paid:Object.fromEntries(FCOL.map(c=>[c.key,stringify(fenceCostFor(c.key))])),forecast:stringify(cj764Fencing()),actual:{fence:fenceDerived(),green:greenBookTotals(),money:moneySummary(),costs:costTotals(allCosts())},completion:JSON.stringify(S.fenceDone)}));};
   let before,after;try{DATA.fencing=old;before=capture();DATA.fencing=afterFencing;after=capture();}finally{DATA.fencing=afterFencing;RENDER_MEMO.clear();}
   const d=DATA.fencing.week_sheets.find(w=>w.sheet==='DECON WK1'),progress=holdAssets(()=>progressAsOf('2026-10-25'));
   return {before,after,version,recordUnchanged:initial===JSON.stringify(S),record:initial,Sunday:{direct:plannedToDay(d,'2026-10-25','Temporary Fence (m) — Removal'),progress:progress.fenceLines.find(l=>l.column==='removal').planned},installation:holdAssets(()=>fenceTypes(progress).find(t=>t.key==='clean').total)};
  },oldFencing);
  save('paired-private.json',result);eq(result.version,frozen.version,'same fresh native version');ok(result.recordUnchanged,'paired source comparison sends no native edits');eq(result.before.actual,result.after.actual,'recorded Revenue/Direct costs/hours unchanged');eq(result.before.completion,result.after.completion,'completion unchanged');eq(result.before.rates,result.after.rates,'customer rates unchanged');eq(result.before.paid,result.after.paid,'supplier rates unchanged');eq(result.before.dockets,result.after.dockets,'actual dockets unchanged');
  const reconciled={};for(const name of ['before','after']){const want=independent(result[name]),got=result[name].forecast;eq(got.cost,want.cost,name+' actual-rate forecast costs independently reconciled');eq(got.revenue,want.revenue,name+' actual-rate forecast revenue independently reconciled');for(const w of got.weeks){eq({cost:w.cost,revenue:w.revenue}, {cost:want.weeks[w.prog].cost,revenue:want.weeks[w.prog].revenue},name+' per-week actual-rate totals '+w.prog);eq(w.lines,want.weeks[w.prog].lines,name+' per-category actual quantity × rate '+w.prog)}reconciled[name]=want;}
  eq(result.Sunday,{direct:806,progress:1939},'Sunday removals active before mapped Monday');eq(result.installation,8090.5,'report denominator excludes demob reuse');
  await p.evaluate(()=>holdAssets(()=>go('fencing')));
  const fold=p.locator('#fencing-source951');await fold.waitFor({state:'attached'});
  eq(await fold.evaluate(n=>!!n.closest('.fp-working')),true,'fold inside existing Planning & commercial detail');eq(await p.locator('#fencing-source951').count(),1,'one source fold');
  await fold.locator(':scope > summary').click();await fold.locator(':scope > summary').scrollIntoViewIfNeeded();await p.screenshot({path:DIR+'/phone-source-notes.png'});
  const con=fold.locator('details').filter({has:p.locator('summary', {hasText:/^CON WK1 ·/})}).first();await con.locator(':scope > summary').click();await con.locator(':scope > summary').scrollIntoViewIfNeeded();await p.screenshot({path:DIR+'/phone-cw1-tasks.png'});
  const dom=await p.evaluate(()=>({vw:innerWidth,docWidth:document.documentElement.scrollWidth,controls:document.querySelector('#fencing-source951').querySelectorAll('input,select,button').length,sourceRows:document.querySelector('#fencing-source951').querySelectorAll('tbody tr').length,version:SYNC.backend.readVersion821(),record:JSON.stringify(S)}));
  ok(dom.docWidth<=dom.vw+1,'source table remains within phone width');eq(dom.controls,0,'source notes have no operational inputs');eq(dom.sourceRows,380,'all source task notes retained');eq(dom.version,result.version,'frozen version retained');eq(dom.record,result.record,'viewing folds leaves native record unchanged');eq(s.errors,[],'no runtime errors');ok((s.counts.denials||[]).every(x=>x.origin==='https://tile.googleapis.com'&&x.path==='/v1/createSession'),'only expected Google session write denied');
  const keys=new Set([...Object.keys(reconciled.before.weeks),...Object.keys(reconciled.after.weeks)]),delta=[...keys].map(k=>({sheet:k,before:reconciled.before.weeks[k]?{cost:reconciled.before.weeks[k].cost,revenue:reconciled.before.weeks[k].revenue}:{cost:0,revenue:0},after:reconciled.after.weeks[k]?{cost:reconciled.after.weeks[k].cost,revenue:reconciled.after.weeks[k].revenue}:{cost:0,revenue:0}})).filter(x=>JSON.stringify(x.before)!==JSON.stringify(x.after));
  const summary={author:'Andrew Fisher',candidateSha256:sha(fs.readFileSync(PAGE)),checks,version:result.version,day:result.after.day,actualsUnchanged:true,nativeRecordUnchanged:true,recordWrites:0,pageErrors:s.errors,requests:s.counts,phone:{width:dom.vw,documentWidth:dom.docWidth,sourceRows:dom.sourceRows},forecast:{before:{cost:reconciled.before.cost,revenue:reconciled.before.revenue},after:{cost:reconciled.after.cost,revenue:reconciled.after.revenue},weeklyDelta:delta},Sunday:result.Sunday,installationClean:result.installation};save('summary.json',summary);console.log(JSON.stringify({...summary,requests:{live:s.counts.live,blocked:s.counts.blocked,denials:s.counts.denials,bootWarnings:s.counts.bootConsole?.length}}));
 }finally{clearTimeout(timer);await s.browser.close();}
})().catch(e=>{fs.writeFileSync(DIR+'/failure.txt',e.stack,{mode:0o600});console.error(e.message);process.exitCode=1});
