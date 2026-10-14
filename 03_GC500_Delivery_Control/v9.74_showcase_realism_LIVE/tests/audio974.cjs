/* Author: Andrew Fisher. Offline Web Audio proof; synthetic audio, no live writes. */
const fs=require('fs'), assert=require('assert'), {chromium}=require('playwright');
(async()=>{
 const src=fs.readFileSync(process.env.PAGE,'utf8'),start=src.indexOf("const KEY='gc500.showsound'"),end=src.indexOf('\n})();',start);
 assert(start>0&&end>start);let audio=src.slice(start,end);
 // Expose the unchanged private RPM function only in this isolated test document.
 audio+='\nSND.testRevs=revs;';
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('http://audio.test/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<html><body></body></html>'}));await p.goto('http://audio.test/');
 const loops=process.env.LOOPS?JSON.parse(fs.readFileSync(process.env.LOOPS,'utf8')):null;
 const result=await p.evaluate(async({audio,loops})=>{
 const rng=seed=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 window.GC3D={M_PER_PT:5.937552372855356,IDLE:1300,REDLINE:7500,LIMIT:7150,GRID:3.5,rng,OPENING:['chase'],SHOTS:[['chase']],BLEND:1,smooth:x=>x};
 const G=window.GC3D;eval("(function(){'use strict';const G=window.GC3D;"+audio+'})();');
 const snd=G.sound,ctx=new OfflineAudioContext(2,48000*7,48000);const offInitially=!snd.active&&!snd.ctx;snd.ctxFactory=()=>ctx;snd.on();
 if(loops){for(const [k,v] of Object.entries(loops)){const bytes=Uint8Array.from(atob(v.data),c=>c.charCodeAt(0));snd.bufs[k]=await ctx.decodeAudioData(bytes.buffer);}snd.autoMode();}
 const S={sim:{go:false,v:0,burn:0,slip:0,brake:0,rpm:1300,gear:0,shiftAt:-1},clock:0,tune:{tc:1,vmax:9.590557,carS:3.4},pose:{pos:[0,0,0],fwd:[1,0,0]},cam:null,shotI:0,camT:9,vAt:()=>20};
 const cases=[];
 for(const burn of [0,.25,1]){S.sim.burn=burn;S.clock=2;cases.push({burn,...snd.testRevs(S,0)});}
 S.sim.go=true;S.sim.burn=0;S.sim.rpm=2600;cases.push({name:'launch_no_spin',...snd.testRevs(S,0)});
 S.sim.wheelspin=.5;cases.push({name:'wheelspin_coupled',...snd.testRevs(S,0)});S.sim.wheelspin=0;
 const trace=[];delete S.sim.rpm;for(let i=0;i<420;i++){let t=i/60;S.clock=t;S.sim.go=t>=2;S.sim.burn=t>.9&&t<1.5?.2:0;S.sim.v=t>=2?Math.min(9.590557,(t-2)*1.322):0;S.sim.gear=t>=4?1:0;S.sim.shiftAt=t>=4?4:-1;S.sim.shift='up';snd.tick(S,t);if(i%6===0)trace.push({t,rpm:snd.rpm,gear:snd.gear});}
 const buffer=await ctx.startRendering();const a=Array.from(buffer.getChannelData(0));let peak=0,sum=0,finite=true;for(const x of a){peak=Math.max(peak,Math.abs(x));sum+=x*x;finite=finite&&Number.isFinite(x);}
 const previousContext=snd.ctx;snd.off();const offAfter=!snd.active&&!snd.nodes.engine;snd.on();const reusedContext=snd.ctx===previousContext;snd.off();return {offAfter,reusedContext,cases,peak,rms:Math.sqrt(sum/a.length),finite,active:snd.isOn(),mode:snd.mode,offInitially,trace,log:snd.log,a,sr:buffer.sampleRate};
 },{audio,loops});
 assert(!errors.length,errors.join('\n'));assert(result.finite);assert(result.peak>0&&result.peak<1);assert(result.rms>.001);assert(result.offInitially);assert(result.offAfter);assert(result.reusedContext);if(!process.env.BASELINE){assert(result.cases[0].rpm<2300);assert(result.cases[2].rpm<4500);assert.equal(result.cases[3].rpm,2600);assert.equal(result.cases[3].spin,0);assert.equal(result.cases[4].rpm,2600);assert.equal(result.cases[4].spin,.5);assert(!result.log.some(x=>x.what==='wheelspin'));}
 const samples=result.a,buf=Buffer.alloc(44+samples.length*2);buf.write('RIFF',0);buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(result.sr,24);buf.writeUInt32LE(result.sr*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(samples.length*2,40);samples.forEach((x,i)=>buf.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+i*2));
 fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(process.env.OUT+'/v8_974.wav',buf);delete result.a;fs.writeFileSync(process.env.OUT+'/audio974.json',JSON.stringify({...result,errors,checks:13},null,2));console.log(JSON.stringify({checks:13,peak:result.peak,rms:result.rms,errors}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
