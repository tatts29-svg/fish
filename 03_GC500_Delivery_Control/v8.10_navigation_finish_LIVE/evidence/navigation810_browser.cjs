// Author: Andrew Fisher. Real browser navigation; public view, GET only, no record writes.
// PAGE=<candidate> PRIVATE_OUT=<private evidence> MOB=1 node this-file
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const cf=require('../../toolchain/harness/curlfetch');
const originalFetch=cf.curlFetch;
let blocked=0;
cf.curlFetch=async(url,headers,method='GET',body)=>{
 if(method!=='GET'){blocked++;throw Error('Read-only test blocks every non-GET');}
 return originalFetch(url,headers,method,body);
};
const {open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',pageFile=process.env.PAGE,out=process.env.PRIVATE_OUT;
if(!pageFile||!out)throw Error('PAGE and PRIVATE_OUT required');
fs.mkdirSync(out,{recursive:true});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const report={author:'Andrew Fisher',mobile,pageSha256:sha(fs.readFileSync(pageFile)),checks:[],screenshots:[],errors:[]};
function check(name,pass,detail){report.checks.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name);}
const tag=mobile?'phone':'desktop';
(async()=>{
 const h=await open({pageFile,hash:'#day/2026-10-07',mobile,W:mobile?390:1440,H:mobile?844:900,dpr:1,gl:false}),p=h.page;
 p.setDefaultTimeout(10000);
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await p.waitForTimeout(1000);
  const before=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
  const snap=()=>p.evaluate(()=>({hash:location.hash,tab:state.tab,day:state.day,sel:state.sel,drawer:document.querySelector('#drawer').classList.contains('on'),scrim:document.querySelector('#scrim').classList.contains('on'),notice:document.querySelector('#flash')?.innerText||'',noticeShown:!!document.querySelector('#flash')&&getComputedStyle(document.querySelector('#flash')).display!=='none',focus:document.activeElement.id,historyNumber:history.state?.gc,navCur:NAV.cur,navPop:!!NAV.pop}));
  async function address(hash){await p.evaluate(h=>{location.hash=h;},hash);await p.waitForTimeout(200);return snap();}
  async function shot(name){const f=path.join(out,tag+'-'+name+'.png');await p.screenshot({path:f});report.screenshots.push({path:f,sha256:sha(fs.readFileSync(f))});}
  const initial=await snap();
  check('Valid requested delivery day opens exactly',initial.tab==='timeline'&&initial.day==='2026-10-07'&&initial.hash==='#day/2026-10-07',initial);
  await p.locator('#pane-timeline [data-ld]').first().click();
  const opener=p.locator('#pane-timeline button[data-k="P55"]').filter({hasText:'Open'});
  await opener.focus();await p.keyboard.press('Enter');
  let s=await snap();
  check('Existing reference opens by keyboard with close focus',s.drawer&&s.sel==='P55'&&s.focus==='dclose',s);
  await p.keyboard.press('Escape');
  const returnFocus=await p.evaluate(()=>document.activeElement.matches('button[data-k="P55"]'));
  check('Escape closes drawer and returns keyboard focus',!(await snap()).drawer&&returnFocus,{returnFocus});
  await opener.click();
  s=await address('#asset/MISSING_REFERENCE_810');
  check('Missing reference closes previous drawer and scrim',!s.drawer&&!s.scrim&&s.sel===null,s);
  check('Missing reference has truthful Equipment address and notice',s.tab==='plant'&&s.hash==='#plant'&&s.noticeShown&&s.notice.includes('is not a reference')&&s.navCur===s.hash&&!s.navPop,s);
  await shot('missing-reference');
  await p.goBack();await p.waitForTimeout(200);s=await snap();
  check('Back from rejected reference returns to valid reference',s.drawer&&s.sel==='P55'&&s.hash==='#asset/P55',s);
  await p.goForward();await p.waitForTimeout(200);s=await snap();
  check('Forward returns to canonical safe destination',s.tab==='plant'&&s.hash==='#plant'&&!s.drawer,s);
  await address('#asset/P55');s=await address('#asset/');
  check('Empty reference cannot retain the previous drawer',!s.drawer&&!s.scrim&&s.sel===null&&s.hash==='#plant'&&s.notice.includes('does not name'),s);
  await address('#asset/P55');s=await address('#asset/P55%0A');
  check('Encoded newline reference cannot retain the previous drawer',!s.drawer&&!s.scrim&&s.sel===null&&s.hash==='#plant'&&s.notice.includes('not a reference'),s);
  await address('#asset/P55');s=await address('#asset/%E0%A4%A');
  check('Malformed reference URI closes drawer and shows canonical Today',!s.drawer&&!s.scrim&&s.sel===null&&s.hash==='#today'&&s.tab==='today'&&s.notice.includes('invalid escape'),s);
  await address('#day/2026-10-07');s=await address('#day/2026-02-31');
  check('Impossible date shows Today with explicit invalid-date notice',s.hash==='#today'&&s.tab==='today'&&s.day===null&&s.noticeShown&&s.notice.includes('invalid date'),s);
  await shot('invalid-day');
  await p.goBack();await p.waitForTimeout(200);s=await snap();
  check('Back from invalid day restores exact prior valid day',s.hash==='#day/2026-10-07'&&s.tab==='timeline'&&s.day==='2026-10-07',s);
  await p.goForward();await p.waitForTimeout(200);s=await snap();
  check('Forward from valid day uses canonical Today fallback',s.hash==='#today'&&s.tab==='today'&&!s.drawer,s);
  for(const hash of ['#day/2026-2-03','#day/2026-10-07/extra','#day/','#day/2026-10-07%0A']){
   s=await address(hash);check('Invalid day shape rejected: '+hash,s.hash==='#today'&&s.tab==='today'&&s.day===null&&s.notice.includes('invalid date'),s);
  }
  s=await address('#day/2024-02-29');
  check('Real leap date is recognised as valid but outside this programme',s.hash==='#today'&&s.day===null&&s.notice.includes('outside this programme')&&!s.notice.includes('invalid date'),s);
  s=await address('#day/2026-02-29');
  check('Non-leap February 29 is rejected as invalid',s.hash==='#today'&&s.day===null&&s.notice.includes('invalid date'),s);
  s=await address('#day/2026-10-09');
  const empty=await p.locator('#pane-timeline').innerText();
  check('Valid empty programme day retained exactly',s.hash==='#day/2026-10-09'&&s.day==='2026-10-09'&&s.tab==='timeline'&&empty.includes('No asset moves are scheduled on this day.'),s);
  s=await address('#day/%E0%A4%A');
  check('Malformed day URI shows an explicit safe destination',s.hash==='#today'&&s.tab==='today'&&s.day===null&&!s.drawer&&s.notice.includes('invalid escape'),s);
  await address('#day/2026-10-07');
  await p.locator('#pane-timeline [data-day-step="1"]').click();
  s=await snap();check('Existing next-day control unchanged',s.day==='2026-10-08'&&s.hash==='#day/2026-10-08',s);
  await p.goBack();await p.waitForTimeout(200);s=await snap();
  check('Browser Back restores requested day after normal step',s.day==='2026-10-07'&&s.hash==='#day/2026-10-07',s);
  await p.goForward();await p.waitForTimeout(200);s=await snap();
  check('Browser Forward restores next day after normal step',s.day==='2026-10-08'&&s.hash==='#day/2026-10-08',s);
  const after=await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]))));
  check('All shared-record document fields unchanged',before===after,{beforeSha256:sha(before),afterSha256:sha(after)});
  check('No page errors',h.errors.length===0,h.errors);
  check('No operational write attempts',h.counts.blocked===0,{operationalWritesBlocked:h.counts.blocked,optionalTileSessionPostsBlocked:blocked});
  report.errors=h.errors;report.requests=h.counts;
 }finally{
  await h.browser.close();report.passed=report.checks.filter(c=>c.pass).length;report.total=report.checks.length;
  fs.writeFileSync(path.join(out,tag+'_browser_results.json'),JSON.stringify(report,null,2)+'\n');
 }
 if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
