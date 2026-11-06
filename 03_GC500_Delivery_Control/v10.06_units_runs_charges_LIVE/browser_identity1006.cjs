// Author: Andrew Fisher. Read-only public harness; mutations are captured in this test browser only.
const {open}=require('../toolchain/harness/open_page'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const s=await open({pageFile:process.env.PAGE,mobile:true,W:390,H:844,dpr:1,hash:'#plant'});try{
 const p=s.page;await p.waitForFunction(()=>window.UnitIdentity1006&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,{timeout:120000});
 const result=await p.evaluate(()=>{
  const checks=[],ok=(name,value)=>{checks.push({name,ok:!!value});if(!value)throw Error(name);};
  SYNC.on=false;SYNC.readonly=false;SYNC.level='edit';capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.db={doc:()=>({set:()=>Promise.resolve(),delete:()=>Promise.resolve()})};
  const oldBump=bump;bump=function(){bump.kept=true;};
  openAsset('WC72');
  const body=document.querySelector('#drawer .db');ok('one add asset form',body.querySelectorAll('[data-unit925-form][data-new1006="true"]').length===1);ok('no old number input',!body.querySelector('#numAdd'));ok('no separate sub-hired form',!body.querySelector('[data-f816="sub744"]'));ok('no original units input',!body.querySelector('[data-uform]'));ok('accessories retained',!!body.querySelector('[data-f816="contents"]'));ok('close control retained',!!document.querySelector('#drawer #dclose'));ok('maps retained',!!document.querySelector('#drawer .where816'));
  const form=body.querySelector('[data-unit925-form][data-new1006="true"]');ok('Event Portables preselected',form.elements.owner.value==='event-portables');ok('optional fields collapsed',!form.querySelector('details').open);
  const model=gcModel925(assetOf('WC72'),{loading:false}),coates=model.rows.find(r=>r.owner==='coates'&&r.assetNo==='0699'),ep=model.rows.find(r=>r.owner==='event-portables'&&r.assetNo==='0699');
  const safe=JSON.stringify([S.delivery,S.supplied,S.labour,S.dropPhotos]);
  ok('new duplicate refused',!unit925Save('WC72',{item:'FWF',owner:'Coates',assetNo:'0699'},'','null','').ok);
  ok('legacy subhire duplicate refused',!!subhire744Check('WC72','Event Portables','0699').err);
  const before=JSON.stringify(S);ok('legacy native duplicate refused',unitAdd('WC72',{label:'Sub-hire: Event Portables',asset_no:'0699'})===false);ok('refused native add makes no record change',JSON.stringify(S)===before);
  if(coates&&ep){const r=UnitIdentity1006.remove('WC72',coates.id,UnitIdentity1006.token(coates));ok('typed Coates duplicate archived',r.ok);const rows=gcModel925(assetOf('WC72'),{loading:false}).rows;ok('Event Portables remains physical despite number tombstone',rows.filter(x=>x.physical&&x.assetNo==='0699').length===1&&rows.find(x=>x.physical&&x.assetNo==='0699').owner==='event-portables');ok('Coates duplicate retained in history',rows.some(x=>x.id===coates.id&&x.source==='history'));}
  ok('receipt work and photos unaffected',JSON.stringify([S.delivery,S.supplied,S.labour,S.dropPhotos])===safe);
  openAsset('WC72');ok('remove control shown per active unit',!!document.querySelector('#drawer [data-identity1006-remove]'));ok('one active identity after cleanup',gcModel925(assetOf('WC72'),{loading:false}).rows.filter(r=>r.physical).length===1);
  SYNC.on=true;
  return {checks,sourceVersion:SYNC.version||null,removedInTestOnly:!!coates};
 });
 await p.evaluate(()=>openAsset('WC72'));
 await p.locator('#drawer.on [data-unit925-form][data-new1006="true"]').waitFor({state:'attached'});
 await p.evaluate(()=>{const f=document.querySelector('#drawer [data-unit925-form][data-new1006="true"]');f.closest('details').open=true;f.scrollIntoView({block:'center'});});
 await p.waitForFunction(()=>{const d=document.getElementById('drawer');return d.classList.contains('on')&&Number(getComputedStyle(d).opacity)===1;});
 const colours=await p.locator('#drawer [data-unit925-form][data-new1006="true"] input[name=assetNo]').evaluate(el=>({background:getComputedStyle(el).backgroundColor,colour:getComputedStyle(el).color}));assert.notEqual(colours.background,colours.colour);result.colours=colours;
 await p.screenshot({path:process.env.SHOT||'/workspace/private-gc500-unit1006/identity-phone.png',fullPage:false});
 await p.locator('#drawer [data-unit925-form][data-new1006="true"] input[name=assetNo]').fill('UI-ONLY-1006');
 await p.locator('#drawer [data-unit925-form][data-new1006="true"] button[type=submit]').click();
 const saveChecks=await p.evaluate(()=>{
  const checks=[],ok=(name,value)=>{checks.push({name,ok:!!value});if(!value)throw Error(name);},ref='WC72';
  const row=gcModel925(assetOf(ref),{loading:false}).rows.find(r=>r.assetNo==='UI-ONLY-1006');
  ok('explicit save creates one browser-only number',!!row&&gcModel925(assetOf(ref),{loading:false}).rows.filter(r=>r.assetNo==='UI-ONLY-1006').length===1);
  ok('successful form clears entered number',document.querySelector('[data-unit925-form][data-new1006="true"] input[name=assetNo]').value==='');
  ok('unacknowledged save does not claim shared saved',!UnitIdentity1006.status(ref).startsWith('SAVED'));
  openAsset(ref);ok('save status survives drawer redraw',!!document.querySelector('[data-units925="WC72"] .units925-save-status').textContent);
  const key=row.docKey,id=docIdOf(key);SYNC.last.loads[id]=JSON.stringify({...S.loads[key],_k:key});if(SYNC.queue.loads)delete SYNC.queue.loads[id];if(SYNC.inflight)delete SYNC.inflight['loads/'+id];syncWaiting=()=>0;syncFooter();
  ok('exact shared acknowledgement displays SAVED',document.querySelector('[data-units925="WC72"] .units925-save-status').textContent.startsWith('SAVED'));
  return checks;
 });result.checks.push(...saveChecks);
 assert.equal(s.errors.length,0,s.errors.join('\n'));assert.equal(s.counts.blocked,0);const report={...result,errors:s.errors,requests:s.counts};fs.writeFileSync(process.env.OUT||'/workspace/private-gc500-unit1006/identity-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
