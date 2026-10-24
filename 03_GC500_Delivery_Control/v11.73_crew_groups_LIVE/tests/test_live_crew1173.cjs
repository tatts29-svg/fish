// Author: Andrew Fisher. Actual published crew page, GET-only, no test completions.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const snap=JSON.parse(fs.readFileSync(process.env.SNAPSHOT)),roster=JSON.parse(fs.readFileSync(process.env.GC500_CREW_ROSTER)),HOST='https://gc500-production.up.railway.app';
(async()=>{
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>k!=='GC500_EDIT_TOKEN'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox'],env});
 let checks=0,writes=0;const errors=[];const check=(v,m)=>{assert(v,m);checks++;};
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Australia/Brisbane',serviceWorkers:'block'});
  await ctx.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(r.method()!=='GET'){writes++;return route.abort();}if(u.origin!==HOST)return route.abort();try{return route.fulfill(await curlFetch(r.url(),r.headers(),'GET'));}catch(e){return route.abort();}});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const lines=snap.meta.tracker.lines.filter(l=>l.kind==='fwf'&&l.ref!=='SPASHDOWN'),ref=lines[0].ref;
  await p.goto(HOST+'/d/'+snap.meta.token+'#r='+ref+'.'+snap.meta.links[ref]+'~clean',{waitUntil:'domcontentloaded',timeout:90000});
  await p.waitForFunction(()=>document.querySelector('#crew1173-choice')&&!document.querySelector('#crew1173-help').parentElement.textContent.includes('Waiting for the service'),null,{timeout:60000});
  await p.waitForFunction(()=>document.body.innerText.includes('Live · updated'),null,{timeout:45000});
  check(await p.locator('#crew1173-choice').inputValue()==='','fresh phone requires explicit crew choice');
  const actual=await p.locator('#crew1173-choice option').evaluateAll(opts=>opts.filter(o=>o.value).map(o=>({id:o.value,label:o.textContent})));
  check(JSON.stringify(actual)===JSON.stringify(roster),'all five authorised group labels match exactly');
  check(await p.locator('[data-job]').evaluateAll(bs=>bs.filter(b=>!b.classList.contains('done')&&!b.classList.contains('pending')).every(b=>b.disabled)),'unfinished jobs require group choice');
  check(await p.locator('[data-job]').evaluateAll(bs=>bs.some(b=>b.dataset.job.endsWith('|clean'))&&bs.some(b=>b.dataset.job.endsWith('|refill'))),'clean QR retains separate cleaning and water tasks');
  await p.selectOption('#crew1173-choice','water');
  check(await p.locator('#crew1173-choice').inputValue()==='water','water crew selectable through cleaning QR');
  check(await p.locator('[data-job]').evaluateAll(bs=>bs.filter(b=>!b.classList.contains('done')&&!b.classList.contains('pending')).every(b=>!b.disabled)),'group choice enables unfinished jobs in open service day');
  await p.selectOption('#crew1173-choice','pump3');await p.locator('.crew1173').scrollIntoViewIfNeeded();
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'longest crew label fits phone');
  if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await p.screenshot({path:path.join(process.env.EVIDENCE,'live-crew-groups.png')});}
  await p.reload();await p.waitForSelector('#crew1173-choice');check(await p.locator('#crew1173-choice').inputValue()==='','reload clears crew selection');
  await p.selectOption('#crew1173-choice','pump1');const next=lines.find(l=>l.ref!==ref).ref;
  await p.evaluate(h=>location.hash=h,'#r='+next+'.'+snap.meta.links[next]+'~pump');await p.waitForFunction(()=>document.querySelector('[data-job]')?.dataset.job.endsWith('|pump'));
  check(await p.locator('#crew1173-choice').inputValue()==='','new reference clears crew selection');
  check(await p.locator('[data-job]').evaluateAll(bs=>bs.every(b=>b.dataset.job.endsWith('|pump'))),'pump QR retains pump-only permissions');
  check(await p.evaluate(()=>svc1067.outbox().length===0),'read-only check creates no queued completions');
  check(errors.length===0,'no page errors');check(writes===0,'no writes attempted');
  console.log(JSON.stringify({checks,errors,writes,actualLivePage:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
