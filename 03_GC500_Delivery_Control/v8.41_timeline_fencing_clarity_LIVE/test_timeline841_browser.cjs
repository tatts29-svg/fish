// Author: Andrew Fisher. Candidate Timeline checks; all live service writes blocked.
// PAGE candidate and private OUT required. LIVE=1 requires release-owner authorisation.
// LIVE=1 loads the actual public GET without substitution and proves raw/BOM-adjusted browser bytes.
// BASELINE=1 is discovery-only; it deliberately skips candidate feature assertions.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const parent=path.dirname(__dirname),out=process.env.OUT,pageFile=process.env.PAGE,live=process.env.LIVE==='1';
if(!out||(!pageFile&&!process.env.BASELINE))throw Error('PAGE and private OUT required');fs.mkdirSync(out,{recursive:true});
const {installWriteGuard,ready840}=require(path.join(parent,'v8.40_today_work_progress_LIVE/test_today840.cjs'));
const guard=installWriteGuard(),{open}=require(path.join(process.env.GC500_TOOLCHAIN||path.join(parent,'toolchain'),'harness/open_page.js'));
const checks=[],views=[],check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});if(!ok)console.error('FAIL',name);};
const save=()=>fs.writeFileSync(path.join(out,'timeline841-browser.json'),JSON.stringify({author:'Andrew Fisher',sha:pageFile?crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'):null,checks,views,guard},null,2));
async function geometry(p){return p.evaluate(()=>{const pane=document.querySelector('#pane-timeline'),main=document.querySelector('main');return {viewport:innerWidth,page:document.documentElement.scrollWidth,main:{client:main.clientWidth,scroll:main.scrollWidth,top:main.scrollTop},pane:{client:pane.clientWidth,scroll:pane.scrollWidth},nativeRows:[...pane.querySelectorAll('.ldl .ld-ref')].filter(e=>!e.closest('.ep819')).length,fiveRows:pane.querySelectorAll('.tl841-ref').length,nestedButtons:pane.querySelectorAll('button button').length,lamps:[...pane.querySelectorAll('.tl841-ref')].map(e=>({key:e.dataset.tl841Ref,stage:+e.querySelector('.tl841-gantry').dataset.tl841Stage,n:e.querySelectorAll('.tl841-unit').length,labels:[...e.querySelectorAll('.tl841-unit small')].map(n=>n.textContent),lensFilter:getComputedStyle(e.querySelector('svg')).filter,lensTransform:getComputedStyle(e.querySelector('svg')).transform,foregroundAnimation:getComputedStyle(e.querySelector('svg')).animationName,font:parseFloat(getComputedStyle(e.querySelector('.tl841-unit small')).fontSize),r:(()=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}})()})),day:[...pane.querySelectorAll('.daystrip>.day')].slice(0,3).map(e=>({filter:getComputedStyle(e).filter,transform:getComputedStyle(e).transform})),ids:[...pane.querySelectorAll('.tl841-gantry [id]')].map(e=>e.id)};});}
(async()=>{try{
 for(const view of (process.env.BASELINE?[{name:'baseline',W:1700,H:1100}]:[{name:'desktop',W:1700,H:1100},{name:'phone',W:390,H:844,mobile:true,dpr:2},{name:'4k',W:3840,H:2160}])){
  const s=await open({...view,pageFile:process.env.BASELINE||live?undefined:pageFile,hash:'#timeline'}),p=s.page;
  await ready840(p,false);await p.evaluate(()=>{state.q='';go('timeline');});await p.waitForTimeout(700);
  const chosen=await p.evaluate(()=>{const d=programmeDays().filter(d=>d.deliveries.length).sort((a,b)=>b.deliveries.length-a.deliveries.length)[0];state.day=d.iso;state.tlView='day';setHash('day/'+d.iso);render();return d.iso;});await p.waitForTimeout(600);
  const native=await p.evaluate(()=>({first:[...SYNC.first],status:SYNC.status,rows:allAssets().map(a=>({key:a.key,cancelled:!!a._cancelled,delivery:deliveryOf(a.key),project:window.Timeline841?timeline841State(a):null})),hash:location.hash}));
  let g=await geometry(p);views.push({name:view.name,chosen,native,geometry:g,errors:s.errors,counts:s.counts});
  await p.locator('#pane-timeline .ldlist').first().scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:path.join(out,view.name+'-timeline.png')});
  if(process.env.BASELINE){check('actual public GET without substitution',s.counts.page===0);continue;}
  if(live){const raw=fs.readFileSync(pageFile),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),bom=raw.subarray(0,3).equals(Buffer.from([239,187,191])),expected=sha(raw),browserExpected=bom?sha(raw.subarray(3)):expected;
   check(view.name+' actual public GET with zero local substitution',s.counts.page===0,s.counts);
   const upstream=guard.fulfilledDocuments.at(-1),browser=guard.documentResponses.at(-1);
   check(view.name+' exact fresh upstream bytes match approved candidate',upstream?.sha===expected&&upstream?.bytes===raw.length,upstream);
   check(view.name+' browser bytes exact or only leading UTF-8 BOM removed',browser&&(browser.sha===expected&&browser.bytes===raw.length||browser.sha===browserExpected&&browser.bytes===raw.length-(bom?3:0)),browser);
  }
  check(view.name+' five distinct stages on every native reference',g.fiveRows>0&&g.fiveRows===g.nativeRows&&g.lamps.every(x=>x.n===5),{native:g.nativeRows,five:g.fiveRows});
  check(view.name+' no page or pane horizontal overflow',g.page<=view.W+1&&g.main.scroll<=g.main.client+1&&g.pane.scroll<=g.pane.client+1,g);
  check(view.name+' no nested buttons',g.nestedButtons===0,g.nestedButtons);
  const outside=await p.evaluate(()=>{const main=document.querySelector('main').getBoundingClientRect();return [...document.querySelectorAll('#pane-timeline .tl841-gantry')].filter(e=>{const r=e.getBoundingClientRect();return r.bottom<=Math.max(0,main.top)||r.top>=Math.min(innerHeight,main.bottom);}).map(e=>({stage:e.dataset.tl841Stage,states:[...e.querySelectorAll('.tl841-halo')].map(n=>({play:getComputedStyle(n).animationPlayState,name:getComputedStyle(n).animationName}))}));});
  check(view.name+' offscreen lamp decoration is paused',outside.every(e=>e.states.every(x=>x.name==='none'||x.play==='paused')),outside);

  check(view.name+' sharp vector foreground and readable labels',g.lamps.every(x=>x.lensFilter==='none'&&x.lensTransform==='none'&&x.foregroundAnimation==='none'&&x.font>=11));
  check(view.name+' unique lamp SVG ids',g.ids.length===new Set(g.ids).size);
  check(view.name+' day text unfiltered',g.day.every(x=>x.filter==='none'),g.day);
  check(view.name+' native complete records are all-green Finished',native.rows.filter(r=>r.delivery.done&&!r.cancelled&&!r.delivery.moved&&!r.project.conflict).every(r=>r.project.stage===5&&r.project.arrived&&r.project.label==='Finished'));
  check(view.name+' Complete quantity conflicts remain visible below Finished',native.rows.filter(r=>r.project.conflict).every(r=>r.project.stage<5&&/Review required/.test(r.project.label)));
  check(view.name+' rental alone never confirms placement',native.rows.filter(r=>r.delivery.where==='rental'&&!r.delivery.done&&!r.cancelled&&!r.delivery.moved).every(r=>r.project.stage===0&&!r.project.arrived));
  const b=p.locator('[data-tl841-open]').first();await b.scrollIntoViewIfNeeded();const key=await b.getAttribute('data-tl841-open'),before=await p.evaluate(()=>document.querySelector('main').scrollTop);await b.click();
  await p.locator('#timeline841-dialog').waitFor({state:'visible'});check(view.name+' progress dialog opens correct ref',await p.locator('#timeline841-heading').textContent()===key);
  check(view.name+' detail pauses decorative lamps',await p.evaluate(()=>[...document.querySelectorAll('.tl841-gantry .tl841-halo')].every(e=>getComputedStyle(e).animationName==='none'||getComputedStyle(e).animationPlayState==='paused')));
  check(view.name+' view-only detail offers no record buttons',await p.locator('#timeline841-dialog [data-tl841-set]').count()===0);
  await p.screenshot({path:path.join(out,view.name+'-detail.png')});await p.keyboard.press('Escape');await p.waitForTimeout(120);
  const after=await p.evaluate(()=>({scroll:document.querySelector('main').scrollTop,key:document.activeElement.dataset.tl841Open}));check(view.name+' dialog close restores focus and native scroll',after.key===key&&Math.abs(after.scroll-before)<=1,{before,after});
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);check(view.name+' reduced motion stops all lamp loops',await p.evaluate(()=>[...document.querySelectorAll('.tl841-halo')].every(e=>getComputedStyle(e).animationName==='none')));await p.emulateMedia({reducedMotion:'no-preference'});
  await p.evaluate(()=>{localStorage.setItem('gc500.motion','off');motionApply();});await p.waitForTimeout(60);check(view.name+' native Motion Off stops lamp loops',await p.evaluate(()=>[...document.querySelectorAll('.tl841-halo')].every(e=>getComputedStyle(e).animationName==='none')));
  await p.evaluate(()=>{localStorage.setItem('gc500.motion','subtle');motionApply();});await p.waitForTimeout(100);
  await p.locator('.ldl[data-ld]').first().click();await p.waitForTimeout(150);check(view.name+' native load expands',await p.locator('.ldb').count()>0);await p.locator('.ldl[data-ld]').first().click();
  check(view.name+' each inbound load keeps its own controls',await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .ldlist .ld')].filter(e=>!e.closest('.ep819')&&!e.classList.contains('out')).every(e=>{const refs=[...e.querySelectorAll('.tl841-ref')].map(n=>n.dataset.tl841Ref),buttons=[...e.querySelectorAll('[data-tl841-open]')].map(n=>n.dataset.tl841Open);return refs.length&&refs.every(k=>buttons.includes(k))&&e.querySelectorAll('[data-tl841-print]').length===1;})));
  const completeDay=await p.evaluate(()=>{const days=calendarDays(),d=days.find(d=>(d.deliveries||[]).some(r=>timeline841State(assetOf(r.a.key)||r.a).stage===5));if(!d)return null;state.day=d.iso;state.tlView='day';setHash('day/'+d.iso);render();return d.iso;});
  if(completeDay){const lamp=p.locator('#pane-timeline .tl841-gantry[data-tl841-stage="5"]').first();await lamp.scrollIntoViewIfNeeded();await p.waitForTimeout(150);const finish=await lamp.evaluate(e=>({labels:[...e.querySelectorAll('small')].map(n=>n.textContent),on:e.querySelectorAll('.is-on').length,green:e.querySelectorAll('.is-finished').length,running:[...e.querySelectorAll('.tl841-halo')].every(n=>getComputedStyle(n).animationPlayState==='running')}));check(view.name+' genuine Finished row is all-green On Site with automatic halos',finish.on===5&&finish.green===5&&finish.labels[0]==='On Site'&&finish.running,finish);await p.screenshot({path:path.join(out,view.name+'-finished.png')});
   const drawer=await p.evaluate(()=>{const e=document.querySelector('#drawer');return {aria:e.getAttribute('aria-hidden'),rects:e.getClientRects().length,left:e.getBoundingClientRect().left,viewport:innerWidth,pane:document.querySelector('#pane-timeline').className,modal:timeline841ModalOpen()};});
   check(view.name+' closed native drawer does not suppress automatic halos',drawer.aria==='true'&&drawer.rects>0&&!drawer.modal&&finish.running,drawer);
   const key=await lamp.evaluate(e=>e.closest('.tl841-ref').dataset.tl841Ref);await p.evaluate(key=>openAsset(key),key);await p.waitForTimeout(250);
   check(view.name+' opening native asset drawer pauses automatic lamps',await p.evaluate(()=>timeline841ModalOpen()&&[...document.querySelectorAll('#pane-timeline .tl841-halo')].every(n=>getComputedStyle(n).animationName==='none'||getComputedStyle(n).animationPlayState==='paused')));
   await p.evaluate(()=>state.drawerClose());await p.waitForTimeout(250);await lamp.scrollIntoViewIfNeeded();await p.waitForTimeout(100);
   check(view.name+' native drawer close resumes visible lamp decoration',await lamp.evaluate(e=>!timeline841ModalOpen()&&[...e.querySelectorAll('.is-on .tl841-halo')].every(n=>getComputedStyle(n).animationPlayState==='running')));
  }else check(view.name+' genuine Finished row available for live verification',false);
  check(view.name+' no runtime exceptions',s.errors.length===0,s.errors);save();await s.browser.close();
  if(process.env.STOP_AFTER_FAILED_VIEW&&checks.some(x=>!x.ok))break;
 }
 check('zero operational write attempts',!guard.nonGetSeen.some(x=>x.operational),guard.nonGetSeen);save();console.log(JSON.stringify({passed:checks.filter(x=>x.ok).length,total:checks.length,failed:checks.filter(x=>!x.ok).map(x=>x.name),out}));if(checks.some(x=>!x.ok))process.exitCode=1;
}catch(e){checks.push({name:'fatal',ok:false,detail:e.stack});save();console.error(e.stack);process.exitCode=1;}finally{await guard.closeAll();}})();
