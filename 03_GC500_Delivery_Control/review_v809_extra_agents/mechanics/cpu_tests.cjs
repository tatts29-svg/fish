// Author: Andrew Fisher. CPU-only review of the immutable ba9fff7e source.
const fs = require('fs'), path = require('path'), vm = require('vm');
const arg = key => { const i=process.argv.indexOf(key); return i>=0?process.argv[i+1]:null; };
if(!arg('--source')||!arg('--output')) throw new Error('Usage: node --experimental-vm-modules cpu_tests.cjs --source WORK --output JSON [--proposal OVERLAY]');
const root = path.resolve(arg('--source'));
const ctx = vm.createContext({console, performance, URLSearchParams, setTimeout, clearTimeout});
const modules = new Map();
const proposal = arg('--proposal')?path.resolve(arg('--proposal')):null;
function load(file) {
  if (modules.has(file)) return modules.get(file);
  const alt = proposal ? path.join(proposal,path.relative(root,file)) : null;
  const source = alt && fs.existsSync(alt) ? alt : file;
  const mod = new vm.SourceTextModule(fs.readFileSync(source, 'utf8'), {context:ctx, identifier:file});
  modules.set(file, mod);
  return mod;
}
(async () => {
 const mod = load(path.join(root, 'mech-driveline.js'));
 await mod.link((spec, from) => load(path.resolve(path.dirname(from.identifier), spec)));
 await mod.evaluate();
 const T = modules.get(path.join(root,'vendor/three.module.js')).namespace;
 function build(){
  return mod.namespace.buildDriveline(T, {}, () => new T.Group(), () => {}, () => {}, {
   cyl: (...args) => new T.CylinderGeometry(...args),
   box: (x,y,z,p=[0,0,0]) => new T.BoxGeometry(x,y,z).translate(...p)
  });
 }
 function clutchStepCount(n) {
  const d = build(); d.clutchStep(0,0); d.setClutch(true); d.clutchStep(.1,.1); d.setClutch(false);
  for(let i=1;i<=n;i++) d.clutchStep(.1+i*(2/3)/n,1/n);
  return {steps:n, crankTravel:2/3, gearboxTravel:d.clutch.angle, engaged:d.clutch.engaged};
 }
 const samples = [1,2,10,100].map(clutchStepCount);
 const first = build(); first.clutchStep(0,0);
 if (proposal) first.setClutch(true);
 first.clutchStep(.05,.1);
 if (!proposal) first.setClutch(true);
 const leak = {starting:true, crankStep:.05, firstFrameInput:first.clutch.angle, firstFrameEngaged:first.clutch.engaged};
 const source = fs.readFileSync(path.join(proposal||root,'car-app.js'),'utf8');
 const update = source.slice(source.indexOf('function updateTransforms()'),source.indexOf('function visibleBounds'));
 const out = {author:'Andrew Fisher',sourceCommit:'ba9fff7ec48d3d49d037f461c145b1abd6f2c957',source:root, proposal, takeUp:samples, firstStarterFrame:leak,
  sourceCallsAnimateBeforeSetStarter:update.indexOf('engine.animate(')<update.indexOf('engine.setStarter(')};
 if(proposal){
  const assert=require('assert/strict');
  assert(samples.every(s=>Math.abs(s.gearboxTravel-1/3)<1e-12),'take-up is independent of step size');
  assert.equal(first.clutch.angle,0,'first starting step does not turn gearbox input');
  assert(!out.sourceCallsAnimateBeforeSetStarter,'current starting state is applied before animation');
  for (const [travel,expected] of [[2,5/3],[-2,-5/3]]) {
   const d=build(); d.clutchStep(0,0); d.setClutch(true); d.clutchStep(0,0); d.setClutch(false); d.clutchStep(travel,1);
   assert(Math.abs(d.clutch.angle-expected)<1e-12,'clamped remainder and direction are preserved');
  }
  const near = (a,b,label) => assert(Math.abs(a-b)<1e-11,label+': '+a+' vs '+b);
  const repeated=build(); let crank=0, total=0;
  repeated.clutchStep(0,0);
  for(let cycle=0;cycle<4;cycle++){
   repeated.setClutch(true); crank+=.07; repeated.clutchStep(crank,.1); near(repeated.clutch.angle,total,'restart holds input');
   repeated.setClutch(false); repeated.clutchStep(crank,0); near(repeated.clutch.angle,total,'zero travel does not engage');
   crank+=.2; repeated.clutchStep(crank,.1); total+=.03; near(repeated.clutch.angle,total,'partial release');
   crank+=.6; repeated.clutchStep(crank,.1); total+=.8-1/3-.03; near(repeated.clutch.angle,total,'catch through full clamp');
   for(let i=0;i<3;i++) repeated.clutchStep(crank,.1);
   near(repeated.clutch.angle,total,'stopped crank stays still');
  }
  function reverse(n){
   const d=build();d.clutchStep(0,0);d.setClutch(true);d.clutchStep(0,0);d.setClutch(false);
   for(let i=1;i<=n;i++)d.clutchStep(.2*i/n,.1/n);
   for(let i=1;i<=n;i++)d.clutchStep(.2-.2*i/n,.1/n);
   return d.clutch.angle;
  }
  near(reverse(1),-.06,'reversal during partial engagement');near(reverse(50),-.06,'partitioned reversal');
  const cross=build(); cross.clutchStep(0,0);cross.setClutch(true);cross.clutchStep(0,0);cross.setClutch(false);
  cross.clutchStep(.6,.1);const before=cross.clutch.angle;cross.clutchStep(.8,.1);
  near(cross.clutch.angle-before,.19666666666666666,'one substep crosses clamp');
  out.extended={restartCycles:4,stoppedSamples:12,reversal:[reverse(1),reverse(50)],crossingClamp:cross.clutch.angle-before};
  out.result='PASS';
 }
 console.log(JSON.stringify(out,null,2));
 fs.mkdirSync(path.dirname(path.resolve(arg('--output'))),{recursive:true});
 fs.writeFileSync(arg('--output'),JSON.stringify(out,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
