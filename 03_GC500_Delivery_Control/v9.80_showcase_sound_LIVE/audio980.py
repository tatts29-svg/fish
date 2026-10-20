# Author: Andrew Fisher. Source-only sound correction; shared records are untouched.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as strict_rep

def rep(s, old, new):
    return strict_rep(s, old, new, 'Showcase sound v9.80', __file__)

def section(s, first, last, replacement):
    if s.count(first) != 1 or s.count(last) != 1:
        raise ValueError('Unexpected audio section boundaries')
    old = s[s.index(first):s.index(last, s.index(first))]
    return rep(s, old, replacement)

def apply_audio980(s):
    if 'SND.lastDrive980' in s:
        raise ValueError('Showcase sound v9.80 already applied')
    if 'v9.74 — engine load follows tyre spin' not in s:
        raise ValueError('Expected live v9.74 audio base')
    s = rep(s, "const LOOPS=[['engine_lo',1300,[0,1300,3000,3700]],['engine_mid',4000,[2500,3500,5200,5900]],['engine_hi',6800,[4700,5700,9000,9000]]];", """/* v9.80 — generated loops provide a restrained body beneath the live firing/exhaust texture.
 Narrower crossfades avoid stretching the low idle recording into the midrange. */
const LOOPS=[['engine_lo',1300,[0,1300,1700,2700]],['engine_mid',4000,[1600,2600,4200,5500]],['engine_hi',6800,[3900,5100,9000,9000]]];""")
    s = section(s, 'SND.autoMode=function(){', 'function crowdStart(t){', """/* Engine/loops share the running firing source. Decoding a loop must not stop the engine. */
function mode980(want){
 const next=want==='loops'&&!loopsReady()?'engine':want,previous=SND.mode;
 if(next===previous)return;
 if(previous==='clips'||next==='clips')engineStop();
 SND.mode=next;
 if(next==='loops'&&SND.nodes.engine)loopsStart980(now());
 else if(next!=='loops')loopsStop980(now());
 log('mode '+next);
}
SND.autoMode=function(){if(SND.mode==='clips')return;mode980(SND.modePref());};
SND.setMode=function(m){const want=m==='clips'?'clips':m==='loops'?'loops':'engine';
 try{if(want!=='clips')localStorage.setItem('gc500.showengine',want);}catch(e){}
 mode980(want);
};
function loopsStart980(t){
 if(SND.nodes.loops||!loopsReady()||!SND.ctx)return;
 const ctx=SND.ctx;
 SND.nodes.loops=LOOPS.map(L=>{const src=ctx.createBufferSource(),g=ctx.createGain();
 src.buffer=SND.bufs[L[0]];src.loop=true;src.playbackRate.value=Math.max(.35,SND.rpm/L[1])*(SND.vRate||1);
 g.gain.value=0;src.connect(g);g.connect(SND.nodes.lp);src.start(t);
 return {src,g,name:L[0],native:L[1],win:L[2]};});
 log('generated body layers start',null,t);
}
function loopsStop980(t){
 if(!SND.nodes.loops)return;
 SND.nodes.loops.forEach(L=>{try{L.src.stop(t);L.src.disconnect();L.g.disconnect();}catch(e){}});
 SND.nodes.loops=null;
}
""")
    s = section(s, 'function pulseBuffer(ctx){', '/* v5.44 — THE EXHAUST, AS A PIPE RATHER THAN AS THREE FILTERS.', """function pulseBuffer(ctx){
 /* v9.80 — combustion keeps the cross-plane bank order with small cycle-to-cycle variation.
 The mean cycle length is exact; the long wrapped buffer avoids a short mechanical drone. */
 const sr=ctx.sampleRate,cyc=Math.round(sr*120/R0),cycles=64,N=cyc*cycles;
 const A=new Float32Array(N),B=new Float32Array(N),rnd=G.rng(26),BANK=[0,1,0,1,1,0,1,0];
 const lengths=[],trim=[];let total=0;
 for(let c=0;c<cycles;c++){const q=1+(rnd()-.5)*.028;lengths.push(q);total+=q;}
 for(let k=0;k<8;k++)trim.push(1+(rnd()-.5)*.10);
 const puffN=Math.max(2,Math.round(sr*.00009)),tailN=Math.round(sr*.0045);let phase=0;
 for(let c=0;c<cycles;c++){
  const span=lengths[c]*N/total;
  for(let k=0;k<8;k++){
   const bank=BANK[k],d=bank?B:A,amp=trim[k]*(bank?.92:1)*(1+(rnd()-.5)*.24);
   const j0=Math.round(phase+k*span/8+(rnd()-.5)*sr*.00010);
   for(let i=0;i<puffN;i++){const w=Math.sin(Math.PI*i/puffN);d[((j0+i)%N+N)%N]+=w*w*amp;}
   /* A pressure pulse has a short turbulent tail, not only a perfectly pitched impulse.
   This texture is gated by each cylinder firing; there is no continuous added noise bed. */
   let rough=0;
   for(let i=0;i<tailN;i++){rough=.45*rough+.55*(rnd()*2-1);d[((j0+i)%N+N)%N]+=.8*amp*rough*Math.exp(-i/(sr*.0012));}
  }
  phase+=span;
 }
 const buf=ctx.createBuffer(2,N,sr);buf.copyToChannel(A,0);buf.copyToChannel(B,1);return buf;
}
""")
    s = rep(s, 'tau=MODES[m][1];', 'tau=MODES[m][1]*(MODES[m][0]<700?.58:.86); /* shorter exhaust tails retain individual firing texture */')
    s = rep(s, 'st.prevEye=null;st.dop=0;st.lastT=-1;', 'st.prevEye=null;st.dop=0;st.lastT=-1;st.tickedAt=-1;SND.lastDrive980=null;')
    s = section(s, 'function engineStart(S,t){', 'function engineStop(t){', """function engineStart(S,t){
 if(SND.nodes.engine)return;
 if(SND.mode==='clips'){const b=SND.bufs.engine;if(!b){if(!SND.st.noEngine){SND.st.noEngine=true;log('engine (no clip)',S,t);}return;}
 const src=SND.ctx.createBufferSource();src.buffer=b;src.loop=true;src.playbackRate.value=SND.rate;src.connect(SND.nodes.lp);src.start(t);SND.nodes.engine=src;log('engine start (clip)',S,t);return;}
 const ctx=SND.ctx;crowdStart(t);
 const src=ctx.createBufferSource();src.buffer=SND.bufs.pulse;src.loop=true;src.playbackRate.value=SND.rpm/R0*(SND.vRate||1);src.connect(SND.nodes.pulseIn);src.start(t);SND.nodes.engine=src;
 const n=ctx.createBufferSource();n.buffer=SND.bufs.noise;n.loop=true;n.connect(SND.nodes.intakeBp);n.start(t);SND.nodes.intake=n;
 const sc=ctx.createBufferSource();sc.buffer=SND.bufs.noise;sc.loop=true;sc.connect(SND.nodes.scrubBp);sc.start(t);SND.nodes.scrub=sc;
 if(SND.mode==='loops')loopsStart980(t);
 log('engine start (live cross-plane exhaust)',S,t);
}
""")
    s = section(s, 'function revs(S,t){', '/* called once a frame by the adapter while sound is on;', """function revs(S,t){
 const m=S.sim,st=SND.st,v=Math.max(0,m.v),clock=S.clock,clamp=x=>Math.max(0,Math.min(1,x));
 const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 if(!m.go){
  SND.gear=0;
  const ready=ease((clock-(G.GRID-.65))/.65),settled=ease(clock/.6);
  return {rpm:IDLE+200*settled+1050*ready+20*Math.sin(clock*3),thr:.12+.10*settled+.17*ready,spin:clamp(m.wheelspin||m.burn||0),braking:false,cut:false};
 }
 if(!st.go){st.go=true;st.goAt=clock;SND.gear=0;st.lastShiftAt=m.shiftAt;log('go — clutch',S,t);}
 const tc=Math.max(.01,Number(S.tune.tc)||1),kmh=v*(G.M_PER_PT||5.9376)*3.6/tc;
 const spin=clamp(Number.isFinite(m.wheelspin)?m.wheelspin:(Number.isFinite(m.spin)?m.spin:(m.burn||0)));
 const braking=(m.brake>.12&&!(Number.isFinite(m.accel)&&m.accel>0))||(Number.isFinite(m.accel)&&m.accel<-.05);
 const roadLoad=.16+.30*Math.pow(clamp(v/Math.max(.01,S.tune.vmax)),2);
 const acceleration=Number.isFinite(m.throttle)?clamp(m.throttle):(S.vAt(m.s+1.5)>v+.3?1:roadLoad);
 let thr=braking?0:Math.max(roadLoad,acceleration),rpm;
 if(m.rpm==null){
  /* Fixed gear ratios, with an upshift below the limiter and downshift hysteresis. */
  const ratio=[70,105,145,188,228,270];let gear=Math.max(0,Math.min(5,SND.gear||0));
  while(gear<5&&6500*kmh/ratio[gear]>5800)gear++;
  while(gear>0&&6500*kmh/ratio[gear]<3200)gear--;
  if(gear!==SND.gear){
   if(gear>SND.gear){st.cutUntil=clock+.10;log('shift up to '+(gear+1),S,t);}
   else{st.blipUntil=clock+.075;log('shift down to '+(gear+1)+' (blip)',S,t);}
   SND.gear=gear;
  }
  rpm=Math.max(IDLE,6500*kmh/ratio[gear]);
  const physicalAge=Math.max(0,Number.isFinite(m.launchRealAge980)?m.launchRealAge980:(clock-G.GRID)*tc);
  const launch=Number.isFinite(m.launch980)?clamp(m.launch980):1-ease(physicalAge);
  /* Clutch slip carries the held grid revs into the moving engine, rather than dropping to idle. */
  const released=ease((physicalAge-1)/.6),clutch=2200+350*launch;
  rpm=Math.max(rpm,clutch+(IDLE-clutch)*released);
  if(released===1&&spin>0)rpm+=Math.min(450,spin*450);
 }else{
  if(m.shiftAt!==st.lastShiftAt){st.lastShiftAt=m.shiftAt;
   if(m.shift==='up'){st.cutUntil=clock+.10;log('shift up to '+(m.gear+1),S,t);}
   else if(m.shift==='blip'){st.blipUntil=clock+.075;log('shift down to '+(m.gear+1)+' (blip)',S,t);}
  }
  SND.gear=Math.max(0,Math.min(5,Number(m.gear)||0));rpm=m.rpm;
 }
 const cut=clock<st.cutUntil;
 if(cut)thr=.025;
 else if(clock<st.blipUntil)thr=Math.max(thr,.72);
 if(!Number.isFinite(rpm))rpm=IDLE;
 rpm=Math.max(IDLE,Math.min(6600,LIMIT,rpm));
 return {rpm,thr,spin,braking,cut};
}
""")
    s = rep(s, 'const r=revs(S,ta);SND.rpm=r.rpm;SND.thr=r.thr;', 'const r=revs(S,ta);SND.rpm=r.rpm;SND.thr=r.thr;SND.lastDrive980={...r,gear:SND.gear};')
    s = rep(s, 'const gain=near*calm*.62*(.55+.45*r.thr);SND.engineGain=gain;', 'const gain=near*calm*.62*(.50+.50*r.thr)*(r.cut?.24:1);SND.engineGain=gain;')
    s = section(s, " SND.rate=(r.rpm/R0)*(1+dop)*(SND.vRate||1);", ' /* v6.51 - the crowd:', """ SND.rate=(r.rpm/R0)*(1+dop)*(SND.vRate||1);
 set(SND.nodes.engine.playbackRate,SND.rate,ta,.025);
 set(SND.nodes.pulseIn.gain,(SND.mode==='loops'?.84:1)*(.66+.34*r.thr),ta,.045);
 if(SND.nodes.loops){const ws=SND.nodes.loops.map(L=>loopWeight(r.rpm,L.win)),sw=ws.reduce((a,b)=>a+b,0)||1;
 SND.nodes.loops.forEach((L,i)=>{
  set(L.src.playbackRate,(r.rpm/L.native)*(1+dop)*(SND.vRate||1),ta,.025);
  set(L.g.gain,.20*Math.sqrt(ws[i]/sw)*(.62+.38*r.thr),ta,.065);
 });}
""")
    s = rep(s, 'set(SND.g.engine.gain,gain,ta);if(SND.nodes.pan)set(SND.nodes.pan.pan,pan,ta);', 'set(SND.g.engine.gain,gain,ta,r.cut?.015:.045);if(SND.nodes.pan)set(SND.nodes.pan.pan,pan,ta);')
    return s
