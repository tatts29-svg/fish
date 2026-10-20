/* Author: Andrew Fisher. GET-only browser practice; fixture documents never leave this browser. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {open} = require('../record_20Oct2026_fencing_alignment/readonly_page.cjs');
const {curlFetch} = require('../toolchain/harness/curlfetch.js');
const pageFile = process.env.PAGE;
const out = process.env.OUTDIR;
if (!pageFile || !out) throw new Error('Set PAGE to the candidate and OUTDIR to private evidence storage.');
fs.mkdirSync(out, {recursive:true});
(async()=>{
 const rig=await open({pageFile,mobile:true,W:390,H:844,dpr:1});
 try {
  await rig.page.waitForFunction(()=>typeof AreaPhotos1090==='object'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&GC500Refresh904.report().settled,{},{timeout:120000});
  // The periodic read may change the practice capability back to view. Keep its
  // live version/state, overriding only capability in this isolated browser.
  await rig.page.route('**/api/version',async route=>{
   try {
    assert.equal(route.request().method(),'GET');
    const response=await curlFetch(route.request().url(),route.request().headers(),'GET'),body=JSON.parse(response.body.toString('utf8'));
    await route.fulfill({...response,body:JSON.stringify({...body,level:'edit'})});
   } catch(error) { rig.errors.push('Practice version read failed');try{await route.abort();}catch(_){} }
  });
  const report=await rig.page.evaluate(async()=>{
   const checks=[],ok=(name,value)=>{checks.push({name,pass:!!value});if(!value)throw new Error(name);};
   const api=AreaPhotos1090,copy=x=>JSON.parse(JSON.stringify(x)),targets=api.options();
   const one=targets.find(t=>t.unitId),two=targets.find(t=>t.unitId&&t.ref!==one.ref);
   ok('current identities available at two references',one&&two);
   const a=assetOf(one.ref),b=assetOf(two.ref),ua=gcModel925(a,{loading:false}).rows.find(u=>u.id===one.unitId),ub=gcModel925(b,{loading:false}).rows.find(u=>u.id===two.unitId);
   const before=JSON.stringify(S),no='EXAMPLE-area-photo1090.jpg',nativeWrites=[];
   // All writes are intercepted by the GET-only harness as a second boundary.
   // This capture is the first boundary and still exercises the native staging/ACK code.
   SYNC.db.doc=k=>({set:body=>{nativeWrites.push({key:k,body:copy(body)});return Promise.resolve();},delete:()=>{throw new Error('Unexpected fixture delete');}});
   SYNC.readonly=false;SYNC.level='edit';window.capability=()=> 'edit';window.mayWrite=()=>true;window.whoAmI=()=> 'Example recorder';
   const originalUpload=SYNC.backend.upload;let uploads=0;SYNC.backend.upload=()=>{uploads++;throw new Error('Fixture media upload forbidden');};
   const firstPhoto={id:no,name:no,ref:one.ref,unit:one.unitId,slot:0,caption:'Original caption',by:'Example recorder',at:'2026-10-20T00:00:00Z'};
   S.photoLinks[no]=copy(firstPhoto);
   DOCS.files[no]={id:no,name:no,ref:one.ref,kind:'drop-photo',type:'image/jpeg',url:'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='};
   function photoLabels(asset,photo){
    const read=dropPhotosOf;
    try {
     dropPhotosOf=ref=>ref===asset.key?[photo]:read(ref);
     const box=document.createElement('div');mountFoundPics(box,asset);
     return {equipment:equipmentCard(asset),print:dpShotFigs(asset,'',1).join(''),found:box.innerHTML,legacy:dropPhotoBlock(asset)};
    } finally {dropPhotosOf=read;}
   }
   const ordinaryLabels=photoLabels(a,firstPhoto);
   ok('ordinary equipment photo retains On site',ordinaryLabels.equipment.includes('<span class="eqpl live">On site</span>'));
   ok('ordinary load-print photo retains On site',ordinaryLabels.print.includes('<figcaption>On site'));
   ok('ordinary found-photo overlay retains On site',ordinaryLabels.found.includes('>On site</span>'));
   ok('ordinary legacy photo wording retained',ordinaryLabels.legacy.includes('Taken after it went in.'));
   const baseSlots=dropPhotoSlots(two.ref,ub.id).filter(Boolean).length,basePins=JSON.stringify(pinUnits(b));
   ok('area option is discoverable before an area photo exists',api.panel(a).includes('Add area photo'));
   ok('new editor opens',api.open(one.ref));
   let d=api.drafts.get(one.ref);d.source=no;d.label='<img id="area-fixture-injection">';d.selected.set(JSON.stringify([two.ref,two.unitId]),copy(two));
   ok('one existing file gains explicit context',api.save(one.ref));
   const p=S.photoLinks[no];
   ok('original individual home retained',p.ref===firstPhoto.ref&&p.unit===firstPhoto.unit&&p.slot===firstPhoto.slot&&p.caption===firstPhoto.caption);
   ok('one shared document has one selected target',api.targets(p).length===1&&Object.keys(S.photoLinks).filter(k=>k===no).length===1);
   ok('target reference receives one projected file',dropPhotosOf(two.ref).filter(x=>x.id===no).length===1);
   ok('target item receives selected contextual gallery',api.contextGallery(b,ub,gcModel925(b,{loading:false})).includes(no));
   ok('context does not consume identification slots',dropPhotoSlots(two.ref,ub.id).filter(Boolean).length===baseSlots);
   ok('context cannot add asset-number pins',JSON.stringify(pinUnits(b))===basePins);
   ok('context excluded from individual photo reader',!Units925.photos(ub,[ub],dropPhotosOf(two.ref)).some(x=>x.id===no));
   ok('original primary reader retained',Units925.photos(ua,[ua],dropPhotosOf(one.ref)).some(x=>x.id===no));
   const serialized=toDocs('photoLinks')[docIdOf(no)];
   ok('serialized native document retains nested area metadata',serialized.area1090.targets[0].unitId===two.unitId&&serialized._k===no);
   ok('native hydration round trip retains exact metadata',JSON.stringify(fromDocs('photoLinks',{[docIdOf(no)]:serialized})[no])===JSON.stringify(p));
   syncStage();
   ok('staged native document retains one exact area plan',JSON.stringify(SYNC.queue.photoLinks[docIdOf(no)].area1090)===JSON.stringify(p.area1090));
   syncSend();await new Promise(r=>setTimeout(r,250));
   ok('captured native write carries area metadata',nativeWrites.some(w=>w.key==='photoLinks/'+docIdOf(no)&&w.body.area1090.targets[0].unitId===two.unitId));
   ok('existing file reuse uploads no media',uploads===0);
   ok('Documents scalar navigation home unchanged',photoRef815(DOCS.files[no])===one.ref);
   ok('Documents contextual reference is searchable',hay815(DOCS.files[no]).includes(two.ref.toLowerCase()));
   ok('print labels area context',dropShots(b).includes('Area context'));
   const areaLabels=photoLabels(b,api.projectForRef(p,two.ref)),areaOwnerLabels=photoLabels(a,api.projectForRef(p,one.ref));
   ok('equipment area photo has contextual overlay',areaLabels.equipment.includes('<span class="eqpl live">Area context</span>'));
   ok('load-print area photo has contextual caption',areaLabels.print.includes('<figcaption>Area context'));
   ok('ready found-photo projection carries context type',areaLabels.found.includes('>Area context</span>')&&areaLabels.found.includes('linked photograph'));
   ok('legacy owner photo tools label area context',areaOwnerLabels.legacy.includes('dphl">Area context</span>'));
   ok('legacy area container avoids inferred completion or photo orientation',!areaOwnerLabels.legacy.includes('Taken after it went in.')&&areaOwnerLabels.legacy.includes('do not establish placement, identity or completed work'));
   ok('found area footer uses linked photograph wording',areaLabels.found.includes('A linked photograph opens')&&!areaLabels.found.includes('A photograph of the drop opens'));
   ok('label HTML escaped',api.panel(a).includes('&lt;img')&&!api.panel(a).includes('<img id="area-fixture-injection">'));
   api.open(two.ref,no);d=api.drafts.get(two.ref);
   photoLinkPut({...dropPhotosOf(two.ref).find(x=>x.id===no),ref:two.ref,caption:'Changed caption'},'Example recorder');
   ok('caption from another reference retains original home and memberships',S.photoLinks[no].ref===one.ref&&S.photoLinks[no].unit===one.unitId&&api.targets(S.photoLinks[no]).length===1);
   ok('stale manager refuses to overwrite caption edit',api.save(two.ref)===false);
   api.open(two.ref,no);d=api.drafts.get(two.ref);d.selected.clear();
   ok('removing one membership succeeds',api.save(two.ref));
   ok('unlink retains original file and primary evidence',!S.photoLinks[no].removed&&S.photoLinks[no].ref===one.ref&&!dropPhotosOf(two.ref).some(x=>x.id===no));
   api.open(one.ref,no);d=api.drafts.get(one.ref);d.selected.set(JSON.stringify([two.ref,two.unitId]),copy(two));api.save(one.ref);
   api.open(one.ref,no);d=api.drafts.get(one.ref);d.primaryDetached=true;api.save(one.ref);
   ok('detaching primary does not remove area membership',!Units925.photos(ua,[ua],dropPhotosOf(one.ref)).some(x=>x.id===no)&&api.targets(S.photoLinks[no]).length===1);
   const refs=targets.filter(t=>t.scope==='reference'&&t.ref!==one.ref&&t.ref!==two.ref).slice(0,2);
   ok('explicit context selector is available across references',refs.length===2);
   api.open(refs[0].ref);d=api.drafts.get(refs[0].ref);d.source=no;
   refs.forEach(t=>d.selected.set(JSON.stringify([t.ref]),copy(t)));
   ok('reference contexts can reuse the same file',api.save(refs[0].ref));
   const mixed=api.targets(S.photoLinks[no]);
   ok('mixed reference and unit memberships preserve earlier links',mixed.length===3&&mixed.filter(t=>t.scope==='reference').length===2&&S.photoLinks[no].ref===one.ref);
   ok('each explicit reference receives one contextual file',refs.every(t=>dropPhotosOf(t.ref).filter(p=>p.id===no).length===1));
   const wire=toDocs('photoLinks')[docIdOf(no)].area1090.targets.filter(t=>t.scope==='reference');
   ok('native reference membership stores types without fictional unit IDs',wire.length===2&&wire.every(t=>Array.isArray(t.items)&&!Object.hasOwn(t,'unitId')&&!Object.hasOwn(t,'active')));
   ok('reference context cannot automatically enrol a new unit',!api.forUnit(S.photoLinks[no],{id:'example-new-unit',ref:refs[0].ref,physical:true,owner:'example-owner',assetNo:'EXAMPLE-NEW',item:refs[0].items[0]}));
   api.open(refs[0].ref,no);d=api.drafts.get(refs[0].ref);d.selected.delete(JSON.stringify([refs[0].ref]));
   ok('one reference membership can be removed independently',api.save(refs[0].ref)&&!dropPhotosOf(refs[0].ref).some(p=>p.id===no)&&dropPhotosOf(refs[1].ref).some(p=>p.id===no)&&api.targets(S.photoLinks[no]).some(t=>t.unitId===two.unitId));
   api.open(one.ref,no);
   const unchanged=JSON.stringify(S.photoLinks[no]);
   SYNC.readonly=true;window.capability=()=> 'view';
   ok('view-only has no add or manager controls',!api.panel(a).includes('data-area1090-new')&&!api.panel(a).includes('data-area1090-manage'));
   ok('a capability change hides an already-open editor',!api.panel(a).includes('data-area1090-save'));
   ok('view-only rejects management',api.open(one.ref,no)===false&&JSON.stringify(S.photoLinks[no])===unchanged);
   SYNC.readonly=false;window.capability=()=> 'edit';api.open(one.ref,no);applyCapability();
   ok('fixture did not upload or delete media',uploads===0);
   window.__areaPractice={id:no,ref:one.ref,checks,nativeWriteCount:nativeWrites.length};
   return {checks,nativeWriteCount:nativeWrites.length,photoDocumentWrites:nativeWrites.filter(w=>w.key.startsWith('photoLinks/')).length,uploads};
  });
  await rig.page.locator('.area1090-editor').scrollIntoViewIfNeeded();
  const counter=rig.page.locator('.area1090-editor [data-area1090-count]');
  const prior=Number((await counter.textContent()).split(' ')[0]);
  const checkbox=rig.page.locator('.area1090-editor [data-area1090-target]').first(),checked=await checkbox.isChecked();
  await checkbox.setChecked(!checked);
  assert.equal(Number((await counter.textContent()).split(' ')[0]),prior+(checked?-1:1));
  report.checks.push({name:'phone checkbox updates selected count immediately',pass:true});
  report.phoneLayout=await rig.page.locator('.area1090-targets').evaluate(el=>{
   const cb=el.querySelector('input'),label=el.querySelector('span');
   return {checkboxWidth:cb.getBoundingClientRect().width,checkboxHeight:cb.getBoundingClientRect().height,labelWidth:label.getBoundingClientRect().width,overflow:el.scrollWidth>el.clientWidth+2};
  });
  assert.ok(report.phoneLayout.checkboxWidth>=20&&report.phoneLayout.checkboxWidth<=24);
  assert.ok(report.phoneLayout.labelWidth>150&&!report.phoneLayout.overflow);
  await rig.page.screenshot({path:path.join(out,'phone-area-manager.png')});
  report.errors=rig.errors;report.requests=rig.counts;
  fs.writeFileSync(path.join(out,'runtime-results.json'),JSON.stringify(report,null,2));
  assert.equal(report.checks.filter(x=>!x.pass).length,0);
  assert.deepEqual(rig.errors,[]);
  assert.equal(rig.counts.blocked,0);
  console.log(JSON.stringify({checks:report.checks.length,errors:rig.errors.length,nativeRequests:rig.counts.blocked,uploads:report.uploads}));
 } finally {await rig.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
