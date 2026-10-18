/* Author: Andrew Fisher. Actual patch helpers; geometry order and native output parity, no browser. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const sources=JSON.parse(execFileSync('python3',['-c','import ast,json,sys; m=ast.parse(open(sys.argv[1]).read()); print(json.dumps({n.targets[0].id:ast.literal_eval(n.value) for n in m.body if isinstance(n,ast.Assign) and isinstance(n.value,ast.Constant) and isinstance(n.value.value,str)}))',path.join(root,'dom_batch1066.py')],{encoding:'utf8'}));
const hunks=JSON.parse(fs.readFileSync(path.join(root,'speed1066_hunks.json'),'utf8'));
const helpers=hunks.find(x=>x.id===54).new.split('function tpodPaint(at){')[0];
let checks=0;function check(v,name){assert.ok(v,name);checks++;}
function classes(log,id){const s=new Set();return {s,add:k=>{if(!s.has(k)){s.add(k);log.push('write:'+id+':class');}},toggle:(k,on)=>{if(s.has(k)!==!!on){if(on)s.add(k);else s.delete(k);log.push('write:'+id+':class');}}};}
function attrs(log,id){const values={};return {values,getAttribute:k=>values[k]??null,setAttribute:(k,v)=>{values[k]=v;log.push('write:'+id+':'+k);}};}
function motion(source,cfg){
 const log=[];
 const nodes=['a','b','c'].map(id=>{
  const text={nodeType:3,nextSibling:null};let value='';Object.defineProperty(text,'nodeValue',{get:()=>value,set:v=>{value=v;log.push('write:'+id+':text');}});
  const span={firstChild:text};Object.defineProperty(span,'textContent',{get:()=>value,set:v=>{text.nodeValue=v;}});
  const shape=attrs(log,id+':path'),button=attrs(log,id+':button');let disabled=false,title='';
  Object.defineProperties(button,{disabled:{get:()=>disabled,set:v=>{disabled=!!v;log.push('write:'+id+':disabled');}},title:{get:()=>title,set:v=>{title=v;log.push('write:'+id+':title');}}});
  button.querySelector=s=>s==='span'?span:shape;
  const types=[{dataset:{tw843TypeId:id+'-type'},classList:classes(log,id+'-type')}];
  return {dataset:{tw840Area:id},classList:classes(log,id),types,button,span,shape,querySelector:()=>button,querySelectorAll:()=>types,target:{closest:()=>cfg.type?types[0]:null}};
 });
 const ctx=vm.createContext({board:()=>({querySelectorAll:()=>nodes}),motionOff:()=>cfg.off,selected:cfg.selected,running:cfg.running,motionMode:cfg.mode,runningInstrument:null,areas:[{id:'a',name:'A'},{id:'b',name:'B'}],visibleMotionTarget:node=>{log.push('read:'+node.dataset.tw840Area);return cfg.visible?node.target:null;}});
 vm.runInContext(helpers+source,ctx);
 const snapshot=()=>JSON.stringify({instrument:ctx.runningInstrument,nodes:nodes.map(n=>({id:n.dataset.tw840Area,classes:[...n.classList.s],types:n.types.map(t=>[...t.classList.s]),disabled:n.button.disabled,attrs:n.button.values,title:n.button.title,text:n.span.textContent,path:n.shape.values}))});
 ctx.controls();return {ctx,log,snapshot};
}
for(const cfg of [
 {running:'b',selected:'b',mode:'auto',off:false,visible:true,type:false},
 {running:'c',selected:'a',mode:'selected',off:false,visible:true,type:true},
 {running:'a',selected:'b',mode:'selected',off:true,visible:true,type:false},
 {running:'b',selected:'b',mode:'auto',off:false,visible:false,type:false},
 {running:null,selected:'a',mode:'paused',off:false,visible:false,type:false},
 {running:'missing',selected:null,mode:'auto',off:false,visible:true,type:false}
]){
 const old=motion(sources.OLD_CONTROLS,cfg),fresh=motion(sources.CONTROLS,cfg);
 check(old.snapshot()===fresh.snapshot(),'motion output, active instrument and labels match native controls');
 const read=fresh.log.findIndex(x=>x.startsWith('read:')),write=fresh.log.findIndex(x=>x.startsWith('write:'));
 check(read<0||read<write,'active visibility read precedes every control write');
 fresh.log.length=0;fresh.ctx.controls();check(!fresh.log.some(x=>x.startsWith('write:')),'unchanged controls emit no class/attribute/text writes');
}
const witness=motion(sources.OLD_CONTROLS,{running:'b',selected:'b',mode:'auto',off:false,visible:true,type:false});
check(witness.log.findIndex(x=>x.startsWith('write:'))<witness.log.findIndex(x=>x.startsWith('read:')),'fixture detects the original read-after-write layout pattern');

function masonry(source,withObserver){
 const log=[],queued=[],observers=[];
 const boxes=['one','two'].map((id,i)=>({id,classList:classes(log,id),children:[]}));
 const nodes=[{h:25,closed:false},{h:0,closed:false},{h:41,closed:true},{h:60,closed:false}].map((v,i)=>{
  const styles={},k={...v,id:String(i),parentElement:boxes[i<2?0:1],closest:()=>k.closed?{}:null,style:{getPropertyValue:p=>styles[p]||'',setProperty:(p,value)=>{styles[p]=value;log.push('write:'+i);}},getBoundingClientRect:()=>{log.push('read:'+i);return {height:k.h};},styles};
  k.parentElement.children.push(k);return k;
 });
 function RO(cb){this.cb=cb;this.seen=[];this.disconnect=()=>{this.seen=[];};this.observe=(k,opts)=>{this.seen.push([k,opts]);};observers.push(this);}
 const ctx=vm.createContext({ResizeObserver:withObserver?RO:undefined,place799Soon:b=>queued.push(b.id)});
 vm.runInContext(source,ctx);ctx.brick795(boxes);
 return {ctx,log,nodes,boxes,queued,observers,snapshot:()=>JSON.stringify(nodes.map(k=>k.styles))};
}
const native=masonry(sources.OLD_BRICK,false),batched=masonry(sources.BRICK,false);
check(native.snapshot()===batched.snapshot(),'fallback heights preserve zero-height and closed-fold rules');
check(batched.log.filter(x=>x.startsWith('read:')).length===3,'only three open cards are measured');
check(batched.log.findLastIndex(x=>x.startsWith('read:'))<batched.log.findIndex(x=>/^write:\d/.test(x)),'all fallback heights are read before the first span write');
check(JSON.stringify([...new Set(native.queued)].sort())===JSON.stringify([...new Set(batched.queued)].sort()),'same parent boxes remain queued for native placement');
batched.log.length=0;batched.ctx.brick795.batch(batched.nodes);check(!batched.log.some(x=>x.startsWith('write:')),'unchanged height batch performs no span writes');
batched.nodes[2].closed=false;batched.nodes[0].h=31;batched.log.length=0;batched.ctx.brick795.batch(batched.nodes);
check(batched.nodes[2].styles['--sp95']==='28'&&batched.nodes[0].styles['--sp95']==='23','opening a fold and changed heights receive exact native row spans');
check(batched.log.findLastIndex(x=>x.startsWith('read:'))<batched.log.findIndex(x=>x.startsWith('write:')),'fold-open batch reads every height before writing');
const oldRO=masonry(sources.OLD_BRICK,true),newRO=masonry(sources.BRICK,true);
check(newRO.observers[0].seen.length===4&&newRO.observers[0].seen.every(x=>x[1].box==='border-box'),'all cards retain native border-box observation');
check(!newRO.log.some(x=>x.startsWith('read:')),'observer setup performs no fallback geometry read');
const entries=x=>x.nodes.map((target,i)=>({target,borderBoxSize:i===0?[{blockSize:75}]:undefined,contentRect:{height:i===1?0:40}}));
oldRO.observers[0].cb(entries(oldRO));newRO.observers[0].cb(entries(newRO));
check(oldRO.snapshot()===newRO.snapshot(),'observer reports preserve border-box preference, closed fold and zero-height rejection');
newRO.log.length=0;newRO.observers[0].cb(entries(newRO));check(!newRO.log.some(x=>x.startsWith('write:')),'identical resize reports do not rewrite spans');
const ro=newRO.observers[0];newRO.ctx.brick795(newRO.boxes);check(newRO.observers.length===1&&ro.seen.length===4,'observer is reused and targets are refreshed');
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true}));
