/* Author: Andrew Fisher. Source geometry, honest locations and bounded overlay lifecycle. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),plain=value=>JSON.parse(JSON.stringify(value));
class Element{
 constructor(tag){this.tagName=tag;this.nodeType=1;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};this.isConnected=true;this.width=500;this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x)};this.classes=new Set();}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='class')this.classes=new Set(String(v).split(/\s+/));if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);}
 getAttribute(k){return this.attrs[k]??null;}
 appendChild(child){this.children.push(child);child.parentNode=this;return child;}
 remove(){if(this.parentNode){this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}this.isConnected=false;}
 matches(query){return query.split(',').some(s=>s==='[hidden]'?'hidden' in this.attrs:s.startsWith('.')?this.classes.has(s.slice(1)):s==='[role="dialog"]'?this.attrs.role==='dialog':s==='svg.mb1298'?this.tagName==='svg'&&this.classes.has('mb1298'):this.tagName===s);}
 closest(query){let n=this;while(n){if(n.matches(query))return n;n=n.parentNode;}return null;}
 querySelectorAll(query){return this.children.flatMap(c=>[...(c.matches(query)?[c]:[]),...c.querySelectorAll(query)]);}
 querySelector(query){return this.querySelectorAll(query)[0]||null;}
 getClientRects(){return this.isConnected?[{}]:[];}
 getBoundingClientRect(){return this.bounds||{width:this.width,height:720,left:0,top:0,right:this.width,bottom:720};}
}
function fixture(options={}){
 const callbacks={},jobs=[],observers={};
 class Observer{constructor(fn){this.fn=fn;this.nodes=new Set();}observe(n){this.nodes.add(n);}unobserve(n){this.nodes.delete(n);}emit(entries){this.fn(entries);}}
 const D={hidden:false,documentElement:new Element('html'),createElementNS(ns,tag){return new Element(tag);},addEventListener(name,fn){callbacks[name]=fn;}};
 const W={innerWidth:1000,innerHeight:800,setTimeout(fn){jobs.push(fn);return jobs.length;},addEventListener(name,fn){callbacks[name]=fn;},IntersectionObserver:class extends Observer{constructor(fn){super(fn);observers.intersection=this;}},ResizeObserver:class extends Observer{constructor(fn){super(fn);observers.resize=this;}},MutationObserver:class extends Observer{constructor(fn){super(fn);observers.mutation=this;}}};
 if(options.intersection===false)delete W.IntersectionObserver;
 vm.runInNewContext(fs.readFileSync(path.join(root,'../v12.97_demob_equipment_locations_LIVE/demob_shapes1297_src.js'),'utf8'),{window:W});
 vm.runInNewContext(fs.readFileSync(path.join(root,'map_beacon1298_src.js'),'utf8'),{window:W,document:D});
 const pane=new Element('section');pane.classList.add('pane','on');const host=new Element('span');pane.appendChild(host);
 const marker={kind:'footprint',colour:'#18e8ff',parts:[{kind:'building',standard:false,poly:[[.2,.3],[.4,.2],[.5,.4],[.3,.5]],doors:[{arcs:[[[.2,.3],[.21,.31],[.23,.34],[.25,.36]]],leaves:[[[.2,.3],[.25,.36]]],landing:[[[.25,.36],[.3,.39]]]}],chevrons:[[[.3,.3],[.35,.4],[.4,.3]]]}]};
 const projection={x:123,y:87,width:1000,height:720,projectSheet:(x,y)=>({x:x*1000+10,y:y*500+20})};
 return {W,D,api:W.MapBeacon1298,marker,projection,pane,host,callbacks,observers,flush(){while(jobs.length)jobs.shift()();},jobs};
}
test('capture preserves canonical anchor separately from exact rotated polygon and door projection',()=>{
 const f=fixture(),before=JSON.stringify(f.marker),s=f.api.capture(f.marker,f.projection,{width:1000,height:824});
 assert.equal(s.width,1000);assert.equal(s.height,824);assert.deepEqual(plain(s.location),{x:123,y:87});assert.equal(s.marker,f.marker);
 assert.deepEqual(plain(s.parts[0].points),[{x:210,y:170},{x:410,y:120},{x:510,y:220},{x:310,y:270}]);
 assert.deepEqual(plain(s.parts[0].doors[0].arcs[0]),[{x:210,y:170},{x:220,y:175},{x:240,y:190},{x:260,y:200}]);
 assert.deepEqual(plain(s.parts[0].doors[0].leaves[0][1]),{x:260,y:200});assert.equal(JSON.stringify(f.marker),before);
 assert.ok(!Object.values(s).some(value=>typeof value==='function'),'cache snapshot retains no projection closure');
});
test('unlocated, nonfinite and degenerate projections cannot produce a beacon snapshot',()=>{
 const f=fixture(),capture=(p,dimensions,marker=f.marker)=>f.api.capture(marker,p,dimensions);
 assert.equal(capture(f.projection,undefined,{kind:'unlocated'}),null);assert.equal(capture(f.projection,undefined,null),null);
 for(const field of ['x','y','width','height'])for(const invalid of [NaN,Infinity,-Infinity])assert.equal(capture({...f.projection,[field]:invalid}),null);
 for(const field of ['width','height'])for(const invalid of [0,-1,NaN,Infinity,-Infinity]){
  assert.equal(capture({...f.projection,[field]:invalid}),null);assert.equal(capture(f.projection,{[field]:invalid}),null);
 }
 const noGeometry=capture({...f.projection,projectSheet:()=>({x:NaN,y:0})});assert.deepEqual(plain(noGeometry.parts),[]);assert.deepEqual(plain(noGeometry.location),{x:123,y:87});
});
test('SVG uses actual source vertices and cubic door controls without relocating shapes to ring centre',()=>{
 const f=fixture(),s=f.api.capture(f.marker,f.projection,{width:1000,height:824});f.api.picture(f.host,s,'close');
 const outline=f.host.querySelector('.mb1298-outline'),doors=f.host.querySelectorAll('.mb1298-door'),spot=f.host.querySelector('.mb1298-location');
 assert.equal(outline.getAttribute('d'),'M210,170 L410,120 L510,220 L310,270 Z');
 assert.deepEqual(doors.map(x=>x.getAttribute('d')),['M210,170 C220,175 240,190 260,200','M210,170 L260,200','M260,200 L310,215','M310,170 L360,220 L410,170']);
 assert.equal(spot.getAttribute('transform'),'translate(123 87)');assert.equal(f.host.querySelector('.mb1298-frame').getAttribute('data-view1298'),'close');
 assert.equal(f.host.querySelector('.mb1298-ring').getAttribute('r'),'44');
});
test('qualified positions retain ring only when source projection is unavailable',()=>{
 const f=fixture(),marker={kind:'unassigned',qualification:'Approximate recorded position; equipment outline unrecorded',approximate:true};
 const s=f.api.capture(marker,f.projection);f.api.picture(f.host,s,'site');
 assert.equal(f.host.querySelectorAll('.mb1298-outline').length,0);assert.equal(f.host.querySelectorAll('.mb1298-ring').length,1);
 assert.equal(f.host.querySelector('.mb1298-ring').getAttribute('stroke-dasharray'),'5 4');assert.equal(s.marker.qualification,marker.qualification);
 const valid=f.api.frame(s,'site');
 for(const invalid of [{...valid,marker:undefined},{...valid,marker:{kind:'unlocated'}},{...valid,width:0},{...valid,height:-1},{...valid,location:{x:Infinity,y:20}}]){
  assert.doesNotThrow(()=>f.api.attach(f.host,{width:1000,height:720,frames:[invalid]}));assert.equal(f.host.querySelector('svg.mb1298'),null);
 }
});
test('partial reference layouts do not mark every source unit partial; catalogue outlines retain their dash',()=>{
 const f=fixture();f.marker.kind='reference';f.marker.partial=true;
 const show=()=>f.api.picture(f.host,f.api.capture(f.marker,f.projection),'close');show();
 assert.equal(f.host.querySelector('.mb1298-outline').getAttribute('stroke-dasharray'),null);
 f.marker.parts[0].standard=true;show();assert.equal(f.host.querySelector('.mb1298-outline').getAttribute('stroke-dasharray'),'6 4');
 f.marker.parts[0].standard=false;f.marker.kind='footprint';show();assert.equal(f.host.querySelector('.mb1298-outline').getAttribute('stroke-dasharray'),'6 4');
});
test('visibility and resize observers pause overlays and release detached hosts without a frame loop',()=>{
 const f=fixture(),s=f.api.capture(f.marker,f.projection);f.api.picture(f.host,s,'close');const svg=f.host.querySelector('svg.mb1298');
 assert.equal(svg.dataset.active1298,'false');f.observers.intersection.emit([{target:f.host,isIntersecting:true}]);assert.equal(svg.dataset.active1298,'true');
 f.D.hidden=true;f.callbacks.visibilitychange();f.flush();assert.equal(svg.dataset.active1298,'false');
 f.D.hidden=false;f.callbacks.visibilitychange();f.flush();assert.equal(svg.dataset.active1298,'true');
 f.pane.classList.remove('on');f.observers.mutation.emit([{type:'attributes',target:f.pane,attributeName:'class'}]);f.flush();assert.equal(svg.dataset.active1298,'false');
 f.pane.classList.add('on');f.observers.intersection.emit([{target:f.host,isIntersecting:false}]);assert.equal(svg.dataset.active1298,'false');
 f.host.width=250;f.observers.resize.emit([{target:f.host}]);assert.equal(f.host.querySelector('.mb1298-ring').getAttribute('r'),'88');
 f.host.isConnected=false;f.observers.mutation.emit([{type:'childList',removedNodes:[f.host]}]);f.flush();assert.equal(f.host.querySelector('svg.mb1298'),null);
 assert.equal(f.observers.intersection.nodes.size,0);assert.equal(f.observers.resize.nodes.size,0);assert.equal(f.jobs.length,0);
});
test('cached images reuse their projected snapshot and forgetting removes subsequent overlays',()=>{
 const f=fixture(),s=f.api.capture(f.marker,f.projection);f.api.remember('blob:first',s);f.api.cached(f.host,'blob:first','wide');
 assert.equal(f.host.querySelector('.mb1298-frame').getAttribute('data-x1298'),'123');f.api.detach(f.host);assert.equal(f.host.querySelector('svg.mb1298'),null);
 f.api.cached(f.host,'blob:first','wide');assert.equal(f.host.querySelector('.mb1298-location').getAttribute('transform'),'translate(123 87)');
 f.api.forget('blob:first');f.api.cached(f.host,'blob:first','wide');assert.equal(f.host.querySelector('svg.mb1298'),null);
});
test('browsers without intersection observers pause offscreen overlays on captured scroll',()=>{
 const f=fixture({intersection:false}),s=f.api.capture(f.marker,f.projection);f.api.picture(f.host,s,'close');const svg=f.host.querySelector('svg.mb1298');
 assert.equal(svg.dataset.active1298,'true');assert.equal(typeof f.callbacks.scroll,'function');
 f.host.bounds={width:500,height:100,left:0,right:500,top:900,bottom:1000};f.callbacks.scroll();f.flush();assert.equal(svg.dataset.active1298,'false');
 f.host.bounds={width:500,height:100,left:1001,right:1501,top:100,bottom:200};f.callbacks.scroll();f.flush();assert.equal(svg.dataset.active1298,'false');
 f.host.bounds={width:500,height:100,left:0,right:500,top:100,bottom:200};f.callbacks.scroll();f.flush();assert.equal(svg.dataset.active1298,'true');assert.equal(f.jobs.length,0);
});
test('static exported rings use canonical anchor and skip unlocated markers',()=>{
 const f=fixture(),calls=[],ctx=new Proxy({}, {get:(target,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
 f.api.paintRing(ctx,{kind:'unlocated'},f.projection);assert.equal(calls.length,0);
 f.api.paintRing(ctx,{kind:'reference'},f.projection);assert.deepEqual(calls.find(c=>c[0]==='arc').slice(1),[123,87,45,0,Math.PI*2]);
 assert.deepEqual(plain(calls.find(c=>c[0]==='setLineDash')[1]),[8,6]);assert.equal(calls[0][0],'save');assert.equal(calls.at(-1)[0],'restore');
});
