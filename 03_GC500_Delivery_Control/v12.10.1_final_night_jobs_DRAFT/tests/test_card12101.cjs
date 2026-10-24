// Author: Andrew Fisher. v12.10.1 (claimed as v12.09.2) crew card, read only: the card bundle on the page (template and data), made into the crew
// card the way the Manage servicing tracker fold makes it, opened at a reference's pump code and clean code on tonight's
// service day (Sun 25, the final night). The FWF pump code shows Pump out alone; the clean code shows Clean & restock and
// Locked; no water; blocks keep Clean & restock, tanks Pump out. The previous page's bundle is opened the same way to show
// what it offered ("Pump out, clean & lock" on either code). The card's service is answered locally (no ticks, the real
// clock); nothing is posted anywhere.
//   PAGE=build/GC500_v12.10.1/GC500_Delivery_Control_hosted.html BEFORE=/path/live_v1210.html [MOB=1] [EVIDENCE=dir] node tests/test_card12101.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {chromium} = require('playwright');
const HOST = 'https://gc500-production.up.railway.app', TOKEN = 'Card12101Test0000000000a';
const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; console.log('ok   ' + msg); };

function bundle(file) {
  const line = fs.readFileSync(file, 'utf8').split('\n').find(l => l.startsWith('var SVC1067_CARD='));
  return JSON.parse(line.slice('var SVC1067_CARD='.length).replace(/;\s*$/, ''));
}
/* as the fold's cardHtml(): the data goes in place of the one placeholder (contact shown as the fold would) */
function cardHtml(b) {
  const data = Object.assign({}, b.data, {contact: b.data.contact && b.data.contact.name ? b.data.contact : {name: 'Servicing contact', phone: '0491 570 006'}});
  assert(b.html.split('/*SVC1067_DATA*/null').length === 2, 'one data slot in the template');
  return b.html.replace('/*SVC1067_DATA*/null', () => JSON.stringify(data));
}
function refsByKind(b) {
  const out = {};
  b.data.areas.forEach(a => a.refs.forEach(r => r.lines.forEach(l => { (out[l.kind] = out[l.kind] || []).push(r.ref); })));
  return out;
}

