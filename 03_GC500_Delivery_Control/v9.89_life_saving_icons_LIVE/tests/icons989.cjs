// Author: Andrew Fisher. Read-only Life Saving Rule rendering and native document checks.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync}=require('child_process');
let servedHash;
if(process.env.PUBLIC==='1'){
 const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,...args){const result=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=crypto.createHash('sha256').update(result.body).digest('hex');return result;};
}
const {open}=require('../../toolchain/harness/open_page');
const base=fs.readFileSync(process.env.BASE_PAGE||path.resolve(__dirname,'../../build/GC500_v9.88-ready/GC500_Delivery_Control_hosted.html'),'utf8');
const baselineLife=JSON.parse(base.match(/const PS7 = (\{[^\n]+\});/)[1]).life;
(async()=>{
 const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1',out=process.env.OUTDIR;
 if(!publicMode)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#day/2026-10-09',mobile,W:mobile?390:1440,H:900}),p=h.page;
 let checks=0;const check=(ok,name)=>{assert(ok,name);checks++;};
 const card=()=>p.locator('#pane-timeline .bc984-day.on');
 const showDay=async iso=>{await p.evaluate(iso=>{state.day=iso;go('timeline');renderTimeline();},iso);await card().scrollIntoViewIfNeeded();await p.waitForTimeout(200);};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  await p.waitForFunction(()=>typeof RuleIcons989?.html==='function',null,{timeout:30000});
  if(publicMode){check(h.counts.page===0,'Public test uses actually served HTML');check(servedHash===process.env.EXPECTED_SHA,'Public HTML matches final candidate bytes');}
  const before=await p.evaluate(()=>({native:JSON.stringify(S),money:JSON.stringify(pl770Model())}));
  check(JSON.stringify(await p.evaluate(()=>PS7.life))===JSON.stringify(baselineLife),'All six rule titles, classes and full wording unchanged from v988');
  const nativeKeys={'Risk Assessment':'assess-risk','Training and Competency':'competency','Fit for Work':'fit-for-work','High-Risk Work':'general-rule','Tools and Equipment':'general-rule','Critical Risk Non-Negotiables':'general-rule'};
  const library=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../sources.json'),'utf8')).icons;
  check(library.length===10&&library.every(a=>crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../'+a.file))).digest('hex')===a.sha256),'All ten source drawings match the recorded original hashes');
  const allCards=await p.evaluate(()=>[...document.querySelectorAll('.bc984-day')].map(el=>({day:el.dataset.day,title:el.querySelector('.bc984-rule-title')?.textContent,key:el.querySelector('[data-rule989-key]')?.dataset.rule989Key,icons:el.querySelectorAll('[data-rule989-key]').length,reminder:el.querySelector('.bc984-safety-rule')?.textContent.includes('REMINDER')})));
  check(allCards.length>20&&allCards.every(r=>r.icons===1&&r.key===nativeKeys[r.title]),'Every native Build card uses the appropriate rule symbol exactly once');
  check(allCards.every(r=>r.reminder),'Rule remains a reminder rather than a completed briefing');
  const days=['2026-10-07','2026-10-08','2026-10-09','2026-10-10','2026-10-11','2026-10-12'],seen=[];
  for(const iso of days){
   await showDay(iso);
   const r=await p.evaluate(()=>{const el=document.querySelector('.bc984-day.on'),d=BuildCardData984.day(el.dataset.day,todayIso(),calendarDays().find(x=>x.iso===el.dataset.day)),icon=el.querySelector('[data-rule989-key]'),svg=icon?.querySelector('.ls989-core');return {day:el.dataset.day,title:el.querySelector('.bc984-rule-title').textContent,key:icon?.dataset.rule989Key,model:d.lifeSavingRule.title,briefing:d.lifeSavingRule.briefingConfirmed,width:svg?.getBoundingClientRect().width,height:svg?.getBoundingClientRect().height,background:getComputedStyle(icon).backgroundColor,svgBackground:getComputedStyle(svg).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1};});
   check(r.title===r.model&&r.key===nativeKeys[r.title]&&!r.briefing,'Correct canonical daily rule and meaning on '+iso);
   check(r.width===44&&r.height===44&&r.background==='rgba(0, 0, 0, 0)'&&r.svgBackground==='rgba(0, 0, 0, 0)'&&!r.overflow,'Crisp transparent 44px symbol fits the card on '+iso);seen.push(r);
  }
  check(new Set(seen.map(r=>r.title)).size===6,'Six consecutive calendar days retain all six distinct native rules');
  await showDay('2026-10-09');
  await card().locator('.bc984-safety-rule').scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>document.querySelector('.bc984-day.on')?.dataset.bc984Motion==='on',null,{timeout:10000});
  const aura=()=>card().locator('.ls989-aura').evaluate(el=>({name:getComputedStyle(el).animationName,play:getComputedStyle(el).animationPlayState,opacity:Number(getComputedStyle(el).opacity),display:getComputedStyle(el).display}));
  const stopped=v=>v.name==='none'||v.play==='paused'||v.display==='none';
  const moving=await aura();await p.waitForTimeout(350);const movingLater=await aura();
  check(moving.name==='ls989-pulse'&&moving.play==='running'&&Math.abs(moving.opacity-movingLater.opacity)>.0001,'Visible card has a real orange glow pulse');
  if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:out+'/build-rule.png'});await card().screenshot({path:out+'/build-card.png'});}
  await p.locator('[data-bc984-pause]').evaluate(el=>el.click());
  check(stopped(await aura()),'Build pause button pauses rule glow');
  await p.locator('[data-bc984-pause]').evaluate(el=>el.click());
  await p.evaluate(()=>{document.documentElement.dataset.motion='off';document.dispatchEvent(new Event('gc500motionchange'));});
  check((await aura()).name==='none','Global Motion Off disables rule animation');
  await p.evaluate(()=>{document.documentElement.dataset.motion='subtle';document.dispatchEvent(new Event('gc500motionchange'));});
  await p.emulateMedia({reducedMotion:'reduce'});check((await aura()).name==='none','OS reduced motion disables rule animation');await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(150);
  await p.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));check(stopped(await aura()),'Print lifecycle pauses Build glow');await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  await p.emulateMedia({media:'print'});const printedAura=await aura();check(printedAura.display==='none'&&printedAura.name==='none','Print CSS removes glow completely');check(await card().locator('.ls989-core').evaluate(el=>{const rgb=getComputedStyle(el).color.match(/\d+/g).map(Number);return rgb[0]>rgb[1]+20&&rgb[1]>rgb[2]+20;}),'Printing the dark Build card keeps orange core strokes readable');await p.emulateMedia({media:'screen'});await p.waitForTimeout(150);
  await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));check(stopped(await aura()),'Page suspension pauses rule glow');await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  const hidden=await p.evaluate(()=>{const desc=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));const el=document.querySelector('.bc984-day.on .ls989-aura'),paused=getComputedStyle(el).animationPlayState==='paused'||getComputedStyle(el).animationName==='none';if(desc)Object.defineProperty(document,'hidden',desc);else delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return paused;});check(hidden,'Hidden document pauses rule glow');
  await p.evaluate(()=>go('today'));check(await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .ls989-aura')].every(el=>getComputedStyle(el).animationName==='none'||getComputedStyle(el).animationPlayState==='paused')),'Leaving Build removes or pauses its card icons');await showDay('2026-10-09');
  const offscreen=await p.evaluate(()=>[...document.querySelectorAll('.bc984-day[data-bc984-visible="false"] .ls989-aura')].map(el=>getComputedStyle(el).animationPlayState));check(offscreen.length>15&&offscreen.every(x=>x==='paused'),'Off-screen programme icons are paused');
  const more=p.locator('.bc984-more');await more.evaluate(el=>el.open=true);await more.locator('.ls989-heading').scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>document.querySelector('.bc984-more [data-rule989-key]')?.dataset.rule989Playing==='true',null,{timeout:10000});
  check(await more.locator('.ls989-aura').evaluate(el=>getComputedStyle(el).animationPlayState==='running'),'Opened selected-rule details animate only when visible');
  check(await more.evaluate(el=>{const d=BuildCardData984.day(state.day,todayIso(),calendarDays().find(x=>x.iso===state.day));return el.textContent.includes(d.lifeSavingRule.text)&&el.querySelector('.ls989-heading b').textContent===d.lifeSavingRule.title;}),'More info retains complete canonical selected-rule wording');
  if(out)await p.screenshot({path:out+'/more-rule.png'});
  await more.evaluate(el=>el.open=false);await p.waitForTimeout(250);check(await more.locator('.ls989-aura').evaluate(el=>getComputedStyle(el).animationPlayState==='paused'),'Closed More info does not animate invisible icons');
  await more.evaluate(el=>el.open=true);await more.locator('.ls989-heading').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('.bc984-more [data-rule989-key]')?.dataset.rule989Playing==='true',null,{timeout:10000});
  check(await more.locator('.ls989-aura').evaluate(el=>getComputedStyle(el).animationPlayState==='running'),'Reopened More info resumes visible-only glow');await more.evaluate(el=>el.open=false);
  // Render all original drawing outlines on both backgrounds. This analyses pixels, without altering source art.
  await p.evaluate(keys=>{const fixture=document.createElement('div');fixture.id='icons989-fixture';fixture.style.cssText='position:absolute;left:0;top:0;width:320px;display:grid;grid-template-columns:160px 160px;z-index:2147483647';fixture.innerHTML='<style>#icons989-fixture .ls989-icon{--ls989-size:120px!important;--ls989-ink:#ff953e!important;}#icons989-fixture .ls989-svg{width:120px!important;height:120px!important}</style>'+keys.map(k=>['#000','#fff'].map(bg=>'<div style="width:160px;height:160px;box-sizing:border-box;padding:20px;background:'+bg+'">'+RuleIcons989.html(k,{static:true})+'</div>').join('')).join('');document.body.append(fixture);},library.map(x=>x.key));
  await p.waitForTimeout(250);const raster=await p.locator('#icons989-fixture').screenshot();if(out)fs.writeFileSync(out+'/transparent-outlines.png',raster);
  const py=spawnSync('python3',['-c',`from PIL import Image
from io import BytesIO
import json,sys
im=Image.open(BytesIO(sys.stdin.buffer.read())).convert('RGB')
rows=[]
for y in range(im.height//160):
 pairs=[]
 for x,bg in [(0,0),(160,255)]:
  tile=im.crop((x+20,y*160+20,x+140,y*160+140)); p=list(tile.getdata()); unchanged=sum(max(abs(c-bg) for c in rgb)<5 for rgb in p); orange=sum(r>g+20 and g>b+20 for r,g,b in p)
  corners=[im.getpixel((x+2,y*160+2)),im.getpixel((x+157,y*160+157))]
  pairs.append({'backgroundFraction':unchanged/len(p),'orangeFraction':orange/len(p),'corners':all(max(abs(c-bg) for c in rgb)<3 for rgb in corners)})
 rows.append(pairs)
print(json.dumps(rows))`],{input:raster,maxBuffer:1024*1024});check(py.status===0,'Icon pixel analysis completed');const pixels=JSON.parse(py.stdout.toString());
  check(pixels.length===10&&pixels.every(row=>row.every(v=>v.backgroundFraction>.55&&v.orangeFraction>.025&&v.orangeFraction<.40&&v.corners)),'All ten symbols show orange linework with transparent spaces and no filled disc on black and white');
  await p.evaluate(()=>document.getElementById('icons989-fixture').remove());
  // Native A4 generators, diverted to a layout callback: no system print dialog and no operational writes.
  const printReports=[];
  for(const doc of ['prestart','drv','ins']){
   await p.evaluate(doc=>{window.__icons989Print=null;window.__icons989Done=null;const pdf=(result,wrap,done)=>{window.__icons989Print={result,doc};window.__icons989Done=done;document.body.classList.remove('pdf7-make');document.body.classList.add('printing-day');};if(doc==='prestart')ps7Print('2026-10-14',{pdf});else dpPrint('2026-10-14',doc,{only:0,pdf});},doc);
   await p.waitForFunction(()=>window.__icons989Print,null,{timeout:60000});await p.emulateMedia({media:'print'});
   const r=await p.evaluate(()=>{const wrap=document.getElementById('dayprint'),rows=[...wrap.querySelectorAll('.ls989-print-title')],icons=[...wrap.querySelectorAll('[data-rule989-key]')],pages=[...wrap.querySelectorAll('.dp-page')];return {doc:__icons989Print.doc,result:__icons989Print.result,count:rows.length,keys:rows.map(el=>el.querySelector('[data-rule989-key]')?.dataset.rule989Key),titles:rows.map(el=>el.querySelector(':scope > span:last-child').textContent),allStatic:icons.every(el=>el.dataset.rule989Static==='true'&&!el.querySelector('.ls989-aura')),wording:PS7.life.every(row=>wrap.textContent.includes(row[2])),titleFits:rows.every(el=>el.scrollWidth<=el.clientWidth+1),pagesFit:pages.every(el=>el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1),prestartHeight:wrap.querySelector('.ps7')?.getBoundingClientRect().height||null,hasFilledTitle:rows.some(el=>getComputedStyle(el).backgroundColor!=='rgba(0, 0, 0, 0)')};});
   check(r.count===6&&r.titles.every((title,i)=>title===baselineLife[i][0]&&r.keys[i]===nativeKeys[title])&&r.wording,'Native '+doc+' includes all six correct icons and complete official wording');
   check(r.allStatic&&!r.hasFilledTitle,'Native '+doc+' has static outlines without filled title badges');
   check(!r.result.timeout&&!r.result.failed&&!r.result.over?.length&&r.titleFits&&r.pagesFit&&(doc!=='prestart'||r.prestartHeight<1070),'Native '+doc+' retains its A4 layout without overflow');printReports.push(r);
   if(out)await p.screenshot({path:out+'/print-'+doc+'.png'});
   await p.evaluate(()=>{window.__icons989Done?.();document.body.classList.remove('printing-day','pdf7-make');window.dispatchEvent(new Event('afterprint'));});await p.emulateMedia({media:'screen'});
  }
  const preserved=await p.evaluate(before=>({native:JSON.stringify(S)===before.native,money:JSON.stringify(pl770Model())===before.money}),before);check(preserved.native&&preserved.money,'Native records and P&L remain exactly unchanged');
  check(h.errors.length===0,'No browser errors: '+h.errors.join('; '));check(h.counts.blocked===0,'No attempted operational writes');
  const report={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,nativeRulesPreserved:true,dailyMappings:seen.map(x=>({day:x.day,title:x.title,key:x.key})),transparentPixels:pixels,printReports:printReports.map(x=>({doc:x.doc,count:x.count,static:x.allStatic,fit:x.titleFits&&x.pagesFit,prestartHeight:x.prestartHeight})),recordsPreserved:true,moneyPreserved:true,errors:0,writes:0};
  if(out)fs.writeFileSync(out+'/icons.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
