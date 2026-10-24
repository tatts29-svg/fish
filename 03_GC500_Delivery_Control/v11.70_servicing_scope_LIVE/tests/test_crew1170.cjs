// Author: Andrew Fisher. Synthetic crew checks; all network writes are blocked.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const page=fs.readFileSync(process.env.PAGE,'utf8');
const line=page.split('\n').find(x=>x.startsWith('var SVC1067_CARD='));
const bundle=JSON.parse(line.slice(17,-1));
const D=JSON.parse(JSON.stringify(bundle.data));D.contact={name:'Test contact',phone:'0000000000'};
const html=bundle.html.replace('/*SVC1067_DATA*/null',JSON.stringify(D).replace(/<\//g,'<\\/'));
const now='2026-10-23T21:00:00Z',day='2026-10-23';
const removed=D.areas.flatMap(a=>a.refs).find(r=>r.ref==='SPASHDOWN');
const kept=D.areas.find(a=>a.refs.some(r=>r.ref==='SPASHDOWN')).refs.find(r=>r.ref!=='SPASHDOWN'&&r.lines.some(l=>D.plans[l.kind].night.includes('pump')));
const tick={id:'test-saved',line:removed.lines[0].id,ref:removed.ref,task:'pump',day,done:true,at:'2026-10-23T20:00:00Z',seq:1};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 let checks=0,writes=0;const errors=[];const check=(v,m)=>{assert(v,m);checks++;};
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Australia/Brisbane',serviceWorkers:'block'});
  await ctx.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(r.method()!=='GET'){writes++;return route.abort();}if(u.pathname==='/d/TESTSCOPE1170')return route.fulfill({contentType:'text/html',body:html});if(u.pathname.endsWith('/ticks'))return route.fulfill({contentType:'application/json',body:JSON.stringify({ticks:[tick],now,days:D.days,seq:1,epoch:'test',more:false,updated:'test'})});return route.fulfill({status:404,body:''});});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('https://gc500-production.up.railway.app/d/TESTSCOPE1170');
  await p.waitForFunction(()=>window.svc1067&&document.querySelector('.log'));
  check(await p.evaluate(()=>!svc1067.areas.some(a=>a.refs.some(r=>r.ref==='SPASHDOWN'))),'active crew areas exclude removed reference');
  check(await p.locator('.log').innerText().then(t=>t.includes('SPASHDOWN')&&t.includes('history only')),'crew audit preserves completion');
  check(!(await p.locator('.notdone').allTextContents()).join(' ').includes('SPASHDOWN'),'not-done card excludes reference');
  await p.evaluate(ref=>location.hash='#r='+ref+'.abcdefghijklmnop~pump',kept.ref);
  await p.waitForSelector('[data-job]');
  check(await p.locator('[data-job]').count()>0,'other reference still offers service');
  check(!(await p.locator('.left-list').innerText()).includes('SPASHDOWN'),'same-area to-go excludes reference');
  check(await p.evaluate(()=>!SvcSaved1127(window.svc1067.areas.flatMap(a=>a.refs).find(r=>r.ref!=='SPASHDOWN').ref).includes('SPASHDOWN')),'saved status and nearest suggestions exclude reference');
  await p.evaluate(()=>location.hash='#r=SPASHDOWN.abcdefghijklmnop~pump');
  await p.waitForSelector('.svc-history1170');
  check((await p.locator('#view').innerText()).includes('removed from servicing to-do'),'old QR explains removal');
  check(await p.locator('[data-job],[data-undo]').count()===0,'old QR has no job controls');
  check((await p.locator('.svc-history1170').innerText()).includes('Recorded complete'),'old QR retains saved completion');
  check(await p.evaluate(id=>svc1067.shownTasks({id,kind:'pump_only'},'2026-10-23').length===0,removed.lines[0].id),'tap guard rejects excluded line');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'phone fits viewport');
  check(errors.length===0,'no crew errors');check(writes===0,'zero writes');
  if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await p.screenshot({path:process.env.EVIDENCE+'/crew-old-qr.png'});}
  console.log(JSON.stringify({checks,errors,writes}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
