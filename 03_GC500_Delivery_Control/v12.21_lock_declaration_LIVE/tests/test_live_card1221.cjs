// Author: Andrew Fisher. v12.21, read only: the LIVE crew card after the event tracker update, opened the way a crew's phone
// opens it from a printed QR code, at a reference's pump code and clean code on tonight's service night (Sun 25, the final
// night). Only GETs reach the service; anything else is stopped here, and no job is tapped. The card checks a completion
// code's shape only (the service checks the code itself when a job is ticked), so a dummy code is used and no real QR link is
// read or shown. The tracker token comes from the update's private snapshot (RUN) and is never printed.
//   RUN=/private/dir/execute-xxxx [MOB=1] [EVIDENCE=dir] node tests/test_live_card1221.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {chromium} = require('playwright'); const {spawn}=require('node:child_process');
const BRIDGE=path.join(__dirname,'../../v11.73_crew_groups_LIVE/tests/native_bridge1173.py');
function read(url){return new Promise((resolve,reject)=>{const p=spawn('python3',[BRIDGE],{stdio:['pipe','pipe','pipe']});let out='';p.stdout.on('data',b=>out+=b);p.on('close',code=>{try{const r=JSON.parse(out);if(code||!r.ok)throw Error('read bridge failed');resolve({status:r.status,headers:r.headers,body:Buffer.from(r.body,'base64')});}catch(e){reject(Error('read bridge failed'));}});p.stdin.end(JSON.stringify({url,method:'GET',tracker:TOKEN}));})}
const HOST = 'https://gc500-production.up.railway.app', DUMMY = 'aaaaaaaaaaaaaaaa';
const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
const snap = JSON.parse(fs.readFileSync(path.join(process.env.RUN, 'after.json'), 'utf8')), TOKEN = snap.card.token;
const redact = s => String(s).split(TOKEN).join('<token>');
let checks = 0; const check = (v, msg) => { assert(v, redact(msg)); checks++; console.log('ok   ' + redact(msg)); };
/* the card's data (var D = {...} inside its one script), read from the script text */
function cardData(text) { const start = text.indexOf('var D = ') + 8; assert(start > 8, 'crew data marker'); let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < text.length; i++) { const c = text[i]; if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; } else if (c === '"') quoted = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) return JSON.parse(text.slice(start, i + 1)); }
  throw Error('crew data parse'); }

