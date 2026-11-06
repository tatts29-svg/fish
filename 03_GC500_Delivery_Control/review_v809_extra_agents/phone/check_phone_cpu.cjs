// Author: Andrew Fisher. Source-bound CPU tests; no browser, renderer or network.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const [base, proposed, output] = process.argv.slice(2);
assert.ok(base && proposed && output, 'Usage: node check_phone_cpu.cjs source/car-app.js output/car-app.proposed.js results.json');
const rows = [];
const between = (s, a, b) => { assert.equal(s.split(a).length, 2, a); return s.slice(s.indexOf(a), s.indexOf(b, s.indexOf(a))); };
function pointerScenario(source, order, view = 'car') {
 const events = {}, noop = () => {}, canvas = { addEventListener:(type, fn)=>(events[type] ??= []).push(fn), getBoundingClientRect:()=>({left:0,top:0,width:400,height:400}), setPointerCapture:noop, releasePointerCapture:noop };
 const ctx = { $:()=>canvas, ready:true, view, controls:{enabled:view!=='cog'}, steerHeld:false, pointer:{set:noop}, raycaster:{setFromCamera:noop,intersectObjects:()=>[{object:{userData:{part:0}}}]}, pickables:[], allVisible:()=>true, specs:[{category:'Coates cog'}], PARTS:[{}], drive:{connected:()=>true}, cogPose:()=>({x:0,y:0,z:0}), camera:{position:{x:1},fov:60}, T:{Vector3:class{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}project(){return this;}}}, performance:{now:()=>100}, steer:0, setSteer:noop, seat:{yawT:0,pitchT:0}, seatLookAt:noop, pickAt:()=>({kind:'empty'}), closeCard:noop };
 vm.createContext(ctx); vm.runInContext(between(source,'function input(){','/* what a tap at a point'),ctx); vm.runInContext('input()',ctx);
 const fire=(type,id)=>events[type].forEach(fn=>fn({type,pointerId:id,pointerType:'touch',button:0,clientX:250,clientY:200}));
 fire('pointerdown',1); assert.equal(ctx.steerHeld,true,'first touch grabs wheel');
 for (const [type,id] of order) fire(type,id);
 return {held:ctx.steerHeld, orbit:ctx.controls.enabled};
}
function uiContext(source) {
 const elements={}, document={activeElement:null};
 function el(id){if(elements[id])return elements[id];return elements[id]={id,hidden:['exhibit','tour-panel'].includes(id),disabled:false,isConnected:true,style:{},dataset:{},setAttribute(){},contains(a){return a===this||this.id==='exhibit'&&a?.id?.startsWith('exhibit-')||this.id==='tour-panel'&&a?.id?.startsWith('tour-');},getClientRects(){return this.hidden?[]:[{}]},focus(){document.activeElement=this;},replaceChildren(){},querySelector(){return {scrollTop:0}},showModal(){this.open=true;},close(){this.open=false;}};}
 document.body=el('body');document.body.classList={add(){},remove(){}};document.activeElement=document.body;
 const ctx={$:el,document,tour:0,words:false,cardOpener:null,cardKind:null,placeCards(){},showStudio(){},setT(id,v){el(id).textContent=v;},renderRegister(){},setView(){},selectPart(){},sfx(){},drive:{requestPull(){},reassemble(){}},tourSteps:Array.from({length:5},(_,i)=>['Step '+i,'Copy '+i,'car',null])};
 vm.createContext(ctx);
 for(const [a,b] of [['function focusIn(el){','$(\'exhibit-close\').onclick'], ['function openRegister(useWords=false){',"$('category').innerHTML"],['function showTour(){',"document.querySelectorAll('[data-view]')"]]) vm.runInContext(between(source,a,b),ctx);
 ctx.showStudio=()=>{};
 return ctx;
}
for(const [label,file] of [['snapshot',base],['proposal',proposed]]) {
 const source=fs.readFileSync(file,'utf8');
 for(const [name,order] of [
  ['single touch release',[['pointerup',1]]],
  ['second touch lifts first',[['pointerdown',2],['pointerup',2],['pointerup',1]]],
  ['wheel touch lifts first',[['pointerdown',2],['pointerup',1],['pointerup',2]]],
  ['wheel touch cancelled',[['pointerdown',2],['pointercancel',1],['pointerup',2]]]
 ]) for(const view of ['car','cog']) {
  const state=pointerScenario(source,order,view),ok=!state.held&&state.orbit===(view!=='cog');
  rows.push({candidate:label,case:name,view,ok,state});
  if(label==='proposal'||name==='single touch release')assert.ok(ok,JSON.stringify(rows.at(-1))); else assert.ok(!ok,'baseline failure must reproduce');
 }
 let ctx=uiContext(source);ctx.$('tour-panel').hidden=false;ctx.document.activeElement=ctx.$('register-open');vm.runInContext('openRegister()',ctx);
 const count=Number(!ctx.$('tour-panel').hidden)+Number(!ctx.$('exhibit').hidden)+Number(!!ctx.$('register').open);
 rows.push({candidate:label,case:'Find a part during tour',ok:count===1,visibleSurfaceCount:count,tour:ctx.tour});assert.equal(count,label==='proposal'?1:2);
 ctx=uiContext(source);ctx.$('tour-panel').hidden=false;ctx.document.activeElement=ctx.$('tour-next');ctx.$('tour-next').onclick();
 const focus=ctx.document.activeElement.id;rows.push({candidate:label,case:'Next focuses new tour heading',ok:focus==='tour-title',focus});assert.equal(focus,label==='proposal'?'tour-title':'tour-next');
}
fs.writeFileSync(output,JSON.stringify({author:'Andrew Fisher',method:'Extracted source functions with controlled event and DOM doubles; no browser or GPU',rows},null,2)+'\n');
console.log(JSON.stringify(rows,null,2));
console.log('Reproduction and proposal assertions passed.');
