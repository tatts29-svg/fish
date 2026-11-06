/* Author: Andrew Fisher. Private native phone report viewport proof; read-only rehearsal. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {openCandidate}=require('../../v12.43_responsiveness_LIVE/tests/candidate_harness.cjs');
(async()=>{
 assert(process.env.PAGE&&process.env.STATE&&process.env.TRACKER_DIR&&process.env.OUT);const out=path.resolve(process.env.OUT);assert(!out.startsWith(path.resolve(__dirname,'../../..')+path.sep));fs.mkdirSync(out,{recursive:true});
 const listing=JSON.parse(fs.readFileSync(path.join(process.env.TRACKER_DIR,'tracker-list.json'))),pages=JSON.parse(fs.readFileSync(path.join(process.env.TRACKER_DIR,'tracker-pages.json')));process.env.MOB='1';process.env.INITIAL_HASH='#servicing';const s=await openCandidate();const result={author:'Andrew Fisher',baseline:s.baseline,reports:[]};
 try{
 await s.page.clock.setFixedTime(new Date('2026-10-28T18:10:00Z'));s.setFixtureLevel('edit');
 await s.page.evaluate(({listing,pages})=>{SYNC.backend.ticks=async q=>JSON.parse(JSON.stringify(!q||!q.token?listing:pages.find(p=>p.seq>Number(q.since||0)||!p.more)||pages.at(-1)));window.capability=()=> 'edit';window.mayWrite=()=>true;SYNC.readonly=false;SYNC.claims='edit';SYNC.level='edit';renderServicing1084();},{listing,pages});
 await s.page.waitForFunction(()=>ServicingPreview1252.models().length===3);
 for(const day of ['2026-10-23','2026-10-24','2026-10-25']){
 await s.page.evaluate(day=>{document.querySelectorAll('[data-night1252]').forEach(n=>n.open=n.dataset.night1252===day);},day);
 await s.page.waitForFunction(day=>{const f=document.querySelector('[data-night1252="'+day+'"] iframe');return f&&f.contentDocument.documentElement.dataset.pages&&f.offsetHeight>500;},day,{timeout:30000});
 const count=await s.page.evaluate(day=>document.querySelector('[data-night1252="'+day+'"] iframe').contentDocument.querySelectorAll('.sheet').length,day);const r={day,pages:count,positions:[]};
 for(let i=0;i<count;i++){
 const position=await s.page.evaluate(({day,i})=>{
  const f=document.querySelector('[data-night1252="'+day+'"] iframe'),sheet=f.contentDocument.querySelectorAll('.sheet')[i];
  const ancestors=[];for(let n=f.parentElement;n;n=n.parentElement)if(n.scrollHeight>n.clientHeight+5&&/(auto|scroll)/.test(getComputedStyle(n).overflowY))ancestors.push(n);
  const sc=ancestors[0]||document.scrollingElement,view=sc===document.scrollingElement?{top:0,bottom:innerHeight}:sc.getBoundingClientRect();
  const local=sheet.getBoundingClientRect(),fr=f.getBoundingClientRect(),target=fr.top+local.top+Math.min(local.height/2,180),aim=(Math.max(280,view.top)+Math.min(innerHeight-45,view.bottom))/2;
  sc.scrollTop+=target-aim;
  return {scrollId:sc.id,scrollTag:sc.tagName,scrollTop:sc.scrollTop};
 },{day,i});
 await s.page.waitForTimeout(80);
 const proof=await s.page.evaluate(({day,i})=>{
  const f=document.querySelector('[data-night1252="'+day+'"] iframe'),d=f.contentDocument,sheet=d.querySelectorAll('.sheet')[i],fr=f.getBoundingClientRect(),sr=sheet.getBoundingClientRect(),x=fr.left+sr.left+sr.width/2,y=fr.top+sr.top+Math.min(sr.height/2,180),outer=document.elementFromPoint(x,y),inner=d.elementFromPoint(x-fr.left,y-fr.top),visible=y>280&&y<innerHeight-40&&x>0&&x<innerWidth;
  return {page:i+1,x,y,outerIsFrame:outer===f,innerInSheet:!!(inner&&sheet.contains(inner)),visible,text:sheet.innerText.slice(0,240),height:sr.height};
 },{day,i});
 assert(proof.visible,'Report page must be in the visible main viewport');assert(proof.outerIsFrame,'Report frame must be the painted hit target');assert(proof.innerInSheet,'Native report page must be painted at the hit point');assert(proof.text.trim().length>40,'Report page must contain native text');
 r.positions.push({...position,...proof});
 if(i===0||i===Math.floor(count/2)||i===count-1)await s.page.screenshot({path:path.join(out,day+'-page'+(i+1)+'-viewport.png')});
 }
 result.reports.push(r);
 }
 result.errors=s.errors;result.consoleErrors=s.consoleErrors;result.writes=s.counts.blocked;assert.deepEqual(s.errors,[]);assert.deepEqual(s.consoleErrors,[]);assert.equal(s.counts.blocked,0);result.status='PASS';console.log('PASS actual outer-scroll report page visibility');
 }finally{await s.browser.close();fs.writeFileSync(path.join(out,'report-scroll.json'),JSON.stringify(result,null,2)+'\n');}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
