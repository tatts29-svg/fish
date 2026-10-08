// Author: Andrew Fisher. Actual map provider and native daily-load interaction checks; all non-GET requests blocked.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),Module=require('module');
const checks=[];function check(name,value){checks.push({name,pass:!!value});if(!value)console.log('FAIL '+name);}
async function run(){
 const output=process.env.EVIDENCE_DIR;if(!output||!path.isAbsolute(output))throw Error('Use an absolute private evidence folder');fs.mkdirSync(output,{recursive:true});
 const harness=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),strict=new Module(harness,module);strict.filename=harness;strict.paths=Module._nodeModulePaths(path.dirname(harness));strict._compile(fs.readFileSync(harness,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;'),harness);
 const s=await strict.exports.open({pageFile:process.env.PAGE,hash:'#timeline',W:1440,H:1100,gl:true});const p=s.page,provider=[];
 p.on('response',r=>{let u;try{u=new URL(r.url());}catch{return;}if(/(^|\.)mapbox\.com$/.test(u.hostname)&&(/\/v4\/|\.pbf|\.jpg|raster/.test(u.pathname)))provider.push({status:r.status(),type:r.request().resourceType()});});
 try{
  await p.waitForFunction(()=>typeof Drops911!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await p.evaluate(()=>{state.day='2026-10-07';state.tlView='day';state.q='';state.disc='';state.light='';go('timeline');render();});
  await p.waitForFunction(()=>Drops911.report().status==='ready'||Drops911.report().status==='unavailable',null,{timeout:120000});
  await p.waitForTimeout(3000);
  const initial=await p.evaluate(()=>{const r=Drops911.report(),d=calendarDays().find(x=>x.iso===r.day);return {status:r.status,loads:r.model.loads.length,points:Drops911.markers(r.model).length,nativeMatches:r.model.loads.every(l=>ldId(d,dpLoads(d)[l.n-1])===l.id),note:document.querySelector('.drops911-map-note').textContent};});
  check('Mapbox map loads successfully with live provider',initial.status==='ready');
  check('all map loads match native full day numbering and IDs',initial.nativeMatches);
  check('dense day contains more than two loads',initial.loads>2);
  const geometry=[];
  for(const width of [1440,390]){
   await p.setViewportSize({width,height:width===390?844:1100});await p.waitForTimeout(800);await p.locator('[data-drop911-fit]').click();await p.waitForTimeout(500);await p.locator('.drops911').scrollIntoViewIfNeeded();
   const g=await p.locator('.drops911').evaluate(e=>{const b=e.getBoundingClientRect(),v=e.querySelector('.drops911-view'),vr=v.getBoundingClientRect(),pins=[...e.querySelectorAll('.drops911-pin')].map(p=>{const r=p.getBoundingClientRect();return {n:p.textContent.replace('✓',''),x:r.x-vr.x,y:r.y-vr.y,w:r.width,h:r.height};}),overlaps=[];pins.forEach((a,i)=>pins.slice(i+1).forEach(c=>{if(Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x)>3&&Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y)>3)overlaps.push([a.n,c.n]);}));return {width:innerWidth,x:b.x,right:b.right,height:b.height,viewport:[v.clientWidth,v.clientHeight],pins,overlaps,overflow:document.documentElement.scrollWidth>innerWidth+1,rows:e.querySelectorAll('.drops911-load').length};});geometry.push(g);
   check(width+'px: map and selector fit page width',!g.overflow&&g.x>=-1&&g.right<=width+1);
   check(width+'px: each drop has a distinct non-overlapping badge',g.pins.length===initial.points&&g.overlaps.length===0);
   check(width+'px: every drop badge remains within viewport',g.pins.every(b=>b.x>=-1&&b.y>=-1&&b.x+b.w<=g.viewport[0]+1&&b.y+b.h<=g.viewport[1]-20));
   await p.locator('.drops911').screenshot({path:path.join(output,'dense-map-'+width+'.png')});
  }
  for(const width of [1440,1920]){await p.setViewportSize({width,height:1100});await p.waitForTimeout(500);await p.locator('.drops911').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(output,'timeline-overview-'+width+'.png')});}
  await p.setViewportSize({width:1440,height:1100});
  const interactions=await p.evaluate(async()=>{
   const before=JSON.stringify(S),report=()=>Drops911.report();
   const first=report().model.loads[0],button=()=>[...document.querySelectorAll('[data-drop911-select]')].find(x=>x.dataset.drop911Select===first.id);
   button().click();const card=()=>[...document.querySelectorAll('.ldlist[aria-label^="Due in"] .ldl')].find(b=>+b.querySelector('.ld-n b').textContent===first.n),opened=card().getAttribute('aria-expanded')==='true';button().click();const idempotent=card().getAttribute('aria-expanded')==='true';
   const canvas=document.querySelector('.drops911-map canvas'),order=document.querySelector('.drops911-order');order.scrollTop=100;order.dispatchEvent(new Event('scroll'));render();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const persistent=canvas===document.querySelector('.drops911-map canvas'),listScroll=document.querySelector('.drops911-order').scrollTop===100;
   document.querySelector('[data-drop911-clear]').click();render();const clearStable=report().selected===null;
   const count=report().model.loads.length;state.q='nothing_should_match_911';render();const retained=report().model.loads.length===count&&report().model.loads.every(l=>l.hiddenByFilter);document.querySelector('[data-drop911-select]').click();const show=!!document.querySelector('[data-drop911-show]');document.querySelector('[data-drop911-show]').click();const revealed=state.q===''&&!!document.querySelector('.ldlist[aria-label^="Due in"] .ldl[aria-expanded="true"]');
   return {opened,idempotent,persistent,listScroll,clearStable,retained,show,revealed,unchanged:before===JSON.stringify(S)};
  });
  for(const [k,v] of Object.entries(interactions))check('native interaction: '+k,v);
  await p.locator('[data-drop911-focus]').click();
  await p.waitForFunction(()=>{const r=Drops911.report(),pins=[...document.querySelectorAll('[data-drop911-marker]')];return pins.length<Drops911.markers(r.model).length&&pins.some(p=>p.dataset.drop911Marker===r.selected&&p.getAttribute('aria-pressed')==='true');},null,{timeout:15000});
  const focused=await p.evaluate(()=>{const r=Drops911.report(),pins=[...document.querySelectorAll('[data-drop911-marker]')],rows=[...document.querySelectorAll('[data-drop911-select]')];return {selectedShown:pins.some(p=>p.dataset.drop911Marker===r.selected&&p.getAttribute('aria-pressed')==='true'),allListed:rows.length===r.model.loads.length,visiblePins:pins.length,total:Drops911.markers(r.model).length};});
  check('zoom identifies selected drop while retaining complete ordered list',focused.selectedShown&&focused.allListed&&focused.visiblePins<focused.total);
  await p.locator('.drops911').screenshot({path:path.join(output,'selected-drop-1440.png')});
  await p.locator('[data-drop911-fit]').click();await p.waitForTimeout(500);
  check('Fit all restores every confirmed drop after close zoom',await p.evaluate(()=>document.querySelectorAll('[data-drop911-marker]').length===Drops911.markers(Drops911.report().model).length));
  await p.locator('[data-drop911-style="street"]').click();await p.waitForTimeout(1500);const street=await p.evaluate(()=>Drops911.report().style);check('street style is selectable',street==='street');await p.locator('.drops911').screenshot({path:path.join(output,'street-map-1440.png')});
  await p.evaluate(()=>{state.day='2026-10-08';render();});await p.waitForTimeout(500);
  const samePlace=await p.evaluate(()=>{const m=Drops911.report().model;return {loads:m.loads.length,markers:Drops911.markers(m).length,badges:[...document.querySelectorAll('.drops911-pin')].map(b=>b.textContent.replace('✓',''))};});check('coincident WC09 trucks keep separate numbered badges',samePlace.loads>=2&&new Set(samePlace.badges).size>=2);await p.locator('.drops911').screenshot({path:path.join(output,'same-place-1440.png')});
  const cleanup=await p.evaluate(async()=>{state.tlView='agenda';render();await new Promise(r=>setTimeout(r,0));return {absent:!document.querySelector('#pane-timeline .drops911'),status:Drops911.report().status};});check('agenda disposes daily map',cleanup.absent&&cleanup.status==='idle');
  check('successful map imagery requests observed',provider.some(r=>r.status>=200&&r.status<300));check('no browser JavaScript errors',s.errors.length===0);
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({checks,initial,geometry,interactions,focused,samePlace,cleanup,provider,errors:s.errors.map(e=>e.replace(/access_token=[^&\s]+/g,'access_token=REDACTED')),counts:s.counts},null,2));
 }finally{await s.browser.close();}
 console.log(checks.filter(c=>c.pass).length+'/'+checks.length+' checks passed');if(checks.some(c=>!c.pass))process.exitCode=1;
}
run().catch(e=>{console.error(String(e).replace(/access_token=[^&\s]+/g,'access_token=REDACTED'));process.exitCode=1;});
