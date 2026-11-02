/* Author: Andrew Fisher. Read-only dashboard + hosted Explorer integration check. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
const hash=b=>require('crypto').createHash('sha256').update(b).digest('hex');
const machineFiles=Object.fromEntries(['explorer/index.html','explorer/explorer.js','explorer/explorer-merge.js','poc3d/index.html'].map(p=>[p,hash(fs.readFileSync(path.join(process.env.CANDIDATE,p)))]));
const host='https://gc500-production.up.railway.app',base=host+'/w/Coates-GC500-2026/',out=process.env.OUT;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});try{
const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,locale:'en-AU'}),errors=[],requests=[],writes=[];
let manifestDelayed=false;
await ctx.addInitScript(()=>{localStorage.setItem('gc500.map1188','sat');localStorage.setItem('gc500.explorer.mode','3d');});
await ctx.route('**/*',async route=>{const r=route.request(),u=r.url();if(/^(blob:|data:)/.test(u))return route.continue();requests.push(u);
if(r.method()!=='GET'){writes.push({method:r.method(),url:u});return route.abort();}
if(u.startsWith(host+'/v/Coates-GC500-2026'))return route.fulfill({status:200,contentType:'text/html',body:fs.readFileSync(process.env.PAGE)});
const rel=u.startsWith(base)?u.slice(base.length).split('?')[0]:'';const f=path.join(process.env.CANDIDATE,rel);
if(rel==='explorer/assets/vt/manifest.json'&&!manifestDelayed){manifestDelayed=true;await new Promise(resolve=>setTimeout(resolve,8000));}
if(rel&&fs.existsSync(f)&&fs.statSync(f).isFile())return route.fulfill({status:200,contentType:rel.endsWith('.js')?'text/javascript':'text/html',body:fs.readFileSync(f)});
try{return await route.fulfill(await curlFetch(u,r.headers(),'GET'));}catch(e){return route.abort();}});
const page=await ctx.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
await page.goto(host+'/v/Coates-GC500-2026/#sheet/__satellite3d',{waitUntil:'domcontentloaded',timeout:180000});
await page.waitForFunction(()=>typeof go==='function'&&window.Map1188,{timeout:120000});await page.evaluate(()=>{go('map');gate1156Zoom(-27.982,153.427,'cold-coordinate-test');});
await page.waitForFunction(()=>{const f=document.getElementById('expFrame');return f&&f.contentWindow.__ready;},{timeout:120000});
await page.evaluate(()=>document.getElementById('expFrame').contentWindow.GC500Explorer.ready);
await page.waitForFunction(()=>document.getElementById('expFrame').contentDocument.getElementById('viewName').textContent.includes('cold-coordinate-test'),null,{timeout:30000});
const initial=await page.evaluate(()=>({sheet:state.sheet,mapview:Map1188.view,mode:document.getElementById('expFrame').contentWindow.GC500Explorer.state.mode,oldSurface:!!document.querySelector('#pane-map .s1141-map[data-s1141="map"]'),pinCount:SatMap1141.maps.map.items.length,selector:[...document.querySelectorAll('.map1188 select option')].map(x=>x.value)}));
assert.equal(initial.sheet,'__explorer');assert.equal(initial.mapview,'plan');assert.equal(initial.mode,'original');assert.equal(initial.oldSurface,false);assert(initial.pinCount>0);assert.deepEqual(initial.selector,['plan']);
await page.evaluate(()=>{Map1188.set('sat');state.sheet='AERIAL';renderMap();expOpen3d('P33');});await page.waitForTimeout(1200);
const guard=await page.evaluate(()=>({sheet:state.sheet,mapview:Map1188.view,mode:document.getElementById('expFrame').contentWindow.GC500Explorer.state.mode,model:!!document.getElementById('expFrame').contentDocument.getElementById('model3d')}));assert.equal(guard.sheet,'__explorer');assert.equal(guard.mapview,'plan');assert.equal(guard.mode,'original');assert.equal(guard.model,false);
await page.evaluate(()=>mapLocate('MASTER','P33','P33',{sheetOnly:true}));await page.waitForTimeout(500);
assert.equal(await page.evaluate(()=>document.getElementById('expFrame').contentWindow.__marksCount().selected),'P33');
await page.evaluate(()=>mapLocate('MASTER','P33'));await page.waitForTimeout(500);
assert.equal(await page.evaluate(()=>document.getElementById('expFrame').contentWindow.__marksCount().selected),'P33');
await page.evaluate(()=>document.getElementById('expFrame').contentWindow.GC500Explorer.find('AA'));await page.waitForTimeout(500);
assert.equal(await page.evaluate(()=>document.getElementById('expFrame').contentDocument.querySelectorAll('#xcard img').length),0);
await page.evaluate(()=>gate1156Zoom(-27.982,153.427,'recorded-test-position'));await page.waitForTimeout(800);
assert.equal(await page.evaluate(()=>{const d=document.getElementById('expFrame').contentDocument,c=d.getElementById('xcard');return !c||c.hidden;}),true);
await page.screenshot({path:path.join(out,'dashboard-phone.png')});assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
fs.writeFileSync(path.join(out,'dashboard-result.json'),JSON.stringify({passed:true,machineFiles,dashboardSha256:hash(fs.readFileSync(process.env.PAGE)),recordWrites:writes.length,initial,guard,coldCoordinateDelayedMs:8000,errors,writes,requests},null,2));console.log(JSON.stringify({pass:true,initial,guard,errors,writes}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
