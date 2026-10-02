/* Author: Andrew Fisher. Finish the complete circuit before ending the Showcase. */
(function(){
'use strict';
const G=window.GC3D;
if(!G||G.playback794||typeof SHOW==='undefined')return;
let run;
const fresh=()=>({active:true,distance:0,length:0,deckComplete:false,finished:false});
run=fresh();run.active=false;
const broadcastOn=()=>typeof BC!=='undefined'&&BC.on;

function sample(){
 const S=G.S;
 if(!run.active||!S||!S.sim||!S.CL||!(S.CL.L>0))return;
 const travelled=S.sim.s-S.gridS;
 if(Number.isFinite(travelled))run.distance=Math.max(run.distance,travelled,0);
 run.length=S.CL.L;
}
function hasLap(){return !!(G.S&&G.S.sim&&G.S.CL&&G.S.CL.L>0);}
function complete(){
 sample();
 if(!run.active||run.finished||!SHOW.open||!SHOW.playing||SHOW.reduced||SHOW.loop||broadcastOn()||!run.deckComplete)return false;
 if(hasLap()&&run.distance+1e-7<run.length)return false;
 run.finished=true;SHOW.playing=false;
 showClear();showStopClock();showSyncControls();
 return true;
}
function report(){
 sample();const length=run.length,M=G.M_PER_PT||1;
 return {active:run.active,distanceM:run.distance*M,lapLengthM:length*M,length:length*M,
  progress:length?Math.min(1,run.distance/length):0,
  lapProgress:length?(run.distance%length)/length:0,laps:length?run.distance/length:0,
  deckComplete:run.deckComplete,finished:run.finished,
  playing:!!(SHOW.open&&SHOW.playing&&!SHOW.reduced),loop:!!SHOW.loop};
}
function restart(){
 if(!SHOW.open||SHOW.reduced)return false;
 run=fresh();
 if(hasLap()){
  G.simReset();G.S.needsRender=true;G.S.last=null;
 }
 SHOW.pausedByTab=false;SHOW.launch=-1;SHOW.i=0;SHOW.playing=true;
 showClear();showLaunchStep();showRender();
 return true;
}
G.playback794={version:'v7.94',report,restart};

/* A context may return after Pause was pressed or the figures finished. The
   current transport state owns the restored scene, not its older snapshot. */
const restore=G.restoreContextState792;
if(restore)G.restoreContextState792=function(S,back){
 const result=restore.apply(this,arguments);
 if(result&&run.active&&SHOW.open&&S){
  S.paused=!SHOW.playing||SHOW.reduced||document.hidden;S.last=null;
 }
 return result;
};

/* A figure chapter has a wall-clock reading time. The circuit has a distance.
   Completing one must not stop the other, including on a slow frame cadence. */
showSchedule=function(){
 showClear();
 if(!SHOW.open||!SHOW.playing||SHOW.reduced||SHOW.launch>=0||broadcastOn())return;
 if(run.deckComplete){
  if(SHOW.loop){run.deckComplete=false;SHOW.i=0;showRender();}
  else complete();
  return;
 }
 SHOW.timer=setTimeout(()=>{
  SHOW.timer=null;
  if(!SHOW.open||!SHOW.playing||SHOW.reduced)return;
  if(SHOW.i===SHOW_ORDER.length-1){
   if(SHOW.loop){SHOW.i=0;showRender();}
   else {run.deckComplete=true;if(!complete())showSyncControls();}
  }else{SHOW.i++;showRender();}
 },SHOW_HOLD[SHOW_ORDER[SHOW.i]]||8000);
};

const frame=G.frame;
G.frame=function(){const result=frame.apply(this,arguments);sample();complete();return result;};
const open=showOpen;
showOpen=function(){run=fresh();const result=open.apply(this,arguments);sample();return result;};
const close=showClose;
showClose=function(){run.active=false;return close.apply(this,arguments);};
const move=showMove;
showMove=function(n){
 const to=SHOW.i+n;
 if(to>=0&&(to<SHOW_ORDER.length||SHOW.loop))run.deckComplete=false;
 return move.apply(this,arguments);
};

/* The last chapter can be manually paused before the lap finishes. In that
   state Resume means resume; Replay is reserved for an actually finished run. */
showPause=function(){
 if(SHOW.reduced)return;
 SHOW.pausedByTab=false;
 if(run.finished&&!SHOW.playing)return restart();
 SHOW.playing=!SHOW.playing;
 if(!SHOW.playing){showClear();showStopClock();pauseBroadcast();}
 else{
  resumeBroadcast();
  if(SHOW_ORDER[SHOW.i]==='countdown'){showTickClock();showStopClock();SHOW.clock=setInterval(showTickClock,1000);}
  showSchedule();
  if(SHOW.launch>=0&&!broadcastOn())showLaunchStep();
 }
 showSyncControls();
};
const controls=showSyncControls;
showSyncControls=function(){
 const result=controls.apply(this,arguments),pause=$('#showPause'),status=$('#showState');
 if(pause&&!SHOW.reduced)pause.textContent=SHOW.playing?'Pause':run.finished?'Replay':'Resume';
 if(status&&!SHOW.reduced&&run.deckComplete){
  const lapDone=run.length>0&&run.distance+1e-7>=run.length;
  status.textContent=run.finished?(lapDone?'Lap and figures complete · paused':'Figures complete · paused'):SHOW.playing?'Playing · completing the full lap':'Paused · full lap in progress';
 }
 return result;
};

/* Commentary owns chapter changes, not the car's transport. Its audio and
   silent fallback hold share Pause, so neither can advance behind a held lap. */
let voice=null;
const voiceNow=()=>performance.now();
function clearVoiceTimer(){if(typeof BC!=='undefined'&&BC.hold){clearTimeout(BC.hold);BC.hold=null;}}
function armVoice(){
 if(!voice||!broadcastOn()||!SHOW.playing||document.hidden||!voice.waiting)return;
 clearVoiceTimer();voice.due=voiceNow()+voice.remaining;
 const current=voice;
 BC.hold=setTimeout(()=>{BC.hold=null;if(voice===current)current.next();},voice.remaining);
}
function pauseBroadcast(){
 if(!broadcastOn()||!voice)return;
 if(BC.hold){voice.remaining=Math.max(0,voice.due-voiceNow());clearVoiceTimer();}
 if(BC.el)BC.el.pause();
}
function resumeBroadcast(){
 if(!broadcastOn()||!SHOW.playing||document.hidden)return;
 if(voice&&voice.pending!=null){const next=voice.pending;voice.pending=null;bcPlay(next);return;}
 if(!voice){bcPlay(BC.i||BC_FIRST);return;}
 if(voice.waiting){armVoice();return;}
 if(BC.el){const current=voice;try{const p=BC.el.play();if(p&&p.catch)p.catch(()=>{if(voice===current)current.wait();});}catch(e){current.wait();}}
}
if(typeof bcPlay==='function'&&typeof bcStart==='function'){
 const stopVoice=bcStop;
 bcStop=function(){voice=null;return stopVoice.apply(this,arguments);};
 bcPlay=function(slot){
  if(!BC.on)return;
  if(!SHOW.playing||document.hidden){if(!voice)voice={};voice.pending=slot;return;}
  const take=bcTurns().find(t=>t.slot===slot);
  if(!take){bcStop();showSchedule();return;}
  clearVoiceTimer();
  if(BC.el){BC.el.onended=BC.el.onerror=null;BC.el.pause();BC.el=null;}
  BC.i=slot;
  const current=voice={pending:null,waiting:false,remaining:Math.max(1200,(take.secs||8)*1000),due:0};
  current.next=()=>{
   if(!BC.on||BC.i!==slot||voice!==current)return;
   BC.ran++;bcPlay(bcNextSlot(slot));
  };
  current.wait=()=>{
   if(!BC.on||BC.i!==slot||voice!==current||current.waiting)return;
   current.waiting=true;armVoice();
  };
  const at=SHOW_ORDER.indexOf(bcScenes()[slot]);
  if(at>=0&&at!==SHOW.i){SHOW.i=at;showRender();}
  const say=$('#showSay');if(say)say.textContent='Scene '+(SHOW.i+1)+' of '+SHOW_ORDER.length+': '+SHOW_TITLE[SHOW_ORDER[SHOW.i]]+'.';
  if(!take.audio){current.wait();return;}
  try{
   const audio=BC.el=new Audio(take.audio);audio.preload='auto';audio.onended=current.next;audio.onerror=current.wait;
   const p=audio.play();if(p&&p.catch)p.catch(current.wait);
  }catch(e){current.wait();}
 };
 const startVoice=bcStart;
 bcStart=function(){
  const result=startVoice.apply(this,arguments);
  if(result){run.finished=false;run.deckComplete=false;SHOW.playing=true;showClear();SHOW.launch=-1;showLaunchStep();resumeBroadcast();showSyncControls();}
  return result;
 };
}

/* Motion Off changes transport directly in the host page. It must also hold
   commentary, and enabling motion again must wait for an explicit Resume. */
const motionChanged=showMotionChanged;
showMotionChanged=function(){
 const result=motionChanged.apply(this,arguments);
 if(SHOW.reduced||!SHOW.open||!SHOW.playing)pauseBroadcast();
 return result;
};

/* The public Day/Night control used to throw away the drive. Keep its live CPU
   state across that synchronous appearance rebuild, as context recovery does. */
const applyBack=showApplyBack;
showApplyBack=function(){
 const before=G.S,back=run.active&&SHOW.open&&before&&G.captureContextState792?G.captureContextState792(before):null;
 sample();
 const result=applyBack.apply(this,arguments),after=G.S;
 if(back&&after&&after!==before&&G.restoreContextState792){
  G.restoreContextState792(after,back);
  after.paused=!SHOW.playing||SHOW.reduced||document.hidden;
  after.last=null;after.needsRender=true;
 }
 sample();return result;
};
})();
