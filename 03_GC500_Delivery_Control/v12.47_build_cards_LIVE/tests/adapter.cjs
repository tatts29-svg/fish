/* Author: Andrew Fisher. Synthetic DOM/observer/decoder integration; no browser or records. */
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
let checks=0;const check=(v,m)=>{assert(v,m);checks++;},tick=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
function fixture({intersection=true}={}){
 const frames=[],ios=[],mutations=[],decoders=[],canvases=[],pictures=[],positions=new Map(),locations=new Map(),listeners=new Map();let time=0;
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.nodeType=1;this.children=[];this.parentElement=null;this.dataset={};this.attributes={};this._text='';this.hidden=false;this.style={overflowY:'visible'};this.events={};}
  get className(){return this.attributes.class||'';}set className(v){this.attributes.class=v;}
  get classList(){const node=this;return {contains:c=>node.className.split(/\s+/).includes(c),add:c=>{if(!node.classList.contains(c))node.className=(node.className+' '+c).trim();},remove:c=>{node.className=node.className.split(/\s+/).filter(x=>x!==c).join(' ');}};}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this.children.forEach(c=>c.parentElement=null);this.children=[];this._text=String(v);}
  get isConnected(){return this===body||!!this.parentElement?.isConnected;}
  get src(){return this.attributes.src||'';}set src(v){this.attributes.src=v;}
  setAttribute(k,v){this.attributes[k]=String(v);}removeAttribute(k){delete this.attributes[k];}
  append(...nodes){for(const n of nodes){n.remove();n.parentElement=this;this.children.push(n);}}
  prepend(...nodes){for(const n of nodes.reverse()){n.remove();n.parentElement=this;this.children.unshift(n);}}
  replaceChildren(...nodes){this.children.forEach(c=>c.parentElement=null);this.children=[];this._text='';this.append(...nodes);}
  before(node){const parent=this.parentElement;if(!parent)return;node.remove();node.parentElement=parent;parent.children.splice(parent.children.indexOf(this),0,node);}
  remove(){if(this.parentElement){const p=this.parentElement;p.children=p.children.filter(c=>c!==this);this.parentElement=null;}}
  contains(node){return node===this||this.children.some(c=>c.contains(node));}
  simple(selector){if(selector==='[hidden]')return this.hidden;const tag=selector.match(/^[a-z]+/i)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;return [...selector.matchAll(/\.([\w-]+)/g)].every(m=>this.classList.contains(m[1]));}
  matches(selector){return selector.split(',').some(part=>{part=part.trim();if(part.includes('>')){const [left,right]=part.split('>').map(x=>x.trim());return this.simple(right)&&!!this.parentElement?.matches(left);}const parts=part.split(/\s+/);if(parts.length>1){const last=parts.pop();return this.simple(last)&&!!this.parentElement?.closest(parts.join(' '));}return this.simple(part);});}
  closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)||null;}
  querySelectorAll(selector){if(selector.startsWith(':scope > '))return this.children.filter(c=>c.matches(selector.slice(9)));const result=[];for(const c of this.children){if(c.matches(selector))result.push(c);result.push(...c.querySelectorAll(selector));}return result;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  addEventListener(name,fn){(this.events[name]||=[]).push(fn);}
  getBoundingClientRect(){if(this===main)return {left:0,top:100,right:1000,bottom:700,width:1000,height:600};const top=positions.get(this.dataset.build1247Key)||200;return {left:10,top,right:510,bottom:top+80,width:500,height:80};}
 }
 const body=new Element('body'),main=new Element('main'),pane=new Element('section');main.style.overflowY='auto';pane.className='pane on';body.append(main);main.append(pane);const list=new Element('div');list.className='ldlist';pane.append(list);
 class Observer{constructor(callback,options){this.callback=callback;this.options=options;this.targets=new Set();this.disconnected=false;ios.push(this);}observe(t){this.targets.add(t);}unobserve(t){this.targets.delete(t);}disconnect(){this.targets.clear();this.disconnected=true;}emit(entries){this.callback(entries);}}
 class Mutation{constructor(fn){this.fn=fn;mutations.push(this);}observe(target,options){this.target=target;this.options=options;}disconnect(){this.target=null;}}
 class Decoder extends Element{constructor(){super('img');this.naturalWidth=1000;this.naturalHeight=824;decoders.push(this);}}
 const D={body,hidden:false,visibilityState:'visible',getElementById:id=>id==='pane-timeline'?pane:null,createElement:tag=>{const e=new Element(tag);if(tag==='canvas'){e.width=e.height=0;e.getContext=()=>({drawImage(){e.draws=(e.draws||0)+1;}});e.toDataURL=()=>`data:image/jpeg;base64,compact${canvases.length}`;canvases.push(e);}return e;},addEventListener(name,fn){(listeners.get(name)||listeners.set(name,[]).get(name)).push(fn);}};
 const W={document:D,innerWidth:1000,innerHeight:800,MutationObserver:Mutation,addEventListener:D.addEventListener.bind(D),Find1176:{release:'synthetic',VIEWS:[{key:'wide'}],locate:({key})=>locations.get(key),inAerial:L=>L.embedded!==false,picture:(L,V)=>new Promise((resolve,reject)=>pictures.push({L:{...L},resolve,reject}))}};if(intersection)W.IntersectionObserver=Observer;
 const state={tab:'timeline'};const context={window:W,document:D,IntersectionObserver:Observer,MutationObserver:Mutation,Image:Decoder,state,renderTimeline:()=>{},requestAnimationFrame:fn=>frames.push(fn),getComputedStyle:n=>n.style,go:tab=>{state.tab=tab;},showOnMap:()=>{},Promise,Map,Set,Date,Number,Object,Array};vm.createContext(context);
 const add=id=>{const card=new Element('article');card.className='ld tl846 lc991';const summary=new Element('div');summary.className='lc991-summary';const ref=new Element('span');ref.className='tl841-ref';ref.dataset.tl841Ref=id;const original=new Element('b');original.textContent='Original '+id;ref.append(original);summary.append(ref);card.append(summary);list.append(card);locations.set(id,{kind:'asset',label:id,id,lat:1,lon:2,how:'Synthetic location'});return {card,ref,original};};
 const run=file=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 const boot=()=>{run('build_preview_lifecycle1247.js');run('build_cards1247.js');};
 const flush=async()=>{for(let turn=0;turn<8;turn++){while(frames.length)frames.shift()();await tick();}};
 const emit=(name,event={})=>(listeners.get(name)||[]).forEach(fn=>fn(event));
 return {W,D,state,context,body,pane,main,list,add,boot,flush,emit,ios,mutations,decoders,canvases,pictures,positions,locations,button:id=>pane.querySelectorAll('.b1247-location').find(b=>b.dataset.build1247Key===id)};
}
(async()=>{
 // Persistent observation, geometry clipping, no work after obsolete observer callbacks.
 {
  const f=fixture(),r=f.add('A');f.boot();await f.flush();const first=f.ios[0],b=f.button('A');check(first.targets.has(b)&&first.options.root===f.main,'Observer uses native scroll root');first.emit([{target:b,isIntersecting:true}]);await f.flush();check(first.targets.has(b),'Observation remains active after entry');check(f.pictures.length===1,'Visible entry draws once');
  f.pictures[0].resolve({dataUrl:'raw-a'});await f.flush();check(f.decoders.length===1,'Current picture reaches decoder');f.decoders[0].onload();await f.flush();check(b.querySelector('img')&&f.canvases.length===1,'Current decoder attaches compact picture');check(!f.decoders[0].src&&f.decoders[0].onload===null&&f.canvases[0].width===0,'Temporary decoder and canvas released');
  const decoded=b.querySelector('img');f.positions.set('A',900);f.emit('scroll');await f.flush();check(!b.querySelector('img')&&f.W.BuildCards1247.stats().attached===0,'Scroll geometry evicts image before observer callback');check(!decoded.src&&!decoded.isConnected,'Evicted DOM image has neither source nor attachment');f.positions.set('A',200);first.emit([{target:b,isIntersecting:true}]);await f.flush();check(b.querySelector('img')&&f.pictures.length===1,'Reentry restores compressed cache');
  f.context.renderTimeline();await f.flush();const second=f.ios.at(-1);check(first.disconnected&&second!==first,'Render replaces observer');first.emit([{target:b,isIntersecting:true}]);await f.flush();check(!b.querySelector('img'),'Disconnected observer callbacks cannot resurrect images');second.emit([{target:b,isIntersecting:true}]);await f.flush();check(b.querySelector('img'),'Current observer resumes image');
  f.D.hidden=true;f.D.visibilityState='hidden';f.emit('visibilitychange');check(!b.querySelector('img')&&f.W.BuildCards1247.stats().attached===0,'Hidden document releases decoded images synchronously while animation frames are suspended');
  f.D.hidden=false;f.D.visibilityState='visible';f.emit('visibilitychange');await f.flush();check(b.querySelector('img'),'Visible document restores cached image');check(r.ref.children[0]===r.original&&r.original.textContent==='Original A','Native DOM node and information preserved');
  const outer=new f.main.constructor('main');outer.style.overflowY='auto';f.body.replaceChildren(outer);outer.append(f.main);f.main.style.overflowY='visible';f.W.BuildCards1247.mount();await f.flush();check(second.disconnected&&f.ios.at(-1).options.root===outer,'Changed scroller replaces observer root');second.emit([{target:b,isIntersecting:true}]);await f.flush();check(!b.querySelector('img'),'Old root callback cannot repopulate cleared image');
  f.ios.at(-1).emit([{target:b,isIntersecting:true}]);await f.flush();f.state.tab='costs';const mutation=f.mutations.at(-1);mutation.fn([{type:'attributes',target:f.pane,attributeName:'class'}]);await f.flush();check(!b.querySelector('img')&&f.W.BuildCards1247.stats().queued===0,'Native pane attribute change releases displayed images');
 }
 // No decoder/canvas work when hidden or removed before native picture resolves.
 {
  const f=fixture();const r=f.add('A');f.boot();await f.flush();const b=f.button('A');f.ios[0].emit([{target:b,isIntersecting:true}]);await f.flush();f.D.hidden=true;f.D.visibilityState='hidden';f.emit('visibilitychange');await f.flush();f.pictures[0].resolve({dataUrl:'stale-hidden'});await f.flush();check(f.decoders.length===0&&f.canvases.length===0,'Hidden stale picture never creates decoder or canvas');
  f.D.hidden=false;f.D.visibilityState='visible';f.emit('visibilitychange');await f.flush();check(f.pictures.length===2,'Visible document resumes pending location');r.card.remove();f.W.BuildCards1247.mount();f.pictures[1].resolve({dataUrl:'stale-removed'});await f.flush();check(f.decoders.length===0&&f.W.BuildCards1247.stats().tracked===0,'Removed card result creates no decoder and retains no tracking');
 }
 // Coordinate changes during native picture and decoder phases are rejected, with cleanup.
 {
  const f=fixture();f.add('A');f.boot();await f.flush();const b=f.button('A');f.ios[0].emit([{target:b,isIntersecting:true}]);await f.flush();f.locations.get('A').lat=3;f.pictures[0].resolve({dataUrl:'old-coordinate'});await f.flush();check(f.decoders.length===0&&f.pictures.length===2&&f.pictures[1].L.lat===3,'Changed coordinates skip obsolete decoding and request new point');
  f.pictures[1].resolve({dataUrl:'new-coordinate'});await f.flush();const decoder=f.decoders[0];f.locations.get('A').lat=4;decoder.onload();await f.flush();check(f.canvases.length===0&&!decoder.src&&decoder.onload===null,'Coordinate race during decoding skips canvas and releases decoder');check(f.pictures.length===3&&f.pictures[2].L.lat===4,'Latest coordinate proceeds after stale decode');
  f.pictures[2].resolve({dataUrl:'final-coordinate'});await f.flush();f.decoders[1].onerror();await f.flush();check(!f.decoders[1].src&&f.decoders[1].onerror===null&&b.dataset.picture1247==='unavailable','Decode error clears handlers/source and shows explicit fallback');
 }
 // Fallback without IntersectionObserver still respects viewport and pane visibility.
 {
  const f=fixture({intersection:false});f.add('A');f.positions.set('A',900);f.boot();await f.flush();check(f.pictures.length===0,'No-observer fallback does not eagerly draw offscreen');f.positions.set('A',200);f.emit('scroll');await f.flush();check(f.pictures.length===1,'No-observer entry draws on visible scroll');f.pane.hidden=true;f.W.BuildCards1247.mount();f.pictures[0].resolve({dataUrl:'hidden-pane'});await f.flush();check(f.decoders.length===0,'Hidden pane blocks decoder in fallback mode');
 }
 console.log(JSON.stringify({checks,scenarios:4,status:'PASS',browser:false,network:false}));
})().catch(error=>{console.error(error.stack);process.exit(1)});
