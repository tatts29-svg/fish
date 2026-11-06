/* Author: Andrew Fisher. Inspection lighting ownership and transition contracts. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../workshop-lighting.js', import.meta.url));
const {installWorkshopLighting} = await import(`data:text/javascript;base64,${source.toString('base64')}`);
let checks = 0;
const check = (ok, message) => { assert.ok(ok, message); checks++; };
function fixture(options = {}) {
  const lights = Object.fromEntries([['key',5.2],['fill',1.15],['rim',3.8]].map(([role,intensity],i) => [role, {
    intensity, color: {r:1,g:.8+i*.04,b:.5+i*.1}, position:{x:i,y:5,z:2},
    target:{position:{x:0,y:0,z:0}}, castShadow: i===0,
    shadow:{mapSize:{width:2048,height:2048},camera:{left:-5,right:5,top:4,bottom:-4}}
  }]));
  const reduced = {value:false}; let changed = 0;
  const controller=installWorkshopLighting({lights,reducedMotion:()=>reduced.value,onChange:()=>changed++,...options});
  const step=(dt,inspection=true,active=true)=>controller.update(dt,{active,inspection});
  return {lights,reduced,controller,step,get changed(){return changed;}};
}
const intensities = lights => Object.values(lights).map(light=>light.intensity);
const otherState = lights => JSON.stringify(Object.fromEntries(Object.entries(lights).map(([key,{intensity,...rest}])=>[key,rest])));
const nearly = (a,b) => Math.abs(a-b)<1e-12;

{
  const f=fixture(),original=intensities(f.lights),remaining=otherState(f.lights);
  for(let i=0;i<60;i++)f.step(1/60,false,false);
  check(f.changed===0&&!f.controller.active,'Inactive workshop does not acquire lights or emit changes');
  f.step(0);check(f.controller.active&&f.controller.transitioning,'Inspection acquires current lights without an instant jump');
  check(JSON.stringify(intensities(f.lights))===JSON.stringify(original),'Zero elapsed time preserves the current picture');
  f.step(.175);const half=intensities(f.lights);
  check(half[0]<original[0]&&half[1]>original[1]&&half[2]>original[2],'Inspection reduces hot key and adds bounded fill/edge readability');
  f.step(.175);check(!f.controller.transitioning&&f.controller.diagnostics.amount===1,'Preset reaches a finite endpoint');
  const end=intensities(f.lights),count=f.changed;
  for(let i=0;i<60;i++)f.step(1/60);
  check(f.changed===count&&JSON.stringify(intensities(f.lights))===JSON.stringify(end),'A stationary preset produces no repeated writes or callbacks');
  check(otherState(f.lights)===remaining,'Colors, light positions, targets and shadow budgets stay byte-identical');
  check(end[0]>=original[0]*.9&&end[1]<=original[1]*1.25&&end[2]<=original[2]*1.05,'Preset changes remain bounded');
  f.step(.01,false,false);
  check(!f.controller.active&&JSON.stringify(intensities(f.lights))===JSON.stringify(original),'Leaving workshop restores exact original intensities immediately');
  check(otherState(f.lights)===remaining,'Restoration leaves non-intensity properties unchanged');
}
{
  const a=fixture(),b=fixture();
  for(let i=0;i<6;i++)a.step(1/30);
  for(let i=0;i<12;i++)b.step(1/60);
  check(intensities(a.lights).every((v,i)=>nearly(v,intensities(b.lights)[i])),'Equal elapsed time gives equal lighting at30 and60Hz');
  a.step(1);b.step(1);
  check(JSON.stringify(intensities(a.lights))===JSON.stringify(intensities(b.lights)),'Both frame rates finish at exactly the same endpoint');
}
{
  const f=fixture(),original=intensities(f.lights);f.step(.35);const lit=intensities(f.lights);
  f.step(.1,false);const retreat=intensities(f.lights);
  check(f.controller.transitioning&&retreat[0]>lit[0]&&retreat[1]<lit[1],'Returning to overview blends toward original lights');
  f.step(0,true);check(JSON.stringify(intensities(f.lights))===JSON.stringify(retreat),'Reversing during a transition starts at its current intensity without a jump');
  f.step(.35,true);check(JSON.stringify(intensities(f.lights))===JSON.stringify(lit),'Interrupted transition reaches intended inspection endpoint');
  f.step(.35,false);check(JSON.stringify(intensities(f.lights))===JSON.stringify(original)&&!f.controller.active,'Overview restores exact values and releases ownership');
}
{
  const f=fixture();f.reduced.value=true;f.step(0);
  check(f.controller.diagnostics.amount===1&&!f.controller.transitioning,'Reduced motion sets the inspection preset immediately');
  f.step(0,false);check(f.controller.diagnostics.amount===0&&!f.controller.active,'Reduced motion restores immediately');
  f.reduced.value=false;f.step(.1);f.reduced.value=true;f.step(0);
  check(f.controller.diagnostics.amount===1&&!f.controller.transitioning,'Changing reduced-motion preference finishes the current blend');
}
{
  const f=fixture();f.lights.key.intensity=4.6;f.step(.35);
  check(nearly(f.lights.key.intensity,4.6*.94),'Baseline is captured on entry after host setup, not at construction');
  f.lights.key.intensity=6.1;f.lights.fill.intensity=.8;f.step(0);
  check(nearly(f.lights.key.intensity,6.1*.94)&&nearly(f.lights.fill.intensity,.8*1.25),'Host intensity changes while active become the authoritative baseline');
  f.lights.rim.intensity=4.2;f.controller.restore();
  check(f.lights.key.intensity===6.1&&f.lights.fill.intensity===.8&&f.lights.rim.intensity===4.2,'Immediate restore preserves latest external edits, including a write since last update');
  f.lights.fill.intensity=0;f.step(.35);check(f.lights.fill.intensity===0,'Preset does not turn on a host-disabled light');
  f.controller.dispose();check(f.lights.fill.intensity===0&&f.lights.key.intensity===6.1,'Dispose restores latest host baseline');
  const state=JSON.stringify(f.lights),changes=f.changed;f.step(1);f.controller.dispose();
  check(JSON.stringify(f.lights)===state&&f.changed===changes,'Disposed controller is inert and cleanup is idempotent');
}
{
  const f=fixture();f.step(0);const initial=intensities(f.lights);
  for(const dt of [NaN,Infinity,-1,undefined])f.step(dt);
  check(JSON.stringify(intensities(f.lights))===JSON.stringify(initial),'Invalid or negative time never advances or poisons lighting');
  f.step(.35);f.lights.fill.intensity=NaN;f.step(0);
  check(Number.isFinite(f.lights.fill.intensity),'Invalid external intensity cannot propagate into inspection output');
  f.controller.restore();check(f.lights.fill.intensity===1.15,'Invalid external edit does not erase last valid host baseline');
}
{
  const f=fixture();f.lights.fill.intensity=NaN;f.step(.1);
  check(!f.controller.active&&f.changed===0,'Invalid light input after construction is not partially acquired');
  assert.throws(()=>installWorkshopLighting());checks++;
  assert.throws(()=>installWorkshopLighting({lights:{key:{intensity:1},fill:{intensity:2},rim:{intensity:-1}}}));checks++;
  assert.throws(()=>fixture({duration:0}));checks++;
  assert.throws(()=>fixture({onChange:null}));checks++;
}
console.log(JSON.stringify({author:'Andrew Fisher',suite:'lighting1305',passed:true,checks,additionalLights:0,additionalShadowCasters:0,additionalRenderPasses:0,physicalDevicePerformanceMeasured:false},null,2));
