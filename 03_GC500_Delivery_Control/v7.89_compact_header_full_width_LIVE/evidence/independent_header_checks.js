// Author: Andrew Fisher. Read-only header layout, native scroll thresholds and phone baseline comparison.
// PAGE=<candidate> BASE=<base_live.html> OUT=<private directory> node independent_header_checks.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const out = process.env.OUT; fs.mkdirSync(out,{recursive:true});
(async () => {
 const tests=[], measurements={};
 const ok=(name,pass)=>tests.push({name,pass:!!pass});
 const measure=async p=>p.evaluate(()=>{
  const h=document.querySelector('header.top'),r=document.querySelector('.brandrow'),cl=document.querySelector('#hzcluster'),rs=getComputedStyle(r);
  const rect=e=>{const z=e.getBoundingClientRect();return {x:z.x,y:z.y,w:z.width,h:z.height};};
  const pane=[...document.querySelectorAll('main > section.pane')].find(e=>!e.hidden&&e.offsetHeight>50);
  return {header:rect(h),row:rect(r),rowInner:r.clientWidth-parseFloat(rs.paddingLeft)-parseFloat(rs.paddingRight),cluster:rect(cl),pods:['#tpod','#hzcd','#recstrip'].map(s=>rect(document.querySelector(s))),pane:rect(pane),slim:h.classList.contains('slim89'),y:document.querySelector('main').scrollTop,overflow:document.documentElement.scrollWidth>innerWidth+1,windowW:innerWidth};
 });
 const s=await open({pageFile:process.env.PAGE,W:1333,H:693});
 try {
  const p=s.page;
  await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:240000});
  await p.evaluate(()=>go('timeline'));await p.waitForTimeout(1200);
  await p.evaluate(()=>{window.__headerTransitions89=[];new MutationObserver(()=>window.__headerTransitions89.push(document.querySelector('header.top').classList.contains('slim89'))).observe(document.querySelector('header.top'),{attributes:true,attributeFilter:['class']});});
  for(const [name,W,H] of [['laptop',1333,693],['wide',1920,1040],['small',1100,800],['boundary',641,800]]){
   await p.setViewportSize({width:W,height:H});
   await p.evaluate(()=>{document.querySelector('main').scrollTop=0;});await p.waitForTimeout(300);
   const top=await measure(p);
   ok(name+': equal pod widths',Math.max(...top.pods.map(x=>x.w))-Math.min(...top.pods.map(x=>x.w))<1);
   if(W>=1280)ok(name+': pods occupy half the header content row',Math.abs(top.cluster.w-top.rowInner*.5)<1);
   ok(name+': pane fills main width',Math.abs(top.pane.w-(W-32))<=2);
   ok(name+': no horizontal overflow',!top.overflow);
   const states=[];
   for(const y of [90,91,50,12,11,80,600,0]){
    await p.evaluate(y=>{document.querySelector('main').scrollTop=y;},y);await p.waitForTimeout(180);
    states.push(await measure(p));
   }
   const expected=[false,true,true,true,false,false,true,false];
   ok(name+': native scroll hysteresis 90/91/50/12/11/80/600/0',states.every((x,i)=>x.slim===expected[i]));
   ok(name+': reduced header restores at top',states[1].header.h<top.header.h&&Math.abs(states[7].header.h-top.header.h)<1);
   measurements[name]={top,thresholds:states.map(x=>({y:x.y,slim:x.slim,headerHeight:x.header.h}))};
   if(name==='laptop'||name==='wide'){
    await p.screenshot({path:path.join(out,name+'_top.png')});
    await p.evaluate(()=>{document.querySelector('main').scrollTop=600;});await p.waitForTimeout(200);
    await p.screenshot({path:path.join(out,name+'_scrolled.png')});
   }
  }
  ok('Desktop: zero page errors',s.errors.length===0);ok('Desktop: no attempted writes',s.counts.blocked===0);
 }finally{await s.browser.close();}
 const phone={};
 for(const [name,pageFile] of [['base',process.env.BASE],['candidate',process.env.PAGE]]){
  const s=await open({pageFile,W:390,H:844,dpr:2,mobile:true});
  try{
   await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:240000});
   await s.page.evaluate(()=>go('timeline'));await s.page.waitForTimeout(1000);
   const top=await measure(s.page);
   await s.page.screenshot({path:path.join(out,'phone_'+name+'_top.png')});
   await s.page.evaluate(()=>{document.querySelector('main').scrollTop=600;});await s.page.waitForTimeout(250);
   const scroll=await measure(s.page);phone[name]={top,scroll};
   ok('Phone '+name+': zero page errors and writes',!s.errors.length&&s.counts.blocked===0);
  }finally{await s.browser.close();}
 }
 for(const state of ['top','scroll']){
  const a=phone.base[state],b=phone.candidate[state];
  ok('Phone '+state+': original header geometry retained',Math.abs(a.header.h-b.header.h)<1&&Math.abs(a.pane.w-b.pane.w)<1&&a.pods.every((r,i)=>Math.abs(r.w-b.pods[i].w)<1&&Math.abs(r.h-b.pods[i].h)<1));
  ok('Phone '+state+': no horizontal overflow',!b.overflow);
 }
 measurements.phone=phone;
 const report={author:'Andrew Fisher',candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),passed:tests.filter(x=>x.pass).length,total:tests.length,tests,measurements};
 fs.writeFileSync(path.join(out,'header_checks.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({passed:report.passed,total:report.total,failed:tests.filter(x=>!x.pass)}));
 if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
