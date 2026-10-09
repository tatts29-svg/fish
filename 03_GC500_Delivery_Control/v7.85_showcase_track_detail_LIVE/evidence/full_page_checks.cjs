// Author: Andrew Fisher.
// Read-only full-page preview lifecycle and default-off pixel preservation checks.
// Run only after the frozen build and the shared software-GPU slot are available.
// PAGE=<candidate> BASE_PAGE=<live base> OUT=<private directory> node full_page_checks.cjs
// The normal harness blocks service writes. Local preferences belong to fresh disposable contexts.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const dir=path.resolve(__dirname,'../../build/GC500_v7.85');
const candidate=path.resolve(process.env.PAGE||path.join(dir,'GC500_Delivery_Control_hosted.html'));
const baseline=path.resolve(process.env.BASE_PAGE||path.join(dir,'base_live.html'));
const out=path.resolve(process.env.OUT||'/workspace/private-showcase785/full-page');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const R={author:'Andrew Fisher',rendering:'960 x 640 desktop and 390 x 844 phone emulation, DPR 1, software Chromium; not a physical-device performance benchmark',checks:[],errors:[],serviceWriteAttempts:[],captures:[]};
function check(name,pass,detail,fatal=false){R.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass&&fatal)throw Error(name);}
function save(){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'full-page-checks.json'),JSON.stringify(R,null,2)+'\n');}
async function openPage(file,label,viewport={}){
 const s=await open({pageFile:file,W:960,H:640,dpr:1,gl:true,...viewport});const p=s.page;
 p.setDefaultTimeout(90000);p.setDefaultNavigationTimeout(180000);
 p.on('request',r=>{const u=new URL(r.url());if(u.hostname==='gc500-production.up.railway.app'&&!['GET','HEAD'].includes(r.method()))R.serviceWriteAttempts.push({case:label,method:r.method(),path:u.pathname});});
 p.on('console',m=>{if(m.type()==='error'||/INVALID_(?:OPERATION|VALUE|ENUM)|shader.*(?:error|fail)|program.*link.*fail/i.test(m.text()))R.errors.push({case:label,kind:m.type(),message:m.text().slice(0,300)});});
 await p.waitForFunction(()=>typeof showOpen==='function'&&window.GC3D&&typeof GC3D.renderAt==='function');
 if(label==='candidate')check('foliage lifecycle hooks execute before opening Showcase',await p.evaluate(()=>typeof GC3D.installVegetation781==='function'&&typeof GC3D.disposeVegetation781==='function'),undefined,true);
 await p.evaluate(()=>{GC3D.noGuard=true;localStorage.setItem('gc500.showquality','balanced');localStorage.setItem('gc500.showview','hero');localStorage.setItem('gc500.showvehicle','car');localStorage.setItem('gc500.showpace','1');});
 return {s,p,label};
}
async function closePage(c){
 try{await c.p.evaluate(()=>{if(SHOW.open)showClose();});}catch{}
 R.errors.push(...c.s.errors.map(message=>({case:c.label,kind:'page',message})));
 R.checks.push({name:c.label+': harness blocked-write count',pass:c.s.counts.blocked===0,detail:c.s.counts.blocked});
 await c.s.browser.close();
}
async function start(p,raw='circuit3d_day'){
 await p.evaluate(value=>{
  if(SHOW.open)showClose();
  if(value===null)localStorage.removeItem('gc500.showback');else localStorage.setItem('gc500.showback',value);
  GC3D.noGuard=true;showOpen();if(SHOW.playing)showPause();showClear();
 },raw);
 await p.waitForFunction(()=>GC3D.S&&GC3D.S.gl&&!GC3D.S.lost);
 await p.evaluate(()=>{GC3D.setQuality('balanced');GC3D.S.qualityChoice='manual';GC3D.S.paused=true;});
}
async function snapshot(p){return p.evaluate(()=>({
 open:SHOW.open,playing:SHOW.playing,stored:localStorage.getItem('gc500.showback'),preference:showBackPref(),
 backdrop:document.getElementById('showcase').getAttribute('data-back'),selection:document.getElementById('showBackdrop').value,
 enabled:!!(GC3D.preview781&&GC3D.preview781.enabled),detail:!!(GC3D.S&&GC3D.S.detail781Enabled),
 scene:!!GC3D.S,paused:GC3D.S?GC3D.S.paused:null,loop:!!(GC3D.S&&GC3D.S.previewLoop781),
 clock:GC3D.S?GC3D.S.clock:null,view:GC3D.S?GC3D.S.view:null,
 button:document.getElementById('detail781Button')&&document.getElementById('detail781Button').getAttribute('aria-pressed')
}));}
async function cameraControl(p){return p.evaluate(()=>{
 const sel=document.getElementById('showView'),button=document.getElementById('detail781Button');
 return {stored:localStorage.getItem('gc500.showview'),value:sel.value,label:sel.getAttribute('aria-label'),
  options:Array.from(sel.options,o=>({value:o.value,hidden:o.hidden,disabled:o.disabled})),button:button.textContent};
});}
async function capture(c,name){
 const data=await c.p.evaluate(()=>{
  const G=GC3D,S=G.S;G.noGuard=true;S.paused=true;G.setQuality('balanced');S.qualityChoice='manual';
  // Neutralise layout easing so frame timing cannot move the identical test camera.
  S.tune.shiftX=0;S.tune.shiftY=0;S.shiftGoal=0;S.distGoal=1;S.distK=1;S.calm=false;
  // renderAt uses simReset, which clears S.paused. Keep the diagnostic capture
  // consistent with the already-paused Showcase before testing restoration.
  G.renderAt(8,'hero');S.paused=true;S.needsRender=false;const gl=S.gl,cv=S.cv;
  const pixels=new Uint8Array(cv.width*cv.height*4);gl.readPixels(0,0,cv.width,cv.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let binary='';for(let i=0;i<pixels.length;i+=32768)binary+=String.fromCharCode(...pixels.subarray(i,i+32768));
  return {width:cv.width,height:cv.height,rgba:btoa(binary),png:cv.toDataURL('image/png').split(',')[1],
   clock:S.clock,view:S.view,eye:S.cam.eye.slice(),target:S.cam.tgt.slice(),quality:S.quality.name,
   enabled:!!S.detail781Enabled,loop:!!S.previewLoop781,glError:gl.getError()};
 });
 const rgba=Buffer.from(data.rgba,'base64'),png=Buffer.from(data.png,'base64');
 fs.writeFileSync(path.join(out,name+'.png'),png);
 const meta={...data};delete meta.rgba;delete meta.png;
 R.captures.push({...meta,name,png_sha256:hash(png),rgba_sha256:hash(rgba),file:name+'.png'});
 check(name+': preview is off',!data.enabled&&!data.loop,undefined,true);
 check(name+': valid deterministic canvas',data.width>100&&data.height>100&&data.glError===0,{width:data.width,height:data.height,glError:data.glError},true);
 return {...meta,rgba,png};
}
async function lifecycle(p){
 await p.waitForSelector('#detail781Button');
 check('preview control initially inactive',(await snapshot(p)).button==='false');
 // The first run starts from the same paused Day scene used in the pixel check.
 const before=await snapshot(p);
 const cameraBefore=await cameraControl(p);
 check('paused lifecycle setup agrees with Showcase controls',before.paused&&!before.playing,before,true);
 await p.locator('#detail781Button').click();
 let a=await snapshot(p);check('enter preview keeps Showcase paused and enables section',a.detail&&a.enabled&&a.loop&&a.paused&&a.button==='true',a);
 const detailControl=await cameraControl(p),offered=detailControl.options.filter(o=>!o.hidden&&!o.disabled).map(o=>o.value);
 check('released Track detail labels and four supported cameras are visible',cameraBefore.button==='Track detail'&&detailControl.button==='Leave track detail'&&detailControl.value==='chase'&&JSON.stringify(offered)===JSON.stringify(['hero','onboard','chase','heli']),{before:cameraBefore.button,after:detailControl.button,value:detailControl.value,offered});
 const tourCameras=[];
 for(const camera of ['hero','onboard','chase','heli']){
  await p.locator('#showView').selectOption(camera);
  tourCameras.push(await p.evaluate(expected=>({expected,selected:document.getElementById('showView').value,
   active:GC3D.preview781.camera,view:GC3D.S.view,stored:localStorage.getItem('gc500.showview'),
   eye:GC3D.S.cam.eye.slice(),target:GC3D.S.cam.tgt.slice(),paused:GC3D.S.paused}),camera));
 }
 check('real View control selects four distinct tour camera positions',tourCameras.every(c=>c.selected===c.expected&&c.active===c.expected&&c.view===c.expected&&c.paused&&c.eye.every(Number.isFinite)&&c.target.every(Number.isFinite))&&new Set(tourCameras.map(c=>JSON.stringify([c.eye,c.target]))).size===4,tourCameras);
 check('tour camera changes leave the saved Showcase camera untouched',tourCameras.every(c=>c.stored===cameraBefore.stored),{before:cameraBefore.stored,after:tourCameras.map(c=>({camera:c.expected,stored:c.stored}))});
 const disposal=await p.evaluate(()=>{
  const G=GC3D,S=G.S;G.render();const gl=S.gl,t=S.trackDetail781,a=S.architecture781,k=S.sky781,v=S.vegetation781;
  const refs=[['buffer',t&&t.mesh.vb],['buffer',t&&t.mesh.ib],['vao',t&&t.mesh.vao],['texture',t&&t.atlas&&t.atlas.texture],['program',t&&t.program&&t.program.p],
   ['buffer',a&&a.mesh.vb],['buffer',a&&a.mesh.ib],['vao',a&&a.mesh.vao],['program',a&&a.program.p],['program',k&&k.p],['vao',k&&k.vao],
   ['buffer',v&&v.mesh.vb],['buffer',v&&v.mesh.ib],['vao',v&&v.mesh.vao]].filter(x=>x[1]);
  G.enablePreview781(false);gl.useProgram(null);gl.bindVertexArray(null);
  const methods={buffer:'isBuffer',vao:'isVertexArray',texture:'isTexture',program:'isProgram'};
  return {allocated:refs.length,remaining:refs.filter(([kind,value])=>gl[methods[kind]](value)).map(x=>x[0]),
   fieldsCleared:!S.trackDetail781&&!S.architecture781&&!S.sky781&&!S.vegetation781,
   foliageRestored:!!v&&S.dayTrees===v.originalDayTrees&&S.trees===v.originalTrees,
   shadowMeshes:(S.detail781ShadowMeshes||[]).length,disabled:!S.detail781Enabled&&!G.preview781.enabled};
 });
 check('disable releases added GPU resources',disposal.allocated>=12&&disposal.remaining.length===0&&disposal.fieldsCleared&&disposal.foliageRestored&&disposal.shadowMeshes===0&&disposal.disabled,disposal);
 await p.locator('#detail781Button').click();a=await snapshot(p);
 check('leave preview restores paused scene and original preference',a.stored===before.stored&&a.preference===before.preference&&a.backdrop===before.backdrop&&a.paused===before.paused&&a.view===before.view&&!a.enabled&&!a.detail&&!a.loop&&a.button==='false',{before,after:a});
 const cameraAfter=await cameraControl(p);
 check('leaving detail restores the original View options, selection and label',JSON.stringify(cameraAfter)===JSON.stringify(cameraBefore),{before:cameraBefore,after:cameraAfter});
 // Resume through the actual UI, then prove leaving the preview returns to a running normal scene.
 await p.locator('#showPause').click();check('normal Showcase resumes',(await snapshot(p)).playing);
 await p.locator('#detail781Button').click();await p.locator('#detail781Button').click();a=await snapshot(p);
 check('leave running preview resets normal scene and resumes',a.playing&&a.scene&&!a.paused&&!a.loop&&!a.enabled&&a.clock<2,a);
 const clock=a.clock;await p.waitForFunction(t=>GC3D.S&&GC3D.S.clock>t+.025,clock,{timeout:60000});
 check('restored normal scene advances',true);await p.locator('#showPause').click();
 // A migrated legacy preference must retain its original stored string, not its normalised value.
 await start(p,'circuit3d_orange');await p.locator('#detail781Button').click();await p.locator('#detail781Button').click();a=await snapshot(p);
 check('legacy raw preference restored after leaving',a.stored==='circuit3d_orange'&&a.preference==='circuit3d'&&a.backdrop==='circuit3d'&&!a.enabled,a);
 // Closing from preview must preserve absence of a preference as well as an explicit value.
 await start(p,null);const absentBefore=await snapshot(p);await p.locator('#detail781Button').click();await p.locator('#showBack').click();
 await p.waitForFunction(()=>!SHOW.open&&document.getElementById('detail781Button').getAttribute('aria-pressed')==='false');a=await snapshot(p);
 check('close preview restores absent preference and disables scene',a.stored===null&&a.preference===absentBefore.preference&&!a.open&&!a.scene&&!a.enabled&&a.button==='false',a);
 await p.evaluate(()=>{showOpen();if(SHOW.playing)showPause();showClear();});await p.waitForFunction(()=>GC3D.S);a=await snapshot(p);
 check('reopening uses original default backdrop without preview',a.stored===null&&a.backdrop===absentBefore.preference&&!a.detail&&!a.loop&&!a.enabled,a);
 await start(p,'circuit3d_day');await p.locator('#detail781Button').click();await p.locator('#showBackdrop').selectOption('black');a=await snapshot(p);
 check('manual backdrop choice exits preview and keeps new preference',a.stored==='black'&&a.preference==='black'&&a.backdrop==='black'&&!a.detail&&!a.enabled&&!a.loop&&a.button==='false',a);
 await p.locator('#showBack').click();await p.waitForFunction(()=>!SHOW.open);a=await snapshot(p);
 check('close does not overwrite manually chosen backdrop',a.stored==='black'&&a.preference==='black',a);
}
async function phoneControls(c){
 const p=c.p;await start(p);const before=await cameraControl(p);
 await p.locator('#detail781Button').scrollIntoViewIfNeeded();
 const entry=await p.locator('#detail781Button').evaluate(el=>{
  const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
  return {visible:r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,
   reachable:!!hit&&(hit===el||el.contains(hit)),text:el.textContent};
 });
 check('phone Track detail entry is visible and reachable',entry.visible&&entry.reachable&&entry.text==='Track detail',entry);
 await p.locator('#detail781Button').click();
 await p.locator('#showView').scrollIntoViewIfNeeded();await p.locator('#showView').selectOption('heli');
 const current=await p.evaluate(()=>{
  const sel=document.getElementById('showView'),r=sel.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2),show=document.getElementById('showcase'),S=GC3D.S;
  return {camera:GC3D.preview781.camera,view:S.view,selected:sel.value,enabled:!!S.detail781Enabled,loop:!!S.previewLoop781,
   paused:S.paused,eye:S.cam.eye.slice(),stored:localStorage.getItem('gc500.showview'),glError:S.gl.getError(),
   controlVisible:r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,
   controlReachable:!!hit&&(hit===sel||sel.contains(hit)),viewportWidth:innerWidth,documentWidth:document.documentElement.scrollWidth,
   showcaseWidth:show.clientWidth,showcaseScrollWidth:show.scrollWidth};
 });
 check('phone View control selects the overhead Drone camera without changing saved preference',current.enabled&&current.loop&&current.paused&&current.camera==='heli'&&current.view==='heli'&&current.selected==='heli'&&current.eye.every(Number.isFinite)&&current.stored===before.stored&&current.glError===0,current);
 check('phone camera control is reachable without horizontal overflow',current.controlVisible&&current.controlReachable&&current.documentWidth<=current.viewportWidth+1&&current.showcaseScrollWidth<=current.showcaseWidth+1,current);
 const name='release-phone-track-detail.png',png=await p.screenshot({path:path.join(out,name),fullPage:false});
 R.captures.push({name:'phone track detail controls',file:name,png_sha256:hash(png),viewport:{width:390,height:844,dpr:1},camera:'heli',private:true});
 await p.locator('#detail781Button').click();const after=await cameraControl(p);
 check('phone exit restores the original camera control',JSON.stringify(after)===JSON.stringify(before),{before,after});
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 R.baseline={file:path.basename(baseline),sha256:hash(fs.readFileSync(baseline))};R.candidate={file:path.basename(candidate),sha256:hash(fs.readFileSync(candidate))};
 if(process.env.EXPECTED_SHA)check('frozen candidate SHA matches',R.candidate.sha256===process.env.EXPECTED_SHA,undefined,true);
 let base,current;
 const b=await openPage(baseline,'baseline');try{await start(b.p);base=await capture(b,'default-off-baseline');}finally{await closePage(b);}
 const c=await openPage(candidate,'candidate');try{
  await start(c.p);current=await capture(c,'default-off-candidate');
  const sameSize=base.width===current.width&&base.height===current.height;let differentPixels=0,maxChannelDifference=0;
  if(sameSize){for(let i=0;i<base.rgba.length;i+=4){let differs=false;for(let k=0;k<4;k++){const delta=Math.abs(base.rgba[i+k]-current.rgba[i+k]);if(delta)differs=true;maxChannelDifference=Math.max(maxChannelDifference,delta);}if(differs)differentPixels++;}}
  check('default-off camera and clock match baseline',base.clock===current.clock&&base.view===current.view&&JSON.stringify(base.eye)===JSON.stringify(current.eye)&&JSON.stringify(base.target)===JSON.stringify(current.target));
  check('default-off canvas has exact pixel equality with baseline',sameSize&&differentPixels===0,{sameSize,differentPixels,maxChannelDifference,pngBytesIdentical:base.png.equals(current.png)});
  await lifecycle(c.p);
 }finally{await closePage(c);}
 const phone=await openPage(candidate,'candidate-phone',{W:390,H:844,mobile:true,dpr:1,gl:true});
 try{await phoneControls(phone);}finally{await closePage(phone);}
 check('no service writes attempted',R.serviceWriteAttempts.length===0,R.serviceWriteAttempts);
 check('no page, shader or console errors',R.errors.length===0,R.errors);
 check('candidate remained frozen',hash(fs.readFileSync(candidate))===R.candidate.sha256);
 save();console.log(JSON.stringify({passed:R.checks.filter(x=>x.pass).length,total:R.checks.length,results:path.join(out,'full-page-checks.json')}));
 if(R.checks.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{R.failure=e.message;save();console.error(JSON.stringify({failure:e.message,results:path.join(out,'full-page-checks.json')}));process.exitCode=1;});
