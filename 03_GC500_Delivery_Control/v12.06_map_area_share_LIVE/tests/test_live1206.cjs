/* Author: Andrew Fisher. Actual public UI read-back; native sharing is captured, never sent. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const out=process.env.OUT,checks=[],h=await open({hash:'#sheet/__explorer',W:1440,H:1000}),p=h.page;const check=(name,ok)=>{checks.push({name,ok:!!ok});assert(ok,name);};if(out)fs.mkdirSync(out,{recursive:true});
try{await p.waitForFunction(()=>document.querySelector('#pane-map.on #expFrame')?.contentWindow?.GC500Area1206&&SYNC.status==='live',null,{timeout:180000});
check('public map-area module v12.06 present',await p.evaluate(()=>MapArea1206.version==='v12.06'));
await p.locator('#expFull').click();const f=p.frames().find(f=>f.url().includes('/explorer/index.html'));
await f.waitForFunction(()=>ITEMS.some(i=>i.code==='WC41'),null,{timeout:180000});
await f.evaluate(()=>{const b=ITEMS.find(i=>i.code==='WC41').places[0],q=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2);gotoRect([q.x-45,q.y-45,q.x+45,q.y+45],'Public area share check');});await p.waitForTimeout(1100);
await f.evaluate(()=>{const b=ITEMS.find(i=>i.code==='WC41').places[0],q=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),z=applyM(sheetToDevice(currentView().scale,sw,sh),q.x,q.y);GC500Spot1117.drop(z.x,z.y);});
await f.waitForFunction(()=>GC500Area1206.state.ready||GC500Area1206.state.error,null,{timeout:180000});
check('public area export ready without error',await f.evaluate(()=>GC500Area1206.state.ready&&!GC500Area1206.state.error));
check('contents, equipment symbols and recorded doors available',await f.evaluate(()=>{const s=GC500Area1206.state,r=s.rows.find(r=>r.code==='WC41');return s.rows.every(r=>GC500Spot1117.words().includes(r.code))&&r.symbols.some(s=>s.glyph)&&r.parts.flatMap(p=>p.doors).length===10;}));
check('share control enabled and 50 metre boundary displayed',await f.locator('[data-sp="share"]').isEnabled()&&await f.locator('#area1206-boundary polygon').count()===2);
const capture=await f.evaluate(async()=>{let captured;Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{captured=d;}});const result=await GC500Spot1117.share(),v=new DataView(await captured.files[0].arrayBuffer());return {result,width:v.getUint32(16),height:v.getUint32(20),full:captured.text===GC500Spot1117.words()};});
check('public share prepares exact 3840 × 4160 PNG and full list',capture.result==='files'&&capture.width===3840&&capture.height===4160&&capture.full);
if(out){await p.screenshot({path:path.join(out,'desktop.png')});const data=await f.evaluate(async()=>{const b=await(await fetch(document.querySelector('[data-area1206] img').src)).blob();return await new Promise(r=>{const a=new FileReader();a.onload=()=>r(a.result.split(',')[1]);a.readAsDataURL(b);});});fs.writeFileSync(path.join(out,'area.png'),Buffer.from(data,'base64'));}
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(500);
check('public phone share controls fit window',await f.evaluate(()=>{const r=document.querySelector('#spot1117').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;}));if(out)await p.screenshot({path:path.join(out,'phone.png')});
check('no page errors or attempted writes',!h.errors.length&&!h.counts.blocked);
console.log(JSON.stringify({author:'Andrew Fisher',actual_public_page:true,checks,passed:checks.length,errors:h.errors,attempted_writes:h.counts.blocked,share_calls_captured_only:true}));
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
