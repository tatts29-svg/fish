/* Author: Andrew Fisher. Actual public page, not a local HTML override. Read only. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({mobile:true,W:390,H:844,dpr:3}),p=h.page,checks=[];
const check=(name,ok)=>{checks.push({name,ok:!!ok});assert(ok,name);};
try{await p.waitForFunction(()=>SYNC.status==='live'&&window.Loading1200,null,{timeout:180000});
check('live v12.00 and retained Build/Showcase modules',await p.evaluate(()=>Loading1200.version==='v12.00'&&cards1197.version==='v11.99'&&!!ShowcaseClarity1182&&!!ShowcaseTruck1192&&!!ShowcaseIncident1195));
check('no explorer downloaded behind Today',await p.evaluate(()=>!EXP.frame));
check('all requested search destinations remain findable',await p.evaluate(()=>holdAssets(()=>['fencing','showcase','pre-start','servicing','delivery'].every(q=>finderMatches(q).length>0))));
await p.evaluate(()=>go('docs'));check('Documents opens on actual public page',await p.locator('#pane-docs').isVisible());
await p.evaluate(()=>go('timeline'));check('Build wrapper retained',await p.evaluate(()=>!!BuildCards984.html.__bw1197&&!!timeline846Line.__bw1197));
await p.evaluate(()=>go('today'));await p.waitForTimeout(1000);
check('page fonts loaded',await p.evaluate(()=>document.fonts.status==='loaded'));
check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0);
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.screenshot({path:path.join(process.env.OUT,'live-phone1200.png')});}
console.log(JSON.stringify({author:'Andrew Fisher',checks,errors:h.errors,attemptedWrites:h.counts.blocked}));
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
