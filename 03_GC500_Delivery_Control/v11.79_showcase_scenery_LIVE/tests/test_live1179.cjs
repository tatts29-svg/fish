/* Author: Andrew Fisher. Read-only public release and vehicle smoke check. */
const fs=require('fs'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',out=process.env.OUT;fs.mkdirSync(out,{recursive:true});const checks=[];
function check(name,ok){checks.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);}
(async()=>{const h=await open({gl:true,W:mobile?390:1280,H:mobile?844:800,mobile,dpr:1}),p=h.page;
try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&window.GC3D,null,{timeout:180000});
 const record=await p.evaluate(()=>JSON.stringify(S));
 check('public v11.79 and vehicle source present',await p.evaluate(()=>document.body.innerText.includes('v11.79')&&GC3D.fencingTruck1179?.version===1179));
 await p.evaluate(()=>{GC3D.frame=()=>{};localStorage.setItem('gc500.showback','circuit3d_day');localStorage.setItem('gc500.showvehicle','fencing_truck');showOpen();showPause();});
 await p.waitForFunction(()=>!!(GC3D.S?.cv?.isConnected&&!ShowcaseSmooth1157.state().pending),null,{timeout:180000});
 check('public truck and scenery mounted',await p.evaluate(()=>GC3D.S.vehicle==='fencing_truck'&&GC3D.S.scenery1179.panels>250&&!ShowcaseSmooth1157.state().error));
 check('garage control visible',await p.locator('#seTrig').isVisible());
 for(let frame=0;frame<2;frame++){
  await p.evaluate(()=>{const G=GC3D,Q=G.S;Q.shadowOff=true;Q.reflOff=true;Q.bloom=false;Q.o.ss=1;G.setView('hero');G.camStep(0);G.render();window.liveFence1179=Q.gl.fenceSync(Q.gl.SYNC_GPU_COMMANDS_COMPLETE,0);Q.gl.flush();});
  await p.waitForFunction(()=>GC3D.S.gl.clientWaitSync(liveFence1179,0,0)!==GC3D.S.gl.TIMEOUT_EXPIRED,null,{timeout:180000,polling:200});
  check('public repeated frame '+(frame+1)+' has no graphics error',await p.evaluate(()=>{const gl=GC3D.S.gl;gl.deleteSync(liveFence1179);return gl.getError()===0}));
 }
 check('Day retained in reduced graphics mode',await p.evaluate(()=>GC3D.S.look.day===1&&document.getElementById('showcase').dataset.back==='circuit3d_day'));
 await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-live-truck.png'),timeout:120000});
 await p.evaluate(()=>showClose());
 check('Close releases scene and truck cache',await p.evaluate(()=>!GC3D.S&&!GC3D._fencingTrucks1179&&!ShowcaseSmooth1157.state().pending));
 check('shared record untouched',record===await p.evaluate(()=>JSON.stringify(S)));
 check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0);
}finally{await h.browser.close();fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'.json'),JSON.stringify(checks,null,2));}
console.log(checks.filter(q=>q.ok).length+'/'+checks.length);process.exit(checks.every(q=>q.ok)?0:1);
})().catch(e=>{console.error(e);process.exit(2)});
