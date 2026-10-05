// Author: Andrew Fisher. Offline native-controller lifecycle checks: no network, SMS or records.
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
if(!process.env.BASE||!process.env.PAGE||!process.env.REPORT)throw Error('Set BASE, PAGE and a private REPORT output path');
const original=fs.readFileSync(process.env.BASE,'utf8');const patched=fs.readFileSync(process.env.PAGE,'utf8');
const checks=[];function check(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
class El{
 constructor(){this.classes=new Set();this.classList={contains:k=>this.classes.has(k),add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,b)=>{b?this.classes.add(k):this.classes.delete(k)}};this.listeners={};this.attrs={};this.hidden=false;this.disabled=false;this.isConnected=true;this.style={setProperty(){}};}
 querySelector(k){return this.map?.[k]||null;}querySelectorAll(){return [];}setAttribute(k,v){this.attrs[k]=v;}getBoundingClientRect(){return{width:0};}addEventListener(k,v){(this.listeners[k]??=new Set()).add(v);}removeEventListener(k,v){this.listeners[k]?.delete(v);}emit(k){for(const v of this.listeners[k]||[])v();}
}
function setup(source=patched,opts={}){
 const pane=new El(),fig=new El(),board=new El(),vid=new El(),play=new El(),status=new El(),label=new El(),open=new El(),doc=new El();pane.classes.add('on');
 pane.map={'.bhero[data-board]':fig,'#bOpen':open};fig.map={'.vmsb':board,'video':vid,'.bplay':play,'.bload':status};play.map={span:label};
 let connected=true,off=!!opts.off,seq=0;const intervals=new Map(),timers=new Map(),plays=[];vid.paused=true;vid.pauseCalls=0;vid.loadCalls=0;vid.currentTime=0;
 vid.pause=()=>{vid.paused=true;vid.pauseCalls++};vid.load=()=>{vid.loadCalls++;vid.error=null};
 vid.play=()=>{let resolve,reject;let promise=new Promise((a,b)=>{resolve=a;reject=b});plays.push({resolve:()=>{vid.paused=false;resolve()},reject});return promise;};
 doc.body={contains:()=>connected};doc.visibilityState='visible';let io;
 const ctx={console,document:doc,window:{addEventListener(){},removeEventListener(){}},localStorage:{setItem(){}},motionOff:()=>off,flash:()=>{},boardPages:()=>[],todayIso:()=> '2026-10-04',esc:String,
 setInterval:(f)=>{intervals.set(++seq,f);return seq},clearInterval:k=>intervals.delete(k),setTimeout:f=>{timers.set(++seq,f);return seq},clearTimeout:k=>timers.delete(k),requestAnimationFrame:()=>++seq,cancelAnimationFrame(){}};
 if(opts.io){ctx.IntersectionObserver=class{constructor(cb){io=cb;}observe(){}disconnect(){}};ctx.window.IntersectionObserver=ctx.IntersectionObserver;}
 const start=source.indexOf('function boardStop(){'),end=source.indexOf('\n/* the whole screen */',start);
 vm.createContext(ctx);vm.runInContext(source.slice(start,end)+'\nthis.testWire=wireBoard;this.testStop=boardStop;this.run=BOARD_RUN;',ctx);ctx.testWire(pane,'2026-10-03',{});if(io)io([{isIntersecting:true}]);
 return {ctx,pane,fig,board,vid,play,status,label,open,doc,plays,intervals,timers,click:()=>play.onclick(),setOff:b=>{off=b;doc.emit('gc500motionchange')},setHidden:b=>{doc.visibilityState=b?'hidden':'visible';doc.emit('visibilitychange')},disconnect:()=>{connected=false;ctx.run.reconcile()},setSeen:b=>io([{isIntersecting:b}])};
}
(async()=>{
 let old=setup(original,{off:true});check('Original defect: Motion Off disables manual Play',()=>assert.equal(old.play.disabled,true));old.ctx.testStop();
 let originalBoard=setup(original);originalBoard.ctx.testWire(new El(),'2026-10-03',{});check('Original embedded board-less pane removes Today Play handler',()=>assert.equal(originalBoard.play.onclick,null));originalBoard.ctx.testStop();
 let retained=setup();let retainedClick=retained.play.onclick;retained.ctx.testWire(new El(),'2026-10-03',{});check('Board-less embedded pane preserves Today media handler and resources',()=>{assert.equal(retained.play.onclick,retainedClick);assert.equal(retained.intervals.size,1)});retained.ctx.testStop();
 for(const mode of ['normal','Tools Off','OS reduced']){
  let h=setup(patched,{off:mode!=='normal'});check(mode+': mount does not play',()=>assert.equal(h.plays.length,0));check(mode+': explicit Play enabled',()=>assert.equal(h.play.disabled,false));
  let p=h.click();check(mode+': one explicit request starts media',()=>assert.equal(h.plays.length,1));h.plays[0].resolve();await p;
  check(mode+': video visible with sound',()=>{assert(h.fig.classes.has('playing'));assert.equal(h.vid.muted,false);assert.equal(h.vid.volume,1);});
  check(mode+': Stop remains keyboard-operable',()=>{assert.equal(h.play.hidden,false);assert.equal(h.label.textContent,'Stop clip');assert.equal(h.play.attrs['aria-label'],'Stop clip');});
  check(mode+': decorative timer honours preference',()=>assert.equal(h.intervals.size,mode==='normal'?1:0));
  await h.click();check(mode+': Stop restores still without replay',()=>{assert.equal(h.vid.paused,true);assert(!h.fig.classes.has('playing'));assert.equal(h.label.textContent,'Play with sound');assert.equal(h.plays.length,1)});h.ctx.testStop();
 }
 let h=setup(),p=h.click();await h.click();check('Second loading click cancels rather than races another Play',()=>{assert.equal(h.plays.length,1);assert.equal(h.vid.paused,true);assert.equal(h.label.textContent,'Play with sound')});let p2=h.click();h.plays[1].resolve();await p2;let pauses=h.vid.pauseCalls;h.plays[0].resolve();await p;check('Old promise cannot pause later explicit Play',()=>{assert.equal(h.vid.pauseCalls,pauses);assert(h.fig.classes.has('playing'))});h.ctx.testStop();
 for(const mode of ['document hidden','pane exit','fold','offscreen','detached']){
  h=setup(patched,{io:mode==='offscreen'});p=h.click();h.plays[0].resolve();await p;
  if(mode==='document hidden')h.setHidden(true);if(mode==='pane exit'){h.pane.classes.delete('on');h.ctx.run.reconcile();}if(mode==='fold')h.open.onclick();if(mode==='offscreen')h.setSeen(false);if(mode==='detached')h.disconnect();
  check(mode+': playback pauses and clears',()=>{assert(h.vid.paused);assert(!h.fig.classes.has('playing'))});
  if(mode==='document hidden')h.setHidden(false);if(mode==='pane exit'){h.pane.classes.add('on');h.ctx.run.reconcile();}if(mode==='fold')h.open.onclick();if(mode==='offscreen')h.setSeen(true);
  check(mode+': no automatic resume',()=>assert.equal(h.plays.length,1));h.ctx.testStop();
 }
 h=setup();p=h.click();h.plays[0].reject(new Error('unsupported'));await p;check('Unsupported play rejection retains still and offers Retry',()=>{assert(!h.fig.classes.has('playing'));assert.equal(h.label.textContent,'Retry clip');assert.equal(h.status.hidden,false)});
 h.vid.error={code:4};p=h.click();check('Explicit Retry reloads failed native source candidates',()=>assert.equal(h.vid.loadCalls,1));h.plays[1].resolve();await p;check('Retry can play successfully',()=>assert(h.fig.classes.has('playing')));h.vid.emit('error');check('Native media error restores still and Retry',()=>{assert(h.vid.paused);assert.equal(h.label.textContent,'Retry clip')});h.ctx.testStop();
 h=setup();p=h.click();h.plays[0].resolve();await p;h.setOff(true);check('Preference change does not enable decorative timer',()=>assert.equal(h.intervals.size,0));h.vid.emit('ended');check('End clears playback and keeps manual replay available',()=>{assert(h.vid.paused);assert.equal(h.label.textContent,'Play with sound');assert.equal(h.play.disabled,false)});h.ctx.testStop();
 h=setup();p=h.click();h.ctx.testStop();h.plays[0].resolve();await p;h.vid.emit('playing');check('Disposed player has no callbacks or active click handler',()=>{assert.equal(h.play.onclick,null);assert.equal(h.vid.listeners.playing.size,0);assert(!h.fig.classes.has('playing'));assert(h.vid.paused)});
 h=setup();p=h.click();await h.click();h.plays[0].resolve();await p;check('Late resolution after cancellation cannot restart sound',()=>assert(h.vid.paused));h.ctx.testStop();
 h=setup();p=h.click();let overdue=[...h.timers.values()][0];check('Loading has a bounded recovery timer',()=>assert.equal(h.timers.size,1));overdue();check('Unresolved or unsupported source returns to still with Retry',()=>{assert(h.vid.paused);assert.equal(h.label.textContent,'Retry clip');assert.equal(h.timers.size,0)});h.plays[0].resolve();await p;check('Late load after timeout cannot restart playback',()=>assert(h.vid.paused));p=h.click();h.plays[1].resolve();await p;overdue();check('Old load timeout cannot stop a later successful Play',()=>{assert(!h.vid.paused);assert(h.fig.classes.has('playing'));assert.equal(h.timers.size,0)});h.ctx.testStop();
 h=setup();h.vid.error=null;h.vid.networkState=3;p=h.click();check('NETWORK_NO_SOURCE restarts source selection even without video.error',()=>assert.equal(h.vid.loadCalls,1));h.plays[0].resolve();await p;h.ctx.testStop();
 h=setup();p=h.click();[...h.timers.values()][0]();h.vid.error=null;h.vid.networkState=2;let timed=h.click();check('Explicit Retry after timeout reloads a stalled source',()=>assert.equal(h.vid.loadCalls,1));h.plays[1].resolve();await timed;h.plays[0].resolve();await p;check('Timed-out earlier play does not stop successful retry',()=>assert(!h.vid.paused));h.ctx.testStop();
 const data=s=>s.slice(s.indexOf('const DATA ='),s.indexOf('const DATA =')+100);check('Board HTML template unchanged',()=>{const extract=s=>s.slice(s.indexOf('function dsnBoard('),s.indexOf('function boardFolded('));assert.equal(extract(patched),extract(original))});
 check('Reduced motion CSS stops transition without hiding explicit media',()=>{assert(patched.includes('.bhero video{transition:none}'));assert(!patched.includes('.bhero video{display:none}'))});
 const report={author:'Andrew Fisher',scope:'Offline native-controller checks only; no browser or live writes',base:crypto.createHash('sha256').update(original).digest('hex'),candidate:crypto.createHash('sha256').update(patched).digest('hex'),passed:checks.filter(x=>x.pass).length,total:checks.length,checks};fs.writeFileSync(process.env.REPORT,JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,total:report.total,failures:checks.filter(x=>!x.pass)},null,2));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