(async () => {
  assert(/^[-_A-Za-z0-9]{16,64}$/.test(TOKEN), 'tracker token from the private snapshot');
  const browser = await chromium.launch({args: ['--no-sandbox'], executablePath: process.env.CHROMIUM_PATH || undefined});
  const stopped = []; let capabilities = [];
  try {
    const ctx = await browser.newContext({viewport: {width: mobile ? 390 : 1280, height: mobile ? 844 : 900}, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'en-AU', timezoneId: 'Australia/Brisbane', serviceWorkers: 'block'});
    await ctx.route('**/*', async route => {
      const r = route.request(), u = new URL(r.url());
      if (r.method() !== 'GET') { stopped.push(r.method() + ' ' + redact(u.pathname)); return route.abort(); }
      if (u.origin === HOST && (u.pathname === '/d/' + TOKEN || u.pathname === '/d/' + TOKEN + '/ticks' || u.pathname.startsWith('/m/'))) {const result=process.env.HTML_FILE && u.pathname === '/d/' + TOKEN ? {contentType:'text/html',body:fs.readFileSync(process.env.HTML_FILE)} : await read(r.url());if(u.pathname==='/d/'+TOKEN+'/ticks')capabilities.push(JSON.parse(result.body.toString()).lock_declarations_version);return route.fulfill(result);}
      return route.abort();
    });
    const at = async (ref, code) => {
      const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(redact(String(e.message).slice(0, 160))));
      await p.goto(HOST + '/d/' + TOKEN + '#r=' + ref + '.' + DUMMY + '~' + code, {waitUntil: 'load', timeout: 60000});
      await p.waitForFunction(() => document.querySelectorAll('.job .jtxt b').length > 0, null, {timeout: 60000});
      await p.waitForFunction(()=>/Live.*updated/.test(document.body.innerText),null,{timeout:60000});
      const r = await p.evaluate(() => ({jobs: [...document.querySelectorAll('.job .jtxt b')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        declaration: [...document.scripts].some(s=>s.textContent.includes('function declareLock1221(')&&s.textContent.includes('I hereby declare that the toilets shown below have been pumped and cleaned, and the doors are locked.')),
        changedNotice: /This card has been changed on the service/.test(document.body.innerText),
        day: (document.body.innerText.match(/(Sun|Sat|Fri|Mon) \d{1,2} 08:00 → (Sun|Sat|Fri|Mon) \d{1,2} 08:00/) || [''])[0],
        script: ([...document.scripts].find(x => x.textContent.includes('var D = ')) || {textContent: ''}).textContent}));
      const D = cardData(r.script); delete r.script;
      r.D = {lockup: D.tasks.lockup, version: D.version, pump: D.groups.pump.tasks, clean: D.groups.clean.tasks, finals: ['fwf', 'access', 'pan16'].map(k => D.plans[k].final.join('+'))};
      if (dir && ref === 'PG01') {
        fs.mkdirSync(dir, {recursive: true});
        await p.addStyleTag({content: 'footer,footer *{filter:blur(6px)}'});
        await p.evaluate(() => { const j = document.querySelector('.job'); if (j) j.scrollIntoView({block: 'center'}); }); await p.waitForTimeout(400);
        await p.screenshot({path: path.join(dir, tag + '-live-card-' + ref + '-' + code + '.png')});
      }
      r.errors = errs; await p.close(); return r;
    };
    const pp = await at('PG01', 'pump'), pc = await at('PG01', 'clean'), ap = await at('WC86', 'pump'), ac = await at('WC86', 'clean'), bc = await at('WC20', 'clean'), tp = await at('WC20', 'pump');
    check([pp,pc,ap,ac,bc,tp].every(r=>r.declaration)&&capabilities.length>=6&&capabilities.every(v=>v===1),'exact declaration and live server capability present on each card');
    check(pp.day === 'Sun 25 08:00 → Mon 26 08:00', 'the live card is on tonight, the final night: ' + pp.day);
    check(pp.D.lockup === 'Locked (doors locked)' && pp.D.finals.every(f => f === 'pump+clean+lockup') && pp.D.pump.join() === 'pump' && /^tracker-data 25 Oct 2026;/.test(pp.D.version), 'the live card carries the new data (Locked physical doors; FWF, accessible, 16-pan final = pump, clean, lock; pump code pump only)');
    check(JSON.stringify(pp.jobs) === JSON.stringify(['Pump out']), 'PG01 pump code tonight: ' + JSON.stringify(pp.jobs));
    check(JSON.stringify(pc.jobs) === JSON.stringify(['Clean & restock', 'Locked (doors locked)']), 'PG01 clean code tonight: ' + JSON.stringify(pc.jobs) + ' (no water)');
    check(JSON.stringify(ap.jobs) === JSON.stringify(['Pump out']) && ac.jobs.includes('Clean & restock') && ac.jobs.includes('Locked (doors locked)') && !ac.jobs.some(j => /Water/.test(j)), 'WC86 accessible: pump ' + JSON.stringify(ap.jobs) + ', clean ' + JSON.stringify(ac.jobs));
    check(bc.jobs.length && bc.jobs.every(j => j === 'Clean & restock') && tp.jobs.length && tp.jobs.every(j => j === 'Pump out'), 'unchanged: WC20 block clean ' + JSON.stringify(bc.jobs) + ', WC20 tank pump ' + JSON.stringify(tp.jobs));
    if(process.env.EXPECT_DIRECTIONS){
      const expected=JSON.parse(fs.readFileSync(process.env.EXPECT_DIRECTIONS,'utf8'));
      const p=await ctx.newPage();
      await p.goto(HOST+'/d/'+TOKEN+'#r='+expected.ref+'.'+DUMMY+'~clean',{waitUntil:'load',timeout:60000});
      await p.waitForFunction(t=>document.body.innerText.includes(t) && /Live.*updated/.test(document.body.innerText),expected.where,{timeout:60000});
      check(await p.locator('.where').filter({hasText:expected.where}).count()>0,'recorded directions visible in crew reference screen');
      if(dir)await p.screenshot({path:path.join(dir,tag+'-directions-private.png'),fullPage:true});
      await p.close();
    }
    if (!process.env.HTML_FILE) check([pp,pc,ap,ac,bc,tp].every(r=>!r.changedNotice),'live cards match the service revision; no reload warning');
    const errs = [pp, pc, ap, ac, bc, tp].flatMap(r => r.errors);
    check(errs.length === 0, 'no card errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
    check(stopped.length === 0, 'GET only: nothing else was even attempted' + (stopped.length ? ' (' + stopped.join(', ') + ')' : ''));
    console.log(JSON.stringify({checks, mobile}));
  } finally { await browser.close(); }
})().catch(e => { console.error('FAIL ' + redact(String(e && e.message).slice(0, 600))); process.exit(1); });
