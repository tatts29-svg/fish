/* Author: Andrew Fisher. Actual-source lap regression for camera discontinuities.
 * Reuses the playback fixture's original route, physics and source building setup.
 * No browser, GPU, service or records are accessed.
 */
const fs=require('fs'),vm=require('vm'),path=require('path');
const dir=path.join(__dirname,'evidence'),fixture=fs.readFileSync(path.join(dir,'playback794_checks.cjs'),'utf8');
const marker='for(const fps of [60,12,8])';if(!fixture.includes(marker))throw Error('Playback fixture boundary changed; review the test adapter');
let code=fixture.split(marker)[0];
code+=`
{
const assert=require('assert'),crypto=require('crypto');
const cameraSource=fs.readFileSync(path.join(__dirname,'../camera794_src.js'),'utf8'),cases=[];
for(const [w,h] of [[1280,517],[390,650],[2400,600],[3600,600]]){
 const r=rig({fps:60}),G=r.G,S=G.S;
 G.VIEWS=['auto','chase','onboard','hero','heli','top','wide'].map(x=>[x,x]);
 G.setView=name=>{S.view=name;S.forceShot=name==='auto'?null:name;S.camBase=null;S.needsRender=true;return name;};G.framedFov=d=>d*Math.PI/180;
 S.cv={clientWidth:w,clientHeight:h,style:{}};S.pack={mPerPt:G.M_PER_PT};
 r.call('G.S.architecture781Source=data.surrounds.b.concat(data.surrounds.bp||[]).map(a=>({h:a[0]*.05,y0:a[1]*.05,p:G.packPts(data.surrounds,a,2)}));');
 r.call(cameraSource);G.setView('tour');
 let previous=null,maxVisibleStepM=0,samples=0,adjusted=0,fallbacks=0,hiddenOverviewChanges=0,roadSamples=0,desiredRoadFovMax=0,settledFollowingSamples=0,settledCarOutside=0;const sections=new Set(),requested=new Set();
 while(S.sim.s-S.gridS<S.CL.L){
  r.tick();const q=S.camera794&&S.camera794.report;if(!q||(previous&&S.clock===previous.clock))continue;
  samples++;sections.add(q.lapSection);requested.add(q.requestedShot);adjusted+=q.obstructionAdjusted?1:0;fallbacks+=q.fallback?1:0;
  const intended={onboard:68,heli:58,hero:54,chase:53}[q.requestedShot];
  if(intended){assert(q.desiredFov>0&&q.desiredFov<=88);assert(q.desiredHorizontalFov<=intended+1e-9);desiredRoadFovMax=Math.max(desiredRoadFovMax,q.desiredHorizontalFov);}
  if(['onboard','hero','chase'].includes(q.requestedShot))roadSamples++;
  if(!q.transitionActive&&['hero','chase','heli'].includes(q.shot)){settledFollowingSamples++;if(!q.carInFrame)settledCarOutside++;}
  if(previous){const distance=Math.hypot(...q.eye.map((x,i)=>x-previous.eye[i]))*G.M_PER_PT;
   if(q.transitionOpacity>.08&&previous.opacity>.08)maxVisibleStepM=Math.max(maxVisibleStepM,distance);
   else if(distance>120){assert(q.transitionOpacity<.01&&previous.opacity<.01);hiddenOverviewChanges++;}
  }
  previous={eye:q.eye.slice(),clock:S.clock,opacity:q.transitionOpacity};
 }
 assert.strictEqual(sections.size,12);assert.strictEqual(adjusted,0);assert.strictEqual(fallbacks,0);
 assert(maxVisibleStepM<2.5,'Visible camera discontinuity: '+maxVisibleStepM+' m per 60 Hz sample');assert(hiddenOverviewChanges>=2);
 assert(requested.has('top')&&requested.has('wide'));assert(roadSamples/samples>.75,'Road shots must dominate the complete lap');
 assert.strictEqual(settledCarOutside,0,'Settled following camera loses car');
 cases.push({width:w,height:h,samples,sections:sections.size,adjusted,fallbacks,maxVisibleStepM,hiddenOverviewChanges,roadSamples,roadSampleFraction:roadSamples/samples,desiredRoadFovMax,settledFollowingSamples,settledCarOutside});
}
const result={author:'Andrew Fisher',passed:true,cameraSha256:crypto.createHash('sha256').update(cameraSource).digest('hex'),cases,
 scope:'Actual source circuit, OSM footprints and original physics at 60 Hz in CPU fixture; rendering quality and device frame rate require browser checks'};
fs.writeFileSync(path.join(__dirname,'camera794_actual_route_checks.json'),JSON.stringify(result,null,2)+'\\n');console.log(JSON.stringify(result));
}
`;
vm.runInNewContext(code,{require,process,console,__dirname:dir},{filename:path.join(dir,'camera794_actual_route_fixture.cjs')});
