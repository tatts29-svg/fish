// Author: Andrew Fisher. Read-only source identity and photo-detail budget checks.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
(async()=>{
 const phone=process.env.MOB==='1',results=[];
 for(const [label,file] of [['base',process.env.BASE],['candidate',process.env.PAGE]]){
  const s=await open({pageFile:file,gl:true,mobile:phone,W:phone?390:1440,H:phone?844:900,dpr:1}),p=s.page;
  await p.evaluate(()=>{localStorage.setItem('gc500.showback','circuit3d_day');showOpen();});
  await p.waitForFunction(()=>GC3D.S?.trackDetail781&&GC3D.S?.vegetation781&&GC3D.S?.architecture781,{timeout:120000});
  const x=await p.evaluate(()=>{
   if(SHOW.playing)showPause();const S=GC3D.S;
   const shape=m=>m?{positions:Array.from({length:m.v.length/m.stride},(_,i)=>m.v.slice(i*m.stride,i*m.stride+3)),indices:m.i}:null;
   return {source:{outer:S.outer,inner:S.inner,centre:S.CL.p,grid:S.gridS,pit:S.pitPts,
    concrete:shape(S.trackConcrete),wire:shape(S.trackFenceWire),kerb:shape(S.kerb),
    buildings:S.architecture781Source,vegetation:S.vegetation781Source,labels:S.photoLabels792},
    report:S.trackDetailReport,detail:S.trackDetail781.stats,loop:SHOW.loop,quality:GC3D.openingQuality(),failed:GC3D.failed||null};
  });
  const source=Object.fromEntries(Object.entries(x.source).map(([k,v])=>[k,hash(v)]));delete x.source;
  if(label==='candidate'&&process.env.SHOT)await p.screenshot({path:process.env.SHOT,timeout:120000});
  await p.evaluate(()=>showClose());x.closed=await p.evaluate(()=>!SHOW.open&&!GC3D.S&&!GC3D._raceCarModels);
  x.errors=s.errors;x.writes=s.counts.blocked;x.label=label;x.source=source;results.push(x);await s.browser.close();
 }
 const [a,b]=results,R={author:'Andrew Fisher',phone,checks:[],base:a,candidate:b};
 const check=(name,value)=>R.checks.push({name,pass:!!value});
 for(const key of Object.keys(a.source))check('unchanged '+key,a.source[key]===b.source[key]);
 const r=b.report,t=r.photoTrack920;
 check('photo detail installed',!!t);check('pale concrete and galvanised frames',t.paleConcrete&&t.galvanisedFrames);
 check('lifting recesses bounded',t.liftingRecesses>0&&t.liftingRecesses<=r.barrierModules*2);
 check('frame plates sparse',t.framePlates>0&&t.framePlates<=Math.ceil(r.barrierModules/4)+2);
 check('concrete and wire triangle count unchanged',r.concreteTriangles===a.report.concreteTriangles&&r.wireTriangles===a.report.wireTriangles);
 check('added metal triangles exactly budgeted',r.metalTriangles-a.report.metalTriangles===t.framePlates*2);
 check('added recess triangles exactly budgeted',r.scuffTriangles-a.report.scuffTriangles===t.liftingRecesses*2);
 check('no new resources draw calls or frame work',t.newGPUResources===0&&t.newDrawCalls===0&&t.perFrameWork===0);
 check('no landmark placement',t.newLandmarkPlacements===0&&t.surveyedReconstruction===false);
 check('Balanced and loop retained',b.loop&&b.quality==='balanced');check('cleanup',b.closed);
 check('no renderer failure',!b.failed);check('no errors or writes',!b.errors.length&&!a.errors.length&&!b.writes&&!a.writes);
 fs.writeFileSync(process.env.OUT,JSON.stringify(R,null,2));console.log(JSON.stringify({checks:R.checks.length,failed:R.checks.filter(x=>!x.pass),photo:t,triangles:{metalAdded:r.metalTriangles-a.report.metalTriangles,recessAdded:r.scuffTriangles-a.report.scuffTriangles}}));
 if(R.checks.some(x=>!x.pass))process.exit(1);
})().catch(e=>{console.error(e.stack);process.exit(1)});
