/* Author: Andrew Fisher. Read-only real-map camera interruption regression. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {spawnSync} = require('node:child_process');
const {open} = require('../../toolchain/harness/open_page');

const source = process.env.EXPLORER_SOURCE;
assert(source, 'Set EXPLORER_SOURCE to the verified v10.64 explorer.js');
const original = fs.readFileSync(source, 'utf8');
const transform = spawnSync('python3', ['-c', 'import sys;sys.path.insert(0,sys.argv[1]);from patch_camera1065 import apply;print(apply(sys.stdin.read()),end="")', __dirname], {input:original,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
assert.equal(transform.status, 0, transform.stderr);
const patched = transform.stdout;
const start = patched.indexOf('function zoomBy('), end = patched.indexOf('/* the view the glide', start);
assert(start >= 0 && end > start);
const replacement = patched.slice(start, end);
const report = {author:'Andrew Fisher',checks:[],method:'Original live map functions, then the exact transformed zoomBy installed in the same read-only browser frame',recordWrites:0};
const check = (name, condition, detail={}) => { assert(condition, name); report.checks.push({name,...detail}); };

(async()=>{
 let s;
 try {
  s=await open({pageFile:process.env.PAGE,hash:'#map',gl:false});
  const p=s.page;
  await p.waitForFunction(()=>typeof go==='function'); await p.evaluate(()=>go('map'));
  await p.waitForSelector('#expFrame'); const f=await (await p.$('#expFrame')).contentFrame();
  await f.waitForFunction(()=>window.__ready && typeof zoomBy==='function' && typeof gotoAnim887!=='undefined',null,{timeout:120000});
  const originalRepro=await f.evaluate(async()=>{
   document.documentElement.removeAttribute('data-motion');
   window.parent.document.documentElement.removeAttribute('data-motion');
   fit(true,false); await GC500Explorer.find('P33');
   const flying=!!gotoAnim887;zoomBy(1.5);
   const result={flying,gotoActive:!!gotoAnim887,zoomActive:!!zAnim};stopCameraMotion813();return result;
  });
  check('Original reference flight and manual zoom compete',originalRepro.flying&&originalRepro.gotoActive&&originalRepro.zoomActive,originalRepro);
  await f.evaluate(code=>{(0,eval)('zoomBy = '+code);},replacement);
  const fixed=await f.evaluate(async()=>{
   fit(true,false);await GC500Explorer.find('P33');const flying=!!gotoAnim887;
   zoomBy(1.5);const first=zGoal, firstId=zAnim;zoomBy(1.5);
   return {flying,gotoActive:!!gotoAnim887,zoomActive:!!zAnim,first,second:zGoal,sameZoomLoop:firstId===zAnim,expected:clamp(first*1.5,MIN_Z,MAX_Z),selected:!!selected};
  });
  check('Manual zoom cancels the reference flight immediately',fixed.flying&&!fixed.gotoActive&&fixed.zoomActive);
  check('Repeated wheel goals accumulate on the same zoom loop',fixed.sameZoomLoop&&Math.abs(fixed.second-fixed.expected)<1e-9);
  check('Manual zoom retains the selected reference',fixed.selected);
  await f.waitForFunction(()=>!zAnim&&!gotoAnim887,null,{timeout:10000});
  const landing=await f.evaluate(()=>({z:camera.z,rotActive:!!rotAnim}));
  check('Manual zoom lands at the accumulated requested zoom',Math.abs(landing.z-fixed.expected)<1e-9);
  const rotation=await f.evaluate(async()=>{
   fit(true,false);await GC500Explorer.find('P33');rotateTo(camera.rot+30);
   const turn={gotoActive:!!gotoAnim887,rotActive:!!rotAnim};zoomBy(1.25);
   const zoom={gotoActive:!!gotoAnim887,rotActive:!!rotAnim,zoomActive:!!zAnim};stopCameraMotion813();return{turn,zoom};
  });
  check('Rotation already cancels an existing reference flight',!rotation.turn.gotoActive&&rotation.turn.rotActive);
  check('Manual zoom also cancels rotation',!rotation.zoom.gotoActive&&!rotation.zoom.rotActive&&rotation.zoom.zoomActive);
  const instant=await f.evaluate(async()=>{
   fit(true,false);await GC500Explorer.find('P33');const flying=!!gotoAnim887;
   document.documentElement.setAttribute('data-motion','off');const before=camera.z;zoomBy(1.25);
   const result={flying,gotoActive:!!gotoAnim887,zoomActive:!!zAnim,z:camera.z,expected:clamp(before*1.25,MIN_Z,MAX_Z)};
   document.documentElement.removeAttribute('data-motion');stopCameraMotion813();return result;
  });
  check('Reduced-motion zoom also cancels a flight and lands immediately',instant.flying&&!instant.gotoActive&&!instant.zoomActive&&Math.abs(instant.z-instant.expected)<1e-9);
  check('No browser page errors',s.errors.length===0,{count:s.errors.length});
  report.blockedWrites=s.counts.blocked;report.passed=report.checks.length;console.log(JSON.stringify(report,null,2));
  if(process.env.REPORT)fs.writeFileSync(process.env.REPORT,JSON.stringify(report,null,2)+'\n');
 }finally{if(s)await s.browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
