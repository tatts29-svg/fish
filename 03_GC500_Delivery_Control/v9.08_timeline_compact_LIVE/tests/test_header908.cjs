// Author: Andrew Fisher. Native header arrangement preview and GET-only layout checks.
// Run under flock /tmp/gc500-browser.lock; PAGE is the final base/candidate, OUT is private.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const root=path.resolve(__dirname,'..'), css=fs.readFileSync(path.join(root,'header908.css'),'utf8');
const HOST='https://gc500-production.up.railway.app';
const scenarios=[[1440,900],[2560,1440],[3840,2160],[390,844],[844,390],[1440,600]];
const out=process.env.OUT||'/tmp/gc500-header908';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const results=[];
 try{for(const [width,height] of scenarios){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:width===390,deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Brisbane'});
  const errors=[],blocked=[],checks=[];
  const ok=(name,pass,detail)=>checks.push({name,pass:!!pass,detail});
  await ctx.route('**/*',async route=>{
   const req=route.request(),url=req.url();
   if(url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
   if(req.method()!=='GET'){blocked.push({origin:new URL(url).origin,path:new URL(url).pathname});return route.abort();}
   if(new URL(url).origin===HOST&&/^\/v\/Coates-GC500-2026\/?$/.test(new URL(url).pathname))return route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(process.env.PAGE)});
   try{return route.fulfill(await curlFetch(url,req.headers(),'GET'));}catch(_){return route.abort('failed');}
  });
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.print=()=>{throw Error('Native printing is prohibited in header checks');};});
  await p.goto(HOST+'/v/Coates-GC500-2026#today',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>window.GC500Refresh904?.report().settled&&SYNC.status==='live',null,{timeout:90000});
  await p.evaluate(()=>{document.querySelector('main').scrollTop=0;window.__header908Nodes=['tpod','hzcd','recstrip','navBack','q','moreBtn'].map(id=>document.getElementById(id));});
  await p.waitForTimeout(200);
  const imageReady=await p.evaluate(()=>new Promise(resolve=>{const scene=document.querySelector('#where885 .s896-yard');if(!scene)return resolve(false);const url=/url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(scene).backgroundImage)?.[1];if(!url)return resolve(false);const image=new Image();image.onload=()=>resolve(image.naturalWidth>1000);image.onerror=()=>resolve(false);image.src=url;}));
  ok('real-page preview includes the current rendered hero',imageReady);
  const measure=()=>p.evaluate(()=>{
   const rect=sel=>{const e=document.querySelector(sel),r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right,display:getComputedStyle(e).display};};
   return{header:rect('header.top'),brand:rect('.brandrow'),cluster:rect('#hzcluster'),panels:['#tpod','#hzcd','#recstrip'].map(rect),search:rect('.brandrow .search'),main:rect('main'),overflow:document.documentElement.scrollWidth>innerWidth+1,clock:document.getElementById('tpodNum').textContent,day:document.getElementById('tpodDate').textContent,record:document.getElementById('recstrip').className};
  });
  await p.emulateMedia({media:'print'});const printBefore=await measure();await p.emulateMedia({media:'screen'});
  const before=await measure();await p.addStyleTag({content:css});await p.waitForTimeout(2200);const after=await measure();
  ok('existing component nodes and accessible names remain',await p.evaluate(()=>window.__header908Nodes.every(e=>e.isConnected)&&document.getElementById('tpod').getAttribute('aria-label')&&document.getElementById('recstrip').getAttribute('role')==='status'&&document.getElementById('tpodNum').getAttribute('role')==='timer'));
  ok('no horizontal page overflow',!after.overflow,after);
  ok('clock, date and live record remain populated',!!after.clock&&!!after.day&&after.record.includes('recstrip'),after);
  if(width>=641&&height>=601){
   ok('three equal panels occupy a full row below search',Math.max(...after.panels.map(r=>r.width))-Math.min(...after.panels.map(r=>r.width))<2&&Math.max(...after.panels.map(r=>r.y))-Math.min(...after.panels.map(r=>r.y))<2&&after.cluster.y>=after.search.bottom+5&&after.cluster.width>=width-45,after);
   if(width>=1024&&height>=761){
    const wide=width>=3000&&height>=1200,middle=width>=1800&&height>=1000;
    ok('panels gain height without taking over the work viewport',after.panels.every(r=>r.height>=(wide?180:middle?156:103))&&after.header.height<=(wide?370:middle?345:290)&&after.main.height>=height*(wide?.8:middle?.74:.65),after);
    ok('native instrument typography scales with wide screens',await p.locator('#tpodNum').evaluate((e,min)=>parseFloat(getComputedStyle(e).fontSize)>=min,wide?64:middle?50:36));
   }
  }
  if(width===390)ok('phone header geometry is unchanged',Math.abs(before.header.height-after.header.height)<1&&Math.abs(before.cluster.height-after.cluster.height)<1, {before,after});
  if(height<=600)ok('short screens retain a compact header and usable work area',after.cluster.display==='none'&&after.header.height<=160&&after.main.height>=height*.55,after);
  await p.emulateMedia({media:'print'});
  const printAfter=await measure();
  ok('print layout is unchanged by the screen-only arrangement',printBefore.cluster.display===printAfter.cluster.display&&Math.abs(printBefore.header.height-printAfter.header.height)<1&&Math.abs(printBefore.cluster.height-printAfter.cluster.height)<1,{before:printBefore,after:printAfter});
  await p.emulateMedia({media:'screen'});
  await p.screenshot({path:path.join(out,'screen-'+width+'x'+height+'.png')});
  await p.locator('header.top').screenshot({path:path.join(out,'header-'+width+'x'+height+'.png')});
  if(height>600&&width>640){
   await p.locator('#tpodOpen').click();await p.waitForTimeout(100);
   ok('clock disclosure opens within viewport',await p.locator('#tpodPanel').evaluate(e=>{const r=e.getBoundingClientRect();return !e.hidden&&r.width>0&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
   await p.locator('#tpodOpen').click();
   await p.locator('#moreBtn').click();await p.waitForTimeout(100);
   ok('Tools menu remains reachable within viewport',await p.locator('#moreMenu').evaluate(e=>{const r=e.getBoundingClientRect();return !e.hidden&&r.width>0&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight+1;}));
   await p.locator('#moreBtn').click();
   await p.evaluate(()=>{document.querySelector('main').scrollTop=250;});await p.waitForTimeout(300);const compact=await measure();
   ok('native scroll collapse still gives space back to the work',compact.cluster.display==='none'&&compact.header.height<after.header.height&&compact.main.height>after.main.height,compact);
   await p.evaluate(()=>{document.querySelector('main').scrollTop=0;});await p.waitForTimeout(300);
   ok('native header returns at the top',await p.locator('#hzcluster').evaluate(e=>getComputedStyle(e).display!=='none'));
  }
  ok('no runtime errors or record-write attempts',!errors.length&&!blocked.some(b=>b.origin===HOST),{errors,blocked});
  const result={width,height,before,after,checks};results.push(result);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
  console.log(width+'x'+height+': '+checks.filter(c=>c.pass).length+'/'+checks.length,JSON.stringify({header:after.header.height,main:after.main.height,panels:after.panels.map(r=>[r.width,r.height]),failures:checks.filter(c=>!c.pass)}));
  await ctx.close();
 }}finally{await browser.close();}
 if(results.some(r=>r.checks.some(c=>!c.pass)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
