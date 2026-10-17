// Author: Andrew Fisher. CPU ownership evidence with the candidate's actual Three.js classes.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {registerHooks} from 'node:module';
import vm from 'node:vm';

if(!process.argv[2])throw new Error('Usage: node ownership_test.mjs WORK_DIRECTORY [--expect-pass]');
const root = path.resolve(process.argv[2]);
registerHooks({resolve(specifier, context, next) {
  if (specifier === 'three') return {url:pathToFileURL(path.join(root,'vendor/three.module.js')).href,shortCircuit:true};
  return next(specifier,context);
}});
const load = name => import(pathToFileURL(path.join(root,name)).href);
const T=await load('vendor/three.module.js');
const {EffectComposer}=await load('vendor/addons/postprocessing/EffectComposer.js');
const {RenderPass}=await load('vendor/addons/postprocessing/RenderPass.js');
const {GTAOPass}=await load('vendor/addons/postprocessing/GTAOPass.js');
const {OutputPass}=await load('vendor/addons/postprocessing/OutputPass.js');
const source=fs.readFileSync(path.join(root,'car-app.js'),'utf8');
const drop=source.slice(source.indexOf('function dropComposer()'),source.indexOf('\nfunction pickQuality()'));
const resources=['gtaoNoiseTexture','pdNoiseTexture','normalRenderTarget','gtaoRenderTarget','pdRenderTarget','gtaoMaterial','normalMaterial','pdMaterial','copyMaterial','depthRenderMaterial','blendMaterial'];
const cycles=[];
for(let i=0;i<5;i++) {
  const renderer={getPixelRatio:()=>2},scene=new T.Scene(),camera=new T.PerspectiveCamera();
  const composer=new EffectComposer(renderer,new T.WebGLRenderTarget(1,1));
  composer.addPass(new RenderPass(scene,camera));
  const gtao=new GTAOPass(scene,camera,1,1);composer.addPass(gtao);
  const output=new OutputPass();composer.addPass(output);composer.setSize(300,200);
  const events={};
  const track=(name,obj)=>{events[name]=0;obj.addEventListener('dispose',()=>events[name]++);};
  for(const key of resources)track(key,gtao[key]);
  track('outputMaterial',output.material);track('composerTarget1',composer.renderTarget1);track('composerTarget2',composer.renderTarget2);
  const context=vm.createContext({composer,gtao,Set});vm.runInContext(drop+';dropComposer();dropComposer();',context);
  cycles.push({cycle:i+1,events,reset:context.composer===null&&context.gtao===null});
}
// A GTAO pass may be constructed but not yet appended when setup throws.
const detachedAo=new GTAOPass(new T.Scene(),new T.PerspectiveCamera(),1,1);
let detachedDisposed=0;detachedAo.gtaoRenderTarget.addEventListener('dispose',()=>detachedDisposed++);
const detachedContext=vm.createContext({composer:null,gtao:detachedAo,Set});vm.runInContext(drop+';dropComposer();',detachedContext);

const listener=source.match(/document\.addEventListener\('visibilitychange',\(\)=>\{(.*?)\}\);/)[1];
const reset=source.includes('function resetFrameTiming()')?source.slice(source.indexOf('function resetFrameTiming()'),source.indexOf('\nfunction frame(now)')):'';
const sample=source.slice(source.indexOf('frameCount++;if(now-fpsTime>1000)'),source.indexOf('updateCallout();updateServiceCallouts();'));
const firstFrame=source.match(/if\(!lastFrameStart\)lastFrameStart=now;/)[0];
const timing=vm.createContext({lastFrame:1800,lastRender:1800,lastFrameStart:1000,fpsTime:1000,frameCount:24,fps:30,frameEma:40,slowSince:1500,adaptAt:1000,lastUp:1000,drive:{accumulator:0.1},audio:{quiet(){}},performance:{now:()=>60100},now:60116,quality:'balanced',qualityChecked:false,lowDpr:false,applyQuality(){},toast(){}});
vm.runInContext(reset+';'+listener+';'+firstFrame+';'+sample,timing);
const report={author:'Andrew Fisher',kind:'CPU ownership and extracted real timing logic; no GPU/FPS measurement',cycles,detachedDisposed,resume:{quality:timing.quality,qualityChecked:timing.qualityChecked,fps:timing.fps,frameEma:timing.frameEma,lastRender:timing.lastRender,accumulator:timing.drive.accumulator}};
report.pass=cycles.every(c=>c.reset&&Object.values(c.events).every(n=>n===1))&&detachedDisposed===1&&timing.quality==='balanced'&&!timing.qualityChecked&&timing.frameEma===0;
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--expect-pass')&&!report.pass)process.exitCode=1;
