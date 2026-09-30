// Author: Andrew Fisher. Post-release verification against the public page; no record writes.
const {open}=require('../../toolchain/harness/open_page');
const {execFileSync}=require('child_process');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
(async()=>{
 const expected='66dc8be2b0536471feafb65b1716ceb2f52a201d0076ba4c1ff02d0c26f50435';
 const bytes=execFileSync('curl',['-fsS','--max-time','90','https://gc500-production.up.railway.app/v/Coates-GC500-2026'],{maxBuffer:16*1024*1024});
 const sha=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(sha,expected);
 const runs=[];
 for(const mobile of [false,true]){
  const rig=await open({W:mobile?390:1440,H:mobile?844:1000,mobile});
  const consoleErrors=[];rig.page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  try{
   const p=rig.page;await p.waitForFunction(()=>typeof supplierGroups744==='function'&&SYNC.status==='live',null,{timeout:180000});
   const result=await p.evaluate(()=>{
    const before=JSON.stringify(S),checks=[];
    const add=(name,pass)=>checks.push({name,pass:!!pass});
    let supplierNumbers=0;
    for(const key of ['WC31','WC41','WC42','WC43','WC81']){
     const numbers=subOf(key).map(x=>String(x.no||'')).filter(Boolean);supplierNumbers+=numbers.length;
     openAsset(key);const d=document.querySelector('#drawer');
     add(key+' shows all recorded supplier numbers',numbers.length>0&&numbers.every(n=>d.textContent.includes(n)));
     add(key+' no false missing-number message',!/No asset number on this one yet/i.test(d.textContent));
     const button=d.querySelector('[data-s744-open]');
     add(key+' entry action present and protected on view link',button&&button.disabled&&/Add sub-hired gear/.test(button.textContent));
    }
    add('Sub-hire register entry action present',/data-s744-pick/.test(subhire744RegisterHtml(true)));
    add('View link remains read-only',SYNC.readonly);
    add('Rendering left shared record unchanged',before===JSON.stringify(S));
    openAsset('WC41');return {checks,supplierNumbers};
   });
   await p.waitForTimeout(750);await p.locator('#drawer .sub744').scrollIntoViewIfNeeded();
   result.checks.push({name:'Drawer fits viewport',pass:await p.locator('#drawer').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=-1&&r.right<=innerWidth+1&&e.scrollWidth<=e.clientWidth+1;})});
   await p.screenshot({path:path.join(__dirname,mobile?'live_subhire_phone.png':'live_subhire_desktop.png'),animations:'disabled'});
   result.checks.push({name:'No page or console errors',pass:rig.errors.length===0&&consoleErrors.length===0},{name:'No record-write attempts',pass:rig.counts.blocked===0});
   assert(result.checks.every(x=>x.pass),JSON.stringify(result.checks.filter(x=>!x.pass)));
   runs.push({mobile,...result,errors:rig.errors,consoleErrors,counts:rig.counts});
  }finally{await rig.browser.close();}
 }
 const output={author:'Andrew Fisher',version:'v7.44',verified_at_utc:new Date().toISOString(),served_sha256:sha,served_bytes:bytes.length,served_tested_build:true,runs};
 fs.writeFileSync(path.join(__dirname,'live_smoke.json'),JSON.stringify(output,null,2)+'\n');
 console.log(JSON.stringify({served_tested_build:true,runs:runs.map(r=>({mobile:r.mobile,passed:r.checks.length,supplierNumbers:r.supplierNumbers,pageErrors:r.errors.length,consoleErrors:r.consoleErrors.length,recordWriteAttempts:r.counts.blocked}))}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
