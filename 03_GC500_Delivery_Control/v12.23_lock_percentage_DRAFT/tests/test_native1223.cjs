/* Author: Andrew Fisher. Real main servicing controller; intercepted synthetic tracker ticks, no live writes. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const mobile=!!process.env.MOB,TOKEN='test1223Token000000001';
let checks=0;const check=(v,m)=>{assert(v,m);checks++;console.log('PASS '+m);};
(async()=>{
 const snap=JSON.parse(fs.readFileSync(process.env.TICKS,'utf8'));
 const ver=JSON.parse(require('child_process').execFileSync('curl',['-sS','--max-time','30','-H','x-gc500-token: Coates-GC500-2026','https://gc500-production.up.railway.app/api/version']).toString());
 const meta={...snap.meta,token:TOKEN,seq:1,total_seq:1,active_ticks:1,historical_ticks:0,ticks:[],voids:[],void_seq:0,void_more:false,more:false};
 const final=meta.tracker.days.find(d=>d.plan==='final').id;
 const line=meta.tracker.lines.find(l=>(meta.tracker.plans[l.kind].final||[]).includes('lockup')&&l.qty>1);
 assert(line,'Grouped lock target available in the supplied private configuration');
 const events=[{id:'synthetic-lock1223',line:line.id,ref:line.ref,task:'lockup',day:final,done:true,at:meta.now,tapped_at:meta.now,crew_group:'cleaners'}];
 const s=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1}),p=s.page;
 let routeWrites=0;const consoleErrors=[];p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 try{
  await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:120000});
  await p.route('**/api/version*',r=>{if(r.request().method()!=='GET'){routeWrites++;return r.abort();}return r.fulfill({json:{...ver,level:'edit'}});});
  await p.route('**/api/ticks*',r=>{
   if(r.request().method()!=='GET'){routeWrites++;return r.abort();}
   const u=new URL(r.request().url()),tok=u.searchParams.get('token');
   if(!tok)return r.fulfill({json:{now:meta.now,service_day:meta.service_day,trackers:[{token:TOKEN,load:meta.load,title:meta.title,tracker:meta.tracker,card_withdrawn:false,expired:false,key_kept:true,active_ticks:1}]}});
   if(tok!==TOKEN)return r.fulfill({status:404,json:{error:'unknown synthetic tracker'}});
   return r.fulfill({json:{...meta,ticks:Number(u.searchParams.get('since'))>=1?[]:events}});
  });
  await p.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>false;SYNC.readonly=false;SYNC.level='edit';SYNC.claims='edit';applyCapability();go('servicing');renderServicing1084();});
  await p.waitForFunction(()=>window.svcNight1202&&svcNight1202()&&document.querySelector('.svc1123-job.lockup'),null,{timeout:90000});
  const inspect=()=>p.evaluate(()=>{
   const sn=svcNight1202(),cfg={plans:sn.D.plans,days:sn.D.days,extras:sn.D.extras},refs=sn.D.areas.flatMap(a=>a.refs);
   const expected=SvcState.taskStats(cfg,refs,sn.day,SvcState.jobStates(sn.events,sn.now));
   const cards=[...document.querySelectorAll('.svc1123-job')].map(e=>({task:['pump','clean','refill','lockup'].find(t=>e.classList.contains(t)),pct:e.querySelector('.pct').textContent,details:e.querySelector('small').textContent,label:e.querySelector('.svc1123-t>b:not(.pct)').textContent}));
   return {day:sn.day,expected,cards,small:[...document.querySelectorAll('#svc1067 .svc-tasks li')].map(e=>e.querySelector('span').textContent+' '+e.querySelector('b').textContent).join(' | '),areaLocks:document.querySelectorAll('.svc1123-chip.lockup').length,overflow:document.documentElement.scrollWidth>innerWidth+2,footer:/v12\.23/.test(document.body.innerText)};
  });
  let r=await inspect(),lock=r.cards.find(c=>c.task==='lockup'),g=r.expected.lockup;
  check(r.day===final&&g.d>0&&g.d<g.w,'selected final night reads the intercepted grouped completion');
  check(lock.pct===g.pct+'%'&&lock.details.startsWith(g.d+' of '+g.w),'large lock percentage and done/total match the shared saved-state model');
  check(lock.label==='Locked (doors locked)'&&r.small.includes(lock.label+' '+g.d+' of '+g.w),'large and existing small lock totals agree with explicit door-lock label');
  check(r.cards.map(c=>c.task).join()==='pump,clean,lockup'&&r.areaLocks>0,'final night has pump, clean and lock rings plus area lock chips');
  check(!r.overflow,'main servicing has no horizontal overflow');
  const face=()=>p.evaluate(()=>{const el=document.querySelector('#svc1067-host'),host=getComputedStyle(el),after=getComputedStyle(el,'::after');return {host:host.background,face:after.background};});
  const layout=()=>p.evaluate(()=>[...document.querySelectorAll('.svc1123-job')].map(e=>{const r=e.getBoundingClientRect(),t=e.querySelector('.svc1123-t').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,text:t.width,area:getComputedStyle(e).gridArea,order:getComputedStyle(e).order};}));
  let colors=await face();check(colors.face===colors.host&&colors.host.includes('linear-gradient'),'servicing pseudo-face inherits its dark gradient, keeping pale text legible');
  let boxes=await layout();check(boxes.every(b=>b.text>=100)&&Math.max(...boxes.map(b=>b.w))-Math.min(...boxes.map(b=>b.w))<2&&Math.max(...boxes.map(b=>mobile?b.x:b.y))-Math.min(...boxes.map(b=>mobile?b.x:b.y))<2,'all job indicators have equal widths, usable text space and aligned rows or columns');
  const searchVisible=await p.evaluate(()=>{document.body.classList.add('search-open');try{return [...document.querySelectorAll('.svc1123-job.lockup,.svc1123-chip.lockup')].every(e=>getComputedStyle(e).display!=='none');}finally{document.body.classList.remove('search-open');}});
  check(searchVisible,'header search does not hide lock indicators');
  check(r.footer,'candidate footer identifies v12.23');
  if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await p.locator('.svc1123-jobs[data-svc1123="overall"]').scrollIntoViewIfNeeded();await p.waitForTimeout(600);await p.locator('.svc1123-jobs[data-svc1123="overall"]').screenshot({path:path.join(process.env.EVIDENCE,'native-rings-'+(mobile?'phone':'desktop')+'.png')});
   await p.screenshot({path:path.join(process.env.EVIDENCE,'native-screen-'+(mobile?'phone':'desktop')+'.png')});
   fs.writeFileSync(path.join(process.env.EVIDENCE,'native-styles-'+(mobile?'phone':'desktop')+'.json'),JSON.stringify(await p.evaluate(()=>{let x=document.querySelector('.svc1123-job.lockup .pct'),a=[];while(x){const s=getComputedStyle(x);a.push({tag:x.tagName,id:x.id,cl:x.className,color:s.color,background:s.background,opacity:s.opacity});x=x.parentElement;}return a;}),null,2));
  }
  if(!mobile){
   await p.setViewportSize({width:768,height:1024});colors=await face();
   check(colors.face===colors.host&&!(await inspect()).overflow,'tablet retains dark face and fits the progress indicators');
   boxes=await layout();check(boxes.every(b=>b.text>=100)&&Math.max(...boxes.map(b=>b.y))-Math.min(...boxes.map(b=>b.y))<2&&Math.max(...boxes.map(b=>b.w))-Math.min(...boxes.map(b=>b.w))<2,'tablet lock stays in the same equal-width row; no header grid placement leaks');
   if(process.env.EVIDENCE)await p.locator('.svc1123-jobs[data-svc1123="overall"]').screenshot({path:path.join(process.env.EVIDENCE,'native-rings-tablet.png')});
   await p.setViewportSize({width:1440,height:1000});
  }
  const prior=meta.tracker.days.filter(d=>d.id<final&&d.plan==='night').at(-1).id;
  await p.evaluate(day=>{const b=document.querySelector('[data-svc-day="'+day+'"]');const d=b.closest('details');if(d)d.open=true;b.click();},prior);
  await p.waitForFunction(day=>svcNight1202().day===day&&!document.querySelector('.svc1123-job.lockup'),prior);
  r=await inspect();check(r.cards.map(c=>c.task).join()==='pump,clean,refill'&&!r.areaLocks,'previous night retains water and no lock indicators');
  await p.locator('[data-svc-day="'+final+'"]').click();
  await p.waitForFunction(day=>svcNight1202().day===day&&!!document.querySelector('.svc1123-job.lockup'),final);
  r=await inspect();check(r.cards.find(c=>c.task==='lockup').pct===g.pct+'%','returning to tonight restores its saved lock percentage');
  check(s.errors.length===0&&consoleErrors.length===0,'no page or console errors');
  check(s.counts.blocked===0&&routeWrites===0,'no attempted record writes');
  console.log(JSON.stringify({checks,mobile,readOnly:true,syntheticTicks:true}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error('FAIL '+e.message.slice(0,300));process.exit(1);});
