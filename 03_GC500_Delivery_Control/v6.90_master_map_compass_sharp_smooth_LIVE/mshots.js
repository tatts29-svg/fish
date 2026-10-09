const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for (const vp of [{width:1400,height:1000},{width:390,height:844}]) { const ph=vp.width<500;
const p=await(await b.newContext({viewport:vp,isMobile:ph,hasTouch:ph,deviceScaleFactor:ph?3:1})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(process.argv[2]+'#map',{waitUntil:'load'}); await p.waitForTimeout(6000);
await p.evaluate(()=>document.querySelector('#stage').scrollIntoView({block:'center'})); await p.waitForTimeout(600);
const tag='locfind/m690_'+(ph?'phone':'desk');
const shot=async n=>{await p.waitForTimeout(1500); const el=await p.$('#stage'); await el.screenshot({path:`${tag}_${n}.png`,timeout:120000});};
await shot('0_asdrawn');
await p.evaluate(()=>document.querySelector('[data-face="0"]').click()); await shot('1_north');
await p.evaluate(()=>document.querySelector('[data-face="180"]').click()); await shot('2_south');
await p.evaluate(()=>{document.querySelector('[data-face="0"]').click();}); await p.waitForTimeout(800);
await p.evaluate(()=>{ for(let i=0;i<5;i++) document.querySelector('[data-z="in"]').click(); }); await p.waitForTimeout(2500); await shot('3_north_zoomed');
if (ph) { await p.evaluate(()=>document.querySelector('[data-mfull]').click()); await p.waitForTimeout(1500); await p.screenshot({path:`${tag}_4_fullscreen.png`}); }
console.log(vp.width, JSON.stringify(await p.evaluate(()=>({rot:state.rot,zoom:+state.zoom.toFixed(2),head:(document.getElementById('mchead')||{}).textContent,tiles:document.querySelectorAll('.mtile.on').length}))), errs);
}
await b.close();})();
