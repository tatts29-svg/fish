// Author: Andrew Fisher. Read-only supplier navigation/retained native actions.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),Module=require('module');
const harness=path.resolve(__dirname,'../toolchain/harness/open_page.js');
const source=fs.readFileSync(harness,'utf8').replace("const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');","const okPost = false;");
assert(source.includes('const okPost = false;'));const m=new Module(harness,module);m.filename=harness;m.paths=Module._nodeModulePaths(path.dirname(harness));m._compile(source,harness);
(async()=>{const mob=process.env.MOB==='1',s=await m.exports.open({pageFile:process.env.PAGE,hash:'#subhired',mobile:mob,W:mob?390:1440,H:mob?844:900});const p=s.page;try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.on&&SYNC.status==='live'&&Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k))&&document.querySelector('#pane-subhired [data-supplier932-company]'),{timeout:120000});
 await p.evaluate(()=>window.__supplier932Before=JSON.stringify(S));assert.equal(await p.locator('#pane-subhired').getAttribute('hidden'),null);
 assert.equal(await p.locator('#pane-subhired #ep819').count(),1);assert.equal(await p.locator('#pane-subhired [data-unit925-company]').count(),0);assert.equal(await p.locator('#pane-about [data-unit925-companies]').count(),0);
 const companies=await p.locator('[data-supplier932-company]').evaluateAll(es=>es.map(e=>({owner:e.dataset.supplier932Company,text:e.textContent})));
 for(const c of companies){await p.locator('[data-supplier932-company]').filter({hasText:c.text}).click();assert.equal(await p.locator('#pane-subhired #ep819').count(),c.owner==='event-portables'?1:0);if(!['coates','unknown','other:supplier-not-named'].includes(c.owner))assert(c.text.startsWith('Sub-hired · '));}
 await p.locator('[data-supplier932-company="prem-air-hire"]').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#ep819').count(),0);
 await p.locator('[data-supplier932-company="event-portables"]').focus();await p.keyboard.press('Enter');
 await p.evaluate(()=>{window.__native932Docs=epDocuments860;window.__calls932=[];epDocuments860=(...args)=>window.__calls932.push(args.slice(0,2));});
 await p.locator('#ep819 [data-ep860-email]').first().click();await p.locator('#ep819 [data-ep860-inventory]').click();assert.equal(await p.evaluate(()=>window.__calls932.length),2);await p.evaluate(()=>epDocuments860=window.__native932Docs);
 const native=await p.locator('#ep819 [data-ep819-ld]').count();assert(native>0);await p.locator('#ep819 [data-ep819-ld]').first().click();assert.equal(await p.locator('#ep819 .ep819-b').first().isVisible(),true);
 await p.locator('#ep819 [data-ep819-print]').first().click();assert.equal(await p.locator('#ep819print .rs819').isVisible(),true);await p.locator('[data-ep819-x]').first().click();
 await p.locator('#tab-timeline').click();assert.equal(await p.locator('#pane-timeline #ep819').count(),0);
 await p.locator('#tab-subhired').click();assert.equal(await p.locator('#pane-subhired #ep819').count(),1);
 await p.goBack();await p.waitForFunction(()=>state.tab==='timeline');assert.equal(await p.locator('#pane-timeline #ep819').count(),0);
 await p.evaluate(()=>go('subhired'));const bounds=await p.locator('#tab-subhired').boundingBox();assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=(mob?390:1440));
 const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
 assert.equal(await p.evaluate(()=>JSON.stringify(S)===window.__supplier932Before),true);assert.deepEqual(s.errors,[]);
 const out=process.env.OUT||'/workspace/private-supplier932';fs.mkdirSync(out,{recursive:true});await p.evaluate(()=>document.querySelector('main').scrollTop=0);await p.screenshot({path:path.join(out,mob?'phone.png':'desktop.png'),fullPage:false});console.log(JSON.stringify({success:true,mobile:mob,companies,nativeLoads:native,counts:s.counts,errors:s.errors,stateUnchanged:true}));
 }finally{await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
