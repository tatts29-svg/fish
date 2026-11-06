/* Author: Andrew Fisher. Exercise the built viewer's actual surface-sampling function. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(process.argv[2],'Pass the built poc3d/index.html');
const html=fs.readFileSync(process.argv[2],'utf8'),match=html.match(/async function heightBatch\(\) \{[\s\S]*?\n\}\nfunction ringAt/);
assert(match,'heightBatch function boundary');
const source=match[0].slice(0,match[0].lastIndexOf('\nfunction ringAt'));
function fixture(){
 const model={model:true},selection={selection:true},bb={billboards:true},lb={labels:true};
 const p={k:'WC49',ll:[-27.993812,153.430597]},pin={_gc:p,b:{show:false,position:{x:0,y:0,z:44.6}},l:{show:true}};
 Object.defineProperty(pin,'show',{get:()=>pin.b.show});
 const c={HQ:{busy:false},ADAPT:{moving:false},SITE_H:44.6,pinBB:bb,pinLB:lb,pinEntities:[pin],RING:null,ringPin:null,calls:[],window:{GC500EquipmentView1027:{exclude:()=>[model,selection]}},Cesium:{Cartesian3:{distance:()=>40},Cartographic:{fromDegrees:(lon,lat)=>({lon,lat})}},pinPos:p=>({lon:p.ll[1],lat:p.ll[0],height:p._h??44.6}),scheduleHeights(){},ringAt(){},viewer:{camera:{positionWC:{}},scene:{sampleHeightSupported:true,requestRender(){},async sampleHeightMostDetailed(points,exclude){c.calls.push({points,exclude});return [{height:49.25}];}}}};
 vm.createContext(c);vm.runInContext(source,c);return {c,p,pin,model,selection,bb,lb};
}
(async()=>{
 let f=fixture();await f.c.heightBatch();assert.equal(f.c.calls.length,1,'Visible model is sampled even with billboard hidden');assert.equal(f.p._h,49.25);assert.equal(f.pin.l.position.height,49.25);console.log('PASS hidden billboard does not suppress model surface sampling');
 for(const ref of [f.model,f.selection,f.bb,f.lb])assert(f.c.calls[0].exclude.includes(ref));console.log('PASS sampling excludes models, highlights and both pin collections');
 f=fixture();f.pin.l.show=false;await f.c.heightBatch();assert.equal(f.c.calls.length,0);console.log('PASS filtered-out labels do not trigger invisible surface requests');
 f=fixture();f.pin.l.show=false;f.c.window.GC500EquipmentView1027.samplingVisible=ref=>ref==='WC49';await f.c.heightBatch();assert.equal(f.c.calls.length,1);assert.equal(f.p._h,49.25);console.log('PASS decluttered label does not prevent its visible model from reaching the surface');
 f=fixture();f.c.ADAPT.moving=true;await f.c.heightBatch();assert.equal(f.c.calls.length,0);console.log('PASS moving view defers height sampling');
 f=fixture();f.p._h=49.25;f.p._hd=35;await f.c.heightBatch();assert.equal(f.c.calls.length,0);console.log('PASS stable cached height is not redundantly resampled');
 console.log('6/6 PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
