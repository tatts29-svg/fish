/* Read-only: the live server code runs locally on a copy of the live record with throwaway tokens; the page is opened on the local
   edit link at big-screen size and the Servicing tab is screenshotted. Every non-GET to the live service is aborted.
   node shot_svc_edit.cjs <page> <out.png> [W H] */
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),crypto=require('crypto'),{spawn,spawnSync}=require('child_process');
const ROOT='/home/user/fish/03_GC500_Delivery_Control';module.paths.unshift(path.join(ROOT,'toolchain/node_modules'));
const {chromium}=require('playwright');const {curlFetch}=require(path.join(ROOT,'toolchain/harness/curlfetch'));
const PAGE=process.argv[2],OUT=process.argv[3],W=+(process.argv[4]||1920),H=+(process.argv[5]||1080);
const SERVER=path.join(ROOT,'server_v5.91_export_completeness_LIVE','server.js'),HOST='https://gc500-production.up.railway.app',VIEW_LIVE='Coates-GC500-2026';
const E='local-edit-shot-'+crypto.randomBytes(6).toString('hex'),V='local-view-shot-'+crypto.randomBytes(6).toString('hex');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-shot-'));
 const state=spawnSync('curl',['-s','--compressed','-H','x-gc500-token: '+VIEW_LIVE,HOST+'/api/state'],{maxBuffer:1<<30}).stdout;JSON.parse(state);
 fs.writeFileSync(path.join(dir,'records.json'),state);fs.copyFileSync(PAGE,path.join(dir,'app.html'));
 const port=await new Promise(res=>{const s=http.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
 const log=fs.openSync(path.join(dir,'server.log'),'a');
 const server=spawn(process.execPath,[SERVER],{env:{PATH:process.env.PATH,PORT:String(port),DATA_DIR:dir,VIEW_TOKEN:V,EDIT_TOKEN:E},stdio:['ignore',log,log]});
 const req=p=>new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port,path:p,headers:{'x-gc500-token':E}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});r.on('error',reject);r.end();});
 for(let n=0;n<150;n++){try{if((await req('/health'))===200)break;}catch(e){}await wait(100);}
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:W,height:H},locale:'en-AU',timezoneId:'Australia/Brisbane'});
 const blocked=[];
 await ctx.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),m=r.method();
  if(u.protocol==='data:'||u.protocol==='blob:')return route.continue();
  if(u.hostname==='127.0.0.1'){
   if(m==='GET'&&(u.pathname==='/api/ticks'||u.pathname.startsWith('/d/'))){try{const res=await curlFetch(HOST+u.pathname+u.search,{'x-gc500-token':process.env.GC500_EDIT_TOKEN||'','cache-control':'no-cache'},'GET');return route.fulfill(res);}catch(e){return route.fulfill({status:200,contentType:'application/json',body:'{}'});}}
   if(m==='GET')return route.continue();blocked.push(m+' '+u.pathname);return route.abort();}
  if(m!=='GET'){blocked.push(m+' '+u.href.slice(0,80));return route.abort();}
  try{const res=await curlFetch(u.href,r.headers(),'GET');return route.fulfill(res);}catch(e){return route.fulfill({status:200,contentType:'text/plain',body:''});}
 });
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message.slice(0,200)));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:'+port+'/e/'+E+'#servicing',{waitUntil:'load',timeout:180000});
 await page.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 await page.evaluate(()=>go('servicing'));await page.waitForSelector('#svc1067-host:not([hidden])',{timeout:60000});try{await page.waitForSelector('#svc1067 .svc1099-area',{timeout:60000});}catch(e){}await wait(8000);
 const info=await page.evaluate(()=>{const cards=[...document.querySelectorAll('#svc1067 .svc1099-area')];const cs=cards[0]?getComputedStyle(cards[0]):null;const b=cards[0]?getComputedStyle(cards[0],':before'):null;return {cards:cards.length,done:cards.filter(c=>c.classList.contains('done')).length,colors:cards.slice(0,3).map(c=>c.style.getPropertyValue('--area-color')),details:document.querySelectorAll('#svc1067 details.svc-area').length,regions:document.querySelectorAll('#svc1067 .svc1100-region').length,cardShadow:cs&&cs.boxShadow,beforeContent:b&&b.content,beforeAnim:b&&b.animationName,position:cs&&cs.position,paneClass:document.getElementById('pane-servicing')?.className,svcClass:document.getElementById('svc1067')?.className,footer:document.getElementById('footL')?.textContent.slice(-8)};});
 await page.screenshot({path:OUT,fullPage:false});
 if(process.env.SHOT2){const el=await page.$('#svc1067 .svc1099-areas');if(el)await el.screenshot({path:process.env.SHOT2});}
 console.log(JSON.stringify({info,errors,blocked}));
 await browser.close();server.kill();fs.rmSync(dir,{recursive:true,force:true});
})().catch(e=>{console.error(String(e).slice(0,500));process.exit(1);});
