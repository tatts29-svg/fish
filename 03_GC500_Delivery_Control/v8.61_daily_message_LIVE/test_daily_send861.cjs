// Author: Andrew Fisher. Isolated browser fault-injection; no network API writes.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {chromium}=require('playwright');
const ROOT=__dirname;
const candidate=process.env.PAGE||path.resolve(ROOT,'../build/GC500_v8.61/GC500_Delivery_Control_hosted.html');
const native=fs.readFileSync(candidate,'utf8');
const cut=(a,b)=>{const x=native.indexOf(a),y=native.indexOf(b,x+1);assert(x>=0&&y>x,'Candidate source anchors missing: '+a);return native.slice(x,y);};
const source=cut('/* Author: Andrew Fisher. v8.21: a selected day', '\nfunction renderTimeline()');
const renderer=cut('/* GC500 daily delivery page', '  return Object.freeze({renderDay, mapsUrl});')+'  return Object.freeze({renderDay, mapsUrl});\n});';
const newSource=cut('/* v8.61 daily message helpers START */','/* v8.61 daily message helpers END */');
assert(native.includes('function daily861Message('),'Not a v8.61 candidate');
const begin=native.indexOf('function sms777Number('),end=native.indexOf('\nasync function smsDropBox',begin);const smsHelpers=native.slice(begin,end);
const cb=native.indexOf('makeCard: async card => {'),ce=native.indexOf('\n cards: async',cb);const makeCard=native.slice(cb+'makeCard: '.length,ce).trim().replace(/,$/,'');
const out=process.env.EVIDENCE||'/tmp/gc500-v861-send-review',results=[],external=[],errors=[];fs.mkdirSync(out,{recursive:true});
const fixture=String.raw`
window.MOCK={card:[],sms:[],reads:[],previewUrls:[],version:7,localVersion:7,level:'edit',capability:'edit',configured:true,left:10,cardMode:'ok',smsMode:'ok',changed:null};
window.MODEL={iso:'2026-10-08',label:'08 Oct 2026',loads:[{n:1,iso:'2026-10-08',time:'08:00',carrier:'Fixture carrier',basis:'Fixture schedule',booking:false,rows:[{iso:'2026-10-08',key:'TEST1',item:'1 Building',items:[{item:'Building',qty:'1'}],place:'Fixture zone',notes:['Unload at marked area'],state:{label:'Not on site',tone:'red'},navUrl:'https://www.google.com/maps/dir/?api=1&destination=-28,153.4',navBasis:'Fixture position'}]}]};
window.DAILY821_FONTS='';window.TEAM={people:[{name:'Installer Alpha',group:'install',mobile:'0400000001'},{name:'Installer Duplicate',group:'install',mobile:'+61400000001'},{name:'Installer Beta',group:'install',mobile:'0400000002'},{name:'Fencing Contact',group:'fencing',mobile:'0400000003'},{name:'Bad Mobile',group:'install',mobile:'123'}]};
window.MOCK.forecast={date:'2026-10-08',src:'wapi',code:1000,text:'Sunny',max_c:26,min_c:18,rain_pc:10,wind_kph:20};
window.MOCK.weatherAvailable=true;
window.WXF_FRESH_MIN=60;window.WXF_STALE_MIN=720;window.WX_DAYS=10;window.WX_OUTLOOK=7;window.wxAddDays=(iso,n)=>new Date(Date.parse(iso+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
window.WXF={state:'ok',days:{'2026-10-08':MOCK.forecast},at:new Date().toISOString(),q:[]};window.WXO={state:'ok',days:{},at:new Date().toISOString(),q:[]};
window.wxAgeMin=s=>(Date.now()-Date.parse(s))/60000;
window.wxfDay=iso=>MOCK.weatherAvailable&&MOCK.forecast.date===iso?MOCK.forecast:null;
window.wxOutlook=iso=>false;window.wxSrcTag=f=>f.src==='om'?'Open-Meteo':'WeatherAPI';window.wxSrcWords=f=>wxSrcTag(f)+' forecast';
window.wxKind=(code,src)=>code===1000?'sun':code===1273?'storm':'rain';window.wxShort=(kind,text)=>text;
window.wxNum=x=>typeof x==='number'&&Number.isFinite(x);
window.wxfLoad=done=>{if(MOCK.weatherThrow)throw Error('Fixture weather offline');done&&done();};window.wxoLoad=done=>{if(MOCK.weatherThrow)throw Error('Fixture weather offline');done&&done();};
window.S={operator:'Fixture Operator'};window.SYNC_COLLS={deliveries:'deliveries'};window.SYNC={readonly:false,status:'live',first:new Set(['deliveries']),backend:{readVersion821:()=>MOCK.localVersion}};
window.capability=()=>MOCK.capability;window.syncWaiting=()=>false;window.tokenOf=()=> 'fixture-nonsecret-token';window.fmtDate=x=>x;window.todayIso=()=> '2026-10-03';window.addDays=(iso,n)=>new Date(Date.parse(iso+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);window.headers=h=>Object.assign({'x-gc500-token':'fixture-nonsecret-token','x-gc500-who':S.operator},h);
window.esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.dpDayButtonsBefore821=()=>'';window.timeline841DayButton=()=>'';window.MMS757_ICON='';window.confirm=()=>false;
window.open=()=>({opener:null,closed:false,location:{replace:u=>MOCK.previewUrls.push(u)},close(){this.closed=true;}});
window.fetch=async (url,opt={})=>{
 const method=opt.method||'GET',u=new URL(url,location.origin),body=opt.body?JSON.parse(opt.body):null;
 const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}});
 if(method==='GET')MOCK.reads.push(u.pathname);
 if(u.pathname==='/api/version'&&method==='GET')return json({level:MOCK.level,version:MOCK.version});
 if(u.pathname==='/api/sms'&&method==='GET')return json({configured:MOCK.configured,today:{left:MOCK.left}});
 if(u.pathname==='/api/cards'&&method==='POST'){
  MOCK.card.push(body);
  if(MOCK.cardMode==='throw')throw Error('Fixture card connection failed');
  if(MOCK.cardMode==='http')return json({error:'Fixture card refused'},507);
  if(MOCK.cardMode==='changedVersion')MOCK.version=8;
  if(MOCK.cardMode==='changedCapability')MOCK.capability='view';
  if(MOCK.cardMode==='changedRecipient'){window.SESSION.recipient='Installer Beta';}
  if(MOCK.cardMode==='changedWeather'){MOCK.forecast.max_c+=5;}
  if(MOCK.cardMode==='expiredWeather'){WXF.at=new Date(Date.now()-721*60000).toISOString();}
  if(MOCK.cardMode==='held')await new Promise(r=>window.RELEASE_CARD=r);
  if(MOCK.cardMode==='badurl')return json({url:'https://evil.invalid/d/not-ours'});
  if(MOCK.cardMode==='malformed')return new Response('not JSON',{status:200});
  return json({url:'/d/fixture-token'});
 }
 if(u.pathname==='/api/sms'&&method==='POST'){
  MOCK.sms.push({body,who:opt.headers['x-gc500-who']});
  if(MOCK.smsMode==='throw')throw Error('Fixture lost response');
  if(MOCK.smsMode==='timeout')await new Promise((resolve,reject)=>opt.signal.addEventListener('abort',()=>reject(new DOMException('Fixture timeout','AbortError')),{once:true}));
  if(MOCK.smsMode==='held')await new Promise(r=>window.RELEASE_SMS=r);
  if(MOCK.smsMode==='unknown')return new Response('not JSON',{status:200});
  if(MOCK.smsMode==='http500')return json({},500);
  if(MOCK.smsMode==='rejected')return json({messages:[{to:body.to[0],status:'INVALID_RECIPIENT'}]},200);
  return json({messages:[{to:body.to[0],status:'SUCCESS',message_id:'fixture-message-id'}]});
 }
 if(u.pathname==='/api/sms/status'&&method==='GET')return json({messages:[{message_id:'fixture-message-id',to:'+61400000001',delivery_status:MOCK.receiptState||'delivered'}]});
 throw Error('Unexpected mocked request: '+method+' '+u.pathname);
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 async function setup(){
  const context=await browser.newContext();await context.route('**/*',r=>{if(r.request().url()==='https://daily-review.invalid/')return r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><div id="host"></div></body></html>'});external.push(r.request().method()+' '+r.request().url());return r.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  async function boot(){await page.goto('https://daily-review.invalid/');await page.addScriptTag({content:fixture});await page.addScriptTag({content:smsHelpers});await page.addScriptTag({content:renderer});await page.addScriptTag({content:newSource});await page.addScriptTag({content:source});await page.addScriptTag({content:'SYNC.backend.makeCard='+makeCard+';daily821Model=iso=>({...JSON.parse(JSON.stringify(MODEL)),iso});window.SESSION=daily821Session("2026-10-08");SESSION.recipient=SESSION.recipient||"Installer Alpha";'});}
  await boot();return{context,page,boot};
 }
 async function test(name,fn){const f=await setup();try{await fn(f);results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}finally{await f.context.close();}}
 function state(p){return p.evaluate(()=>({card:MOCK.card.length,sms:MOCK.sms.length,reads:MOCK.reads,locked:SESSION.locked,busy:SESSION.busy,message:SESSION.message,prepared:!!SESSION.prepared,rows:SESSION.rows,saved:sessionStorage.getItem('gc500.daily821.'+SESSION.iso)}));}
 // Prepare is deliberately optional in the requested one-click flow. These tests call Send directly.
 await test('Installer contact projection filters group, validates and deduplicates mobiles',async({page})=>{const teams=await page.evaluate(()=>daily821Contacts());assert.deepStrictEqual(teams.map(x=>x.name),['Installer Alpha','Installer Beta']);});
 await test('Choosing installer alone never publishes a card or sends SMS',async({page})=>{await page.evaluate(()=>{DAILY821.open=SESSION.iso;document.querySelector('#host').innerHTML=daily821Panel({iso:SESSION.iso});const select=document.querySelector('select');select.value='Installer Beta';select.dispatchEvent(new Event('change',{bubbles:true}));});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);});
 await test('Preview is read-only: no card or SMS publication',async({page})=>{await page.evaluate(()=>daily821Prepare(SESSION));const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert(s.prepared);assert.equal(await page.evaluate(()=>MOCK.previewUrls.length),1);});
 await test('Explicit Send works without requiring a separate Preview',async({page})=>{await page.evaluate(()=>daily821Send(SESSION));const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,1);assert(s.locked);assert.match(s.message,/Accepted/);assert.doesNotMatch(s.message,/Delivered/);const posted=await page.evaluate(()=>MOCK.sms[0]);assert.equal(posted.who,'Fixture Operator');assert.deepStrictEqual(posted.body.to,['+61400000001']);});
 await test('Missing operator blocks publication and send',async({page})=>{await page.evaluate(()=>{S.operator=' ';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/name|Recording as/);});
 await test('View-only capability blocks publication and send',async({page})=>{await page.evaluate(()=>{MOCK.capability='view';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);});
 await test('Server edit permission downgrade blocks publication and send',async({page})=>{await page.evaluate(()=>{MOCK.level='view';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);});
 await test('Local/server record mismatch blocks publication and send',async({page})=>{await page.evaluate(()=>{MOCK.version=8;return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/changed|sync/);});
 await test('Card HTTP failure cannot fall through into SMS',async({page})=>{await page.evaluate(()=>{MOCK.cardMode='http';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,0);assert.equal(s.locked,false);assert.equal(s.busy,false);assert.match(s.message,/refused/);});
 await test('Card network failure cannot fall through into SMS',async({page})=>{await page.evaluate(()=>{MOCK.cardMode='throw';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,0);assert.equal(s.busy,false);});
 await test('Malformed card success cannot send a broken link',async({page})=>{await page.evaluate(()=>{MOCK.cardMode='malformed';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,0);});
 await test('Cross-origin card URL is rejected before SMS',async({page})=>{await page.evaluate(()=>{MOCK.cardMode='badurl';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,0);});
 for(const mode of ['changedVersion','changedCapability','changedRecipient'])await test('Card-in-flight '+mode+' prevents stale SMS',async({page})=>{await page.evaluate(m=>{MOCK.cardMode=m;return daily821Send(SESSION);},mode);const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,0);});
 await test('Double click during card publication starts only one card and SMS',async({page})=>{await page.evaluate(()=>{MOCK.cardMode='held';window.FIRST_SEND=daily821Send(SESSION);});await page.waitForFunction(()=>!!window.RELEASE_CARD);await page.evaluate(()=>daily821Send(SESSION));await page.evaluate(()=>RELEASE_CARD());await page.evaluate(()=>FIRST_SEND);const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,1);});
 await test('Double click during SMS submission cannot submit a duplicate',async({page})=>{await page.evaluate(()=>{MOCK.smsMode='held';window.FIRST_SEND=daily821Send(SESSION);});await page.waitForFunction(()=>!!window.RELEASE_SMS);await page.evaluate(()=>daily821Send(SESSION));await page.evaluate(()=>RELEASE_SMS());await page.evaluate(()=>FIRST_SEND);const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,1);});
 for(const mode of ['unknown','throw','http500'])await test(mode+' SMS response stays locked through reload',async({page,boot})=>{await page.evaluate(m=>{MOCK.smsMode=m;return daily821Send(SESSION);},mode);const a=await state(page);assert.equal(a.sms,1);assert(a.locked);assert(JSON.parse(a.saved).locked);await boot();await page.evaluate(()=>daily821Send(SESSION));const b=await state(page);assert(b.locked);assert.equal(b.sms,0);assert.equal(b.card,0);});
 await test('Storage failure prevents an unpersisted SMS duplicate lock',async({page})=>{await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Fixture quota','QuotaExceededError');};return daily821Send(SESSION);});const s=await state(page);assert.equal(s.sms,0);assert.match(s.message,/stor|remember|save|lock/i);});
 await test('Silent storage drop is detected before SMS',async({page})=>{await page.evaluate(()=>{Storage.prototype.setItem=function(){};return daily821Send(SESSION);});const s=await state(page);assert.equal(s.sms,0);assert.match(s.message,/stor|remember|save|lock/i);});
 await test('Read status performs no new POST and distinguishes delivered',async({page})=>{await page.evaluate(()=>daily821Send(SESSION));const before=await state(page);assert.equal(before.sms,1);await page.evaluate(()=>daily821Status(SESSION));const after=await state(page);assert.equal(after.card,before.card);assert.equal(after.sms,before.sms);assert.match(after.message,/Delivered/);});
 await test('Day HTML contains selected day only, no contacts/records/encoded app links',async({page})=>{const html=await page.evaluate(()=>{
 const m=structuredClone(MODEL);m.secretRecord={payroll:'PAYROLL_SENTINEL'};m.otherDays=[{date:'2099-01-01'}];m.contacts=[{phone:'DIRECTORY_SENTINEL'}];m.loads[0].rows[0].contact='CONTACT_SENTINEL';m.loads[0].rows[0].qr='ENCODED_APP_SENTINEL';m.loads[0].rows[0].note='<script>evil()</script>';
 return daily821Html(m,{name:'Installer Alpha',to:'RECIPIENT_PHONE_SENTINEL'},7);
 });assert.doesNotMatch(html,/PAYROLL_SENTINEL|DIRECTORY_SENTINEL|CONTACT_SENTINEL|ENCODED_APP_SENTINEL|RECIPIENT_PHONE_SENTINEL|2099-01-01/);assert.doesNotMatch(html,/<script|<iframe|<form|\/v\/Coates|\/e\//i);assert.match(html,/default-src &#39;none&#39;|default-src 'none'/);assert.match(html,/Record revision 7/);assert.match(html,/expires after 2026-10-09/);fs.writeFileSync(path.join(out,'synthetic-day.html'),html);});
 await test('Card metadata uses date, unique refs, expiry and no contact directory',async({page})=>{await page.evaluate(()=>daily821Send(SESSION));const p=await page.evaluate(()=>MOCK.card[0]);assert.equal(p.run_date,'2026-10-08');assert.equal(p.expires,'2026-10-09');assert.deepStrictEqual(p.keys,['TEST1']);assert.equal(p.contact,undefined);assert.equal(p.targets,undefined);assert.equal(p.token,undefined);});
 await test('More than40refs refuses publication before server truncation',async({page})=>{await page.evaluate(()=>{MODEL.loads[0].rows=Array.from({length:41},(_,i)=>({...MODEL.loads[0].rows[0],key:'TEST'+i}));return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/40/);});
 await test('Oversize HTML refuses publication before server body limit',async({page})=>{await page.evaluate(()=>{MODEL.loads[0].rows[0].notes=['X'.repeat(1900000)];return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/large/);});

 await test('Expired optional preview is rejected before publication',async({page})=>{await page.evaluate(()=>daily821Prepare(SESSION));await page.evaluate(()=>{SESSION.prepared.at-=121000;return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/two minutes|old/);});
 await test('Reviewed preview cannot be reused for another selected day',async({page})=>{await page.evaluate(()=>daily821Prepare(SESSION));await page.evaluate(()=>{SESSION.iso='2026-10-09';return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/changed/);});
 await test('Empty daily schedule cannot publish or send',async({page})=>{await page.evaluate(()=>{MODEL.loads=[];return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/No delivery/);});
 for(const scenario of ['unconfigured','noQuota'])await test(scenario+' blocks direct one-click Send',async({page})=>{await page.evaluate(x=>{if(x==='unconfigured')MOCK.configured=false;else MOCK.left=0;return daily821Send(SESSION);},scenario);const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/unavailable|allowance/);});
 await test('SMS timeout uses unknown-result lock without retry',async({page,boot})=>{await page.evaluate(()=>{const nativeTimeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===25000?30:ms,...args);MOCK.smsMode='timeout';return daily821Send(SESSION);});const a=await state(page);assert.equal(a.sms,1);assert(a.locked);assert.match(a.message,/connection ended|may have/);await boot();await page.evaluate(()=>daily821Send(SESSION));const b=await state(page);assert.equal(b.sms,0);assert(b.locked);});
 await test('Rendered day HTML escapes executable content and has no active external subresources',async({page,context})=>{
  const html=await page.evaluate(()=>{
   const m=structuredClone(MODEL),r=m.loads[0].rows[0];r.notes=['Instruction <script>window.ATTACK=1</script> <img src="https://evil.invalid/pixel" onerror="window.ATTACK=2">'];r.place='<iframe src="https://evil.invalid/frame"></iframe>';r.navUrl='javascript:window.ATTACK=3';r.qrData=btoa('https://gc500.invalid/v/Coates-GC500-2026#finance');r.photoUrl='https://gc500.invalid/e/fixture-edit-route';r.contact='CONTACT_SHOULD_NOT_RENDER';return daily821Html(m,{name:'<svg onload="window.ATTACK=4">'},7);
  });
  const child=await context.newPage();await child.setContent(html);const actual=await child.evaluate(()=>({attack:window.ATTACK,active:document.querySelectorAll('script,iframe,object,form,[src]').length,links:[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')),text:document.body.textContent,csp:document.querySelector('meta[http-equiv="Content-Security-Policy"]').content}));
  assert.equal(actual.attack,undefined);assert.equal(actual.active,0);assert.deepStrictEqual(actual.links,['#deliveries']);assert.match(actual.text,/<script>window.ATTACK=1<\/script>/);assert.doesNotMatch(actual.text,/CONTACT_SHOULD_NOT_RENDER|fixture-edit-route/);assert(!html.includes(Buffer.from('https://gc500.invalid/v/Coates-GC500-2026#finance').toString('base64')));assert.match(actual.csp,/default-src 'none'/);assert.match(actual.csp,/form-action 'none'/);await child.close();
 });

 await test('Card timeout clears busy and late completion never sends SMS',async({page})=>{
  await page.evaluate(()=>{const nativeTimeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===30000?50:ms,...args);MOCK.cardMode='held';return daily821Send(SESSION);});
  const timed=await state(page);assert.equal(timed.card,1);assert.equal(timed.sms,0);assert.equal(timed.busy,false);assert.equal(timed.prepared,false);assert.match(timed.message,/timed out|timeout/i);
  await page.evaluate(()=>RELEASE_CARD());await page.evaluate(()=>new Promise(r=>setTimeout(r,20)));const late=await state(page);assert.equal(late.sms,0);assert.equal(late.busy,false);
 });

 for(const [first,next] of [['delivered','unknown'],['failed','pending']])await test('Confirmed '+first+' survives a weaker '+next+' status lookup',async({page})=>{
  await page.evaluate(()=>daily821Send(SESSION));await page.evaluate(x=>{MOCK.receiptState=x;return daily821Status(SESSION);},first);const known=await state(page);assert.equal(known.rows[0].delivery_status,first);
  await page.evaluate(x=>{MOCK.receiptState=x;return daily821Status(SESSION);},next);const after=await state(page);assert.equal(after.rows[0].delivery_status,first);assert.equal(after.sms,1);assert(after.locked);
 });
 await test('Restoring an unknown result is quiet and never queues automatic work',async({page,boot})=>{
  await page.evaluate(()=>{MOCK.smsMode='unknown';return daily821Send(SESSION);});await boot();await page.evaluate(()=>new Promise(r=>setTimeout(r,60)));const after=await state(page);assert(after.locked);assert.equal(after.card,0);assert.equal(after.sms,0);assert.equal(after.reads.length,0);await page.evaluate(()=>{DAILY821.open=SESSION.iso;document.querySelector('#host').innerHTML=daily821Panel({iso:SESSION.iso});});const text=await page.locator('#host').innerText();assert.match(text,/unknown|submitted/i);const last=await state(page);assert.equal(last.sms,0);assert.equal(last.card,0);
 });

 await test('Personal message uses first name, exact date, Take 5 and final link',async({page})=>{
  const text=await page.evaluate(()=>daily861Message('2026-10-08',{name:'Mr Aaron Example'},'https://daily-review.invalid/d/day-link',daily861Weather('2026-10-08')));
  assert.match(text,/^Good morning, Aaron\./);assert.match(text,/GC500 - 2026-10-08/);assert.match(text,/Sunny/);assert.match(text,/Take 5/);assert.match(text,/conditions change/);assert(text.endsWith('https://daily-review.invalid/d/day-link'));assert(text.length<=480);assert.doesNotMatch(text,/today/i);
 });
 await test('Missing first name remains a natural greeting',async({page})=>{
  const text=await page.evaluate(()=>daily861Message('2026-10-08',{name:''},'https://daily-review.invalid/d/day-link',daily861Weather('2026-10-08')));assert.match(text,/^Good morning\./);assert.doesNotMatch(text,/undefined|null/);
 });
 await test('Offline weather has an honest fallback and permits an explicit send',async({page})=>{
  await page.evaluate(()=>{MOCK.weatherAvailable=false;MOCK.weatherThrow=true;WXF.state='error';WXO.state='error';WXF.days=null;WXO.days=null;return daily821Send(SESSION);});
  const s=await state(page);assert.equal(s.sms,1);assert.equal(s.card,1);const text=await page.evaluate(()=>MOCK.sms[0].body.text);assert.match(text,/unavailable|not available|not yet available/i);assert.doesNotMatch(text,/Sunny|18-26/);assert(text.length<=480);assert(text.endsWith('https://daily-review.invalid/d/fixture-token'));
 });
 await test('Displayed personal preview is read-only and matches sent text except link',async({page})=>{
  const before=await page.evaluate(()=>{DAILY821.open=SESSION.iso;document.querySelector('#host').innerHTML=daily821Panel({iso:SESSION.iso});return document.querySelector('.daily861-preview pre').textContent;});
  let s=await state(page);assert.equal(s.sms,0);assert.equal(s.card,0);
  await page.evaluate(()=>daily821Prepare(SESSION));await page.evaluate(()=>daily821Send(SESSION));
  const output=await page.evaluate(()=>({text:MOCK.sms[0].body.text,html:daily861PreviewHtml(SESSION,daily821Contacts()[0]),prepared:SESSION.prepared&&SESSION.prepared.weather861}));
  assert.equal(output.text,before.replace('[Daily run link]','https://daily-review.invalid/d/fixture-token'));assert(output.prepared);assert.match(output.html,/Message text/);assert.doesNotMatch(output.html,/Delivered/);
 });
 await test('Forecast changing after preview blocks card publication and SMS',async({page})=>{
  await page.evaluate(()=>daily821Prepare(SESSION));await page.evaluate(()=>{MOCK.forecast.max_c=32;return daily821Send(SESSION);});const s=await state(page);assert.equal(s.card,0);assert.equal(s.sms,0);assert.match(s.message,/Weather changed.*Preview again/i);
 });
 for(const mode of ['changedWeather','expiredWeather'])await test(mode+' during publication prevents stale SMS',async({page})=>{
  await page.evaluate(m=>{MOCK.cardMode=m;return daily821Send(SESSION);},mode);const s=await state(page);assert.equal(s.card,1);assert.equal(s.sms,0);assert.match(s.message,/Weather changed.*Preview again/i);
 });
 await test('Restored receipt never invents the original sent message',async({page,boot})=>{
  await page.evaluate(()=>daily821Send(SESSION));assert.match(await page.evaluate(()=>daily861PreviewHtml(SESSION,daily821Contacts()[0])),/Message text/);await boot();assert.equal(await page.evaluate(()=>daily861PreviewHtml(SESSION,daily821Contacts()[0])),'');
 });
 await test('Message above server length limit fails before any SMS',async({page})=>{
  await page.evaluate(()=>{TEAM.people[0].name='A'.repeat(400);SESSION.recipient=TEAM.people[0].name;return daily821Send(SESSION);});const s=await state(page);assert.equal(s.sms,0);assert.match(s.message,/too long|length/i);
 });
 await test('Unsafe recipient markup is escaped in visible message preview',async({page})=>{
  const result=await page.evaluate(()=>{const s={iso:SESSION.iso,locked:false};document.querySelector('#host').innerHTML=daily861PreviewHtml(s,{name:'<img/onerror=alert(1)> Surname'});return{html:document.querySelector('#host').innerHTML,images:document.querySelectorAll('#host img').length};});assert.equal(result.images,0);assert.match(result.html,/&lt;img/);
 });
 const summary={author:'Andrew Fisher',scope:'v8.61 candidate daily-run flow in isolated Chromium with fixture-only APIs; no real SMS or record writes',candidateSha256:crypto.createHash('sha256').update(native).digest('hex'),helperSha256:crypto.createHash('sha256').update(newSource).digest('hex'),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),rendererSha256:crypto.createHash('sha256').update(renderer).digest('hex'),passed:results.filter(x=>x.pass).length,total:results.length,externalRequests:external,errors,results};
 fs.writeFileSync(path.join(out,'tested-daily861-source.js'),source);fs.writeFileSync(path.join(out,'tested-daily861-renderer.js'),renderer);fs.writeFileSync(path.join(out,'send-browser-report.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));await browser.close();process.exitCode=summary.passed===summary.total&&!errors.length&&!external.length?0:1;
})().catch(e=>{console.error(e);process.exitCode=1;});
