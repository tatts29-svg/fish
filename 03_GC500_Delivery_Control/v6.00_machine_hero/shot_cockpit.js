const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const pg = await b.newPage({viewport: {width: 1280, height: 800}});
  pg.on('pageerror', e => console.log('pageerror', e.message));
  await pg.goto('http://127.0.0.1:8821/index.html', {waitUntil: 'load'});
  await pg.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 300000});
  const views = (process.argv[2] || 'cog').split(',');
  for (const v of views) {
    await pg.evaluate(v => window.__cw.setView(v), v);
    await pg.waitForTimeout(2500);
    if (process.argv[3] === 'run') { await pg.evaluate(() => { const o = window.__cw.operate; o({kind:'switch',id:'IGN'}); o({kind:'switch',id:'FUEL'}); o({kind:'button',id:'START'}); o({kind:'button',id:'RADIO'}); }); await pg.waitForTimeout(4000); await pg.evaluate(() => window.__cw.shiftTo(3)); await pg.waitForTimeout(2500); }
    await pg.screenshot({path: `shot_${v}${process.argv[3] || ''}.jpg`, quality: 85, timeout: 180000});
    console.log('shot', v, await pg.evaluate(() => ({fps: window.__cw.fps, q: window.__cw.quality, cam: window.__cw.camera.position.toArray().map(x => +x.toFixed(2)), tgt: window.__cw.controls.target.toArray().map(x => +x.toFixed(2))})));
  }
  await b.close();
})();
