/* Author: Andrew Fisher. Separate main-thread construction from software GPU drawing. */
const fs=require('fs');const {open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,W:1440,H:900,gl:true});const p=h.page;try{
await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.evaluate(()=>{localStorage.removeItem('gc500.showback');localStorage.removeItem('gc500.show3d.mount');GC3D.frame=()=>{};window.bench={gaps:[],during:0,openMs:0};let last=performance.now();window.benchTimer=setInterval(()=>{const t=performance.now();bench.gaps.push(t-last);last=t;if(window.ShowcaseSmooth1157?.state().pending)bench.during++;},50);const t=performance.now();showOpen();bench.openMs=performance.now()-t;});
await p.waitForFunction(()=>GC3D.S?.unmount||GC3D.failed||window.ShowcaseSmooth1157?.state().error,null,{timeout:180000});await p.waitForTimeout(200);
const r=await p.evaluate(()=>{clearInterval(benchTimer);return {...bench,steady:ShowcaseSteady1120.state(),smooth:window.ShowcaseSmooth1157?.state(),failed:GC3D.failed};});r.errors=h.errors;r.counts=h.counts;fs.writeFileSync(process.env.OUT,JSON.stringify(r,null,2));console.log({...r,gaps:undefined,maxGap:Math.max(...r.gaps)});
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
