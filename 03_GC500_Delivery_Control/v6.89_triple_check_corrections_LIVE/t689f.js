const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});const p=await(await b.newContext({viewport:{width:1400,height:1000}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto(process.argv[2]+'#today',{waitUntil:'load'});await p.waitForTimeout(5000);const o={};
for(const k of ['WC33','WC20','P56','P27','WC69','T0243','P01']){await p.evaluate(k=>openAsset(k),k);await p.waitForTimeout(2500);o[k]=await p.evaluate(()=>{const d=[...document.querySelectorAll('.drawdiff')];return d.map(x=>x.textContent)});}
console.log(JSON.stringify(o,null,1),errs);await b.close();})();
