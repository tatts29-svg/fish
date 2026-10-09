// frame times while zooming, panning and turning the master map; desk and phone (CPU 4x slower), same script for any build
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const out={};
for (const mode of ['desk','phone']) {
 const ctx=await b.newContext(mode==='phone'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}:{viewport:{width:1280,height:800}});
 const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(process.argv[2]+'#map',{waitUntil:'load'}); await p.waitForTimeout(6000);
 const cdp=await ctx.newCDPSession(p); if (mode==='phone') await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.evaluate(()=>document.querySelector('#stage').scrollIntoView({block:'center'})); await p.waitForTimeout(800);
 const bb=await (await p.$('#stage')).boundingBox();
 const run=async(name,fn)=>{ await p.evaluate(()=>{window.__fr=[];window.__lt=[];window.__on=true;let last=performance.now();const f=t=>{window.__fr.push(t-last);last=t;if(window.__on)requestAnimationFrame(f)};requestAnimationFrame(f);try{window.__po&&window.__po.disconnect();window.__po=new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(Math.round(e.duration))});window.__po.observe({type:'longtask'})}catch(e){}});
  await fn(); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{window.__on=false;const g=window.__fr.slice(2).filter(Boolean).sort((a,b)=>b-a);const n=g.length;return {frames:n,p50:Math.round(g[Math.floor(n/2)]),p95:Math.round(g[Math.floor(n*0.05)]),worst:g.slice(0,3).map(Math.round),over33:g.filter(x=>x>33.4).length,lt:window.__lt.length,ltmax:Math.max(0,...window.__lt)}});
  out[mode+' '+name]=r; };
 await p.mouse.move(bb.x+bb.width*.55,bb.y+bb.height*.5);
 await run('zoom',async()=>{for(let i=0;i<14;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(35);} await p.waitForTimeout(500); for(let i=0;i<8;i++){await p.mouse.wheel(0,120);await p.waitForTimeout(35);}});
 await run('pan',async()=>{await p.mouse.down();for(let i=0;i<30;i++)await p.mouse.move(bb.x+bb.width*.55-i*8,bb.y+bb.height*.5-i*3);await p.mouse.up();});
 await run('turn',async()=>{ const has=await p.$('[data-face="90"]'); if(has){ for(const f of ['90','180','270','0']){await p.evaluate(f=>document.querySelector(`[data-face="${f}"]`).click(),f);await p.waitForTimeout(500);} } else { for(let i=0;i<4;i++){await p.evaluate(()=>document.querySelector('[data-r="r"]').click());await p.waitForTimeout(500);} }});
 out[mode+' errs']=errs;
 await ctx.close();
}
console.log(JSON.stringify(out,null,0).replace(/\},"/g,'},\n"'));await b.close();})();
