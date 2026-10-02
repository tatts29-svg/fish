/* Author: Andrew Fisher. Actual hosted non-3D completion and replay; read only. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{open}=require('../../toolchain/harness/open_page');
const pageFile=path.resolve(__dirname,'../../build/GC500_v7.94/GC500_Delivery_Control_hosted.html');
const result={author:'Andrew Fisher',candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),checks:[],errors:[]};
const check=(name,pass,detail)=>{result.checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name);};
(async()=>{let s;try{
 s=await open({pageFile,W:390,H:844,mobile:true,gl:false,dpr:1});const p=s.page;
 await p.waitForFunction(()=>typeof showOpen==='function'&&GC3D.playback794&&SYNC.status==='live',null,{timeout:180000});
 await p.evaluate(()=>{localStorage.setItem('gc500.showback','black');showOpen();SHOW.launch=-1;SHOW.i=SHOW_ORDER.length-1;SHOW.playing=true;SHOW_HOLD[SHOW_ORDER[SHOW.i]]=30;showRender();});
 await p.waitForFunction(()=>GC3D.playback794.report().finished,null,{timeout:20000});
 const completed=await p.evaluate(()=>({state:document.getElementById('showState').textContent,button:document.getElementById('showPause').textContent,report:GC3D.playback794.report(),scene:!!GC3D.S,mapHidden:document.getElementById('showLap794').hidden}));
 check('non-3D completion does not claim a completed lap',completed.state==='Figures complete · paused'&&completed.report.progress===0&&!completed.scene&&completed.mapHidden,completed);
 check('completed figure show offers Replay',completed.button==='Replay');
 await p.click('#showPause');
 const replay=await p.evaluate(()=>({i:SHOW.i,playing:SHOW.playing,report:GC3D.playback794.report()}));
 check('Replay restarts figure deck with no false lap progress',replay.i===0&&replay.playing&&!replay.report.finished&&replay.report.progress===0,replay);
 await p.evaluate(()=>showClose());
 check('close hides Showcase',await p.locator('#showcase').isHidden());
 result.errors=s.errors;result.blockedWrites=s.counts.blocked;
 check('no page errors or record writes',!result.errors.length&&!result.blockedWrites);result.complete=true;
 console.log(JSON.stringify({passed:result.checks.length,candidate:result.candidateSha256}));
 }catch(e){result.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{if(s)await s.browser.close();fs.writeFileSync(path.join(__dirname,'fallback794_checks.json'),JSON.stringify(result,null,2)+'\n');}})();
