/* Author: Andrew Fisher. Read-only smoke check of the published Showcase. */
const fs=require('fs'),path=require('path');const {open}=require('../../toolchain/harness/open_page');
(async()=>{const mob=process.env.MOB==='1',out=process.env.OUT||'/tmp/gc500-1174-live';fs.mkdirSync(out,{recursive:true});
const h=await open({W:mob?390:1440,H:mob?844:900,mobile:mob,dpr:mob?2:1,gl:true});const p=h.page,checks=[];
const check=(name,ok)=>{checks.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);};
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live',null,{timeout:180000});
 const before=await p.evaluate(()=>JSON.stringify(S));
 check('live version and performance repair present',await p.evaluate(v=>document.body.innerText.includes(v)&&!!window.ShowcaseSmooth1157&&!!window.ShowcaseGPU1174&&typeof ShowcaseQuick1143.fallback==='function',process.env.EXPECT_VERSION||'v11.74'));
 const state=await p.evaluate(()=>{localStorage.removeItem('gc500.showback');localStorage.removeItem('gc500.show3d.mount');showOpen();const started=ShowcaseSmooth1157.state().pending,hidden=getComputedStyle(document.querySelector('.app')).display==='none';showClose();return {started,hidden,cancelled:!ShowcaseSmooth1157.state().pending&&!GC3D.S,restored:getComputedStyle(document.querySelector('.app')).display!=='none'};});
 check('opening starts interruptible 3D preparation',state.started&&state.hidden);
 check('closing cancels and restores the dashboard',state.cancelled&&state.restored);
 await p.evaluate(()=>{localStorage.setItem('gc500.showback','circuit');showOpen();showMove(1);showPause();});
 check('navigation and pause respond',await p.evaluate(()=>SHOW.i===1&&!SHOW.playing));
 await p.screenshot({path:path.join(out,(mob?'phone':'desktop')+'.png'),timeout:60000});
 await p.evaluate(()=>showClose());
 check('record untouched',before===await p.evaluate(()=>JSON.stringify(S)));
 check('no errors or attempted writes',h.errors.length===0&&h.counts.blocked===0);
}finally{await h.browser.close();}
fs.writeFileSync(path.join(out,(mob?'phone':'desktop')+'.json'),JSON.stringify(checks,null,2));console.log(checks.filter(x=>x.ok).length+'/'+checks.length);process.exit(checks.every(x=>x.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
