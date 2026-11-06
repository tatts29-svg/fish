/* Author: Andrew Fisher. Read-only native SVG tile node/repaint probe. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('./map_native_harness.cjs');
const out=process.env.OUT||(()=>{throw Error('OUT must name a private evidence directory');})();fs.mkdirSync(out,{recursive:true});process.env.INITIAL_HASH='#map';process.env.MAP_NATIVE_LOAD_PROBE='1';
const maps=[
 {name:'satellite-assets',route:'map',sel:'#pane-map .s1141-map[data-s1141="map"] .s1141-svg',group:'g.satw',api:'SatMap1141',key:'map'},
 {name:'vms-removal',route:'vmsoff',sel:'#pane-vmsoff .v1139-svg',group:'g.satw',api:'VmsMap1139'},
 {name:'fenceclose-plan',route:'fenceclose',sel:'#pane-fenceclose .c1136-svg',group:'g.tiles',api:'ClosureMap1136',base:'plan'},
 {name:'fenceclose-satellite',route:'fenceclose',sel:'#pane-fenceclose .c1136-svg',group:'g.satw',api:'ClosureMap1136',base:'sat'}
];
(async()=>{const h=await openCandidate(),p=h.page;const results=[];try{
 for(const m of maps){
  await p.evaluate(m=>{go(m.route);if(m.name==='satellite-assets')Map1188.set('sat');},m);
  await p.locator(m.sel).waitFor({state:'visible',timeout:20000});await p.locator(m.sel).scrollIntoViewIfNeeded();
  await p.evaluate(m=>{const a=window[m.api];if(m.base)a.setBase(m.base);if(m.key)a.setZoom(m.key,2500);else a.setZoom(2500);},m);
  await p.waitForTimeout(m.base==='plan'?3500:1000);await p.waitForFunction(m=>{const a=[...document.querySelector(m.sel).querySelectorAll(m.group+' image')];return a.length&&a.every(n=>__svgLoaded.has(n));},m,{timeout:30000});
  const result=await p.evaluate(async m=>{
   const svg=document.querySelector(m.sel),g=svg.querySelector(m.group);const get=()=>[...g.querySelectorAll('image')];
   const before=get();const urls=before.map(n=>n.getAttribute('href'));const beforePins=svg.querySelectorAll('[data-id], [data-c1136-line]').length;
   const mutations=[];const observer=new MutationObserver(ms=>mutations.push(...ms.map(x=>({add:x.addedNodes.length,remove:x.removedNodes.length}))));observer.observe(g,{childList:true});
   const a=window[m.api],st=performance.now();for(let i=0;i<12;i++){if(m.key)a.setZoom(m.key,2500);else a.setZoom(2500);}
   const setterMs=performance.now()-st;await new Promise(r=>setTimeout(r,700));observer.disconnect();
   const after=get(),afterUrls=after.map(n=>n.getAttribute('href'));
   return {name:m.name,zoom:m.key?a.pct(m.key):a.pct,beforeTiles:before.length,afterTiles:after.length,identicalTileURLs:JSON.stringify(urls)===JSON.stringify(afterUrls),retainedNodes:before.filter(n=>after.includes(n)).length,removedNodes:mutations.reduce((s,m)=>s+m.remove,0),addedNodes:mutations.reduce((s,m)=>s+m.add,0),mutationCount:mutations.length,setterMs,elapsed:performance.now()-st,pinsBefore:beforePins,pinsAfter:svg.querySelectorAll('[data-id], [data-c1136-line]').length};
  },m);results.push(result);console.log(JSON.stringify(result));
  assert(result.beforeTiles>0,'Must test real loaded tiles');if(process.env.EXPECT_REUSE!=='0'){assert.equal(result.retainedNodes,result.beforeTiles,'Unchanged tile images must retain their nodes');assert.equal(result.removedNodes,0,'Unchanged view must not remove tile nodes');}assert(result.identicalTileURLs,'Same view must preserve tile source selection');assert.equal(result.pinsBefore,result.pinsAfter,'Pin/line count preserved');
  await p.screenshot({path:path.join(out,m.name+'.png')});
 }
 assert.equal(h.counts.blocked,0);assert.equal(h.errors.length,0);
 }finally{fs.writeFileSync(path.join(out,'svg-probe.json'),JSON.stringify({author:'Andrew Fisher',baseline:h.baseline,results,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts},null,2));await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
