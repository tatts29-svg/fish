// Author: Andrew Fisher. Native traffic selector contrast against the real page stylesheet; offline, no data writes.
// Run under flock /tmp/gc500-browser.lock with PAGE=current build and optional EVIDENCE_DIR.
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const base=fs.readFileSync(process.env.PAGE,'utf8'),css=fs.readFileSync(path.join(__dirname,'traffic908.css'),'utf8');
const styles=[...base.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage(),checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>r.abort());
 await p.setContent('<!doctype html><html><head></head><body><main id="pane-timeline"><div class="ld tl846"><div class="tl846-controls"><details class="loading872 traffic903" open><summary>Traffic control · To confirm</summary><div class="traffic903-body"><label>Traffic control<select data-traffic903-status><option value="unknown">To confirm</option><option value="not_required">Not required</option><option value="required">Required</option><option value="arranged">Arranged</option></select></label><button type="button" class="btn" data-traffic903-save>Save traffic control</button></div></details></div></div><select id="outside"><option>Other field</option></select></main></body></html>');
 await p.addStyleTag({content:styles});const before=await p.locator('#outside').evaluate(e=>({colour:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));await p.addStyleTag({content:css+'\n.traffic903 .btn[data-traffic903-save]{transition:none}'});
 for(const theme of ['light','dark'])for(const width of [390,1440]){
  await p.emulateMedia({colorScheme:theme});await p.setViewportSize({width,height:844});
  const result=await p.evaluate(()=>{
   const el=document.querySelector('.traffic903 select'),linear=x=>{x/=255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)},luma=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number).map(linear);return .2126*c[0]+.7152*c[1]+.0722*c[2]},contrast=(a,b)=>{const x=luma(a),y=luma(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)},reading=e=>{const s=getComputedStyle(e);return {fg:s.color,bg:s.backgroundColor,ratio:contrast(s.color,s.backgroundColor)}};
   el.disabled=false;const active=reading(el),options=[...el.options].map(reading),scheme=getComputedStyle(el).colorScheme;el.disabled=true;const disabled=reading(el);el.disabled=false;
   const button=document.querySelector('[data-traffic903-save]'),buttonActive=reading(button);button.disabled=true;const buttonDisabled=reading(button);button.disabled=false;const box=el.getBoundingClientRect(),o=document.getElementById('outside');return {active,options,disabled,scheme,buttonActive,buttonDisabled,fits:box.left>=0&&box.right<=innerWidth&&box.height>=44,values:[...el.options].map(o=>[o.value,o.textContent]),outside:{colour:getComputedStyle(o).color,bg:getComputedStyle(o).backgroundColor}};
  });
  checks.push({name:theme+' '+width+': selected text, all options and disabled value exceed 4.5:1',pass:result.active.ratio>=4.5&&result.options.every(x=>x.ratio>=4.5)&&result.disabled.ratio>=4.5,ratios:{active:result.active.ratio,options:result.options.map(x=>x.ratio),disabled:result.disabled.ratio}});
  checks.push({name:theme+' '+width+': native save button text exceeds 4.5:1 enabled and disabled',pass:result.buttonActive.ratio>=4.5&&result.buttonDisabled.ratio>=4.5,ratios:{active:result.buttonActive.ratio,disabled:result.buttonDisabled.ratio}});
  checks.push({name:theme+' '+width+': native dark menu and field fit',pass:result.scheme==='dark'&&result.fits});
  checks.push({name:theme+' '+width+': four simple statuses unchanged',pass:JSON.stringify(result.values)===JSON.stringify([['unknown','To confirm'],['not_required','Not required'],['required','Required'],['arranged','Arranged']])});
  if(theme==='light')checks.push({name:theme+' '+width+': unrelated selector unaffected',pass:JSON.stringify(result.outside)===JSON.stringify(before)});
 }
 await p.setViewportSize({width:390,height:844});await p.emulateMedia({colorScheme:'light'});
 if(process.env.EVIDENCE_DIR){fs.mkdirSync(process.env.EVIDENCE_DIR,{recursive:true});const field=p.locator('.traffic903');await field.screenshot({path:path.join(process.env.EVIDENCE_DIR,'traffic-closed-390.png')});await p.locator('.traffic903 select').evaluate(e=>e.size=4);await field.screenshot({path:path.join(process.env.EVIDENCE_DIR,'traffic-options-390.png')});}
 checks.push({name:'no runtime errors',pass:!errors.length});if(process.env.EVIDENCE_DIR)fs.writeFileSync(path.join(process.env.EVIDENCE_DIR,'result.json'),JSON.stringify({checks,errors},null,2));checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
