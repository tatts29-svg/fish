// Author: Andrew Fisher. Event Portables PDF and attached-email draft checks. Live GETs only.
// PAGE is the candidate (omit for actual-public checks); OUT must be a private evidence folder.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const R=process.env.REPO||path.resolve(__dirname,'..'),O=process.env.OUT;
if(!O)throw Error('Set a private OUT directory');
const {installWriteGuard,ready840,nativeSnapshot}=require(R+'/v8.40_today_work_progress_LIVE/test_today840.cjs');
const {open}=require(R+'/toolchain/harness/open_page.js'),guard=installWriteGuard();
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const plain=s=>String(s||'').replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/×/g,'x').normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
const jsQR=require(process.env.JSQR||'/workspace/fish/01_Reporting_Suite/jsQR.min.js');
const report={author:'Andrew Fisher',at:new Date().toISOString(),scope:process.env.PAGE?'Local candidate, live record GETs only':'Actual public HTML, live record GETs only',views:[]};
function pdfCheck(buffer,file,pages){
 assert(buffer.subarray(0,5).equals(Buffer.from('%PDF-')),'PDF magic');assert(buffer.length>1000,'Non-empty PDF');fs.writeFileSync(file,buffer);
 const info=cp.execFileSync('pdfinfo',[file],{encoding:'utf8'});assert.equal(Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]),pages,'Expected PDF page count');assert(/Page size:\s+[\d.]+ x [\d.]+ pts \(A4\)/.test(info),'A4 PDF');return info;
}
function draftCheck(data,buffer){
 assert(data.eml.startsWith('X-Unsent: 1\r\n'),'Draft, not sent message');assert(!/^To:/mi.test(data.eml),'No invented recipients');assert(data.eml.includes('Subject: '+data.subject+'\r\n'),'Correct subject');
 const boundary=/boundary="([^"]+)"/.exec(data.eml)?.[1];assert(boundary,'MIME boundary');
 const parts=data.eml.split('--'+boundary),pdf=parts.find(p=>p.includes('Content-Type: application/pdf')),body=parts.find(p=>p.includes('Content-Type: text/plain'));
 assert(pdf&&body,'PDF and body MIME parts');assert(pdf.includes('filename="'+data.name+'"'),'Exact PDF filename');
 const bytes=Buffer.from(pdf.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim(),'base64');assert(bytes.equals(buffer),'EML embeds exact PDF bytes');
 const text=Buffer.from(body.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim(),'base64').toString('utf8');assert.equal(text,data.text);assert(!/https?:\/\//.test(text),'Email attaches PDF rather than replacing it with a link');
 return {pdfBytes:bytes.length,pdfSha:sha(bytes),subject:data.subject};
}
function rasterCheck(file,crops,expectedUrls){
 const py=`import fitz,json,sys,pathlib
x=json.load(sys.stdin);d=fitz.open(x['file']);out=[];links=[]
for page in d:
 for link in page.get_links():
  if link.get('uri'): links.append({'page':page.number,'rect':list(link['from']),'url':link['uri']})
if x.get('crops') is None:
 seen=set();crops=[]
 for l in links:
  if l['url'] not in seen: crops.append(l);seen.add(l['url'])
else: crops=x['crops']
for i,c in enumerate(crops):
 r=fitz.Rect(c['rect']);p=d[c.get('page',0)].get_pixmap(matrix=fitz.Matrix(5,5),clip=r,alpha=True)
 f=x['file']+'.qr'+str(i)+'.rgba';pathlib.Path(f).write_bytes(p.samples);out.append({'path':f,'w':p.width,'h':p.height,'url':c.get('url')})
d[0].get_pixmap(matrix=fitz.Matrix(1.5,1.5)).save(x['file']+'.png')
print(json.dumps({'links':links,'crops':out}))`;
 const res=JSON.parse(cp.execFileSync('python3',['-c',py],{input:JSON.stringify({file,crops}),encoding:'utf8',maxBuffer:5*1024*1024}));
 if(expectedUrls)assert.deepEqual([...new Set(res.links.map(l=>l.url))].sort(),[...new Set(expectedUrls)].sort(),'PDF link annotations match qualified inventory locations');
 for(const c of res.crops){const raw=fs.readFileSync(c.path),qr=jsQR(new Uint8ClampedArray(raw),c.w,c.h,{inversionAttempts:'attemptBoth'});assert(qr,'Raster QR decodes: '+path.basename(c.path));assert.equal(qr.data,c.url,'Raster QR destination matches source');}
 return {annotations:res.links.length,decoded:res.crops.length};
}
async function fileEvidence(p,kind,n){return p.evaluate(async({kind,n})=>{
 const original=pdf7Shot,shots=[];pdf7Shot=async(...args)=>{const shot=await original(...args);shots.push({qrs:shot.qrs});return shot;};let F;
 try{F=await(kind==='inventory'?epInventoryPdf860(()=>true):epLoadPdf860(n,()=>true));}finally{pdf7Shot=original;}window.__ep860QaFile=F;if(kind==='load'){window.__ep860QaLoads=window.__ep860QaLoads||{};window.__ep860QaLoads[n]=F;}
 const draft=await epDraft860(F);return {name:F.name,pages:F.pages,size:F.size,subject:F.subject,text:F.text,shots,base64:(await pdf7DataUrl(F.blob)).split(',')[1],eml:await(await fetch(draft.url)).text(),draftName:draft.name};
},{kind,n});}
(async()=>{let s;try{
 fs.mkdirSync(O,{recursive:true});
 for(const W of [1366,390]){
  s=await open({pageFile:process.env.PAGE,hash:'#today',W,H:900,mobile:W===390,dpr:W===390?2:1});const p=s.page;await ready840(p);await p.waitForFunction(()=>typeof epDocuments860==='function');const before=await nativeSnapshot(p);
  await p.evaluate(()=>{go('timeline');window.__ep860PrintCalls=0;window.print=()=>window.__ep860PrintCalls++;});await p.waitForTimeout(1200);
  const expected=await p.evaluate(()=>EP819.loads.map(l=>({n:l.n,date:l.date,stops:l.stops.length,urls:l.stops.map(s=>s.directions_url),subject:'GC500 - Event Portables - Load '+l.n+' - '+epDay819(l.date,false)})));
  const view={width:W,loads:[],inventory:null,modal:[]};report.views.push(view);
  assert.equal(await p.locator('[data-ep860-email]').count(),expected.length,'Email option for every supplier load');
  const loads=W===1366?expected:[expected.reduce((a,b)=>a.stops>=b.stops?a:b)];
  for(const L of loads){
   const data=await fileEvidence(p,'load',L.n),bytes=Buffer.from(data.base64,'base64');assert.equal(data.pages,1);assert.equal(data.size,bytes.length);assert.equal(data.subject,L.subject);assert.equal(data.name,'GC500_Event_Portables_Load-'+L.n+'_'+L.date+'.pdf');
   const file=O+'/load-'+L.n+'-'+W+'.pdf';pdfCheck(bytes,file,1);const draft=draftCheck(data,bytes);fs.writeFileSync(O+'/load-'+L.n+'-'+W+'.eml',data.eml);assert.equal(await p.locator('.ep860-capture').count(),0,'Capture cleaned');
   const qrs=data.shots.flatMap(s=>s.qrs),pt=72/25.4;assert.equal(qrs.length,L.urls.length);const raster=rasterCheck(file,qrs.map((q,i)=>({page:0,url:L.urls[i],rect:[q.x+8,q.y+8,q.x+8+q.w,q.y+8+q.h].map(v=>v*pt)})));view.loads.push({...L,...draft,raster});console.log('PASS '+W+' supplier load '+L.n+' A4 PDF, scanned QR and exact attached draft');
  }
  const model=await p.evaluate(()=>holdAssets(epInventory860)),inventory=await fileEvidence(p,'inventory'),ib=Buffer.from(inventory.base64,'base64'),ip=O+'/inventory-'+W+'.pdf';pdfCheck(ib,ip,inventory.pages);draftCheck(inventory,ib);
  const text=cp.execFileSync('pdftotext',['-layout',ip,'-'],{encoding:'utf8'}),images=cp.execFileSync('pdfimages',['-list',ip],{encoding:'utf8'});assert(!/^\s*\d+\s+\d+\s+image\s/m.test(images),'Inventory is vector, not raster image');
  assert(text.includes('Event Portables inventory'));assert(text.includes('Asset numbers'));assert(text.includes('Reference'));assert(text.includes('Location QR'));assert(text.includes('Author: Andrew Fisher'));assert(!text.includes('$'),'Inventory contains no pricing');
  const contentText=cp.execFileSync('pdftotext',[ip,'-'],{encoding:'utf8'}),noSpace=s=>s.replace(/\s+/g,'');for(const r of model.rows){if(r.assetNo)assert(noSpace(contentText).includes(noSpace(plain(r.assetNo))),'Printed asset '+r.assetNo);if(r.ref)assert(noSpace(contentText).includes(noSpace(plain(r.ref))),'Printed reference '+r.ref);}
  const raster=rasterCheck(ip,null,model.rows.map(r=>r.url).filter(Boolean));view.inventory={pages:inventory.pages,bytes:ib.length,sha:sha(ib),rows:model.rows.length,vector:true,raster};fs.writeFileSync(O+'/inventory-'+W+'.eml',inventory.eml);fs.writeFileSync(O+'/inventory-'+W+'.txt',text);console.log('PASS '+W+' vector inventory, recorded identities, scanned QR and attached draft');
  // Reuse the actual checked load file for the load-modal lifecycle (never inventory under a load title).
  const modalFile=await p.evaluate(()=>{window.__ep860QaFile=window.__ep860QaLoads[1]||Object.values(window.__ep860QaLoads)[0];const f=window.__ep860QaFile;return{name:f.name,size:f.size};});
  // Producer cancellation performs no printable side effect.
  assert.equal(await p.evaluate(()=>epLoadPdf860(1,()=>false)),null);assert.equal(await p.locator('.ep860-capture').count(),0);
  // The real file producer is already checked above. A held producer deterministically checks close/retry races.
  await p.evaluate(()=>{window.__ep860QaProducer=epLoadPdf860;window.__ep860QaRelease=null;epLoadPdf860=(n,alive)=>new Promise(resolve=>{window.__ep860QaRelease=()=>resolve(alive()?window.__ep860QaFile:null);});});
  const opener=p.locator('[data-ep860-email]').first();await opener.click();assert(await p.locator('#ep860-dialog').isVisible());await p.locator('[data-ep860-close]').click();await p.evaluate(()=>window.__ep860QaRelease());await p.waitForTimeout(50);assert.equal(await p.locator('#ep860-dialog').count(),0);assert.equal(await p.evaluate(()=>EP860.file),null);assert(await opener.evaluate(e=>document.activeElement===e));view.modal.push('cancel-before-ready restores focus and cannot resurrect');
  // Reuse the verified PDF only for testing the draft/share controls, with the platform APIs intercepted.
  await p.evaluate(()=>{epLoadPdf860=async()=>window.__ep860QaFile;window.__ep860ShareMode='ok';window.__ep860Shares=[];Object.defineProperty(navigator,'canShare',{configurable:true,value:o=>!!o.files?.length});Object.defineProperty(navigator,'share',{configurable:true,value:async o=>{window.__ep860Shares.push({title:o.title,text:o.text,names:o.files.map(f=>f.name),types:o.files.map(f=>f.type),bytes:await Promise.all(o.files.map(async f=>(await f.arrayBuffer()).byteLength))});if(window.__ep860ShareMode==='cancel')throw new DOMException('Cancelled','AbortError');}});});
  await opener.click();await p.locator('[data-ep860-share]').waitFor({state:'visible'});await p.screenshot({path:O+'/email-ready-'+W+'.png'});await p.locator('[data-ep860-share]').click();await p.waitForFunction(()=>document.querySelector('#ep860-dialog .pdf7-say').textContent.includes('share sheet'));let share=await p.evaluate(()=>window.__ep860Shares.at(-1));assert.deepEqual(share.names,[modalFile.name]);assert.deepEqual(share.types,['application/pdf']);assert.deepEqual(share.bytes,[modalFile.size]);view.modal.push('share passes PDF File, subject and body');
  await p.evaluate(()=>window.__ep860ShareMode='cancel');await p.locator('[data-ep860-share]').click();await p.waitForFunction(()=>document.querySelector('#ep860-dialog .pdf7-say').textContent.includes('cancelled'));assert(await p.locator('[data-ep860-share]').isEnabled());view.modal.push('cancelled share retains PDF and retry');
  await p.keyboard.press('Escape');assert.equal(await p.locator('#ep860-dialog').count(),0);
  await p.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));await opener.click();await p.locator('[data-ep860-share]').waitFor({state:'visible'});const dl=p.waitForEvent('download');await p.locator('[data-ep860-share]').click();const download=await dl;assert.equal(download.suggestedFilename(),modalFile.name.replace(/\.pdf$/,'.eml'));await download.saveAs(O+'/desktop-fallback-'+W+'.eml');assert.equal(fs.readFileSync(O+'/desktop-fallback-'+W+'.eml','utf8').includes('Content-Type: application/pdf'),true);view.modal.push('non-share browser downloads email draft with attachment');
  await p.keyboard.press('Escape');await p.evaluate(()=>{epLoadPdf860=window.__ep860QaProducer;delete window.__ep860QaProducer;delete window.__ep860QaFile;});assert.equal(await p.evaluate(()=>window.__ep860PrintCalls),0,'Email preparation never calls print or transit');
  const after=await nativeSnapshot(p);assert.deepEqual(after.collections,before.collections,'All native records preserved');assert.equal(s.errors.length,0,s.errors.join('\n'));view.recordsPreserved=true;
  fs.writeFileSync(O+'/documents860.json',JSON.stringify(report,null,2));console.log('PASS '+W+' cancellation, retry, attachment share, desktop draft fallback and no record changes');await s.browser.close();s=null;
 }
 assert(!guard.nonGetSeen.some(x=>x.operational),'No operational writes');const expectedGuardError=e=>e.url==='https://tile.googleapis.com/v1/createSession'&&/ERR_BLOCKED_BY_CLIENT/.test(e.text)&&guard.blocked.some(b=>b.method==='POST'&&b.url===e.url),unexpected=guard.consoleErrors.filter(e=>!expectedGuardError(e));assert.equal(unexpected.length,0,JSON.stringify(unexpected));report.operationalWrites=0;report.unexpectedConsoleErrors=0;report.intentionalGetOnlyMapBlocks=guard.consoleErrors.filter(expectedGuardError);report.blockedRequests=guard.blocked;fs.writeFileSync(O+'/documents860.json',JSON.stringify(report,null,2));
}finally{if(s)await s.browser.close();await guard.closeAll();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