(async () => {
  const after = bundle(process.env.PAGE), before = bundle(process.env.BEFORE);
  const kinds = refsByKind(after), pick = k => (kinds[k] || [])[0];
  /* a reference with only FWF lines, a block, a tank, an accessible unit */
  const fwfOnly = after.data.areas.flatMap(a => a.refs).find(r => r.lines.length && r.lines.every(l => l.kind === 'fwf')).ref;
  /* blocks and tanks share references (a block with its own waste tank): any reference with a block line and no FWF, accessible or 16-pan */
  const allRefs = after.data.areas.flatMap(a => a.refs), noLock = r => r.lines.every(l => !['fwf', 'access', 'pan16'].includes(l.kind));
  const block = allRefs.find(r => noLock(r) && r.lines.some(l => l.kind === 'block')), tank = allRefs.find(r => noLock(r) && r.lines.some(l => l.kind === 'tank'));
  const access = pick('access');
  const browser = await chromium.launch({args: ['--no-sandbox'], executablePath: process.env.CHROMIUM_PATH || undefined});
  const posts = [];
  try {
    const ctx = await browser.newContext({viewport: {width: mobile ? 390 : 1280, height: mobile ? 844 : 900}, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: 'en-AU', timezoneId: 'Australia/Brisbane', serviceWorkers: 'block'});
    let html = '';
    await ctx.route('**/*', route => {
      const r = route.request(), u = new URL(r.url());
      if (r.method() !== 'GET') { posts.push(r.method() + ' ' + u.pathname); return route.abort(); }
      if (u.origin === HOST && u.pathname === '/d/' + TOKEN) return route.fulfill({contentType: 'text/html; charset=utf-8', body: html});
      if (u.origin === HOST && u.pathname === '/d/' + TOKEN + '/ticks') return route.fulfill({json: {ticks: [], seq: 0, more: false, now: new Date().toISOString(), updated: new Date().toISOString(), crew_groups_version: 1}});
      if (u.origin === HOST && u.pathname.startsWith('/m/')) return route.continue();
      return route.abort();
    });
    const jobsAt = async (b, ref, code) => {
      html = cardHtml(b);
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 160)));
      await p.goto(HOST + '/d/' + TOKEN + '#r=' + ref + '.abcdefghijklmnop' + (code ? '~' + code : ''), {waitUntil: 'load', timeout: 60000});
      await p.waitForTimeout(2500);
      const r = await p.evaluate(() => ({jobs: [...document.querySelectorAll('.job .jtxt b')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        day: (document.body.innerText.match(/(Sun|Sat|Fri|Mon|Tue|Wed|Thu)\w* \d{1,2}( \w+)?/) || [''])[0], rings: document.querySelectorAll('.jobs3 .j3').length}));
      r.errors = errs; r.page = p; return r;
    };
    const shot = async (r, name) => { if (dir) { fs.mkdirSync(dir, {recursive: true}); await r.page.evaluate(() => { const j = document.querySelector('.job'); if (j) j.scrollIntoView({block: 'center'}); }); await r.page.waitForTimeout(400); await r.page.screenshot({path: path.join(dir, tag + '-card-' + name + '.png'), fullPage: false}); } await r.page.close(); };

    /* before: tonight on the previous bundle */
    const bp = await jobsAt(before, fwfOnly, 'pump'); await shot(bp, 'before-' + fwfOnly + '-pump');
    const bc = await jobsAt(before, fwfOnly, 'clean'); await shot(bc, 'before-' + fwfOnly + '-clean');
    check(JSON.stringify(bp.jobs) === JSON.stringify(['Pump out, clean & lock']) && JSON.stringify(bc.jobs) === JSON.stringify(['Pump out, clean & lock']),
      'before (v12.10): tonight ' + fwfOnly + ' offered one combined job on either code: pump ' + JSON.stringify(bp.jobs) + ', clean ' + JSON.stringify(bc.jobs));
    /* after */
    const ap = await jobsAt(after, fwfOnly, 'pump'); await shot(ap, fwfOnly + '-pump');
    const ac = await jobsAt(after, fwfOnly, 'clean'); await shot(ac, fwfOnly + '-clean');
    check(JSON.stringify(ap.jobs) === JSON.stringify(['Pump out']), 'tonight ' + fwfOnly + ' pump code: ' + JSON.stringify(ap.jobs));
    check(JSON.stringify(ac.jobs) === JSON.stringify(['Clean & restock', 'Locked']), 'tonight ' + fwfOnly + ' clean code: ' + JSON.stringify(ac.jobs) + ' (no water)');
    const xp = await jobsAt(after, access, 'pump'); await xp.page.close(); const xc = await jobsAt(after, access, 'clean'); await xc.page.close();
    check(xp.jobs.includes('Pump out') && !xp.jobs.includes('Locked') && xc.jobs.includes('Clean & restock') && xc.jobs.includes('Locked') && !xc.jobs.some(j => /Water/.test(j)), 'accessible ' + access + ': pump ' + JSON.stringify(xp.jobs) + ', clean ' + JSON.stringify(xc.jobs));
    const kc = await jobsAt(after, block.ref, 'clean'); await kc.page.close(); const tp = await jobsAt(after, tank.ref, 'pump'); await tp.page.close();
    check(kc.jobs.length && kc.jobs.every(j => j === 'Clean & restock') && tp.jobs.length && tp.jobs.every(j => j === 'Pump out'), 'unchanged, no lock-up: block ' + block.ref + ' clean code ' + JSON.stringify(kc.jobs) + ', tank ' + tank.ref + ' pump code ' + JSON.stringify(tp.jobs));
    check(ap.rings >= 2 && ac.rings >= 2, 'the card\'s job rings show tonight\'s pump-out and clean (' + ac.rings + ' rings on the clean code)');
    const errs = [bp, bc, ap, ac, xp, xc, kc, tp].flatMap(r => r.errors);
    check(errs.length === 0, 'no card errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
    check(posts.length === 0, 'nothing posted');
    console.log(JSON.stringify({checks, mobile, fwfOnly, access, block: block.ref, tank: tank.ref}));
  } finally { await browser.close(); }
})().catch(e => { console.error('FAIL ' + String(e && e.message).slice(0, 600)); process.exit(1); });
