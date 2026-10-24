// Author: Andrew Fisher. Read-only viewport/presentation audit; every non-GET is blocked by the shared harness.
const fs=require('fs'),path=require('path');
const {open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
const OUT=process.env.OUT||'/workspace/private-gc500-audit14Oct2026/presentation';
async function inspect(p,tab){return p.evaluate(tab=>{
 const pane=document.querySelector('#pane-'+tab), visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
 function rgb(s){let a=s.match(/[\d.]+/g);return a&&a.length>=3?a.map(Number):null}
 function bg(e){for(;e;e=e.parentElement){let s=getComputedStyle(e),c=rgb(s.backgroundColor);if(c&& (c.length<4||c[3]===1))return c.slice(0,3);}return[255,255,255]}
 function lum(c){let x=c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return x[0]*.2126+x[1]*.7152+x[2]*.0722}
 function info(e){let s=getComputedStyle(e),r=e.getBoundingClientRect(),fg=rgb(s.color),b=bg(e);return{tag:e.tagName,id:e.id,cls:e.className,text:(e.innerText||e.getAttribute('aria-label')||e.value||'').trim().slice(0,90),r:{x:r.x,y:r.y,w:r.width,h:r.height},fg:s.color,bg:b,contrast:fg?(Math.max(lum(fg),lum(b))+.05)/(Math.min(lum(fg),lum(b))+.05):null,font:s.fontSize,disabled:!!e.disabled,opacity:s.opacity,overflow:s.overflowX};}
 const controls=[...pane.querySelectorAll('button,input,select,textarea,summary,a[href]')].filter(visible).map(info);
 const overflow=[...pane.querySelectorAll('*')].filter(visible).filter(e=>{let r=e.getBoundingClientRect();return r.right>innerWidth+2||r.left< -2}).map(info);
 const low=[...pane.querySelectorAll('button,input,select,textarea,summary,th,td,p,small')].filter(visible).filter(e=>e.childElementCount===0||/^(BUTTON|INPUT|SELECT|TEXTAREA|TH|TD)$/.test(e.tagName)).map(info).filter(i=>i.contrast<3&&i.opacity!=='0');
 return{tab,pane:{w:pane.clientWidth,sw:pane.scrollWidth,h:pane.scrollHeight},body:{w:document.body.clientWidth,sw:document.body.scrollWidth},main:info(document.querySelector('main')),controls,overflow,low,headers:[...pane.querySelectorAll('h1,h2,h3,h4')].filter(visible).map(e=>e.innerText),topText:pane.innerText.slice(0,1800)};
 },tab)}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const h=await open({pageFile:process.env.PAGE||'/workspace/private-gc500-audit14Oct2026/live.html',W:390,H:844,mobile:true});let p=h.page,R=[];await p.waitForFunction(()=>typeof go==='function'&&SYNC.status==='live',null,{timeout:150000});await p.waitForTimeout(3000);
 for(const w of [360,390,768,1440]){await p.setViewportSize({width:w,height:w<500?844:1000});for(const tab of ['today','timeline','demob','subhired','costs','fencing']){await p.evaluate(t=>go(t),tab);await p.waitForTimeout(1000);let a=await inspect(p,tab);a.width=w;R.push(a);if(w===360||w===1440)await p.screenshot({path:path.join(OUT,`${w}-${tab}.png`),fullPage:false});fs.writeFileSync(path.join(OUT,'scan.json'),JSON.stringify({results:R,counts:h.counts,errors:h.errors},null,2));}}
 console.log(JSON.stringify({checks:R.length,counts:h.counts,errors:h.errors,summary:R.map(x=>({w:x.width,tab:x.tab,body:x.body,low:x.low.length,overflow:x.overflow.length}))}));await h.browser.close();})().catch(e=>{console.error(e.stack);process.exit(1)});
