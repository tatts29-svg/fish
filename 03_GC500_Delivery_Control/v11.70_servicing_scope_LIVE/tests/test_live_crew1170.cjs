// Author: Andrew Fisher. Read-only check of the published crew card, using its private receipt.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const snap=JSON.parse(fs.readFileSync(process.env.SNAPSHOT)),HOST='https://gc500-production.up.railway.app';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});let checks=0,writes=0;const errors=[];const check=(v,m)=>{assert(v,m);checks++;};
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Australia/Brisbane',serviceWorkers:'block'});
  await ctx.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(r.method()!=='GET'){writes++;return route.abort();}if(u.origin!==HOST)return route.abort();try{return route.fulfill(await curlFetch(r.url(),r.headers(),'GET'));}catch(e){return route.abort();}});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(HOST+'/d/'+snap.meta.token+'#r=SPASHDOWN.'+snap.meta.links.SPASHDOWN+'~pump',{waitUntil:'load',timeout:90000});
  await p.waitForFunction(()=>window.svc1067&&document.querySelector('#view')?.textContent.includes('removed from servicing to-do'));
  await p.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Live')||document.body.innerText.includes('Live · updated'),null,{timeout:45000});
  await p.evaluate(()=>document.querySelector('[data-day="2026-10-23"]').click());
  await p.waitForSelector('.svc-history1170');
  check(await p.evaluate(()=>!svc1067.areas.some(a=>a.refs.some(r=>r.ref==='SPASHDOWN'))),'live active scope excludes reference');
  check(await p.locator('[data-job],[data-undo]').count()===0,'old QR has no completion controls');
  check((await p.locator('.svc-history1170').innerText()).includes('Recorded complete'),'saved history visible');
  check(!(await p.locator('.notdone').innerText()).includes('SPASHDOWN'),'live to-do excludes reference');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'phone fits');
  if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await p.screenshot({path:path.join(process.env.EVIDENCE,'live-crew.png')});}
  check(errors.length===0,'no page errors');check(writes===0,'no writes');
  console.log(JSON.stringify({checks,errors,writes}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
