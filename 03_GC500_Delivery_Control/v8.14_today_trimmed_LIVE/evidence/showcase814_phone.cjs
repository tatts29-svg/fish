// Author: Andrew Fisher. Actual phone dialog checks after printing; no live writes.
const {open}=require('../../toolchain/harness/open_page');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const report={author:'Andrew Fisher',purpose:'Distinguish the Showcase dialog from its optional Backdrop selector',runs:[]};
(async()=>{for(const [tag,file] of [['base',process.env.BASE],['candidate',process.env.PAGE]]){
 const s=await open({pageFile:file,W:390,H:844,dpr:2,mobile:true,gl:false}),p=s.page;
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length);
  await p.evaluate(()=>go('today'));await p.waitForTimeout(1500);
  await p.evaluate(async()=>{const save=window.print;window.print=()=>{};try{document.querySelector('#printProgress').click();await new Promise(r=>setTimeout(r,350));window.dispatchEvent(new Event('afterprint'));}finally{window.print=save;}});
  await p.evaluate(()=>document.body.classList.add('printing-progress'));await p.emulateMedia({media:'print'});
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>document.body.classList.remove('printing-progress'));
  const cycles=[];
  for(let n=0;n<2;n++){
   await p.evaluate(()=>document.querySelector('#showStart').click());
   await p.waitForFunction(()=>SHOW.open&&!document.querySelector('#showcase').hidden&&document.body.classList.contains('showing'));
   await p.evaluate(()=>{if(SHOW.playing)document.querySelector('#showPause').click();});
   await p.waitForTimeout(2500);
   const opened=await p.evaluate(()=>{const m=document.querySelector('#showcase'),b=document.querySelector('#showBack'),d=document.querySelector('#showBackdrop'),r=m.getBoundingClientRect();return{open:SHOW.open,hidden:m.hidden,role:m.getAttribute('role'),modal:m.getAttribute('aria-modal'),showing:document.body.classList.contains('showing'),width:r.width,height:r.height,display:getComputedStyle(m).display,backVisible:!!b.getClientRects().length,focusInside:m.contains(document.activeElement),backdropTag:d.tagName,backdropVisible:!!d.getClientRects().length,backdropParentDisplay:getComputedStyle(d.parentElement).display,carFocus:m.classList.contains('car-focus'),printing:document.body.classList.contains('printing-progress')};});
   assert(opened.open&&!opened.hidden&&opened.role==='dialog'&&opened.modal==='true'&&opened.showing&&opened.width>0&&opened.height>0&&opened.display!=='none'&&opened.backVisible&&opened.focusInside&&!opened.printing,JSON.stringify(opened));
   let options=null;
   console.log(tag,n,'dialog',JSON.stringify(opened));
   if(n===0&&await p.locator('#showOptions794').isVisible()){
    if(await p.locator('#showOptions794').getAttribute('aria-expanded')!=='true')await p.locator('#showOptions794').click();
    options=await p.evaluate(()=>({open:SHOW.open,expanded:document.querySelector('#showOptions794').getAttribute('aria-expanded'),backdropVisible:!!document.querySelector('#showBackdrop').getClientRects().length}));
    assert(options.open&&options.expanded==='true'&&options.backdropVisible,JSON.stringify(options));
   }
   if(tag==='candidate'&&n===0)await p.screenshot({path:'/workspace/private-release-v814/showcase-phone.png'});
   await p.locator('#showBack').click();
   const closed=await p.evaluate(()=>({open:SHOW.open,hidden:document.querySelector('#showcase').hidden,showing:document.body.classList.contains('showing'),appInert:document.querySelector('#app')?.hasAttribute('inert')||false}));
   assert(!closed.open&&closed.hidden&&!closed.showing&&!closed.appInert,JSON.stringify(closed));cycles.push({opened,options,closed});
   console.log(tag,n,'closed',JSON.stringify(closed));
  }
  assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
  report.runs.push({tag,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),cycles,errors:s.errors,blockedWrites:s.counts.blocked});
 }finally{await s.browser.close();}
}
fs.writeFileSync(path.join(__dirname,'showcase814_phone.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS actual Showcase phone dialog, Options, close and reopen on base and candidate');
})().catch(e=>{console.error(e);process.exitCode=1});
