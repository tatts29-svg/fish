// Author: Andrew Fisher. Read-only browser review; no write-capable service requests.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..');
const {open}=require(R+'/toolchain/harness/open_page');
const REL=path.resolve(__dirname,'../release/explorer');
const OUT=process.env.OUT||__dirname,MOB=process.env.MOB==='1',tag=MOB?'phone':'desktop';
(async()=>{let s;const tests=[];const ok=(name,pass,detail={})=>{tests.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);};
try{
s=await open({pageFile:process.env.PAGE,W:MOB?390:1333,H:MOB?844:693,dpr:MOB?2:1,mobile:MOB});const p=s.page,consoleErrors=[];p.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().replace(/https?:\/\/\S+/g,'[url]').slice(0,160));});
await p.route(/\/explorer\/(index\.html|explorer\.js)(\?.*)?$/,r=>{const name=/explorer\.js/.test(r.request().url())?'explorer.js':'index.html';return r.fulfill({status:200,contentType:name.endsWith('.js')?'application/javascript':'text/html',body:fs.readFileSync(path.join(REL,name))});});
await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});
await p.evaluate(()=>{localStorage.setItem('gc500.done782','on');localStorage.removeItem('gc500.done790');window.__doneReview=[];window.gc500DoneKeys=()=>window.__doneReview;location.hash='#sheet/__explorer';});
await p.waitForTimeout(2000);const f=p.frames().find(f=>/explorer\/index\.html/.test(f.url()));if(!f)throw Error('Explorer frame missing');
await f.waitForFunction(()=>window.__ready&&typeof ready!=='undefined'&&ready,null,{timeout:180000});await f.waitForTimeout(1000);
const sourceSnapshot=()=>f.evaluate(()=>JSON.stringify({GEO,TIN,GB,items:ITEMS.map(i=>({code:i.code,places:i.places}))}));const start=await sourceSnapshot();const plan=await p.evaluate(()=>JSON.stringify(gc500PlanItems()));
const keys=await f.evaluate(()=>ITEMS.filter(i=>i.places.length&&i.cat?.host==='trade').slice(0,70).map(i=>i.code));await p.evaluate(keys=>window.__doneReview=keys,keys);await f.evaluate(()=>done782Pull());
const state=()=>f.evaluate(()=>({mode,geo:geoOn(),cam:{...camera},on:DONE782_ON,pressed:document.querySelector('#done782').getAttribute('aria-pressed'),ticks:document.querySelectorAll('#d782 i').length,count:+document.querySelector('#done782 small').textContent,list:done782List().length}));
let st=await state();ok('New preference ignores old on flag; Done starts hidden',!st.on&&st.pressed==='false'&&st.ticks===0&&st.count===keys.length,{count:st.count});
const cam=()=>f.evaluate(()=>({...camera}));const equal=(a,b)=>['cx','cy','z','rot'].every(k=>Math.abs(a[k]-b[k])<1e-6);
const expected=()=>f.evaluate(()=>{const geo=geoOn();const w=geo?GB.x1-GB.x0:SHEET_W,h=geo?GB.y1-GB.y0:SHEET_H;return{cx:geo?(GB.x0+GB.x1)/2:1192,cy:geo?(GB.y0+GB.y1)/2:842,z:Math.max(MIN_Z,Math.min(MAX_Z,Math.min((sw-30)/w,(sh-30)/h)/fitScale)),rot:0};});
const switchMode=async m=>{await f.locator('.modes button[data-mode="'+m+'"]').click();await f.waitForTimeout(500);};
await f.evaluate(()=>{camera.cx+=35;camera.cy-=30;camera.z=3.1;camera.rot=17;changeView(false);});await switchMode('original');ok('Actual Original plan control centres and fits drawing',equal(await cam(),await expected()));
await p.screenshot({path:OUT+'/'+tag+'-original-plan.png'});await (await f.frameElement()).screenshot({path:OUT+'/'+tag+'-original-plan-frame.png'});
await f.evaluate(()=>{camera.cx+=90;camera.cy+=55;camera.z=4;camera.rot=8;changeView(false);});await switchMode('satellite');ok('Actual Satellite control centres and fits ground coordinates',equal(await cam(),await expected()));
await f.evaluate(()=>{camera.cx+=45;camera.cy-=35;camera.z=3;camera.rot=12;changeView(false);});const geoCam=await cam();await switchMode('hybrid');ok('Satellite to hybrid preserves pan zoom and rotation',equal(await cam(),geoCam));await switchMode('satellite');ok('Hybrid to satellite preserves pan zoom and rotation',equal(await cam(),geoCam));
await switchMode('original');await switchMode('hybrid');ok('Original to hybrid also fits ground coordinates',equal(await cam(),await expected()));await f.waitForTimeout(1500);await p.screenshot({path:OUT+'/'+tag+'-satellite-plan.png'});await (await f.frameElement()).screenshot({path:OUT+'/'+tag+'-satellite-plan-frame.png'});
if(MOB)await f.locator('#navBtn').click();await f.locator('#done782').click();await f.waitForTimeout(500);st=await state();ok('Actual Done button displays finished-unit markers',st.on&&st.pressed==='true'&&st.list===keys.length&&st.ticks>0,{rings:st.ticks,count:st.count});ok('Done on is stored on this device',await f.evaluate(()=>localStorage.getItem('gc500.done790')==='on'));
await p.screenshot({path:OUT+'/'+tag+'-done-controls.png'});
await f.locator('#chips .chip[data-cat]').first().click();st=await state();ok('Category controls retain Done preference',st.on&&st.pressed==='true'&&st.list===keys.length);
await f.locator('#done782').click();await f.waitForTimeout(300);st=await state();ok('Actual Done control hides rings and stores off',!st.on&&st.ticks===0&&await f.evaluate(()=>localStorage.getItem('gc500.done790')==='off'));
ok('Coordinate transforms and all item places unchanged',start===await sourceSnapshot(),{sha256:crypto.createHash('sha256').update(start).digest('hex')});ok('Master-plan and pin-derived dashboard model unchanged',plan===await p.evaluate(()=>JSON.stringify(gc500PlanItems())),{sha256:crypto.createHash('sha256').update(plan).digest('hex')});
// Restart only the iframe to verify persisted preference without changing the live record.
await f.evaluate(()=>location.reload());await f.waitForFunction(()=>window.__ready&&ready,null,{timeout:180000});await f.waitForTimeout(700);st=await state();ok('Done remains off after actual iframe reload',!st.on&&st.pressed==='false'&&st.ticks===0);
if(MOB)await f.locator('#navBtn').click();await f.locator('#done782').click();await f.evaluate(()=>location.reload());await f.waitForFunction(()=>window.__ready&&ready,null,{timeout:180000});await f.waitForFunction(()=>DONE782_ON&&document.querySelectorAll('#d782 i').length>0,null,{timeout:8000});st=await state();ok('Explicit Done on survives actual iframe reload',st.on&&st.pressed==='true'&&st.ticks>0,{pressed:st.pressed,rings:st.ticks});
if(MOB)await f.locator('#navBtn').click();await f.locator('#done782').click();await f.waitForTimeout(150);if(MOB)await f.locator('#navBtn').click();
// A switch while a zoom is easing must not reuse the old coordinate-space anchor.
await f.evaluate(()=>{setMode('hybrid');fit();zoomBy(2,sw*.8,sh*.25);document.querySelector('.modes button[data-mode="original"]').click();});await f.waitForTimeout(1200);ok('Family switch during easing retains fitted view',equal(await cam(),await expected()),{camera:await cam(),expected:await expected()});
// Exercise real zoom buttons plus the original fling/rotation animation callbacks.
await f.evaluate(()=>{setMode('hybrid');fit();document.getElementById('zoomIn').click();document.querySelector('.modes button[data-mode="original"]').click();});await f.waitForTimeout(700);ok('Zoom button followed by family control cannot undo fit',equal(await cam(),await expected()));
await f.evaluate(()=>{setMode('hybrid');fit();fling(.9,-.4);document.querySelector('.modes button[data-mode="original"]').click();});await f.waitForTimeout(700);ok('Family switch cancels pending momentum pan',equal(await cam(),await expected())&&await f.evaluate(()=>flingRAF===0));
await f.evaluate(()=>{setMode('hybrid');fit();rotateTo(90);document.querySelector('.modes button[data-mode="original"]').click();});await f.waitForTimeout(700);ok('Family switch cancels pending rotation',equal(await cam(),await expected())&&await f.evaluate(()=>rotAnim===0));
const retained=await f.evaluate(()=>{setMode('hybrid');fit();document.getElementById('zoomIn').click();const goal=zGoal;document.querySelector('.modes button[data-mode="satellite"]').click();return{goal,retained:zGoal===goal&&zAnim!==0};});await f.waitForTimeout(900);ok('Same-family switch preserves an ongoing zoom',retained.retained&&Math.abs((await cam()).z-retained.goal)<1e-6);
ok('No page errors',s.errors.length===0,{count:s.errors.length});ok('No console errors',consoleErrors.length===0,{count:consoleErrors.length});ok('No live write requests attempted',s.counts.blocked===0,{blocked:s.counts.blocked});
}catch(e){ok('Run completed',false,{message:e.message.replace(/https?:\/\/\S+/g,'[url]').slice(0,180)});}finally{if(s)await s.browser.close();}
fs.writeFileSync(OUT+'/'+tag+'-independent.json',JSON.stringify({author:'Andrew Fisher',tag,candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(REL+'/explorer.js')).digest('hex'),tests},null,2));console.log(tests.filter(t=>t.pass).length+'/'+tests.length);process.exit(tests.every(t=>t.pass)?0:1);
})();
