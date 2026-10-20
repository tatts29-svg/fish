/* Author: Andrew Fisher. Fail satellite requests, retain search, then recover through native Retry. */
'use strict';
const assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const h=await open({pageFile:process.env.PAGE,hash:'#map',gl:true});
 try{
  const p=h.page;
  await p.waitForFunction(()=>EXP.frame?.contentWindow?.MapExplorer1096,null,{timeout:180000});
  const f=await(await p.$('#expFrame')).contentFrame();
  await f.waitForFunction(()=>__frames.some(x=>x.vtTot&&!x.vtMiss),null,{timeout:60000});
  let failures=0;
  const mask=/https:\/\/(?:tile\.googleapis\.com|[^/]*mapbox\.com)\/.*(?:2dtiles|satellite)/;
  await p.route(mask,r=>{failures++;return r.abort('internetdisconnected');});
  await f.evaluate(()=>{cancelTiles();for(const t of tiles.values())try{t.bm?.close();}catch(_){}tiles.clear();mosaics.clear();retrySatellite();});
  await p.waitForFunction(()=>EXP.frame.contentWindow.MapExplorer1096,null,{timeout:10000});
  await f.waitForFunction(()=>[...tiles.values()].some(t=>t.err),null,{timeout:20000});
  assert(failures>0,'Fault reached actual tile requests');
  assert(await f.evaluate(()=>{document.getElementById('q').value='generator';search();return document.querySelectorAll('#results button[data-map1096]').length>0;}),'Search survives imagery failure');
  await p.unroute(mask);
  await f.evaluate(()=>retrySatellite());
  await f.waitForFunction(()=>{const x=__frames.at(-1);return x&&!x.satMiss&&!x.satBlank;},null,{timeout:60000});
  assert.equal(h.errors.length,0);assert.equal(h.counts.blocked,0);
  console.log(JSON.stringify({pass:true,injectedTileFailures:failures,searchAvailable:true,recovered:true,applicationErrors:h.errors,operationalWrites:h.counts.blocked}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
