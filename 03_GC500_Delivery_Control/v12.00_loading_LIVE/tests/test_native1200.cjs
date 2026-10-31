/* Author: Andrew Fisher. Read-only behaviour, freshness, media and independent P&L checks. */
const fs=require('fs'),assert=require('assert'),path=require('path'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mobile=process.env.MOB==='1',h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?3:1}),p=h.page,checks=[];
const check=(name,ok)=>{checks.push({name,ok:!!ok});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
try{
 await p.waitForFunction(()=>SYNC.status==='live',null,{timeout:180000});
 check('no hidden explorer loaded at startup',await p.evaluate(()=>!EXP.frame&&!document.getElementById('expFrame')));
 check('idle warm cannot start hidden map',await p.evaluate(()=>{expWarm();return !EXP.frame;}));
 const fresh=await p.evaluate(()=>{
  const original={q:state.q,day:state.day,epoch:REC_EPOCH1066,files:DOCS.files,record:S};const out={};
  const read=()=>holdAssets(()=>finderIndex());
  try{Loading1200.clearFinder();const a=read();state.q='a different query';out.query=read()===a;
   REC_EPOCH1066++;const b=read();out.epoch=b!==a;out.stable=read()===b;
   DOCS.files={...DOCS.files};const c=read();out.documents=c!==b;
   state.day='2099-01-01';const d=read();out.view=d!==c;
   S={...S};const e=read();out.record=e!==d;
   out.results=holdAssets(()=>['fencing','showcase','pre-start','servicing','delivery'].every(q=>finderMatches(q).length>0));
  }finally{state.q=original.q;state.day=original.day;REC_EPOCH1066=original.epoch;DOCS.files=original.files;S=original.record;Loading1200.clearFinder();}
  return out;
 });for(const [name,ok]of Object.entries(fresh))check('finder '+name,ok);
 const books=await p.evaluate(()=>{
  const originals=[allDockets,serviceNoteRows,collectionRows],calls=[0,0,0];let date='2026-10-24';
  const fixtures=[()=>{calls[0]++;return [{docket_no:'101',date},{docket_no:'same',date}];},()=>{calls[1]++;return [{note_no:'102',date},{note_no:'same',date}];},()=>{calls[2]++;return [{collection_no:'103',date}];}];
  const run=()=>holdAssets(()=>{const before=[allDockets,serviceNoteRows,collectionRows];[allDockets,serviceNoteRows,collectionRows]=fixtures;try{return ['101','102','103','same','missing','101','102','103'].map(docketBook815);}finally{[allDockets,serviceNoteRows,collectionRows]=before;}});
  const first=run(),once=calls.every(n=>n===1);date='2026-10-25';const second=run();
  return {once,precedence:first[3]?.words==='Hire agreement',missing:first[4]===null,nextRead:second[0]?.date===date,restore:originals.every((f,i)=>f===[allDockets,serviceNoteRows,collectionRows][i])};
 });for(const [name,ok]of Object.entries(books))check('document book '+name,ok);
 const assets=JSON.parse(fs.readFileSync(path.join(path.dirname(process.env.PAGE),'media1200-extracted.json'))).assets;
 const images=assets.filter(a=>a.type.startsWith('image/'));
 const decoded=await p.evaluate(async files=>{const out=[];for(const file of files){const im=new Image();im.src=location.origin+'/m/Coates-GC500-2026/'+file;try{await im.decode();const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d');cx.drawImage(im,0,0,1,1);cx.getImageData(0,0,1,1);out.push(im.naturalWidth>0&&im.naturalHeight>0);}catch(e){out.push(false);}}return out;},images.slice(0,-1).map(a=>a.file));
 check('50 images decode and remain usable in same-origin canvas',decoded.length===50&&decoded.every(Boolean));
 check('all five print fonts embed successfully',await p.evaluate(async()=>{const css=await pdf7FontCss();return (css.match(/@font-face/g)||[]).length===5&&(css.match(/base64,/g)||[]).length===5;}));
 check('print renderer embeds external SVG icon pixels',await p.evaluate(async()=>{
  const node=document.createElement('div');node.style.cssText='width:104px;height:104px';node.innerHTML=RuleIcons989.html('competency',{static:true});document.body.append(node);
  try{const lib=await pdf7Lib(),svg=await lib.h2i.toSvg(node,{width:104,height:104,fontEmbedCSS:await pdf7FontCss()});return decodeURIComponent(svg).includes('data:image/png;base64,');}finally{node.remove();}
 }));
 // Exercise a real image network failure and the existing Retry control locally.
 const retryFile=images.at(-1).file,url='https://gc500-production.up.railway.app/m/Coates-GC500-2026/'+retryFile;let fail=true;
 await p.context().route(url,async route=>{if(fail){fail=false;return route.fulfill({status:503,body:''});}return route.fallback();});
 await p.evaluate(src=>{const box=document.createElement('div');box.id='media1200-test';box.style.cssText='position:fixed;top:80px;left:10px;width:100px;height:100px;z-index:999999';const im=new Image();im.src=src;box.append(im);document.body.append(box);},url);
 await p.locator('#media1200-test .gc-media-status button').waitFor({timeout:30000});
 check('failed extracted image offers retry',!fail&&await p.locator('#media1200-test .gc-media-status').isVisible());
 await p.locator('#media1200-test button').click();
 await p.waitForFunction(()=>{const im=document.querySelector('#media1200-test img');return im?.complete&&im.naturalWidth>0&&document.querySelector('#media1200-test .gc-media-status').hidden;});
 check('retry restores the original image',true);await p.evaluate(()=>document.getElementById('media1200-test').remove());
 const audit=await p.evaluate(()=>holdAssets(()=>{
  const P=pl770Model(),X=cj764Model(),C=branchFinancial978(pl752Rows(),moneySummary()).total;
  const cents=n=>Math.round(n*100),sum=rows=>rows.reduce((n,r)=>n+(Number.isFinite(r.job)?r.job:0),0),near=(a,b)=>Math.abs(cents(a)-cents(b))<=1;
  const box=document.createElement('div');box.innerHTML=pl770Card();const sec=box.querySelector('#pl770[data-pl1194]');if(!sec)return {rendered:false};
  const rows=[...sec.querySelectorAll('.branch978-desktop tbody tr')].filter(r=>r.cells.length===3);
  const cell=(label,col)=>rows.find(r=>r.cells[0].textContent.trim().startsWith(label))?.cells[col].textContent.trim();
  const groups=[['Hire Revenue',P.rev,['1005']],['Rehire Revenue',P.rev,['1010']],['Transport Revenue',P.rev,['1030 · 1031','1032']],['Other Revenue',P.rev,['1020','1047','1025','1015']],['Total Repairs & Maintenance',P.cost,['2357']],['Transport',P.cost,['2120 · 2140','3325']],['Rehire',P.cost,['2126']],['Other Direct Costs',P.cost,['2144','2142']]];
  const groupValues=groups.every(([label,lines,codes])=>{const selected=lines.filter(r=>codes.includes(r.code));if(!selected.length)return true;const name=rows.find(r=>r.cells[0].textContent.trim()===label);return !!name&&name.cells[1].textContent.trim()===(selected.some(r=>Number.isFinite(r.job))?money(sum(selected)):'Unpriced');});
  const gm=P.revJob-P.directJob,diff=gm-P.wages.job-P.overJob;
  const gaps=(X.gaps||[]).map(g=>g.what).filter(Boolean),gapText=sec.querySelector('.pl1194-not')?.textContent||'';
  return {rendered:true,groupValues,revenue:near(sum(P.rev),P.revJob),costs:near(sum(P.cost),P.directJob),difference:near(diff,C.contributionJob),
   totalRows:cell('Total Revenue',1)===money(P.revJob)&&cell('Total Direct Costs',1)===money(P.directJob),
   grossMargin:cell('Gross Margin',1)===money(gm),differenceShown:cell('Difference',1)===money(C.contributionJob),
   overheads:cell('Labour hire and salary allowance',1)===money(P.wages.job)&&cell('Travel, accommodation, meals and printing',1)===money(P.overJob),
   fencing:cell('Total Revenue',2)===money(X.fencing.revenue)&&cell('Total Direct Costs',2)===money(X.fencing.cost),
   fencingHandover:X.fencing.revenue===26522.4&&X.fencing.cost===10350,
   gaps:gaps.every(g=>gapText.includes(g))&&gapText.includes('hours only')};
 }));for(const [name,ok]of Object.entries(audit))check('independent P&L '+name,ok);
 await p.evaluate(()=>go('today'));await p.waitForTimeout(500);
 if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.screenshot({path:path.join(process.env.OUT,mobile?'phone-today.png':'desktop-today.png')});}
 check('no page errors or attempted writes',h.errors.length===0&&h.counts.blocked===0);
 console.log(JSON.stringify({author:'Andrew Fisher',mobile,checks,errors:h.errors,attemptedWrites:h.counts.blocked}));
}finally{await h.browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
