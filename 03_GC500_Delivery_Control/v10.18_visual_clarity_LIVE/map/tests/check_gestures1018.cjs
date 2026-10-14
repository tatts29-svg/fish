/* Author: Andrew Fisher. Real touch pinch/pan and pointer wheel input; read-only. */
'use strict';
const fs=require('fs'),path=require('path'),{open}=require('./readonly1018.cjs');
let h;const out=process.env.OUT||'/tmp/private-gc500-visual1018/map/gestures',report={author:'Andrew Fisher',checks:[]};fs.mkdirSync(out,{recursive:true});
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail});
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',mobile:true,W:390,H:844,dpr:3});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
 const f=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));await f.evaluate(()=>GC500Explorer.ready);
 const saved=await p.evaluate(()=>JSON.stringify(S));await f.evaluate(()=>{setMode('original');stopCameraMotion813();camera={cx:1192,cy:842,z:4,rot:0};changeView(false)});
 await f.locator('#stage').scrollIntoViewIfNeeded();const r=await f.locator('#stage').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2,cdp=await p.context().newCDPSession(p);
 const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([id,x,y])=>({id,x,y,radiusX:2,radiusY:2,force:1}))});
 const before=await f.evaluate(()=>({...camera}));
 await touch('touchStart',[[1,x-45,y],[2,x+45,y]]);
 for(let i=1;i<=4;i++)await touch('touchMove',[[1,x-45-i*10,y],[2,x+45+i*10,y]]);
 await touch('touchEnd',[]);await f.waitForFunction(()=>!interacting&&!zAnim&&!flingRAF,null,{timeout:10000});
 const pinched=await f.evaluate(()=>({...camera}));check('Real two-finger pinch changes zoom and settles',pinched.z>before.z*1.5,{before,pinched});
 await touch('touchStart',[[1,x,y]]);for(let i=1;i<=4;i++)await touch('touchMove',[[1,x+i*15,y+i*4]]);await p.waitForTimeout(180);await touch('touchEnd',[]);
 await f.waitForFunction(()=>!interacting&&!zAnim&&!flingRAF,null,{timeout:10000});const panned=await f.evaluate(()=>({...camera}));check('Real touch pan changes centre and settles',Math.hypot(panned.cx-pinched.cx,panned.cy-pinched.cy)>1,panned);
 await p.mouse.move(x,y);await p.mouse.wheel(0,-180);await f.waitForFunction(()=>!interacting&&!zAnim&&!flingRAF,null,{timeout:10000});await p.waitForTimeout(250);
 check('Real wheel zoom settles at full backing density',await f.evaluate(z=>camera.z>z&&dpr===dprFull&&pointers.size===0,panned.z));
 const timing=await f.evaluate(()=>{const fs=window.__frames.filter(x=>x.inter).slice(-80),a=fs.map(x=>x.ms).sort((a,b)=>a-b);return {frames:a.length,medianMs:a[Math.floor(a.length/2)]||0,p95Ms:a[Math.floor(a.length*.95)]||0,physicalGPUClaim:false}});report.timing=timing;
 check('Gesture never writes operational state',await p.evaluate(s=>JSON.stringify(S)===s,saved));check('No operational writes attempted',h.counts.blocked===0);check('No browser errors',h.errors.length===0,h.errors);
}catch(e){report.failure=String(e.stack||e);process.exitCode=1}finally{if(report.checks.some(c=>!c.pass))process.exitCode=1;if(h){report.counts=h.counts;report.errors=h.errors;await h.browser.close()}fs.writeFileSync(path.join(out,'gestures.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}})();
