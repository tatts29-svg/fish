/* Author: Andrew Fisher. Grouped FWF photos in the real drawer; native writes remain blocked. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const release=path.resolve(__dirname,'../..'),{open}=require(path.resolve(release,'../toolchain/harness/open_page'));
const live=process.env.LIVE==='1',mobile=process.env.MOB==='1',out=process.env.OUT||('/workspace/private-photos1010-'+(live?'public-':'candidate-')+(mobile?'phone':'desktop'));
if(!live&&!process.env.PAGE)throw Error('PAGE is required');fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',checks:[],screenshots:[],errors:[]},check=(name,ok,detail)=>{report.checks.push({name,pass:!!ok,...(detail===undefined?{}:{detail})});assert(ok,name);};
let h,p,before;
async function choose(item){await p.selectOption('[data-unit925-description]',item);await p.waitForFunction(value=>document.querySelector('[data-unit925-description]')?.value===value,item);}
async function shot(name){const file=path.join(out,name+'.png');await p.screenshot({path:file});report.screenshots.push(file);}
(async()=>{try{
 h=await open({pageFile:live?undefined:process.env.PAGE,hash:'#today',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1});p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
 before=await p.evaluate(()=>JSON.stringify(S));report.recordVersion=await p.evaluate(()=>SYNC.backend.readVersion821());
 report.sha256=live?await p.evaluate(async()=>{const r=await fetch('/v/Coates-GC500-2026',{cache:'no-store'});if(!r.ok)throw Error('Parent not available');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');}):crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
 check('Expected parent bytes',!process.env.EXPECTED_SHA||report.sha256===process.env.EXPECTED_SHA);
 await p.evaluate(()=>openAsset('WC09'));await choose('FWF');
 check('One FWF location photo area',await p.locator('.fwf1010-card').count()===1);
 check('FWF photo area uses the four-FWF scope',await p.locator('.fwf1010-card h4').textContent()==='4 × FWF · WC09 photos');
 check('No individual FWF photo buttons remain',await p.locator('[data-unit925-id] [data-item933-view]').count()===0);
 check('Individual FWF details and work remain',await p.locator('[data-unit925-id] details').count()>0);
 await p.locator('.fwf1010-gallery summary').click();await shot('fwf-location-photos');
 await p.evaluate(()=>{Idle1006.refreshDrawer();});
 check('Open location gallery survives shared drawer refresh',await p.locator('.fwf1010-gallery').evaluate(el=>el.open));
 await p.locator('.fwf1010-gallery summary').click();await p.evaluate(()=>Idle1006.refreshDrawer());
 check('Explicitly closed gallery stays closed',await p.locator('.fwf1010-gallery').evaluate(el=>!el.open));
 await choose('Pee Panel');check('Pee Panel retains its own photo card',await p.locator('[data-item965-key]').count()===1&&await p.locator('.fwf1010-card').count()===0);
 await choose('FWF');
 await p.evaluate(()=>{
  window.__fwfOriginal1010={photos:dropPhotosOf,photoFor,add:dropPhotoAdd,may:mayWrite,who:whoAmI,cap:capability,readonly:SYNC.readonly};
  const a=assetOf('WC09'),model=gcModel925(a),unit=model.rows.find(u=>u.item==='FWF'&&u.physical);if(!unit)throw Error('WC09 has no physical FWF fixture anchor');
  window.__fwfFixture1010=[{id:'fixture-legacy-fwf',unit:unit.id,slot:0,caption:'Existing FWF caption'},{id:'fixture-group-fwf',unit:FwfPhotos1010.token('WC09'),slot:0,caption:'Location FWF caption'},{id:'fixture-pee',unit:ItemPhotos965.token('WC09','Pee Panel'),slot:0,caption:'Separate pee panel photo'}];
  dropPhotosOf=ref=>window.__fwfOriginal1010.photos(ref).concat(ref==='WC09'?window.__fwfFixture1010:[]);
  photoFor=ph=>String(ph.id).startsWith('fixture-')?{state:'ready',url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZAAAAABJRU5ErkJggg=='}:window.__fwfOriginal1010.photoFor(ph);
  mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher test';capability=()=> 'edit';SYNC.readonly=false;
  dropPhotoAdd=async(ref,slot,file,tell,unit,intent)=>{window.__fwfCaptured1010={ref,slot,unit,intent};tell('Isolated upload intent checked; no file sent.');return true;};
  openAsset('WC09');
 });await choose('FWF');
 check('One shared Add photo input',await p.locator('input[data-fwf1010-add]:not([data-fwf1010-replace])').count()===1);
 check('Existing unit and new group photos appear once each',await p.locator('[data-fwf1010-photo="fixture-legacy-fwf"]').count()===1&&await p.locator('[data-fwf1010-photo="fixture-group-fwf"]').count()===1);
 check('Pee-panel photo excluded from FWF gallery',await p.locator('[data-fwf1010-photo="fixture-pee"]').count()===0);
 check('Original caption remains visible',await p.locator('.fwf1010-card').textContent().then(t=>t.includes('Existing FWF caption')));
 const field=p.locator('input[data-fwf1010-add]:not([data-fwf1010-replace])');
 await p.evaluate(()=>{SYNC.readonly=false;});
 await field.setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2ZAAAAABJRU5ErkJggg==','base64')});
 await p.waitForFunction(()=>!!window.__fwfCaptured1010);
 const captured=await p.evaluate(()=>window.__fwfCaptured1010);
 check('New photo intent belongs to whole FWF group',captured.ref==='WC09'&&captured.unit==='["location-item1010","WC09","FWF"]'&&captured.intent.fwfGroup1010===true);
 check('New photo uses an empty group slot without replacing an old unit photo',captured.slot===1&&captured.intent.replace===null);
 await p.evaluate(()=>{const old=window.__fwfOriginal1010;dropPhotosOf=old.photos;photoFor=old.photoFor;dropPhotoAdd=old.add;mayWrite=old.may;whoAmI=old.who;capability=old.cap;SYNC.readonly=old.readonly;delete window.__fwfOriginal1010;delete window.__fwfFixture1010;delete window.__fwfCaptured1010;openAsset('WC09');});await choose('FWF');
 check('Native record unchanged',await p.evaluate(record=>JSON.stringify(S)===record,before));check('No browser errors',h.errors.length===0,h.errors);check('No operational writes attempted',h.counts.blocked===0,h.counts);report.pass=true;
 }catch(e){report.pass=false;report.error=String(e.stack||e);process.exitCode=1;}
 finally{if(h){try{await p.evaluate(()=>{const old=window.__fwfOriginal1010;if(old){dropPhotosOf=old.photos;photoFor=old.photoFor;dropPhotoAdd=old.add;mayWrite=old.may;whoAmI=old.who;capability=old.cap;SYNC.readonly=old.readonly;}});}catch(_){}report.errors=h.errors;report.counts=h.counts;await h.browser.close();}fs.writeFileSync(path.join(out,'photos1010.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,checks:report.checks.length,out,error:report.error}));}
})();
