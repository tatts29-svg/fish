// Screencast a tab change (FROM -> TO) and a same-tab re-render, save frames to OUT dir with timestamps.
const {open}=require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');const fs=require('fs');
(async()=>{const MOB=!!process.env.MOB,OUT=process.env.OUT;fs.mkdirSync(OUT,{recursive:true});
const s=await open(MOB?{pageFile:process.env.PAGE,W:390,H:844,dpr:2,mobile:true}:{pageFile:process.env.PAGE,W:1440,H:900});const p=s.page;
await p.waitForFunction(()=>typeof go==='function'&&typeof TABS!=='undefined',null,{timeout:150000});await p.waitForTimeout(4000);
const cdp=await p.context().newCDPSession(p);let frames=[],rec=false,t0=0;
cdp.on('Page.screencastFrame',async f=>{if(rec)frames.push({t:Date.now()-t0,data:f.data});try{await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId})}catch(e){}});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:45,everyNthFrame:1,maxWidth:MOB?390:1440});
const runs=(process.env.RUNS||'timeline>today,today>docs,today>plant,today>@render').split(',');
for(const run of runs){const [a,b]=run.split('>');await p.evaluate(a=>go(a),a);await p.waitForTimeout(2500);
 frames=[];t0=Date.now();rec=true;
 if(b==='@render')await p.evaluate(()=>render());else await p.evaluate(k=>{const x=[...document.querySelectorAll('[data-tab="'+k+'"]')].find(e=>e.offsetParent);if(x)x.click();else go(k);},b);
 await p.waitForTimeout(2200);rec=false;
 const dir=OUT+'/'+run.replace('>','_to_').replace('@','');fs.mkdirSync(dir,{recursive:true});
 frames.forEach((f,i)=>fs.writeFileSync(`${dir}/${String(i).padStart(3,'0')}_${String(f.t).padStart(5,'0')}.jpg`,Buffer.from(f.data,'base64')));
 console.log(run,frames.length);}
await s.browser.close();})().catch(e=>{console.error('FAIL',e.stack);process.exit(1)});
