// Author: Andrew Fisher. Network-free completion and canvas behaviour against the real Timeline projection.
const assert = require('assert/strict'), fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = path.resolve(__dirname, '..'), read = p => fs.readFileSync(p, 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS', name); }
const plain = value => JSON.parse(JSON.stringify(value));
const timeline = read(path.join(DIR, '../v8.41_timeline_fencing_clarity_LIVE/timeline841_src.js')).split('function timeline841Proof(')[0];
const assets = [
  {key:'P12', delivery:{done:true}},
  {key:'P45', delivery:{recorded:true,state:'not on site'}},
  {key:'ONSITE', delivery:{recorded:true,state:'on site'}},
  {key:'INSTALLED', delivery:{recorded:true,state:'on site'}, proof:{stage:4, at:'2026-10-07T00:00:00Z',by:'Test'}},
  {key:'WC31', delivery:{done:true, recorded:true,state:'on site'}, conflict:['Test quantity short']},
  {key:'MOVED', delivery:{done:true,moved:true}},
  {key:'CANCELLED', _cancelled:true,delivery:{done:true}},
  {key:'BADSTAGE', delivery:{done:true}, override:{stage:4}},
  {key:'BLOCKED', delivery:{done:true}, override:{stage:5,blocked:true}},
  {key:'CONFLICT', delivery:{done:true}, override:{stage:5,conflict:true}},
  {key:'ERROR', delivery:{done:true}, throws:true}
];
const host = {allAssets:()=>assets, assetOf:k=>assets.find(a=>a.key===k), deliveryOf:k=>assets.find(a=>a.key===k)?.delivery,
  finderRow:it=>`<div class="fi"><b>${it.key}</b><span class="fik">Asset</span></div>`};
host.window=host; vm.createContext(host); vm.runInContext(timeline,host);
host.timeline841State = a => { if(a.throws) throw Error('unavailable'); return a.override || host.timeline841Project({asset:a,delivery:a.delivery,proof:a.proof,conflict:a.conflict}); };
vm.runInContext(read(path.join(DIR,'source/map897.js')),host);
test('Complete requires the record tick and the actual Timeline Finished reading',()=>assert.deepEqual(plain(host.gc500CompleteKeys897()),['P12']));
for(const a of assets) test(`${a.key}: ${a.key==='P12'?'verified':'no completion claim'}`,()=>assert.equal(host.gc500IsComplete897(a.key),a.key==='P12'));
test('Unknown reference is incomplete',()=>assert.equal(host.gc500IsComplete897('missing'),false));
test('Finder retains content and shows one complete pill only on asset result',()=>{
  const row = host.finderRow({kind:'asset',key:'P12'});
  assert.equal((row.match(/class="fik ok897"/g)||[]).length,1); assert.match(row,/<b>P12<\/b>/); assert.match(row,/>Asset<\/span>/);
  assert.doesNotMatch(host.finderRow({kind:'label',key:'P12'}),/ok897/); assert.doesNotMatch(host.finderRow({kind:'asset',key:'WC31'}),/ok897/);
});
test('Host API fails closed if the registry read fails',()=>{const keep=host.allAssets;host.allAssets=()=>{throw Error('offline');};assert.equal(host.gc500CompleteKeys897(),null);host.allAssets=keep;});

const complete={code:'P12',cat:{host:'trade',c:'#f6a'},places:[[0,0,10,10]]}, open={code:'P45',cat:{host:'trade',c:'#f6a'},places:[[20,20,30,30]]};
const layer={code:'P12',cat:{host:'layer'},places:[[0,0,1,1]]};
let current=['P12'], paints=0, refreshes=0, cardShown=false;
const explorer={window:{parent:{gc500CompleteKeys897:()=>current}},document:{createElement:()=>({}),head:{appendChild(){}},querySelectorAll:()=>[]},
  norm:s=>s.trim().toUpperCase(),ITEMS:[complete,open],marks:[],DONE782_ON:false,DONE782:new Set(),dpr:1,
  requestPaint:()=>paints++, $:()=>cardShown?{hidden:false}:null};
explorer.window.GC500ExplorerRefreshCard897=()=>refreshes++;
vm.createContext(explorer);vm.runInContext(read(path.join(DIR,'source/explorer897_src.js')),explorer);
const api=explorer.window.GC500Explorer897;
test('Explorer reads only the authoritative verified set',()=>{api.pull();assert.deepEqual(plain(api.keys()),['P12']);assert.equal(explorer.isComplete897(complete),true);assert.equal(explorer.isComplete897(open),false);assert.equal(explorer.isComplete897(layer),false);});
test('Empty selection draws no global completion ticks',()=>assert.deepEqual(plain(api.state.ticked),[]));
test('Category selection keeps all results and ticks only its completed members',()=>{explorer.marks=[{it:complete},{it:open}];assert.deepEqual(plain(api.state.ticked),['P12']);assert.equal(explorer.marks.length,2);});
test('Unrelated category has no new completion ticks',()=>{explorer.marks=[{it:open}];assert.deepEqual(plain(api.state.ticked),[]);});
test('Done layer suppresses only a duplicate badge on the same completed reference',()=>{explorer.marks=[{it:complete},{it:open}];explorer.DONE782_ON=true;explorer.DONE782.add('P12');assert.deepEqual(plain(api.state.ticked),[]);explorer.DONE782.clear();assert.deepEqual(plain(api.state.ticked),['P12']);explorer.DONE782_ON=false;});
test('Unchanged completion set does not repaint or refresh card',()=>{const p=paints;api.pull();assert.equal(paints,p);});
test('Unavailable host clears a previously verified claim',()=>{current=null;api.pull();assert.deepEqual(plain(api.keys()),[]);assert.equal(explorer.ok897(complete), '');});
test('Older host with Done/card APIs cannot make a completion claim',()=>{explorer.window.parent={gc500DoneKeys:()=>['P12'],gc500PlanProgress887:()=>({stage:{n:5}})};api.pull();assert.deepEqual(plain(api.keys()),[]);});
test('Read failure clears ticks, then recovery restores verified set',()=>{explorer.window.parent={gc500CompleteKeys897:()=>['P12']};api.pull();explorer.window.parent.gc500CompleteKeys897=()=>{throw Error('cross origin');};api.pull();assert.deepEqual(plain(api.keys()),[]);explorer.window.parent.gc500CompleteKeys897=()=>['P12'];api.pull();assert.deepEqual(plain(api.keys()),['P12']);});
test('Set normalisation ignores invalid keys and deduplicates references',()=>{explorer.window.parent.gc500CompleteKeys897=()=>[' p12 ','P12',null,1,''];api.pull();assert.deepEqual(plain(api.keys()),['P12']);});
test('A completion change refreshes visible Timeline details without changing selection',()=>{cardShown=true;const m=explorer.marks;explorer.window.parent.gc500CompleteKeys897=()=>[];api.pull();assert.equal(refreshes,1);assert.equal(explorer.marks,m);cardShown=false;explorer.window.parent.gc500CompleteKeys897=()=>['P12'];api.pull();assert.equal(refreshes,1);});
const calls=[];const ctx=new Proxy({}, {get:(_,k)=>(...args)=>calls.push([k,...args]),set:(_,k,v)=>{calls.push([k,v]);return true;}});
test('Tick is static, lower-right and scales with device pixels',()=>{explorer.tick897(ctx,20,30,14,complete);const circles=calls.filter(c=>c[0]==='arc');assert.equal(circles.length,2);assert.ok(circles[0][1]>20 && circles[0][2]>30);assert.equal(circles[1][3],6.5);assert.equal(calls[0][0],'save');assert.equal(calls.at(-1)[0],'restore');calls.length=0;explorer.dpr=2;explorer.tick897(ctx,40,60,28,complete);assert.equal(calls.filter(c=>c[0]==='arc')[1][3],13);});
test('Incomplete, non-trade and duplicate Done references emit no drawing commands',()=>{for(const item of [open,layer]){calls.length=0;explorer.tick897(ctx,0,0,14,item);assert.equal(calls.length,0);}explorer.DONE782_ON=true;explorer.DONE782.add('P12');calls.length=0;explorer.tick897(ctx,0,0,14,complete);assert.equal(calls.length,0);});
console.log(JSON.stringify({author:'Andrew Fisher',passed,failed:0,network:false,liveWrites:0}));
