// Author: Andrew Fisher. Synthetic UI lifecycle tests; no financial payload, network or record access.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const file=process.argv[2]||path.join(__dirname,'plf1277_src.caret-proposed.js');
const fixture={lines:[],categories:[],facts:[],invoices:[],revFacts:[],purchaseOrders:[],contracts:[],labourJournal:[]};
let map={},timers=new Map(),nextTimer=1,documentFocused=true;
const body={id:'BODY'};
const doc={body,activeElement:body,listeners:{},getElementById:id=>map[id]||null,hasFocus:()=>documentFocused,addEventListener(k,v){this.listeners[k]=v;}};
function install(){Object.values(map).forEach(el=>el.isConnected=false);map={};doc.activeElement=body;for(const id of ['pane-costs','plx','plx-cat','plx-br','plx-mo','plx-q','plx-clear','plx-sum','plx-out']){
 let html='',value='';map[id]={id,isConnected:true,selectionStart:0,selectionEnd:0,selectionDirection:'none',classList:{contains:c=>c==='on'},listeners:{},focus(){doc.activeElement=this;if(this.onfocus)this.onfocus();},setSelectionRange(a,b,d){this.selectionStart=a;this.selectionEnd=b;this.selectionDirection=d||'none';},addEventListener(k,v){this.listeners[k]=v;},get value(){return value;},set value(v){value=v;this.selectionStart=this.selectionEnd=v.length;},get innerHTML(){return html;},set innerHTML(v){html=v;}}}}
install();
const src=fs.readFileSync(file,'utf8').replace('__PLF1272_DATA__',JSON.stringify(fixture)).replace('__PLF1272_SHA__','synthetic-fixture');
const ctx={window:{},document:doc,setTimeout:f=>{const n=nextTimer++;timers.set(n,f);return n;},clearTimeout:n=>timers.delete(n),console};vm.createContext(ctx);vm.runInContext(src,ctx);ctx.PLF1272.bind();
const checks=[];function check(name,f){try{f();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});}}
function flush(){for(let guard=0;timers.size&&guard<10;guard++){const pending=[...timers.values()];timers.clear();pending.forEach(f=>f());}}
function query(){map['plx-clear'].onclick();const q=map['plx-q'];q.value='Sample query';q.focus();q.setSelectionRange(5,5,'none');q.oninput();return q;}
function redraw({pointerAway=false,otherField=false,awayTab=false,range=[5,5,'none'],inactive=false,differentQuery=false}={}){
 documentFocused=true;const old=query();old.setSelectionRange(...range);old.oninput();
 if(pointerAway&&doc.listeners.pointerdown)doc.listeners.pointerdown({target:map['plx-cat']});
 old.onblur({relatedTarget:otherField?map['plx-cat']:null});install();
 if(awayTab)map['pane-costs'].classList.contains=()=>false;
 documentFocused=!inactive;ctx.PLF1272.bind();
 if(differentQuery){map['plx-q'].value='New query';map['plx-q'].oninput();}
 flush();return map['plx-q'];
}
check('Query survives replacement before the debounce runs',()=>{query();install();ctx.PLF1272.bind();flush();assert.equal(map['plx-q'].value,'Sample query');});
check('Same-tab redraw restores search focus and a middle caret',()=>{const q=redraw();assert.equal(doc.activeElement,q);assert.equal(q.selectionStart,5);assert.equal(q.selectionEnd,5);});
check('Selected range and direction survive same-tab redraw',()=>{const q=redraw({range:[2,8,'backward']});assert.equal(doc.activeElement,q);assert.deepEqual([q.selectionStart,q.selectionEnd,q.selectionDirection],[2,8,'backward']);});
check('Intentional pointer click outside Search cancels restoration',()=>{redraw({pointerAway:true});assert.equal(doc.activeElement,body);});
check('Intentional focus to another control is not stolen during redraw',()=>{redraw({otherField:true});assert.equal(doc.activeElement,body);});
check('Navigation away from Costs does not focus the hidden search',()=>{redraw({awayTab:true});assert.equal(doc.activeElement,body);});
check('An inactive document does not reclaim focus',()=>{redraw({inactive:true});assert.equal(doc.activeElement,body);});
check('A later query is not overwritten by stale selection restoration',()=>{const q=redraw({differentQuery:true});assert.equal(q.value,'New query');assert.equal(doc.activeElement,body);});
documentFocused=true;install();ctx.PLF1272.bind();
check('A blur with no DOM replacement does not refocus the existing field',()=>{const old=query();old.onblur({relatedTarget:null});doc.activeElement=body;flush();assert.equal(doc.activeElement,body);});
process.stdout.write(JSON.stringify({author:'Andrew Fisher',fixture:'synthetic only',source:file,passed:checks.filter(x=>x.passed).length,total:checks.length,checks},null,2)+'\n');
if(checks.some(x=>!x.passed))process.exitCode=1;
