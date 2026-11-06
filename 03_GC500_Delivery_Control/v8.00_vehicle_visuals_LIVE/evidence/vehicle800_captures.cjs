/* Author: Andrew Fisher. Read-only matched vehicle close-up review. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE,out=process.env.OUT;
if(!pageFile||!out)throw Error('PAGE and private OUT are required');
fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',candidate:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),views:[],errors:[],blockedWrites:0};
(async()=>{for(const phone of [false,true]){
 const device=phone?'phone':'desktop',s=await open({pageFile,W:phone?390:1280,H:phone?844:800,mobile:phone,dpr:1,gl:true}),p=s.page;
 try{
  p.setDefaultTimeout(180000);
  await p.waitForFunction(()=>typeof showOpen==='function'&&SYNC.status==='live',null,{timeout:240000});
  await p.evaluate(()=>{localStorage.setItem('gc500.showview','detail');localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showback','circuit3d_day');GC3D.noGuard=true;showOpen();});
  await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl);
  await p.evaluate(()=>{if(SHOW.playing)showPause();GC3D.setQuality('balanced');GC3D.S.qualityChoice='manual';window.__vehicleRender=GC3D.render;window.__vehicleTime=0;});
  for(const vehicle of ['car','car_vms','car_loo','forklift','boom','scissor','tractor']){
   for(const view of vehicle==='car'?['detail','frontdetail','wheel']:['detail','frontdetail']){
    const snap=await p.evaluate(({vehicle,view})=>{const G=GC3D,S=G.S;showVehicleSet(vehicle);if(G.VIEWS.some(v=>v[0]===view)){document.getElementById('showView').value=view;G.setView(view);}else{G.renderAt(0,view);}G.render=()=>{};S.last=null;for(let i=0;i<100;i++){window.__vehicleTime+=1000/60;G.frame(window.__vehicleTime);}G.render=window.__vehicleRender;G.render();return {vehicle,view,gl:S.gl.getError(),paused:S.paused,actualVehicle:S.vehicle,actualView:S.view,actualShot:S.shotName,graphics:G.graphicsReport(),canvas:{cssWidth:S.cv.clientWidth,cssHeight:S.cv.clientHeight,width:S.cv.width,height:S.cv.height},eye:S.cam.eye,target:S.cam.tgt,fov:S.cam.fov};},{vehicle,view});
    if(snap.gl)throw Error(vehicle+' '+view+' GL error '+snap.gl);if(snap.actualView!==view)throw Error('Requested camera did not activate: '+view);
    const name=device+'-'+vehicle+'-'+view+'.png';await p.screenshot({path:path.join(out,name),timeout:180000});result.views.push({device,...snap,file:name});
   }
  }
 }finally{result.errors.push(...s.errors);result.blockedWrites+=s.counts.blocked;await s.browser.close();fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(result,null,2)+'\n');}
}result.complete=true;fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({views:result.views.length,errors:result.errors,blockedWrites:result.blockedWrites}));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
