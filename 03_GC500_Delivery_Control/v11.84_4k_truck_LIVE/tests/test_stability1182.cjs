/* Author: Andrew Fisher. Retained 3D, daylight colour pass, culling and lifecycle; read only. */
const fs=require('fs'),path=require('path');const {open}=require('../../toolchain/harness/open_page');
const mob=process.env.MOB==='1',out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const checks=[];function check(name,ok,detail){checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));}
(async()=>{const h=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE,gl:true,W:mob?390:1280,H:mob?844:800,mobile:mob,dpr:1});const p=h.page;try{
async function gpuDone(){await p.evaluate(()=>{const gl=GC3D.S.gl;window.testFence1175=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();});await p.waitForFunction(()=>{const gl=GC3D.S.gl;return gl.clientWaitSync(testFence1175,0,0)!==gl.TIMEOUT_EXPIRED},null,{timeout:180000,polling:200});await p.evaluate(()=>GC3D.S.gl.deleteSync(testFence1175));}
await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.ShowcaseStable1175,null,{timeout:180000});const before=await p.evaluate(()=>JSON.stringify(S));
check('release and stable 3D repair present',await p.evaluate(()=>document.body.innerText.includes('v11.84')));
await p.evaluate(()=>{window.realFrame1175=GC3D.frame;GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.clarity1182','1');localStorage.setItem('gc500.show3d.mount',JSON.stringify({ms:30000,kind:'playback'}));showOpen();showPause();});
check('old slow-device memory cannot replace Day with K220',await p.evaluate(()=>document.getElementById('showcase').dataset.back==='circuit3d_day'&&ShowcaseSmooth1157.state().pending));
await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending)||!!ShowcaseSmooth1157.state().error,null,{timeout:180000});
check('Day scene prepared without error',await p.evaluate(()=>GC3D.S?.look?.name==='day'&&!ShowcaseSmooth1157.state().error));
const geometry=await p.evaluate(()=>Object.fromEntries(['bMesh','trackConcrete','trackFencePosts','cityDetail','standDecor','standMesh'].map(k=>{const m=GC3D.S[k],c=m?.visibility918;return[k,{source:m?.ni,prepared:!!c,covered:c?.cells.reduce((n,x)=>n+x.count,0)}]})));
check('extra static meshes retain every index in culling cells',Object.values(geometry).every(x=>!x.source||x.source<12000||(x.prepared&&x.covered===x.source)),geometry);
await p.evaluate(()=>{const G=GC3D,Q=G.S,gl=Q.gl,draw=gl.drawArrays,use=gl.useProgram;let active=null;window.passes1175={colour:0,blur:0,bright:0};gl.useProgram=function(pr){active=pr;return use.apply(this,arguments)};gl.drawArrays=function(){if(active===Q.prog.comp.p)passes1175.colour++;if(active===Q.prog.blur.p)passes1175.blur++;if(active===Q.prog.bright.p)passes1175.bright++;return draw.apply(this,arguments)};G.render();});
await gpuDone();
await p.screenshot({path:path.join(out,(mob?'phone':'desktop')+'-day-full.png'),timeout:120000});
let high=await p.evaluate(()=>({...passes1175,day:GC3D.S.look.day,detail:GC3D.S.detail781Enabled}));check('normal Day frame uses colour conversion',high.colour===1&&high.day===1,high);
await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.reflOff=true;Q.shadowOff=true;Q.bloom=false;Q.o.ss=.5;[Q.rt,Q.b1,Q.b2,Q.c1,Q.c2].forEach(t=>G.freeTarget(Q.gl,t));Q.rt=Q.b1=Q.b2=Q.c1=Q.c2=null;passes1175={colour:0,blur:0,bright:0};G.render();});
await gpuDone();
await p.screenshot({path:path.join(out,(mob?'phone':'desktop')+'-day-low.png'),timeout:120000});
const low=await p.evaluate(()=>({...passes1175,day:GC3D.S.look.day,look:GC3D.S.look.name,back:document.getElementById('showcase').dataset.back,sceneTarget:!!GC3D.S.rt,glow:GC3D.S.bloom,detail:GC3D.S.detail781Enabled}));
check('low-cost frame keeps Day and colour conversion',low.colour===1&&low.day===1&&low.look==='day'&&low.sceneTarget&&low.glow===false&&low.detail===high.detail,low);
check('low-cost frame eliminates six glow passes',low.blur===0&&low.bright===0&&high.blur===4&&high.bright===2,{high,low});
check('low quality never changes the backdrop',low.back==='circuit3d_day');
check('fallback API cannot force a flat scene',await p.evaluate(()=>ShowcaseQuick1143.fallback(GC3D.S,30000)===false&&document.getElementById('showcase').dataset.back==='circuit3d_day'));
await p.evaluate(()=>{showClose();showOpen();});check('reopening preserves Day despite old timing record',await p.evaluate(()=>document.getElementById('showcase').dataset.back==='circuit3d_day'));
await p.evaluate(()=>showSetBack('circuit3d'));check('explicit Night selection still works',await p.evaluate(()=>document.getElementById('showcase').dataset.back==='circuit3d'&&localStorage.getItem('gc500.showback')==='circuit3d'));
await p.evaluate(()=>{showSetBack('circuit');showMove(1);if(SHOW.playing)showPause();});check('explicit flat selection, navigation and pause still work',await p.evaluate(()=>document.getElementById('showcase').dataset.back==='circuit'&&!SHOW.playing));
await p.evaluate(()=>showClose());check('Close cancels preparation and restores dashboard',await p.evaluate(()=>!GC3D.S&&!ShowcaseSmooth1157.state().pending&&getComputedStyle(document.querySelector('.app')).display!=='none'));
check('shared record untouched',before===await p.evaluate(()=>JSON.stringify(S)));check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0,{errors:h.errors,counts:h.counts});
}finally{await h.browser.close();}fs.writeFileSync(path.join(out,(mob?'phone':'desktop')+'.json'),JSON.stringify(checks,null,2));console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1)})().catch(e=>{console.error(e);process.exit(2)});
