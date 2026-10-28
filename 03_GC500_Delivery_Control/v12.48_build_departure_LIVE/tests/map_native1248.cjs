/* Author: Andrew Fisher. Private-fixture, read-only native map viewport and departure display gate.
 * MODE=baseline writes a private comparison; MODE=candidate verifies the combined candidate.
 * PAGE, STATE, OUT, BASELINE are caller-owned local files. No operational data is committed here.
 */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('../../v12.45_map_smoothness_LIVE/tests/map_native_harness.cjs');
const model=require('../map1248_src.js');
assert(['baseline','candidate'].includes(process.env.MODE),'Explicit MODE required');
assert(process.env.OUT&&process.env.BASELINE&&process.env.STATE,'Private OUT, BASELINE and frozen STATE required');
process.env.INITIAL_HASH='#sheet/__explorer';process.env.MOB='1';
const candidate=process.env.MODE==='candidate';let checks=0;
function ok(value,message){assert(value,message);checks++;}
function eq(actual,expected,message){assert.deepEqual(actual,expected,message);checks++;}
(async()=>{
 const s=await openCandidate(),p=s.page,out={binding:s.baseline,layouts:[],samples:[]};
 try{
  await p.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.GC500Explorer?.state.ready,null,{timeout:150000});
  const frame=p.frames().find(f=>f.url().includes('/explorer/index.html'));ok(frame,'Native explorer frame loaded');
  out.inventory=await frame.evaluate(()=>ITEMS.filter(it=>it.code).map(it=>{const st=mapStatus1009(it);return {code:it.code,reg:it.reg?.sourceRequest1017?{sourceRequest1017:true,sourceKey1017:it.reg.sourceKey1017}:null,places:it.places,cat:it.cat?.key||it.cat?.id,label:referenceQuantity1010(it,st),fitLabel:fitReference1010(it,st),own:MapUnits1147.reference(it,st),status:st&&{state:st.state,shape:st.shape,glyph:st.glyph,colour:st.colour,fill:st.fill,label:st.label,detail:st.detail,quantity:st.quantity1010,offsite:st.offsite1225,departure:st.departure1211?{collected:st.departure1211.collected,remaining:st.departure1211.remaining,complete:st.departure1211.complete,unknown:st.departure1211.unknown,issues:st.departure1211.issues}:null}};}));
  out.inventory=JSON.parse(JSON.stringify(out.inventory));
  const base=candidate?JSON.parse(fs.readFileSync(process.env.BASELINE,'utf8')):null;
  if(candidate){
   eq(out.binding.version,base.binding.version,'Comparison must use identical record version');eq(out.binding.stateSha256,base.binding.stateSha256,'Comparison must use exact same record bytes');
   eq(out.inventory.length,base.inventory.length,'All native map items remain');
   let departed=0,unchanged=0;
   for(const [index,item] of out.inventory.entries()){const prior=base.inventory[index];ok(prior,'Native reference preserved');eq({...item,label:null,fitLabel:null},{...prior,label:null,fitLabel:null},'Pin, native icon, quantity and departure facts preserved');
    if(item.status?.departure?.collected){departed++;const expected=model.reference(item.own,item,item.status.departure);eq(item.label,expected,'Reference label uses native description glyph and authoritative departed quantity');eq(item.fitLabel,expected,'Fit label matches reference label');ok(item.label.includes('↗'),'Departure icon present');}
    else{unchanged++;eq(item.label,prior.label,'Undeparted reference label unchanged');eq(item.fitLabel,prior.fitLabel,'Undeparted fit label unchanged');}}
   ok(departed>0&&unchanged>0,'Both departed and undeparted native examples exercised');out.departed=departed;out.unchanged=unchanged;
  }
  for(const [tag,width,height] of [['phone',390,844],['phone-short',390,640],['tablet',980,844],['desktop',1440,1000]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>{document.querySelector('main').scrollTop=0;expSize();});await p.waitForTimeout(350);
   const geometry=()=>{const b=x=>({x:x.getBoundingClientRect().x,y:x.getBoundingClientRect().y,w:x.clientWidth,h:x.clientHeight,scroll:x.scrollHeight,scrollTop:x.scrollTop,overflowY:getComputedStyle(x).overflowY});return {main:b(document.querySelector('main')),wrap:b(document.getElementById('expwrap')),bodyClasses:document.body.className,choice:MapViewport1203.choice()};};
   const v=await p.evaluate(geometry);v.tag=tag;
   if(candidate){const prior=base.layouts.find(x=>x.tag===tag);if(tag==='desktop'){eq(v.wrap.h,prior.wrap.h,'Desktop Fit screen height unchanged');eq(v.main.scroll,prior.main.scroll,'Desktop scrolling unchanged');}else{ok(v.wrap.h>=v.main.h-20,'Phone/tablet map occupies a usable main viewport');ok(v.main.scroll-v.main.h>200,'Native page has real vertical scroll space');ok(v.wrap.h>prior.wrap.h,'Map is taller than reproduced short-panel baseline');}
    eq(v.main.overflowY,'auto','Existing native page scroll retained');
    await p.evaluate(()=>{const m=document.querySelector('main'),w=document.getElementById('expwrap');m.scrollTop+=w.getBoundingClientRect().top-m.getBoundingClientRect().top;});await p.waitForTimeout(200);
    const scrolled=await p.evaluate(geometry);if(tag!=='desktop'){ok(scrolled.main.scrollTop>200,'Map can scroll into main viewport');ok(scrolled.wrap.y>=scrolled.main.y-2&&scrolled.wrap.y<=scrolled.main.y+20,'Map top is reachable');}
    await p.evaluate(()=>{for(let i=0;i<20;i++)expSize();});const repeated=await p.evaluate(geometry);eq(repeated.wrap.h,v.wrap.h,'Repeated resize/scroll does not inflate map height');v.scrolled=scrolled;
   }
   v.native=await frame.evaluate(()=>({stage:{w:document.getElementById('stage').clientWidth,h:document.getElementById('stage').clientHeight},canvas:{w:canvas.width,h:canvas.height},offsiteCanvas:!!document.getElementById('offsite1225'),mode:GC500Explorer.state.mode}));ok(v.native.stage.h>100&&v.native.canvas.h>0,'Native drawing viewport remains valid');ok(v.native.offsiteCanvas,'Existing departure ring canvas retained');
   await p.screenshot({path:path.join(process.env.OUT,tag+'-'+process.env.MODE+'.png')});out.layouts.push(v);
  }
  await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{expSize();document.querySelector('main').scrollTop=0;});await p.waitForTimeout(300);
  await p.evaluate(()=>{window.__mapTouch1248=[];for(const type of ['touchstart','touchmove','touchend'])document.addEventListener(type,e=>window.__mapTouch1248.push({type:e.type,trusted:e.isTrusted}),{capture:true});});
  const touch=await p.context().newCDPSession(p);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:430}]});
  for(let y=420;y>=200;y-=20){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y}]});await p.waitForTimeout(20);}
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(500);
  out.touch=await p.evaluate(()=>({scroll:document.querySelector('main').scrollTop,events:window.__mapTouch1248}));
  ok(out.touch.events.filter(x=>x.type==='touchmove'&&x.trusted).length>=5,'Actual trusted touch movements were delivered');await touch.detach();
  if(candidate)ok(out.touch.scroll>100&&out.touch.scroll>base.touch.scroll+100,'Native touch swipe gives usable phone page scrolling beyond baseline');
  {
   const full=out.inventory.find(x=>x.places?.length&&x.status?.departure?.complete&&x.status.departure.collected>1);
   const partial=out.inventory.find(x=>x.places?.length&&x.status?.departure?.collected&&!x.status.departure.complete);
   ok(full&&partial,'Native full and partial departures available');
   for(const [kind,item] of [['full',full],['partial',partial]]){
    await p.evaluate(()=>expFullToggle(true));await p.waitForTimeout(250);
    await frame.evaluate(code=>selectCode(code,0,true),item.code);await p.waitForTimeout(600);
    const selectedBefore=await frame.evaluate(()=>({code:selected?.code,zoom:GC500Explorer.state.zoom,mode:GC500Explorer.state.mode}));eq(selectedBefore.code,item.code,'Native selection remains functional');
    await frame.locator('#zoomIn').click();await p.waitForTimeout(250);const zoomed=await frame.evaluate(()=>({code:selected?.code,zoom:GC500Explorer.state.zoom}));ok(zoomed.zoom>selectedBefore.zoom,'Native zoom control remains functional');eq(zoomed.code,item.code,'Zoom retains exact selected pin');
    const fullMetrics=await p.evaluate(()=>({full:document.body.classList.contains('expfull-on'),map:document.getElementById('expwrap').clientHeight,vh:innerHeight}));ok(fullMetrics.full&&fullMetrics.map>fullMetrics.vh*.7,'Fullscreen remains usable');
    await p.screenshot({path:path.join(process.env.OUT,'selected-'+kind+'-'+process.env.MODE+'.png')});
    const hit=await frame.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();for(const yf of [.18,.26,.55,.78])for(const xf of [.2,.45,.7]){const x=r.x+r.width*xf,y=r.y+r.height*yf,el=document.elementFromPoint(x,y);if(el?.tagName==='CANVAS'&&x+64<r.right)return{x,y,id:el.id,tag:el.tagName};}return null;});
    ok(hit,'Visible native canvas pixel required for real pan');
    const frameBox=await p.locator('#expFrame').boundingBox(),panBefore=await frame.evaluate(()=>GC500Explorer.state.view);
    const pan=await p.context().newCDPSession(p),sx=frameBox.x+hit.x,sy=frameBox.y+hit.y;
    await pan.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
    for(let dx=8;dx<=64;dx+=8){await pan.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+dx,y:sy}]});await p.waitForTimeout(20);}
    await pan.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(300);await pan.detach();
    const panAfter=await frame.evaluate(()=>({view:GC500Explorer.state.view,selected:selected?.code}));
    fs.writeFileSync(path.join(process.env.OUT,'pan-'+kind+'-'+process.env.MODE+'.json'),JSON.stringify({hit,frameBox,sx,sy,panBefore,panAfter},null,2));
    ok(Math.abs(panAfter.view.x-panBefore.x)>.1||Math.abs(panAfter.view.y-panBefore.y)>.1,'Native map touch pan remains functional');eq(panAfter.selected,item.code,'Touch pan retains selected pin');
    out.samples.push({kind,code:item.code,label:item.label,selectedBefore,zoomed,fullMetrics,hit,panBefore,panAfter});
    await frame.locator('#zoomIn').focus();await p.keyboard.press('Escape');await p.waitForTimeout(200);eq(await p.evaluate(()=>document.body.classList.contains('expfull-on')),false,'Escape from embedded map exits fullscreen');
   }
  }
  const frozen=JSON.parse(fs.readFileSync(process.env.STATE,'utf8'));
  const end=await p.evaluate(()=>({docs:Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])),inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
  for(const collection of new Set([...Object.keys(end.docs),...Object.keys(frozen.docs)]))eq(end.docs[collection]||{},frozen.docs[collection]||{},'Native operational records unchanged');eq(end.inflight,0,'No inflight writes');eq(end.queued,0,'No queued writes');eq(s.counts.blocked,0,'No attempted operational writes');eq(s.errors,[],'No runtime errors');eq(s.consoleErrors,[],'No console errors');
  out.checks=checks;out.errors=s.errors;out.consoleErrors=s.consoleErrors;out.blocked=s.counts.blocked;
  fs.writeFileSync(candidate?path.join(process.env.OUT,'candidate-native.json'):process.env.BASELINE,JSON.stringify(out,null,2));
  console.log(JSON.stringify({pass:true,mode:process.env.MODE,binding:out.binding,checks,departed:out.departed,unchanged:out.unchanged,layouts:out.layouts.map(({tag,main,wrap})=>({tag,mainHeight:main.h,mapHeight:wrap.h,scrollSpace:main.scroll-main.h})),errors:s.errors.length,blocked:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
