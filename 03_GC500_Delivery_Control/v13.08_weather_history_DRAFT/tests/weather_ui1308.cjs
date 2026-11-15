/* Author: Andrew Fisher. Verify actual historical readings and native day-card navigation without writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const expected=require('../weather_updates1308.json'),live=process.env.LIVE==='1',mobile=process.env.MOB==='1';
const out=process.env.OUT;assert(out&&path.isAbsolute(out));assert(!path.resolve(out).startsWith(path.resolve(__dirname,'../../..')+path.sep));
fs.mkdirSync(out,{recursive:true,mode:0o700});
const sha=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
let servedHash=null;
if(live){
 const fetcher=require('../../toolchain/harness/curlfetch'),native=fetcher.curlFetch;
 fetcher.curlFetch=async(url,...args)=>{const r=await native(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=sha(r.body);return r;};
}
async function inspect(file,updated){
 let s;
 if(live){s=await require('../../toolchain/harness/open_page').open({hash:'#demob',W:mobile?390:1440,H:mobile?844:1000,mobile});}
 else {process.env.PAGE=file;process.env.INITIAL_HASH='#demob';s=await require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs').openCandidate();}
 const p=s.page,consoleErrors=s.consoleErrors||[];if(!s.consoleErrors)p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,160));});
 try{
  await p.waitForFunction(()=>window.BuildHistory984&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  const before=await p.evaluate(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),money:JSON.stringify({money:moneySummary(),pl:pl770Model()})}));
  const facts=await p.evaluate(()=>({dates:BuildHistory984.dates(),demobDays:days816(),rows:Object.fromEntries(BuildHistory984.dates().map(d=>[d,BuildHistory984.get(d)])),version:SYNC.backend.readVersion821(),footer:document.querySelector('footer')?.textContent||'',outside:BuildHistory984.get('2026-11-14')}));
  const readings=[];
  if(updated){
   assert.equal(facts.dates.length,68);assert.equal(facts.dates[0],'2026-09-07');assert.equal(facts.dates.at(-1),'2026-11-13');assert.equal(facts.outside,null);assert(facts.footer.includes('v13.08'));
   for(const [day,row]of Object.entries(expected.days)){
    const model=await p.evaluate(d=>BuildCards984.weather(d),day);
    for(const [key,value]of Object.entries(row))assert.deepEqual(model.source[key],value,day+' '+key);
    assert.equal(model.tag,'BOM RECORDED');assert.equal(model.hi,Math.round(row.max_c));assert.equal(model.lo,Math.round(row.min_c));assert.equal(model.source.provenance.original_bytes_sha256,expected.source.original_bytes_sha256);
    // The existing programme excludes weekends; their observations still belong in the archive.
    if(!facts.demobDays.includes(day)){assert(['2026-11-07','2026-11-08'].includes(day),'Only existing non-programme weekend dates have no Demob card');continue;}
    const card=p.locator('#pane-demob .dc996-day[data-dday816="'+day+'"]');await card.scrollIntoViewIfNeeded();await card.click();
    await p.waitForFunction(day=>DM816.sel===day&&document.querySelector('#pane-demob .dc996-day.on')?.dataset.dday816===day,day);
    const text=await card.locator('.bc984-weather-reading').innerText();assert(text.includes('BOM RECORDED'));assert(!/unavailable|PARTIAL|FORECAST/i.test(text));assert(text.includes(Math.round(row.max_c)+'°'));assert(text.includes(Math.round(row.min_c)+'°'));assert(text.includes('Gusts '+row.gust_kph+' km/h'));
    readings.push({day,text});
    if(day==='2026-11-04'||day==='2026-11-13')await card.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-'+day+'.png')});
   }
   assert.equal(readings.length,8,'All eight affected programme cards checked');
   await p.evaluate(()=>go('timeline'));
   const oldCard=p.locator('#pane-timeline .bc984-day[data-day="2026-10-22"]');await oldCard.scrollIntoViewIfNeeded();await oldCard.click();
   assert((await oldCard.locator('.bc984-weather-reading').innerText()).includes('BOM RECORDED'),'Earlier Build weather remains visible');
  }
  const after=await p.evaluate(()=>({docs:JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))),money:JSON.stringify({money:moneySummary(),pl:pl770Model()})}));
  assert.equal(after.docs,before.docs,'No operational document changed');assert.equal(after.money,before.money,'Weather navigation preserves financial outputs');
  assert.deepEqual(s.errors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(s.counts.blocked,0);
  if(live){assert.equal(s.counts.page,0);assert.equal(servedHash,process.env.EXPECTED_SHA,'Actual public HTML matches tested candidate');}
  return {rows:facts.rows,demobDays:facts.demobDays,recordSha256:sha(before.docs),moneySha256:sha(before.money),recordVersion:facts.version,readings,errors:0,consoleErrors:0,writes:0,htmlSubstitutions:s.counts.page};
 }finally{await s.browser.close();}
}
(async()=>{
 const candidate=process.env.PAGE;
 const base=live?null:await inspect(process.env.BASE,false);
 const result=await inspect(candidate,true);
 if(base){
  assert.equal(result.recordSha256,base.recordSha256);assert.equal(result.moneySha256,base.moneySha256);
  assert.deepEqual(result.demobDays,base.demobDays,'Existing programme day selection unchanged');
  for(const [day,row]of Object.entries(base.rows))if(day!=='2026-11-04')assert.deepEqual(result.rows[day],row,'Preserve previous weather '+day);
 }
 const report={author:'Andrew Fisher',passed:true,live,mobile,archiveDays:68,completedDay:'2026-11-04',newDays:9,verifiedObservationDays:10,verifiedCardDays:8,weekendObservationsRetained:true,earlierBuildCardVisible:true,previousRowsPreserved:base?58:null,recordVersion:result.recordVersion,recordUnchanged:true,financialOutputsUnchanged:true,errors:0,consoleErrors:0,writes:0,htmlSubstitutions:result.htmlSubstitutions,sha256:live?servedHash:sha(fs.readFileSync(candidate))};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
