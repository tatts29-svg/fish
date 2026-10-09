/* Author: Andrew Fisher. Geometry equivalence and real native board lifecycle. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {createVisibility971}=require('./showcase971_runtime.js');
let checks=0;function check(ok,label){assert.ok(ok,label);checks++;}
function original(VP,q){
 const outside=[true,true,true,true,true,true];
 for(const x of [q.minX,q.maxX])for(const y of [q.minY,q.maxY])for(const z of [q.minZ,q.maxZ]){
  const X=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],Y=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],Z=VP[2]*x+VP[6]*y+VP[10]*z+VP[14],W=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];
  const planes=[X+W*1.3,W*1.3-X,Y+W*1.3,W*1.3-Y,Z+W,W-Z];
  for(let k=0;k<6;k++)if(planes[k]>=0)outside[k]=false;
 }
 return !outside.some(Boolean);
}
const visibility=createVisibility971(),identity=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const box=(x,y,z,r=0)=>Object.freeze({minX:x-r,maxX:x+r,minY:y-r,maxY:y+r,minZ:z-r,maxZ:z+r});
for(const [q,want] of [[box(0,0,0),true],[box(1.3,0,0),true],[box(-1.3,0,0),true],[box(0,1.3,0),true],[box(0,-1.3,0),true],[box(0,0,1),true],[box(0,0,-1),true],[box(1.300001,0,0),false],[box(0,-1.300001,0),false],[box(0,0,1.000001),false],[box(0,0,0,10),true]])check(visibility(identity,q)===want,'frustum boundary');
let seed=971;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
let compared=0;
for(let m=0;m<240;m++){
 const vp=Object.freeze(Array.from({length:16},()=>random()*4-2));
 for(let i=0;i<350;i++){
  const q=box(random()*400-200,random()*60-30,random()*400-200,random()*15);
  assert.equal(visibility(vp,q),original(vp,q),`matrix ${m} cell ${i}`);compared++;
 }
}
check(compared===84000,'84,000 deterministic finite equivalence cases');
check(!visibility(null,box(0,0,0)),'null matrix rejected');
check(!visibility([NaN,...identity.slice(1)],box(0,0,0)),'invalid matrix rejected');
check(visibility(identity,box(0,0,0)),'valid matrix recovers');
check(!visibility(identity,null),'missing cell rejected');
const pagePath=process.env.PAGE||path.join(__dirname,'../build/GC500_v9.69/GC500_Delivery_Control_hosted.html');
const html=fs.readFileSync(pagePath,'utf8');
const start=html.indexOf('function wireBoard('),end=html.indexOf('\nconst BOARD_RUN =',start);
assert(start>=0&&end>start,'native wireBoard source found');
let native=html.slice(start,end);
const before="const canPage = () => canPlayMedia() && !motionOff();";
const after="const canPage = () => canPlayMedia() && !motionOff() && !document.body.classList.contains('showing');";
if(native.includes(before))native=native.replace(before,after);
check(native.includes(after),'native board has Showcase scheduling guard');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'../toolchain/harness')]}));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(`<style>@keyframes test{to{opacity:.9}}.moving{animation:test 10s infinite}.stopped{animation-play-state:paused}</style><section id="pane-today" class="pane on"><figure class="bhero" data-board><div class="vmsb"><div class="words"></div></div><video></video><button class="bplay"><span>Play with sound</span></button><span class="bload" hidden></span><span class="moving" id="todayMotion">motion</span><span class="moving stopped" id="stoppedMotion">paused</span></figure></section><div id="showcase"><span class="moving" id="showMotion">showcase</span></div>`);
  await page.addScriptTag({content:`
   window.GC3D={};window.IntersectionObserver=undefined;
   const BOARD_RUN={seen:true};let decorationOff=false;
   function boardStop(){if(BOARD_RUN.timer)clearInterval(BOARD_RUN.timer);}
   function boardPages(){return [{lines:[{cls:'ln',t:'Page one'}]},{lines:[{cls:'ln',t:'Page two'}]}];}
   function esc(v){return v}function motionOff(){return decorationOff}
   function todayIso(){return 'none'}function wxLoad(){};
   ${native}
   window.boardTest={run:BOARD_RUN,off:v=>{decorationOff=v;BOARD_RUN.reconcile();}};
   wireBoard(document.querySelector('#pane-today'),'2026-10-09',{});
  `});
  await page.addScriptTag({path:path.join(__dirname,'showcase971_runtime.js')});
  const result=await page.evaluate(async()=>{
   const results=[];const ok=(v,s)=>{if(!v)throw Error(s);results.push(s);};
   const G=GC3D,r=G.playbackRuntime971,v=document.querySelector('video'),fig=v.closest('.bhero'),pane=fig.closest('.pane'),play=document.querySelector('.bplay');
   const tick=()=>new Promise(resolve=>setTimeout(resolve,40));
   const open=()=>{document.body.classList.add('showing');r.suspend();};
   const close=()=>{document.body.classList.remove('showing');r.resume();};
   const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;
   const ctx=canvas.getContext('2d');ctx.fillRect(0,0,32,32);v.srcObject=canvas.captureStream(10);
   const painter=setInterval(()=>{ctx.fillStyle=`rgb(${Math.random()*255},0,0)`;ctx.fillRect(0,0,32,32)},30);
   ok(!!boardTest.run.timer,'native board starts its paging timer');
   await play.onclick();await tick();
   ok(!v.paused&&fig.classList.contains('playing'),'explicit native Play starts real stream');
   const nativeVolume=v.volume,nativeMuted=v.muted;
   open();await tick();
   ok(v.paused&&r.report().pausedVideos===1,'opening Showcase suspends playing Today MP4');
   ok(fig.classList.contains('playing')&&play.textContent==='Stop clip','native play intent retained');
   ok(!boardTest.run.timer,'native decorative paging timer stopped');
   ok(getComputedStyle(document.querySelector('#todayMotion')).animationPlayState==='paused','Today CSS animation paused');
   ok(getComputedStyle(document.querySelector('#showMotion')).animationPlayState==='running','Showcase animation retained');
   close();await tick();
   ok(!v.paused&&!!boardTest.run.timer,'close resumes same real stream and board timer');
   ok(v.volume===nativeVolume&&v.muted===nativeMuted,'audio preferences unchanged');
   ok(getComputedStyle(document.querySelector('#todayMotion')).animationPlayState==='running','Today decorative animation restored');
   ok(getComputedStyle(document.querySelector('#stoppedMotion')).animationPlayState==='paused','pre-existing stopped animation remains stopped');
   open();open();ok(r.report().pausedVideos===1,'repeated suspension is idempotent');
   boardTest.run.stopMedia();close();await tick();
   ok(v.paused&&!fig.classList.contains('playing'),'explicit native Stop prevents resume');
   open();close();await tick();ok(v.paused,'previously stopped media never autoplays');
   // Play starts asynchronously while Showcase is opening: do not abort native
   // loading, then suspend after its real playing event settles the play promise.
   const pending=play.onclick();open();await pending;await tick();
   ok(v.paused&&fig.classList.contains('playing')&&!document.querySelector('.bload').textContent,'in-flight Play pauses without native load failure: '+JSON.stringify({paused:v.paused,playing:fig.classList.contains('playing'),status:document.querySelector('.bload').textContent,report:r.report()}));
   close();await tick();ok(!v.paused,'in-flight explicit Play resumes on close');
   open();fig.classList.add('folded');close();await tick();ok(v.paused,'folded banner does not resume');
   fig.classList.remove('folded');boardTest.run.stopMedia();await play.onclick();open();pane.classList.remove('on');close();await tick();ok(v.paused,'inactive Today pane does not resume');
   pane.classList.add('on');boardTest.run.stopMedia();await play.onclick();open();boardTest.off(true);close();await tick();
   ok(!v.paused&&!boardTest.run.timer,'explicit MP4 playback survives decorative motion off');
   open();fig.remove();close();await tick();ok(v.paused&&r.report().pausedVideos===0,'detached video discarded');
   clearInterval(painter);for(const t of v.srcObject.getTracks())t.stop();boardStop();
   // Isolated lifecycle edges use a video-shaped state, with the same actual
   // DOM ancestry; they need no network or operational record.
   const f=document.createElement('figure');f.className='bhero playing';
   const e=document.createElement('video');f.append(e);pane.append(f);
   let paused=false,ended=false,source='one.mp4',starts=0,hidden=false;
   Object.defineProperties(e,{paused:{get:()=>paused},ended:{get:()=>ended},currentSrc:{get:()=>source}});
   e.pause=()=>{paused=true};e.play=()=>{paused=false;starts++;return Promise.resolve()};
   Object.defineProperty(document,'hidden',{get:()=>hidden,configurable:true});
   open();source='two.mp4';close();ok(paused&&starts===0,'changed video source never resumes');
   paused=false;open();ended=true;close();ok(paused&&starts===0,'ended video never resumes');
   ended=false;paused=false;open();hidden=true;close();ok(paused&&r.report().pausedVideos===1,'close in hidden tab retains deferred intent');
   hidden=false;document.dispatchEvent(new Event('visibilitychange'));ok(!paused&&starts===1&&r.report().pausedVideos===0,'visible tab resumes only deferred valid clip');
   paused=false;open();f.classList.remove('playing');close();ok(paused&&starts===1,'native playback error or cancellation prevents resume');
   f.remove();
   return results;
  });
  for(const label of result)check(true,label);
  await page.addScriptTag({path:path.join(__dirname,'showcase971_runtime.js')});
  check(await page.locator('#showcase971-background-style').count()===1,'repeat helper install adds no duplicate style');
  check(errors.length===0,'no browser page errors');
  console.log(JSON.stringify({author:'Andrew Fisher',checks,equivalenceCases:compared,nativeBoardChecks:result.length,pageErrors:errors.length},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
