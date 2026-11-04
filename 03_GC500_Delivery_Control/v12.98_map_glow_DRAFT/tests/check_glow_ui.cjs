/* Author: Andrew Fisher. Native, read-only Build/Demob map visibility checks.
 * PAGE selects a private candidate; LIVE=1 uses the unmodified public page.
 * OUT is mandatory and must be outside the repository. Screenshots contain site data.
 * Run serially: flock /tmp/gc500-browser.lock env PAGE=... OUT=... node this-file
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {open}=require('../../toolchain/harness/open_page');
const OUT=process.env.OUT;
assert(OUT&&path.isAbsolute(OUT),'Private absolute OUT required');
assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../../..')+path.sep),'Evidence must stay outside the repository');
assert(process.env.PAGE||process.env.LIVE==='1','PAGE or explicit LIVE=1 required');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});
const init=`(()=>{window.__glowProbe1298={drawImage:0,toDataURL:0,toBlob:0};
 for(const [proto,name] of [[CanvasRenderingContext2D.prototype,'drawImage'],[HTMLCanvasElement.prototype,'toDataURL'],[HTMLCanvasElement.prototype,'toBlob']]){const original=proto[name];proto[name]=function(...args){window.__glowProbe1298[name]++;return original.apply(this,args);};}})();`;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const write=(name,data)=>fs.writeFileSync(path.join(OUT,name),JSON.stringify(data,null,2));
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<.12,`${message}: ${actual} != ${expected}`);

// Independent copy of the established native picture crop, used only for checking
// that the beacon stays at the real location near the edges of the site aerial.
function expectedProjection({location,view}){
 const L=location,V=Find1176.VIEWS.find(v=>v.key===view),width=1000,height=720,band=104;
 if(!Find1176.inAerial(L))return {x:500,y:360,width,height,fullHeight:height+band};
 const g=DATA.georef,fr=frameOf(L.lat,L.lon),FX=g.frame_px[0],FY=g.frame_px[1],ppm=1/g.m_per_frame_px_ground;
 let fw=2*V.halfM*ppm,fh=fw*height/width;
 if(fw>FX){fw=FX;fh=fw*height/width;}if(fh>FY){fh=FY;fw=fh*width/height;}
 const x0=Math.max(0,Math.min(FX-fw,fr.ax*FX-fw/2)),y0=Math.max(0,Math.min(FY-fh,fr.ay*FY-fh/2));
 return {x:(fr.ax*FX-x0)/fw*width,y:(fr.ay*FY-y0)/fh*height,width,height,fullHeight:height+band};
}
async function ready(p){
 await p.waitForFunction(()=>typeof go==='function'&&window.MapBeacon1298&&window.Singles1238&&window.BuildCards1247,null,{timeout:120000});
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
}
async function demob(p,kind='outlined'){
 await p.evaluate(()=>{DM816.view='everything';DM816.branch='all';go('demob');});
 await p.waitForSelector('#pane-demob article.sg1238');
 const selected=await p.evaluate(kind=>{
  const cards=Singles1238.model().cards;
  const matches=cards.map(c=>({c,L:Singles1238.mapLoc1297(c)})).filter(({c,L})=>L&&Find1176.inAerial(L)&&document.querySelector('article.sg1238[data-sg1238="'+CSS.escape(c.key)+'"][data-u1238="'+CSS.escape(c.uid)+'"]'));
  const q=matches.find(({c,L})=>kind==='unassigned'?L.demob1297.kind==='unassigned':kind==='history'?c.st.s==='gone':L.demob1297.parts.length&&c.st.s!=='gone')||matches.find(({L})=>L.demob1297.parts.length);
  if(!q)throw Error('No native '+kind+' map card');
  Singles1238.goCard(q.c.key,q.c.uid);
  return {key:q.c.key,uid:q.c.uid,kind:q.L.demob1297.kind,location:{lat:q.L.lat,lon:q.L.lon},qualification:q.L.demob1297.qualification,history:q.c.st.s==='gone'};
 },kind);
 const selector='#pane-demob article.sg1238[data-sg1238='+JSON.stringify(selected.key)+'][data-u1238='+JSON.stringify(selected.uid)+']';
 const card=p.locator(selector);await card.locator('.ph1238').scrollIntoViewIfNeeded();
 await p.waitForFunction(selector=>[...document.querySelectorAll(selector+' img[data-pi1238]')].length===3&&[...document.querySelectorAll(selector+' img[data-pi1238]')].every(im=>im.complete&&im.naturalWidth>0&&im.classList.contains('on')),selector,{timeout:120000});
 return {selected,selector,card};
}
async function build(p){
 const fixture=await p.evaluate(()=>{
  const candidates=[];for(const day of calendarDays().filter(d=>d.iso<'2026-10-23'))for(const row of day.deliveries||[]){
   const key=row.a?.key;if(!key)continue;const L=BuildShapes1297.prepare(key,Find1176.locate({kind:'asset',key}));
   if(L?.demob1297.parts.length&&Find1176.inAerial(L)&&BuildShapes1297.drawingId(key,L))candidates.push({key,day:day.iso,parts:L.demob1297.parts.length});
  }
  candidates.sort((a,b)=>b.parts-a.parts);const chosen=candidates[0];if(!chosen)throw Error('No scheduled Build source outline');state.day=chosen.day;state.tlView='day';go('timeline');return chosen;
 });
 await p.waitForSelector('#pane-timeline .b1247-location');
 const key=fixture.key;
 assert(key,'Native Build source outline required');
 const selector='#pane-timeline .b1247-location[data-build1247-key='+JSON.stringify(key)+']';
 const strip=p.locator(selector).first();await strip.scrollIntoViewIfNeeded();
 await p.waitForFunction(selector=>{const b=document.querySelector(selector),im=b?.querySelector('img');return b?.dataset.picture1247==='ready'&&im?.complete&&im.naturalWidth>0;},selector,{timeout:120000});
 const location=await p.evaluate(key=>{const L=BuildShapes1297.prepare(key,Find1176.locate({kind:'asset',key}));return {lat:L.lat,lon:L.lon,qualification:L.demob1297.qualification};},key);
 return {key,day:fixture.day,location,selector,strip};
}

async function frames(p,selector){
 await p.waitForFunction(selector=>document.querySelector(selector+' svg.mb1298 .mb1298-frame'),selector,{timeout:30000});
 return p.locator(selector+' svg.mb1298 .mb1298-frame').evaluateAll(nodes=>nodes.map(n=>({view:n.dataset.view1298,x:Number(n.dataset.x1298),y:Number(n.dataset.y1298),transform:n.getAttribute('transform'),viewBox:n.ownerSVGElement.getAttribute('viewBox'),outline:n.querySelectorAll('.mb1298-outline').length,ring:n.querySelectorAll('.mb1298-ring').length,pulse:n.querySelectorAll('.mb1298-pulse').length,active:n.ownerSVGElement.dataset.active1298,pointer:getComputedStyle(n.ownerSVGElement).pointerEvents})));
}
async function checkDemob(p,item){
 const marks=await frames(p,item.selector);
 assert.deepEqual(marks.map(x=>x.view).sort(),['close','site','wide']);
 for(const m of marks){const q=await p.evaluate(expectedProjection,{location:item.selected.location,view:m.view});near(m.x,q.x,'Demob '+m.view+' x');near(m.y,q.y,'Demob '+m.view+' y');assert.equal(m.ring,1);assert.equal(m.pulse,1);assert.equal(m.pointer,'none');if(item.selected.kind==='unassigned')assert.equal(m.outline,0);else assert(m.outline>0,'Source outline present');}
 if(item.selected.qualification)assert((await item.card.locator('.map-note1297').innerText()).includes(item.selected.qualification),'Native location qualification preserved');
 return marks;
}
async function checkBuild(p,item){
 const marks=await frames(p,item.selector);
 assert.deepEqual(marks.map(x=>x.view),['close','wide','plan']);
 for(const [i,m] of marks.entries()){
  const q=m.view==='plan'?{x:198,y:138,width:396,fullHeight:276}:await p.evaluate(expectedProjection,{location:item.location,view:m.view});
  const scale=Math.max(336/q.width,242/q.fullHeight),dx=(336-q.width*scale)/2;
  near(m.x,dx+q.x*scale,'Build '+m.view+' x');near(m.y,q.y*scale,'Build '+m.view+' y');
  const t=m.transform?.match(/translate\(\s*([\d.\-]+)[,\s]+([\d.\-]+)/);assert(t,'Per-panel translation');near(+t[1],i*342,'Build panel left');near(+t[2],0,'Build panel top');
  assert.equal(m.ring,1);assert.equal(m.pulse,1);assert(m.outline>0);assert.equal(m.pointer,'none');assert.equal(m.viewBox,'0 0 1020 242');
 }
 assert((await item.strip.locator('.b1247-map-copy').innerText()).includes(item.location.qualification),'Build reference-layout qualification retained');
 return marks;
}
async function animation(p,selector,label){
 const svg=p.locator(selector+' svg.mb1298').first();await svg.scrollIntoViewIfNeeded();
 await p.waitForFunction(selector=>document.querySelector(selector+' svg.mb1298')?.dataset.active1298==='true',selector,{timeout:15000});
 const sample=()=>svg.locator('.mb1298-pulse').first().evaluate(n=>({transform:getComputedStyle(n).transform,opacity:getComputedStyle(n).opacity,name:getComputedStyle(n).animationName,state:getComputedStyle(n).animationPlayState}));
 const a=await sample();await pause(350);const b=await sample();
 assert.notEqual(a.name,'none',label+' pulse animation exists');assert.equal(a.state,'running');assert(a.transform!==b.transform||a.opacity!==b.opacity,label+' pulse changes over time');
 await p.emulateMedia({reducedMotion:'reduce'});const reducedA=await sample();await pause(350);const reducedB=await sample();
 assert.deepEqual(reducedA,reducedB,label+' reduced motion static');assert.equal(reducedA.name,'none');
 assert(await svg.locator('.mb1298-ring').first().isVisible(),label+' reduced motion keeps location ring');
 await p.screenshot({path:path.join(OUT,label+'-reduced-motion.png')});await p.emulateMedia({reducedMotion:'no-preference'});
 // Exercise the actual visibility listener without changing the site record.
 await p.evaluate(()=>{window.__glowHiddenDescriptor=Object.getOwnPropertyDescriptor(document,'hidden');Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await pause(80);const hidden=await sample();assert.equal(hidden.state,'paused',label+' hidden document pauses pulse');
 await p.evaluate(()=>{if(window.__glowHiddenDescriptor)Object.defineProperty(document,'hidden',window.__glowHiddenDescriptor);else delete document.hidden;delete window.__glowHiddenDescriptor;document.dispatchEvent(new Event('visibilitychange'));});
 await p.waitForFunction(selector=>document.querySelector(selector+' svg.mb1298')?.dataset.active1298==='true',selector,{timeout:15000});
 return {animated:true,reducedMotionStatic:true,hiddenDocumentPaused:true,a,b};
}
async function idle(p,requests,label){
 await p.waitForFunction(()=>{const b=BuildCards1247.stats(),d=Singles1238.picsState();return b.active===0&&b.queued===0&&d.busy===0&&d.queued===0;},null,{timeout:120000});
 await pause(250);const a=await p.evaluate(()=>({...__glowProbe1298})),r=requests.images;await pause(1250);const b=await p.evaluate(()=>({...__glowProbe1298}));
 assert.deepEqual(b,a,label+' animation must not redraw or re-encode canvas');assert.equal(requests.images,r,label+' animation must not request map images');
 return {canvasDelta:{drawImage:b.drawImage-a.drawImage,toDataURL:b.toDataURL-a.toDataURL,toBlob:b.toBlob-a.toBlob},imageRequestDelta:requests.images-r};
}
async function find(p,item,label){
 await item.card.locator('.pf1238').first().click();await p.waitForSelector('.find1176');
 await p.waitForFunction(()=>document.querySelectorAll('.find1176 svg.mb1298 .mb1298-frame').length===3,null,{timeout:120000});
 const marks=await frames(p,'.find1176');
 for(const m of marks){const q=await p.evaluate(expectedProjection,{location:item.selected.location,view:m.view});near(m.x,q.x,'Find '+m.view+' x');near(m.y,q.y,'Find '+m.view+' y');assert.equal(m.ring,1);assert(m.outline>0);}
 for(const view of ['close','wide','site']){await p.locator('.find1176 figure[data-view='+view+']').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,label+'-find-'+view+'.png')});}
 await p.locator('.find1176 .close').click();assert.equal(await p.locator('.find1176').count(),0);return marks;
}
async function offscreen(p,selector,label){
 await p.evaluate(selector=>{const target=document.querySelector(selector);let n=target.parentElement;while(n&&n!==document.body&&!/auto|scroll/.test(getComputedStyle(n).overflowY))n=n.parentElement;n=n&&n!==document.body?n:document.scrollingElement;n.scrollTop=0;},selector);
 await p.waitForFunction(selector=>!document.querySelector(selector+' svg.mb1298')||[...document.querySelectorAll(selector+' svg.mb1298')].every(svg=>svg.dataset.active1298==='false'),selector,{timeout:15000});
 return {offscreenPausedOrDetached:true};
}
async function run(){
 const reports=[],pageHash=process.env.LIVE==='1'?null:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
 console.log(process.env.LIVE==='1'?'Testing public live page':'Testing exact candidate '+pageHash);
 for(const mode of (process.env.MOB==='1'?['phone']:process.env.MOB==='0'?['desktop']:['desktop','phone'])){
  const s=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,hash:'#demob',W:mode==='phone'?390:1440,H:mode==='phone'?844:1000,mobile:mode==='phone',dpr:1,init});
  const p=s.page,cons=[],requests={images:0};p.on('console',m=>{if(m.type()==='error')cons.push(m.text().slice(0,180));});p.on('request',r=>{if(r.resourceType()==='image'&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))requests.images++;});
  try{
   await ready(p);console.log(mode+' live record ready');const d=await demob(p),dFrames=await checkDemob(p,d);console.log(mode+' Demob geometry checked');
   await p.screenshot({path:path.join(OUT,mode+'-demob-context.png')});await d.card.locator('.ph1238').screenshot({path:path.join(OUT,mode+'-demob-maps.png')});
   const da=await animation(p,d.selector,mode+'-demob'),di=await idle(p,requests,mode+' Demob');
   const full=await find(p,d,mode);const dp=await offscreen(p,d.selector,mode+' Demob');
   const unassigned=await demob(p,'unassigned');assert.equal(unassigned.selected.kind,'unassigned');const unassignedFrames=await checkDemob(p,unassigned);
   await p.screenshot({path:path.join(OUT,mode+'-demob-unassigned.png')});
   const b=await build(p),bFrames=await checkBuild(p,b);console.log(mode+' Build geometry checked');
   await p.screenshot({path:path.join(OUT,mode+'-build-context.png')});await b.strip.screenshot({path:path.join(OUT,mode+'-build-maps.png')});
   const ba=await animation(p,b.selector,mode+'-build'),bi=await idle(p,requests,mode+' Build');
   const before=await p.evaluate(()=>BuildCards1247.stats());const bp=await offscreen(p,b.selector,mode+' Build');
   await b.strip.scrollIntoViewIfNeeded();await frames(p,b.selector);await p.waitForFunction(()=>BuildCards1247.stats().active===0&&BuildCards1247.stats().queued===0);
   const after=await p.evaluate(()=>BuildCards1247.stats());assert.equal(after.drawn,before.drawn,'Build scroll reentry reuses exact picture');assert(after.attached<=16&&after.cached<=16);assert.equal(after.peakActive,1);
   await p.evaluate(()=>go('today'));await p.waitForFunction(()=>BuildCards1247.stats().attached===0&&document.querySelectorAll('#pane-timeline svg.mb1298').length===0,null,{timeout:15000});
   const docs=await p.evaluate(()=>({inflight:Object.keys(SYNC.inflight||{}).length,queued:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
   assert.equal(docs.inflight,0);assert.equal(docs.queued,0);assert.equal(s.counts.blocked,0,'Zero attempted operational writes');assert.deepEqual(s.errors,[]);assert.deepEqual(cons,[]);
   reports.push({mode,demob:{selected:d.selected,frames:dFrames,animation:da,idle:di,...dp},find:full,unassigned:{selected:unassigned.selected,frames:unassignedFrames},build:{key:b.key,frames:bFrames,animation:ba,idle:bi,...bp,cachedReentry:true,tabDetached:true,stats:after},errors:s.errors,console:cons,writes:s.counts.blocked,docs});
   write('report-'+mode+'.json',reports.at(-1));console.log('PASS '+mode+' native Build / Demob / Find projected glow, motion and read-only lifecycle');
  }catch(error){
   await p.screenshot({path:path.join(OUT,mode+'-failure.png')}).catch(()=>{});
   write(mode+'-diagnostic.json',await p.evaluate(()=>({tab:typeof state==='object'?state.tab:null,sync:typeof SYNC==='object'?{status:SYNC.status,first:SYNC.first?.size}:null,build:window.BuildCards1247?.stats(),demob:window.Singles1238?.picsState(),marks:[...document.querySelectorAll('svg.mb1298')].map(s=>({viewBox:s.getAttribute('viewBox'),active:s.dataset.active1298,rect:s.getBoundingClientRect().toJSON()}))})).catch(e=>({diagnosticError:e.message})));
   throw error;
  }finally{await s.browser.close();}
 }
 if(pageHash)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),pageHash,'Candidate must stay unchanged during checks');
 write('report.json',{author:'Andrew Fisher',passed:true,pageHash,live:process.env.LIVE==='1',reports});
}
run().catch(error=>{write('failure.json',{message:error.message,stack:error.stack});console.error(error.stack);process.exitCode=1;});
