// Author: Andrew Fisher. Unchanged navigation sweep, then capture the changed By group body in the same browser.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const harness=require('../../toolchain/harness/open_page'),originalOpen=harness.open;
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),wait=ms=>new Promise(r=>setTimeout(r,ms));
harness.open=async args=>{
 const s=await originalOpen(args),close=s.browser.close.bind(s.browser);
 s.browser.close=async()=>{
  try{
   const p=s.page,mobile=!!process.env.MOB,root='/workspace/private-v807-final-35024d43';
   await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});
   await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{const cancel=document.querySelector('#drv782 .b-no');if(cancel)cancel.click();folds795().clear();go('today');});await wait(1600);
   if(await p.locator('#drv782').count())throw Error('Driver preflight still obscures the requested body capture');
   const shots=[];
   for(const part of ['top','bottom']){
    await p.evaluate(part=>{const box=document.querySelector('#pane-progress .groups:not(.branches)'),m=$('main');
     if(part==='top'){const heading=box.previousElementSibling;m.scrollTop+=heading.getBoundingClientRect().top-m.getBoundingClientRect().top-12;}
     else m.scrollTop+=box.getBoundingClientRect().bottom-m.getBoundingClientRect().bottom+12;
    },part);await wait(350);
    const file=path.join(root,`candidate807-by-group-${mobile?'phone':'desktop'}-${part}.png`);await p.screenshot({path:file});shots.push({path:file,sha256:sha(fs.readFileSync(file))});
   }
   fs.writeFileSync(path.join(__dirname,`by_group807_${mobile?'phone':'desktop'}.json`),JSON.stringify({author:'Andrew Fisher',candidateSha256:sha(fs.readFileSync(process.env.PAGE)),mobile,captureMode:process.env.GC500807_CAPTURE_ONLY?'Focused body retake; full sweep separately passed':'After full sweep in the same browser',screenshots:shots,errors:s.errors,requests:s.counts},null,2)+'\n');
   if(s.errors.length||s.counts.blocked)throw Error('Sweep/body capture produced errors or attempted service writes');
  }finally{await close();}
 };
 return s;
};
if(process.env.GC500807_CAPTURE_ONLY){const mobile=!!process.env.MOB;harness.open({pageFile:process.env.PAGE,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?2:1,mobile,gl:false}).then(s=>s.browser.close()).catch(e=>{console.error(String(e));process.exitCode=1;});}
else require('../../toolchain/harness/sweep');
