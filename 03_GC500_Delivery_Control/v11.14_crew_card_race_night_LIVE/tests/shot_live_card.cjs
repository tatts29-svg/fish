/* Read-only: open the LIVE crew card (no code: view only) on a phone viewport and screenshot it; every non-GET aborted. */
const fs=require('fs');module.paths.unshift('/home/user/fish/03_GC500_Delivery_Control/toolchain/node_modules');const {chromium}=require('playwright');
const T=fs.readFileSync(process.argv[2],'utf8').trim();const OUT=process.argv[3];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'en-AU',timezoneId:'Australia/Brisbane'});
 const blocked=[];await ctx.route('**/*',r=>{if(r.request().method()!=='GET'){blocked.push(r.request().method()+' '+new URL(r.request().url()).pathname);return r.abort();}return r.continue();});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('https://gc500-production.up.railway.app/d/'+T,{waitUntil:'load',timeout:120000});
 await p.waitForFunction(()=>/^Live/.test(document.getElementById('status').textContent),null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(1500);
 await p.screenshot({path:OUT,fullPage:false});
 const info=await p.evaluate(()=>({status:document.getElementById('status').textContent,compact:document.getElementById('compact').textContent,dark:getComputedStyle(document.body).backgroundColor,areas:document.querySelectorAll('.area').length,togo:document.querySelectorAll('.togo').length,title:document.title}));
 console.log(JSON.stringify({info,errors,blocked}));await b.close();})().catch(e=>{console.error(String(e).slice(0,300));process.exit(1);});
