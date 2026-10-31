/* Author: Andrew Fisher. Native completion acceptance against the same pinned record.
 * Every operational write is denied. Detailed records and images stay in private OUT.
 * Completion is tested separately from physical presence, stock and recorded departures.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.43.1_offsite_pictures_LIVE/tests/native_harness.cjs');
const BASE_SHA='20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const docsCanonical=docs=>canonical(Object.fromEntries(Object.entries(docs).filter(([,v])=>v&&Object.keys(v).length)));
const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]??null]));
const read=day=>holdAssets(()=>{
 const fields=(o,ks)=>Object.fromEntries(ks.map(k=>[k,o?.[k]??null]));
 const native=dsnState(day),types=todayTypeMetrics843(day),summary=todayWorkSummary848(day),index=progress881Model(day),vms=VmsEquipment1103.model(day);
 const physical=native.rows.map(r=>({key:r.a.key,...fields(r,['on','unitsOn','asked','reloc','noQty']),askedBy:[...r.askedBy],onBy:[...r.onBy],delivery:deliveryAsOf(r.a.key,day),departure:Departure1211.status(r.a.key,day)}));
 const completion={asOf:types.asOf,summary:Object.fromEntries(Object.entries(summary.byId).map(([k,v])=>[k,fields(v,['id','total','done','left','pct','pctKind','reviewQuantity'])])),
  index:{...fields(index,['day','ready','pct','allGreen']),rows:index.rows.map(r=>fields(r,['id','min','max','done','total','left']))},
  types:Object.fromEntries(Object.entries(types.byCard).map(([k,rs])=>[k,rs.map(r=>({...fields(r,['id','groupName','name','total','done','left','pct','pctKind','onSite']),rows:(r.rows||[]).map(z=>fields(z,['key','done','complete','onSite','total','quantity']))}))]))};
 const vmsBoards=vms.boards.map(b=>({...fields(b,['key','delivery','on','done','installed','received','remaining','departure1211','completion','evidence']),history:b.delivery?histOf(b.delivery,'done_history'):[],record:VMSArrival1098.recordFor(b.key)}));
 return JSON.parse(JSON.stringify({day,actualDay:todayIso(),physical,completion,vms:{...fields(vms,['total','done','on','installed']),boards:vmsBoards},
  eq0006:{native:deliveryAsOf('EQ0006',day),history:histOf('EQ0006','done_history'),achievement:window.CompletionAchievement1259?.delivery('EQ0006',day)||null}}));
});
const dom=()=>holdAssets(()=>({
 hero:{text:document.querySelector('#where885')?.innerText||'',report:Where885.report()},
 cards:[...document.querySelectorAll('.grp[data-disc]')].map(el=>({disc:el.dataset.disc,header:el.querySelector('.k')?.innerText||'',text:el.innerText,
  number:el.querySelector('.n')?.innerText||'',facts:[...el.querySelector('.rows')?.children||[]].map(x=>x.innerText),table:[...el.querySelectorAll('table.bt tr')].map(tr=>[...tr.children].map(td=>td.innerText))})),
 workCards:[...document.querySelectorAll('#gc500-work-board840 .tw840-card')].map(el=>({text:el.innerText})),
 queue:{inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)},
 docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))))
}));
async function pauseHero(p){
 await p.evaluate(()=>{gc500Build1191.open();document.querySelector('#where885')?.scrollIntoView({block:'center'});});
 const button=p.locator('#where885 [data-w885-motion]');
 if(await button.isEnabled()&&await button.getAttribute('aria-pressed')==='false')await button.click();
 await p.waitForFunction(()=>{const el=document.querySelector('#where885'),pct=el?.querySelector('[data-w885-pct]');return !!pct&&!el.classList.contains('w885-intro')&&pct.textContent===pct.dataset.text;},null,{timeout:10000});
}
async function screenshots(p,out,label){
 const show=async sel=>{
  await p.locator(sel).scrollIntoViewIfNeeded();
  await p.locator(sel).evaluate(el=>{
   let bottom=0;
   for(let y=0;y<Math.min(360,innerHeight/2);y+=12){let n=document.elementFromPoint(8,y);for(;n&&n!==document.body;n=n.parentElement){const css=getComputedStyle(n),r=n.getBoundingClientRect();if(['fixed','sticky'].includes(css.position)&&r.top<360&&r.bottom<innerHeight/2)bottom=Math.max(bottom,r.bottom);}}
   const r=el.getBoundingClientRect();scrollTo(0,scrollY+r.top-bottom-12);
  });
 };
 for(const [device,size]of[['desktop',{width:1440,height:1000}],['phone',{width:390,height:844}]]){
  await p.setViewportSize(size);await pauseHero(p);
  for(const [name,sel]of[['today','#where885'],['vms','.grp[data-disc="Variable message signs"]'],['other','.grp[data-disc="Other"]']]){
   await show(sel);
   // The element capture makes Playwright finish its own scrolling before the viewport evidence.
   const height=Math.ceil((await p.locator(sel).boundingBox()).height);
   if(height>size.height-350){await p.setViewportSize({...size,height:Math.max(size.height,height+370)});await show(sel);}
   await p.locator(sel).screenshot({path:path.join(out,label+'-'+(name==='today'?'hero':name+'-card')+'-'+device+'.png')});
   await p.setViewportSize(size);await show(sel);
   await p.screenshot({path:path.join(out,label+'-'+name+'-'+device+'.png')});
  }
 }
}

(async()=>{
 for(const k of ['BASE','CANDIDATE','CANDIDATE_SHA','STATE','OUT'])assert(process.env[k],k+' required');
 const repo=path.resolve(__dirname,'../../..'),out=path.resolve(process.env.OUT),candidate=path.resolve(process.env.CANDIDATE),state=path.resolve(process.env.STATE);
 assert(out!==repo&&!out.startsWith(repo+path.sep),'Private evidence must be outside repository');fs.mkdirSync(out,{recursive:true});
 assert.equal(sha(fs.readFileSync(process.env.BASE)),BASE_SHA,'Exact predecessor required');
 assert.equal(sha(fs.readFileSync(candidate)),process.env.CANDIDATE_SHA,'Exact candidate required');
 const stateSha=sha(fs.readFileSync(state)),fixture=JSON.parse(fs.readFileSync(state,'utf8'));
 const report={author:'Andrew Fisher',baseSha256:BASE_SHA,candidateSha256:process.env.CANDIDATE_SHA,stateSha256:stateSha,record:fixture.version,models:{},checks:0};
 const save=()=>fs.writeFileSync(path.join(out,'completion-native.json'),JSON.stringify(report,null,2)+'\n');
 for(const[label,file]of[['base',process.env.BASE],['candidate',candidate]]){
  process.env.PAGE=file;process.env.INITIAL_HASH='#today';const h=await openCandidate();
  try{
   const days={};for(const day of ['2026-10-22','2026-10-23','2026-10-29'])days[day]=await h.page.evaluate(read,day);
   report.models[label]={baseline:h.baseline,days};save();
   await pauseHero(h.page);
   await h.page.waitForFunction(()=>{const el=document.querySelector('#where885'),pct=el?.querySelector('[data-w885-pct]');return !!pct&&!el.classList.contains('w885-intro')&&pct.textContent===pct.dataset.text;},null,{timeout:30000});
   const visible=await h.page.evaluate(dom);
   const value={baseline:h.baseline,days,dom:visible,runtimeErrors:h.errors,consoleErrors:h.consoleErrors,writes:h.counts.blocked};
   report.models[label]=value;save();
   assert.deepEqual(h.errors,[],'No '+label+' runtime error');assert.deepEqual(h.consoleErrors,[],'No '+label+' console error');assert.equal(h.counts.blocked,0,'No operational write attempts');
   assert.deepEqual(docsCanonical(visible.docs),docsCanonical(fixture.docs),'All native documents unchanged after '+label+' model reads');
   assert.deepEqual(visible.queue,{inflight:0,queued:0},'No queued '+label+' record mutations');
   await screenshots(h.page,out,label);
   const afterVisual=await h.page.evaluate(dom);value.afterVisual={queue:afterVisual.queue,docsSha256:sha(JSON.stringify(canonical(afterVisual.docs))),writes:h.counts.blocked,runtimeErrors:[...h.errors],consoleErrors:[...h.consoleErrors]};save();
   assert.deepEqual(h.errors,[],'No '+label+' runtime error after viewport and screenshot lifecycle');assert.deepEqual(h.consoleErrors,[],'No '+label+' console error after viewport and screenshot lifecycle');assert.equal(h.counts.blocked,0,'No operational writes after visual navigation');
   assert.deepEqual(afterVisual.queue,{inflight:0,queued:0},'No queued '+label+' writes after visual navigation');assert.deepEqual(docsCanonical(afterVisual.docs),docsCanonical(fixture.docs),'All '+label+' native documents unchanged after visual navigation');
   console.log('Captured '+label+' native completion, physical readings and screenshots');
  }catch(error){
   report.models[label]=report.models[label]||{baseline:h.baseline};
   report.models[label].failure={message:error.message,hero:await h.page.evaluate(()=>{const el=document.querySelector('#where885'),t=el?.querySelector('[data-w885-pct]');return {shown:t?.textContent,target:t?.dataset.text,intro:el?.classList.contains('w885-intro'),motion:el?.querySelector('[data-w885-motion]')?.getAttribute('aria-pressed')};}).catch(()=>null),runtimeErrors:h.errors,consoleErrors:h.consoleErrors,writes:h.counts.blocked};save();
   await h.page.screenshot({path:path.join(out,label+'-failure.png')}).catch(()=>{});throw error;
  }finally{await h.browser.close();}
 }
 const B=report.models.base,A=report.models.candidate;
 const same=(a,b,msg)=>{assert.deepEqual(canonical(a),canonical(b),msg);report.checks++;};
 const yes=(condition,msg)=>{assert(condition,msg);report.checks++;};
 same([A.baseline.version,A.baseline.stateSha256],[B.baseline.version,B.baseline.stateSha256],'Exactly the same native record');
 for(const day of ['2026-10-22','2026-10-23','2026-10-29']){
  const before=B.days[day],after=A.days[day];
  same(after.actualDay,before.actualDay,day+' same native current day');
  same(after.physical,before.physical,day+' native physical presence, stock, arrival and departure unchanged');
  same(after.vms.boards.map(b=>pick(b,['key','delivery','on','installed','received','remaining','departure1211','evidence'])),before.vms.boards.map(b=>pick(b,['key','delivery','on','installed','received','remaining','departure1211','evidence'])),day+' VMS physical and departure readings unchanged');
  same(after.completion.asOf,'2026-10-23'===day||day>'2026-10-23'?'2026-10-23':day,day+' existing race-weekend cutoff preserved');
  for(const id of ['buildings','toilets','generators','lighting','equipment'])same(after.completion.summary[id],before.completion.summary[id],day+' already complete '+id+' readings preserved');
 }
 const beforeDepart=B.days['2026-10-22'].vms;
 yes(beforeDepart.boards.every(b=>b.done),'Native pre-departure VMS evidence proves completion for the entire scope');
 for(const day of ['2026-10-23','2026-10-29']){
  const a=A.days[day],b=B.days[day];
  same(a.vms.done,beforeDepart.done,day+' departures preserve the natively established completed VMS scope');
  same(a.vms.total,beforeDepart.total,day+' completed scope count not inflated');
  yes(a.vms.done>a.vms.on,day+' achieved completion is distinct from current presence');
  const target=a.vms.boards.find(x=>x.key==='VMS23');yes(target.done&&!target.on,day+' recorded departed VMS stays complete and off site');
  const laser=a.completion.types.equipment.find(x=>x.name==='Laserplane');yes(laser&&laser.done===laser.total&&laser.total===1,day+' authoritative historical Laserplane completion retained');
  yes(a.completion.index.ready&&a.completion.index.rows.every(x=>x.min===100&&x.max===100),day+' each native index category establishes full achievement');
  same(a.completion.index.pct,{min:100,max:100},day+' equal-category index reflects its source category achievements');
  same(a.completion.index.allGreen,true,day+' all seven native categories confirm achievement without a false review state');
  same(a.completion.summary.vms.reviewQuantity,0,day+' informational departure does not create a completion review');
 }
 const other=A.dom.cards.find(x=>x.disc==='Other');yes(other,'Actual Other By group card exists');
 const laserRow=other.table.find(row=>row[0]==='Laserplane');yes(laserRow,'Actual Laserplane By type row exists');
 yes(other.table[0].some(x=>/complete/i.test(x)),'By type labels its completion count explicitly');
 const completeCol=other.table[0].findIndex(x=>/complete/i.test(x));
 same(laserRow[completeCol],'1','Visible Laserplane achieved completion is one');
 const physicalLabel=other.facts.findIndex(x=>/on site.*on hire/i.test(x));yes(physicalLabel>=0,'Group card retains an explicitly separate physical on-site reading');
 same(other.facts[physicalLabel+1],'4','Visible Other physical count remains four');
 const laserPhysical=A.days['2026-10-23'].physical.find(x=>x.key==='EQ0006');same(laserPhysical.unitsOn,0,'Laserplane native physical on-site count remains zero');
 yes(/5\s+of\s+5/.test(other.number),'Visible Other headline is five of five achieved');
 const mat=A.dom.cards.find(x=>x.disc==='Ground protection'),matType=A.days['2026-10-23'].completion.types.equipment.find(x=>x.name==='Trakmat');
 yes(mat&&matType&&matType.done===null,'Native track-mat completion remains uncertain');
 const matRow=mat.table.find(row=>/^trakmat$/i.test(row[0]));yes(matRow,'Actual Track mat type row exists');
 same(matRow[mat.table[0].findIndex(x=>/complete/i.test(x))],'—','Unknown native Track mat unit does not become a completed quantity');
 yes(/quantity to confirm/i.test(mat.text),'Visible Track mat card explains the unresolved completion quantity');
 same(A.dom.hero.report.pct,{min:100,max:100},'Actual Where-we-are native hero reads full achievement');
 yes(/100(?:\.0+)?/.test(A.dom.hero.report.shown),'Visible completed hero number settled at 100');
 same(sha(fs.readFileSync(candidate)),process.env.CANDIDATE_SHA,'Candidate unchanged through native checks');same(sha(fs.readFileSync(state)),stateSha,'Frozen record unchanged');
 report.status='PASS';save();
 console.log(JSON.stringify({status:'PASS',checks:report.checks,record:report.record,baseSha256:BASE_SHA,candidateSha256:process.env.CANDIDATE_SHA,stateSha256:stateSha,runtimeErrors:0,consoleErrors:0,writes:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
