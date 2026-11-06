/* Author: Andrew Fisher. Read-only phone HUD hit-testing with the real overlay. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const {curlFetch}=require('../../toolchain/harness/curlfetch');
assert(process.env.OUT&&process.env.PAGE,'PAGE and private OUT are required');
const out=path.resolve(process.env.OUT),repo=path.resolve(__dirname,'../../..');assert(!out.startsWith(repo+path.sep));fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',suite:'onsite1290-phone-controls',passed:false,checks:[]};
const check=(name,ok)=>{result.checks.push({name,passed:!!ok});assert(ok,name);};let s;
(async()=>{try{
 result.sha256=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');if(process.env.EXPECTED_SHA)assert.equal(result.sha256,process.env.EXPECTED_SHA);
 s=await open({pageFile:process.env.PAGE,hash:'#map',W:390,H:844,dpr:1,mobile:true,init:"localStorage.setItem('gc500.map1188','plan');localStorage.setItem('gc500.explorer.mode','original');"});
 await s.page.waitForFunction(()=>typeof go==='function'&&!!document.getElementById('expFrame'),null,{timeout:30000});await s.page.evaluate(()=>go('map'));
 await s.page.waitForFunction(()=>document.getElementById('expFrame')?.contentWindow?.GC500StillOnSite1290?.state.ready,null,{timeout:45000});
 const f=s.page.frames().find(f=>new URL(f.url()).pathname.endsWith('/explorer/index.html'));assert(f);
 await f.locator('#still-onsite1290').tap();await s.page.waitForTimeout(1200);
 result.hits=await f.evaluate(()=>['zoomOut','zoomIn','fitBtn','boxBtn','fullBtn','exportBtn'].map(id=>{const e=document.getElementById(id),b=e.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2,hit=document.elementFromPoint(x,y);return {id,x,y,visible:b.width>0&&b.height>0,received:!!hit?.closest('#'+id),interceptingVms:!!hit?.closest('#vmsicons1211')};}));
 await s.page.screenshot({path:path.join(out,'phone-controls.png')});
 const before=await f.evaluate(()=>({z:camera.z,selected:selected?.code||null})),target=result.hits.find(h=>h.id==='zoomOut'),frame=await f.frameElement(),box=await frame.boundingBox();
 await s.page.touchscreen.tap(box.x+target.x,box.y+target.y);await s.page.waitForTimeout(700);
 const after=await f.evaluate(()=>({z:camera.z,selected:selected?.code||null}));result.touch={before,after};
 check('Every visible map toolbar centre receives its own touch',result.hits.filter(h=>h.visible).every(h=>h.received));
 check('The real minus touch zooms out without selecting equipment',after.z<before.z&&after.selected===before.selected);
 check('No page errors or attempted operational record writes',s.errors.length===0&&s.counts.blocked===0);result.passed=true;
 }catch(e){result.failure=String(e.message||e).slice(0,250);}finally{if(s){result.pageErrors=s.errors;result.recordWrites=s.counts.blocked;await s.browser.close();}fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');}
 console.log(JSON.stringify({passed:result.passed,sha256:result.sha256,checks:result.checks.length,pageErrors:result.pageErrors?.length,recordWrites:result.recordWrites,failure:result.failure}));if(!result.passed)process.exitCode=1;
})();
