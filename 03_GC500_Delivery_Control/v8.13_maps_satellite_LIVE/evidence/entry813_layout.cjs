/* Author: Andrew Fisher. Isolated actual HTML/CSS geometry; no imagery, operational records or network. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const {chromium} = require('playwright');
const input = process.argv[2], out = process.argv[3];
if (!input || !out) throw new Error('Usage: entry813_layout.cjs candidate-index.html private-output-directory');
fs.mkdirSync(out, {recursive:true});
const original = fs.readFileSync(input, 'utf8'), checks = [];
const html = original.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace('<body>', '<body class="framed">');
const check = (name, pass, detail) => checks.push({name, pass:!!pass, detail});
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox','--disable-gpu']});
  let requests = 0;
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {requests++;return route.abort();});
    for (const size of [{width:320,height:568},{width:360,height:640},{width:390,height:540},{width:600,height:198},{width:810,height:198},{width:844,height:320},{width:1406,height:198},{width:1406,height:600}]) {
      await page.setViewportSize(size); await page.setContent(html);
      await page.evaluate(() => {
        document.getElementById('loader').hidden = true;
        const b = document.createElement('button'); b.type='button'; b.dataset.mode='3d'; b.setAttribute('aria-label','The circuit in 3D'); b.textContent='3D'; document.querySelector('.modes').appendChild(b);
      });
      const m = await page.evaluate(() => {
        const r = el => {const b=el.getBoundingClientRect(); return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
        const visible = el => !!el.getClientRects().length && getComputedStyle(el).visibility==='visible';
        const header=document.querySelector('header'), main=document.querySelector('main');
        return {bodyWidth:document.documentElement.scrollWidth, viewport:innerWidth, header:r(header), main:r(main), modes:[...document.querySelectorAll('.modes button')].map(r), toolbar:[...document.querySelectorAll('.console button')].map(r), find:r(document.getElementById('navBtn')), sideVisible:visible(document.getElementById('side')), brandVisible:visible(header.querySelector('b')), aboutOpen:document.getElementById('about813').open, findOpen:document.getElementById('findCard').open};
      });
      const p = size.width+'x'+size.height, inside=(r,b) => r.x>=b.x-.5 && r.y>=b.y-.5 && r.right<=b.right+.5 && r.bottom<=b.bottom+.5;
      check(p+' no horizontal page overflow',m.bodyWidth<=size.width,m);
      check(p+' all four view controls fit header',m.modes.length===4 && m.modes.every(r=>inside(r,m.header)),m.modes);
      check(p+' complete toolbar fits map',m.toolbar.every(r=>inside(r,m.main)),m.toolbar);
      check(p+' embedded duplicate brand absent',!m.brandVisible);
      check(p+' Find open and About folded',m.findOpen&&!m.aboutOpen);
      check(p+' full-screen button receives its own pointer',await page.locator('#fullBtn').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}));
      if(size.height<=300&&size.width>=600){
        const directions=await page.locator('#dial button,#sheetBtn').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute('aria-label'),width:r.width,height:r.height,hit:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
        check(p+' all original direction and sheet controls remain reachable44px targets',directions.length===5&&directions.every(d=>d.width>=43.9&&d.height>=43.9&&d.hit),directions);
      }
      if(size.width<=900){
        check(p+' phone main controls at least44px',m.modes.concat(m.toolbar,[m.find]).every(r=>r.width>=43.9&&r.height>=43.9));
        check(p+' closed phone side removed from keyboard visibility',!m.sideVisible);
        await page.evaluate(()=>document.body.classList.add('nav'));
        check(p+' phone side usable when opened',await page.locator('#side').isVisible());
        await page.locator('#about813 > summary').click();
        check(p+' native About fold opens',await page.locator('#about813').evaluate(el=>el.open));
        await page.screenshot({path:path.join(out,p+'-menu.png')});
        await page.evaluate(()=>document.body.classList.remove('nav'));
      }
      await page.locator('#legend').evaluate(el=>{el.classList.add('show');el.innerHTML='<button class="jump" data-closelegend813>Close sources</button><h4>Source</h4><p>PDF SHA-256 '+ '0123456789abcdef'.repeat(4)+'</p>';});
      check(p+' full source checksum fits panel width',await page.locator('#legend').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
      await page.locator('#legend').evaluate(el=>el.classList.remove('show'));
      await page.screenshot({path:path.join(out,p+'-map-shell.png')});
    }
    check('fixture made no network requests',requests===0,{requests});
  } finally {await browser.close();}
  const report={author:'Andrew Fisher',scope:'Isolated rendered HTML/CSS, fourth button inserted with native merge markup; real imagery/state/selection covered by integrated auditor.',candidateSHA256:crypto.createHash('sha256').update(original).digest('hex'),passed:checks.filter(c=>c.pass).length,total:checks.length,checks};
  fs.writeFileSync(path.join(out,'layout_results.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,total:report.total,failures:checks.filter(c=>!c.pass)},null,2));
  if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
