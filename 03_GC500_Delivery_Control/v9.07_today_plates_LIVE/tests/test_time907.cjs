// Author: Andrew Fisher. Offline synthetic records; original native event handlers, no service writes.
// Run under flock /tmp/gc500-browser.lock. PAGE is a current GC500 build or base.
const fs = require('fs'), path = require('path'), {chromium} = require('playwright');
const base = fs.readFileSync(process.env.PAGE, 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../time907.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../time907.css'), 'utf8');
const line = prefix => { const found = base.split('\n').filter(s => s.startsWith(prefix)); if (found.length !== 1) throw Error('Expected one native ' + prefix); return found[0]; };
const between = (a,b) => { if (base.split(a).length !== 2 || base.split(b).length !== 2) throw Error('Native handler anchor changed'); return base.slice(base.indexOf(a),base.indexOf(b)); };
const etaHandler = between("document.addEventListener('change', e => {\n const t = e.target;", '/* Counts for a list of assets, the way the KPIs');
const etaSetter = between('function setEta(key, eta){', 'function setDeliveryNote(key, note){');
const crewHandler = line("document.addEventListener('click',e=>{const button=e.target.closest('[data-crew883-add]");
const crewChange = line("document.addEventListener('change',e=>{if(!e.target.matches('[data-crew883-start]'))return;");
const finish = line('function crew883Finish(start)');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}}), errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.abort());
  await page.setContent('<!doctype html><html><head></head><body><main id="fixture"></main></body></html>');
  await page.addStyleTag({content:':root{--ink:#15282d;--paper:white;--rule:#61747a;--orange:#ff7a24}body{font:16px Arial;margin:16px}label{display:block;margin:12px 0}'+css});
  await page.addScriptTag({content:`
    var S={delivery:{}},calls={save:0,render:0,stamp:0,crew:[]},allowed=true;
    function mayWrite(){return allowed} function isRef(key){return key==='T01'}
    function stampIt(){calls.stamp++} function deliveryEmpty(d){return !Object.keys(d).length}
    function save(){calls.save++} function render(){calls.render++} function LW(){return 'local'}
    function deliveryCard(html){return html} function dayRows(html){return html} function dayCards(html){return html}
    function crew883Editor(html){return html} function crew883SavePlan(day,ref,plan){calls.crew.push({day,ref,plan});return false}
    function flash(){} function assetOf(){return null}
    ${etaSetter}\n${etaHandler}\n${finish}\n${crewHandler}\n${crewChange}
  `});
  await page.addScriptTag({content:source});
  const checks=await page.evaluate(()=>{
   const out=[],ok=(name,pass)=>out.push({name,pass:!!pass}),host=document.getElementById('fixture');
   const input=v=>'<input type="time" step="300" id="eta-T01" data-eta="T01" value="'+v+'" aria-label="Planned arrival">';
   const mount=(v,fn=time907Html)=>{host.innerHTML=fn(input(v));return host.querySelector('select');};
   let s=mount('');
   ok('blank stays unset without choosing 5:00 AM',s.value===''&&s.selectedIndex===0&&s.options[0].text==='To confirm');
   ok('38 half-hour choices from 5:00 AM to 11:30 PM',s.options.length===39&&s.options[1].value==='05:00'&&s.options[1].text==='5:00 AM'&&s.options[38].value==='23:30'&&s.options[38].text==='11:30 PM');
   ok('all offered grid values advance exactly 30 minutes',[...s.options].slice(1).every((o,i)=>o.value===String(Math.floor((300+i*30)/60)).padStart(2,'0')+':'+String((300+i*30)%60).padStart(2,'0')));
   ok('noon is 12:00 PM',s.querySelector('[value="12:00"]').textContent==='12:00 PM');
   ok('mount does not save, stamp or render',!calls.save&&!calls.render&&!calls.stamp&&!calls.crew.length);
   for(const v of ['04:15','00:00','07:17','23:59','05:30']){s=mount(v);ok('preserves saved '+v+' after HTML serialization',s.value===v&&[...s.options].filter(o=>o.value===v).length===1);}
   ok('midnight label is 12:00 AM',time907Label('00:00')==='12:00 AM');
   for(const fn of [deliveryCard,dayRows,dayCards,crew883Editor])ok(fn.name+' wrapper transforms only native input',fn(input('07:17')).includes('<select')&&fn(input('07:17')).includes('value="07:17" selected'));
   const other='<input type="time" data-rsf="start" value="04:00"><input type="time" name="cost-start" value="04:00"><b>Unchanged markup</b>';
   ok('roster, costs and surrounding markup stay untouched',time907Html(other)===other&&time907Html('<p>A</p>'+input('')+'<p>B</p>').startsWith('<p>A</p><select')&&time907Html('<p>A</p>'+input('')+'<p>B</p>').endsWith('</select><p>B</p>'));
   s=mount('07:17');ok('identity and accessible name survive',s.id==='eta-T01'&&s.dataset.eta==='T01'&&s.getAttribute('aria-label')==='Planned arrival');
   s.value='08:30';s.dispatchEvent(new Event('change',{bubbles:true}));
   ok('one selection reaches original ETA setter once',S.delivery.T01.eta==='08:30'&&calls.save===1&&calls.render===1&&calls.stamp===1);
   s.value='';s.dispatchEvent(new Event('change',{bubbles:true}));ok('To confirm clears through native ETA setter',!S.delivery.T01&&calls.save===2);
   allowed=false;s.value='09:30';s.dispatchEvent(new Event('change',{bubbles:true}));ok('native permission guard rejects read-only change',!S.delivery.T01&&calls.save===2);allowed=true;
   host.innerHTML=time907Html('<input type="time" data-eta="T01" value="06:00" disabled data-ro-locked="1">');s=host.querySelector('select');ok('capability disabled flag and lock marker survive',s.disabled&&s.dataset.roLocked==='1');
   document.body.classList.add('viewonly');ok('ETA remains hidden on view-only link',getComputedStyle(s).display==='none');document.body.classList.remove('viewonly');
   host.innerHTML=crew883Editor('<details open class="crew883" data-crew883-day="2026-10-12" data-crew883-ref="T01"><summary>Unloading plan</summary><label>Starts <input type="time" data-crew883-start value="04:15"></label><label>Finishes <input type="time" data-crew883-finish value="04:45"></label><input data-crew883-order value="2"><input data-crew883-location value="Synthetic area"><div data-crew883-people></div><button data-crew883-save>Save crew plan</button></details>');
   const start=host.querySelector('[data-crew883-start]'),end=host.querySelector('[data-crew883-finish]');
   start.dispatchEvent(new Event('change',{bubbles:true}));ok('existing early start keeps native 30-minute finish',end.value==='04:45');
   time907Ensure(start,'07:17');start.value='07:17';start.dispatchEvent(new Event('change',{bubbles:true}));ok('off-grid computed finish option exists before native assignment',end.value==='07:47');
   start.value='09:00';start.dispatchEvent(new Event('change',{bubbles:true}));ok('grid start keeps native 30-minute default',end.value==='09:30');
   end.value='10:00';host.querySelector('[data-crew883-save]').click();ok('native crew save reads selected HH:mm values',calls.crew.length===1&&calls.crew[0].plan.start==='09:00'&&calls.crew[0].plan.finish==='10:00'&&calls.crew[0].day==='2026-10-12'&&calls.crew[0].ref==='T01');
   start.value='23:30';start.dispatchEvent(new Event('change',{bubbles:true}));ok('native midnight boundary stays unset',end.value==='');
   start.value='';start.dispatchEvent(new Event('change',{bubbles:true}));ok('clearing planned start keeps finish unset',end.value==='');
   ok('selection helpers never create additional saves',calls.save===2&&calls.crew.length===1);
   ok('phone planning selects fit their containers',[...host.querySelectorAll('select')].every(e=>e.getBoundingClientRect().right<=innerWidth&&e.scrollWidth<=e.clientWidth+1));
   return out;
  });
  checks.push({name:'no browser errors',pass:!errors.length});
  if(process.env.EVIDENCE_DIR){fs.mkdirSync(process.env.EVIDENCE_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.EVIDENCE_DIR,'time907-result.json'),JSON.stringify({checks,errors},null,2));await page.screenshot({path:path.join(process.env.EVIDENCE_DIR,'time907-phone.png')});}
  checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
