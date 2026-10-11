// Author: Andrew Fisher. Private preview QA. Harness aborts every operational write.
// PAGE=<candidate> EXPECTED_SHA=<sha> [BASELINE=<live v9.92>] MOB=0|1 node tests/iteration2.cjs
// Run only under the shared /tmp/gc500-browser.lock. No video or service mutations.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const {open} = require('../../toolchain/harness/open_page');
const mobile = process.env.MOB === '1', width = mobile ? 390 : 1440, height = mobile ? 844 : 960;
const out = process.env.OUTDIR || '/workspace/private-gc500-v993-preview/iteration2/' + (mobile ? 'phone' : 'desktop');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const checks = [], failures = [];
const check = (ok, name, detail) => { checks.push({name, pass:!!ok, ...(detail === undefined ? {} : {detail})}); if (!ok) failures.push(name); };
fs.mkdirSync(out, {recursive:true});

async function ready(h) {
 await h.page.waitForFunction(() => SYNC.status === 'live' && SYNC.first.size === Object.keys(SYNC_COLLS).length && DOCS.state === 'ready', null, {timeout:150000});
 await h.page.evaluate(() => { state.asOf = todayIso(); go('today'); renderToday(); });
 // Native pricing/source annotations initialise lazily on the first draw.
 await h.page.waitForTimeout(400);
 await h.page.evaluate(() => renderToday());
 await h.page.waitForTimeout(400);
}
async function todaySnapshot(p) {
 // Observe the native count-up reaching its recorded target; never stop weather/lamp motion.
 await p.waitForFunction(() => {
  const n=document.querySelector('#pane-today [data-w885-pct]');
  return !n || n.textContent===n.dataset.text;
 }, null, {timeout:10000});
 return p.evaluate(() => {
  const pane = document.getElementById('pane-today'), head = pane.querySelector(':scope > .acts793 > .head');
  const text = n => n?.textContent.replace(/\s+/g, ' ').trim() || '';
  const rect = n => { if (!n) return null; const r=n.getBoundingClientRect(); return {width:r.width,height:r.height,left:r.left,right:r.right,overflow:n.scrollWidth-n.clientWidth}; };
  const staff = pane.querySelector(':scope > .staff988'), model = DailyStaff988.day(todayIso());
  const control = id => { const ns=[...pane.querySelectorAll('#'+id)], n=ns[0]; return {count:ns.length,tag:n?.tagName,type:n?.type,value:n?.value,text:text(n),href:n?.getAttribute('href'),date:n?.dataset.mailasof,readonly:n?.hasAttribute('data-ro')}; };
  const controls = Object.fromEntries(['asOf','emailProgress','printProgress','showStart'].map(id=>[id,control(id)]));
  return {
   record:JSON.stringify(S), metrics:JSON.stringify(todayWorkMetrics840(todayWorkDay841())),
   groups:JSON.stringify(todayGroupDetails841(state.asOf)),
   controls, operator:{count:head?.querySelectorAll('.today876-who').length,text:text(head?.querySelector('.today876-who'))},
   nav:[...head.querySelectorAll('.jump95 .jb95')].map(n=>({text:text(n),handler:typeof n.onclick==='function'})),
   navCount:head.querySelectorAll('.jump95').length,
   where:{count:pane.querySelectorAll('#where885').length,text:text(pane.querySelector('#where885'))},
   work:{count:pane.querySelectorAll('#gc500-work-board840').length,text:text(pane.querySelector('#gc500-work-board840'))},
   gauges:[...pane.querySelectorAll('#where885 [role="img"],#where885 [data-w885-group],#gc500-work-board840 .tw846-qty')].map(n=>({tag:n.tagName,label:n.getAttribute('aria-label'),text:text(n)})),
   staff:{count:pane.querySelectorAll(':scope > .staff988').length,day:staff?.dataset.staff988Day,token:staff?.dataset.staff988Token,
    model:{ready:model.ready,count:model.count,names:model.names,unnamed:model.unnamed},
    heading:text(staff?.querySelector('.staff988-heading>strong')),empty:text(staff?.querySelector('.staff988-empty')),
    names:[...staff.querySelectorAll('.staff988-names>li:not(.staff988-unnamed)')].map(text),
    edit:!!staff.querySelector('[data-staff988-edit]'),canEdit:capability()==='edit'&&!SYNC.readonly&&todayIso()>=todayIso()&&model.ready,
    fold:!!staff.querySelector('.today993-staff-fold'),foldOpen:staff.querySelector('.today993-staff-fold')?.open||false,
    summaryDate:staff.querySelector('.today993-staff-fold > summary time')?.dateTime||null},
   geometry:{controls:rect(head.closest('.acts793')),staff:rect(staff),where:rect(pane.querySelector('#where885')),documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}
  };
 });
}
async function buildSnapshot(p, day) {
 await p.evaluate(day => { state.day=day;state.tlLoad=null;go('timeline');renderTimeline(); }, day);
 await p.waitForTimeout(300);
 return p.evaluate(() => {
  const allowed=['forklift','tilt-tray','crane-truck','franna','onsite-crane','none'];
  const cards=[...document.querySelectorAll('#pane-timeline .lc991')].map(card=>{
   const g=Loading931.findLoad(state.day,card.dataset.tl846Load), products=Loading931.loadProducts931(g);
   const nativeFacts=products.flatMap(p=>p.facts.filter(f=>/\d/.test(f.values.join(' · '))&&/\b(?:mm|kg)\b/.test(f.values.join(' · '))).map(f=>({ref:p.ref,item:p.item,label:f.label,value:f.values.join(' · ')})));
   const facts=[...card.querySelectorAll('.lc991-summary .lc992-product')].flatMap(p=>[...p.querySelectorAll(':scope > .r931-fact')].map(f=>({ref:p.dataset.loadRef992,item:p.dataset.r931Product,label:f.querySelector(':scope > span')?.textContent,value:f.querySelector(':scope > strong')?.textContent})));
   const refs=[...card.querySelectorAll('.lc991-summary .tl841-ref')].map(ref=>{
    const asset=assetOf(ref.dataset.tl841Ref), method=handling875Record(asset), state=timeline841State(asset), unload=[...ref.querySelectorAll('.lc993-unload')];
    return {ref:ref.dataset.tl841Ref,status:ref.querySelector('.tl841-status')?.textContent,nativeStatus:state.label,
     stage:+ref.querySelector('.tl841-gantry')?.dataset.tl841Stage,nativeStage:state.stage,gantries:ref.querySelectorAll('.tl841-gantry').length,
     lampCount:ref.querySelectorAll('.tl841-gantry .tl841-lamp').length,
     method:method?.method||null,source:method?.source||null,
     expectedUnload:method&&allowed.includes(method.method)?handling875Words(method.method)+(method.source?' · Schedule':''):null,
     unload:unload.map(n=>({method:n.dataset.unloadMethod993,text:n.textContent,visible:!!n.getClientRects().length})),
     nativeEditor:!!card.querySelector('[data-handling875-ref="'+CSS.escape(ref.dataset.tl841Ref)+'"]')};
   });
   const r=card.getBoundingClientRect();return {id:card.dataset.tl846Load,nativeFacts,facts,refs,geometry:{width:r.width,height:r.height,left:r.left,right:r.right,overflow:card.scrollWidth-card.clientWidth}};
  });
  return {day:state.day,record:JSON.stringify(S),cards,documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
 });
}
async function align(p, selector) {
 await p.locator(selector).first().evaluate(n=>{const sc=ldScroller(n),main=document.querySelector('main'),header=document.querySelector('header.top'),top=Math.max(main?.getBoundingClientRect().top||0,header?.getBoundingClientRect().bottom||0)+10;sc.scrollTo({top:sc.scrollTop+n.getBoundingClientRect().top-top,behavior:'instant'});});
 await p.waitForTimeout(250);
}
const publicToday = t => ({controls:t.controls,operator:t.operator,nav:t.nav,where:t.where,work:t.work,gauges:t.gauges,staff:t.staff,geometry:t.geometry,recordSha:sha(t.record),metricsSha:sha(t.metrics),groupsSha:sha(t.groups)});

(async()=>{
 const pageFile=process.env.PAGE;assert(pageFile&&process.env.EXPECTED_SHA,'PAGE and EXPECTED_SHA required');
 const candidateSha=sha(fs.readFileSync(pageFile));assert.equal(candidateSha,process.env.EXPECTED_SHA,'Exact candidate hash');
 let baseline=null;
 if(process.env.BASELINE){
  const h=await open({pageFile:process.env.BASELINE,hash:'#today',W:width,H:height,mobile});
  try { await ready(h);const today=await todaySnapshot(h.page), monday=await buildSnapshot(h.page,'2026-10-12'),wednesday=await buildSnapshot(h.page,'2026-10-14');baseline={sha:sha(fs.readFileSync(process.env.BASELINE)),today,monday,wednesday};check(h.errors.length===0&&h.counts.blocked===0,'Baseline capture clean',{errors:h.errors,writes:h.counts.blocked}); } finally { await h.browser.close(); }
 }
 const h=await open({pageFile,hash:'#today',W:width,H:height,mobile}),p=h.page;
 const evidence={author:'Andrew Fisher',previewOnly:true,published:false,mobile,width,height,sha256:candidateSha,checks,failures};
 try {
  await ready(h);check(await p.evaluate(()=>!!window.TodayTop993),'Today preview controller installed');
  const before=await todaySnapshot(p);evidence.today=publicToday(before);
  check(Object.values(before.controls).every(c=>c.count===1),'Date/email/print/showcase native controls retained once');
  check(before.operator.count===1,'Native operator area retained once');
  check(before.controls.asOf.type==='date'&&before.controls.asOf.readonly&&before.controls.emailProgress.href?.startsWith('mailto:'),'Native date filter and email hooks retained');
  check(before.navCount===1&&before.nav.length>=5&&before.nav.every(n=>n.handler),'Original secondary navigation retained once with native handlers');
  check(before.where.count===1&&before.work.count===1&&before.gauges.length>0,'Where we are, work board and numeric gauges retained');
  check(before.staff.count===1&&JSON.stringify(before.staff.names)===JSON.stringify(before.staff.model.names)&&before.staff.edit===before.staff.canEdit,'Native daily availability values and access rules retained');
  const missing=before.staff.model.ready&&before.staff.model.count===null&&before.staff.model.names.length===0;
  check(before.staff.fold===missing,'Only native no-record staff is folded',before.staff);
  if(missing){check(before.staff.heading==='Not recorded'&&before.staff.empty==='No availability recorded.','No-record availability never presented as zero');check(!before.staff.foldOpen,'No-record staff starts folded');}
  await p.screenshot({path:path.join(out,'today-initial.png')});
  await align(p,'#pane-today > .acts793');await p.screenshot({path:path.join(out,'today-closed.png')});
  console.log('Screenshots ready: '+path.join(out,'today-initial.png')+' and today-closed.png');
  const actions=()=>p.locator('#pane-today .today993-actions-fold');
  await actions().locator(':scope > summary').focus();await p.keyboard.press('Enter');
  check(await actions().evaluate(n=>n.open),'Actions opens with keyboard');
  check(await actions().locator('#emailProgress').isVisible()&&await actions().locator('#printProgress').isVisible()&&await actions().locator('.jump95').isVisible(),'Actions contains original secondary controls');
  await p.screenshot({path:path.join(out,'today-actions-open.png')});
  const mountedIdentity=await p.evaluate(()=>{const fold=document.querySelector('#pane-today .today993-actions-fold'),nodes=[fold,...fold.querySelectorAll('#emailProgress,#printProgress,.jump95')];TodayTop993.mount();TodayTop993.mount();return nodes.every(n=>n.isConnected)&&nodes[0]===document.querySelector('#pane-today .today993-actions-fold');});
  check(mountedIdentity,'Repeated mount retains existing controls and listener-bearing nodes');
  await p.evaluate(()=>{pack795();pack795();renderToday();pack795();});
  const redraw=await todaySnapshot(p);check(await actions().evaluate(n=>n.open),'Actions open state survives native pack/render');
  check(JSON.stringify(redraw.controls)===JSON.stringify(before.controls)&&JSON.stringify(redraw.nav)===JSON.stringify(before.nav)&&redraw.navCount===1,'Repeated native render/pack keeps controls and navigation once');
  const refreshComparison={metrics:redraw.metrics===before.metrics,groups:redraw.groups===before.groups,where:JSON.stringify(redraw.where)===JSON.stringify(before.where),work:JSON.stringify(redraw.work)===JSON.stringify(before.work),gauges:JSON.stringify(redraw.gauges)===JSON.stringify(before.gauges)};
  check(Object.values(refreshComparison).every(Boolean),'Original models, category counts and gauge readings unchanged by layout refresh',refreshComparison);
  if(!Object.values(refreshComparison).every(Boolean))fs.writeFileSync(path.join(out,'refresh-difference.json'),JSON.stringify({before:publicToday(before),after:publicToday(redraw)},null,2));
  await actions().locator(':scope > summary').click();check(!(await actions().evaluate(n=>n.open)),'Actions closes');
  // Immediate close/re-render must not depend on the browser delivering a queued toggle event.
  check(await p.evaluate(()=>{const n=document.querySelector('#pane-today .today993-actions-fold');n.open=true;renderToday();const a=document.querySelector('#pane-today .today993-actions-fold').open;document.querySelector('#pane-today .today993-actions-fold').open=false;renderToday();return a&&!document.querySelector('#pane-today .today993-actions-fold').open;}),'Actions immediate toggle/redraw preserves state');
  if(missing){
   check(before.staff.summaryDate===before.staff.day,'Collapsed no-record staff displays actual native availability date');
   const nativeRefresh=await p.evaluate(()=>['syncFooter','availability'].map(kind=>{const refresh=kind==='syncFooter'?()=>syncFooter():()=>DailyStaff988.refresh();let n=document.querySelector('#pane-today .today993-staff-fold');n.open=true;refresh();n=document.querySelector('#pane-today .today993-staff-fold');const afterOpen=!!n?.open;if(n)n.open=false;refresh();n=document.querySelector('#pane-today .today993-staff-fold');return {kind,afterOpen,afterClose:!!n&&!n.open};}));
   check(nativeRefresh.every(x=>x.afterOpen&&x.afterClose),'Both native availability refresh paths retain no-record fold and immediate open/close state',nativeRefresh);
   await p.locator('#pane-today .today993-staff-fold > summary').click();
   await align(p,'#pane-today > .acts793');await p.screenshot({path:path.join(out,'today-staff-open.png')});
   check(await p.locator('#pane-today .today993-staff-body .staff988-heading').isVisible(),'Folded staff retains accessible original availability details');
   await p.locator('#pane-today .today993-staff-fold > summary').click();
  }
  await p.locator('#asOf').fill('2026-10-09');await p.locator('#asOf').dispatchEvent('change');await p.waitForTimeout(300);
  const historicStaff=await todaySnapshot(p);
  check(historicStaff.controls.asOf.value==='2026-10-09'&&historicStaff.staff.day===before.staff.day&&historicStaff.staff.summaryDate===before.staff.summaryDate,'Historical progress date does not mislabel current native staff availability');
  await p.locator('#asOf').fill(before.controls.asOf.value);await p.locator('#asOf').dispatchEvent('change');await p.waitForTimeout(300);
  // Detached helper fixture: never change any real reference, shared record or plant booking.
  const methodFixtures=await p.evaluate(()=>{
   const oldAsset=window.assetOf,oldRecord=window.handling875Record,result=[];
   try{
    for(const method of [null,'','to-confirm','not-required','none','onsite-crane','tilt-tray','forklift','crane-truck','franna']){
     const key='__QA_METHOD_FIXTURE__',card=document.createElement('div');card.className='lc991';card.innerHTML='<div class="lc991-summary"><span class="tl841-ref" data-tl841-ref="'+key+'"><span class="ld-w">Detached QA fixture only</span></span></div><div class="lc991-detail"></div>';
     window.assetOf=ref=>ref===key?{key}:oldAsset(ref);window.handling875Record=a=>a?.key===key?(method===null?null:{method,by:'Detached test fixture',at:'2026-10-10T00:00:00Z'}):oldRecord(a);
     LoadLights992.refreshCard(card);LoadLights992.refreshCard(card);
     result.push({method,shown:[...card.querySelectorAll('.lc993-unload')].map(n=>n.textContent)});
    }
   }finally{window.assetOf=oldAsset;window.handling875Record=oldRecord;}
   return result;
  });evidence.detachedMethodFixtures=methodFixtures;
  const absent=[null,'','to-confirm','not-required'];
  check(methodFixtures.filter(x=>absent.includes(x.method)).every(x=>x.shown.length===0),'Detached fixture: missing, unconfirmed and crane-only exclusion produce no invented method');
  check(methodFixtures.find(x=>x.method==='none').shown.join('')==='No unloading required','Detached fixture: explicit none retains its distinct meaning');
  check(methodFixtures.find(x=>x.method==='onsite-crane').shown.join('')==='On-site crane unloading · type to confirm','Detached fixture: unspecified crane retains qualification');
  check(methodFixtures.filter(x=>!absent.includes(x.method)).every(x=>x.shown.length===1),'Detached fixture: repeated refresh never duplicates method captions');
  const monday=await buildSnapshot(p,'2026-10-12');evidence.monday=monday;
  for(const build of [monday]){
   check(build.cards.length===6,'Six native Monday loads retained');
   check(build.cards.every(c=>JSON.stringify(c.nativeFacts)===JSON.stringify(c.facts)),'Build numeric facts, product references and qualification labels exactly match native model');
   check(build.cards.every(c=>c.refs.every(r=>r.status===r.nativeStatus&&r.stage===r.nativeStage&&r.gantries===1&&r.lampCount===5)),'Native status and one complete light gantry retained per reference');
   check(build.cards.every(c=>c.refs.every(r=>r.expectedUnload===null?r.unload.length===0:r.unload.length===1&&r.unload[0].text===r.expectedUnload&&r.unload[0].method===r.method&&r.unload[0].visible)),'Recorded unload captions match native method and provenance; no inferred methods');
  }
  await align(p,'#pane-timeline .lc991');await p.screenshot({path:path.join(out,'build-monday.png')});
  await p.locator('#pane-timeline .lc991').first().screenshot({path:path.join(out,'build-closed-card.png')});
  const wednesday=await buildSnapshot(p,'2026-10-14');evidence.wednesday=wednesday;
  evidence.buildingSources=await p.evaluate(()=>['P25','P66','P65','P67'].map(ref=>{
   const a=assetOf(ref),card=[...document.querySelectorAll('#pane-timeline .lc991')].find(c=>c.querySelector('[data-tl841-ref="'+ref+'"]'));
   const load=Loading931.findLoad(state.day,card.dataset.tl846Load);
   return {ref,assetNumbers:asset873Numbers(a),facts:Loading931.loadProducts931(load)};
  }));
  check(wednesday.cards.length===4&&JSON.stringify(wednesday.cards.flatMap(c=>c.refs.map(r=>r.ref)))===JSON.stringify(['P25','P66','P65','P67']),'Four Wednesday loads retain native order');
  check(wednesday.cards.every(c=>c.refs.every(r=>r.method==='tilt-tray'&&r.unload.length===1&&r.unload[0].text===r.expectedUnload&&r.unload[0].visible)),'Wednesday four recorded tilt-tray instructions are visible');
  check(wednesday.cards.every(c=>JSON.stringify(c.nativeFacts)===JSON.stringify(c.facts)&&c.refs.every(r=>r.status===r.nativeStatus&&r.stage===r.nativeStage&&r.gantries===1)),'Wednesday original facts/status/lights remain unchanged');
  await align(p,'#pane-timeline .lc991');await p.screenshot({path:path.join(out,'build-wednesday.png')});
  for(const [name,s] of [['Monday',monday],['Wednesday',wednesday]])check(s.documentOverflow<=1&&s.cards.every(c=>c.geometry.left>=-1&&c.geometry.right<=width+1&&c.geometry.overflow<=1),name+' cards fit viewport without horizontal overflow',s.cards.map(c=>c.geometry));
  check(before.geometry.documentOverflow<=1&&[before.geometry.controls,before.geometry.staff].every(r=>r&&r.left>=-1&&r.right<=width+1&&r.overflow<=1),'Today leading controls and availability fit viewport');
  const finalRecord=await p.evaluate(()=>JSON.stringify(S));check(finalRecord===before.record,'All interactions and detached fixtures preserve the shared record exactly');
  evidence.noBookingInference='Captions show recorded reference instructions only. No plant booking, truck-type inference or method inferred from loading guides.';
  if(baseline){
   evidence.baseline={sha:baseline.sha,today:publicToday(baseline.today),mondayGeometry:baseline.monday.cards.map(c=>c.geometry),wednesdayGeometry:baseline.wednesday.cards.map(c=>c.geometry)};
   const sameRecord=baseline.today.record===before.record;check(sameRecord,'Baseline and candidate use identical shared records');
   if(sameRecord){
    check(JSON.stringify(baseline.today.controls)===JSON.stringify(before.controls)&&JSON.stringify(baseline.today.operator)===JSON.stringify(before.operator)&&JSON.stringify(baseline.today.nav)===JSON.stringify(before.nav),'Exact native Today controls/operator/navigation match v9.92');
    check(baseline.today.metrics===before.metrics&&baseline.today.groups===before.groups&&JSON.stringify(baseline.today.where)===JSON.stringify(before.where)&&JSON.stringify(baseline.today.work)===JSON.stringify(before.work)&&JSON.stringify(baseline.today.gauges)===JSON.stringify(before.gauges),'Where we are, category models and displayed numeric gauges match v9.92');
    for(const name of ['monday','wednesday']){const current=name==='monday'?monday:wednesday;check(JSON.stringify(baseline[name].cards.map(c=>({id:c.id,facts:c.facts,refs:c.refs.map(r=>({ref:r.ref,status:r.status,stage:r.stage}))})))===JSON.stringify(current.cards.map(c=>({id:c.id,facts:c.facts,refs:c.refs.map(r=>({ref:r.ref,status:r.status,stage:r.stage}))}))),name+' numeric facts and native statuses match v9.92');}
   }
   evidence.compactness={todayControls:{before:baseline.today.geometry.controls.height,after:before.geometry.controls.height},todayStaff:{before:baseline.today.geometry.staff.height,after:before.geometry.staff.height},mondayCards:monday.cards.map((c,i)=>({id:c.id,before:baseline.monday.cards[i]?.geometry.height,after:c.geometry.height})),wednesdayCards:wednesday.cards.map((c,i)=>({id:c.id,before:baseline.wednesday.cards[i]?.geometry.height,after:c.geometry.height}))};
  }
  check(h.errors.length===0,'No browser errors',h.errors);check(h.counts.blocked===0,'No attempted operational writes',h.counts.blocked);
  evidence.errors=h.errors;evidence.writes=h.counts.blocked;
  delete evidence.monday.record;delete evidence.wednesday.record;
 } catch(e){failures.push(e.message);evidence.error=e.stack;} finally {await h.browser.close();}
 evidence.pass=failures.length===0;evidence.completedChecks=checks.length;
 fs.writeFileSync(path.join(out,'iteration2.json'),JSON.stringify(evidence,null,2));
 console.log(JSON.stringify({out,pass:evidence.pass,checks:checks.length,failures,compactness:evidence.compactness},null,2));
 process.exitCode=evidence.pass?0:1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
