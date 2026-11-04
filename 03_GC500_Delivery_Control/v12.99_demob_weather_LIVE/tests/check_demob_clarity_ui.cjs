/* Author: Andrew Fisher. Native read-only before/after Demob card packing checks.
 * Run with PAGE and private OUT; BASELINE=1 captures the original arrangement.
 * flock /tmp/gc500-browser.lock env PAGE=... OUT=... node this-file
 */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const {open}=require('../../toolchain/harness/open_page');
const OUT=process.env.OUT,BASELINE=process.env.BASELINE==='1',LIVE=process.env.LIVE==='1';
assert(OUT&&path.isAbsolute(OUT)&&(process.env.PAGE||LIVE),'PAGE or LIVE=1 and private absolute OUT required');
assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../../..')+path.sep),'Keep native evidence outside the repository');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const write=(name,data)=>fs.writeFileSync(path.join(OUT,name),JSON.stringify(data,null,2));
async function day(p,date,mode){
 await p.evaluate(date=>{DM816.view='everything';DM816.sel=date;go('demob');renderDemob816();},date);
 const sel='#pane-demob .dc996-day[data-dday816="'+date+'"]',card=p.locator(sel);
 await card.waitFor();await card.scrollIntoViewIfNeeded();
 await p.waitForFunction(sel=>document.querySelector(sel)?.querySelector('.dp1238'),sel,{timeout:30000});
 await card.screenshot({path:path.join(OUT,mode+'-day-'+date+'.png')});
 await p.screenshot({path:path.join(OUT,mode+'-day-'+date+'-context.png')});
 await card.locator('.bc984-crew').scrollIntoViewIfNeeded();
 await p.screenshot({path:path.join(OUT,mode+'-day-'+date+'-lower-context.png')});
 const data=await card.evaluate(card=>{
  const box=n=>n?{x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth}:null;
  const row=card.querySelector('.bc984-load-row'),heading=row?.querySelector(':scope>.bc984-label'),list=row?.querySelector('.dl1238');
  return {date:card.dataset.dday816,width:card.clientWidth,scrollWidth:card.scrollWidth,row:box(row),heading:box(heading),list:box(list),rowDisplay:getComputedStyle(row).display,
   lines:[...card.querySelectorAll('.dl1238>span')].map(n=>({text:n.innerText,box:box(n),description:box(n.querySelector('s')),ref:n.querySelector('b')?.textContent,time:n.querySelector('time')?.textContent})),
   weather:card.querySelector('.bc984-weather-reading')?.innerText,staff:card.querySelector('.bc984-crew')?.innerText,summary:card.querySelector('.bc986-work')?.innerText,summaryHtml:card.querySelector('.bc986-work')?.outerHTML,
   summaryRows:[...card.querySelectorAll('.bc986-work-row')].map(n=>({label:n.querySelector('.bc986-work-label').textContent,value:n.querySelector('.bc986-work-value').textContent})),progress:card.querySelector('.dp1238')?.innerText};
 });
 assert(data.scrollWidth<=data.width+1,mode+' '+date+' day card fits');assert(data.weather&&data.staff&&data.summary&&data.progress,'Native day components retained');
 if(!BASELINE&&data.list){
  assert.equal(data.rowDisplay,'block');assert(data.list.y>=data.heading.y+data.heading.height-1,'List follows its heading');
  assert(data.list.width>=data.row.width-1,'List uses the full existing row width');
  assert(data.list.scrollWidth<=data.list.clientWidth+1,'List does not overflow horizontally');
  assert(data.list.height<=133,'Existing bounded list height retained');
  for(const line of data.lines)assert(line.box.scrollWidth<=line.box.clientWidth+1,'Description and asset numbers wrap inside their row');
 }
 if(!BASELINE){
  const native=await p.evaluate(date=>{const lists=Singles1238.dayLists(date),last=lists.left.reduce((a,b)=>b.at&&b.at>a?b.at:a,'');return {last:last?new Date(Date.parse(last)+36000000).toISOString().slice(11,16):null,rows:Ready1231.dayRows(date)};},date);
  assert(data.summaryRows.every(row=>row.label!=='Picked up'),'The daily picked-up count appears only in the progress panel');
  assert.deepEqual(data.summaryRows,native.rows.map(r=>({label:r.label,value:String(r.value)})),'Summary retains the native last-pickup and ready facts');
  if(native.last)assert(data.summaryRows.some(r=>r.label==='Last pickup'&&r.value===native.last),'Last pickup time retained');
  if(date==='2026-11-05')assert(data.summaryRows.some(r=>r.label==='Ready for collection'),'Current readiness retained');
 }
 return data;
}
async function equipment(p,mode){
 await p.evaluate(()=>{DM816.view='everything';go('demob');renderDemob816();});
 const cards=p.locator('#pane-demob .gg1238').first().locator(':scope > article.sg1238');await cards.first().waitFor();
 const packed=[];
 for(let i=0;i<Math.min(3,await cards.count());i++){
  const card=cards.nth(i);await card.scrollIntoViewIfNeeded();
  await card.screenshot({path:path.join(OUT,mode+'-equipment-'+i+'.png')});
  packed.push(await card.evaluate(c=>({key:c.dataset.sg1238,uid:c.dataset.u1238,height:c.getBoundingClientRect().height,width:c.clientWidth,scrollWidth:c.scrollWidth,gridAlign:getComputedStyle(c.parentElement).alignItems,cardAlign:getComputedStyle(c).alignContent,parts:[...c.children].map(n=>({class:n.className,height:n.getBoundingClientRect().height,text:n.innerText}))})));
 }
 if(!BASELINE)for(const c of packed){assert.equal(c.gridAlign,'start');assert.equal(c.cardAlign,'start');assert(c.scrollWidth<=c.width+1,'Equipment card fits');}
 const selected=await p.evaluate(()=>{
  const q=Singles1238.model().cards.map(c=>({c,L:Singles1238.mapLoc1297(c)})).find(x=>x.L?.demob1297.parts.length&&x.c.st.s!=='gone'&&document.querySelector('article.sg1238[data-sg1238="'+CSS.escape(x.c.key)+'"][data-u1238="'+CSS.escape(x.c.uid)+'"]'));
  if(!q)throw Error('Native source-outline card missing');Singles1238.goCard(q.c.key,q.c.uid);return {key:q.c.key,uid:q.c.uid};
 });
 const sel='#pane-demob article.sg1238[data-sg1238='+JSON.stringify(selected.key)+'][data-u1238='+JSON.stringify(selected.uid)+']';
 const map=p.locator(sel+' .ph1238');await map.scrollIntoViewIfNeeded();
 await p.waitForFunction(sel=>document.querySelectorAll(sel+' svg.mb1298 .mb1298-frame').length===3,sel,{timeout:120000});
 await map.screenshot({path:path.join(OUT,mode+'-retained-map-glow.png')});
 const glow=await p.locator(sel).evaluate(c=>({views:[...c.querySelectorAll('.mb1298-frame')].map(x=>x.dataset.view1298).sort(),rings:c.querySelectorAll('.mb1298-ring').length,outlines:c.querySelectorAll('.mb1298-outline').length,caption:c.querySelector('.map-note1297')?.innerText}));
 assert.deepEqual(glow.views,['close','site','wide']);assert.equal(glow.rings,3);assert(glow.outlines>0);
 return {packed,glow};
}
(async()=>{
 const hash=LIVE?null:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),reports=[];
 console.log((BASELINE?'Baseline ':'Candidate ')+hash);
 for(const mode of (process.env.MOB==='1'?['phone']:process.env.MOB==='0'?['desktop']:['desktop','phone'])){
  const s=await open({pageFile:LIVE?undefined:process.env.PAGE,hash:'#today',W:mode==='phone'?390:1440,H:mode==='phone'?844:1000,mobile:mode==='phone',dpr:1}),p=s.page,consoleErrors=[];
  p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,180));});
  try{
   await p.waitForFunction(()=>window.DemobCards996&&window.Singles1238&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
   const days=[];for(const date of ['2026-11-03','2026-11-05'])days.push(await day(p,date,mode));
   const cards=await equipment(p,mode),writes=await p.evaluate(()=>({inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
   assert.deepEqual(s.errors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(s.counts.blocked,0);assert.deepEqual(writes,{inflight:0,queued:0});
   const report={mode,days,...cards,errors:s.errors,consoleErrors,attemptedWrites:s.counts.blocked,writes};reports.push(report);write('report-'+mode+'.json',report);console.log('PASS '+mode+' native day/equipment layout '+(BASELINE?'baseline':'candidate'));
  }catch(error){await p.screenshot({path:path.join(OUT,mode+'-failure.png')}).catch(()=>{});throw error;}finally{await s.browser.close();}
 }
 if(!LIVE)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),hash);
 write('report.json',{author:'Andrew Fisher',passed:true,live:LIVE,baseline:BASELINE,hash,reports});
})().catch(error=>{write('failure.json',{message:error.message,stack:error.stack});console.error(error.stack);process.exitCode=1;});
