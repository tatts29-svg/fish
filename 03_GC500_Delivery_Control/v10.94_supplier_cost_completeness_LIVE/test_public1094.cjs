/* Author: Andrew Fisher. Actual public-page read-back; no local page/API substitution. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {open}=require('../record_20Oct2026_fencing_alignment/readonly_page.cjs');
const {curlFetch}=require('../toolchain/harness/curlfetch.js');
const [expectedPath,out]=process.argv.slice(2),sha=process.env.GC500_EXPECTED_PAGE_SHA;
if(!expectedPath||!out||!/^[a-f0-9]{64}$/.test(sha||''))throw Error('Private expected candidate snapshot, private output and exact released page hash required');
for(const p of [expectedPath,out])if(!path.isAbsolute(p)||path.resolve(p).startsWith(path.resolve(__dirname,'../..')+path.sep))throw Error('Evidence must remain outside the public repository');
if(process.env.PAGE)throw Error('Local page substitution is not a public read-back');
const expected=JSON.parse(fs.readFileSync(expectedPath,'utf8')),host='https://gc500-production.up.railway.app/v/Coates-GC500-2026';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const readPage=async()=>{const r=await curlFetch(host,{'cache-control':'no-cache'},'GET');assert.equal(r.status,200);assert.equal(digest(r.body),sha);return r.body.length;};
const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2),{mode:0o600});
(async()=>{
 fs.mkdirSync(out,{recursive:true,mode:0o700});const bytes=await readPage();
 const s=await open({hash:'#subhired',W:390,H:844,dpr:2,mobile:true});
 try{
  await s.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&window.GC500Refresh904?.report().settled,null,{timeout:180000});
  const actual=await s.page.evaluate(()=>holdAssets(()=>({recordVersion:SYNC.backend.readVersion821(),quotes:DATA.rehire_quotes,service:servicing748(),money:moneySummary(),ledger:pl770Model(),rehire:rh766Model(),status:epCostStatus1094Model(),supplier:Supplier996.model()})));
  assert(Number.isSafeInteger(actual.recordVersion)&&actual.recordVersion>=0,'native record version captured');
  assert.equal(actual.status.complete,true);assert.equal(actual.status.label,'All supplied rates recorded');
  assert.equal(actual.service.supplier1068.total,expected.service.supplier1068.total);
  assert.deepEqual(actual.money.charge,expected.money.charge,'verified customer Revenue');
  assert.deepEqual(actual.money.cost,expected.money.cost,'verified supplier cost inputs/totals');
  assert.deepEqual(actual.quotes,expected.quotes,'original source quotations');
  for(const k of ['costNow','costJob','revNow','revJob'])assert.equal(actual.ledger[k],expected.ledger[k],'public ledger '+k);
  assert(Object.values(actual.ledger.checks).every(Boolean));
  const current=actual.service.supplier1068.quotes.find(q=>q.quote==='Q6845');assert.equal(current.gst,null);assert.equal(current.total_amount,null);
  const ep=actual.rehire.groups.find(g=>g.what==='Toilets — Event Portables'),before=expected.rehire.groups.find(g=>g.what==='Toilets — Event Portables');
  for(const k of ['cost','costToCome','costJob','rev','revToCome','revJob','branch'])assert.equal(ep[k],before[k]);
  for(const k of ['onSite','received','references','remaining'])assert.equal(actual.supplier.summary[k],expected.supplier.summary[k],'supplier '+k);
  const card=s.page.locator('#pane-subhired [data-supplier-cost1094]');await card.scrollIntoViewIfNeeded();assert(await card.isVisible());
  const bounds=await card.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,text:e.innerText}));
  assert(bounds.scroll<=bounds.width+2);assert.match(bounds.text,/Invoice and PO check separate/);
  await s.page.screenshot({path:path.join(out,'phone-public-subhired.png')});
  assert.equal(s.counts.page,0,'no local page replacement');assert.equal(s.counts.blocked,0,'no record writes');assert.deepEqual(s.errors,[]);
  await readPage();save('public-snapshot.json',actual);
  save('result.json',{pass:true,author:'Andrew Fisher',pageSha256:sha,bytes,recordVersion:actual.recordVersion,actualPublicPage:true,localPageReplacements:0,nativeWrites:0,errors:s.errors});
  console.log(JSON.stringify({pass:true,actualPublicPage:true,localPageReplacements:0,nativeWrites:0}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
