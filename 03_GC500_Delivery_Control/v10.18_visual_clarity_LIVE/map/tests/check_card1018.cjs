/* Author: Andrew Fisher. Compact native card and independently preserved disclosures. */
'use strict';
const fs=require('fs'),path=require('path'),{open}=require('./readonly1018.cjs');let h;
const out=process.env.OUT||'/tmp/private-gc500-visual1018/map/card-phone',report={author:'Andrew Fisher',checks:[]};fs.mkdirSync(out,{recursive:true});
const check=(name,pass,detail)=>report.checks.push({name,pass:!!pass,detail});
(async()=>{try{
 h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',mobile:true,W:390,H:844,dpr:3});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:120000});
 const f=p.frames().find(f=>/\/explorer\/index\.html(?:\?|$)/.test(f.url()));await f.evaluate(()=>GC500Explorer.ready);const saved=await p.evaluate(()=>JSON.stringify(S));await f.evaluate(()=>GC500Explorer.refresh());
 await f.evaluate(()=>{setMode('original');GC500Explorer.find('WC09')});await f.waitForFunction(()=>selected?.code==='WC09'&&!gotoAnim887&&!interacting,null,{timeout:15000});
 const brief=await f.evaluate(()=>({text:$('xcard').innerText,full:$('xcard').textContent,open:$('xcard').querySelector('.map-why1018').open,quantity:mapStatus1009(selected).quantity1010.items}));
 check('Exact partial status and quantities remain visible',brief.text.includes('4/10 installed')&&brief.text.includes('6/6 installed')&&brief.quantity[0].quantity===10,brief.quantity);
 check('Repeated basis is folded under More info',!brief.open&&!brief.text.includes('Received and installed quantities retained')&&brief.full.includes('Received and installed quantities retained'),brief.text);
 await f.locator('#xcard .map-why1018 > summary').click();await f.locator('#xcard .map1010-quantities > summary').click();await f.locator('#xcard .map-why1018 > summary').focus();
 const camera=await f.evaluate(()=>JSON.stringify(camera));
 const refreshed=await f.evaluate(()=>{const orig=window.parent.gc500PlanCard;window.parent.gc500PlanCard=function(code){const info=orig(code);return code==='WC09'?{...info,stage:{...info.stage,why:info.stage.why+' Refresh evidence.'}}:info};try{GC500Explorer.refresh();return {why:$('xcard').querySelector('.map-why1018').open,quantities:$('xcard').querySelector('.map1010-quantities').open,focus:document.activeElement===$('xcard').querySelector('.map-why1018 > summary'),text:$('xcard').innerText}}finally{window.parent.gc500PlanCard=orig;GC500Explorer.refresh()}});
 check('Refresh preserves both disclosures and focus',refreshed.why&&refreshed.quantities&&refreshed.focus&&refreshed.text.includes('Refresh evidence.'),refreshed);
 check('Card refresh preserves camera',await f.evaluate(c=>JSON.stringify(camera)===c,camera));
 await f.evaluate(()=>{$('xcard').querySelectorAll('details').forEach(d=>d.open=false);GC500Explorer.zoom(Math.min(camera.z,Math.pow(2,PYR_MAX)/(fitScale*dpr)));requestPaint()});
 await f.waitForFunction(()=>!interacting&&window.__frames.at(-1)?.vtMiss===0,null,{timeout:90000});
 check('Screenshot drawing tiles fully resolved',await f.evaluate(()=>window.__frames.at(-1).vtMiss===0));
 await p.screenshot({path:path.join(out,'wc09-compact-sharp.png')});
 await f.evaluate(()=>GC500Explorer.find('EP-S7-EW49'));await f.waitForFunction(()=>selected?.reg?.sourceRequest1017,null,{timeout:15000});
 const source=await f.evaluate(()=>({visible:$('xcard').innerText,full:$('xcard').textContent}));check('Source request plan date stays visible and original date folded',source.visible.includes('16 Oct 2026')&&!source.visible.includes('22 Oct 2026')&&source.full.includes('22 Oct 2026'));
 check('No native state changed',await p.evaluate(s=>JSON.stringify(S)===s,saved));check('No operational writes attempted',h.counts.blocked===0);check('No browser errors',h.errors.length===0,h.errors);
}catch(e){report.failure=String(e.stack||e);process.exitCode=1}finally{if(report.checks.some(c=>!c.pass))process.exitCode=1;if(h){report.counts=h.counts;report.errors=h.errors;await h.browser.close()}fs.writeFileSync(path.join(out,'card.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),errors:report.errors,failure:report.failure}));}})();
