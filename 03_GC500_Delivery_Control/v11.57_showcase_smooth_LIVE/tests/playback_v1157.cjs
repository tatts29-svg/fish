/* Author: Andrew Fisher. Actual WebGL playback; raw captures remain private. */
const fs=require('fs');const {open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,W:1280,H:800,gl:true});const p=h.page;try{
await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});
await p.evaluate(()=>{localStorage.removeItem('gc500.showback');localStorage.removeItem('gc500.show3d.mount');window.sample1156={gaps:[],changes:[],openMs:0};let last=performance.now(),scene=-1;window.pulse=setInterval(()=>{const t=performance.now();sample1156.gaps.push(t-last);last=t;if(scene!==SHOW.i){scene=SHOW.i;sample1156.changes.push({i:scene,at:t});}},50);const t=performance.now();showOpen();sample1156.openMs=performance.now()-t;});
console.log('opened');for(let i=0;i<14;i++){await p.waitForTimeout(5000);console.log(await p.evaluate(()=>({i:SHOW.i,ready:ShowcaseSmooth1157.state(),gpu:ShowcaseGPU1157.state(),clock:GC3D.S?.clock,quality:GC3D.S?.qualityStep})));}
await p.screenshot({path:(process.env.OUT||'/tmp/gc500-1157')+'/playback.png',timeout:60000});
const r=await p.evaluate(()=>{clearInterval(pulse);const s={...sample1156,ready:ShowcaseSmooth1157.state(),gpu:ShowcaseGPU1157.state()};const t=performance.now();showClose();s.closeMs=performance.now()-t;return s;});fs.writeFileSync((process.env.OUT||'/tmp/gc500-1157')+'/playback.json',JSON.stringify(r,null,2));console.log({open:r.openMs,close:r.closeMs,maxGap:Math.max(...r.gaps),gapsOver500:r.gaps.filter(x=>x>500),scenes:r.changes.length,errors:h.errors,counts:h.counts});
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
