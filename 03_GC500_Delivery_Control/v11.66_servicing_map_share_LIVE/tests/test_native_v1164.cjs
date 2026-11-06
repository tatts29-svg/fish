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
 assert(process.env.GC500_EDIT_TOKEN,'Runtime read credential required');
 const s=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844,dpr:2}),p=s.page;let authenticatedReads=0;
 try{
  await p.route('https://gc500-production.up.railway.app/api/**',async route=>{
   const r=route.request(),u=new URL(r.url());if(r.method()==='GET'&&['/api/version','/api/ticks'].includes(u.pathname)){
    authenticatedReads++;return route.fulfill({status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:await read(r.url())});
   }return route.fallback();
  });
  await p.evaluate(()=>{window.capability=()=> 'edit';window.mayWrite=()=>false;SYNC.readonly=false;SYNC.level='edit';SYNC.claims='edit';go('servicing');renderServicing1084();});
  const area=p.locator('#pane-servicing .svc1099 [data-svc1099-area]').first();await area.waitFor({timeout:90000});await area.click();
  await p.locator('#pane-servicing [data-share1164-area]').click();
  const dialog=p.locator('.svc-share1164');await p.waitForFunction(()=>document.querySelector('.svc-share1164 img')?.naturalWidth===1080,null,{timeout:60000});
  assert(await dialog.getByRole('button',{name:'Save picture',exact:true}).isEnabled());
  assert(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  assert(!(await dialog.locator('h3').innerText()).includes('TEST'));
  if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await p.screenshot({path:path.join(process.env.EVIDENCE,'native-phone.png')});
   const data=await dialog.locator('img').evaluate(async el=>{const blob=await(await fetch(el.src)).blob();return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});});fs.writeFileSync(path.join(process.env.EVIDENCE,'native-picture.png'),Buffer.from(data.split(',')[1],'base64'));
  }
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
  assert.equal(s.errors.length,0);assert.equal(s.counts.blocked,0);
  console.log(JSON.stringify({nativeServicing:'PASS',livePage:!process.env.PAGE,authenticatedGetOnly:true,authenticatedReads,pictureWidth:1080,errors:s.errors,blockedWrites:s.counts.blocked}));
 }finally{await s.browser.close();}
})().catch(()=>{console.error('FAIL native servicing read-only check (private operational details omitted)');process.exit(1);});
