/* Author: Andrew Fisher. Hidden/replaced Timeline geometry and strip-only movement. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const listeners={},writes=[];let pane;const state={tab:'timeline',day:'2026-10-09'};
const window={addEventListener:(e,f)=>{(listeners[e]??=[]).push(f)}};
const document={getElementById:()=>pane};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../timeline937.js'),'utf8'),{window,document,state});
function fixture({width=390,left=5000,onWidth=178,scroll=0,total=13000}={}){const on={offsetLeft:left+10,offsetWidth:onWidth};const strip={clientWidth:width,offsetLeft:10,scrollWidth:total,scrollLeft:scroll,querySelector:()=>on,scrollTo:o=>{writes.push(o);strip.scrollLeft=o.left;}};const p={hidden:false,classList:{contains:n=>n==='on'},querySelector:()=>strip};return{p,strip,on};}
let n=0;function test(name,f){writes.length=0;f();n++;console.log('PASS '+name)}
test('hidden gate cannot be considered a visible selection',()=>{let x=fixture({width:0,onWidth:0});pane=x.p;window.TimelineStrip937.reveal();assert.equal(writes.length,0);x.strip.clientWidth=390;x.on.offsetWidth=178;window.TimelineStrip937.reveal();assert.equal(x.strip.scrollLeft,4894);assert.equal(writes.length,1);assert.equal(writes[0].behavior,'auto');});
test('already visible selection preserves a browsed position',()=>{const x=fixture({left:5000,scroll:4900});pane=x.p;window.TimelineStrip937.reveal();assert.equal(writes.length,0);assert.equal(x.strip.scrollLeft,4900)});
test('resize re-queries current render, never a replaced strip',()=>{const old=fixture({width:0,onWidth:0});pane=old.p;window.TimelineStrip937.reveal();const fresh=fixture({left:3000});pane=fresh.p;listeners.resize[0]();assert.equal(old.strip.scrollLeft,0);assert.equal(fresh.strip.scrollLeft,2894);});
test('leaving Timeline prevents any later resize movement',()=>{pane=fixture().p;state.tab='today';listeners.resize[0]();assert.equal(writes.length,0);state.tab='timeline';});
test('hidden inactive pane is ignored',()=>{pane=fixture().p;pane.hidden=true;window.TimelineStrip937.reveal();assert.equal(writes.length,0);pane.hidden=false;pane.classList.contains=()=>false;window.TimelineStrip937.reveal();assert.equal(writes.length,0)});
test('first and last dates clamp within strip bounds',()=>{const x=fixture({left:0,scroll:900});pane=x.p;window.TimelineStrip937.reveal();assert.equal(x.strip.scrollLeft,0);const last=fixture({left:12900});pane=last.p;window.TimelineStrip937.reveal();assert.equal(last.strip.scrollLeft,12610)});
test('missing strip or selected card is safe',()=>{pane=null;window.TimelineStrip937.reveal();pane=fixture().p;pane.querySelector=()=>null;window.TimelineStrip937.reveal();pane=fixture().p;pane.querySelector().querySelector=()=>null;window.TimelineStrip937.reveal();assert.equal(writes.length,0)});
test('scrollTo fallback changes only strip scrollLeft',()=>{const x=fixture();pane=x.p;x.strip.scrollTo=()=>{throw Error('unsupported')};window.TimelineStrip937.reveal();assert.equal(x.strip.scrollLeft,4894);assert.equal(state.day,'2026-10-09')});
test('pageshow reads current selection and leaves dates intact',()=>{const x=fixture({left:4000});pane=x.p;listeners.pageshow[0]();assert.equal(x.strip.scrollLeft,3894);assert.equal(state.day,'2026-10-09');assert.deepEqual(Object.keys(listeners).sort(),['pageshow','resize'])});
const page=fs.readFileSync(process.env.PAGE||'/workspace/private-timeline937/candidate.html','utf8');
const begin=page.indexOf('const Refresh904 = window.GC500Refresh904 = (() => {'),end=page.indexOf('\nrenderTabs();',begin);assert(begin>=0&&end>begin);
const x=fixture({width:0,onWidth:0}),attrs={},fields={textContent:''};
const refreshWindow={addEventListener:()=>{},dispatchEvent:()=>{}},sync={on:true,status:'connecting',first:new Set()},root={setAttribute:(k,v)=>{attrs[k]=v;if(k==='data-refresh904'){x.strip.clientWidth=v==='loading'?0:390;x.on.offsetWidth=v==='loading'?0:178;}},removeAttribute:k=>delete attrs[k],getAttribute:k=>attrs[k]};
const refreshDoc={readyState:'complete',documentElement:root,getElementById:id=>id==='pane-timeline'?x.p:{querySelector:()=>fields},querySelector:sel=>sel==='.app > main'?{setAttribute:()=>{}}:null};
const ctx={window:refreshWindow,document:refreshDoc,state:{tab:'timeline',day:'2026-10-09'},DATA:{edition:'hosted'},location:{pathname:'/v/Coates-GC500-2026'},SYNC:sync,SYNC_COLLS:{},setTimeout:()=>1,clearTimeout:()=>{},Event:function(type){this.type=type},syncRedraw:()=>refreshWindow.GC500Refresh904.drawn()};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../timeline937.js'),'utf8'),ctx);ctx.TimelineStrip937=refreshWindow.TimelineStrip937;vm.runInContext(page.slice(begin,end),ctx);
test('native saved-copy reveal exposes selected day',()=>{assert.equal(attrs['data-refresh904'],'loading');assert.equal(x.strip.scrollLeft,0);sync.status='unreachable';refreshWindow.GC500Refresh904.update();assert.equal(attrs['data-refresh904'],'saved');assert.equal(x.strip.scrollLeft,4894);});
test('native ready reveal centres current strip after completed render',()=>{x.strip.scrollLeft=0;sync.status='live';refreshWindow.GC500Refresh904.update();assert.equal(attrs['data-refresh904'],'ready');assert.equal(x.strip.scrollLeft,4894);assert.equal(ctx.state.day,'2026-10-09');});
console.log(n+'/'+n+' checks passed');
