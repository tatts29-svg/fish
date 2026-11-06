/* Author: Andrew Fisher. Test the actual host reveal helper without document scrolling. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../source/fencing-trace-host837.js'),'utf8');
const code=src.slice(src.indexOf('function fenceTraceReveal837('),src.indexOf('window.gc500FencingTraceDocket837='));
function run(options={}){
 let focus=null;
 const main={scrollTop:40,scrollHeight:1600,clientHeight:600,clientTop:2,contains:()=>true,getBoundingClientRect:()=>({top:250}),...options};
 const card={getBoundingClientRect:()=>({top:650}),querySelector:()=>({focus:o=>{focus=o}}),scrollIntoView:()=>{throw Error('Must never scroll the document ancestors');}};
 const context={$:()=>main,window:{scrollTo:()=>{throw Error('Must preserve the outer page scroll');}},document:{scrollingElement:{scrollTop:0}}};vm.createContext(context);vm.runInContext(code,context);
 return {main,card,context,reveal:()=>context.fenceTraceReveal837(card),focus:()=>focus};
}
test('reveal scrolls only main to the card, retaining the viewport chrome',()=>{const f=run();assert.equal(f.reveal(),true);assert.equal(f.main.scrollTop,438);assert.equal(f.context.document.scrollingElement.scrollTop,0);assert.equal(f.focus().preventScroll,true);});
test('near-bottom reveal clamps to the main scroll range',()=>{const f=run({scrollTop:900});f.reveal();assert.equal(f.main.scrollTop,1000);});
test('above-viewport reveal clamps at zero',()=>{const f=run({getBoundingClientRect:()=>({top:800})});f.reveal();assert.equal(f.main.scrollTop,0);});
test('detached cards are not focused or scrolled',()=>{const f=run({contains:()=>false});assert.equal(f.reveal(),false);assert.equal(f.main.scrollTop,40);assert.equal(f.focus(),null);});
