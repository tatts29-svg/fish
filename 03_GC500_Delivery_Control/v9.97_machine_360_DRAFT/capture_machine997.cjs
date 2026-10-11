// Author: Andrew Fisher. Offline manifest-bound rendering; no live app writes or source edits.
'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ROOT=process.env.MACHINE_SOURCE_ROOT||'/workspace/private-coates-cog-04Oct2026/steering-wheel-review';
const SOURCE=path.join(ROOT,'current-public-source');
const OUT=process.env.OUTDIR||'/workspace/private-gc500-machine997/proof1';
const width=Number(process.env.WIDTH||1280),height=Number(process.env.HEIGHT||720),fps=30;
const samples=process.env.FULL==='1'?[0,...Array.from({length:630},(_,i)=>31+i),960]:(process.env.FRAMES||'0,150,300,390,480,570,660,810,960').split(',').map(Number);
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'current-229-file-manifest.json')));
const index=new Map(manifest.files.map(f=>[f.path,f]));
const hook=fs.readFileSync(path.join(__dirname,'machine_film997.js'),'utf8');
const captureHash=sha(fs.readFileSync(__filename));
fs.mkdirSync(path.join(OUT,'frames'),{recursive:true});
(async()=>{
 const requests=[],errors=[],blocked=[],missing=[],shots=[];
 if(process.env.RESUME==='1'&&fs.existsSync(path.join(OUT,'capture-evidence.json'))){
  const old=JSON.parse(fs.readFileSync(path.join(OUT,'capture-evidence.json')));
  if((old.capture_script_sha256&&old.capture_script_sha256!==captureHash)||old.hook_sha256!==sha(Buffer.from(hook))||old.source_manifest!==manifest.sha256||old.width!==width||old.height!==height||old.fps!==fps)throw Error('Resume source/config mismatch');
  requests.push(...old.requests);errors.push(...old.errors);blocked.push(...old.blocked);missing.push(...old.missing);
  for(const shot of old.shots){if(!fs.existsSync(shot.file)||sha(fs.readFileSync(shot.file))!==shot.sha256)throw Error('Resume frame hash mismatch');shots.push(shot);}
 }
 const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).slice(1)||'mechanism.html';
  if(!index.has(name)){missing.push(name);res.writeHead(404);return res.end();}
  let data=fs.readFileSync(path.join(SOURCE,name));
  if(sha(data)!==index.get(name).sha256){res.writeHead(500);return res.end('Source hash mismatch');}
  requests.push(name);if(name==='app.js')data=Buffer.from(data.toString()+'\n'+hook);
  res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.png')?'image/png':'application/octet-stream');res.end(data);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  await page.route('**/*',r=>{const url=r.request().url();if(new URL(url).hostname==='127.0.0.1')return r.continue();blocked.push(url);return r.abort();});
  page.on('pageerror',e=>errors.push({kind:'exception',message:String(e)}));
  page.on('console',m=>{if(m.type()==='error')errors.push({kind:'console',message:m.text()});});
  await page.goto(`http://127.0.0.1:${server.address().port}/mechanism.html?hero=1`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__mech?.camera&&window.__machineFilm997,{polling:100,timeout:120000});
  const prepared=await page.evaluate(()=>window.__machineFilm997.prepare());
  for(const frame of samples){
   if(shots.some(s=>s.frame===frame))continue;
   const started=Date.now();
   const result=await page.evaluate(({frame,fps,width,height})=>{const stats=window.__machineFilm997.render(frame/fps,width,height);return {stats,png:window.__mech.renderer.domElement.toDataURL('image/png')};},{frame,fps,width,height});
   const png=Buffer.from(result.png.split(',')[1],'base64');
   const file=path.join(OUT,'frames',`frame-${String(frame).padStart(4,'0')}.png`);fs.writeFileSync(file,png);
   const pose_sha256=sha(Buffer.from(JSON.stringify(result.stats.pose)));delete result.stats.pose;
   const shot={frame,file,sha256:sha(png),pose_sha256,elapsed_ms:Date.now()-started,...result.stats};shots.push(shot);
   const report={author:'Andrew Fisher',status:'Candidate native render; review required before publication',source_manifest:manifest.sha256,capture_script_sha256:captureHash,hook_sha256:sha(Buffer.from(hook)),width,height,fps,prepared,requests:[...new Set(requests)].sort(),errors,blocked,missing,shots};
   fs.writeFileSync(path.join(OUT,'capture-evidence.tmp'),JSON.stringify(report,null,2));fs.renameSync(path.join(OUT,'capture-evidence.tmp'),path.join(OUT,'capture-evidence.json'));
   console.log(JSON.stringify({frame,width,height,elapsed_ms:shot.elapsed_ms,within_frame:shot.within_frame,in_front:shot.in_front,support_visible:shot.support_visible,hidden_parts:shot.hidden_parts,sha256:shot.sha256}));
   if(!shot.within_frame||!shot.in_front||shot.support_visible||shot.hidden_parts.join(',')!=='18')throw Error('Render geometry invariant failed');
  }
  const unexpected=errors.filter(e=>e.kind!=='console'||e.message!=='Failed to load resource: net::ERR_FAILED'||!blocked.some(url=>new URL(url).hostname==='fonts.googleapis.com'));
  if(missing.length||unexpected.length)throw Error('Source or runtime error during render');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
