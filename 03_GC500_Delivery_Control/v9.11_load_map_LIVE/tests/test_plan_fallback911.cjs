// Author: Andrew Fisher. GET-only pending-load and unsupported moveBefore lifecycle checks.
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),crypto=require('crypto');
const checks=[];const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});if(!pass)console.log('FAIL '+name);};
async function run(){
 const output=process.env.EVIDENCE_DIR;if(!output||!path.isAbsolute(output))throw Error('Absolute private EVIDENCE_DIR required');fs.mkdirSync(output,{recursive:true});
 const source=fs.readFileSync(process.env.PAGE),harness=path.resolve(__dirname,'../../toolchain/harness/open_page.js');
 const original=fs.readFileSync(harness,'utf8'),hardened=original.replace(/const okPost = [^;]+;/,'const okPost = false;');if(hardened===original)throw Error('Could not harden GET-only harness');
 const strict=new Module(harness,module);strict.filename=harness;strict.paths=Module._nodeModulePaths(path.dirname(harness));strict._compile(hardened,harness);
 const s=await strict.exports.open({pageFile:process.env.PAGE,hash:'#timeline',W:1440,H:1100}),p=s.page,assets=await require('./assets911.cjs')(s);
 let gate=null,release=null,held=0;
 await p.context().route('**/explorer/index.html*',async route=>{if(gate){held++;await gate;}try{await route.fallback();}catch(_){/* superseded iframe navigation */}});
 const hold=()=>{held=0;gate=new Promise(resolve=>{release=resolve;});};
 const resume=()=>{const done=release;gate=null;release=null;if(done)done();};
 const ready=()=>p.waitForFunction(()=>Drops911.report().status==='ready'&&document.querySelector('.masterplan911-frame')?.contentWindow.GC500Explorer?.state.ready,null,{timeout:120000});
 const inspect=()=>p.evaluate(()=>{
  const r=Drops911.report(),f=document.querySelector('.masterplan911-frame'),e=f?.contentWindow.GC500Explorer,s=e?.state,c=s?.view.corners;
  return {selected:r.selected,zoom:r.zoom,actualZoom:s?s.zoom*100:null,centre:c?[c.reduce((n,p)=>n+p.x,0)/(4*2384),c.reduce((n,p)=>n+p.y,0)/(4*1684)]:null,frames:document.querySelectorAll('.masterplan911-frame').length,mode:s?.mode,selectedVisible:[...document.querySelectorAll('[data-drop911-marker]')].some(b=>b.dataset.drop911Marker===r.selected)};
 });
 try{
  await p.waitForFunction(()=>typeof Drops911!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await p.evaluate(()=>{state.day='2026-10-07';state.tlView='day';state.q='';state.disc='';state.light='';go('timeline');render();});
  const beforeRecord=await p.evaluate(()=>JSON.stringify(S));
  hold();await p.evaluate(()=>document.querySelector('[data-drop911-open]').click());
  await p.waitForFunction(()=>Drops911.report().status==='loading'&&!!document.querySelector('.masterplan911-frame'));
  const supported=await p.evaluate(()=>{const f=document.querySelector('.masterplan911-frame'),supported=typeof Element.prototype.moveBefore==='function';render();render();return {supported,same:f===document.querySelector('.masterplan911-frame'),loading:Drops911.report().status==='loading'};});
  resume();await ready();
  check('render while first plan is loading preserves its iframe when moveBefore exists',supported.supported&&supported.same&&supported.loading,supported);
  check('pending-load render resolves to one ready original plan',await p.evaluate(()=>document.querySelectorAll('.masterplan911-frame').length===1&&document.querySelector('.masterplan911-frame').contentWindow.GC500Explorer.state.mode==='original'));
  await p.evaluate(()=>Object.defineProperty(Element.prototype,'moveBefore',{value:undefined,configurable:true,writable:true}));
  await p.locator('[data-drop911-select]').first().click();await ready();
  await p.locator('[data-drop911-focus]').click();await p.locator('[data-drop911-zoom="16000"]').click();
  await p.waitForFunction(()=>Drops911.report().zoom===16000&&document.querySelector('.masterplan911-frame').contentWindow.GC500Explorer.state.sceneReady,null,{timeout:90000});
  await p.waitForTimeout(200);const before=await inspect();
  const recreated=await p.evaluate(()=>{const f=document.querySelector('.masterplan911-frame');render();return f!==document.querySelector('.masterplan911-frame');});
  await ready();await p.waitForTimeout(700);const after=await inspect();
  check('unsupported moveBefore actually recreates the iframe',recreated);
  check('fallback preserves the selected stable load ID',after.selected===before.selected&&after.selectedVisible,{before:before.selected,after:after.selected,visible:after.selectedVisible});
  check('fallback restores actual and reported 16,000% zoom',before.zoom===16000&&after.zoom===16000&&after.actualZoom===16000,{before,after});
  check('fallback restores the exact camera centre',!!after.centre&&after.centre.every((v,i)=>Math.abs(v-before.centre[i])<1e-8),{before:before.centre,after:after.centre});
  check('fallback leaves exactly one original-plan iframe',after.frames===1&&after.mode==='original',after);
  await p.locator('.drops911').screenshot({path:path.join(output,'fallback-16000.png')});
  await p.locator('[data-drop911-close]').click();
  hold();await p.evaluate(()=>document.querySelector('[data-drop911-open]').click());
  await p.waitForFunction(()=>Drops911.report().status==='loading'&&!!document.querySelector('.masterplan911-frame'));
  const pendingFallback=await p.evaluate(()=>{const f=document.querySelector('.masterplan911-frame');render();render();return {recreated:f!==document.querySelector('.masterplan911-frame'),frames:document.querySelectorAll('.masterplan911-frame').length};});
  resume();await ready();await p.waitForTimeout(200);
  check('unsupported pending-load render invalidates old iframe creation safely',pendingFallback.recreated&&pendingFallback.frames===1&&await p.locator('.masterplan911-frame').count()===1,pendingFallback);
  await p.locator('[data-drop911-close]').click();
  check('close removes every active and parked iframe',await p.locator('.masterplan911-frame').count()===0);
  check('lifecycle interactions leave every operational record unchanged',await p.evaluate(before=>JSON.stringify(S)===before,beforeRecord));
  check('existing plan assets remain verified',!assets.failures.length&&assets.assets.explorerRequests>0);
  check('no browser JavaScript errors',!s.errors.length,s.errors);
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({author:'Andrew Fisher',sha256:crypto.createHash('sha256').update(source).digest('hex'),checks,before,after,supported,pendingFallback,assets,errors:s.errors,counts:s.counts},null,2));
 }catch(error){resume();fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify({error:String(error.stack||error),checks,state:await inspect().catch(()=>null),errors:s.errors,assets},null,2));throw error;}
 finally{resume();await s.browser.close();}
 console.log(checks.filter(c=>c.pass).length+'/'+checks.length+' checks passed');if(checks.some(c=>!c.pass))process.exitCode=1;
}
run().catch(error=>{console.error(String(error.stack||error).replace(/(?:access_token|key)=[^&\s]+/g,'credential=REDACTED'));process.exitCode=1;});
