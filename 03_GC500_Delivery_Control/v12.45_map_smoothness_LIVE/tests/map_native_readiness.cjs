/* Author: Andrew Fisher. Native delayed tile continuity, including return to a completed coarse anchor. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {openCandidate}=require('./map_native_harness.cjs');
const out=process.env.OUT;assert(out,'OUT must name a private evidence directory');fs.mkdirSync(out,{recursive:true});
const closure=process.env.MAP_KIND==='closure';
const spec=closure?{route:'fenceclose',selector:'#pane-fenceclose .c1136-svg',group:'g.tiles',pattern:'**/explorer/assets/vt/**'}:{route:'map',selector:'#pane-map .s1141-map[data-s1141="map"] .s1141-svg',group:'g.satw',pattern:'https://server.arcgisonline.com/**'};
process.env.INITIAL_HASH='#'+spec.route;process.env.MAP_NATIVE_LOAD_PROBE='1';
const verify=process.env.EXPECT_REUSE!=='0';
(async()=>{
 const h=await openCandidate(),p=h.page;let hold=false,release=()=>{},waiting;const held=[];let result={},active=0,lastTileRequest=0;
 const arm=()=>{waiting=new Promise(r=>release=r);hold=true;};
 const zoom=percent=>p.evaluate(({percent,closure})=>{if(closure)ClosureMap1136.setZoom(percent);else SatMap1141.setZoom('map',percent);},{percent,closure});
 const networkSettled=async()=>{await p.waitForTimeout(250);const until=Date.now()+30000;while(active||Date.now()-lastTileRequest<350){assert(Date.now()<until,'Tile requests must settle');await p.waitForTimeout(100);}};
 const loaded=()=>p.waitForFunction(spec=>{const a=[...document.querySelector(spec.selector).querySelectorAll(spec.group+' image')];return a.length&&a.every(n=>__svgLoaded.has(n));},spec,{timeout:30000});
 try{
  await p.context().route(spec.pattern,async route=>{active++;lastTileRequest=Date.now();try{if(hold&&route.request().method()==='GET'){held.push(new URL(route.request().url()).pathname);await waiting;}await route.fallback();}finally{active--;lastTileRequest=Date.now();}});
  await p.evaluate(({route,closure})=>{go(route);if(closure)ClosureMap1136.setBase('plan');else Map1188.set('sat');},{...spec,closure});
  await p.locator(spec.selector).waitFor({state:'visible',timeout:30000});await p.locator(spec.selector).scrollIntoViewIfNeeded();
  await zoom(100);await networkSettled();await loaded();
  const coarse=await p.evaluate(spec=>{const all=[...document.querySelector(spec.selector).querySelectorAll(spec.group+' image')],span=Math.max(...all.map(n=>+n.getAttribute('width')));window.__coarseTiles=all.filter(n=>+n.getAttribute('width')===span);window.__coarsePaths=__coarseTiles.map(n=>{try{return new URL(n.getAttribute('href'),location.href).pathname;}catch(e){return '';}});window.__coarseCovers=()=>{const r=document.querySelector(spec.selector).getBoundingClientRect();return[.01,.5,.99].every(fx=>[.01,.5,.99].every(fy=>__coarseTiles.some(n=>{if(!n.isConnected)return false;const m=n.getScreenCTM();if(!m)return false;const q=new DOMPoint(r.left+r.width*fx,r.top+r.height*fy).matrixTransform(m.inverse()),x=+n.getAttribute('x'),y=+n.getAttribute('y'),w=+n.getAttribute('width'),h=+n.getAttribute('height');return q.x>=x&&q.x<=x+w&&q.y>=y&&q.y<=y+h;})));};return{tiles:__coarseTiles.length,loaded:__coarseTiles.filter(n=>__svgLoaded.has(n)).length,span};},spec);
  if(!closure){await zoom(300);await networkSettled();await loaded();}
  const before=await p.evaluate(spec=>{window.__oldSvgTiles=[...document.querySelector(spec.selector).querySelectorAll(spec.group+' image')];return{tiles:__oldSvgTiles.length,loaded:__oldSvgTiles.filter(n=>__svgLoaded.has(n)).length};},spec);
  arm();await zoom(2500);await p.waitForTimeout(700);
  const during=await p.evaluate(spec=>{const a=[...document.querySelector(spec.selector).querySelectorAll(spec.group+' image')];return{oldConnected:__oldSvgTiles.filter(n=>n.isConnected).length,currentTiles:a.length,currentLoaded:a.filter(n=>__svgLoaded.has(n)).length,coarseConnected:__coarseTiles.filter(n=>n.isConnected).length};},spec);
  result={coarse,before,during,heldTileRequests:held.length};
  assert(held.length>0,'Replacement responses must actually be delayed');assert.equal(before.loaded,before.tiles,'Initial imagery must finish loading');
  if(verify){assert.equal(during.oldConnected,before.tiles,'Pending replacement must retain loaded imagery');assert.equal(during.coarseConnected,coarse.tiles,'Completed coarse anchor must remain');}
  await p.screenshot({path:path.join(out,'held-new-level.png')});hold=false;release();await networkSettled();await loaded();await p.waitForTimeout(200);
  const after=await p.evaluate(spec=>{const a=[...document.querySelector(spec.selector).querySelectorAll(spec.group+' image')];return{tiles:a.length,loaded:a.filter(n=>__svgLoaded.has(n)).length,coarseConnected:__coarseTiles.filter(n=>n.isConnected).length};},spec);
  const heldBefore=held.length;arm();await zoom(100);await p.waitForTimeout(700);
  const reverse=await p.evaluate(spec=>{const a=[...document.querySelector(spec.selector).querySelectorAll(spec.group+' image')];return{tiles:a.length,loaded:a.filter(n=>__svgLoaded.has(n)).length,coarseConnected:__coarseTiles.filter(n=>n.isConnected).length,coarseCoversViewport:__coarseCovers()};},spec);reverse.heldRequests=held.length-heldBefore;const anchorPaths=await p.evaluate(()=>__coarsePaths);reverse.anchorRefetches=held.slice(heldBefore).filter(u=>anchorPaths.includes(u)).length;
  result={...result,after,reverse};
  if(verify){assert.equal(after.loaded,after.tiles);assert.equal(after.coarseConnected,coarse.tiles);assert.equal(reverse.coarseConnected,coarse.tiles);assert.equal(reverse.anchorRefetches,0,'Returning to the loaded anchor must not refetch its tiles');assert(reverse.coarseCoversViewport,'Retained coarse imagery must cover sampled viewport points');assert(reverse.loaded>=coarse.tiles);}
  await p.screenshot({path:path.join(out,'return-coarse.png')});hold=false;release();assert.equal(h.counts.blocked,0);assert.equal(h.errors.length,0);assert.equal(h.consoleErrors.length,0);console.log(JSON.stringify(result));
 }finally{hold=false;release();fs.writeFileSync(path.join(out,'readiness-probe.json'),JSON.stringify({author:'Andrew Fisher',baseline:h.baseline,kind:closure?'closure-plan':'satellite-assets',...result,errors:h.errors,consoleErrors:h.consoleErrors,counts:h.counts},null,2));await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
