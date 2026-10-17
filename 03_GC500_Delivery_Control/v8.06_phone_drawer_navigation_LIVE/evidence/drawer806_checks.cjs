// Author: Andrew Fisher. Actual reference drawers; no service writes or external Maps request.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE || path.resolve(__dirname,'../../build/GC500_v8.06/GC500_Delivery_Control_hosted.html');
const out=process.env.OUT || path.dirname(__filename);fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex'),runs:[]};
(async()=>{
 for(const width of [320,390,430,1440]){
  const h=await open({pageFile,W:width,H:width<721?844:1000,mobile:width<721}),r={width,checks:[],references:[]},ck=(name,pass)=>r.checks.push({name,pass:!!pass});result.runs.push(r);
  try{
   await h.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await h.page.evaluate(()=>document.fonts.ready);
   const cases=await h.page.evaluate(()=>{
    const all=allAssets().map(a=>{const t=document.createElement('template');t.innerHTML=navBtn(a);const n=t.content.querySelector('a.navbtn'),p=t.content.querySelector('.navpinned');return {key:a.key,href:n&&n.href,label:p&&p.textContent};});
    const long=all.filter(x=>x.href).sort((a,b)=>(b.label || '').length-(a.label || '').length)[0],plain=all.find(x=>!x.label);
    return {keys:[...new Set(['WC31','WC20','P55',long&&long.key,plain&&plain.key].filter(Boolean))],long,plain};
   });r.cases=cases;
   const measure=()=>h.page.locator('#drawer .dh').evaluate(e=>{
    const take=()=>{
    const box=x=>{if(!x)return null;const r=x.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}},nav=e.querySelector('.navbtn'),short=e.querySelector('.sub .shortchip'),n=box(nav),s=box(short),a=box(e.querySelector('.dhacts'));
    return {header:box(e),nav:n,short:s,actions:a,text:e.innerText,href:nav&&nav.href,target:nav&&nav.target,overlap:!!(n&&s&&s.width&&n.x<s.right&&n.right>s.x&&n.y<s.bottom&&n.bottom>s.y),labelBoxes:nav?[...nav.children].filter(x=>!x.classList.contains('vh')).map(x=>({text:x.textContent,...box(x)})):[]};};
    const sheet=document.getElementById('drawer-navigation806').sheet;sheet.disabled=true;const before=take();sheet.disabled=false;const after=take();return {before,after};
   });
   for(const key of cases.keys){
    await h.page.evaluate(k=>openAsset(k),key);await h.page.waitForFunction(()=>Math.abs(document.querySelector('#drawer').getBoundingClientRect().right-innerWidth)<1&&document.querySelector('#drawer .dh').offsetWidth>0);
    const {before,after}=await measure();r.references.push({key,before,after});
    ck(key+': native navigation URL and target unchanged',before.href===after.href&&(!after.nav||after.target==='_blank'));
    ck(key+': SHORT is clear of Navigate',!after.overlap);
    if(width<721)ck(key+': Navigate stays inside its action column',!after.nav || after.nav.x>=after.actions.x-1&&after.nav.right<=after.actions.right+1);
    ck(key+': visible button labels stay inside Navigate',after.labelBoxes.every(x=>x.x>=after.nav.x-1&&x.right<=after.nav.right+1));
    ck(key+': drawer header stays within viewport',after.header.x>=-1&&after.header.right<=width+1);
    if(width===390&&key==='WC31')ck('WC31: existing390px header height retained',Math.abs(before.header.height-after.header.height)<1);
    if(width===1440)ck(key+': desktop geometry unchanged',JSON.stringify(before)===JSON.stringify(after));
    if(key==='WC31'||key===cases.long.key||cases.plain&&key===cases.plain.key)await h.page.screenshot({path:path.join(out,'drawer806-'+width+'-'+key+'.png')});
    if(key==='WC31'){
     let captured=null;const href=after.href;
     await h.page.context().route(u=>u.href===href,async route=>{captured={url:route.request().url(),method:route.request().method()};await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Navigation target captured for review</title>'});});
     const popup=await Promise.all([h.page.waitForEvent('popup'),h.page.locator('#drawer .dh .navbtn').click()]).then(x=>x[0]);await popup.waitForLoadState('domcontentloaded');ck('WC31: actual Navigate opens the unchanged native Maps URL',captured&&captured.method==='GET'&&captured.url===href);await popup.close();
    }
   }
   r.errors=h.errors;r.requests=h.counts;ck('No page errors or service-write attempts',!h.errors.length&&!h.counts.blocked);
  }finally{await h.browser.close();fs.writeFileSync(path.join(out,'drawer806_checks.json'),JSON.stringify(result,null,2)+'\n');}
 }
 console.log(JSON.stringify(result));if(result.runs.some(r=>r.checks.some(c=>!c.pass)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
