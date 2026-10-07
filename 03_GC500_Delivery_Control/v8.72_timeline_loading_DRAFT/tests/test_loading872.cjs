// Author: Andrew Fisher. Isolated loading, print scope and preservation checks. No live writes.
const fs=require('fs'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const mob=!!process.env.MOB,s=await open({pageFile:process.env.PAGE,W:mob?390:1440,H:mob?844:900,mobile:mob,dpr:mob?2:1}),p=s.page,R=[];const ok=(name,pass)=>R.push({name,pass:!!pass});await p.waitForFunction(()=>typeof loading872Set==='function'&&SYNC.status==='live');await p.waitForTimeout(1200);
 const X=await p.evaluate(()=>{
  const targets=allAssets().filter(a=>loading872Rows(a).length),a=targets.find(a=>loading872Rows(a).length>1)||targets[0],r=loading872Rows(a)[0],original=JSON.stringify(S),before=JSON.stringify([moneySummary(),fh866Model()]);
  const restore={save,bump,whoAmI,mayWrite,capability,read:SYNC.readonly};window.save=()=>{};window.bump=()=>{};window.whoAmI=()=> 'Isolated check';window.mayWrite=()=>true;window.capability=()=> 'edit';SYNC.readonly=false;
  const out={eligible:!!a&&!!r,other:loading872Rows(allAssets().find(x=>x.discipline==='Generators')).length===0};
  out.driver=loading872Set(a.key,r.id,'driver')&&loading872Side(a,r.id)==='driver';out.passenger=loading872Set(a.key,r.id,'passenger')&&loading872Side(a,r.id)==='passenger';out.invalid=!loading872Set(a.key,r.id,'left')&&!loading872Set(a.key,'invented','driver');
  out.editor=loading872Editor(a).includes('value="passenger" checked')&&!loading872Editor(a).includes('value="driver" checked');out.sheet=loading872Sheet(a).includes('☑ Door to passenger side');
  const g={kind:'deliveries',rows:[{a,events:a.events||[]}]};out.truck=dpTruck(g,'drv').includes('☑ Door to passenger side');out.supplier=epRunSheet819(epPlan870().loads[0]).includes('Door-side loading instructions checked with the driver.');out.drop=dropPage(a,a.events||[],1,1,{iso:'2026-10-07'},'deliveries').includes('☑ Door to passenger side');out.check=loading872Checks({checks:[],report:[],warnings:[]},[a]).checks[0].id==='loading-door-side';
  const old=JSON.parse(original).delivery?.[a.key];const m=loading872Record(a.key);const combined=mergeRecords({delivery:{[a.key]:{loading872:m}}},{delivery:{[a.key]:{state:'on site',set_at:new Date().toISOString(),by:'Other'}}}).merged;
  out.merge=!!combined&&JSON.stringify(combined.delivery[a.key].loading872)===JSON.stringify(m);
  out.persist=toDocs('delivery')[a.key]?.loading872?.[r.id]?.side==='passenger';out.empty=!deliveryEmpty({loading872:m});loading872Set(a.key,r.id,'');out.clear=loading872Side(a,r.id)==='';
  out.money=before===JSON.stringify([moneySummary(),fh866Model()]);
  const k=targets.slice(0,4).map(x=>x.key);const loads=k.map(key=>({kind:'deliveries',rows:[{a:assetOf(key)}]}));loads.push({kind:'removals',rows:[{a:assetOf(k[0])}]});k.forEach(key=>S.delivery[key]={state:'not on site',done:false,levelled:false,steps:false,by:'Isolated check',set_at:new Date().toISOString()});
  let printed=0;const one=timeline841Printed('2026-10-07','drv',loads,[0],{},()=>printed++);out.one=printed===1&&one.length===1&&one[0]===k[0]&&deliveryOf(k[1]).state==='not on site';
  S.delivery[k[2]]={state:'on site',done:true,by:'Isolated check',set_at:new Date().toISOString()};const day=timeline841Printed('2026-10-07','drv',loads,[0,1,2,3,4],{},()=>printed++);out.day=day.length===2&&day.includes(k[1])&&day.includes(k[3])&&deliveryOf(k[2]).done&&deliveryOf(k[2]).state==='on site';
  S.delivery[k[0]]={state:'not on site'};out.preview=timeline841Printed('2026-10-07','drv',loads,[0],{pdf:()=>{}},()=>{}).length===0&&deliveryOf(k[0]).state==='not on site';
  SYNC.readonly=true;out.readonly=timeline841Printed('2026-10-07','drv',loads,[0],{},()=>{}).length===0&&deliveryOf(k[0]).state==='not on site';out.cancel=timeline841Printed('2026-10-07','drv',loads,[0],{},()=>{},()=>false).length===0;
  S=JSON.parse(original);window.save=restore.save;window.bump=restore.bump;window.whoAmI=restore.whoAmI;window.mayWrite=restore.mayWrite;window.capability=restore.capability;SYNC.readonly=restore.read;
  out.restore=JSON.stringify(S)===original;return out;
 });for(const[name,v]of Object.entries(X))ok(name,v);
 await p.evaluate(()=>{go('timeline');state.day='2026-10-07';state.tlView='day';render();});await p.waitForTimeout(1000);ok('asset identifiers on cards',await p.locator('#pane-timeline .asset872').count()>0);ok('no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
 if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});await p.locator('#pane-timeline .tl846').first().scrollIntoViewIfNeeded();await p.screenshot({path:process.env.OUT+'/timeline-'+(mob?'phone':'desktop')+'.png'});}
 ok('no runtime errors',s.errors.length===0);ok('no attempted live writes',s.counts.blocked===0);await s.browser.close();R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name));console.log((mob?'phone':'desktop')+': '+R.filter(r=>r.pass).length+'/'+R.length);if(R.some(r=>!r.pass))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
