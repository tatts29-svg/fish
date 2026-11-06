// main-thread work per gesture (script, style, layout, layer, paint, commit) - the part every device pays for
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const res={};
for (const mode of ['desk','phone']){
const ctx=await b.newContext(mode==='phone'?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3}:{viewport:{width:1280,height:800}});
const p=await ctx.newPage(); await p.goto(process.argv[2]+'#map',{waitUntil:'load'}); await p.waitForTimeout(6000);
await p.evaluate(()=>document.querySelector('#stage').scrollIntoView({block:'center'})); await p.waitForTimeout(800);
const bb=await (await p.$('#stage')).boundingBox(); await p.mouse.move(bb.x+bb.width*.55,bb.y+bb.height*.5);
const KEEP=['FunctionCall','FireAnimationFrame','EventDispatch','UpdateLayoutTree','Layout','Layerize','PrePaint','Paint','Commit','HitTest','UpdateLayer'];
const g=async(name,fn)=>{ await b.startTracing(p,{path:'t.json',categories:['devtools.timeline']}); const t0=Date.now(); await fn(); await p.waitForTimeout(400); await b.stopTracing();
 const ev=JSON.parse(fs.readFileSync('t.json')).traceEvents.filter(e=>e.ph==='X'&&e.dur); const tid=(ev.find(e=>e.name==='UpdateLayoutTree')||ev.find(e=>e.name==='FunctionCall')||{}).tid;
 const tot={}; for(const e of ev){ if(e.tid!==tid) continue; if(KEEP.includes(e.name)) tot[e.name]=(tot[e.name]||0)+e.dur/1000; }
 const s=(tot.FunctionCall||0)+(tot.UpdateLayoutTree||0)+(tot.Layout||0)+(tot.Layerize||0)+(tot.PrePaint||0)+(tot.Paint||0)+(tot.Commit||0)+(tot.HitTest||0);
 res[mode+' '+name]={mainMs:Math.round(s),style:Math.round(tot.UpdateLayoutTree||0),script:Math.round(tot.FunctionCall||0),layerize:Math.round(tot.Layerize||0),paint:Math.round((tot.Paint||0)+(tot.PrePaint||0)),commit:Math.round(tot.Commit||0),wallMs:Date.now()-t0}; };
await g('zoom',async()=>{for(let i=0;i<14;i++){await p.mouse.wheel(0,-120);await p.waitForTimeout(35);} await p.waitForTimeout(400); for(let i=0;i<8;i++){await p.mouse.wheel(0,120);await p.waitForTimeout(35);}});
await g('pan',async()=>{await p.mouse.down();for(let i=0;i<30;i++)await p.mouse.move(bb.x+bb.width*.55-i*8,bb.y+bb.height*.5-i*3);await p.mouse.up();});
await g('turn',async()=>{ const has=await p.$('[data-face="90"]'); for(let i=0;i<4;i++){ if(has) await p.evaluate(f=>document.querySelector(`[data-face="${f}"]`).click(),['90','180','270','0'][i]); else await p.evaluate(()=>document.querySelector('[data-r="r"]').click()); await p.waitForTimeout(500);} });
await ctx.close(); }
for(const [k,v] of Object.entries(res)) console.log(k.padEnd(12),JSON.stringify(v)); await b.close();})();
