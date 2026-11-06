/* Author: Andrew Fisher. Execute the real source functions with inert I/O. No network or record writes. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict'), crypto = require('crypto');
const root = process.env.CANDIDATE;
if (!root) throw new Error('CANDIDATE is required');
const src = fs.readFileSync(path.join(root, 'explorer/explorer.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'explorer/index.html'), 'utf8');
let passed = 0; const check = (name, f) => { f(); passed++; };
function part(start, end) {
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 assert(a>=0&&b>a, 'exact native function markers');
 assert.equal(src.indexOf(start,a+start.length),-1,'unique native function marker');
 return src.slice(a,b);
}
const keyOnce=part('async function keyOnce()', 'function alignmentPanel()');
const ensureKey=part('function ensureKey()', 'async function keyOnce()');
const coarse=part('function requestCoarse(', 'function drawTiles(');
const zoom=part('function tileZoomFor(', 'function tileKey(');
const retry=part('function retrySatellite()', '/* the picture the tiles are laid on:');
const prefetch=part('function prefetchView(', 'let probeF = null');
function context(extra={}) {
 const ctx={Promise,Map,Set,Math,performance:{now:()=>1000},clearTimeout(){},...extra};vm.createContext(ctx);return ctx;
}
function keyContext(response) {
 const ctx=context({config:response,requests:[],prefetches:0,paints:0,messages:[],mapKey:null,gKey:null,keyState:'unknown',keyPromise:null,ready:true,zAnim:0,interacting:false,PRE:{}});
 vm.runInContext(`
 const once=(k,f)=>PRE[k]||(PRE[k]=f());
 const fetch=async url=>{requests.push(url);return {json:async()=>config}};
 const hostedToken=()=>'?t=public-test';
 const prefetchView=()=>{prefetches++}; const currentView=()=>({});
 const requestPaint=()=>{paints++};const toast=x=>messages.push(x);
 ${ensureKey}\n${keyOnce}`,ctx);
 return ctx;
}
(async()=>{
 check('no Google2D session or tile request remains',()=>{
  assert(!src.includes('v1/createSession'));assert(!src.includes('v1/2dtiles'));assert(!src.includes('ensureGoogle'));
  assert(src.includes("const SOURCE = 'mapbox';"));
 });
 const good=keyContext({token:'pk.fixture',google:{key:'AIza-fixture'}});
 const pair=await vm.runInContext('Promise.all([ensureKey(),ensureKey()])',good);
 check('concurrent callers share one configuration request',()=>{assert.equal(good.requests.length,1);assert(pair.every(x=>x==='pk.fixture'));});
 check('Mapbox starts immediately even when Google configuration exists',()=>{assert.equal(good.mapKey,'pk.fixture');assert.equal(good.keyState,'ok');assert.equal(good.prefetches,1);assert.equal(good.gKey,'AIza-fixture');});
 await vm.runInContext('ensureKey()',good);
 check('warm access reuses its key without another request',()=>assert.equal(good.requests.length,1));
 const absent=keyContext({google:{key:'AIza-fixture'}});
 assert.equal(await vm.runInContext('ensureKey()',absent),null);
 check('missing Mapbox access reports unavailable without switching imagery',()=>{assert.equal(absent.keyState,'none');assert.equal(absent.prefetches,0);assert.equal(absent.requests.length,1);assert.equal(absent.messages.length,1);});
 const failed=keyContext(null);assert.equal(await vm.runInContext('ensureKey()',failed),null);
 check('empty service response fails visibly',()=>{assert.equal(failed.keyState,'none');assert.equal(failed.paints,1);});
 const c=context({tiles:new Map(),satWanted:new Set(),requests:[]});
 vm.runInContext(`const tileKey=(z,x,y)=>z+'/'+x+'/'+y;
 const satRange=(R,z,x,y,x1,y1)=>x===0?{tx0:0,tx1:1,ty0:0,ty1:1}:{tx0:-1,tx1:2,ty0:-1,ty1:2};
 const requestTile=(z,x,y,prio)=>requests.push({z,x,y,prio});
 ${coarse}`,c);
 vm.runInContext('requestCoarse({x:0,y:0,w:100,h:100},{},18)',c);
 check('cold cover gets four priorities while detail keeps four download slots',()=>{assert.equal(c.requests.filter(x=>x.prio<0).length,4);assert(c.requests.filter(x=>x.prio<0).every(x=>x.z===16&&x.x>=0&&x.x<=1&&x.y>=0&&x.y<=1));});
 c.requests.length=0;c.tiles.set('18/40/40',{bm:{},at:0});
 vm.runInContext('requestCoarse({x:0,y:0,w:100,h:100},{},18)',c);
 check('warm view keeps high detail ahead of new coarse requests',()=>assert(c.requests.every(x=>x.prio>=500)));
 c.requests.length=0;c.tiles.clear();vm.runInContext('requestCoarse({x:0,y:0,w:100,h:100},{},18,8)',c);
 check('coarse requests still obey the existing cache budget',()=>assert.equal(c.requests.length,0));
 const p=context({events:[],mode:'satellite',ready:true,vtGoal:new Set(),goalWanted:new Set(),TILE_CAP:90});
 vm.runInContext(`const under3d=()=>false,satCanFetch=()=>true,regionsForTiles=()=>[{}];
 const satelliteView1018=()=>({z:18,range:{tx0:0,tx1:0,ty0:0,ty1:0},cells:[[0,0]]});
 const requestCoarse=()=>events.push('coarse'),requestTile=()=>events.push('sharp'),pumpVT=()=>{},pumpSoon=()=>{};
 ${prefetch}\nprefetchView({});`,p);
 check('initial prefetch queues usable coverage before sharp requests',()=>assert.deepEqual(Array.from(p.events),['coarse','sharp']));
 const z=context({dpr:2,interacting:false,zAnim:0,satZHeld:new Map()});
 vm.runInContext(`const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); const tileMaxZ=()=>19; ${zoom}`,z);
 z.scale=Math.pow(2,.15);
 const atRest=vm.runInContext('tileZoomFor({scale},[[2,0],[0,2]])',z);
 check('rest density is never under-sampled before the native limit',()=>assert.equal(atRest.z,19));
 z.interacting=true;const moving=vm.runInContext('tileZoomFor({scale},[[2,0],[0,2]])',z);
 check('motion retains its existing lightweight sampling band',()=>assert.equal(moving.z,18));
 z.interacting=false;z.scale=8;const enlarged=vm.runInContext('tileZoomFor({scale},[[2,0],[0,2]])',z);
 check('native source limit stays honest on overzoom',()=>{assert.equal(enlarged.z,19);assert.equal(enlarged.over,true);});
 const re=context({tiles:new Map([['ready',{bm:{}}],['error',{bm:null}]]),tileTries:new Map([['error',1]]),retryTimer:0,satWhy:'failure',keyState:'ok',mapKey:'pk.fixture',satState:'down',cancelled:0,painted:0});
 vm.runInContext(`const cancelTiles=()=>{cancelled++},setSatState=()=>{},changeView=()=>{painted++}; ${retry}\nretrySatellite();`,re);
 check('retry preserves ready pixels and clears failed requests',()=>{assert(re.tiles.has('ready'));assert(!re.tiles.has('error'));assert.equal(re.tileTries.size,0);assert.equal(re.cancelled,1);assert.equal(re.painted,1);});
 check('native tile quality, cache budgets and honest capture label retained',()=>{assert(src.includes('@2x.jpg90'));assert(src.includes('TILE_CAP = PHONE ? 90 : 200'));assert(src.includes('mosaicBudget=PHONE?96:256'));assert(html.includes('Capture date: not stated by the provider.'));});
 check('cache identities match both current child scripts',()=>{
  for(const filename of ['explorer.js','explorer-merge.js']){
   const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'explorer',filename))).digest('hex');
   assert(html.includes(filename+'?v='+digest.slice(0,12)), filename+' cache query');
  }
 });
 console.log(JSON.stringify({author:'Andrew Fisher',passed,networkRequests:0,recordWrites:0}));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
