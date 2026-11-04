/* Author: Andrew Fisher. Native crop alignment and bounded Build metadata checks. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const B=require('../build_beacon1298_src.js');
const eq=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
function snapshot(x=500,y=360){return {location:{x,y},marker:{kind:'reference',qualification:'Reference layout; individual unit position not recorded'},parts:[{kind:'building',standard:true,points:[{x:480,y:350},{x:520,y:350},{x:520,y:370}],doors:[{arcs:[[{x:480,y:350},{x:483,y:348},{x:488,y:349},{x:490,y:350}]],leaves:[[{x:480,y:350},{x:480,y:360}]],landing:[[{x:480,y:350},{x:470,y:350}]]}],chevrons:[[{x:490,y:358},{x:495,y:363}]]}]};}
test('aerial panels retain the native top-aligned crop and canonical point',()=>{
 const s=snapshot(75,120),before=JSON.stringify(s),f=B.frame(s,{naturalWidth:1000,naturalHeight:824},342,'wide');
 assert.deepEqual({left:f.left,top:f.top,width:f.width,height:f.height,view:f.view},{left:342,top:0,width:336,height:242,view:'wide'});
 eq(f.location.x,25.2);eq(f.location.y,40.32);eq(f.parts[0].points[0].x,161.28);eq(f.parts[0].points[0].y,117.6);
 eq(f.parts[0].doors[0].arcs[0][1].x,162.288);eq(f.parts[0].doors[0].leaves[0][1].y,120.96);
 eq(f.parts[0].doors[0].landing[0][1].x,157.92);eq(f.parts[0].chevrons[0][1].y,121.968);
 assert.equal(f.marker,s.marker);assert.equal(f.marker.qualification,s.marker.qualification);assert.equal(JSON.stringify(s),before);
});
test('plan overlay uses the exact native horizontal crop without moving source geometry',()=>{
 const s=snapshot(198,138),f=B.frame(s,{naturalWidth:396,naturalHeight:276},684,'plan'),scale=242/276,dx=(336-396*scale)/2;
 eq(f.location.x,168);eq(f.location.y,121);eq(f.parts[0].points[0].x,dx+480*scale);eq(f.parts[0].doors[0].arcs[0][2].y,349*scale);
 assert.deepEqual(f.parts[0].points.length,s.parts[0].points.length);assert.equal(f.parts[0].standard,true);
});
test('missing or unlocated projections never acquire a guessed location',()=>{
 const image={naturalWidth:1000,naturalHeight:824};
 assert.equal(B.frame(null,image,0,'close'),null);assert.equal(B.frame(snapshot(),null,0,'close'),null);
 const s=snapshot();s.marker.kind='unlocated';assert.equal(B.frame(s,image,0,'close'),null);
});
test('compositor carries successful native snapshots through one bounded picture result',async()=>{
 let draws=0,revoked=0,blobCalls=0;const painted=[];
 const context={save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},fillText(){},measureText(){return {width:50};},drawImage(im,...args){painted.push(args);}};
 const native=snapshot(),plan=snapshot(198,138);
 const W={Find1176:{VIEWS:[{key:'close'},{key:'wide'}],async picture(L,v){draws++;return {dataUrl:v.key,_beacon1298:native};}},BuildShapes1297:{drawingId(){return 'P1|.2,.3';}},DemobMap1236:{spot(){},async draw(id,marker,capture){draws++;capture(plan);return 'blob:plan';}}};
 class Image{set src(value){this.naturalWidth=value==='blob:plan'?396:1000;this.naturalHeight=value==='blob:plan'?276:824;Promise.resolve().then(()=>this.onload());}}
 const canvas={width:0,height:0,getContext(){return context;},toDataURL(){blobCalls++;return 'data:image/jpeg;base64,result';}};
 const D={createElement(name){assert.equal(name,'canvas');return canvas;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../build_beacon1298_src.js'),'utf8'),{window:W,document:D,Image,URL:{revokeObjectURL(){revoked++;}},console});
 const result=await W.composeMaps1261({demob1297:native.marker},'P1',()=>true);
 assert.equal(result.url,'data:image/jpeg;base64,result');assert.equal(result.frames.length,3);assert.equal(draws,3);assert.equal(blobCalls,1);assert.equal(revoked,1);
 assert.deepEqual(Array.from(result.frames,f=>f.left),[0,342,684]);eq(result.frames[0].location.y,120.96);eq(result.frames[2].location.y,121);
 eq(painted[2][0],684+(336-396*242/276)/2);eq(painted[2][1],0);assert.equal(canvas.width,0);assert.equal(canvas.height,0);
 const stale=await W.composeMaps1261({demob1297:native.marker},'P1',()=>false);assert.equal(stale,null);assert.equal(blobCalls,1);
});
test('native lifecycle bounds compound pictures and reuses matching overlays after tab reentry',async()=>{
 const {createBuildPreviewLifecycle1247}=require('../../v12.47_build_cards_LIVE/build_preview_lifecycle1247.js');
 const targets=Array.from({length:20},(_,i)=>({id:String(i)})),shown=new Map(),pictures=new Map();let active=true,drawn=0,cleared=0;
 const life=createBuildPreviewLifecycle1247({active:()=>active,connected:()=>true,inView:()=>true,cacheLimit:16,imageLimit:16,
  describe:t=>({key:t.id,eligible:true}),async draw(d){drawn++;const picture={url:'picture:'+d.key,frames:[{view:'close'},{view:'wide'},{view:'plan'}]};pictures.set(d.key,picture);return picture;},
  present(t,picture){assert.equal(picture,pictures.get(t.id));shown.set(t,picture);},clear(t){shown.delete(t);cleared++;},waiting(){},unavailable(){throw Error('Unexpected unavailable');}});
 life.track(targets);life.visibility(targets.map(t=>[t,true]));
 for(let i=0;i<30&&life.stats().drawn<16;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(drawn,16);assert.equal(shown.size,16);assert.equal(life.stats().cached,16);assert.equal(life.stats().peakActive,1);
 active=false;life.refresh();assert.equal(shown.size,0);assert.equal(cleared,16);
 active=true;life.refresh();assert.equal(shown.size,16);assert.equal(drawn,16);assert.equal(life.stats().attached,16);
 life.dispose();assert.equal(shown.size,0);assert.equal(life.stats().cached,0);
});
