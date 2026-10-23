// Author: Andrew Fisher. Read the real tracker in the native Servicing tab.
// Authentication is host-scoped and read only; no key enters the browser or command arguments.
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const {open}=require('../../toolchain/harness/open_page');
function read(url){return new Promise((resolve,reject)=>{
 const source="import os,sys,urllib.request,urllib.parse\nu=sys.argv[1];p=urllib.parse.urlsplit(u)\nassert p.scheme=='https' and p.netloc=='gc500-production.up.railway.app' and p.path in ('/api/version','/api/ticks')\nr=urllib.request.Request(u,headers={'x-gc500-token':os.environ['GC500_EDIT_TOKEN']},method='GET')\nwith urllib.request.urlopen(r,timeout=60) as f:sys.stdout.buffer.write(f.read())\n";
 const child=spawn('python3',['-c',source,url],{env:process.env,stdio:['ignore','pipe','pipe']}),chunks=[];
 child.stdout.on('data',d=>chunks.push(d));child.stderr.resume();child.on('error',()=>reject(Error('Read-only authenticated request unavailable')));child.on('close',code=>code?reject(Error('Read-only authenticated request failed')):resolve(Buffer.concat(chunks)));
});}
(async()=>{
 const mobile=!!process.env.MOB,s=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1}),p=s.page;
 let checks=0;const check=(v,msg)=>{assert(v,msg);checks++;};
 try{
  await p.route('https://gc500-production.up.railway.app/api/**',async route=>{
   const r=route.request(),u=new URL(r.url());if(r.method()==='GET'&&['/api/version','/api/ticks'].includes(u.pathname))return route.fulfill({status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:await read(r.url())});return route.fallback();
  });
  await p.context().addInitScript(()=>{window.print=()=>{};});
  await p.evaluate(()=>{
   const update=SvcMap1099.update;SvcMap1099.update=function(host,M){window.shiftInput=M;return update.apply(this,arguments);};
   const originalOpen=SvcShift1168.open;SvcShift1168.open=function(I){window.shiftInstance=I;return originalOpen.apply(this,arguments);};
   window.capability=()=> 'edit';window.mayWrite=()=>false;SYNC.readonly=false;SYNC.level='edit';SYNC.claims='edit';go('servicing');renderServicing1084();
  });
  await p.waitForFunction(()=>window.shiftInput&&!window.shiftInput.readStatus&&!window.shiftInput.test1164,null,{timeout:90000});
  const launch=p.locator('#pane-servicing [data-shift1168]');check(await launch.count()===1,'one report button');await launch.click();
  const dialog=p.locator('.svc-shift1168'),print=dialog.getByRole('button',{name:'Print / save PDF',exact:true});
  await print.waitFor();await p.waitForFunction(()=>!document.querySelector('.svc-shift1168 button:nth-child(1)')?.disabled&&document.querySelector('.shift1168-report'));
  check(await print.isEnabled(),'ready to print');
  const result=await p.evaluate(()=>{
   const M=window.shiftInput,before=performance.now(),s=SvcShift1168.snapshot(M),html=SvcShift1168.html(s),elapsed=performance.now()-before;
   const states=M.S.jobStates(M.events,M.now),saved=Object.fromEntries(Object.entries(states).filter(([,s])=>!s.local));
   const refs=M.D.areas.flatMap(a=>a.refs),native=M.S.groupStats(M.D,refs,M.day,saved);
   if(JSON.stringify(native)!==JSON.stringify(s.overall))throw Error('Native and report totals differ');
   if(s.day!==M.day||s.test||s.stale)throw Error('Wrong shift or unverified read');
   if(html.includes(M.context1164)||SvcShift1168.csv(s).includes(M.context1164))throw Error('Tracker credential in export');
   return {summary:SvcShift1168.summary(s),csv:SvcShift1168.csv(s),day:s.day,refs:s.overall.refs,renderMs:elapsed};
  });checks+=3;
  check((await dialog.innerText()).includes('Not recorded complete'),'honest missing-state label');
  check(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'phone dialog does not overflow');
  check(await dialog.locator('.shift1168-report table').first().evaluate(el=>el.getBoundingClientRect().width<=el.parentElement.clientWidth+1),'summary shows every count without sideways scrolling');
  const dir=process.env.EVIDENCE;if(dir){fs.mkdirSync(dir,{recursive:true});await p.screenshot({path:path.join(dir,'shift-report.png')});}
  const downloaded=p.waitForEvent('download');await dialog.getByRole('button',{name:'Download CSV',exact:true}).click();const download=await downloaded;
  check(download.suggestedFilename()==='GC500-servicing-shift-'+result.day+'.csv','night in CSV filename');
  const file=await download.path(),actual=fs.readFileSync(file,'utf8');check(actual===result.csv,'CSV exact snapshot');if(dir)await download.saveAs(path.join(dir,download.suggestedFilename()));
  await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
  await dialog.getByRole('button',{name:'Copy summary',exact:true}).click();const copy=dialog.locator('textarea');await copy.waitFor();check(await copy.inputValue()===result.summary,'clipboard fallback exact summary');
  const popupEvent=p.waitForEvent('popup');await print.click();const popup=await popupEvent;await popup.waitForLoadState('domcontentloaded');
  check(await popup.locator('.shift1168-ledger').getAttribute('open')!==null,'print contains open ledger');
  check(await popup.locator('.shift1168-ledger table').count()===15,'every area included in printed ledger');
  check(await popup.locator('body').innerText().then(t=>t.includes('Author: Andrew Fisher')&&t.includes(result.day)),'print labelled and dated');
  if(dir){await popup.pdf({path:path.join(dir,'shift-report.pdf'),format:'A4',printBackground:true});}
  await popup.close();
  await dialog.getByRole('button',{name:'Close',exact:true}).click();check(await dialog.count()===0,'close removes private report');
  await launch.click();await p.waitForFunction(()=>document.querySelector('.shift1168-report'));
  await p.evaluate(()=>{const I=window.shiftInstance;I.M=Object.assign({},I.M,{context1164:'changed-test-context'});SvcShift1168.context(I);});check(await dialog.count()===0,'tracker change closes report');
  await p.evaluate(()=>{window.shiftInstance.M=window.shiftInput;});
  await launch.click();await p.waitForFunction(()=>document.querySelector('.shift1168-report'));
  await p.evaluate(()=>{const I=window.shiftInstance;I.M=Object.assign({},I.M,{day:'2026-10-25'});SvcShift1168.context(I);});check(await dialog.count()===0,'night change closes report');
  await p.evaluate(()=>{window.shiftInstance.M=window.shiftInput;});
  await launch.click();await p.waitForFunction(()=>document.querySelector('.shift1168-report'));
  await p.evaluate(()=>{const I=window.shiftInstance;window.savedRefresh=I.M.refresh;I.M=Object.assign({},I.M,{readStatus:'Offline',refresh:()=>Promise.reject(Error('offline'))});});
  await dialog.getByRole('button',{name:'Refresh report',exact:true}).click();await dialog.locator('.shift1168-warning').waitFor();check((await dialog.innerText()).includes('last verified progress'),'offline report labelled');
  await dialog.getByRole('button',{name:'Close',exact:true}).click();await p.evaluate(()=>{window.shiftInstance.M=window.shiftInput;});
  await launch.click();await p.waitForFunction(()=>document.querySelector('.shift1168-report'));
  await p.evaluate(()=>{window.capability=()=> 'view';SYNC.readonly=true;SYNC.level='view';SYNC.claims='view';renderServicing1084();});check(await dialog.count()===0,'lost access clears private report');
  check(s.errors.length===0,'no page errors');check(s.counts.blocked===0,'zero record writes');
  console.log(JSON.stringify({checks,mobile,livePage:!process.env.PAGE,refs:result.refs,renderMs:Math.round(result.renderMs),errors:s.errors,blockedWrites:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error('FAIL shift report: '+String(e.message).slice(0,300));process.exit(1);});
