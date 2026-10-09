// Author: Andrew Fisher. Exact source G.step and sound closure, controlled road, offline audio.
// No operational service access. Mechanical audio evidence; no subjective listening claim.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
const page=process.env.PAGE,out=process.env.OUT,baseline=process.env.BASELINE==='1';
assert(page&&out&&process.env.LOOPS,'PAGE, OUT and private original LOOPS fixture are required');
const html=fs.readFileSync(page,'utf8');
function block(first,last){const a=html.indexOf(first),b=html.indexOf(last,a);assert(a>=0&&b>a,first);return html.slice(a,b);}
const parts={tune:block('G.defaultTune=function(){','/* Day Race is the production default.'),units:block('G.units=function(T){','/* What the scene is actually showing, in units anyone can check.'),pose:block('G.pose=function(){','G.step=function(dt){'),step:block('G.step=function(dt){','/* everything that is rebuilt each frame:'),audio:block("const KEY='gc500.showsound'",'\n})();')};
const loops=JSON.parse(fs.readFileSync(process.env.LOOPS,'utf8'));
for(const v of Object.values(loops)){const bytes=Buffer.from(v.data,'base64');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),v.sha256);}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://audio.test/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<html><body>Offline sound verification</body></html>'}));
 await p.goto('http://audio.test/');
 try{
  const result=await p.evaluate(async({parts,loops,baseline})=>{
   localStorage.clear();
   const G=window.GC3D={M_PER_PT:5.937552372855356,rng:seed=>{let s=seed>>>0||1;return ()=>((s=(s*16807)%2147483647)/2147483647);},OPENING:['chase'],SHOTS:[['chase']],BLEND:1,smooth:x=>x};
   eval('(function(){const G=window.GC3D,HW=.5;'+parts.tune+parts.units+parts.pose+parts.step+'})();');
   eval('(function(){const G=window.GC3D;'+parts.audio+';window.auditRevs980=revs;})();');
   const snd=G.sound,checks=[];const check=(name,pass)=>{if(!pass)throw Error(name);checks.push(name);};
   check('Sound/context absent before gesture',!snd.active&&!snd.ctx);
   function scene(){const tune=G.defaultTune();G.units(tune);
    const sim={s:0,v:0,brake:0,lap:0,jumpLap:-1,air:0,vy:0,squash:0,slip:0,lat:0,pitch:0,roll:0,burn:0,nextSmokeAt:0,smokeSide:0,wheel:0,wheelR:0,smoke:[],marks:[],sparks:[],path:[],hist:[],markRun:0,rnd:G.rng(5)};
    const S=G.S={clock:0,tune,sim,gridS:0,CL:{L:1000,at:s=>[s,0,5],tangent:()=>[1,0]},kAt:()=>0,hitAt:()=>0,cam:null,shotI:0,camT:9};
    S.vAt=()=>{const kmh=S.clock<12?205:S.clock<16?60:S.clock<23?185:95;return kmh/3.6*tune.tc/G.M_PER_PT;};G.pose();return S;
   }
   const decode=async ctx=>{for(const [key,v] of Object.entries(loops)){const bytes=Uint8Array.from(atob(v.data),c=>c.charCodeAt(0));snd.bufs[key]=await ctx.decodeAudioData(bytes.buffer);}};
   // A cold fallback must continue running when async loop decode completes.
   snd.ctxFactory=()=>new OfflineAudioContext(2,44100,44100);snd.on();let S=scene();snd.tick(S,0);const running=snd.nodes.engine,context=snd.ctx;
   await decode(context);snd.autoMode();
   if(!baseline){check('Late decode retains firing source',snd.nodes.engine===running);check('Late decode retains audio context',snd.ctx===context);check('Three body layers attach once',snd.nodes.loops?.length===3);const layers=snd.nodes.loops;snd.autoMode();check('Repeated decode completion does not duplicate layers',snd.nodes.loops===layers);
    snd.setMode('engine');check('Engine preference keeps firing source',snd.nodes.engine===running&&!snd.nodes.loops&&snd.modePref()==='engine');snd.setMode('loops');check('Loops preference keeps firing source',snd.nodes.engine===running&&snd.nodes.loops.length===3&&snd.modePref()==='loops');}
   snd.close();check('Close disposes context and every source',!snd.ctx&&!snd.nodes.engine&&!snd.nodes.loops&&!snd.active);
   const duration=30,sr=44100,ctx=new OfflineAudioContext(2,sr*duration,sr);snd.ctxFactory=()=>ctx;snd.on();await decode(ctx);snd.autoMode();S=scene();
   const trace=[];let minLaunch=Infinity,maxMoving=0,nonfinite=false,maxStep=0,previousRpm=null;
   for(let i=0;i<duration*120;i++){
    G.step(1/120);
    if(i%2===0){snd.tick(S,i/120);const r=snd.lastDrive980||{rpm:snd.rpm,thr:snd.thr};
     if(S.sim.go){maxMoving=Math.max(maxMoving,r.rpm);if(S.clock<G.GRID+1)minLaunch=Math.min(minLaunch,r.rpm);}
     nonfinite=nonfinite||![r.rpm,r.thr,snd.engineGain,S.sim.v,S.sim.s].every(Number.isFinite);
     if(previousRpm!=null&&S.clock<5)maxStep=Math.max(maxStep,Math.abs(r.rpm-previousRpm));previousRpm=r.rpm;
     if(i%12===0)trace.push({t:+S.clock.toFixed(4),rpm:+r.rpm.toFixed(2),gear:snd.gear+1,thr:+r.thr.toFixed(3),gain:+snd.engineGain.toFixed(4),kmh:+(S.sim.v*G.M_PER_PT*3.6).toFixed(3),go:S.sim.go,cut:!!r.cut});
    }
   }
   check('Actual fixed-step motion drives finite audio',!nonfinite);
   if(!baseline){check('No clutch-to-idle collapse',minLaunch>=2150);check('Launch RPM has no abrupt jump',maxStep<250);check('Moving revs remain bounded',maxMoving<=6600);check('Sixth gear reached on205kmh straight',trace.some(r=>r.gear===6&&r.kmh>203));check('Maintained speed has engine load',trace.filter(r=>r.t>10&&r.t<11.5).every(r=>r.thr>=.4));check('Brake/throttle changes represented',trace.some(r=>r.t>12&&r.t<13&&r.thr<.05));check('Upshift load cut present',trace.some(r=>r.cut&&r.gain<.15));check('Original generated loop mode retained',snd.mode==='loops');}
   const rendered=await ctx.startRendering(),a=rendered.getChannelData(0);let peak=0,sum=0,clipped=0;const pcm=new Uint8Array(a.length*2),dv=new DataView(pcm.buffer);
   for(let i=0;i<a.length;i++){const x=a[i];peak=Math.max(peak,Math.abs(x));sum+=x*x;if(Math.abs(x)>=.999)clipped++;dv.setInt16(i*2,Math.round(Math.max(-1,Math.min(1,x))*32767),true);}
   check('Rendered audio is present and unclipped',peak>.05&&peak<1&&clipped===0);
   const old=snd.ctx;snd.off();check('Off clears firing source and loops',!snd.active&&!snd.nodes.engine&&!snd.nodes.loops);snd.on();check('On reuses current context',snd.ctx===old);snd.close();
   let binary='';for(let i=0;i<pcm.length;i+=8192)binary+=String.fromCharCode(...pcm.subarray(i,i+8192));
   return {checks,source:'Exact candidate G.defaultTune/G.units/G.pose/G.step/audio closure on a controlled road profile; no fabricated velocity/RPM trace and no listening claim.',duration,sampleRate:sr,peak,rms:Math.sqrt(sum/a.length),clipped,minLaunch,maxMoving,maxLaunchRpmStep:maxStep,trace,log:snd.log,pcm:btoa(binary)};
  },{parts,loops,baseline});
  assert.equal(errors.length,0,errors.join('\n'));fs.mkdirSync(out,{recursive:true});
  const pcm=Buffer.from(result.pcm,'base64'),wav=Buffer.alloc(44+pcm.length);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(result.sampleRate,24);wav.writeUInt32LE(result.sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);pcm.copy(wav,44);delete result.pcm;
  result.author='Andrew Fisher';result.pageSha256=crypto.createHash('sha256').update(html).digest('hex');result.wavSha256=crypto.createHash('sha256').update(wav).digest('hex');result.errors=errors;
  fs.writeFileSync(path.join(out,'engine980.wav'),wav);fs.writeFileSync(path.join(out,'audio980.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,baseline,checks:result.checks.length,peak:result.peak,rms:result.rms,minLaunch:result.minLaunch,maxMoving:result.maxMoving,maxLaunchRpmStep:result.maxLaunchRpmStep,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
