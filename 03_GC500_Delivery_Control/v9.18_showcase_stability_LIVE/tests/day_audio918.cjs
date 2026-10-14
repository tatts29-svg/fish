// Author: Andrew Fisher. Read-only daylight, audio lifecycle and shadow visibility checks.
const fs=require('fs'),path=require('path'),{open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page.js'));
(async()=>{const s=await open({pageFile:process.env.PAGE,gl:true,mobile:true,W:390,H:844,dpr:1}),p=s.page;
await p.evaluate(()=>{localStorage.setItem('gc500.showback','circuit3d_day');showOpen();});await new Promise(r=>setTimeout(r,8000));
const result=await p.evaluate(()=>{
 const S=GC3D.S;let day=!!(S&&S.look&&S.look.day),shadow=!!(S&&S.sunShadow&&S.sunShadow.ok);
 const prior=S.visibilityVP918;GC3D.updateSunShadow(S);const matrixRestored=S.visibilityVP918===prior;
 showSoundToggle();const audioOn=GC3D.sound.isOn()&&!!GC3D.sound.ctx;showSoundToggle();const audioOff=!GC3D.sound.isOn();
 bcStart();const takes=bcTurns().filter(t=>!!t.audio);bcPlay(takes[0].slot);const a=BC.player918;bcPlay(takes[1].slot);const broadcastReused=!!a&&a===BC.player918;bcStop();const stopped=!BC.on&&(!BC.el||BC.el.paused);
 showPause();return {day,shadow,matrixRestored,audioOn,audioOff,broadcastReused,stopped};
});await p.screenshot({path:process.env.SHOT,timeout:120000});await p.evaluate(()=>showClose());result.audioClosed=await p.evaluate(()=>!GC3D.sound.ctx);result.errors=s.errors;result.writes=s.counts.blocked;
fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2));console.log(JSON.stringify(result));await s.browser.close();if(Object.entries(result).some(([k,v])=>!['errors','writes'].includes(k)&&v!==true)||s.errors.length||s.counts.blocked)process.exit(1);
})().catch(e=>{console.error(e.stack);process.exit(1)});
