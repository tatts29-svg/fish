// Sit on a tab for IDLE seconds and count full renders, Today pane rebuilds and their causes.
const {open}=require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async()=>{const MOB=!!process.env.MOB;const s=await open(MOB?{pageFile:process.env.PAGE,W:390,H:844,dpr:2,mobile:true}:{pageFile:process.env.PAGE,W:1440,H:900});const p=s.page;
await p.waitForFunction(()=>typeof go==='function'&&typeof TABS!=='undefined',null,{timeout:150000});await p.waitForTimeout(3000);
await p.evaluate(k=>go(k),process.env.TAB||'today');await p.waitForTimeout(3000);
await p.evaluate(()=>{window.__r=[];const t0=performance.now();const orig=window.render;
 window.render=function(){__r.push({t:Math.round(performance.now()-t0),stack:(new Error().stack||'').split('\n').slice(2,6).map(x=>x.trim().slice(0,90)).join(' | ')});return orig.apply(this,arguments)};
 const pane=document.getElementById('pane-'+(location.hash.slice(1)||'today'))||document.querySelector('main .pane.on');
 window.__pm=[];new MutationObserver(l=>{for(const m of l)if(m.target===pane&&m.removedNodes.length>2)__pm.push({t:Math.round(performance.now()-t0),rm:m.removedNodes.length})}).observe(pane,{childList:true});
 window.__an=[];setInterval(()=>{const a=document.getAnimations().filter(x=>x.playState==='running'&&x.animationName==='v610rise').length;if(a)__an.push(Math.round(performance.now()-t0))},100);});
await p.waitForTimeout((+process.env.IDLE||60)*1000);
console.log(JSON.stringify(await p.evaluate(()=>({renders:__r,paneRebuilds:__pm,riseAt:__an.slice(0,50),riseCount:__an.length}))));
await s.browser.close();})().catch(e=>{console.error('FAIL',e.stack);process.exit(1)});
