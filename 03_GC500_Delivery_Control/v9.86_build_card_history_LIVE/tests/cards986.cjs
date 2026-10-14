// Author: Andrew Fisher. Read-only native data and isolated browser-fixture checks.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
let servedHash;
if(process.env.PUBLIC==='1'){
 const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,...args){const result=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=crypto.createHash('sha256').update(result.body).digest('hex');return result;};
}
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1',out=process.env.OUTDIR;
 if(!publicMode)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#day/2026-10-09',mobile,W:mobile?390:1440,H:900}),p=h.page;
 let checks=0;const check=(ok,name)=>{assert(ok,name);checks++;};
 const card=()=>p.locator('#pane-timeline .bc984-day.on');
 const showDay=async iso=>{
  await p.evaluate(iso=>{state.day=iso;go('timeline');renderTimeline();},iso);await card().scrollIntoViewIfNeeded();
  await p.waitForFunction(iso=>{const el=document.querySelector('#pane-timeline .bc984-day.on');return el?.dataset.day===iso&&el.dataset.buildProgress!=='pending';},iso,{timeout:60000});
  await p.waitForTimeout(150);
 };
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
  if(process.env.NATIVE_ENTRY_ONLY==='1'){
   if(publicMode){check(h.counts.page===0,'No public HTML substitution');check(servedHash===process.env.EXPECTED_SHA,'Exact public bytes');}
   await p.evaluate(()=>{go('plant');state.day='2026-09-25';go('timeline');renderTimeline();});
   await p.waitForFunction(()=>document.querySelector('.bc984-day.on')?.dataset.buildProgress==='ready',null,{timeout:60000});
   await p.waitForTimeout(250);
   const visible=selector=>p.evaluate(selector=>{const n=document.querySelector('.bc984-day.on '+selector),r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,top=document.elementFromPoint(x,y);return {visible:x>=0&&x<=innerWidth&&y>=0&&y<=innerHeight&&!!top&&(n.contains(top)||top===n||top.closest('.bc984-day')===n.closest('.bc984-day')),hit:top?.className||null,top:r.top,bottom:r.bottom,scrollY,viewport:innerHeight};},selector);
   const week=await visible('.bc984-week');check(week.visible,'Native Build entry exposes week without sticky-nav overlap');
   if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/native-entry.png'});}
   await p.evaluate(()=>{const n=document.querySelector('.bc984-day.on .bc984-crew'),r=n.getBoundingClientRect();let parent=n.parentElement;while(parent&&!(/auto|scroll/.test(getComputedStyle(parent).overflowY)&&parent.scrollHeight>parent.clientHeight+1))parent=parent.parentElement;if(parent)parent.scrollBy(0,r.top-300);else window.scrollBy(0,r.top-300);});await p.waitForTimeout(600);
   const staff=await visible('.bc984-crew');
   if(out){await p.screenshot({path:out+'/native-staff-scroll.png'});fs.writeFileSync(out+'/native-entry-debug.json',JSON.stringify({week,staff},null,2));}
   check(staff.visible,'Ordinary page scrolling exposes staff without sticky-nav overlap');
   check(h.errors.length===0&&h.counts.blocked===0,'Native entry has no errors or operational writes');
   const result={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,week,staff,errors:0,writes:0};
   if(out)fs.writeFileSync(out+'/native-entry.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));return;
  }
  await showDay('2026-10-09');
  const before=await p.evaluate(()=>({native:JSON.stringify(S),money:JSON.stringify(pl770Model()),dates:calendarDays().map(d=>[d.iso,d.deliveries.map(r=>r.a.key),d.removals.map(r=>r.a.key)])}));
  if(publicMode){check(h.counts.page===0,'No public HTML substitution');check(servedHash===process.env.EXPECTED_SHA,'Exact public bytes');}
  await p.waitForFunction(()=>BuildProgress986.report().queued===0&&!BuildProgress986.report().scheduled,null,{timeout:60000});
  const lazy=await p.evaluate(()=>{
   const before=BuildProgress986.report();renderTimeline();const after=BuildProgress986.report(),cards=[...document.querySelectorAll('.bc984-day')],today=todayIso();
   return {before,after,past:cards.filter(c=>c.dataset.day<today).length,deferred:cards.filter(c=>c.dataset.day<today&&c.dataset.buildProgress==='pending').length,
    eligible:cards.filter(c=>c.dataset.day<today&&(c.classList.contains('on')||c.dataset.bc984Visible==='true')).length};
  });
  check(lazy.before.computed===lazy.after.computed,'Rendering the programme never calculates all historical models synchronously');
  check(lazy.past>30&&lazy.deferred>20,'Off-screen historical cards remain deferred');
  check(lazy.after.queued<=lazy.eligible,'Only selected or visible historical cards enter calculation queue');
  await showDay('2026-10-09');
  const readings=await p.evaluate(()=>{
   const today=todayIso(),days=calendarDays(),cards=[...document.querySelectorAll('#pane-timeline .bc984-day')];
   return cards.map(el=>{
    const iso=el.dataset.day,day=days.find(d=>d.iso===iso),facts=BuildCardData984.day(iso,today,day),past=iso<today;
    const saved=new Map(RENDER_MEMO);let percent=null;RENDER_MEMO.clear();
    try{percent=el.dataset.buildProgress==='ready'&&past?PastDay984.model(day,today,x=>progress881Model(x)):null;}
    finally{RENDER_MEMO.clear();for(const [k,v] of saved)RENDER_MEMO.set(k,v);}
    const names=[...el.querySelectorAll('.bc984-names>span:not(.bc984-missing)')].map(x=>x.textContent);
    const recorded=StaffNames910.day(iso)?.names||[];
    return {iso,past,today:iso===today,week:el.querySelector('.bc984-week').textContent,expectedWeek:facts.weekLabel,
     staffMatches:JSON.stringify(names)===JSON.stringify([...new Set(recorded.map(x=>String(x).trim()).filter(Boolean))]),
     progressState:el.dataset.buildProgress,percentText:el.querySelector('.bc984-percentage').textContent,expectedPercent:percent?.percent===null||!percent?null:(percent.bound?'≥':'')+percent.text+'%',
     stamp:!!el.querySelector('.bc984-stamp'),rail:!!el.querySelector('.bc984-rail'),loads:el.querySelector('.bc984-load-count').textContent,
     loadModel:{verified:facts.loads.verified,total:facts.loads.total,completed:facts.loads.completed,status:facts.loads.status},
     rule:el.querySelector('.bc984-rule-title')?.textContent,expectedRule:facts.lifeSavingRule?.title,
     reminder:el.querySelector('.bc984-safety-rule')?.textContent.includes('REMINDER'),noBriefing:!facts.lifeSavingRule?.briefingConfirmed};
   });
  });
  check(readings.length>20,'Programme cards remain available');
  check(readings.every(x=>x.week===x.expectedWeek&&x.week.trim()),'Every week is sourced from programme helper');
  check(readings.every(x=>x.staffMatches),'Staff names exactly match the shared day roster');
  check(readings.filter(x=>x.expectedPercent!==null).every(x=>x.percentText===x.expectedPercent),'Past percentages match isolated whole-build model: '+JSON.stringify(readings.filter(x=>x.expectedPercent!==null&&x.percentText!==x.expectedPercent).map(x=>({iso:x.iso,actual:x.percentText,expected:x.expectedPercent}))));
  check(readings.filter(x=>!x.past).every(x=>x.progressState==='none'&&!x.stamp&&!x.rail&&!x.percentText.includes('%')),'Today and future never show historical percentage or completion stamp');
  check(readings.filter(x=>x.past).every(x=>x.stamp),'Every past day has completion stamp');
  check(readings.every(x=>x.rule===x.expectedRule&&x.reminder&&x.noBriefing),'Official daily safety reminder without claiming a briefing');
  check(readings.filter(x=>x.loadModel.verified&&x.loadModel.total>0&&x.loadModel.status!=='scheduled').every(x=>x.loads===x.loadModel.completed+' / '+x.loadModel.total),'Verified day loads agree with shared helper');
  check(readings.filter(x=>!x.loadModel.verified&&x.past).every(x=>x.loads==='Not verified'),'Unverified past loads never presented as completed');
  check(readings.find(x=>x.iso==='2026-10-09').loads!=='2 / 2','Friday mock-up 2/2 is not used as factual completion');
  // Every earlier reading must be supported by the native as-of model; no October start cutoff.
  const history=[];
  for(const iso of ['2026-09-07','2026-09-16','2026-09-25','2026-10-01','2026-10-06','2026-10-07','2026-10-08','2026-10-09']){
   await showDay(iso);
   const row=await p.evaluate(iso=>{
    const el=document.querySelector('.bc984-day.on'),d=calendarDays().find(x=>x.iso===iso),today=todayIso(),memo=new Map(RENDER_MEMO);let expected;
    try{RENDER_MEMO.clear();expected=PastDay984.model(d,today,x=>progress881Model(x));}finally{RENDER_MEMO.clear();for(const [k,v]of memo)RENDER_MEMO.set(k,v);}
    const works=BuildWork986.day(iso,today,d),shown=[...el.querySelectorAll('.bc986-work-row')].map(n=>n.textContent.replace(/\s+/g,' ').trim());
    return {iso,state:el.dataset.buildProgress,percentText:el.querySelector('.bc984-percentage').textContent,expected:expected.percent===null?null:(expected.bound?'≥':'')+expected.text+'%',
     workHeading:el.querySelector('.bc986-work-heading')?.textContent||'',workExpected:works.rows,workShown:shown,workDetails:works.details,more:document.querySelector('.bc986-work-details')?.textContent||'',workMore:el.querySelector('.bc986-work-more')?.textContent||''};
   },iso);
   check(row.state!=='pending','Historical progress resolves for '+iso);
   check(row.expected===null?row.state==='unavailable':row.state==='ready'&&row.percentText===row.expected,'Native whole-build progress agrees on '+iso+': '+JSON.stringify(row));
   check(row.workHeading.includes('WORK RECORDED'),'Past work is labelled recorded for '+iso);
   check(row.workShown.length>0&&row.workShown.every(text=>row.workExpected.some(item=>text.includes(item.label)&&text.includes(item.value))),'Card work rows match dated source helper on '+iso);
   check(row.workShown.length===Math.min(3,row.workExpected.length),'Card keeps at most three concise work rows on '+iso);
   check(row.workExpected.length<=3||row.workMore.includes(String(row.workExpected.length-3)),'Additional work row count is available on '+iso);
   check(row.workDetails.every(item=>row.more.includes(item.label)&&(!item.source||row.more.includes(item.source))),'More info retains source references for every work detail on '+iso);
   history.push({iso:row.iso,state:row.state,percentText:row.percentText,work:row.workShown});
   if(out&&['2026-09-07','2026-09-25','2026-10-06'].includes(iso)){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/history-'+iso+'.png'});await card().screenshot({path:out+'/history-card-'+iso+'.png'});}
  }
  check(history.some(x=>x.iso<'2026-10-07'&&x.state==='ready'&&x.percentText.includes('%')),'Supported previous September and October days show build percentage');
  check(history.filter(x=>/^≥?0%$/.test(x.percentText)).length>0,'Verified zero progress is displayed as 0%, not blank');
  await showDay('2026-10-09');
  const workModels=await p.evaluate(()=>{
   const today=todayIso(),days=calendarDays();return [...document.querySelectorAll('.bc984-day')].map(el=>{
    const d=days.find(d=>d.iso===el.dataset.day),w=BuildWork986.day(d.iso,today,d);return {iso:d.iso,past:d.iso<today,heading:el.querySelector('.bc986-work-heading')?.textContent||'',expectedHeading:w.heading,
     shown:[...el.querySelectorAll('.bc986-work-row')].map(n=>n.textContent.replace(/\s+/g,' ').trim()),expected:w.rows};
   });
  });
  check(workModels.every(x=>x.heading.includes(x.expectedHeading)),'Past recorded works and current/future planned works use correct headings');
  check(workModels.every(x=>x.shown.length>0&&x.shown.every(text=>x.expected.some(row=>text.includes(row.label)&&text.includes(row.value)))),'Every displayed work quantity comes from day-specific source helper');
  check(workModels.every(x=>x.shown.every(text=>!/[0-9]\s*\/\s*[0-9]/.test(text))),'Work references are not fabricated completed-load ratios');
  const geometry=await card().evaluate(el=>{
   const face=el.querySelector('.bc984-card'),stamp=el.querySelector('.bc984-stamp'),r=el.getBoundingClientRect(),f=face.getBoundingClientRect(),s=stamp.getBoundingClientRect(),strip=el.closest('.daystrip').getBoundingClientRect();
   return {width:r.width,height:r.height,stripWidth:strip.width,pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,
    stampWidth:parseFloat(getComputedStyle(stamp).width),stampX:s.x+s.width/2,stampY:s.y+s.height/2,faceX:f.x+f.width/2,faceY:f.y+f.height/2,
    contentFits:[...el.querySelectorAll('.bc984-cap,.bc984-weather-reading,.bc984-progress,.bc984-load-row,.bc986-work,.bc984-crew,.bc984-safety-rule,.bc984-card-footer')].every(n=>{const q=n.getBoundingClientRect();return q.left>=f.left&&q.right<=f.right&&q.bottom<=f.bottom+1;}),
    hasStampImage:getComputedStyle(stamp).backgroundImage.startsWith('url("data:image/png'),stampFilter:getComputedStyle(stamp).filter,stampAnimation:getComputedStyle(stamp).animationName};
  });
  check(geometry.pageWidth<=geometry.viewport+1,'No document horizontal overflow');
  check(geometry.width>=Math.min(330,geometry.viewport-50)&&geometry.width<=400.1,'Upright card width fits viewport');
  if(!mobile)check(geometry.stripWidth<=1240.1&&geometry.stripWidth>=1180,'Desktop strip contains no more than three full cards');
  check(geometry.contentFits,'Names and all requested data fit inside card');
  check(geometry.stampWidth>=geometry.width*.9,'Stamp spans almost whole card width');
  check(Math.abs(geometry.stampX-geometry.faceX)<2&&Math.abs(geometry.stampY-geometry.faceY)<2,'Stamp centred in both axes');
  check(geometry.hasStampImage&&geometry.stampFilter.includes('drop-shadow')&&geometry.stampAnimation==='bc984-stamp-pulse','Transparent stamp with pulsing glow');
  const weather=await p.evaluate(()=>{
   const el=document.querySelector('.bc984-day.on'),f=el.querySelector('.bc984-card').getBoundingClientRect(),scene=el.querySelector('.wm-card-scene')?.getBoundingClientRect(),w=BuildCards984.weather(el.dataset.day),raw=BuildHistory984.get(el.dataset.day);
   return {kind:w.kind,source:raw.src,historical:raw.historical,date:raw.date,lo:w.lo,hi:w.hi,expectedLo:Math.round(raw.min_c),expectedHi:Math.round(raw.max_c),periods:raw.provenance.periods,sourceUrl:raw.provenance.url,sceneFull:scene&&Math.abs(scene.width-f.width)<1&&Math.abs(scene.height-f.height)<1,text:el.querySelector('.bc984-weather-reading').textContent,motion:el.dataset.bc984Motion,stampPlay:getComputedStyle(el.querySelector('.bc984-stamp')).animationPlayState};
  });
  check(weather.source==='bom-history'&&weather.historical&&weather.date==='2026-10-09','Past weather uses dated BOM observations');
  check(weather.lo===weather.expectedLo&&weather.hi===weather.expectedHi&&!/sample|forecast/i.test(weather.text),'Historical temperature values agree with observed source, no samples');
  check(weather.periods&&/^https:\/\/www\.bom\.gov\.au\//.test(weather.sourceUrl),'Historical weather has provenance and observation periods');
  check(weather.sceneFull,'Weather layer covers the full card');
  check(weather.motion==='on'&&weather.stampPlay==='running','Visible card animation runs');
  const opacity=await card().locator('.bc984-stamp').evaluate(el=>getComputedStyle(el).opacity);await p.waitForTimeout(500);
  check(await card().locator('.bc984-stamp').evaluate((el,old)=>getComputedStyle(el).opacity!==old,opacity),'Stamp visibly pulses over time');
  check(await p.evaluate(()=>[...document.querySelectorAll('.bc984-day')].some(x=>x.dataset.bc984Visible==='false')&&[...document.querySelectorAll('.bc984-day')].filter(x=>x.dataset.bc984Visible==='false').every(x=>x.dataset.bc984Motion==='off')),'Off-screen cards stop animation');
  if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/cards.png'});await card().screenshot({path:out+'/card.png'});}
  await p.locator('[data-bc984-pause]').click();
  check(await p.evaluate(()=>BuildCards984.report().animated===0),'Pause control stops all cards');
  await p.locator('[data-bc984-pause]').click();await card().scrollIntoViewIfNeeded();await p.waitForTimeout(100);
  check(await card().getAttribute('data-bc984-motion')==='on','Play control resumes visible card');
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);
  check(await card().locator('.bc984-stamp').evaluate(el=>getComputedStyle(el).animationName==='none'),'OS reduced motion suppresses stamp animation');
  await p.emulateMedia({reducedMotion:'no-preference'});
  check(await p.evaluate(()=>{document.documentElement.dataset.motion='off';document.dispatchEvent(new Event('gc500motionchange'));const stopped=BuildCards984.report().animated===0;delete document.documentElement.dataset.motion;document.dispatchEvent(new Event('gc500motionchange'));return stopped;}),'App reduced-motion preference stops animations');
  check(await p.evaluate(()=>{const descriptor=Object.getOwnPropertyDescriptor(document,'hidden');try{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return BuildCards984.report().animated===0;}finally{if(descriptor)Object.defineProperty(document,'hidden',descriptor);else delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}}),'Hidden-document fixture stops all cards');
  check(await p.evaluate(()=>{window.dispatchEvent(new Event('beforeprint'));const stopped=BuildCards984.report().animated===0;window.dispatchEvent(new Event('afterprint'));return stopped;}),'Printing stops animations');
  await p.evaluate(()=>go('plant'));check(await p.evaluate(()=>BuildCards984.report().animated===0),'Leaving Build stops animations');await showDay('2026-10-09');
  const day=await card().getAttribute('data-day');
  await p.locator('#pane-timeline [data-day-step="1"]').click();await p.waitForTimeout(350);
  check(await card().getAttribute('data-day')!==day,'Next selects another day');
  check(await card().evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('.daystrip').getBoundingClientRect();return a.left>=b.left-2&&a.right<=b.right+2;}),'Next keeps selected card visible');
  await p.locator('#pane-timeline [data-day-step="-1"]').click();await p.waitForTimeout(350);check(await card().getAttribute('data-day')===day,'Previous returns to original selected day');
  const earlier=p.locator('.bc984-day[data-day="2026-10-08"]');await earlier.focus();await earlier.press('Enter');await p.waitForTimeout(200);
  check(await card().getAttribute('data-day')==='2026-10-08','Keyboard opens past day');
  check(await p.evaluate(()=>document.activeElement?.dataset.day==='2026-10-08'),'Keyboard selection retains focus');
  await showDay('2026-10-09');await p.evaluate(()=>{renderTimeline();renderTimeline();});
  check(await card().locator('.bc984-stamp').count()===1&&await p.locator('[data-bc984-pause]').count()===1&&await p.locator('.bc984-more').count()===1,'Refresh does not duplicate content or controls');
  // WMO fixtures are browser-only and restored before preservation checks.
  const fixtures=[];await p.evaluate(()=>{window.__wx984Original=wxfDay;});
  try{
   const today=await p.evaluate(()=>todayIso());await showDay(today);
   if(out){await p.screenshot({path:out+'/today.png'});await card().screenshot({path:out+'/today-card.png'});}
   for(const kind of ['sun','part','cloud','rain','pour','storm','fog','sleet']){
    await p.evaluate(({kind,today})=>{const code=Object.keys(WX_WMO).find(k=>WX_WMO[k][0]===kind);if(code==null)throw Error('No WMO '+kind);wxfDay=iso=>iso===today?{date:today,src:'om',code:Number(code),max_c:24,min_c:18,rain_pc:80,wind_kph:12,text:'Browser fixture'}:__wx984Original(iso);wxfPaint();}, {kind,today});
    await p.waitForTimeout(50);const result=await card().evaluate(el=>({kind:el.dataset.bc984Weather,svg:!!el.querySelector('.wm-card-scene svg'),rain:!!el.querySelector('.bc984-rain-sheet'),sun:!!el.querySelector('.bc984-sun-rays'),cloud:!!el.querySelector('.bc984-cloud-veil'),overflow:document.documentElement.scrollWidth>innerWidth+1}));
    check(result.kind===kind&&result.svg&&!result.overflow,'Correct full-card '+kind+' fixture');
    if(['rain','pour','storm','sleet'].includes(kind))check(result.rain&&!result.sun,'Rain type foreground '+kind);
    if(['sun','part'].includes(kind))check(result.sun&&!result.rain,'Sun type foreground '+kind);
    if(['cloud','fog'].includes(kind))check(result.cloud&&!result.rain,'Cloud type foreground '+kind);
    fixtures.push(result.kind);
   }
  }finally{await p.evaluate(()=>{wxfDay=__wx984Original;delete window.__wx984Original;wxfPaint();});await showDay('2026-10-09');}
  const rollover=await p.evaluate(()=>{
   const realNow=Date.now,realRender=renderTimeline,initial=todayIso();let renders=0;
   renderTimeline=function(){renders++;return realRender.apply(this,arguments);};
   try{const now=realNow();Date.now=()=>now+86400000;TODAY_ISO.at=0;const moved=PastDay984.checkDay(),again=PastDay984.checkDay(),today=todayIso();
    return {moved,again,renders,oldPast:!!document.querySelector('.bc984-day[data-day="'+initial+'"] .bc984-stamp'),newUnstamped:!!document.querySelector('.bc984-day.today[data-day="'+today+'"]')&&!document.querySelector('.bc984-day.today .bc984-stamp'),newPercent:document.querySelector('.bc984-day.today .bc984-percentage')?.textContent.includes('%')};
   }finally{Date.now=realNow;TODAY_ISO.at=0;renderTimeline=realRender;PastDay984.checkDay();}
  });
  check(rollover.moved&&!rollover.again&&rollover.renders===1,'One redraw at Brisbane day rollover');
  check(rollover.oldPast&&rollover.newUnstamped&&!rollover.newPercent,'Midnight closes yesterday and leaves Today without historical percentage');
  const after=await p.evaluate(()=>({native:JSON.stringify(S),money:JSON.stringify(pl770Model()),dates:calendarDays().map(d=>[d.iso,d.deliveries.map(r=>r.a.key),d.removals.map(r=>r.a.key)])}));
  check(before.native===after.native,'Native shared record unchanged');check(before.money===after.money,'P&L model unchanged');check(JSON.stringify(before.dates)===JSON.stringify(after.dates),'All scheduled reference movements unchanged');
  check(h.errors.length===0,'No page errors');check(h.counts.blocked===0,'No operational writes');
  const result={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,geometry,weather,fixtures,history,lazy,errors:h.errors.length,writes:h.counts.blocked};
  if(out)fs.writeFileSync(out+'/cards.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
