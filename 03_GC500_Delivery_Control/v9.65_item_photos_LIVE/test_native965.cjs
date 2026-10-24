// Author: Andrew Fisher. Native5167 fixture; network GET only; upload outbox captured locally.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict'),crypto=require('crypto');
const out=process.argv[4]||'/workspace/private-item965',candidate=process.argv[2]||out+'/candidate965.html',fixture=process.argv[3]||'/workspace/private-quantity964/state5167.json',tool='/workspace/gc500-current-release/03_GC500_Delivery_Control/toolchain/harness',hp=tool+'/open_page.js';
const active=JSON.parse(fs.readFileSync(fixture));active.level='edit';
const fetcher=require(tool+'/curlfetch'),native=fetcher.curlFetch;
fetcher.curlFetch=async(url,headers,method,body)=>{assert.equal(method,'GET');const u=new URL(url);if(['/api/state','/api/version'].includes(u.pathname))return{status:200,headers:{'content-type':'application/json'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?active:{version:active.version,updated:active.updated,level:'edit'}))};return native(url,headers,method,body);};
const m=new Module(hp,module);m.filename=hp;m.paths=Module._nodeModulePaths(path.dirname(hp));m._compile(fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;'),hp);
(async()=>{const h=await m.exports.open({pageFile:candidate,W:390,H:844,mobile:true,hash:'#today'}),p=h.page;const checks=[],views={},noteWrites=[];try{
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:150000});
 const before=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>{capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';SYNC.readonly=false;SYNC.level='edit';});
 async function select(ref,item){await p.evaluate(ref=>openAsset(ref),ref);await p.locator('#drawer.on [data-unit925-description]').selectOption({label:item});await p.waitForTimeout(250);return p.locator('#drawer.on');}
 // Units925.select is the native selection API; record its output without editing data.
 for(const [ref,items] of Object.entries({WC09:['Pee Panel','FWF','Toilet Block 6m'],WC31:['Accessible Toilet','16Pan Block'],T0103:['VMS'],T0025:['Trakmat'],WB01:['TL2']}))for(const item of items){
  const d=await select(ref,item);const value=await d.evaluate(n=>({header:n.querySelector('.nm816').innerText,text:n.querySelector('.units925').innerText,html:n.outerHTML,quantityAdd:n.querySelectorAll('[data-item965-add]').length,physicalAdd:n.querySelectorAll('[data-item933-add]').length}));views[ref+'|'+item]=value;
  assert.match(value.header,new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 }
 assert.match(views['WC09|Pee Panel'].header,/SUB-HIRED.*Event Portables/);assert.doesNotMatch(views['WC09|Pee Panel'].header,/1268858|1311146|KINP|FWF/);
 assert.equal(views['WC09|Pee Panel'].quantityAdd,1);assert.equal(views['WC09|Pee Panel'].physicalAdd,0);
 assert.match(views['WC09|FWF'].header,/0085.*0551.*0450.*0585|Event Portables/);assert.doesNotMatch(views['WC09|FWF'].header,/1268858|1311146|KINP/);assert.equal(views['WC09|FWF'].physicalAdd,4);
 assert.match(views['WC09|Toilet Block 6m'].header,/1268858/);assert.doesNotMatch(views['WC09|Toilet Block 6m'].header,/Event Portables|0085/);
 assert.match(views['WC31|16Pan Block'].header,/Event Portables/);assert.doesNotMatch(views['WC31|16Pan Block'].header,/1317645|KINP/);
 assert.match(views['T0103|VMS'].header,/Coates/);assert.match(views['T0103|VMS'].header,/SUB-HIRED.*PremAir Hire/);
 for(const id of ['T0025|Trakmat','WB01|TL2']){assert.equal(views[id].quantityAdd,1);assert.equal(views[id].physicalAdd,0);assert.doesNotMatch(views[id].text,/individual identity|Identify another physical unit/);}
 checks.push('Nine mixed/quantity selections use correct headers, owners and upload targets');
 const nativeModels=await p.evaluate(()=>({quantity:ItemPhotos965.read('WC09',ItemPhotos965.token('WC09','Pee Panel')),mat:ItemPhotos965.read('T0025',ItemPhotos965.token('T0025','Trakmat')),panels:gcUnits925(assetOf('WC09')),sup:epInventory860().summary,counts:todayWorkSummary848(todayIso()).byId.toilets}));
 assert.deepEqual([nativeModels.quantity.quantity,nativeModels.quantity.received,nativeModels.quantity.installed],[6,6,6]);assert.equal(nativeModels.mat.quantity,20);
 assert.deepEqual([nativeModels.sup.units,nativeModels.sup.quantityOnly,nativeModels.sup.onSite],[91,6,79]);checks.push('Canonical totals and physical identities unchanged');
 await select('WC09','Pee Panel');await p.locator('[data-item965-key]').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/phone-pee-panel.png'});
 const uploadState=await p.evaluate(()=>{
  window.__captures965=[];window.__sent965=[];window.__orig965={put:photoOutboxPut,send:photoSend,shrink:dropShrink};
  photoOutboxPut=async entry=>{__captures965.push({...entry,blob:{size:entry.blob.size,type:entry.blob.type}});return true;};
  photoSend=async entry=>{__sent965.push(entry.id);return true;};
  window.__delay965=false;dropShrink=async f=>{const result=await __orig965.shrink(f);if(__delay965)await new Promise(resolve=>window.__release965=resolve);return result;};
  return {hasUpload:!!SYNC.backend.upload,photoCount:dropPhotosOf('WC09').length};
 });assert(uploadState.hasUpload);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS2EAAAAASUVORK5CYII=','base64');
 // Capture the selected group before image processing. Switching descriptions cannot move its photo.
 await p.evaluate(()=>__delay965=true);await p.locator('input[data-item965-add]').setInputFiles({name:'quantity-test.png',mimeType:'image/png',buffer:png});
 await p.waitForFunction(()=>typeof __release965==='function');await p.locator('[data-unit925-description]').selectOption({label:'FWF'});await p.evaluate(()=>__release965());await p.waitForFunction(()=>__captures965.length===1);
 let cap=await p.evaluate(()=>__captures965[0]);assert.equal(cap.key,'WC09');assert.equal(cap.unit,JSON.stringify(['quantity-item965','WC09','Pee Panel']));assert.match(cap.title,/Pee Panel/);assert.doesNotMatch(cap.title,/Asset \[/);assert.equal(cap.slot,0);assert.equal(cap.previousId,null);checks.push('Native upload captures Pee Panel scope even when selector changes during image processing');
 // A changed owner record while processing must prevent the outbox entry.
 await select('WC09','Pee Panel');await p.evaluate(()=>{__release965=null;});await p.locator('input[data-item965-add]').setInputFiles({name:'stale.png',mimeType:'image/png',buffer:png});await p.waitForFunction(()=>typeof __release965==='function');
 await p.evaluate(()=>{window.__token965=quantitySubhire964Token;quantitySubhire964Token=()=> 'changed';__release965();});await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>__captures965.length),1);assert.match(await p.locator('[data-item965-key] .item933-status').innerText(),/changed/);await p.evaluate(()=>quantitySubhire964Token=__token965);checks.push('Ownership change after image processing refuses upload');
 // The native physical upload remains exactly per asset.
 await select('WC09','FWF');await p.evaluate(()=>{__delay965=false;});const physicalId=await p.locator('input[data-item933-add]').first().getAttribute('data-item933-add');await p.locator('input[data-item933-add]').first().setInputFiles({name:'physical.png',mimeType:'image/png',buffer:png});await p.waitForFunction(()=>__captures965.length===2);cap=await p.evaluate(()=>__captures965[1]);assert.equal(cap.unit,physicalId);assert.equal(cap.key,'WC09');checks.push('Existing physical photo upload remains attached to its own fleet identity');
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),before);checks.push('Native state byte-for-byte unchanged');
 // Capture the real optional site-note setter through its native document queue.
 await p.exposeFunction('__noteCapture965',async({path:docPath,body})=>{noteWrites.push({path:docPath,body});const [coll,id]=docPath.split('/');(active.docs[coll]||(active.docs[coll]={}))[id]=body;active.version++;active.updated=new Date().toISOString();});
 await p.evaluate(()=>{SYNC.db.doc=path=>({set:body=>window.__noteCapture965({path,body}),delete:()=>Promise.reject(new Error('Deletes forbidden'))});});
 await select('WC09','Pee Panel');await p.locator('article[data-item965-key] details > summary').click();await p.locator('form[data-item965-note] textarea').fill('Test site note: six panels beside gate <test>');await p.locator('form[data-item965-note] button[type=submit]').click();
 await p.waitForFunction(()=>Object.values(SYNC.queue).every(q=>!Object.keys(q).length)&&!Object.keys(SYNC.inflight).length,null,{timeout:30000});
 assert.equal(noteWrites.length,3);assert(noteWrites.every(c=>/^(loads|stamps|by)\//.test(c.path)));assert.equal(noteWrites.filter(c=>c.path.startsWith('loads/')).length,1);
 await p.evaluate(()=>SYNC.db.pull(true));await p.waitForTimeout(200);await select('WC09','FWF');assert.equal(await p.locator('form[data-item965-note]').count(),0);await select('WC09','Pee Panel');
 assert.equal(await p.locator('form[data-item965-note] textarea').inputValue(),'Test site note: six panels beside gate <test>');
 const afterNote=await p.evaluate(()=>({key:ItemPhotos965.noteKey('WC09','Pee Panel'),note:ItemPhotos965.noteRead('WC09','Pee Panel'),other:ItemPhotos965.noteRead('WB01','TL2'),sup:epInventory860().summary,counts:todayWorkSummary848(todayIso()).byId.toilets,units:gcUnits925(assetOf('WC09'))}));
 assert.equal(afterNote.other,null);assert.deepEqual(afterNote.sup,nativeModels.sup);assert.deepEqual(afterNote.counts,nativeModels.counts);assert.deepEqual(afterNote.units,nativeModels.panels);
 const finalState=JSON.parse(await p.evaluate(()=>JSON.stringify(S))),baseState=JSON.parse(before);delete finalState.loads[afterNote.key];delete finalState.stamps['loads/'+afterNote.key];delete finalState.by['loads/'+afterNote.key];assert.equal(finalState.changes,(baseState.changes||0)+1);assert(finalState.saved);delete finalState.changes;delete baseState.changes;delete finalState.saved;delete baseState.saved;if(!('mapKeys' in baseState)){assert.deepEqual(finalState.mapKeys,{});delete finalState.mapKeys;}assert.deepEqual(finalState,baseState);
 checks.push('Item site note persists through native three-document capture and reopen; other items, ownership, quantities and physical units unchanged');
 assert.deepEqual(h.errors,[]);const result={passed:true,candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(candidate)).digest('hex'),fixture:5167,checks,views,nativeModels,captures:await p.evaluate(()=>__captures965),noteWrites,errors:h.errors,counts:h.counts};fs.writeFileSync(out+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,checks,errors:h.errors,counts:h.counts}));
 }finally{await h.browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
