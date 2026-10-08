// Author: Andrew Fisher. Original master-plan deep zoom and on-demand load-order workspace. GET-only.
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),crypto=require('crypto');
const checks=[];function check(name,value){checks.push({name,pass:!!value});if(!value)console.log('FAIL '+name);}
async function run(){
 const output=process.env.EVIDENCE_DIR;if(!output||!path.isAbsolute(output))throw Error('Use an absolute private evidence folder');fs.mkdirSync(output,{recursive:true});
 const source=fs.readFileSync(process.env.PAGE),harness=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),strict=new Module(harness,module);strict.filename=harness;strict.paths=Module._nodeModulePaths(path.dirname(harness));strict._compile(fs.readFileSync(harness,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;'),harness);
 const s=await strict.exports.open({pageFile:process.env.PAGE,hash:'#timeline',W:1440,H:1100}),p=s.page,assets=await require('./assets911.cjs')(s);
 const waitReady=()=>p.waitForFunction(()=>Drops911.report().status==='ready',null,{timeout:120000});
 const waitAll=()=>p.waitForFunction(()=>document.querySelectorAll('[data-drop911-marker]').length===Drops911.markers(Drops911.report().model).length,null,{timeout:15000});
 try{
  await p.waitForFunction(()=>typeof Drops911!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await p.evaluate(()=>{state.day='2026-10-07';state.tlView='day';state.q='';state.disc='';state.light='';go('timeline');render();});
  check('normal Timeline has no permanent map or plan iframe',await p.locator('.drops911,iframe.masterplan911-frame').count()===0);
  const before=await p.evaluate(()=>JSON.stringify(S));
  await p.locator('[data-drop911-open]').first().click();await waitReady();await waitAll();
  const initial=await p.evaluate(()=>{const r=Drops911.report(),d=calendarDays().find(x=>x.iso===r.day),iframe=document.querySelector('.masterplan911-frame'),e=iframe.contentWindow.GC500Explorer;return {status:r.status,loads:r.model.loads.length,points:Drops911.markers(r.model).length,nativeMatches:r.model.loads.every(l=>ldId(d,dpLoads(d)[l.n-1])===l.id),original:e.state.mode==='original',anchored:!!document.querySelector('.ld .drops911'),one:document.querySelectorAll('.drops911').length===1,labels:!!document.querySelector('.drops911-pin strong')};});
  check('original vector master plan opens inside invoking load card',initial.original&&initial.anchored&&initial.one&&initial.status==='ready');
  check('all day numbering and stable IDs match native run sheet',initial.nativeMatches&&initial.loads>2&&initial.labels);
  const geometry=[];
  for(const width of [1440,390]){
   await p.setViewportSize({width,height:width===390?844:1100});await p.waitForTimeout(500);await p.locator('[data-drop911-fit]').click();await waitAll();await p.locator('.drops911').scrollIntoViewIfNeeded();
   const g=await p.locator('.drops911').evaluate(e=>{const b=e.getBoundingClientRect(),v=e.querySelector('.drops911-view'),vr=v.getBoundingClientRect(),pins=[...e.querySelectorAll('.drops911-pin')].map(p=>{const r=p.getBoundingClientRect();return {n:p.textContent,x:r.x-vr.x,y:r.y-vr.y,w:r.width,h:r.height};}),overlaps=[];pins.forEach((a,i)=>pins.slice(i+1).forEach(c=>{if(Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x)>3&&Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y)>3)overlaps.push([a.n,c.n]);}));return {width:innerWidth,x:b.x,right:b.right,height:b.height,viewport:[v.clientWidth,v.clientHeight],pins,overlaps,overflow:document.documentElement.scrollWidth>innerWidth+1,rows:e.querySelectorAll('.drops911-load').length};});geometry.push(g);
   check(width+'px: plan and ordering controls fit width',!g.overflow&&g.x>=-1&&g.right<=width+1);
   check(width+'px: every confirmed drop has a distinct readable label',g.pins.length===initial.points&&g.overlaps.length===0&&g.rows===initial.loads);
   check(width+'px: labels stay inside plan viewport',g.pins.every(b=>b.x>=-1&&b.y>=-1&&b.x+b.w<=g.viewport[0]+1&&b.y+b.h<=g.viewport[1]-20));
   await p.locator('.drops911').screenshot({path:path.join(output,'master-order-'+width+'.png')});
  }
  await p.setViewportSize({width:1440,height:1100});await p.waitForTimeout(300);
  await p.locator('[data-drop911-select]').first().click();await p.locator('[data-drop911-focus]').click();await p.locator('[data-drop911-zoom="16000"]').click();
  await p.waitForFunction(()=>Math.abs(Drops911.report().zoom-16000)<1&&document.querySelector('.masterplan911-frame').contentWindow.GC500Explorer.state.sceneReady,null,{timeout:60000});await p.waitForTimeout(700);
  const closeup=await p.evaluate(()=>{const r=Drops911.report(),f=document.querySelector('.masterplan911-frame'),e=f.contentWindow.GC500Explorer;return {zoom:r.zoom,original:e.state.mode==='original',vectors:e.state.sceneReady,allListed:document.querySelectorAll('[data-drop911-select]').length===r.model.loads.length,selectedVisible:[...document.querySelectorAll('[data-drop911-marker]')].some(b=>b.dataset.drop911Marker===r.selected),percent:document.querySelector('[data-drop911-percent]').textContent};});
  check('16,000% uses original vectors and retains complete daily list',closeup.zoom===16000&&closeup.original&&closeup.vectors&&closeup.allListed&&closeup.selectedVisible&&closeup.percent==='16,000%');
  await p.locator('.drops911').screenshot({path:path.join(output,'master-detail-16000.png')});
  const stable=await p.evaluate(async()=>{const f=document.querySelector('.masterplan911-frame'),id=Drops911.report().selected,z=Drops911.report().zoom;render();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return f===document.querySelector('.masterplan911-frame')&&Drops911.report().selected===id&&Math.abs(Drops911.report().zoom-z)<1;});
  check('normal refresh preserves selected building, zoom and plan instance',stable);
  await p.locator('[data-drop911-fit]').click();await waitAll();
  check('Fit all returns all confirmed labels',await p.locator('[data-drop911-marker]').count()===initial.points);
  await p.evaluate(()=>{state.q='nothing_should_match_911';render();});
  check('filtering cannot remove or renumber the full ordering list',await p.evaluate(()=>Drops911.report().model.loads.every(l=>l.hiddenByFilter)&&document.querySelectorAll('[data-drop911-select]').length===Drops911.report().model.loads.length));
  await p.evaluate(()=>{state.q='';render();});
  await p.locator('[data-drop911-close]').click();
  check('Close removes map and returns focus to order controls',await p.evaluate(()=>!document.querySelector('.drops911')&&!document.querySelector('.masterplan911-frame')&&document.activeElement.hasAttribute('data-drop911-open')));
  await p.locator('[data-drop911-open]').first().click();await waitReady();
  await p.keyboard.press('Escape');check('Escape closes arranging workspace',await p.locator('.drops911').count()===0);
  await p.evaluate(()=>{state.tlView='agenda';render();});
  check('agenda contains no daily ordering map',await p.locator('.drops911').count()===0);
  check('map interaction leaves every operational record unchanged',await p.evaluate(before=>JSON.stringify(S)===before,before));
  check('master plan assets are exactly the existing verified set',assets.failures.length===0&&assets.assets.explorerRequests>0);
  check('no browser JavaScript errors',s.errors.length===0);
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({checks,sha256:crypto.createHash('sha256').update(source).digest('hex'),initial,geometry,closeup,assets,errors:s.errors,counts:s.counts},null,2));
 }catch(error){
  const state=await p.evaluate(()=>({report:typeof Drops911==='object'?Drops911.report():null,labels:document.querySelectorAll('.drops911-pin').length,note:document.querySelector('.drops911-map-note')?.textContent,frame:document.querySelector('.masterplan911-frame')?.contentWindow.GC500Explorer?.state})).catch(()=>null);
  fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:String(error.stack||error),state,errors:s.errors,assets},null,2));
  await p.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});throw error;
 }finally{await s.browser.close();}
 console.log(checks.filter(c=>c.pass).length+'/'+checks.length+' checks passed');if(checks.some(c=>!c.pass))process.exitCode=1;
}
run().catch(e=>{console.error(String(e).replace(/(?:access_token|key)=[^&\s]+/g,'credential=REDACTED'));process.exitCode=1;});
