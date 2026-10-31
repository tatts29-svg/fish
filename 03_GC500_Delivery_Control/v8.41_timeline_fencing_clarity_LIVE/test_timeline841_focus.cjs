// Author: Andrew Fisher. Actual stage-dialog controller, with its record setter replaced by a capture.
// PAGE and private OUT required. No setter, save, sync or record mutation is performed.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.dirname(__dirname),out=process.env.OUT,pageFile=process.env.PAGE;if(!out||!pageFile)throw Error('PAGE and private OUT required');fs.mkdirSync(out,{recursive:true});
const {installWriteGuard,ready840}=require(path.join(root,'v8.40_today_work_progress_LIVE/test_today840.cjs')),guard=installWriteGuard();
const {open}=require(path.join(process.env.GC500_TOOLCHAIN||path.join(root,'toolchain'),'harness/open_page.js'));const results=[];
(async()=>{try{for(const view of [{name:'desktop',W:1700,H:1100},{name:'phone',W:390,H:844,mobile:true,dpr:2}]){
 const s=await open({...view,pageFile,hash:'#timeline'}),p=s.page;await ready840(p,false);
 await p.evaluate(()=>{const d=programmeDays().filter(d=>d.deliveries.length).sort((a,b)=>b.deliveries.length-a.deliveries.length)[0];state.day=d.iso;state.tlView='day';setHash('day/'+d.iso);render();});await p.waitForTimeout(500);
 const b=p.locator('[data-tl841-open]').last();await b.scrollIntoViewIfNeeded();
 const evidence=await p.evaluate(()=>{
  const old={capability,timeline841Set,readonly:SYNC.readonly,render},beforeRecord=JSON.stringify(S.delivery),main=document.querySelector('main'),target=[...document.querySelectorAll('[data-tl841-open]')].at(-1),key=target.dataset.tl841Open,scroll=main.scrollTop;
  const calls=[];let rendered=0,successful,rejected;
  try{
   capability=()=> 'edit';SYNC.readonly=false;render=()=>{rendered++;return old.render();};
   timeline841Set=(k,stage)=>{calls.push({key:k,stage,success:true});return true;};target.click();
   document.querySelector('#timeline841-dialog [data-tl841-set="3"]').click();
   successful={scroll:main.scrollTop,saved:TIMELINE841_SCROLL,rendered,dialog:!!document.querySelector('#timeline841-dialog[open]')};
   timeline841Set=(k,stage)=>{calls.push({key:k,stage,success:false});return false;};document.querySelector('#timeline841-dialog [data-tl841-set="4"]').click();
   rejected={scroll:main.scrollTop,saved:TIMELINE841_SCROLL,rendered,dialog:!!document.querySelector('#timeline841-dialog[open]')};
   document.querySelector('[data-tl841-close]').click();
   return {key,scroll,successful,rejected,calls,closed:{scroll:main.scrollTop,key:document.activeElement.dataset.tl841Open},unchanged:beforeRecord===JSON.stringify(S.delivery)};
  }finally{capability=old.capability;timeline841Set=old.timeline841Set;SYNC.readonly=old.readonly;render=old.render;}
 });
 await p.waitForTimeout(200);evidence.settled=await p.evaluate(()=>({scroll:document.querySelector('main').scrollTop,key:document.activeElement.dataset.tl841Open}));
 const ok=evidence.unchanged&&evidence.calls.length===2&&evidence.successful.rendered===1&&evidence.rejected.rendered===1&&evidence.successful.dialog&&evidence.rejected.dialog&&[evidence.successful,evidence.rejected,evidence.closed,evidence.settled].every(x=>Math.abs(x.scroll-evidence.scroll)<=1)&&evidence.closed.key===evidence.key&&evidence.settled.key===evidence.key;
 results.push({name:view.name,ok,evidence,errors:s.errors});
 await p.evaluate(()=>{const main=document.querySelector('main'),first=document.querySelector('#pane-timeline .ldlist .ld');main.scrollTop+=first.getBoundingClientRect().top-main.getBoundingClientRect().top-8;});await p.waitForTimeout(200);await p.screenshot({path:path.join(out,view.name+'-first-load.png')});
 const finished=await p.evaluate(()=>{const d=programmeDays().find(d=>d.deliveries.some(r=>{const a=assetOf(r.a.key)||r.a;return timeline841State(a).stage===5;}));if(!d)return null;state.day=d.iso;setHash('day/'+d.iso);render();return d.iso;});
 if(finished){const lamp=p.locator('#pane-timeline .tl841-gantry[data-tl841-stage="5"]').first();await lamp.scrollIntoViewIfNeeded();await p.waitForTimeout(120);const green=await lamp.evaluate(e=>({labels:[...e.querySelectorAll('small')].map(n=>n.textContent),on:e.querySelectorAll('.is-on').length,green:e.querySelectorAll('.is-finished').length,halos:[...e.querySelectorAll('.tl841-halo')].map(n=>getComputedStyle(n).animationPlayState)}));results.push({name:view.name+' real finished row',ok:green.labels[0]==='On Site'&&green.on===5&&green.green===5&&green.halos.every(x=>x==='running'),date:finished,green});await p.screenshot({path:path.join(out,view.name+'-finished.png')});}
 await s.browser.close();
 }results.push({name:'zero operational write attempts',ok:!guard.nonGetSeen.some(x=>x.operational)});
 }catch(e){results.push({name:'fatal',ok:false,error:e.stack});}finally{await guard.closeAll();fs.writeFileSync(path.join(out,'timeline841-focus.json'),JSON.stringify({author:'Andrew Fisher',sha:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),results,guard},null,2));console.log(JSON.stringify({passed:results.filter(x=>x.ok).length,total:results.length,failures:results.filter(x=>!x.ok),out}));if(results.some(x=>!x.ok))process.exitCode=1;}})();
