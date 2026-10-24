// Author: Andrew Fisher. Offline browser frames, no service access.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {chromium} = require('playwright');
const file = process.argv[2], out = process.argv[3];
const movie = process.argv.includes('--frames');
const largeFrame = process.argv.includes('--4k');
const kerbOnly = process.argv.includes('--kerb-only');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
 fs.mkdirSync(out, {recursive:true});
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium', args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const errors=[], requests=[];
 try {
  const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Brisbane'});
  await context.route('**/*', r => {requests.push(r.request().url());return r.abort();});
  const p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.setContent(fs.readFileSync(file,'utf8'),{waitUntil:'domcontentloaded',timeout:180000});
  const state=await p.evaluate(()=>{
   if(!startPreview781())throw Error(document.querySelector('#start p').textContent || 'Scene failed to start');
   pausePreview781(true); const G=GC3D,S=G.S;G.noGuard=true;
   G.setQuality('high');S.qualityChoice='manual';
   for(let i=0;i<500;i++)G.step(1/120);G.render();
   return {report:G.previewReport781(),clock:S.clock,s:S.sim.s,cam:S.cam,car:S.raceCarStats,treeCount:S.treeCount,treeGeometry:S.treeGeometry,gl:S.gl.getError()};
  });
  if(!kerbOnly){
   await p.screenshot({path:path.join(out,'desktop.png'),timeout:120000});
   await p.locator('[data-camera="onboard"]').click();
   await p.screenshot({path:path.join(out,'track-level.png'),timeout:120000});
   await p.locator('[data-camera="chase"]').click();
  }
  // Inspect an existing kerb from a low fixed camera; never change its footprint
  // or the car's source geometry to make a comparison shot more attractive.
  const kerbCapture=await p.evaluate(()=>{
   const G=GC3D,S=G.S,M=G.M_PER_PT||6,V=S.kerb.v,grid=S.CL.at(S.gridS);
   let closest=null,distance=Infinity;
   for(let q=0;q<S.kerbStats.blocks*2;q++){
    const points=Array.from({length:4},(_,k)=>Array.from(V.slice((q*4+k)*9,(q*4+k)*9+3)));
    const centre=points.reduce((a,p)=>a.map((v,i)=>v+p[i]/4),[0,0,0]);
    const d=Math.hypot(centre[0]-grid[0],centre[2]-grid[1]);if(d<distance){distance=d;closest=points;}
   }
   const a=closest[0],b=closest[3],mid=a.map((v,i)=>(v+b[i])/2),inner=closest[1].map((v,i)=>(v+closest[2][i])/2);
   const out=G.V.norm(G.V.sub(mid,inner)),along=G.V.norm(G.V.sub(b,a));
   S.previewLoop781=false;S.shotName='onboard';S.camRoll=0;S.cam={eye:[mid[0]+out[0]*3/M-along[0]*4/M,S.tune.deckH+1.05/M,mid[2]+out[2]*3/M-along[2]*4/M],tgt:[mid[0],S.tune.deckH+.10/M,mid[2]],fov:55};
   S.tune.shiftX=0;S.tune.shiftY=0;
   const oldCamStep=G.camStep;
   try {
    G.camStep=()=>{};G.render();
    return {png:S.cv.toDataURL('image/png').split(',')[1],camera:S.cam,sourceQuad:closest,gl:S.gl.getError()};
   } finally {G.camStep=oldCamStep;}
  });
  fs.writeFileSync(path.join(out,'kerb-detail.png'),Buffer.from(kerbCapture.png,'base64'));
  state.kerbCapture={camera:kerbCapture.camera,sourceQuad:kerbCapture.sourceQuad,gl:kerbCapture.gl};
  await p.evaluate(()=>{GC3D.restartPreview781();pausePreview781(true);for(let i=0;i<500;i++)GC3D.step(1/120);GC3D.render();});
  if(largeFrame){
   await p.setViewportSize({width:3840,height:2160});
   await p.evaluate(()=>{GC3D.setQuality('high');GC3D.S.qualityChoice='manual';GC3D.S.exportSize=[3840,2160];GC3D.camStep(0);GC3D.render();});
   await p.screenshot({path:path.join(out,'desktop-4k.png'),timeout:120000});
   state.largeFrame=await p.evaluate(()=>({canvas:[GC3D.S.cv.width,GC3D.S.cv.height],viewport:[innerWidth,innerHeight],gl:GC3D.S.gl.getError()}));
   if(state.largeFrame.canvas[0]!==3840 || state.largeFrame.canvas[1]!==2160)throw Error('4K export did not render a native 3840 × 2160 framebuffer');
   await p.evaluate(()=>{GC3D.S.exportSize=null;});
   await p.setViewportSize({width:1440,height:900});
  }
  if(movie){
   fs.mkdirSync(path.join(out,'frames'),{recursive:true});
   await p.evaluate(()=>{GC3D.restartPreview781();pausePreview781(true);});
   for(let i=0;i<72;i++){
    const encoded=await p.evaluate(()=>{
     const G=GC3D;for(let j=0;j<10;j++)G.step(1/120);G.render();
     return G.S.cv.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync(path.join(out,'frames',String(i).padStart(4,'0')+'.png'),Buffer.from(encoded,'base64'));
   }
  }
  const result={author:'Andrew Fisher',file,sha256:hash(fs.readFileSync(file)),rendering:'Software Chromium; still frames and optional fixed-step animation, not a real-time performance benchmark',state,errors,requests};
  fs.writeFileSync(path.join(out,'render.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({out,sha256:result.sha256,errors,requests:requests.length,report:state.report}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
