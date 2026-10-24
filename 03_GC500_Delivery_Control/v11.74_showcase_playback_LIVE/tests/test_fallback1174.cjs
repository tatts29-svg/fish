/* Author: Andrew Fisher. Slow-device fallback preserves preference and rejects stale/lifecycle requests. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'../quick1174_src.js'),'utf8');
function rig(storageWorks=true){
 const values=new Map([['gc500.showback','circuit3d_day']]);let back='circuit3d_day',stops=0,created=false;
 const button={hidden:true,addEventListener:(event,fn)=>button.click=fn},lab={insertAdjacentElement:()=>{created=true}},scene={paused:false};
 const SHOW={open:true,playing:true},GC3D={S:scene,noGuard:false,mount:()=>''};
 const document={hidden:false,querySelector:()=>lab,getElementById:id=>id==='showcase'?{getAttribute:()=>back}:id==='show3d1143'&&created?button:null,createElement:()=>button};
 const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>{if(!storageWorks)throw Error('Storage unavailable');values.set(k,v)}};
 const root={GC3D,showBackPref:()=>values.get('gc500.showback'),showApplyBack:()=>back=root.showBackPref(),showSetBack:v=>{values.set('gc500.showback',v);root.showApplyBack()},showClose:()=>{SHOW.open=false},show3dSyncInner:()=>{if(!/^circuit3d/.test(back)){GC3D.S=null;stops++;}},showRender:()=>{}};
 vm.runInNewContext(source,{window:root,GC3D,SHOW,document,localStorage,performance:{now:()=>0},showRender:()=>{},show3dSyncInner:root.show3dSyncInner});
 return {root,GC3D,scene,SHOW,document,values,button,back:()=>back,stops:()=>stops};
}
for(const storage of [true,false]){
 const r=rig(storage),api=r.root.ShowcaseQuick1143;
 assert.equal(api.fallback({},5000),false);r.scene.paused=true;assert.equal(api.fallback(r.scene,5000),false);r.scene.paused=false;
 r.document.hidden=true;assert.equal(api.fallback(r.scene,5000),false);r.document.hidden=false;
 r.GC3D.noGuard=true;assert.equal(api.fallback(r.scene,5000),false);r.GC3D.noGuard=false;
 assert.equal(api.fallback(r.scene,5000),true);assert.equal(r.back(),'circuit');assert.equal(r.stops(),1);assert.equal(r.values.get('gc500.showback'),'circuit3d_day');assert(!r.button.hidden);assert.equal(r.button.textContent,'Try 3D circuit');
 r.button.click();assert.equal(r.back(),'circuit3d_day');assert(r.button.hidden);
 r.root.showClose();r.SHOW.open=true;r.root.showApplyBack();assert.equal(r.back(),'circuit');
 r.root.showSetBack('black');assert.equal(r.back(),'black');assert.equal(r.values.get('gc500.showback'),'black');
}
console.log('PASS measured fallback, exact Day preference, retry/reopen, non-3D choice, manual/hidden/pause/stale guards and unavailable local storage');
