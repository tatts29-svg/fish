// Author: Andrew Fisher. Independent read-only integrated Map Explorer proof.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), readline = require('readline');
const root = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const dir = path.resolve(manifest.evidenceDir); fs.mkdirSync(dir, {recursive:true});
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const sources = {}, bindings = {};
for (const [name, file] of Object.entries(manifest.sources)) {
  const body = fs.readFileSync(file); sources[name] = body;
  bindings[name] = {file, sha256:sha(body), bytes:body.length};
  fs.writeFileSync(path.join(dir, name.replaceAll('/', '__')), body);
}
const pageFile = path.join(dir, 'host.html');
if (!sources.host) throw Error('Manifest requires host source');
fs.writeFileSync(pageFile, sources.host);
const cf = require(root + '/toolchain/harness/curlfetch'), originalFetch = cf.curlFetch;
const requests = [], checks = [], geometry = [], consoleMessages = [];
const urlFiles = {
  '/w/Coates-GC500-2026/explorer/index.html':'index.html',
  '/w/Coates-GC500-2026/explorer/explorer.js':'explorer.js',
  '/w/Coates-GC500-2026/explorer/explorer-merge.js':'explorer-merge.js',
  '/w/Coates-GC500-2026/poc3d/index.html':'poc3d/index.html'
};
cf.curlFetch = async (url, headers, method='GET', body) => {
  const u = new URL(url), readSession = method === 'POST' && u.origin === 'https://tile.googleapis.com' && u.pathname === '/v1/createSession';
  if (method !== 'GET' && !readSession) throw Error('Non-read request blocked');
  const key = u.origin === 'https://gc500-production.up.railway.app' && urlFiles[u.pathname];
  if (method === 'GET' && key && sources[key]) {
    requests.push({path:u.pathname, method, local:key, sha256:bindings[key].sha256});
    return {status:200, headers:{'content-type':key.endsWith('.js')?'application/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'}, body:sources[key]};
  }
  const started = Date.now(); const r = await originalFetch(url, headers, method, body);
  requests.push({host:u.host,path:u.pathname,method,status:r.status,bytes:r.body.length,ms:Date.now()-started});
  return r;
};
const {open} = require(root + '/toolchain/harness/open_page');
let session, page, frame, device;
function save() {fs.writeFileSync(path.join(dir,'proof.json'),JSON.stringify({author:'Andrew Fisher',bindings,requests,checks,geometry,consoleMessages,errors:session?.errors,counts:session?.counts,exception:'Google tile createSession POST only; all GC500 writes and other non-GET blocked.'},null,2));}
async function start(mobile=false,W=1440,H=900) {
  if (session) await session.browser.close();
  device = mobile ? 'phone' : 'desktop';
  session = await open({pageFile,hash:'#sheet/__explorer',W,H,dpr:mobile?2:1,mobile,gl:true});page=session.page;
  page.setDefaultTimeout(12000);
  page.on('console',m=>{if(['error','warning'].includes(m.type()))consoleMessages.push({device,type:m.type(),text:m.text().replace(/([?&](?:key|session|token)=)[^&\s]+/g,'$1[redacted]').slice(0,250)});});
  await page.waitForSelector('#expFrame'); frame=await (await page.$('#expFrame')).contentFrame();
  await frame.waitForFunction(()=>window.__ready && window.GC500Explorer && typeof window.GC500Explorer.clearPick813==='function',null,{timeout:90000});
  await page.waitForTimeout(600); save(); return {device,width:W,height:H};
}
async function check(id,pass,details={}) {checks.push({device,id,pass:!!pass,details});save();return checks.at(-1);}
async function bounds(label) {
  const outer=await page.evaluate(()=>{
    const rect=s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().toJSON():null};
    return {viewport:{w:innerWidth,h:innerHeight,vw:visualViewport?.width,vh:visualViewport?.height,offsetTop:visualViewport?.offsetTop},wrap:rect('#expwrap'),frame:rect('#expFrame'),main:rect('main'),footer:rect('footer.foot'),tabs:rect('#tabs'),scrollTop:document.querySelector('main')?.scrollTop,scrollHeight:document.querySelector('main')?.scrollHeight,full:!!document.fullscreenElement};
  });
  const inner=await frame.evaluate(()=>{
    const rect=s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().toJSON():null};
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,stage:rect('#stage'),display:rect('#display'),toolbar:rect('.console'),menu:rect('#side'),card:rect('#xcard'),legend:rect('#legend'),mode:GC500Explorer.state.mode};
  });
  const x={device,label,outer,inner};geometry.push(x);save();return x;
}
async function menu(on=true) {if(await frame.evaluate(on=>matchMedia('(max-width:900px)').matches&&document.body.classList.contains('nav')!==!!on,on)) await frame.locator('#navBtn').click();}
async function search(code) {
  if(await frame.evaluate(()=>matchMedia('(max-width:900px)').matches&&!document.body.classList.contains('nav')))await frame.locator('#navBtn').click();
  await frame.locator('#q').fill(code); await frame.locator('#results [data-code="'+code+'"]').click(); await page.waitForTimeout(300);
}
async function shot(name) {await page.screenshot({path:path.join(dir,device+'-'+name+'.png')});}
async function selection() {return await frame.evaluate(()=>({selected:typeof selected!=='undefined'&&selected?selected.code:null,marks:typeof marks!=='undefined'?marks.map(m=>m.it.code):[],cardVisible:!!document.querySelector('#xcard')&&!document.querySelector('#xcard').hidden,cardText:document.querySelector('#xcard')?.textContent,menu:document.body.classList.contains('nav'),focused:document.activeElement?.id,zoom:GC500Explorer.state.zoom}));}
(async()=>{
  await start(!!manifest.mobile,manifest.width||1440,manifest.height||900);console.log(JSON.stringify({ready:true,dir,bindings}));
  const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
  for await(const line of rl){try{if(line==='EXIT'){await session.browser.close();save();break;}const value=await eval('(async()=>{'+line+'})()');console.log(JSON.stringify({ok:true,value}));save();}catch(e){console.log(JSON.stringify({ok:false,error:e.message}));save();}}
})().catch(e=>{console.error(e.message);save();process.exitCode=1});
