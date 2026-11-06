// Author: Andrew Fisher. Child-overlay navigation tests; service mutations are blocked.
// PAGE=<candidate> EXPECTED_SHA=<hash> MOB=0|1 OUTDIR=<private folder> node tests/navigation994.cjs
// Run under flock /tmp/gc500-browser.lock. Omit PAGE with PUBLIC=1 for actual public verification.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
const {open}=require('../../toolchain/harness/open_page.js');
const mobile=process.env.MOB==='1',isPublic=process.env.PUBLIC==='1';
const pageFile=isPublic?undefined:process.env.PAGE;
const out=process.env.OUTDIR||'/workspace/private-gc500-audit994/navigation-'+(mobile?'phone':'desktop');
fs.mkdirSync(out,{recursive:true});
const evidence={author:'Andrew Fisher',mobile,actualPublic:isPublic,checks:[]};
if(pageFile){evidence.sha256=crypto.createHash('sha256').update(fs.readFileSync(pageFile)).digest('hex');if(process.env.EXPECTED_SHA)assert.equal(evidence.sha256,process.env.EXPECTED_SHA);}
const check=(name,pass,detail)=>{evidence.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});console.log((pass?'PASS ':'FAIL ')+name);};
(async()=>{const h=await open({pageFile,hash:'#today',W:mobile?390:1440,H:mobile?844:960,mobile}),p=h.page;
 const settle=()=>p.waitForTimeout(90);
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
  await p.evaluate(()=>{SYNC.unsub?.forEach(f=>f());SYNC.unsub=[];window.__nav994Before=JSON.stringify(S);window.__nav994Writes=[];window.bump=()=>{__nav994Writes.push('bump');throw Error('Navigation must not save');};});
  check('Navigation extension loaded',await p.locator('#navigation994-script').count()===1);
  await p.evaluate(()=>{state.sheet='MASTER';state.mapMasterSeen=true;go('map');});await settle();
  await p.locator('#stage [data-mfull]').click();
  check('Native map accessible Exit name',await p.locator('#stage [data-mfull]').getAttribute('aria-label')==='Exit full screen');
  for(const kind of ['layer','empty','picker']){
   await p.evaluate(kind=>{const sh=DATA.sheets.find(x=>x.key==='MASTER');window.__nav994Opener=document.querySelector('#stage [data-mfull]');__nav994Opener.focus();if(kind==='layer')layerCallout(sh.markers.find(x=>x.note)||sh.markers[0]);else if(kind==='empty')emptyCallout(sh,[sh.markers[0].label]);else pickMarker([{key:'WC20',label:'WC20'},{key:'WC09',label:'WC09'}],0,0);},kind);await settle();
   check(kind+' has original Close and Back',await p.locator('.mkpick button.close').isVisible()&&await p.locator('.mkpick [data-nav934-back]').isVisible());
   check(kind+' receives keyboard focus',await p.evaluate(()=>document.querySelector('.mkpick').contains(document.activeElement)));
   check(kind+' exit buttons fit phone/desktop',await p.locator('.mkpick button.close,.mkpick [data-nav934-back]').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})));
   if(kind==='layer')await p.screenshot({path:path.join(out,'map-callout.png')});
   if(kind==='layer')await p.keyboard.press('Escape');else if(kind==='empty')await p.locator('.mkpick [data-nav934-back]').click();else await p.locator('.mkpick button.close').click();await settle();
   check(kind+' exits just the child',await p.evaluate(()=>!document.querySelector('.mkpick')&&document.querySelector('#stage').classList.contains('mfull')));
   check(kind+' restores actual map opener',await p.evaluate(()=>document.activeElement===__nav994Opener));
  }
  await p.evaluate(()=>pickMarker([{key:'WC20',label:'WC20'},{key:'WC09',label:'WC09'}],0,0));await settle();
  await p.locator('.mkpick [data-pick="WC20"]').click();await settle();
  check('Native callout selection opens the chosen asset',await p.evaluate(()=>!document.querySelector('.mkpick')&&document.querySelector('#drawer').classList.contains('on')&&state.sel==='WC20'));
  await p.locator('#drawer #dclose').click();await settle();
  check('Native selected-asset Close retains parent map',await p.evaluate(()=>!document.querySelector('#drawer').classList.contains('on')&&document.querySelector('#stage').classList.contains('mfull')));
  await p.keyboard.press('Escape');await settle();
  check('Second Escape exits map fullscreen',await p.evaluate(()=>!document.querySelector('#stage').classList.contains('mfull')));
  check('Native map normal accessible name restored',await p.locator('#stage [data-mfull]').getAttribute('aria-label')==='Full screen');
  await p.evaluate(()=>{const sh=DATA.sheets.find(x=>x.key==='MASTER');layerCallout(sh.markers[0]);go('today');});await settle();
  check('Changing tab closes map child',await p.locator('.mkpick').count()===0);
  await p.evaluate(()=>{showOpen();if(SHOW.playing)showPause();});await settle();
  for(const action of ['Escape','Back','Close']){
   // Local visibility fixture only: exercise the native chooser without changing the chosen backdrop.
   await p.evaluate(()=>{document.getElementById('seTrig').hidden=false;document.getElementById('seTrig').click();});await settle();
   check('Chooser '+action+' has visible Back and native Close',await p.locator('#sePanel [data-nav994-back]').isVisible()&&await p.locator('#sePanel .se-x').isVisible());
   check('Chooser '+action+' reports expanded',await p.locator('#seTrig').getAttribute('aria-expanded')==='true');
   await p.locator('#sePanel [data-nav994-back]').focus();await p.keyboard.press('Shift+Tab');
   check('Chooser '+action+' traps child keyboard focus',await p.evaluate(()=>document.getElementById('sePanel').contains(document.activeElement)));
   if(action==='Escape')await p.screenshot({path:path.join(out,'special-editions.png')});
   if(action==='Escape')await p.keyboard.press('Escape');else if(action==='Back')await p.locator('#sePanel [data-nav994-back]').click();else await p.locator('#sePanel .se-x').click();await settle();
   check('Chooser '+action+' keeps Showcase open',await p.evaluate(()=>SHOW.open&&document.getElementById('sePanel').hidden));
   check('Chooser '+action+' restores trigger focus',await p.evaluate(()=>document.activeElement===document.getElementById('seTrig')));
   check('Chooser '+action+' reports collapsed',await p.locator('#seTrig').getAttribute('aria-expanded')==='false');
  }
  await p.keyboard.press('Escape');await settle();
  check('Second Escape closes Showcase',await p.evaluate(()=>!SHOW.open));
  await p.evaluate(()=>{go('plant');window.__nav994AssetOpener=document.querySelector('#pane-plant button');__nav994AssetOpener.focus();openAsset('WC20');});await settle();await p.locator('#drawer [data-nav934-back]').click();await settle();
  check('Existing asset Back and return focus retained',await p.evaluate(()=>!document.querySelector('#drawer').classList.contains('on')&&document.activeElement===__nav994AssetOpener));
  check('Native shared record unchanged',await p.evaluate(()=>JSON.stringify(S)===__nav994Before));
  check('No operational write attempts',await p.evaluate(()=>__nav994Writes.length===0)&&h.counts.blocked===0);
  check('No browser errors',h.errors.length===0,h.errors);
 }catch(e){evidence.error=e.stack;console.error(e.stack);}finally{evidence.errors=h.errors;evidence.requests=h.counts;fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(evidence,null,2));await h.browser.close();if(evidence.error||evidence.checks.some(x=>!x.pass))process.exitCode=1;}
})();
