// Author: Andrew Fisher. Independent read-only navigation, layout and visual evidence.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {open}=require('../../toolchain/harness/open_page');
const out=__dirname, shots=process.env.SHOTS||require('os').tmpdir();
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const file=process.env.PAGE, mobile=process.env.MOB==='1', tag=process.env.TAG||'candidate';
 const h=await open({pageFile:file,W:mobile?390:1440,H:mobile?844:900,dpr:mobile?2:1,mobile,gl:false}),p=h.page;
 const result={author:'Andrew Fisher',tag,mobile,sha256:sha(file),screenshots:[],measures:{}};
 try{
 await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});await sleep(2500);
 await p.emulateMedia({reducedMotion:'reduce'});
 if(tag==='candidate'){
  await p.evaluate(()=>go('today'));await sleep(1500);
  await p.evaluate(()=>document.querySelector('#pane-today .lights [data-lf-go="none"]').click());await sleep(1800);
  result.lightArrival=await p.evaluate(()=>{const f=document.querySelector('#pane-plant .eqrefs'),rows=[...document.querySelectorAll('#pane-plant .eqrefs tbody tr')];return{tab:state.tab,light:state.light,filterPresent:!!document.querySelector('#pane-plant .eqrefs [data-lf]'),foldOpen:f.open,referenceCount:state.list.length,referenceRows:rows.length,visibleReferenceRows:rows.filter(e=>!!e.getClientRects().length).length,inventoryVisible:!!document.querySelector('#pane-plant #invCard').getClientRects().length};});
  const shot=path.join(shots,`light-arrival-${mobile?'phone':'desktop'}.png`);await p.screenshot({path:shot});result.screenshots.push(shot);
  result.tradeMapping=await p.evaluate(()=>plantGroups().map(([group,list])=>({group,count:list.length,inventoryDisciplines:[...new Set(list.map(a=>invTypeDisc(invTypeOf(a)||'')).filter(Boolean))]})));
  await p.evaluate(()=>{state.light=null;state.q='';state.plantGroup=null;eq796s.s=null;go('today');});
 }
 for(const tab of ['today','plant']){
  await p.evaluate(t=>go(t),tab);await sleep(2200);
  if(tab==='today'&&process.env.OPEN_FOLDS){await p.evaluate(()=>document.querySelectorAll('#pane-today details.fold95').forEach(d=>d.open=true));await sleep(1000);}
  result.measures[tab]=await p.evaluate(tab=>{
   const pane=document.getElementById('pane-'+tab),main=document.querySelector('main'),vis=e=>e&&e.getClientRects().length>0&&!e.closest('details:not([open])');
   const sections=tab==='today'?{'Instruments':pane.querySelector(':scope > .inst'),"Today's work":pane.querySelector('.hub'),'By group':pane.querySelector('#pane-progress .groups:not(.branches)'),'By branch':pane.querySelector('#pane-progress .groups.branches'),'Money':pane.querySelector('#pane-progress .money-grid')}:{};
   const natural=new Map(),st=document.createElement('style');st.textContent='.review796natural>*{align-self:start!important;height:auto!important;flex-grow:0!important}.review796natural{align-items:start!important}.review796natural .racecard,.review796natural>.card{min-height:0!important}';document.head.appendChild(st);
   Object.values(sections).forEach(c=>c&&c.classList.add('review796natural'));
   Object.values(sections).forEach(c=>c&&[...c.children].filter(vis).forEach(k=>{const r=k.getBoundingClientRect();natural.set(k,r.width*r.height);}));
   Object.values(sections).forEach(c=>c&&c.classList.remove('review796natural'));st.remove();
   const areas={};let total=0,empty=0;
   for(const[n,c]of Object.entries(sections)){if(!vis(c))continue;const r=c.getBoundingClientRect(),a=r.width*r.height;if(!a)continue;const used=[...c.children].filter(vis).reduce((s,k)=>s+(natural.get(k)||0),0);areas[n]={heightPx:Math.round(r.height),emptyPct:+(Math.max(0,a-used)/a*100).toFixed(1)};total+=a;empty+=Math.max(0,a-used);}
   return{paneHeightPx:Math.round(pane.getBoundingClientRect().height),mainScrollHeightPx:main.scrollHeight,viewportWidth:innerWidth,pageScrollWidth:document.documentElement.scrollWidth,sections:areas,totalEmptyPct:total?+(empty/total*100).toFixed(1):null};
  },tab);
  for(const part of ['top','middle','bottom']){
   await p.evaluate(part=>{const m=document.querySelector('main');m.scrollTop=part==='top'?0:part==='middle'?m.scrollHeight*.38:m.scrollHeight;},part);await sleep(650);
   const shot=path.join(shots,`${tag}-${tab}-${mobile?'phone':'desktop'}-${part}.png`);await p.screenshot({path:shot});result.screenshots.push(shot);
  }
 }
 result.errors=h.errors;result.requests=h.counts;
 fs.writeFileSync(path.join(out,`layout799_${tag}_${mobile?'phone':'desktop'}.json`),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
